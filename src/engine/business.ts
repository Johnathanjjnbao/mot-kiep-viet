import type { GameRun } from '../domain/model';
import { enterpriseActionSchema, type EnterpriseAction } from '../domain/enterprise-actions';
import { hasEnterpriseRules, discretionaryCount } from '../domain/rules';
import { designMoney, formatMoney } from '../domain/currency';
import { ageOf, currentCareer } from '../content/world';
import {
  assertEnterprise,
  foundRetail,
  retailPolicy,
  fundRetail,
  withdrawRetail,
  settleRetailOwned,
  closeRetail,
  closeRetailOwned,
} from './enterprise';

export const CATEGORY_NAMES = {
  clothing: 'Quần áo',
  household: 'Đồ gia dụng',
  handmade: 'Đồ thủ công',
};
export const enterpriseEquity = (e: NonNullable<GameRun['enterprise']>['ventures'][number]) =>
  e.cash + e.stock * e.unitCost;
export const enterpriseProfit = (e: NonNullable<GameRun['enterprise']>['ventures'][number]) =>
  e.totals.revenue - e.totals.cogs - e.totals.operating - e.totals.writeOff;
export function businessReason(r: GameRun): string | null {
  if (!hasEnterpriseRules(r) || !r.enterprise)
    return 'Cuộc đời này giữ luật kinh tế trước khi có cửa hàng.';
  if (r.status !== 'playing' || ageOf(r) < 18) return 'Từ 18 tuổi, bạn có thể tự mở cửa hàng.';
  if (r.world.year < 2005 || !r.world.technologies.includes('internet'))
    return 'Cửa hàng trực tuyến mở từ năm 2005 trong bối cảnh có Internet của mô phỏng.';
  if (
    r.academics?.focus ||
    r.social?.focus ||
    r.family?.focus ||
    r.activeEvent?.id.startsWith('biz-')
  )
    return 'Hãy hoàn tất cuộc đối thoại đang chờ trước khi quản lý cửa hàng.';
  if (discretionaryCount(r) >= 120)
    return 'Đã dùng hết lượt quản lý; các tháng của tiệm vẫn tiếp tục cùng câu chuyện.';
  return null;
}
export function requestEnterprise(input: GameRun, raw: EnterpriseAction): GameRun {
  const parsed = enterpriseActionSchema.safeParse(raw);
  if (!parsed.success) throw Error('Thông số cửa hàng không hợp lệ hoặc không đúng thao tác.');
  const a = parsed.data;
  if (a.expected !== input.actions.length)
    throw Error('Thao tác cửa hàng đã cũ; tiến độ hiện tại được giữ nguyên.');
  const reason = businessReason(input);
  if (reason) throw Error(reason);
  const books = input.enterprise!.ventures;
  let pair: ReturnType<typeof foundRetail>;
  let message: string;
  if (a.operation === 'found') {
    if (books.length >= 4) throw Error('Một cuộc đời giữ tối đa bốn cửa hàng, kể cả tiệm đã đóng.');
    if (['business', 'freelance'].includes(currentCareer(input)?.id ?? ''))
      throw Error(
        'Hãy rời công việc kinh doanh/tự do theo lương khoán trước khi mở tiệm có sổ riêng.',
      );
    if (
      a.capital! < designMoney(input, 20) ||
      a.capital! > designMoney(input, 10000) ||
      a.capital! > input.finance.cash
    )
      throw Error(
        `Vốn cần từ ${formatMoney(designMoney(input, 20), input)} và nằm trong tiền mặt hiện có.`,
      );
    pair = foundRetail(input, books.length, a.capital!, a.category!);
    pair = retailPolicy(pair.run, pair.enterprise, a.policy!);
    pair.run.enterprise!.ventures.push(pair.enterprise);
    pair.run.finance.assets.find((x) => x.id === pair.enterprise.id)!.name =
      `Tiệm trực tuyến · ${CATEGORY_NAMES[pair.enterprise.category]}`;
    message = `Bạn mở tiệm ${CATEGORY_NAMES[pair.enterprise.category].toLowerCase()} với ${formatMoney(a.capital!, input)}. Vốn chuyển sang sổ tiệm; đây chưa phải doanh thu.`;
  } else {
    const book = books.find((e) => e.id === a.id);
    if (!book || book.status === 'closed')
      throw Error('Cửa hàng không còn hoạt động hoặc không thuộc cuộc đời này.');
    if (a.operation === 'policy') {
      pair = retailPolicy(input, book, a.policy!);
      message =
        'Bạn đổi cách định giá, quảng bá và mức hàng dự trữ. Kết quả được tính từ tháng sau.';
    } else if (a.operation === 'fund') {
      if (a.amount! > input.finance.cash || a.amount! > designMoney(input, 10000))
        throw Error('Tiền mặt không đủ hoặc vượt giới hạn góp vốn mỗi lần.');
      pair = fundRetail(input, book, a.amount!);
      message = `Bạn góp thêm ${formatMoney(a.amount!, input)}; vốn không được tính là tiền bán hàng.`;
    } else if (a.operation === 'withdraw') {
      if (a.amount! > book.cash) throw Error('Tiệm chưa có đủ tiền mặt để rút khoản này.');
      pair = withdrawRetail(input, book, a.amount!);
      message = `Bạn rút ${formatMoney(a.amount!, input)} về cá nhân. Tiền vận hành của tiệm giảm tương ứng.`;
    } else if (a.operation === 'close') {
      pair = closeRetail(input, book);
      message = `Bạn khép tiệm, thanh lý hàng ở 50% giá vốn và nhận ${formatMoney(pair.enterprise.totals.withdrawn - book.totals.withdrawn, input)} còn lại. Lịch sử tiệm được giữ.`;
    } else {
      if (
        a.operation === 'resume' &&
        book.cash < designMoney(input, 6 + (book.policy.marketing ? 4 : 0))
      )
        throw Error('Tiệm cần đủ vốn vận hành một tháng trước khi mở lại.');
      if ((a.operation === 'suspend') === (book.status === 'suspended'))
        throw Error('Trạng thái cửa hàng đã như bạn chọn.');
      pair = { run: structuredClone(input), enterprise: structuredClone(book) };
      pair.enterprise.status = a.operation === 'suspend' ? 'suspended' : 'operating';
      message =
        a.operation === 'suspend'
          ? 'Bạn tạm dừng nhận đơn. Hàng và vốn vẫn ở tiệm, không phát sinh chi phí vận hành trong thời gian dừng.'
          : 'Bạn mở lại tiệm; đơn hàng sẽ được tính từ tháng tiếp theo.';
    }
    pair.run.enterprise!.ventures[books.indexOf(book)] = pair.enterprise;
  }
  pair.run.actions.push(a);
  pair.run.lastOutcome = message;
  pair.run.journal.push({
    id: `journal:${pair.run.journal.length}`,
    month: pair.run.month,
    title: 'Một quyết định với cửa hàng',
    text: message,
    category: 'finance',
  });
  assertBusinesses(pair.run);
  return pair.run;
}
/** Mutates only the engine-owned clone, inside the existing monthly clock. */
export function settleBusinesses(r: GameRun) {
  if (!r.enterprise) return;
  for (const e of r.enterprise.ventures) if (e.status !== 'closed') settleRetailOwned(r, e);
  const working = r.enterprise.ventures.filter((e) => e.status === 'operating').length;
  if (working && r.month % 12 === 0) {
    r.player.stats.stress = Math.min(
      100,
      r.player.stats.stress +
        Math.min(
          8,
          working * 2 +
            (currentCareer(r) ? 2 : 0) +
            (r.academics?.studies.some((s) => s.status === 'studying') ? 1 : 0),
        ),
    );
    if (working >= 3) {
      r.player.stats.mood = Math.max(0, r.player.stats.mood - 1);
      for (const rel of r.relationships.filter((x) => x.type === 'partner'))
        rel.strength = Math.max(0, rel.strength - 1);
    }
  }
}
export function closeBusinessesAtEnd(r: GameRun) {
  if (!r.enterprise) return;
  for (const e of r.enterprise.ventures)
    if (e.status !== 'closed') {
      closeRetailOwned(r, e);
      r.journal.push({
        id: `journal:${r.journal.length}`,
        month: r.month,
        title: 'Khép sổ cửa hàng',
        text: `Tiệm ${CATEGORY_NAMES[e.category].toLowerCase()} được thanh lý khi cuộc đời khép lại. Tiền còn lại về tài sản cá nhân; lịch sử lời lỗ vẫn được giữ.`,
        category: 'finance',
      });
    }
}
export function assertBusinesses(r: GameRun) {
  if (!hasEnterpriseRules(r)) {
    if (r.enterprise !== undefined)
      throw Error('Invariant: enterprise attached to historical rules');
    return;
  }
  const state = r.enterprise;
  if (
    !state ||
    state.ventures.length > 4 ||
    !Number.isInteger(state.lastSceneMonth) ||
    state.lastSceneMonth < -12 ||
    state.lastSceneMonth > r.month ||
    discretionaryCount(r) > 120
  )
    throw Error('Invariant: enterprise state/budget');
  state.ventures.forEach((e, i) => {
    assertEnterprise(r, e);
    if (
      e.id !== `enterprise:${i}` ||
      e.settledThrough !== (e.status === 'closed' ? e.closedMonth : r.month) ||
      e.recent.length !== Math.min(12, e.settledThrough - e.foundedMonth) ||
      (r.status === 'ended' && e.status !== 'closed')
    )
      throw Error('Invariant: enterprise clock/identity');
  });
  if (
    state.ventures.some((e) => e.status !== 'closed') &&
    ['business', 'freelance'].includes(currentCareer(r)?.id ?? '')
  )
    throw Error('Invariant: duplicate business compensation');
  if (
    r.finance.assets.filter((a) => a.id.startsWith('enterprise:')).length !== state.ventures.length
  )
    throw Error('Invariant: orphan enterprise asset');
}
