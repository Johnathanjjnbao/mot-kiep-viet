import { academicApplicant, admittedStudent, advanceStudy } from './academic-fixture';
import {
  manage,
  advance,
  choose,
  activeDefinition,
  choiceReason,
  replay,
} from '../src/engine/engine';
import { currentCareer } from '../src/content/world';
import { familyStart, growFamily } from './family-fixture';
import type { CareerId, GameRun } from '../src/domain/model';
import type { ProgramId } from '../src/domain/academics';
export const jobApplicant = (index = 0) => academicApplicant(index, 'career-v1');
export function jobApplication(result: 'accepted' | 'rejected', career: CareerId = 'office') {
  for (let i = 0; i < 100; i++) {
    const before = jobApplicant(i),
      run = manage(before, 'apply-job', career);
    if (run.employment!.applications.at(-1)!.result === result) return { before, run };
  }
  throw Error('No application fixture');
}
export function careerGraduate(program: ProgramId = 'korean') {
  const original = advanceStudy(admittedStudent(program).run, 'project');
  return replay(original.seed, { ...original.setup, lifeRules: 'career-v1' }, original.actions);
}
export function continueJobless(input: GameRun, months: number) {
  let r = input;
  const target = r.month + months;
  for (let i = 0; i < 160 && r.month < target && r.status !== 'ended'; i++) {
    if (!r.activeEvent) r = advance(r);
    else {
      const e = activeDefinition(r)!;
      const options = e.choices.filter((c) => !choiceReason(r, c));
      const option =
        e.id === 'employment-search'
          ? options.find((c) => c.id === 'rest')
          : options.find(
              (c) => !c.effects.some((x) => ['career', 'education', 'social'].includes(x.kind)),
            );
      r = choose(r, e.id, (option ?? options[0]).id);
    }
    if (currentCareer(r)) throw Error('Jobless fixture accidentally accepted work');
  }
  return r;
}
export function jobSwitch(result: 'accepted' | 'rejected') {
  for (let i = 0; i < 100; i++) {
    let before = manage(jobApplicant(i), 'apply-job', 'farm');
    if (!currentCareer(before)) continue;
    before = advance(before);
    for (let j = 0; j < 10 && (before.social?.focus || before.family?.focus); j++) {
      const e = activeDefinition(before)!;
      before = choose(before, e.id, e.choices.find((c) => !choiceReason(before, c))!.id);
    }
    if (currentCareer(before)?.id !== 'farm') continue;
    const run = manage(before, 'apply-job', 'office');
    if (run.employment!.applications.at(-1)!.result === result) return { before, run };
  }
  throw Error('No career-switch fixture');
}
export function naturalLayoff() {
  for (let seed = 0; seed < 30; seed++) {
    let r = manage(jobApplicant(seed), 'apply-job', 'office');
    if (!currentCareer(r)) continue;
    for (let i = 0; i < 120 && r.status !== 'ended'; i++) {
      if (
        r.player.careers.some((c) => c.ending === 'layoff') &&
        !(r.social?.focus || r.family?.focus || r.academics?.focus)
      )
        return r;
      if (!r.activeEvent) r = advance(r);
      else {
        const e = activeDefinition(r)!,
          options = e.choices.filter((c) => !choiceReason(r, c));
        const c =
          e.id === 'career-collapse'
            ? options[0]
            : (options.find(
                (c) => !c.effects.some((x) => x.kind === 'career' || x.kind === 'education'),
              ) ?? options[0]);
        r = choose(r, e.id, c.id);
      }
    }
  }
  throw Error('No natural layoff fixture');
}
export function unemployedParent() {
  let r = growFamily(familyStart('career-v1'), 23);
  for (let i = 0; i < 12 && (r.social?.focus || r.family?.focus); i++) {
    const e = activeDefinition(r)!;
    r = choose(r, e.id, e.choices.find((c) => !choiceReason(r, c))!.id);
  }
  if (currentCareer(r)) r = manage(r, 'quit-job');
  r = continueJobless(r, 6);
  if (!r.family?.children.length) throw Error('No dependent in parent fixture');
  return r;
}
