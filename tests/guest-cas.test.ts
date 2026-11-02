import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, it, expect } from 'vitest';
import { GuestRepository } from '../src/persistence/guest-repository';
import {
  GuestBranchConflict,
  readSave,
  canonical,
  parseSave,
  snapshot,
} from '../src/persistence/saves';
import { createRun, dispatch, activeDefinition, replay } from '../src/engine/engine';
const identity = '00000000-0000-4000-8000-000000000001';
beforeEach(() =>
  Object.defineProperty(globalThis, 'indexedDB', { value: new IDBFactory(), configurable: true }),
);
async function pair() {
  const run = dispatch(
    createRun('guest-cas', {
      cohort: 2005,
      region: 'northern-village',
      lifeRules: 'stable-v1',
      currency: 'vnd-v1',
    }),
    { type: 'advance' },
  );
  const a = new GuestRepository(),
    b = new GuestRepository();
  await a.read('autosave');
  await a.write('autosave', run, identity);
  await b.read('autosave');
  const e = activeDefinition(run)!;
  return {
    a,
    b,
    run,
    left: dispatch(run, { type: 'choose', eventId: e.id, choiceId: e.choices[0].id }),
    right: dispatch(run, { type: 'choose', eventId: e.id, choiceId: e.choices[1].id }),
  };
}
it('atomically rejects a divergent stale tab and preserves both current in-memory branches', async () => {
  const { a, b, left, right } = await pair();
  expect(canonical(left)).not.toBe(canonical(right));
  await a.write('autosave', left, identity);
  await expect(b.write('autosave', right, identity)).rejects.toBeInstanceOf(GuestBranchConflict);
  expect((await readSave('autosave'))!.run).toEqual(left);
  expect(parseSave(JSON.stringify(snapshot(right, identity))).run).toEqual(right);
  expect(replay(right.seed, right.setup, right.actions)).toEqual(right);
});
it('arbitrates simultaneous clients through the IndexedDB transaction', async () => {
  const { a, b, left, right } = await pair();
  const outcomes = await Promise.allSettled([
    a.write('autosave', left, identity),
    b.write('autosave', right, identity),
  ]);
  expect(outcomes.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
  expect(outcomes.filter((x) => x.status === 'rejected')).toHaveLength(1);
  expect((await readSave('autosave'))!.run).toEqual(
    outcomes[0].status === 'fulfilled' ? left : right,
  );
});
it('allows harmless identical autosaves and serial decisions from the same tab', async () => {
  const { a, b, run, left } = await pair();
  await Promise.all([a.write('autosave', run, identity), b.write('autosave', run, identity)]);
  const next = dispatch(left, { type: 'advance' });
  await Promise.all([a.write('autosave', left, identity), a.write('autosave', next, identity)]);
  expect((await readSave('autosave'))!.run).toEqual(next);
});
it('opening another tab preserves savedAt and the original observer', async () => {
  const { a, b, run, left } = await pair();
  const stamp = (await readSave('autosave'))!.savedAt;
  await new Promise((resolve) => setTimeout(resolve, 10));
  await b.write('autosave', run, identity);
  expect((await readSave('autosave'))!.savedAt).toBe(stamp);
  await a.write('autosave', left, identity);
  expect((await readSave('autosave'))!.run).toEqual(left);
});
it('protects a stale new-life overwrite, while a fresh read permits deliberate restore', async () => {
  const { a, b, left, right } = await pair();
  await a.write('autosave', left, identity);
  await expect(
    b.write('autosave', right, '00000000-0000-4000-8000-000000000002'),
  ).rejects.toBeInstanceOf(GuestBranchConflict);
  await b.read('autosave');
  await b.write('autosave', right, '00000000-0000-4000-8000-000000000002');
  expect((await readSave('autosave'))!.run).toEqual(right);
});
it('keeps slots independent and raw reads wait for the same pending writer', async () => {
  const { a, b, left, right } = await pair();
  const pending = a.write('autosave', left, identity);
  expect((await readSave('autosave'))!.run).toEqual(left);
  await pending;
  await b.slots();
  await b.write('slot-1', right, identity);
  expect((await b.read('slot-1'))!.run).toEqual(right);
  expect((await readSave('autosave'))!.run).toEqual(left);
});
