import { it, expect } from 'vitest';
import { assetsFunded, assetAction, assetsUntil } from '../scripts/living-assets-fixture';
import { pcPreset } from '../src/content/pc-parts';
import { assetBenefits } from '../src/domain/asset-benefits';
import { netWorth } from '../src/engine/finance';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
import { assetsLoanCapacity } from '../scripts/assets-golden-fixture';
it('changing a case does not rejuvenate old CPU/GPU performance', () => {
  let r = assetAction(assetsFunded(520_000_000), { operation: 'build', parts: pcPreset(2020) });
  r = assetsUntil(r, r.month + 24);
  const pc = r.livingAssets!.owned[0],
    before = assetBenefits(r);
  const next = assetAction(r, {
    operation: 'upgrade',
    assetId: pc.id,
    slot: 'case',
    item: 'roomy-case',
  });
  expect(assetBenefits(next).computing).toBe(before.computing);
  expect(assetBenefits(next).gaming).toBe(before.gaming);
  expect(next.livingAssets!.owned[0].partMonths!.cpu).toBe(pc.partMonths!.cpu);
});
it('a very old part cannot recover the value of newer parts when traded in', () => {
  let r = assetAction(assetsFunded(520_000_000), { operation: 'build', parts: pcPreset(2020) });
  r = assetsUntil(r, r.month + 144);
  const id = r.livingAssets!.owned[0].id;
  r = assetAction(r, { operation: 'repair', assetId: id });
  for (const [slot, item] of [
    ['case', 'roomy-case'],
    ['psu', 'strong-psu'],
    ['gpu', 'balanced-gpu-pro'],
  ] as const)
    r = assetAction(r, { operation: 'upgrade', assetId: id, slot, item });
  const before = netWorth(r),
    benefits = assetBenefits(r);
  const next = assetAction(r, {
    operation: 'upgrade',
    assetId: id,
    slot: 'display',
    item: 'future-display',
  });
  expect(netWorth(next)).toBeLessThan(before);
  expect(assetBenefits(next).computing).toBe(benefits.computing);
  expect(canonical(parseSave(JSON.stringify(snapshot(next))).run)).toBe(canonical(next));
});
it('twelve settled loan records stay bounded; a thirteenth financed build is rejected', () => {
  const r = assetsLoanCapacity(),
    before = canonical(r);
  expect(r.livingAssets!.loans).toHaveLength(12);
  expect(r.livingAssets!.loans.every((l) => l.status === 'paid' && l.principal === 0)).toBe(true);
  expect(r.livingAssets!.owned).toHaveLength(0);
  expect(r.livingAssets!.disposed).toBe(12);
  expect(() =>
    assetAction(r, { operation: 'build', parts: pcPreset(2020), payment: 'loan' }),
  ).toThrow(/12 hồ sơ/);
  expect(canonical(r)).toBe(before);
  expect(canonical(parseSave(JSON.stringify(snapshot(r))).run)).toBe(before);
});
