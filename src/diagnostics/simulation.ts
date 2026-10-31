import { socialEligible, requestSocial } from '../engine/social';
import type { GameRun, RunSetup } from '../domain/model';
import { CAREERS, ageOf, careerReason, currentCareer } from '../content/world';
import {
  dispatch,
  activeDefinition,
  advance,
  choiceReason,
  choose,
  createRun,
  manage,
} from '../engine/engine';
import { assertRun } from '../engine/invariants';
import { hashSeed, nextRandom } from '../engine/random';
import { PROGRAMS } from '../content/programs';
import { admissionReason, currentStudy, studyCosts } from '../engine/academics';
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
  while (run.status !== 'ended' && steps++ < (run.family ? 480 : run.social ? 320 : 180)) {
    assertRun(run);
    onStep?.(run);
    if (
      run.academics &&
      !run.activeEvent &&
      !run.academics.focus &&
      !run.social?.focus &&
      !run.family?.focus &&
      ageOf(run) >= 18 &&
      ageOf(run) < 60
    ) {
      const study = currentStudy(run);
      if (
        study?.status === 'paused' &&
        run.finance.cash >= studyCosts(run, study.programId).required + 20 &&
        run.actions.filter((a) => a.type === 'academic').length < 35
      ) {
        if (currentCareer(run)) run = manage(run, 'quit-job');
        run = dispatch(run, {
          type: 'academic',
          operation: 'resume',
          expected: run.actions.length,
        });
        continue;
      }
      if (
        !study &&
        !currentCareer(run) &&
        run.academics.applications.length < 3 &&
        !run.academics.qualifications.length
      ) {
        const programs = PROGRAMS.filter((p) => !admissionReason(run, p.id));
        if (programs.length) {
          run = dispatch(run, {
            type: 'academic',
            operation: 'apply',
            program: programs[Math.floor(random() * programs.length)].id,
            expected: run.actions.length,
          });
          continue;
        }
      }
    }
    if (
      run.social &&
      !run.social.focus &&
      !run.family?.focus &&
      !run.academics?.focus &&
      ageOf(run) >= 18 &&
      run.actions.filter((a) => a.type === 'social').length < (run.family ? 32 : 60)
    ) {
      const ids =
        policy === 3
          ? [
              'soc-meet',
              'soc-listen',
              'soc-book',
              'soc-boundary',
              'soc-date',
              'soc-exclusive',
              'soc-cohabit',
              'soc-proposal',
              'soc-temptation',
              'soc-secret',
              'soc-confession',
              'soc-separate',
              'soc-divorce',
              'soc-new-start',
            ]
          : [
              'soc-meet',
              'soc-listen',
              'soc-book',
              'soc-boundary',
              'soc-date',
              'soc-exclusive',
              'soc-cohabit',
              'soc-proposal',
              'soc-budget',
              'soc-study',
              'soc-child-plan',
              'soc-repair',
            ];
      const candidate = run.social.people
        .flatMap((p) => ids.map((id) => ({ id, npcId: p.npcId })))
        .find((x) => socialEligible(run, x.id, x.npcId, true));
      if (candidate) {
        run = requestSocial(run, {
          type: 'social',
          templateId: candidate.id,
          npcId: candidate.npcId,
          expected: run.actions.length,
        });
        continue;
      }
    }
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
      const academicChoice = run.academics?.focus
        ? choices.find((c) => c.id === ['steady', 'project', 'work', 'rest', 'steady'][policy % 5])
        : undefined;
      const option = academicChoice ?? preferred ?? choices[Math.floor(random() * choices.length)];
      run = choose(run, e.id, option.id);
    } else {
      const clothing = policy % 2 ? 'linen-shirt' : 'sport-top';
      if (
        run.wardrobe &&
        ageOf(run) >= 18 &&
        !run.wardrobe.owned.includes(clothing) &&
        run.finance.cash >= 24
      ) {
        run = dispatch(run, {
          type: 'wardrobe',
          operation: 'buy',
          item: clothing,
          expected: run.actions.length,
        });
        run = dispatch(run, {
          type: 'wardrobe',
          operation: 'equip',
          item: clothing,
          expected: run.actions.length,
        });
      }
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
