import {
  createRun,
  activeDefinition,
  choiceReason,
  advance,
  choose,
  manage,
} from '../src/engine/engine';
import { CAREERS, careerReason, currentCareer } from '../src/content/world';
import { married, talk } from './social-fixture';
import type { GameRun, RunSetup } from '../src/domain/model';
import type { ParentingStyle } from '../src/domain/family';
export function familyStart(lifeRules?: RunSetup['lifeRules']) {
  for (let i = 0; i < 1000; i++) {
    const r = createRun('family-life-' + i, {
        expansion: 'family',
        ...(lifeRules ? { lifeRules } : {}),
        cohort: 1995,
        region: 'northern-village',
        wealth: 4,
        family: 'both',
      }),
      p = r.social!.people[0];
    if (
      p.romanticOpen &&
      p.exclusivityOpen &&
      p.marriageOpen &&
      p.wantsChildren &&
      r.social!.people[1].romanticOpen &&
      r.social!.people[1].marriageOpen &&
      r.social!.people[1].exclusivityOpen
    ) {
      const m = married(r);
      return talk(m, 'soc-child-plan', 'friend', 'plan-child');
    }
  }
  throw Error('No family fixture');
}
export function growFamily(input: GameRun, age: number, style: ParentingStyle = 'support') {
  let r = input;
  for (let i = 0; i < 400 && r.status !== 'ended' && (r.month < age * 12 || r.family?.focus); i++) {
    if (
      !currentCareer(r) &&
      r.month >= 216 &&
      r.month < 780 &&
      (!r.employment || !(r.academics?.focus || r.family?.focus || r.social?.focus))
    ) {
      const job = CAREERS.find((j) => !careerReason(r, j.id));
      if (job) r = manage(r, 'apply-job', job.id);
    }
    if (r.activeEvent) {
      const e = activeDefinition(r)!,
        choices = e.choices.filter((c) => !choiceReason(r, c));
      const c = r.family?.focus
        ? (choices.find((c) =>
            c.effects.some((x) => x.kind === 'parenting' && x.style === style),
          ) ?? choices[0])
        : r.social?.focus
          ? (choices.find((c) =>
              c.effects.some((e) => e.kind === 'social' && e.operation === 'listen'),
            ) ?? choices[0])
          : choices[0];
      r = choose(r, e.id, c.id);
    } else r = advance(r);
  }
  return r;
}
export function familyBirth() {
  return growFamily(familyStart(), 21);
}
