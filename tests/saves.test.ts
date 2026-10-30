import 'fake-indexeddb/auto';
import { createRun as oldRun } from '../src/legacy/v1/engine/engine';
import { snapshot as oldSnapshot } from '../src/legacy/v1/persistence/saves';
import { describe, expect, it } from 'vitest';
import { advance, createRun, replay } from '../src/engine/engine';
import {
  MAX_SAVE_BYTES,
  listSlots,
  parseSave,
  readSave,
  snapshot,
  writeSave,
} from '../src/persistence/saves';
describe('save boundary', () => {
  it('round trips an active event exactly and replays its RNG', () => {
    const run = advance(createRun('roundtrip'));
    const loaded = parseSave(JSON.stringify(snapshot(run))).run;
    expect(loaded).toEqual(run);
    expect(replay(loaded.seed, loaded.setup, loaded.actions)).toEqual(run);
  });
  it('rejects malformed, oversized, missing, unsupported, and tampered input', () => {
    for (const text of [
      '{bad',
      JSON.stringify({ schemaVersion: 2 }),
      ' '.repeat(MAX_SAVE_BYTES + 1),
    ])
      expect(() => parseSave(text)).toThrow();
    const save = snapshot(createRun('tampered'));
    save.schemaVersion = 99;
    expect(() => parseSave(JSON.stringify(save))).toThrow();
    save.schemaVersion = 4;
    save.run.finance.cash++;
    expect(() => parseSave(JSON.stringify(save))).toThrow(/không khớp/);
    const bad = snapshot(createRun('malicious'));
    bad.run.actions = [{ type: 'choose', eventId: 'not-a-real-event', choiceId: 'x' }];
    expect(() => parseSave(JSON.stringify(bad))).toThrow(/tái hiện/);
  });
  it('migrates the supported internal v1 envelope', () => {
    const s = oldSnapshot(oldRun('legacy'));
    expect(
      parseSave(JSON.stringify({ schemaVersion: 1, savedAt: s.savedAt, snapshot: s.run })),
    ).toEqual(s);
  });
  it('rejects missing state fields, extra executable-looking data, and mismatched content versions', () => {
    const valid = snapshot(createRun('strict-import'));
    const missing = JSON.parse(JSON.stringify(valid));
    delete missing.run.npcs;
    const extra = JSON.parse(JSON.stringify(valid));
    extra.run.code = 'alert(1)';
    const version = JSON.parse(JSON.stringify(valid));
    version.contentVersion = '999';
    for (const value of [missing, extra, version])
      expect(() => parseSave(JSON.stringify(value))).toThrow();
  });
  it('serializes writes and keeps three slots separate from autosave', async () => {
    const run = createRun('slots'),
      next = advance(run);
    await Promise.all([
      writeSave('autosave', run),
      writeSave('autosave', next),
      writeSave('slot-1', run),
    ]);
    expect((await readSave('autosave'))!.run).toEqual(next);
    expect((await readSave('slot-1'))!.run).toEqual(run);
    expect(await readSave('slot-2')).toBeNull();
    expect(await listSlots()).toHaveLength(3);
  });
});
