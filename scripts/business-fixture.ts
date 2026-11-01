import type { GameRun, RunSetup } from '../src/domain/model';
import {
  createRun,
  advance,
  choose,
  activeDefinition,
  choiceReason,
  dispatch,
} from '../src/engine/engine';
import { healthyChoice } from './annual-fixture';
export const businessSetup: RunSetup = {
  cohort: 1995,
  region: 'northern-village',
  wealth: 4,
  family: 'both',
  expansion: 'family',
  lifeRules: 'enterprise-v1',
  currency: 'vnd-v1',
  motherTraits: ['gentle'],
  fatherTraits: ['academic'],
};
export const defaultPolicy = { price: 'balanced' as const, marketing: false, reorderTarget: 20 };
export function businessAdult(seed = 'business-canonical') {
  let r = createRun(seed, businessSetup);
  for (let steps = 0; steps < 100 && r.month < 216; steps++)
    r = r.activeEvent ? choose(r, activeDefinition(r)!.id, healthyChoice(r).id) : advance(r);
  if (r.month !== 216) throw Error('Missing adult business fixture');
  return r;
}
export const found = (r: GameRun, capital = 20_000_000) =>
  dispatch(r, {
    type: 'enterprise',
    operation: 'found',
    category: 'clothing',
    capital,
    policy: defaultPolicy,
    expected: r.actions.length,
  });
export function businessStep(r: GameRun) {
  if (!r.activeEvent) return advance(r);
  const e = activeDefinition(r)!;
  const choices = e.choices.filter((c) => !choiceReason(r, c));
  if (choices.length < 4) throw Error(`Business fixture dead end: ${e.id}`);
  const safe = choices.filter(
    (c) =>
      !c.effects.some((x) => x.kind === 'enterprise' && ['close', 'pause'].includes(x.operation)),
  );
  return choose(r, e.id, e.version === 10 ? (safe[0] ?? choices[0]).id : healthyChoice(r).id);
}
