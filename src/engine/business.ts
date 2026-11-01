import type { GameRun } from '../domain/model';
import {
  enterpriseActionSchema,
  type EnterpriseAction,
  type BusinessOperation,
} from '../domain/enterprise-actions';
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
  if (r.activeEvent && /^(biz-|cr-)/.test(r.activeEvent.id))
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
    if (books.length + (input.creator?.channels.length ?? 0) >= 4)
      throw Error('Một cuộc đời giữ tối đa bốn sổ tiệm và kênh, kể cả đã đóng.');
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
      if (
        book.policy.price === a.policy!.price &&
        book.policy.marketing === a.policy!.marketing &&
        book.policy.reorderTarget === a.policy!.reorderTarget
      )
        throw Error('Tiệm đang dùng đúng chính sách này.');
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
      (e.recent.length > 0 && e.recent.at(-1)!.month !== e.settledThrough) ||
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
export const storyShop = (r: GameRun) => r.enterprise?.ventures.find((e) => e.status !== 'closed');
export function businessSceneEligible(r: GameRun, id: string) {
  const e = storyShop(r);
  if (!hasEnterpriseRules(r) || !e || r.month - r.enterprise!.lastSceneMonth < 12) return false;
  const last = e.recent.at(-1);
  switch (id) {
    case 'biz-first-sale':
      return e.totals.revenue > 0;
    case 'biz-quiet-opening':
      return r.month - e.foundedMonth >= 2 && (!last || last.orders < 4);
    case 'biz-supplier':
      return !!last && last.bought === 0;
    case 'biz-complaint':
      return e.recent.some((m) => m.returned > 0);
    case 'biz-popular':
      return e.recent.some((m) => m.orders >= 10);
    case 'biz-returning':
      return e.reputation >= 55 && r.month - e.foundedMonth >= 12;
    case 'biz-marketing':
      return e.policy.marketing && e.recent.some((m) => m.profit < 0);
    case 'biz-stockout':
      return e.stock === 0 && e.recent.some((m) => m.orders > 0);
    case 'biz-loss':
      return e.recent.some((m) => m.profit < 0);
    case 'biz-family':
      return r.player.stats.stress >= 60;
    case 'biz-growth':
      return r.month - e.foundedMonth >= 18 && e.recent.some((m) => m.profit > 0);
    case 'biz-close':
      return (
        r.month - e.foundedMonth >= 36 &&
        (e.status === 'suspended' || e.recent.some((m) => m.profit < 0))
      );
    default:
      return false;
  }
}
export function applyBusinessStory(r: GameRun, operation: BusinessOperation) {
  const e = storyShop(r);
  if (!e || !hasEnterpriseRules(r)) throw Error('Câu chuyện cửa hàng không còn phù hợp.');
  const cap = (v: number) => Math.max(0, Math.min(100, v));
  const s = r.player.stats;
  switch (operation) {
    case 'listen':
      e.reputation = cap(e.reputation + 4);
      s.social = cap(s.social + 2);
      s.stress = cap(s.stress + 1);
      break;
    case 'review':
      e.policy.marketing = false;
      e.policy.reorderTarget = Math.min(e.policy.reorderTarget, 10);
      s.knowledge = cap(s.knowledge + 3);
      s.stress = cap(s.stress - 2);
      break;
    case 'balanced':
      e.policy.price = 'balanced';
      e.policy.marketing = false;
      s.stress = cap(s.stress - 2);
      break;
    case 'promote':
      e.policy.marketing = true;
      s.social = cap(s.social + 3);
      s.stress = cap(s.stress + 3);
      break;
    case 'quality':
      e.policy.price = 'premium';
      e.reputation = cap(e.reputation + 2);
      s.skill = cap(s.skill + 2);
      s.stress = cap(s.stress + 2);
      break;
    case 'simplify':
      e.policy.price = 'budget';
      e.policy.reorderTarget = Math.min(e.policy.reorderTarget, 10);
      s.stress = cap(s.stress - 4);
      s.mood = cap(s.mood + 2);
      break;
    case 'grow':
      e.policy.reorderTarget = Math.min(200, e.policy.reorderTarget + 20);
      s.skill = cap(s.skill + 3);
      s.stress = cap(s.stress + 4);
      break;
    case 'pause':
      e.status = 'suspended';
      s.stress = cap(s.stress - 6);
      for (const rel of r.relationships.filter(
        (x) =>
          ['partner', 'family'].includes(x.type) && r.npcs.find((n) => n.id === x.npcId)?.alive,
      ))
        rel.strength = cap(rel.strength + 2);
      break;
    case 'close':
      closeRetailOwned(r, e);
      s.stress = cap(s.stress - 8);
      s.mood = cap(s.mood - 1);
      break;
  }
  r.enterprise!.lastSceneMonth = r.month;
  assertEnterprise(r, e);
}
