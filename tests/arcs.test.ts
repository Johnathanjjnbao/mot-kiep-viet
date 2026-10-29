import { expect, it } from 'vitest';
import { simulateLife } from '../src/diagnostics/simulation';
import { activeDefinition, advance, choiceReason, choose, replay } from '../src/engine/engine';
import { assertRun } from '../src/engine/invariants';
import { parseSave, snapshot } from '../src/persistence/saves';
import type { GameRun } from '../src/domain/model';
it('completes all three authored arcs with actual decisions over multiple years', () => {
  const completed = new Set<string>();
  for (let i = 0; i < 60 && completed.size < 3; i++) {
    const run = simulateLife(`arc-${i}`, { cohort: 1995, region: 'southern-city' }, 4);
    for (const name of ['business', 'family', 'recovery'])
      if (run.flags[name === 'recovery' ? 'recovery-complete' : `${name}-complete`])
        completed.add(name);
  }
  expect([...completed].sort()).toEqual(['business', 'family', 'recovery']);
});
it('resumes pending delayed effects without duplicate execution or financial settlement', () => {
  let pending: GameRun | undefined;
  simulateLife('pending-effects', { cohort: 1995, region: 'southern-city' }, 4, (run) => {
    if (!pending && run.scheduled.some((s) => !s.executed) && !run.activeEvent)
      pending = structuredClone(run);
  });
  expect(pending).toBeDefined();
  let run = parseSave(JSON.stringify(snapshot(pending!))).run;
  const id = run.scheduled.find((s) => !s.executed)!.id;
  while (run.status !== 'ended' && !run.scheduled.find((s) => s.id === id)!.executed) {
    if (!run.activeEvent) run = advance(run);
    else {
      const e = activeDefinition(run)!,
        c = e.choices.find((c) => !choiceReason(run, c))!;
      run = choose(run, e.id, c.id);
    }
  }
  expect(run.scheduled.filter((s) => s.id === id && s.executed)).toHaveLength(1);
  assertRun(run);
  expect(parseSave(JSON.stringify(snapshot(run))).run).toEqual(run);
  expect(replay(run.seed, run.setup, run.actions)).toEqual(run);
});
