import { monthlyExpense, currentCareer } from '../src/content/world';
import { describe, it, expect } from 'vitest';
import {
  assetsAdult,
  assetsFunded,
  assetAction,
  assetsUntil,
  assetsStep,
} from '../scripts/living-assets-fixture';
import { createRun, dispatch, replay, manage } from '../src/engine/engine';
import { netWorth, totalDebt } from '../src/engine/finance';
import { assertRun } from '../src/engine/invariants';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
import {
  appraisedValue,
  assetMonthlyCost,
  depositRefund,
  financialValue,
  financingQuote,
  resaleValue,
  settleLivingAssets,
} from '../src/engine/living-assets';
import { pcAssessment, pcPreset } from '../src/content/pc-parts';
import { livingAssetActionSchema } from '../src/domain/living-assets';
import { found } from '../scripts/business-fixture';
import { assetBenefits } from '../src/domain/asset-benefits';
import { storyCapacityReason } from '../src/domain/rules';

const canonicalRun = (r: ReturnType<typeof assetsAdult>) => {
  assertRun(r);
  expect(canonical(replay(r.seed, r.setup, r.actions))).toBe(canonical(r));
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
};
describe('assets-v1: nhà ở và sổ tiền', () => {
  it('không thêm tài sản hoặc đổi luật của một đời stable trước đây', () => {
    const old = createRun('old-assets-isolation', {
      cohort: 1995,
      region: 'northern-village',
      lifeRules: 'stable-v1',
    });
    expect(old.livingAssets).toBeUndefined();
    expect(() =>
      dispatch(old, { type: 'living-assets', operation: 'rent', item: 'rent-room', expected: 0 }),
    ).toThrow();
    canonicalRun(old);
  });
  it('không cho trẻ ký thuê, mua hoặc nhận khoản vay tài sản', () => {
    const child = createRun('asset-child', {
      cohort: 1995,
      region: 'northern-village',
      lifeRules: 'assets-v1',
      currency: 'vnd-v1',
    });
    expect(() => assetAction(child, { operation: 'buy', item: 'bicycle' })).toThrow(/18/);
    expect(child.finance.assets).toHaveLength(0);
    canonicalRun(child);
  });
  it('ghi cọc thành khoản phải thu, giữ tiền thuê riêng với sinh hoạt trừu tượng', () => {
    const before = assetsAdult(),
      r = assetAction(before, { operation: 'rent', item: 'rent-room', locality: 'quiet' });
    expect(r.finance.cash).toBe(before.finance.cash - 1_224_000 - 300_000);
    expect(depositRefund(r)).toBe(1_224_000);
    expect(r.livingAssets!.owned).toHaveLength(0);
    expect(netWorth(r)).toBe(netWorth(before) - 300_000);
    const next = assetsUntil(r, r.month + 12),
      costs = next.finance.transactions.filter(
        (t) => t.id.startsWith('living-month:') && t.id.endsWith(':cost'),
      );
    expect(costs).toHaveLength(12);
    expect(costs.every((t) => t.cash === -(612_000 + 150_000))).toBe(true);
    expect(monthlyExpense(r)).toBe(monthlyExpense(before));
    canonicalRun(next);
  });
  it('rời chỗ thuê hoàn đúng cọc, đổi chỗ không tạo căn nhà sở hữu', () => {
    const r = assetAction(assetsAdult(), { operation: 'rent', item: 'rent-room' });
    const next = assetAction(r, { operation: 'rent', item: 'rent-house', locality: 'quiet' });
    expect(next.livingAssets!.owned).toHaveLength(0);
    expect(next.finance.assets).toHaveLength(1);
    const out = assetAction(next, { operation: 'leave' });
    expect(out.finance.cash).toBe(next.finance.cash + depositRefund(next) - 300_000);
    expect(out.finance.assets).toHaveLength(0);
    expect(out.household.housing).toBe('family');
    canonicalRun(out);
  });
  it('gia hạn không thu lại cọc và không thu thuê hai lần', () => {
    const r = assetAction(assetsAdult(), { operation: 'rent', item: 'rent-room' });
    expect(() => assetAction(r, { operation: 'renew' })).toThrow(/12/);
    const next = assetsUntil(r, r.month + 12),
      renewed = assetAction(next, { operation: 'renew' });
    expect(renewed.finance).toEqual(next.finance);
    expect(renewed.livingAssets!.lease!.reviewMonth).toBe(next.month + 12);
    canonicalRun(renewed);
  });
  it('mua nhà bằng tiền thật, tạo đúng một asset và chỉ mất phí trong net worth', () => {
    const before = assetsFunded(520_000_000),
      r = assetAction(before, { operation: 'buy', item: 'home-rural', locality: 'quiet' });
    expect(r.livingAssets!.owned).toHaveLength(1);
    expect(r.finance.assets[0].value).toBe(497_250_000);
    expect(r.finance.cash).toBe(before.finance.cash - 497_250_000 - 4_972_500 - 300_000);
    expect(netWorth(r)).toBe(netWorth(before) - 5_272_500);
    expect(() => manage(r, 'buy-home')).toThrow(/Đời sống/);
    canonicalRun(r);
  });
  it('chặn thiếu tiền, bối cảnh và thời kỳ sai mà không đổi run gốc', () => {
    const r = assetsAdult(),
      before = canonical(r);
    expect(() => assetAction(r, { operation: 'buy', item: 'home-rural' })).toThrow(/Tiền mặt/);
    expect(() => assetAction(r, { operation: 'buy', item: 'home-flat' })).toThrow(/bối cảnh/);
    expect(() => assetAction(r, { operation: 'buy', item: 'phone-balanced' })).toThrow(/thời kỳ/);
    expect(canonical(r)).toBe(before);
    expect(
      livingAssetActionSchema.safeParse({
        type: 'living-assets',
        operation: 'leave',
        expected: 1,
        item: 'home-rural',
      }).success,
    ).toBe(false);
  });
  it('expected sequence chặn double tap, bán lại lần hai bị từ chối', () => {
    const r = assetsAdult(),
      action = {
        type: 'living-assets' as const,
        operation: 'buy' as const,
        item: 'bicycle',
        expected: r.actions.length,
      };
    const bought = dispatch(r, action);
    expect(() => dispatch(bought, action)).toThrow(/đã đổi/);
    const asset = bought.livingAssets!.owned[0],
      sold = assetAction(bought, { operation: 'sell', assetId: asset.id });
    expect(sold.finance.cash).toBeLessThan(r.finance.cash);
    expect(() => assetAction(sold, { operation: 'sell', assetId: asset.id })).toThrow(/sở hữu/);
    canonicalRun(sold);
  });
  it('bảo dưỡng không miễn phí; sửa không làm tuổi tài sản trở về ngày mua', () => {
    const bought = assetAction(assetsAdult(), { operation: 'buy', item: 'bicycle' });
    const aged = assetsUntil(bought, bought.month + 24),
      a = aged.livingAssets!.owned[0];
    expect(a.condition).toBeLessThan(95);
    expect(financialValue(aged, a.id)).toBeLessThan(a.acquisitionPrice);
    expect(assetMonthlyCost(aged, a)).toBeGreaterThan(0);
    const repaired = assetAction(aged, { operation: 'repair', assetId: a.id }),
      fixed = repaired.livingAssets!.owned[0];
    expect(repaired.finance.cash).toBeLessThan(aged.finance.cash);
    expect(fixed.condition).toBe(100);
    expect(fixed.acquiredMonth).toBe(a.acquiredMonth);
    expect(financialValue(repaired, fixed.id)).toBe(appraisedValue(repaired, fixed));
    expect(() => assetAction(repaired, { operation: 'repair', assetId: a.id })).toThrow();
    canonicalRun(repaired);
  });
  it('tách nợ mua nhà khỏi nợ sinh hoạt, lịch trả chỉ ghi một lần mỗi tháng', () => {
    const before = assetsFunded(520_000_000),
      r = assetAction(before, {
        operation: 'buy',
        item: 'home-rural',
        locality: 'quiet',
        payment: 'loan',
      }),
      loan = r.livingAssets!.loans[0];
    expect(loan.principal).toBe(348_075_000);
    expect(r.finance.liability).toEqual(before.finance.liability);
    expect(totalDebt(r)).toBe(r.finance.liability.principal + loan.principal);
    expect(netWorth(r)).toBe(netWorth(before) - 5_272_500);
    const next = assetsUntil(r, r.month + 12);
    expect(
      next.finance.transactions.filter((t) => t.loanId === loan.id && t.month > r.month),
    ).toHaveLength(12);
    expect(next.livingAssets!.loans[0].principal).toBeLessThan(loan.principal);
    expect(() => settleLivingAssets(structuredClone(next))).toThrow(/đối soát/);
    canonicalRun(next);
  });
  it('bán nhà có nợ phải tất toán, trả trước không âm gốc hoặc nhận tiền hai lần', () => {
    const r = assetAction(assetsFunded(520_000_000), {
      operation: 'buy',
      item: 'home-rural',
      locality: 'quiet',
      payment: 'loan',
    });
    const asset = r.livingAssets!.owned[0],
      loan = r.livingAssets!.loans[0],
      proceeds = resaleValue(r, asset);
    const sold = assetAction(r, { operation: 'sell', assetId: asset.id });
    expect(sold.finance.cash).toBe(r.finance.cash + proceeds - loan.principal);
    expect(sold.livingAssets!.loans[0].status).toBe('paid');
    expect(sold.household.housing).toBe('family');
    canonicalRun(sold);
    const paid = assetAction(r, { operation: 'repay', loanId: loan.id, amount: loan.principal });
    expect(paid.livingAssets!.loans[0].principal).toBe(0);
    expect(() => assetAction(paid, { operation: 'repay', loanId: loan.id, amount: 1 })).toThrow(
      /tất toán/,
    );
    canonicalRun(paid);
  });
  it('không cho vay chỉ vì UI có nút; thu nhập và giới hạn hồ sơ vẫn bắt buộc', () => {
    const r = assetsAdult();
    expect(financingQuote(r, 500_000_000, true).reason).not.toBeNull();
    expect(() => assetAction(r, { operation: 'buy', item: 'home-rural', payment: 'loan' })).toThrow(
      /45%/,
    );
  });
});
describe('assets-v1: khó khăn tài chính và tích hợp', () => {
  it('vốn cửa hàng và tài sản cá nhân có sổ độc lập, cùng đối soát và replay', () => {
    let r = found(assetAction(assetsAdult(), { operation: 'buy', item: 'phone-basic' }), 4_000_000);
    r = assetsUntil(r, r.month + 24);
    expect(r.finance.assets.some((a) => a.id === 'enterprise:0')).toBe(true);
    expect(r.finance.assets.some((a) => a.id === r.livingAssets!.owned[0].id)).toBe(true);
    expect(assetBenefits(r).digital).toBeGreaterThan(0);
    canonicalRun(r);
  });
  it('mất việc khi vay mua nhà: sáu kỳ thiếu dẫn đến bán xử lý, không ghi tiền bán hai lần', () => {
    let r = assetAction(assetsFunded(170_000_000), {
      operation: 'buy',
      item: 'home-rural',
      locality: 'quiet',
      payment: 'loan',
    });
    r = dispatch(r, { type: 'manage', action: 'quit-job' });
    const id = r.livingAssets!.owned[0].id;
    for (
      let i = 0;
      i < 80 && r.status !== 'ended' && r.livingAssets!.loans[0].status === 'active';
      i++
    ) {
      if (currentCareer(r) && !storyCapacityReason(r)) r = manage(r, 'quit-job');
      r =
        r.activeEvent?.id === 'employment-search'
          ? dispatch(r, { type: 'choose', eventId: 'employment-search', choiceId: 'rest' })
          : assetsStep(r);
    }
    expect(r.livingAssets!.owned.some((a) => a.id === id)).toBe(false);
    expect(r.livingAssets!.loans[0].lateMonths).toBeGreaterThanOrEqual(6);
    expect(r.livingAssets!.loans[0].disposedMonth).not.toBeNull();
    expect(r.finance.transactions.filter((t) => t.label.includes('Bán xử lý'))).toHaveLength(1);
    expect(r.household.housing).toBe('family');
    canonicalRun(r);
  });
  it('ví rỗng không được sửa miễn phí hoặc làm mới ngày mua', () => {
    let r = assetAction(assetsAdult(), { operation: 'buy', item: 'phone-basic' });
    const until = r.month + 60;
    for (let i = 0; i < 40 && r.month < until; i++) {
      if (currentCareer(r)) r = manage(r, 'quit-job');
      r = assetsStep(r);
    }
    const a = r.livingAssets!.owned[0],
      before = canonical(r);
    expect(r.finance.cash).toBe(0);
    expect(a.condition).toBeLessThan(95);
    expect(() => assetAction(r, { operation: 'repair', assetId: a.id })).toThrow(/Chưa đủ tiền/);
    expect(canonical(r)).toBe(before);
    canonicalRun(r);
  });
});
describe('assets-v1: công cụ và cấu hình máy', () => {
  it('chặn socket, RAM, kích thước, nguồn và tản nhiệt không phù hợp', () => {
    const parts = pcPreset(2020);
    expect(pcAssessment(parts, 2020).errors).toEqual([]);
    expect(pcAssessment({ ...parts, cpu: 'daily-cpu' }, 2020).errors.join()).toMatch(/socket/);
    expect(pcAssessment({ ...parts, ram: 'daily-ram' }, 2020).errors.join()).toMatch(/RAM/);
    expect(pcAssessment({ ...parts, gpu: 'balanced-gpu-pro' }, 2020).errors.join()).toMatch(
      /dài|Nguồn/,
    );
    expect(pcAssessment({ ...parts, cpu: 'balanced-cpu-pro' }, 2020).errors.join()).toMatch(
      /nhiệt/,
    );
    expect(pcAssessment(parts, 1998).errors.length).toBeGreaterThan(0);
  });
  it('ráp máy trừ tiền, nâng cấp kiểm lại cả cấu hình, một máy vẫn chỉ là một asset', () => {
    const r = assetsUntil(assetsAdult(), 300),
      parts = pcPreset(2020),
      bought = assetAction(r, { operation: 'build', parts });
    expect(bought.finance.cash).toBe(r.finance.cash - pcAssessment(parts, 2020).price);
    const a = bought.livingAssets!.owned[0];
    expect(() =>
      assetAction(bought, {
        operation: 'upgrade',
        assetId: a.id,
        slot: 'gpu',
        item: 'balanced-gpu-pro',
      }),
    ).toThrow();
    let next = assetAction(bought, {
      operation: 'upgrade',
      assetId: a.id,
      slot: 'case',
      item: 'roomy-case',
    });
    next = assetAction(next, {
      operation: 'upgrade',
      assetId: a.id,
      slot: 'psu',
      item: 'strong-psu',
    });
    next = assetAction(next, {
      operation: 'upgrade',
      assetId: a.id,
      slot: 'gpu',
      item: 'balanced-gpu-pro',
    });
    expect(next.livingAssets!.owned).toHaveLength(1);
    expect(next.finance.assets).toHaveLength(1);
    canonicalRun(next);
  });
  it('sở hữu phương tiện không tự cấp điều kiện vận hành, giá bán thấp hơn tiền mua', () => {
    const r = assetAction(assetsAdult(), { operation: 'buy', item: 'motorcycle-basic' });
    expect(r.flags['living-trained-motorcycle']).toBeUndefined();
    const next = assetAction(r, { operation: 'train', item: 'motorcycle' });
    expect(next.flags['living-trained-motorcycle']).toBe(true);
    canonicalRun(next);
    expect(resaleValue(next, next.livingAssets!.owned[0])).toBeLessThan(22_000_000);
  });
  it('quyền sở hữu và khoản vay vẫn đối soát được khi đời đã kết thúc', () => {
    let r = assetAction(assetsAdult(), { operation: 'buy', item: 'bicycle' });
    for (let i = 0; i < 500 && r.status !== 'ended'; i++) {
      if (currentCareer(r) && !storyCapacityReason(r)) r = manage(r, 'quit-job');
      r = assetsStep(r);
    }
    expect(r.status).toBe('ended');
    expect(r.actions.length).toBeLessThanOrEqual(512);
    expect(r.livingAssets!.owned).toHaveLength(1);
    expect(totalDebt(r)).toBeGreaterThan(0);
    canonicalRun(r);
  });
  it('máy trả trước có một quyền sở hữu, khoản vay và lịch trả riêng', () => {
    const before = assetsFunded(60_000_000),
      parts = pcPreset(before.world.year);
    const r = assetAction(before, { operation: 'build', parts, payment: 'loan' });
    expect(r.livingAssets!.loans).toHaveLength(1);
    expect(r.finance.cash).toBe(
      before.finance.cash - Math.ceil(pcAssessment(parts, before.world.year).price / 2),
    );
    const next = assetsUntil(r, r.month + 12);
    expect(next.livingAssets!.loans[0].principal).toBeLessThan(r.livingAssets!.loans[0].principal);
    expect(next.livingAssets!.owned.filter((a) => a.category === 'pc')).toHaveLength(1);
    expect(assetBenefits(next).computing).toBeLessThanOrEqual(6);
    canonicalRun(next);
  });
});
