import type { GameRun, RunSetup } from '../domain/model';
import { CAREERS, ageOf, careerReason, currentCareer } from '../content/world';
import {
  activeDefinition,
  advance,
  choiceReason,
  choose,
  createRun,
  manage,
} from '../engine/engine';
import { assertRun } from '../engine/invariants';
import { hashSeed, nextRandom } from '../engine/random';
export function simulateLife(
  seed: string,
  setup: RunSetup,
  policy = 0,
  onStep?: (run: GameRun) => void,
) {
  let run = createRun(seed, setup),
    rng = hashSeed(seed + ':test-policy'),
    steps = 0;
  const random = () => {
    const [n, next] = nextRandom(rng);
    rng = next;
    return n;
  };
  while (run.status !== 'ended' && steps++ < 180) {
    assertRun(run);
    onStep?.(run);
    if (run.activeEvent) {
      const e = activeDefinition(run)!,
        choices = e.choices.filter((c) => !choiceReason(run, c));
      if (!choices.length) throw new Error(`Dead end ${seed}/${e.id}`);
      const preferred =
        policy === 4
          ? choices.find((c) =>
              [
                'invest',
                'review',
                'friendship',
                'support',
                'near',
                'talk',
                'network',
                'course',
                'trade',
              ].includes(c.id),
            )
          : undefined;
      const option = preferred ?? choices[Math.floor(random() * choices.length)];
      run = choose(run, e.id, option.id);
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
      if (ageOf(run) >= 18 && run.finance.cash > 150 && policy === 1)
        run = manage(run, 'save-money');
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
  assertRun(run);
  onStep?.(run);
  if (run.status !== 'ended') throw new Error(`Unbounded life ${seed}`);
  return run;
}
