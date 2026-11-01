import { hasAnnualRules } from '../domain/rules';
import type { GameRun } from '../domain/model';
import { ageOf } from '../content/world';

export const isAnnual = (r: GameRun) => hasAnnualRules(r);
// choices is the authoritative, replayed record. Journal text and seen IDs are not milestones.
export const ageExperienced = (r: GameRun) =>
  r.choices.some((c) => Math.floor(c.month / 12) === ageOf(r));

export function assertAnnual(r: GameRun) {
  if (!isAnnual(r)) return;
  const reached = new Set(r.choices.map((c) => Math.floor(c.month / 12)));
  for (let age = 0; age < ageOf(r); age++) {
    if (!reached.has(age)) throw Error(`Invariant: missing decision at age ${age}`);
  }
  // A single advance processes at most twelve months, including interrupts. No age cap.
  if (r.month > r.actions.filter((a) => a.type === 'advance').length * 12)
    throw Error('Invariant: annual clock exceeds advances');
}
