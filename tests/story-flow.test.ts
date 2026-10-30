import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
  activeDefinition,
  advance,
  choiceReason,
  choose,
  createRun,
  replay,
} from '../src/engine/engine';
import { decisionKey, recentResults, storyAction } from '../src/application/story-flow';
import { parseSave, snapshot, readSave, writeSave } from '../src/persistence/saves';
import { assertRun } from '../src/engine/invariants';
import { archiveLife, listHistory } from '../src/persistence/history';

describe('continuous decisions using unchanged engine actions', () => {
  it('one decision applies exactly the manual choose then advance sequence', () => {
    const before = advance(createRun('one-tap'));
    const event = activeDefinition(before)!;
    const option = event.choices.find((c) => !choiceReason(before, c))!;
    const action = { type: 'choose' as const, eventId: event.id, choiceId: option.id };
    const after = storyAction(before, action, decisionKey(before));
    expect(after).toEqual(advance(choose(before, event.id, option.id)));
    expect(after.choices).toHaveLength(1);
    expect(after.actions.filter((a) => a.type === 'choose')).toHaveLength(1);
    expect(after.activeEvent).not.toBeNull();
    expect(recentResults(after)[0].text).toBe(after.choices[0].outcome);
    expect(before.choices).toHaveLength(0);
  });
  it('rejects missing, duplicate and obsolete tokens including recurring events', () => {
    let run = advance(createRun('stale-decision'));
    const token = decisionKey(run),
      event = activeDefinition(run)!;
    const action = { type: 'choose' as const, eventId: event.id, choiceId: event.choices[0].id };
    expect(storyAction(run, action)).toBe(run);
    run = storyAction(run, action, token);
    expect(storyAction(run, action, token)).toBe(run);
    expect(() => storyAction(run, { ...action, eventId: 'forged' }, decisionKey(run))).toThrow();
  });
  it('keeps scheduled effects, ledger, RNG, outcomes and chronology identical across a complete life', () => {
    let run = storyAction(createRun('continuous-schedule'), { type: 'advance' });
    let scheduled = 0,
      executed = 0;
    for (let i = 0; run.status !== 'ended' && i < 100; i++) {
      const event = activeDefinition(run)!;
      const options = event.choices.filter((c) => !choiceReason(run, c));
      const option =
        options.find((c) => c.effects.some((e) => e.kind === 'schedule')) ?? options[0];
      const selected = choose(run, event.id, option.id);
      const expected = selected.status === 'ended' ? selected : advance(selected);
      run = storyAction(
        run,
        { type: 'choose', eventId: event.id, choiceId: option.id },
        decisionKey(run),
      );
      expect(run).toEqual(expected);
      assertRun(run);
      scheduled = Math.max(scheduled, run.scheduled.length);
      executed = Math.max(executed, run.scheduled.filter((e) => e.executed).length);
    }
    expect(scheduled).toBeGreaterThan(0);
    expect(executed).toBeGreaterThan(0);
    expect(run.status).toBe('ended');
    expect(replay(run.seed, run.setup, run.actions)).toEqual(run);
    expect(parseSave(JSON.stringify(snapshot(run))).run).toEqual(run);
  });
  it('persists the exact next decision and keeps completed history after a new life', async () => {
    let run = storyAction(createRun('continuous-save'), { type: 'advance' });
    const event = activeDefinition(run)!;
    run = storyAction(
      run,
      { type: 'choose', eventId: event.id, choiceId: event.choices[0].id },
      decisionKey(run),
    );
    const id = crypto.randomUUID();
    await writeSave('autosave', run, id);
    expect((await readSave('autosave'))?.run).toEqual(run);
    for (let i = 0; run.status !== 'ended' && i < 100; i++) {
      const e = activeDefinition(run)!;
      run = storyAction(
        run,
        {
          type: 'choose',
          eventId: e.id,
          choiceId: e.choices.find((c) => !choiceReason(run, c))!.id,
        },
        decisionKey(run),
      );
    }
    await archiveLife(run, id);
    await writeSave('autosave', createRun('next-life'), crypto.randomUUID());
    const records = await listHistory();
    expect(records.find((r) => r.id === id)?.save.run).toEqual(run);
  });
  it('keeps financial and administrative actions under explicit player control', () => {
    let run = storyAction(createRun('adult-management'), { type: 'advance' });
    while (run.month < 18 * 12) {
      const event = activeDefinition(run)!;
      run = storyAction(
        run,
        {
          type: 'choose',
          eventId: event.id,
          choiceId: event.choices.find((c) => !choiceReason(run, c))!.id,
        },
        decisionKey(run),
      );
    }
    const next = storyAction(run, { type: 'manage', action: 'borrow' });
    expect(next.month).toBe(run.month);
    expect(next.activeEvent).toEqual(run.activeEvent);
    expect(next.actions.length).toBe(run.actions.length + 1);
    expect(next.actions.at(-1)).toEqual({ type: 'manage', action: 'borrow' });
  });
});
