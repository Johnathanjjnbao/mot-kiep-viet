import type { GameRun } from '../src/domain/model';
import type { ProgramId } from '../src/domain/academics';
import { createRun, advance, choose, activeDefinition, choiceReason } from '../src/engine/engine';
import { admittedStudent } from './academic-fixture';

export const newbornAnnual = (seed = 'annual-browser') =>
  createRun(seed, {
    cohort: 1995,
    region: 'northern-village',
    wealth: 4,
    family: 'both',
    expansion: 'family',
    motherTraits: ['gentle'],
    fatherTraits: ['academic'],
    lifeRules: 'annual-v1',
  });
export function healthyChoice(r: GameRun) {
  const e = activeDefinition(r)!;
  const candidates = e.choices.filter((c) => !choiceReason(r, c));
  const score = (c: (typeof candidates)[number]) =>
    c.effects.reduce(
      (n, x) =>
        n +
        (x.kind === 'habit'
          ? x.amount * 8
          : x.kind === 'stat'
            ? x.stat === 'health'
              ? x.amount * 4
              : x.stat === 'stress'
                ? -x.amount
                : 0
            : 0),
      0,
    );
  return candidates.sort((a, b) => score(b) - score(a))[0];
}
export function annualAssessment(program: ProgramId) {
  let r = admittedStudent(program, 0, 'annual-v1').run;
  for (let i = 0; i < 60 && !r.academics?.focus; i++) {
    if (!r.activeEvent) r = advance(r);
    else r = choose(r, activeDefinition(r)!.id, healthyChoice(r).id);
  }
  if (!r.academics?.focus) throw Error('No annual academic fixture');
  return r;
}
