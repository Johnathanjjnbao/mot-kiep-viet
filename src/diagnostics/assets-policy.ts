import type { GameRun } from '../domain/model';
import type { LivingAssetAction } from '../domain/living-assets';
import { hasAssetsRules } from '../domain/rules';
import { LIVING_ASSET_CATALOG } from '../content/living-assets';
import { pcPreset } from '../content/pc-parts';
import { dispatch } from '../engine/engine';
import { livingAssetReason } from '../engine/living-assets';

/** Test policy only: every action passes the same command and affordability guards as the UI. */
export function assetsOptional(r: GameRun, policy: number): GameRun | null {
  if (!hasAssetsRules(r) || livingAssetReason(r)) return null;
  const used = r.actions.filter((a) => a.type === 'living-assets');
  if (used.length >= 34) return null;
  const s = r.livingAssets!,
    age = Math.floor(r.month / 12);
  const candidates: Omit<LivingAssetAction, 'type' | 'expected'>[] = [];
  const ever = (operation: string, item?: string) =>
    used.some(
      (a) => a.type === 'living-assets' && a.operation === operation && (!item || a.item === item),
    );
  const owns = (category: string) => s.owned.find((a) => a.category === category);
  if (!s.residence && !ever('rent') && age < 60)
    candidates.push({
      operation: 'rent',
      item: 'rent-room',
      locality: policy % 2 ? 'connected' : 'quiet',
    });
  if (
    !owns('home') &&
    !ever('buy', 'home-rural') &&
    !ever('buy', 'home-flat') &&
    age >= 28 &&
    r.finance.cash > 170_000_000
  ) {
    candidates.push({
      operation: 'buy',
      item: r.setup.environment === 'rural' ? 'home-rural' : 'home-flat',
      locality: 'quiet',
      payment: policy % 2 ? 'cash' : 'loan',
    });
  }
  if (!owns('vehicle') && !ever('buy', 'bicycle'))
    candidates.push({ operation: 'buy', item: 'bicycle' });
  if (!owns('phone') && !ever('buy', 'phone-basic'))
    candidates.push({ operation: 'buy', item: 'phone-basic' });
  if (!owns('laptop') && !ever('buy', 'laptop-basic') && r.finance.cash > 40_000_000)
    candidates.push({ operation: 'buy', item: 'laptop-basic' });
  if (!owns('pc') && !ever('build') && r.finance.cash > 40_000_000)
    candidates.push({
      operation: 'build',
      parts: pcPreset(r.world.year),
      payment: policy === 2 ? 'loan' : 'cash',
    });
  const vehicle = owns('vehicle');
  if (
    vehicle?.catalogId === 'bicycle' &&
    age >= 25 &&
    !ever('buy', 'motorcycle-basic') &&
    r.finance.cash > 80_000_000
  )
    candidates.push({ operation: 'buy', item: 'motorcycle-basic' });
  if (
    owns('vehicle') &&
    !ever('train', 'motorcycle') &&
    s.owned.some((a) => a.catalogId === 'motorcycle-basic')
  )
    candidates.push({ operation: 'train', item: 'motorcycle' });
  if (age >= 35 && !ever('buy', 'car-basic') && r.finance.cash > 600_000_000) {
    if (s.owned.filter((a) => a.category === 'vehicle').length === 2 && vehicle)
      candidates.push({ operation: 'sell', assetId: vehicle.id });
    else
      candidates.push({
        operation: 'buy',
        item: 'car-basic',
        payment: policy % 2 ? 'cash' : 'loan',
      });
  }
  if (s.owned.some((a) => a.catalogId === 'car-basic') && !ever('train', 'car'))
    candidates.push({ operation: 'train', item: 'car' });
  const phone = owns('phone');
  const replacements = used.filter(
    (a) =>
      a.type === 'living-assets' &&
      a.operation === 'buy' &&
      LIVING_ASSET_CATALOG.find((d) => d.id === a.item)?.category === 'phone',
  ).length;
  if (
    phone &&
    r.month - phone.acquiredMonth >= 96 &&
    replacements < 3 &&
    r.finance.cash > 15_000_000
  )
    candidates.push({ operation: 'sell', assetId: phone.id });
  if (!phone && ever('buy', 'phone-basic') && replacements < 3)
    candidates.push({
      operation: 'buy',
      item:
        r.world.year >= 2014
          ? 'phone-balanced'
          : r.world.year >= 2008
            ? 'phone-early-smart'
            : 'phone-feature',
    });
  const pc = owns('pc');
  if (pc?.parts?.cpu === 'balanced-cpu' && r.finance.cash > 30_000_000)
    for (const [slot, item] of [
      ['case', 'roomy-case'],
      ['psu', 'strong-psu'],
      ['gpu', 'balanced-gpu-pro'],
    ] as const)
      if (pc.parts[slot] !== item) {
        candidates.push({ operation: 'upgrade', assetId: pc.id, slot, item });
        break;
      }
  for (const a of s.owned) {
    if (policy % 2 && a.upkeep === 'essential')
      candidates.push({ operation: 'upkeep', assetId: a.id, policy: 'careful' });
    if (
      a.condition < 65 &&
      !used.some(
        (x) => x.type === 'living-assets' && x.operation === 'repair' && x.assetId === a.id,
      )
    )
      candidates.push({ operation: 'repair', assetId: a.id });
  }
  for (const candidate of candidates) {
    const action: LivingAssetAction = {
      type: 'living-assets',
      expected: r.actions.length,
      ...candidate,
    };
    if (!livingAssetReason(r, action)) {
      try {
        return dispatch(r, action);
      } catch (error) {
        // A pending choice may depend on the cash/ownership being changed. The engine-owned
        // clone is rejected; leave the original life untouched and answer its story first.
        if (
          error instanceof Error &&
          error.message ===
            'Hãy giải quyết câu chuyện đang chờ trước khi đổi tài sản. Tiền và tài sản chưa thay đổi.'
        )
          return null;
        throw error;
      }
    }
  }
  return null;
}
