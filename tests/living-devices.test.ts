import { it, expect } from 'vitest';
import { assetsFunded, assetAction, assetsUntil } from '../scripts/living-assets-fixture';
import { assetBenefits } from '../src/domain/asset-benefits';
import { monthlyIncome } from '../src/content/world';
import { canonical, snapshot, parseSave } from '../src/persistence/saves';
it('phone tiers support digital work within a cap and never create personal or creator income', () => {
  const before = assetsFunded(520_000_000),
    cheap = assetAction(before, { operation: 'buy', item: 'phone-basic' }),
    premium = assetAction(before, { operation: 'buy', item: 'phone-premium' });
  expect(assetBenefits(premium).digital).toBeGreaterThan(assetBenefits(cheap).digital);
  expect(assetBenefits(premium).digital).toBeLessThanOrEqual(6);
  expect(assetBenefits(premium).creator).toBeLessThanOrEqual(5);
  expect(monthlyIncome(premium)).toBe(monthlyIncome(before));
  expect(premium.creator!.channels).toEqual(before.creator!.channels);
  expect(premium.finance.cash).toBe(before.finance.cash - 20_000_000);
  expect(premium.finance.transactions.slice(before.finance.transactions.length)).toHaveLength(1);
  expect(() =>
    assetAction(before, { operation: 'buy', item: 'phone-premium', payment: 'loan' }),
  ).toThrow(/tiền mặt/);
});
it('repair can extend a device without resetting age; replacement removes old ownership', () => {
  let r = assetAction(assetsFunded(520_000_000), { operation: 'buy', item: 'phone-balanced' });
  r = assetsUntil(r, r.month + 24);
  const old = r.livingAssets!.owned[0],
    fixed = assetAction(r, { operation: 'repair', assetId: old.id });
  expect(fixed.livingAssets!.owned[0].acquiredMonth).toBe(old.acquiredMonth);
  expect(assetBenefits(fixed).digital).toBeGreaterThan(assetBenefits(r).digital);
  expect(fixed.finance.cash).toBeLessThan(r.finance.cash);
  r = assetAction(fixed, { operation: 'sell', assetId: old.id });
  r = assetAction(r, { operation: 'buy', item: 'phone-premium' });
  expect(r.livingAssets!.owned).toHaveLength(1);
  expect(r.livingAssets!.owned[0].id).not.toBe(old.id);
  expect(canonical(parseSave(JSON.stringify(snapshot(r))).run)).toBe(canonical(r));
});
it('strict import rejects forged device ownership, money and command fields', () => {
  const r = assetAction(assetsFunded(520_000_000), { operation: 'buy', item: 'phone-premium' });
  for (const kind of ['owner', 'cash', 'command']) {
    const raw = JSON.parse(JSON.stringify(snapshot(r)));
    if (kind === 'owner') raw.run.livingAssets.owned[0].owner = 'player:another-life';
    if (kind === 'cash') raw.run.finance.cash += 1;
    if (kind === 'command') raw.run.actions.at(-1).free = true;
    expect(() => parseSave(JSON.stringify(raw))).toThrow();
  }
  expect(canonical(parseSave(JSON.stringify(snapshot(r))).run)).toBe(canonical(r));
});
