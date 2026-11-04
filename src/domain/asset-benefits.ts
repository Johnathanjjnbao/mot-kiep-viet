import type { GameRun } from './model';
import type { OwnedLivingAsset } from './living-assets';
import { hasAssetsRules } from './rules';
import { livingDefinition } from '../content/living-assets';
import { pcAssessment } from '../content/pc-parts';

export function canOperateVehicle(r: GameRun, a: OwnedLivingAsset) {
  if (a.category !== 'vehicle' || a.condition < 15 || r.player.stats.health < 25 || r.month < 216)
    return false;
  if (a.catalogId === 'bicycle') return true;
  return !!r.flags['living-trained-' + (a.catalogId.startsWith('car-') ? 'car' : 'motorcycle')];
}
/** Small supports, never payouts or qualifications. Missing possessions keep all ordinary life routes. */
export function assetBenefits(r: GameRun) {
  const empty = { study: 0, digital: 0, computing: 0, creator: 0, gaming: 0, travel: 0, space: 0 };
  if (!hasAssetsRules(r) || !r.livingAssets || r.month < 216) return empty;
  const s = r.livingAssets;
  let digital = 0,
    computing = 0,
    creator = 0,
    gaming = 0,
    travel = 0;
  for (const a of s.owned) {
    const quality = a.condition / 100;
    if (a.category === 'pc') {
      const pc = pcAssessment(a.parts!, r.world.year);
      const age = (['cpu', 'ram', 'gpu', 'storage'] as const).reduce(
        (n, part) =>
          n +
          Math.max(0.3, 1 - (r.month - a.partMonths![part]) / 240) *
            { cpu: 0.5, ram: 0.1, gpu: 0.3, storage: 0.1 }[part],
        0,
      );
      computing = Math.max(computing, (pc.compute / 15) * quality * age);
      creator = Math.max(creator, (pc.creator / 20) * quality * age);
      gaming = Math.max(gaming, (pc.gaming / 25) * quality * age);
    } else {
      const d = livingDefinition(a.catalogId)!;
      const age = Math.max(0.3, 1 - (r.month - a.acquiredMonth) / 240);
      digital = Math.max(digital, d.digital * quality * age);
      computing = Math.max(computing, d.computing * quality * age);
      if (a.category === 'phone' || a.category === 'laptop')
        creator = Math.max(creator, (d.digital / 2) * quality * age);
      if (canOperateVehicle(r, a)) travel = Math.max(travel, Math.min(3, d.transport));
    }
  }
  digital = Math.max(digital, computing / 2);
  if (r.flags['living-low-power']) {
    computing *= 0.8;
    creator *= 0.8;
    gaming *= 0.8;
  }
  const home = s.owned.find((a) => a.id === s.residence),
    definition = livingDefinition(home?.catalogId ?? s.lease?.catalogId ?? '');
  const people =
    1 +
    r.npcs.filter((n) => n.alive && n.role === 'child' && r.world.year - n.birthYear < 18).length +
    (r.social?.people.some((p) => p.cohabiting) ? 1 : 0);
  const space = people <= (definition?.capacity ?? Math.max(2, r.household.resources + 2)) ? 1 : 0;
  return {
    study: Math.min(4, space + Math.floor(computing / 2)),
    digital: Math.min(6, digital),
    computing: Math.min(6, computing),
    creator: Math.min(5, creator),
    gaming: Math.min(4, gaming),
    travel,
    space,
  };
}
