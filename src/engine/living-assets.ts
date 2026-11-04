import type { GameRun } from '../domain/model';
import { hasAssetsRules, discretionaryCount, storyCapacityReason } from '../domain/rules';
import {
  livingAssetActionSchema,
  PART_SLOTS,
  type LivingAssetAction,
  type OwnedLivingAsset,
  type AssetLoan,
  type PcParts,
} from '../domain/living-assets';
import {
  livingDefinition,
  livingPrice,
  type LivingAssetDefinition,
} from '../content/living-assets';
import { pcAssessment, pcPart } from '../content/pc-parts';
import { monthlyIncome } from '../content/world';
import { transact, mandatoryCost, type FinancialAssetChange } from './finance';

const owner = (r: GameRun) => 'player:' + r.id;
const clamp = (n: number) => Math.max(0, Math.min(100, n));
const amount = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
export const assetName = (a: OwnedLivingAsset) =>
  a.category === 'pc' ? 'Máy tính tự ráp' : livingDefinition(a.catalogId)!.name;
export const financialValue = (r: GameRun, id: string) =>
  r.finance.assets.find((a) => a.id === id)?.value ?? 0;
export const depositRefund = (r: GameRun) =>
  r.livingAssets?.lease ? financialValue(r, r.livingAssets.lease.id) : 0;
export const activeAssetLoan = (r: GameRun, id: string) =>
  r.livingAssets?.loans.find((l) => l.assetId === id && l.status === 'active');
export function initLivingAssets(r: GameRun) {
  if (hasAssetsRules(r))
    r.livingAssets = {
      owned: [],
      loans: [],
      lease: null,
      residence: null,
      sequence: 0,
      disposed: 0,
      settledThrough: 0,
      firsts: [],
    };
}
function note(r: GameRun, title: string, text: string) {
  r.journal.push({
    id: `living:${r.month}:${r.journal.length}`,
    month: r.month,
    title,
    text,
    category: 'finance',
  });
  r.lastOutcome = text;
}
export function pcPartBookValue(r: GameRun, a: OwnedLivingAsset, slot: keyof PcParts) {
  const elapsed = r.month - a.partMonths![slot],
    factor = Math.max(500, 10_000 - elapsed * 90),
    condition = 5_000 + a.condition * 50;
  return Math.floor((((a.partPrices![slot] * factor) / 10_000) * condition) / 10_000);
}
export function appraisedValue(r: GameRun, a: OwnedLivingAsset) {
  const condition = 5_000 + a.condition * 50;
  if (a.category === 'pc')
    return PART_SLOTS.reduce((sum, slot) => sum + pcPartBookValue(r, a, slot), 0);
  const elapsed = r.month - a.acquiredMonth,
    speed = a.category === 'home' ? 4 : a.category === 'vehicle' ? 35 : 110;
  const floor = a.category === 'home' ? 4_000 : a.category === 'vehicle' ? 1_500 : 500;
  return Math.floor(
    (((a.acquisitionPrice * Math.max(floor, 10_000 - elapsed * speed)) / 10_000) * condition) /
      10_000,
  );
}
export const resaleValue = (r: GameRun, a: OwnedLivingAsset) =>
  Math.floor(financialValue(r, a.id) * (a.category === 'home' ? 0.95 : 0.85));
export function assetMonthlyCost(r: GameRun, a: OwnedLivingAsset) {
  if (a.category === 'pc') {
    const pc = pcAssessment(a.parts!, r.world.year);
    return (
      Math.round(((pc.watts * (r.flags['living-low-power'] ? 3 : 4) * 30) / 1000) * 3_000) +
      (a.upkeep === 'careful' ? 140_000 : 90_000)
    );
  }
  const definition = livingDefinition(a.catalogId)!;
  return Math.round(
    definition.monthly * (a.upkeep === 'careful' ? 1.25 : 1) * (a.condition < 25 ? 1.2 : 1),
  );
}
export function livingMonthlyCost(r: GameRun) {
  const s = r.livingAssets;
  if (!s) return 0;
  const rental = s.lease ? s.lease.rent + livingDefinition(s.lease.catalogId)!.monthly : 0;
  return rental + s.owned.reduce((sum, a) => sum + assetMonthlyCost(r, a), 0);
}
export const loanInstallment = (loan: AssetLoan) =>
  Math.min(loan.principal, Math.ceil(loan.original / loan.months)) +
  Math.ceil((loan.principal * loan.rateBps) / 10_000);
