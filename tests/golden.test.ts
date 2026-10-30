import { expect, it } from 'vitest';
import {
  createRun,
  advance,
  activeDefinition,
  choose,
  choiceReason,
} from '../src/legacy/v1/engine/engine';
import { CAREERS, ageOf, careerReason, currentCareer } from '../src/legacy/v1/content/world';
import { manage } from '../src/legacy/v1/engine/engine';
import { nextRandom } from '../src/legacy/v1/engine/random';
function simulateLife(
  seed: string,
  setup: { cohort: 1995; region: 'central-coast' },
  policy: number,
) {
  let run = createRun(seed, setup),
    rng = hashSeed(seed + ':test-policy');
  const random = () => {
    const [n, next] = nextRandom(rng);
    rng = next;
    return n;
  };
  while (run.status !== 'ended') {
    if (run.activeEvent) {
      const e = activeDefinition(run)!,
        cs = e.choices.filter((c) => !choiceReason(run, c));
      run = choose(run, e.id, cs[Math.floor(random() * cs.length)].id);
    } else {
      if (policy !== 3 && ageOf(run) >= 18 && ageOf(run) < 65 && !currentCareer(run)) {
        const jobs = CAREERS.filter((j) => !careerReason(run, j.id));
        if (jobs.length)
          run = manage(run, 'apply-job', jobs[Math.floor(random() * jobs.length)].id);
      }
      if (
        ageOf(run) >= 30 &&
        run.finance.cash > 950 &&
        !run.finance.assets.length &&
        policy % 2 === 0
      )
        run = manage(run, 'buy-home');
      if (
        ageOf(run) >= 18 &&
        run.finance.liability.principal > 0 &&
        run.finance.cash > 80 &&
        policy === 2
      )
        run = manage(run, 'repay');
      run = advance(run);
    }
  }
  return run;
}
import { hashSeed } from '../src/engine/random';
import { parseSave, snapshot } from '../src/persistence/saves';
it('keeps the released engine/content 1.0.0 replay fingerprint stable', () => {
  const run = simulateLife('golden-1995', { cohort: 1995, region: 'central-coast' }, 2);
  expect({
    fingerprint: hashSeed(JSON.stringify(run)),
    month: run.month,
    ending: run.ending,
    choices: run.choices.length,
    cash: run.finance.cash,
  }).toEqual({ fingerprint: 2525264403, month: 876, ending: 'death', choices: 33, cash: 13265 });
  expect(parseSave(JSON.stringify(snapshot(run))).run).toEqual(run);
});
