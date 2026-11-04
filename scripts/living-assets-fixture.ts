import type { GameRun } from '../src/domain/model';
import type { LivingAssetAction } from '../src/domain/living-assets';
import { academicApplicant } from './academic-fixture';
import { healthyChoice } from './annual-fixture';
import { advance, choose, dispatch, activeDefinition, manage } from '../src/engine/engine';
import { currentCareer, careerReason, monthlyIncome } from '../src/content/world';
import { assertRun } from '../src/engine/invariants';

export function clearAssetStory(input: GameRun) {
  let r = input;
  for (let i = 0; i < 20 && r.activeEvent?.id.startsWith('living-'); i++)
    r = choose(r, activeDefinition(r)!.id, healthyChoice(r).id);
  return r;
}
export const assetsAdult = (index = 0) =>
  clearAssetStory(academicApplicant(index, 'assets-v1', 'vnd-v1'));
export function assetsStep(r: GameRun) {
  const next = r.activeEvent ? choose(r, activeDefinition(r)!.id, healthyChoice(r).id) : advance(r);
  assertRun(next);
  return next;
}
export function assetsUntil(input: GameRun, month: number) {
  let r = input;
  for (let i = 0; i < 400 && r.month < month && r.status !== 'ended'; i++) r = assetsStep(r);
  if (r.month < month) throw Error('Asset fixture ended before target month');
  return clearAssetStory(r);
}
export function assetAction(r: GameRun, action: Omit<LivingAssetAction, 'type' | 'expected'>) {
  const next = dispatch(r, { type: 'living-assets', expected: r.actions.length, ...action });
  assertRun(next);
  return next;
}
/** Entirely canonical: no balance, NPC, clock or state editing. */
export function assetsFunded(target = 650_000_000, index = 0) {
  let r = assetsAdult(index);
  for (let i = 0; i < 350 && r.status !== 'ended'; i++) {
    r = clearAssetStory(r);
    if (r.finance.cash >= target && !r.social?.focus && !r.family?.focus && !r.academics?.focus)
      return r;
    if (
      !r.social?.focus &&
      !r.family?.focus &&
      !r.academics?.focus &&
      !r.academics?.studies.some((s) => s.status === 'studying') &&
      r.month < 768
    ) {
      const best = (
        ['tech', 'business', 'office', 'trade', 'service', 'labor', 'farm'] as const
      ).find((c) => !careerReason(r, c));
      if (
        best &&
        (!currentCareer(r) || (monthlyIncome(r) < 5_000_000 && currentCareer(r)!.id !== best))
      ) {
        try {
          r = manage(r, 'apply-job', best);
          assertRun(r);
        } catch {
          /* Story completion and cooldown are honored. */
        }
      }
    }
    r = assetsStep(r);
  }
  throw Error('Canonical asset fixture cannot fund target: ' + r.month + ':' + r.finance.cash);
}
