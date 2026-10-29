import { describe, expect, it } from 'vitest';
import {
  activeDefinition,
  advance,
  choiceReason,
  choose,
  createRun,
  replay,
} from '../src/engine/engine';
import { assertRun } from '../src/engine/invariants';
import { nextRandom } from '../src/engine/random';
import { COHORTS } from '../src/content/world';

describe('vertical slice', () => {
  it('uses a known, reproducible uint32 RNG sequence', () => {
    expect(nextRandom(0)).toEqual([0.26642920868471265, 1831565813]);
  });
  for (const cohort of COHORTS)
    it(`plays a full life for ${cohort} and replays exactly`, () => {
      let run = createRun(`vertical-${cohort}`, { cohort, region: 'southern-city' });
      let steps = 0;
      while (run.status !== 'ended' && steps++ < 100) {
        assertRun(run);
        if (!run.activeEvent) run = advance(run);
        else {
          const event = activeDefinition(run)!;
          const option = event.choices.find((c) => !choiceReason(run, c))!;
          run = choose(run, event.id, option.id);
        }
      }
      assertRun(run);
      expect(run.status).toBe('ended');
      expect(run.choices.length).toBeGreaterThan(20);
      expect(replay(run.seed, run.setup, run.actions)).toEqual(run);
      expect(() => advance(run)).toThrow();
    });
  it('rejects out-of-order choices and prevents skipping an active event', () => {
    const run = advance(createRun('invalid-actions'));
    expect(() => advance(run)).toThrow();
    expect(() => choose(run, 'missing', 'no')).toThrow();
  });
});
