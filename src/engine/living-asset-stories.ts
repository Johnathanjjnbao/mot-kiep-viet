import type { GameRun } from '../domain/model';
import type { LivingStoryOperation, OwnedLivingAsset } from '../domain/living-assets';
import { hasAssetsRules } from '../domain/rules';
import { assetBenefits, canOperateVehicle } from '../domain/asset-benefits';
import { LIVING_SCENE_META } from '../content/living-assets-events';
import { pcAssessment } from '../content/pc-parts';
import {
  appraisedValue,
  assetName,
  depositRefund,
  financialValue,
  livingMonthlyCost,
} from './living-assets';
import { transact } from './finance';

export function livingSceneEligible(r: GameRun, id: string) {
  const meta = LIVING_SCENE_META[id],
    s = r.livingAssets;
  if (!hasAssetsRules(r) || !s || !meta || r.month < 216) return false;
  if (meta.after && (r.seen[meta.after] === undefined || r.month - r.seen[meta.after] < 12))
    return false;
  const homes = s.owned.filter((a) => a.category === 'home'),
    vehicles = s.owned.filter((a) => a.category === 'vehicle'),
    phone = s.owned.find((a) => a.category === 'phone'),
    pc = s.owned.find((a) => a.category === 'pc');
  const computers = s.owned.filter((a) => a.category === 'pc' || a.category === 'laptop');
  switch (meta.context) {
    case 'home-plan':
      return !homes.length && r.month < 480;
    case 'rent-damage':
      return !!s.lease && r.month - s.lease.startMonth >= 12;
    case 'rent-renew':
      return !!s.lease && r.month - s.lease.startMonth >= 24;
    case 'home-owned':
      return homes.length > 0;
    case 'home-repair':
      return homes.some((a) => a.condition < 95);
    case 'home-elderly':
      return homes.length > 0 && r.month >= 780;
    case 'vehicle-plan':
      return !vehicles.length;
    case 'vehicle-owned':
      return vehicles.some((a) => canOperateVehicle(r, a));
    case 'vehicle-worn':
      return vehicles.some((a) => a.condition < 70);
    case 'phone-worn':
      return !!phone && r.month - phone.acquiredMonth >= 60 && phone.condition < 85;
    case 'phone-new':
      return (
        !!phone &&
        r.seen['living-phone-wear'] !== undefined &&
        phone.acquiredMonth > r.seen['living-phone-wear']
      );
    case 'device-elderly':
      return r.month >= 780 && (!!phone || computers.length > 0);
    case 'pc-plan':
      return !pc && r.world.year >= 1995;
    case 'pc-owned':
      return !!pc;
    case 'pc-upgraded':
      return (
        !!pc &&
        r.actions.some(
          (a) => a.type === 'living-assets' && a.operation === 'upgrade' && a.assetId === pc.id,
        )
      );
    case 'stream-worn':
      return (
        computers.some((a) => a.condition < 65) &&
        !!r.creator?.channels.some((c) => c.status === 'active')
      );
    case 'loan-active':
      return s.loans.some((l) => l.status === 'active');
    case 'loan-pressure':
      return s.loans.some(
        (l) =>
          l.principal > 0 &&
          (l.lateMonths > 0 ||
            r.finance.cash + r.finance.savings < Math.ceil(l.original / l.months) * 3),
      );
    case 'loan-history':
      return s.loans.length > 0;
    case 'hardship':
      return s.owned.length > 0 && r.finance.cash < Math.max(1_000_000, livingMonthlyCost(r) * 2);
    case 'long-held':
      return s.owned.some((a) => r.month - a.acquiredMonth >= 240);
    case 'family-space':
      return (
        r.npcs.filter((n) => n.role === 'child' && n.alive && r.world.year - n.birthYear < 18)
          .length >= 2 && assetBenefits(r).space === 0
      );
    case 'relative':
      return (
        vehicles.some((a) => canOperateVehicle(r, a)) &&
        r.npcs.some(
          (n) => ['mother', 'father'].includes(n.id) && n.alive && n.presence !== 'unknown',
        )
      );
    case 'power':
      return !!pc && pcAssessment(pc.parts!, r.world.year).watts >= 200;
    case 'elderly-move':
      return r.month >= 900 && s.residence !== null;
  }
}
function storyAsset(r: GameRun, operation: LivingStoryOperation): OwnedLivingAsset | undefined {
  const category = operation.endsWith('-home')
    ? 'home'
    : operation.endsWith('-vehicle')
      ? 'vehicle'
      : operation.endsWith('-phone')
        ? 'phone'
        : 'computer';
  return r
    .livingAssets!.owned.filter((a) =>
      category === 'computer'
        ? a.category === 'pc' || a.category === 'laptop'
        : a.category === category,
    )
    .sort((a, b) => a.condition - b.condition || a.acquiredMonth - b.acquiredMonth)[0];
}
export function applyLivingAssetStory(r: GameRun, operation: LivingStoryOperation, key: string) {
  const s = r.livingAssets;
  if (!hasAssetsRules(r) || !s || r.month < 216)
    throw Error('Tình huống tài sản không thuộc cuộc đời này.');
  if (operation === 'plan') {
    r.flags['living-budget-prepared'] = true;
    r.lastOutcome = 'Kế hoạch được ghi lại; chưa mua, bán hoặc nhận thêm tiền.';
    return;
  }
  if (operation === 'power-save' || operation === 'power-normal') {
    if (!s.owned.some((a) => a.category === 'pc')) {
      r.lastOutcome = 'Hiện chưa có máy tự ráp để đổi lịch sử dụng; bạn chỉ giữ lại kế hoạch.';
      return;
    }
    r.flags['living-low-power'] = operation === 'power-save';
    r.lastOutcome =
      operation === 'power-save'
        ? 'Máy bàn tính ba giờ dùng mỗi ngày từ tháng sau; phần hỗ trợ công việc cũng giảm.'
        : 'Máy bàn trở lại lịch bốn giờ dùng mỗi ngày từ tháng sau.';
    return;
  }
  if (operation === 'extra-payment') {
    const loan = s.loans.find((l) => l.principal > 0),
      payment = Math.min(loan?.principal ?? 0, 1_000_000, Math.max(0, r.finance.cash - 1_000_000));
    if (!loan || !payment) {
      r.lastOutcome = 'Chưa chuyển thêm tiền gốc; bạn giữ phần tiền mặt cần cho sinh hoạt.';
      return;
    }
    transact(r, key, 'Trả thêm gốc từ quyết định câu chuyện', {
      cash: -payment,
      loanDebt: -payment,
      loanId: loan.id,
    });
    if (!loan.principal) loan.status = 'paid';
    r.lastOutcome = `Bạn thực trả ${payment.toLocaleString('vi-VN')} ₫ vào gốc; sổ tiền không ghi thêm thu nhập.`;
    return;
  }
  if (operation.startsWith('rental-')) {
    const lease = s.lease;
    if (!lease) throw Error('Chưa có hợp đồng thuê để ghi hư hại.');
    const before = depositRefund(r);
    lease.damage = Math.min(
      100,
      lease.damage + (operation === 'rental-diy' ? 10 : operation === 'rental-defer' ? 25 : 20),
    );
    let paid = 0;
    if (operation === 'rental-pay') {
      const cost = Math.max(50_000, Math.floor((lease.deposit * lease.damage) / 200));
      if (r.finance.cash >= cost) {
        paid = cost;
        lease.damage = 0;
      }
    }
    const after = lease.deposit - Math.floor((lease.deposit * lease.damage) / 100);
    if (paid || after !== before)
      transact(
        r,
        key,
        paid ? 'Sửa hư hại nội thất chỗ thuê' : 'Ghi khoản khấu trừ cọc vì hư hại',
        { cash: -paid, assets: after - before },
        [{ id: lease.id, name: 'Tiền cọc thuê nhà', value: after }],
      );
    r.lastOutcome = paid
      ? `Đã chi ${paid.toLocaleString('vi-VN')} ₫ sửa phần đã ghi; cọc có thể hoàn ${after.toLocaleString('vi-VN')} ₫.`
      : `Hư hại đã ghi vào cọc; phần còn có thể hoàn là ${after.toLocaleString('vi-VN')} ₫. Chưa gọi là đã sửa xong.`;
    return;
  }
  const a = storyAsset(r, operation);
  if (!a) {
    r.lastOutcome = 'Bạn chỉ ghi lại việc cần thu xếp; chưa sửa hoặc nhận một tài sản không có.';
    return;
  }
  const before = financialValue(r, a.id);
  let cost = 0;
  if (operation.startsWith('defer-')) a.condition = Math.max(0, a.condition - 5);
  else if (a.condition < 98) {
    const quoted = Math.max(25_000, Math.round(a.acquisitionPrice / 10_000));
    if (r.finance.cash >= quoted) {
      cost = quoted;
      a.condition = Math.min(100, a.condition + 4);
    } else {
      a.condition = Math.min(100, a.condition + 1);
      r.player.stats.stress = Math.min(100, r.player.stats.stress + 2);
    }
  }
  const after = appraisedValue(r, a);
  if (cost || after !== before)
    transact(
      r,
      key,
      'Xử lý tình trạng tài sản từ câu chuyện',
      { cash: -cost, assets: after - before },
      [{ id: a.id, name: assetName(a), value: after }],
    );
  r.lastOutcome = operation.startsWith('defer-')
    ? 'Tình trạng giảm thêm; giá trị trong sổ đã được điều chỉnh.'
    : cost
      ? `Đã chi ${cost.toLocaleString('vi-VN')} ₫ chăm một phần; chưa thay thế đợt sửa lớn.`
      : 'Bạn kiểm tra hoặc tự xử lý một phần nhỏ; không có khoản tiền sửa nào được ghi là đã trả.';
}
