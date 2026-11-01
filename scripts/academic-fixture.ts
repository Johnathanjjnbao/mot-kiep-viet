import {
  createRun,
  advance,
  choose,
  activeDefinition,
  choiceReason,
  dispatch,
  manage,
} from '../src/engine/engine';
import type { GameRun, RunSetup } from '../src/domain/model';
import type { ProgramId, AcademicMethod } from '../src/domain/academics';
import { admissionReason, currentStudy } from '../src/engine/academics';
import { CAREERS, careerReason, currentCareer } from '../src/content/world';
export function academicApplicant(
  index = 0,
  lifeRules:
    'education-v1' | 'career-v1' | 'annual-v1' | 'enterprise-v1' | 'creator-v1' = 'education-v1',
  currency?: RunSetup['currency'],
) {
  let r = createRun('university-' + index, {
    lifeRules,
    ...(currency ? { currency } : {}),
    expansion: 'family',
    cohort: 1995,
    region: 'northern-village',
    wealth: 4,
    family: 'both',
    motherTraits: ['academic'],
    fatherTraits: ['gentle'],
    playerTraits: ['Hay tò mò', 'Kiên trì'],
  });
  for (let i = 0; i < 100 && r.month < 216; i++) {
    if (!r.activeEvent) r = advance(r);
    else {
      const e = activeDefinition(r)!;
      const options = e.choices.filter(
        (c) =>
          !choiceReason(r, c) &&
          !c.effects.some((x) => x.kind === 'career' || x.kind === 'education'),
      );
      options.sort(
        (a, b) =>
          b.effects.reduce(
            (n, x) => n + (x.kind === 'stat' && x.stat === 'knowledge' ? x.amount : 0),
            0,
          ) -
          a.effects.reduce(
            (n, x) => n + (x.kind === 'stat' && x.stat === 'knowledge' ? x.amount : 0),
            0,
          ),
      );
      r = choose(r, e.id, (options[0] ?? e.choices.find((c) => !choiceReason(r, c))!).id);
    }
  }
  if (r.activeEvent?.id === 'edu-direction') r = choose(r, 'edu-direction', 'university');
  return r;
}
export function admittedStudent(
  program: ProgramId,
  start = 0,
  lifeRules:
    'education-v1' | 'career-v1' | 'annual-v1' | 'enterprise-v1' | 'creator-v1' = 'education-v1',
  currency?: RunSetup['currency'],
) {
  for (let i = start; i < start + 100; i++) {
    const before = academicApplicant(i, lifeRules, currency),
      reason = admissionReason(before, program);
    if (reason) continue;
    const run = dispatch(before, {
      type: 'academic',
      operation: 'apply',
      program,
      expected: before.actions.length,
    });
    if (currentStudy(run)) return { before, run };
  }
  throw Error('No admitted fixture for ' + program);
}
export function advanceStudy(input: GameRun, method: AcademicMethod = 'steady', targetYears = 99) {
  let r = input;
  for (
    let i = 0;
    i < 240 &&
    r.status !== 'ended' &&
    currentStudy(r) &&
    currentStudy(r)!.completedYears < targetYears;
    i++
  ) {
    const study = currentStudy(r)!;
    if (study.status === 'paused') {
      if (!currentCareer(r)) {
        const job = CAREERS.find((j) => !careerReason(r, j.id));
        if (!job) throw Error('No recovery job for paused study');
        r = manage(r, 'apply-job', job.id);
      }
      if (r.finance.cash > 150) {
        r = manage(r, 'quit-job');
        r = dispatch(r, { type: 'academic', operation: 'resume', expected: r.actions.length });
      }
    }
    if (r.activeEvent) {
      const e = activeDefinition(r)!;
      const choices = e.choices.filter((c) => !choiceReason(r, c));
      r = choose(
        r,
        e.id,
        (r.academics?.focus
          ? choices.find((c) => c.id === method)
          : choices.find(
              (c) => !c.effects.some((x) => x.kind === 'career' || x.kind === 'education'),
            )
        )?.id ?? choices[0].id,
      );
    } else r = advance(r);
  }
  return r;
}