export function financingQuote(r: GameRun, price: number, home: boolean) {
  const down = Math.ceil(price * (home ? 0.3 : 0.5)),
    principal = price - down;
  const months = home ? 240 : 24,
    rateBps = home ? 35 : 60;
  const monthly = Math.ceil(principal / months) + Math.ceil((principal * rateBps) / 10_000);
  const current =
    (r.livingAssets?.loans.reduce((sum, l) => sum + (l.principal ? loanInstallment(l) : 0), 0) ??
      0) + Math.ceil(r.finance.liability.principal * 0.004);
  const income = monthlyIncome(r) + (r.month >= 780 ? 800_000 : 0);
  let reason: string | null = null;
  if ((r.livingAssets?.loans.length ?? 0) >= 12)
    reason = 'Đã dùng hết 12 hồ sơ vay mua tài sản trong đời.';
  else if (current + monthly > Math.floor(income * 0.45))
    reason =
      'Khoản trả dự kiến vượt 45% thu nhập nghề và trợ cấp thiết kế; cần tăng trả trước bằng cách mua tài sản rẻ hơn hoặc trả tiền mặt.';
  return { down, principal, months, rateBps, monthly, reason };
}
function definitionReason(r: GameRun, d: LivingAssetDefinition | undefined, renting: boolean) {
  if (!d || (d.mode === 'rent') !== renting) return 'Không có lựa chọn tài sản này.';
  if (r.world.year < d.from) return 'Lựa chọn này chưa xuất hiện trong thời kỳ mô phỏng.';
  if (d.environment !== 'any' && d.environment !== r.setup.environment)
    return 'Loại nhà này không thuộc bối cảnh đô thị/nông thôn hiện tại.';
  return null;
}
export function livingAssetReason(r: GameRun, action?: LivingAssetAction): string | null {
  if (!hasAssetsRules(r) || !r.livingAssets) return 'Cuộc đời này giữ nguyên hệ tài sản trước đây.';
  if (r.status !== 'playing' || r.month < 216)
    return 'Từ 18 tuổi mới ký hợp đồng và mua tài sản cá nhân; chỗ ở tuổi nhỏ thuộc hộ gia đình.';
  if (discretionaryCount(r) >= 120)
    return 'Đã dùng đủ 120 lượt chủ động; chi phí và tài sản vẫn được xử lý khi tiếp tục câu chuyện.';
  const capacity = storyCapacityReason(r);
  if (capacity) return capacity;
  if (r.activeEvent?.id.startsWith('living-'))
    return 'Hãy giải quyết tình huống tài sản đang chờ rồi trở lại lựa chọn này.';
  if (r.social?.focus || r.family?.focus || r.academics?.focus)
    return 'Hãy hoàn tất cuộc trò chuyện hoặc kỳ đánh giá đang chờ.';
  if (!action) return null;
  if (!livingAssetActionSchema.safeParse(action).success)
    return 'Dữ liệu thao tác tài sản không hợp lệ.';
  if (action.expected !== r.actions.length)
    return 'Cuộc đời đã đổi sau khi mở xác nhận; hãy xem lại giá và thử lại.';
  const s = r.livingAssets,
    a = s.owned.find((x) => x.id === action.assetId);
  if (['sell', 'move', 'repair', 'upgrade', 'upkeep'].includes(action.operation) && !a)
    return 'Bạn không sở hữu tài sản đã chọn.';
  if (action.operation === 'rent' || action.operation === 'buy') {
    const d = livingDefinition(action.item!),
      reason = definitionReason(r, d, action.operation === 'rent');
    if (reason) return reason;
    const locality = action.locality ?? 'connected',
      price = livingPrice(r, d!, locality),
      moving = d!.category === 'home' ? 300_000 : 0;
    const refund = d!.category === 'home' ? depositRefund(r) : 0;
    if (action.operation === 'rent')
      return r.finance.cash + refund < price * 2 + moving
        ? 'Cần đủ tiền mặt cho hai tháng cọc và chi phí chuyển chỗ.'
        : null;
    const maximum = d!.category === 'home' || d!.category === 'vehicle' ? 2 : 1;
    if (s.owned.length >= 8 || s.owned.filter((x) => x.category === d!.category).length >= maximum)
      return 'Hãy bán hoặc khép tài sản cùng loại trước khi mua thêm.';
    const quote = financingQuote(r, price, d!.category === 'home');
    if (action.payment === 'loan' && d!.category === 'phone')
      return 'Điện thoại trong đợt này chỉ mua bằng tiền mặt.';
    if (action.payment === 'loan' && quote.reason) return quote.reason;
    const cost =
      (action.payment === 'loan' ? quote.down : price) +
      moving +
      (d!.category === 'home' ? Math.round(price / 100) : 0);
    return r.finance.cash + refund < cost
      ? 'Tiền mặt chưa đủ cho tiền mua/trả trước và các phí đã hiển thị.'
      : null;
  }
  if (action.operation === 'repair-rental')
    return !s.lease || !s.lease.damage
      ? 'Chỗ thuê chưa có hư hại cần sửa.'
      : r.finance.cash < Math.max(50_000, Math.floor((s.lease.deposit * s.lease.damage) / 200))
        ? 'Chưa đủ tiền sửa phần hư hại của chỗ thuê.'
        : null;
  if (action.operation === 'renew')
    return !s.lease
      ? 'Bạn chưa thuê nhà.'
      : r.month - s.lease.lastRenewMonth < 12
        ? 'Hợp đồng đang giữ giá; chưa cần gia hạn chủ động trước 12 tháng.'
        : null;
  if (action.operation === 'leave')
    return !s.residence
      ? 'Bạn đang ở cùng gia đình hoặc ở nhờ.'
      : r.finance.cash + depositRefund(r) < 300_000
        ? 'Cần 300.000 ₫ chuyển chỗ sau khi hoàn cọc.'
        : null;
  if (action.operation === 'move')
    return a?.category !== 'home'
      ? 'Chỉ chuyển vào căn nhà bạn sở hữu.'
      : s.residence === a.id
        ? 'Bạn đang ở căn nhà này.'
        : r.finance.cash + depositRefund(r) < 300_000
          ? 'Chưa đủ phí chuyển chỗ.'
          : null;
  if (action.operation === 'sell') {
    const debt = activeAssetLoan(r, a!.id)?.principal ?? 0;
    return r.finance.cash + resaleValue(r, a!) < debt
      ? 'Giá bán chưa đủ tất toán khoản vay; cần tiền mặt bù phần còn thiếu.'
      : null;
  }
  if (action.operation === 'repair') {
    if (a!.condition >= 95) return 'Tài sản còn tốt; chưa cần sửa.';
    if (r.month - a!.lastRepairMonth < 6) return 'Cần sáu tháng giữa hai đợt sửa lớn.';
    return r.finance.cash < repairPrice(a!)
      ? 'Chưa đủ tiền sửa; bạn vẫn có thể giữ, bán hoặc tiếp tục câu chuyện.'
      : null;
  }
  if (action.operation === 'repay') {
    const l = s.loans.find((x) => x.id === action.loanId);
    return !l || !l.principal
      ? 'Khoản vay đã tất toán hoặc không tồn tại.'
      : action.amount! > l.principal || action.amount! > r.finance.cash
        ? 'Số tiền trả vượt dư nợ hoặc tiền mặt.'
        : null;
  }
  if (action.operation === 'train') {
    if (!['motorcycle', 'car'].includes(action.item!))
      return 'Chọn tập sử dụng xe máy hoặc ô tô trong mô phỏng.';
    if (r.flags['living-trained-' + action.item]) return 'Bạn đã hoàn tất phần tập sử dụng này.';
    return r.finance.cash < (action.item === 'car' ? 8_000_000 : 1_500_000)
      ? 'Chưa đủ chi phí tập sử dụng phương tiện.'
      : r.player.stats.health < 25
        ? 'Sức khỏe hiện tại chưa phù hợp để tự vận hành.'
        : null;
  }
  if (action.operation === 'upkeep')
    return a!.upkeep === action.policy ? 'Đang dùng cách bảo dưỡng này.' : null;
  if (action.operation === 'build') {
    if (s.owned.some((x) => x.category === 'pc') || s.owned.length >= 8)
      return 'Bạn đã có máy tự ráp; hãy nâng cấp hoặc bán máy hiện có.';
    const pc = pcAssessment(action.parts!, r.world.year);
    if (pc.errors.length) return pc.errors.join(' ');
    const quote = financingQuote(r, pc.price, false);
    if (action.payment === 'loan' && quote.reason) return quote.reason;
    return r.finance.cash < (action.payment === 'loan' ? quote.down : pc.price)
      ? 'Chưa đủ tiền cho cấu hình đã chọn.'
      : null;
  }
  if (action.operation === 'upgrade') {
    if (a!.category !== 'pc') return 'Chỉ máy tự ráp dùng thao tác thay linh kiện.';
    const p = pcPart(action.item!);
    if (!p || p.slot !== action.slot) return 'Linh kiện không đúng vị trí đã chọn.';
    if (a!.parts![action.slot!] === p.id) return 'Linh kiện này đã có trong máy.';
    const pc = pcAssessment({ ...a!.parts!, [action.slot!]: p.id }, r.world.year);
    if (pc.errors.length) return pc.errors.join(' ');
    return r.finance.cash < upgradePrice(r, a!, action.slot!, p.id)
      ? 'Chưa đủ tiền đổi linh kiện sau thu hồi phần cũ.'
      : null;
  }
  return null;
}
export const repairPrice = (a: OwnedLivingAsset) =>
  Math.max(50_000, Math.round((a.acquisitionPrice * (100 - a.condition)) / 1000));
