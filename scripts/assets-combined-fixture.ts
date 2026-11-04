import type { GameRun } from '../src/domain/model';
import { creativeGraduateParent } from './creative-forced-fixture';
import { assetsStep, assetAction, clearAssetStory } from './living-assets-fixture';
import { dispatch, manage } from '../src/engine/engine';
import { pcPreset } from '../src/content/pc-parts';
import { livingAssetReason } from '../src/engine/living-assets';
import { discretionaryCount, storyCapacityReason } from '../src/domain/rules';
import { found } from './business-fixture';
import { startChannel } from './creator-economy-fixture';
import { businessReason } from '../src/engine/business';
import { creatorReason } from '../src/engine/creator-economy';
export function assetsCombined(index = 0) {
  let r = clearAssetStory(creativeGraduateParent(index, 'assets-v1'));
  const checkpoints: Record<string, GameRun> = { parent: r };
  const act = (a: Parameters<typeof assetAction>[1]) => {
    r = clearAssetStory(r);
    const command = { type: 'living-assets' as const, expected: r.actions.length, ...a };
    const reason = livingAssetReason(r, command);
    if (reason) throw Error('Combined ' + a.operation + ': ' + reason);
    r = assetAction(r, a);
  };
  act({ operation: 'rent', item: 'rent-room', locality: 'quiet' });
  act({ operation: 'rent', item: 'rent-house', locality: 'connected' });
  act({ operation: 'buy', item: 'home-rural', locality: 'quiet', payment: 'loan' });
  act({ operation: 'buy', item: 'bicycle' });
  act({ operation: 'buy', item: 'motorcycle-basic' });
  act({ operation: 'train', item: 'motorcycle' });
  act({
    operation: 'sell',
    assetId: r.livingAssets!.owned.find((a) => a.catalogId === 'bicycle')!.id,
  });
  act({ operation: 'buy', item: 'car-basic' });
  act({ operation: 'train', item: 'car' });
  act({ operation: 'buy', item: 'phone-basic' });
  act({ operation: 'buy', item: 'laptop-balanced' });
  act({ operation: 'build', parts: pcPreset(2020), payment: 'loan' });
  const pc = r.livingAssets!.owned.find((a) => a.category === 'pc')!;
  for (const [slot, item] of [
    ['case', 'roomy-case'],
    ['psu', 'strong-psu'],
    ['gpu', 'balanced-gpu-pro'],
  ] as const)
    act({ operation: 'upgrade', assetId: pc.id, slot, item });
  r = clearAssetStory(r);
  checkpoints.acquired = r;
  for (let i = 0; i < 30 && businessReason(r); i++) r = assetsStep(r);
  r = found(r, 4_000_000);
  for (let i = 0; i < 30 && creatorReason(r); i++) r = assetsStep(r);
  r = startChannel(r, 'youtube', {
    format: 'video',
    rhythm: 'light',
    focus: 'craft',
    niche: 'gaming',
  });
  let swaps = 0,
    changedJob = false,
    firstCapacity: { age: number; actions: number } | null = null;
  for (let i = 0; i < 512 && r.status !== 'ended'; i++) {
    const age = Math.floor(r.month / 12);
    if (
      !storyCapacityReason(r) &&
      discretionaryCount(r) < 120 &&
      !r.social?.focus &&
      !r.family?.focus &&
      !r.academics?.focus
    ) {
      if (!changedJob && age >= 45) {
        r = manage(r, 'quit-job');
        r = manage(r, 'apply-job', 'office');
        changedJob = true;
        continue;
      }
      const phone = r.livingAssets!.owned.find((a) => a.category === 'phone');
      if (swaps < 3 && phone && r.month - phone.acquiredMonth >= 72 && !livingAssetReason(r)) {
        act({ operation: 'sell', assetId: phone.id });
        act({ operation: 'buy', item: swaps % 2 ? 'phone-balanced' : 'phone-premium' });
        swaps++;
        continue;
      }
      const worn = r.livingAssets!.owned.find(
        (a) => a.condition < 60 && r.month - a.lastRepairMonth >= 60,
      );
      if (worn && !livingAssetReason(r)) {
        act({ operation: 'repair', assetId: worn.id });
        continue;
      }
      // Deliberately fill the shared discretionary ceiling after the asset loop, through real transfers.
      if (age >= 65 && (r.finance.cash >= 5_000_000 || r.finance.savings > 0)) {
        r = dispatch(r, {
          type: 'manage',
          action: r.finance.savings ? 'withdraw-money' : 'save-money',
        });
        continue;
      }
    } else if (storyCapacityReason(r) && !firstCapacity)
      firstCapacity = { age, actions: r.actions.length };
    if (r.activeEvent) checkpoints['last-decision'] = r;
    r = assetsStep(r);
  }
  checkpoints.ended = r;
  return { run: r, checkpoints, firstCapacity, swaps, changedJob };
}
