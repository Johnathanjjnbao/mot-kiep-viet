import { it, expect } from 'vitest';
import { assetsFunded, assetsUntil, assetAction } from '../scripts/living-assets-fixture';
import { assetBenefits, canOperateVehicle } from '../src/domain/asset-benefits';
import { canonical, snapshot, parseSave } from '../src/persistence/saves';
import { monthlyIncome } from '../src/content/world';
import { assertRun } from '../src/engine/invariants';
it('car ownership and preparation are separate; bounded travel support does not grant salary', () => {
  const base = assetsFunded(520_000_000),
    owned = assetAction(base, { operation: 'buy', item: 'car-basic' });
  expect(canOperateVehicle(owned, owned.livingAssets!.owned[0])).toBe(false);
  expect(assetBenefits(owned).travel).toBe(0);
  const ready = assetAction(owned, { operation: 'train', item: 'car' });
  expect(canOperateVehicle(ready, ready.livingAssets!.owned[0])).toBe(true);
  expect(assetBenefits(ready).travel).toBe(3);
  expect(monthlyIncome(ready)).toBe(monthlyIncome(base));
  expect(ready.player.careers).toEqual(base.player.careers);
  expect(ready.finance.cash).toBe(base.finance.cash - 420_000_000 - 8_000_000);
  expect(canonical(parseSave(JSON.stringify(snapshot(ready))).run)).toBe(canonical(ready));
});
it('two vehicles incur one aggregated upkeep posting per month, with wear and paid repair', () => {
  let r = assetAction(assetsFunded(520_000_000), { operation: 'buy', item: 'car-basic' });
  r = assetAction(r, { operation: 'buy', item: 'motorcycle-basic' });
  expect(() => assetAction(r, { operation: 'buy', item: 'bicycle' })).toThrow(/cùng loại/);
  const start = r.month;
  r = assetsUntil(r, start + 12);
  const costs = r.finance.transactions.filter(
    (t) => t.id.startsWith('living-month:') && t.id.endsWith(':cost') && t.month > start,
  );
  expect(costs).toHaveLength(12);
  expect(costs.every((t) => t.cash === -2_700_000)).toBe(true);
  const car = r.livingAssets!.owned.find((a) => a.catalogId === 'car-basic')!;
  expect(car.condition).toBeLessThan(95);
  const fixed = assetAction(r, { operation: 'repair', assetId: car.id });
  expect(fixed.finance.cash).toBeLessThan(r.finance.cash);
  expect(fixed.livingAssets!.owned.find((a) => a.id === car.id)!.acquiredMonth).toBe(
    car.acquiredMonth,
  );
  assertRun(fixed);
  expect(canonical(parseSave(JSON.stringify(snapshot(fixed))).run)).toBe(canonical(fixed));
});
it('replacing a vehicle keeps sale history without retaining or selling the old ownership twice', () => {
  let r = assetAction(assetsFunded(520_000_000), { operation: 'buy', item: 'motorcycle-basic' });
  const old = r.livingAssets!.owned[0];
  r = assetAction(r, { operation: 'sell', assetId: old.id });
  r = assetAction(r, { operation: 'buy', item: 'car-basic' });
  expect(r.livingAssets!.disposed).toBe(1);
  expect(r.livingAssets!.owned).toHaveLength(1);
  expect(r.livingAssets!.owned[0].id).not.toBe(old.id);
  expect(
    r.journal.some((j) => j.text.includes('Xe máy')) ||
      r.journal.some((j) => j.text.includes('xe máy')),
  ).toBe(true);
  expect(() => assetAction(r, { operation: 'sell', assetId: old.id })).toThrow(/sở hữu/);
  expect(canonical(parseSave(JSON.stringify(snapshot(r))).run)).toBe(canonical(r));
});