export function upgradePrice(r: GameRun, a: OwnedLivingAsset, slot: keyof PcParts, next: string) {
  const recovered = Math.floor(pcPartBookValue(r, a, slot) * 0.75);
  return pcPart(next)!.price - recovered;
}
function valuationChange(r: GameRun, a: OwnedLivingAsset): FinancialAssetChange {
  return { id: a.id, name: assetName(a), value: appraisedValue(r, a) };
}
function exitRental(r: GameRun, key: string) {
  const s = r.livingAssets!,
    lease = s.lease;
  if (!lease) return;
  const refund = depositRefund(r);
  transact(
    r,
    key + ':deposit',
    'Kết thúc thuê: hoàn phần cọc còn lại',
    { cash: refund, assets: -refund },
    [{ id: lease.id, name: 'Tiền cọc thuê nhà', value: null }],
  );
  s.lease = null;
}
function setResidence(r: GameRun, id: string | null) {
  const s = r.livingAssets!;
  s.residence = id;
  r.household.housing = !id ? 'family' : s.lease?.id === id ? 'rent' : 'owned';
  r.household.moved = id !== null;
}
function createLoan(r: GameRun, a: OwnedLivingAsset, price: number) {
  const s = r.livingAssets!,
    q = financingQuote(r, price, a.category === 'home');
  const loan: AssetLoan = {
    id: `asset-loan:${s.sequence}`,
    assetId: a.id,
    owner: owner(r),
    original: q.principal,
    principal: 0,
    rateBps: q.rateBps,
    months: q.months,
    startMonth: r.month,
    lateMonths: 0,
    status: 'active',
    disposedMonth: null,
  };
  s.loans.push(loan);
  return loan;
}
function buy(r: GameRun, command: LivingAssetAction, key: string) {
  const s = r.livingAssets!,
    d = command.operation === 'build' ? undefined : livingDefinition(command.item!)!,
    category = d?.category ?? 'pc';
  const price = d
    ? livingPrice(r, d, command.locality)
    : pcAssessment(command.parts!, r.world.year).price;
  if (category === 'home') exitRental(r, key);
  const a: OwnedLivingAsset = {
    id: `${r.id}:owned:${++s.sequence}`,
    catalogId: d?.id ?? 'pc-custom',
    category,
    owner: owner(r),
    acquiredMonth: r.month,
    acquisitionPrice: price,
    condition: 100,
    lastRepairMonth: -6,
    upkeep: 'essential',
    region: r.player.region,
    locality: command.locality ?? 'connected',
  };
  if (command.parts) {
    a.parts = { ...command.parts };
    a.partPrices = Object.fromEntries(
      PART_SLOTS.map((p) => [p, pcPart(command.parts![p])!.price]),
    ) as Record<keyof PcParts, number>;
    a.partMonths = Object.fromEntries(PART_SLOTS.map((p) => [p, r.month])) as Record<
      keyof PcParts,
      number
    >;
  }
  const loan = command.payment === 'loan' ? createLoan(r, a, price) : null;
  const cost = loan ? price - loan.original : price,
    fees = category === 'home' ? 300_000 + Math.round(price / 100) : 0;
  transact(
    r,
    key,
    'Mua ' + assetName(a) + (loan ? ' bằng trả trước và khoản vay riêng' : ' bằng tiền mặt'),
    {
      cash: -cost - fees,
      assets: price,
      ...(loan ? { loanId: loan.id, loanDebt: loan.original } : {}),
    },
    [{ id: a.id, name: assetName(a), value: price }],
  );
  s.owned.push(a);
  if (category === 'home') setResidence(r, a.id);
  const first = !s.firsts.includes(category);
  if (first) s.firsts.push(category);
  note(
    r,
    first ? 'Tài sản đầu tiên: ' + assetName(a) : 'Một lần mua sắm có tính toán',
    `Bạn sở hữu ${assetName(a).toLowerCase()}, giá ${amount(price)}. ${loan ? `Còn khoản vay ${amount(loan.principal)}, tự đối soát từng tháng.` : 'Không có khoản vay mua tài sản này.'} Chi phí duy trì dự kiến ${amount(assetMonthlyCost(r, a))}/tháng.`,
  );
}
function dispose(r: GameRun, a: OwnedLivingAsset, key: string, forced = false) {
  const s = r.livingAssets!,
    book = financialValue(r, a.id),
    proceeds = resaleValue(r, a),
    loan = activeAssetLoan(r, a.id);
  const repayment = loan ? (forced ? Math.min(proceeds, loan.principal) : loan.principal) : 0;
  transact(
    r,
    key,
    (forced ? 'Bán xử lý chậm trả trong mô phỏng: ' : 'Bán: ') + assetName(a),
    {
      cash: proceeds - repayment,
      assets: -book,
      ...(loan ? { loanId: loan.id, loanDebt: -repayment } : {}),
    },
    [{ id: a.id, name: assetName(a), value: null }],
  );
  if (loan) {
    loan.status = loan.principal ? 'shortfall' : 'paid';
    loan.disposedMonth = r.month;
  }
  s.owned = s.owned.filter((x) => x.id !== a.id);
  s.disposed++;
  if (s.residence === a.id) setResidence(r, null);
  note(
    r,
    forced ? 'Thu xếp lại khi không trả nổi' : 'Chia tay một tài sản',
    `Bạn bán ${assetName(a).toLowerCase()} với giá ${amount(proceeds)}.${loan ? ` Đã trả vào khoản vay ${amount(repayment)}; dư nợ còn ${amount(loan.principal)}.` : ''}${forced ? ' Đây là cách xử lý giả định của game, không phải quy trình thu hồi theo pháp luật.' : ''}${r.month - a.acquiredMonth >= 120 ? ' Món đồ đã đi cùng bạn hơn mười năm.' : ''}`,
  );
}
export function requestLivingAsset(input: GameRun, raw: LivingAssetAction): GameRun {
  const a = livingAssetActionSchema.parse(raw),
    reason = livingAssetReason(input, a);
  if (reason) throw Error(reason);
  const r = structuredClone(input),
    s = r.livingAssets!,
    key = 'living-action:' + r.actions.length;
  const owned = s.owned.find((x) => x.id === a.assetId);
  switch (a.operation) {
    case 'buy':
    case 'build':
      buy(r, a, key);
      break;
    case 'rent': {
      const d = livingDefinition(a.item!)!,
        rent = livingPrice(r, d, a.locality),
        deposit = rent * 2;
      exitRental(r, key);
      const id = `${r.id}:lease:${++s.sequence}`;
      transact(r, key, 'Đặt cọc thuê ' + d.name, { cash: -deposit - 300_000, assets: deposit }, [
        { id, name: 'Tiền cọc: ' + d.name, value: deposit },
      ]);
      s.lease = {
        id,
        catalogId: d.id,
        owner: owner(r),
        region: r.player.region,
        locality: a.locality ?? 'connected',
        startMonth: r.month,
        rent,
        deposit,
        damage: 0,
        reviewMonth: r.month + 12,
        lastRenewMonth: r.month,
      };
      setResidence(r, id);
      note(
        r,
        'Một chỗ ở mới',
        `Bạn thuê ${d.name.toLowerCase()}, giữ cọc ${amount(deposit)} trong sổ, chuyển chỗ 300.000 ₫. Từ tháng tới thu thuê ${amount(rent)} và chi phí nhà ${amount(d.monthly)} mỗi tháng. Tiền cọc chỉ bị khấu trừ khi có hư hại được ghi nhận; hao mòn thường ngày không tự mất cọc.`,
      );
      break;
    }
    case 'repair-rental': {
      const lease = s.lease!,
        before = depositRefund(r),
        cost = Math.max(50_000, Math.floor((lease.deposit * lease.damage) / 200));
      lease.damage = 0;
      transact(
        r,
        key,
        'Sửa phần hư hại của chỗ thuê',
        { cash: -cost, assets: lease.deposit - before },
        [{ id: lease.id, name: 'Tiền cọc thuê nhà', value: lease.deposit }],
      );
      note(
        r,
        'Bàn giao lại phần đã hỏng',
        `Bạn chi ${amount(cost)} sửa phần hư hại đã ghi. Khoản cọc có thể hoàn lại là ${amount(lease.deposit)}.`,
      );
      break;
    }
    case 'renew':
      s.lease!.lastRenewMonth = r.month;
      s.lease!.reviewMonth = r.month + 12;
      note(
        r,
        'Giữ chỗ ở quen thuộc',
        'Bạn chủ động gia hạn và giữ mức thuê hiện tại. Không thu lại cọc hoặc tiền thuê của tháng đã đối soát.',
      );
      break;
    case 'leave':
      exitRental(r, key);
      transact(r, key, 'Chuyển về ở cùng gia đình hoặc ở nhờ', { cash: -300_000 });
      setResidence(r, null);
      note(
        r,
        'Thu xếp một chỗ ở nhờ',
        'Bạn chuyển về chỗ ở cùng gia đình hoặc ở nhờ trong bối cảnh mô phỏng. Nhà đang sở hữu, nếu có, vẫn cần bảo trì.',
      );
      break;
    case 'move':
      exitRental(r, key);
      transact(r, key, 'Chuyển vào nhà đã sở hữu', { cash: -300_000 });
      setResidence(r, owned!.id);
      note(
        r,
        'Đưa cuộc sống sang một mái nhà khác',
        `Bạn chuyển vào ${assetName(owned!).toLowerCase()}; không mua nhà lần thứ hai.`,
      );
      break;
    case 'sell':
      dispose(r, owned!, key);
      break;
    case 'repair': {
      const cost = repairPrice(owned!),
        before = financialValue(r, owned!.id);
      owned!.condition = 100;
      owned!.lastRepairMonth = r.month;
      const change = valuationChange(r, owned!);
      transact(
        r,
        key,
        'Sửa và bảo dưỡng lớn: ' + assetName(owned!),
        { cash: -cost, assets: change.value! - before },
        [change],
      );
      note(
        r,
        'Sửa để dùng thêm',
        `Bạn chi ${amount(cost)} sửa ${assetName(owned!).toLowerCase()}; tuổi tài sản không quay về lúc mới mua.`,
      );
      break;
    }
    case 'repay': {
      const loan = s.loans.find((l) => l.id === a.loanId)!;
      transact(r, key, 'Trả thêm gốc khoản vay tài sản', {
        cash: -a.amount!,
        loanDebt: -a.amount!,
        loanId: loan.id,
      });
      if (!loan.principal) loan.status = 'paid';
      note(
        r,
        loan.principal ? 'Nhẹ đi một phần nợ' : 'Tất toán khoản vay tài sản',
        `Bạn trả ${amount(a.amount!)} tiền gốc; còn ${amount(loan.principal)}. Không tính thêm lãi cho thao tác trả trước này.`,
      );
      break;
    }
    case 'train':
      transact(r, key, 'Tập sử dụng phương tiện trong mô phỏng', {
        cash: -(a.item === 'car' ? 8_000_000 : 1_500_000),
      });
      r.flags['living-trained-' + a.item] = true;
      note(
        r,
        'Đi lại có chuẩn bị',
        'Bạn hoàn tất phần tập sử dụng phương tiện của game. Đây không phải giấy phép lái xe thật; khả năng tự vận hành còn phụ thuộc sức khỏe.',
      );
      break;
    case 'upkeep':
      owned!.upkeep = a.policy!;
      note(
        r,
        'Một nhịp chăm sóc đồ dùng',
        a.policy === 'careful'
          ? 'Bạn tăng chi phí bảo dưỡng định kỳ để đồ xuống cấp chậm hơn.'
          : 'Bạn quay về mức bảo dưỡng thiết yếu, chấp nhận hao mòn nhanh hơn.',
      );
      break;
    case 'upgrade': {
      const before = financialValue(r, owned!.id),
        cost = upgradePrice(r, owned!, a.slot!, a.item!);
      owned!.parts![a.slot!] = a.item!;
      owned!.partPrices![a.slot!] = pcPart(a.item!)!.price;
      owned!.partMonths![a.slot!] = r.month;
      const change = valuationChange(r, owned!);
      transact(
        r,
        key,
        'Thay linh kiện, thu hồi phần cũ trong máy',
        { cash: -cost, assets: change.value! - before },
        [change],
      );
      note(
        r,
        'Thay một phần, giữ chiếc máy',
        `Bạn thay ${pcPart(a.item!)!.name.toLowerCase()}; chênh lệch phải trả ${amount(cost)}. Cả máy vẫn là một tài sản, không thành hai máy để bán.`,
      );
      break;
    }
  }
  r.actions.push(a);
  return r;
}
export function settleLivingAssets(r: GameRun) {
  const s = r.livingAssets;
  if (!hasAssetsRules(r) || !s) return;
  if (s.settledThrough >= r.month) throw Error('Tháng tài sản đã đối soát.');
  if (r.month >= 216) {
    const cost = livingMonthlyCost(r);
    if (cost)
      mandatoryCost(
        r,
        `living-month:${r.month}:cost`,
        'Tiền thuê, tiện ích và chi phí duy trì tài sản',
        cost,
      );
    for (const a of s.owned) {
      const period = a.category === 'home' ? 12 : a.upkeep === 'careful' ? 4 : 2;
      if ((r.month - a.acquiredMonth) % period === 0) a.condition = Math.max(0, a.condition - 1);
    }
    const changes = s.owned
      .map((a) => valuationChange(r, a))
      .filter((c) => c.value !== financialValue(r, c.id));
    if (changes.length)
      transact(
        r,
        `living-month:${r.month}:valuation`,
        'Hao mòn và định giá tài sản mô phỏng',
        { assets: changes.reduce((sum, c) => sum + c.value! - financialValue(r, c.id), 0) },
        changes,
      );
    if (s.lease && r.month >= s.lease.reviewMonth) s.lease.reviewMonth += 12;
    for (const loan of s.loans.filter((l) => l.principal > 0)) {
      const interest = Math.ceil((loan.principal * loan.rateBps) / 10_000),
        due = loanInstallment(loan),
        key = `living-loan:${loan.id}:${r.month}`;
      const withdraw = Math.min(Math.max(0, due - r.finance.cash), r.finance.savings);
      if (withdraw)
        transact(r, key + ':withdraw', 'Rút tiết kiệm cho kỳ trả tài sản', {
          cash: withdraw,
          savings: -withdraw,
        });
      const payment = Math.min(due, r.finance.cash),
        paidInterest = Math.min(payment, interest),
        paidPrincipal = Math.min(loan.principal, payment - paidInterest);
      transact(r, key, 'Kỳ trả khoản vay tài sản, gồm lãi và gốc', {
        cash: -payment,
        loanId: loan.id,
        loanDebt: interest - paidInterest - paidPrincipal,
      });
      loan.lateMonths = payment < due ? loan.lateMonths + 1 : 0;
      if (!loan.principal) {
        loan.status = 'paid';
        note(
          r,
          'Xong một khoản vay',
          'Khoản vay mua tài sản đã được tất toán qua các kỳ đối soát.',
        );
      } else if (loan.lateMonths === 1)
        note(
          r,
          'Một kỳ trả chưa đủ',
          'Khoản trả tài sản thiếu tiền; phần lãi chưa trả nhập gốc, ghi riêng với nợ sinh hoạt. Sáu kỳ thiếu liên tiếp có thể dẫn đến bán xử lý tài sản trong mô phỏng.',
        );
      if (loan.status === 'active' && loan.lateMonths >= 6) {
        const a = s.owned.find((x) => x.id === loan.assetId);
        if (a) dispose(r, a, key + ':sale', true);
      }
    }
    if (r.month % 12 === 0) {
      const home = s.owned.find((a) => a.id === s.residence),
        d = livingDefinition(home?.catalogId ?? s.lease?.catalogId ?? '');
      const people =
        1 +
        r.npcs.filter((n) => n.alive && n.role === 'child' && r.world.year - n.birthYear < 18)
          .length +
        (r.social?.people.some((p) => p.cohabiting) ? 1 : 0);
      const cramped = people > (d?.capacity ?? Math.max(2, r.household.resources + 2));
      r.player.stats.stress = clamp(
        r.player.stats.stress +
          (cramped ? 1 : 0) +
          (s.loans.some((l) => l.lateMonths > 0 && l.principal) ? 2 : 0),
      );
      if (d && !cramped && r.player.stats.stress > 35)
        r.player.stats.stress = clamp(r.player.stats.stress - 1);
    }
  }
  s.settledThrough = r.month;
}
export function assertLivingAssets(r: GameRun) {
  function fail(m: string): never {
    throw Error('Invariant: living assets ' + m);
  }
  const s = r.livingAssets;
  if (!hasAssetsRules(r)) {
    if (s || r.finance.transactions.some((t) => t.loanId !== undefined || t.loanDebt !== undefined))
      fail('historical rules');
    return;
  }
  if (!s || s.owned.length > 8 || s.loans.length > 12 || s.settledThrough !== r.month)
    fail('bounds/settlement');
  if (![s.sequence, s.disposed].every((n) => Number.isSafeInteger(n) && n >= 0 && n <= 120))
    fail('counters');
  if (
    new Set(s.owned.map((a) => a.id)).size !== s.owned.length ||
    new Set(s.loans.map((l) => l.id)).size !== s.loans.length
  )
    fail('identity');
  const expectedIds = new Set(s.owned.map((a) => a.id));
  // Business equity is independent and validated against its own ledger by assertBusinesses.
  for (const venture of r.enterprise?.ventures ?? []) expectedIds.add(venture.id);
  for (const a of s.owned) {
    if (
      a.owner !== owner(r) ||
      !a.id.startsWith(r.id + ':owned:') ||
      a.acquiredMonth < 216 ||
      a.acquiredMonth > r.month ||
      !Number.isSafeInteger(a.acquisitionPrice) ||
      a.acquisitionPrice <= 0 ||
      !Number.isInteger(a.condition) ||
      a.condition < 0 ||
      a.condition > 100 ||
      a.lastRepairMonth > r.month
    )
      fail('ownership/condition');
    if (financialValue(r, a.id) !== appraisedValue(r, a)) fail('valuation');
    if (a.category === 'pc') {
      if (
        !a.parts ||
        !a.partMonths ||
        !a.partPrices ||
        pcAssessment(a.parts, r.world.year).errors.length
      )
        fail('PC configuration');
      for (const slot of PART_SLOTS)
        if (
          !Number.isSafeInteger(a.partPrices![slot]) ||
          a.partPrices![slot] <= 0 ||
          a.partMonths![slot] < a.acquiredMonth ||
          a.partMonths![slot] > r.month ||
          pcPart(a.parts![slot])!.from > r.player.birthYear + Math.floor(a.partMonths![slot] / 12)
        )
          fail('PC receipt');
    } else {
      const d = livingDefinition(a.catalogId);
      if (
        !d ||
        d.mode !== 'own' ||
        d.category !== a.category ||
        d.from > r.player.birthYear + Math.floor(a.acquiredMonth / 12)
      )
        fail('catalog/era');
    }
  }
  for (const category of ['home', 'vehicle', 'phone', 'laptop', 'pc'])
    if (
      s.owned.filter((a) => a.category === category).length >
      (category === 'home' || category === 'vehicle' ? 2 : 1)
    )
      fail('category capacity');
  if (s.lease) {
    const l = s.lease,
      d = livingDefinition(l.catalogId);
    expectedIds.add(l.id);
    if (
      !d ||
      d.mode !== 'rent' ||
      l.owner !== owner(r) ||
      l.startMonth < 216 ||
      l.startMonth > r.month ||
      !Number.isInteger(l.damage) ||
      l.damage < 0 ||
      l.damage > 100 ||
      l.deposit !== l.rent * 2 ||
      depositRefund(r) !== l.deposit - Math.floor((l.deposit * l.damage) / 100) ||
      s.residence !== l.id
    )
      fail('rental/deposit');
  }
  if (
    r.finance.assets.length !== expectedIds.size ||
    r.finance.assets.some((a) => !expectedIds.has(a.id))
  )
    fail('financial ownership');
  if (
    s.residence &&
    s.residence !== s.lease?.id &&
    !s.owned.some((a) => a.id === s.residence && a.category === 'home')
  )
    fail('residence');
  if (r.household.housing !== (!s.residence ? 'family' : s.lease ? 'rent' : 'owned'))
    fail('housing status');
  const ledger = new Map<string, number>();
  for (const t of r.finance.transactions) {
    if ((t.loanId === undefined) !== (t.loanDebt === undefined)) fail('loan posting');
    if (t.loanId) {
      if (!s.loans.some((l) => l.id === t.loanId) || !Number.isSafeInteger(t.loanDebt))
        fail('unknown loan');
      ledger.set(t.loanId, (ledger.get(t.loanId) ?? 0) + t.loanDebt!);
    }
  }
  for (const l of s.loans) {
    if (
      l.owner !== owner(r) ||
      !Number.isSafeInteger(l.principal) ||
      l.principal < 0 ||
      l.principal !== ledger.get(l.id) ||
      !Number.isSafeInteger(l.original) ||
      l.original <= 0 ||
      ![24, 240].includes(l.months) ||
      ![35, 60].includes(l.rateBps) ||
      l.startMonth < 216 ||
      l.startMonth > r.month ||
      !Number.isInteger(l.lateMonths) ||
      l.lateMonths < 0
    )
      fail('loan balance/terms');
    if (
      (l.status === 'paid') !== (l.principal === 0) ||
      (l.status === 'active' && !s.owned.some((a) => a.id === l.assetId)) ||
      (l.status === 'shortfall' &&
        (s.owned.some((a) => a.id === l.assetId) || l.disposedMonth === null))
    )
      fail('loan lifecycle');
  }
}
