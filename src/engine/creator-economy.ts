import type { GameRun } from '../domain/model';
import {
  creatorActionSchema,
  creatorPolicySchema,
  type CreatorAction,
  type CreatorChannel,
  type CreatorPolicy,
  type CreatorOperation,
  type CreatorMonth,
} from '../domain/creator-economy';
import { hasCreatorRules, discretionaryCount } from '../domain/rules';
import { designMoney } from '../domain/currency';
import { ageOf, currentCareer } from '../content/world';
import { transact } from './finance';
import { hashSeed, nextRandom } from './random';
export const PLATFORM_NAMES = { youtube: 'YouTube', tiktok: 'TikTok' };
export const NICHE_NAMES = {
  education: 'Chia sẻ kiến thức',
  entertainment: 'Giải trí',
  conversation: 'Trò chuyện',
  gaming: 'Trò chơi',
  performance: 'Biểu diễn sáng tạo',
  selling: 'Giới thiệu hàng của tiệm',
};
const cap = (n: number) => Math.max(0, Math.min(100, n));
const integer = (n: number, min: number, max: number) =>
  Number.isSafeInteger(n) && n >= min && n <= max;
export const channelProfit = (c: CreatorChannel) =>
  c.totals.platformIncome + c.totals.sponsorIncome - c.totals.cost;
export const creatorCosts = (r: GameRun, p: CreatorPolicy) =>
  designMoney(r, { light: 2, steady: 5, intense: 12 }[p.rhythm] + (p.format === 'live' ? 3 : 0));
export function creatorReason(r: GameRun): string | null {
  if (!hasCreatorRules(r) || !r.creator) return 'Cuộc đời này giữ luật trước khi có kênh sáng tạo.';
  if (r.status !== 'playing' || ageOf(r) < 18) return 'Từ 18 tuổi, bạn có thể tự xây kênh.';
  if (r.activeEvent && /^(biz-|cr-)/.test(r.activeEvent.id))
    return 'Hãy giải quyết câu chuyện đang chờ trước khi quản lý kênh.';
  if (discretionaryCount(r) >= 120) return 'Đã dùng hết lượt quản lý; hãy tiếp tục câu chuyện.';
  return null;
}
export function creatorPolicyReason(
  r: GameRun,
  c: Pick<CreatorChannel, 'platform' | 'audience' | 'equipment'>,
  p: CreatorPolicy,
): string | null {
  if (p.format === 'live') {
    if (c.platform !== 'tiktok')
      return 'Nhánh YouTube này chỉ sản xuất video; LIVE dùng nhánh TikTok.';
    if (r.world.year < 2023 || c.audience < 1000)
      return 'LIVE mở từ năm 2023 và 1.000 người theo dõi trong luật mô phỏng.';
    if (p.niche === 'gaming' && c.equipment < 2)
      return 'LIVE trò chơi cần thiết bị bậc 2 để giữ chất lượng phát.';
  }
  if (
    p.niche === 'selling' &&
    (p.format !== 'live' || !r.enterprise?.ventures.some((e) => e.status === 'operating'))
  )
    return 'Giới thiệu hàng cần LIVE và một tiệm đang nhận đơn; doanh thu hàng vẫn chỉ vào sổ tiệm.';
  return null;
}
export function monetizationReady(r: GameRun, c: CreatorChannel) {
  return (
    c.status === 'active' &&
    r.month - c.startedMonth >= 12 &&
    c.audience >= 1000 &&
    c.quality >= 50 &&
    c.reputation >= 50 &&
    c.engagement >= 35 &&
    (c.platform === 'youtube'
      ? r.world.year >= 2014
      : r.world.year >= 2023 && c.policy.format === 'live') &&
    c.policy.niche !== 'selling'
  );
}
function applyMonetization(r: GameRun, c: CreatorChannel) {
  if (
    !monetizationReady(r, c) ||
    c.monetization === 'approved' ||
    c.monetization === 'pending' ||
    (c.appliedMonth !== null && r.month - c.appliedMonth < 12)
  )
    throw Error('Kênh chưa đủ điều kiện hoặc chưa tới lượt xét tiếp theo.');
  c.monetization = 'pending';
  c.appliedMonth = r.month;
}
function channelNote(r: GameRun, text: string) {
  r.journal.push({
    id: `journal:${r.journal.length}`,
    month: r.month,
    title: 'Một chặng của kênh',
    text,
    category: 'career',
  });
  r.lastOutcome = text;
}
function paySetup(r: GameRun, c: CreatorChannel, amount: number, label: string) {
  if (r.finance.cash < amount) throw Error('Tiền cá nhân chưa đủ; không tự vay để làm kênh.');
  transact(r, `${c.id}:equipment:${c.equipment}`, label, { cash: -amount });
  c.totals.cost += amount;
}
export function requestCreator(input: GameRun, raw: CreatorAction): GameRun {
  const parsed = creatorActionSchema.safeParse(raw);
  if (!parsed.success) throw Error('Thông số kênh không hợp lệ.');
  const a = parsed.data;
  if (a.expected !== input.actions.length)
    throw Error('Thao tác kênh đã cũ; dữ liệu hiện tại được giữ nguyên.');
  const reason = creatorReason(input);
  if (reason) throw Error(reason);
  const r = structuredClone(input),
    channels = r.creator!.channels;
  let message: string;
  if (a.operation === 'start') {
    if (channels.length + (r.enterprise?.ventures.length ?? 0) >= 4)
      throw Error('Cuộc đời giữ tối đa bốn sổ tiệm và kênh, kể cả đã đóng.');
    if (['business', 'freelance'].includes(currentCareer(r)?.id ?? ''))
      throw Error('Hãy kết thúc nghề kinh doanh/tự do trừu tượng trước khi mở kênh có sổ riêng.');
    const platform = a.platform!;
    if (
      r.world.year < (platform === 'youtube' ? 2014 : 2018) ||
      !r.world.technologies.includes('internet')
    )
      throw Error('Nền tảng chưa mở trong bối cảnh này.');
    const c: CreatorChannel = {
      id: `creator:${channels.length}`,
      owner: r.id,
      platform,
      startedMonth: r.month,
      settledThrough: r.month,
      closedMonth: null,
      status: 'active',
      pauseReason: null,
      audience: 0,
      engagement: 40,
      reputation: 40,
      quality: 35,
      skill: r.player.stats.skill,
      equipment: 1,
      burnout: 0,
      policy: structuredClone(a.policy!),
      monetization: 'none',
      appliedMonth: null,
      sponsor: null,
      totals: { platformIncome: 0, sponsorIncome: 0, cost: 0, published: 0 },
      recent: [],
    };
    const invalid = creatorPolicyReason(r, c, c.policy);
    if (invalid) throw Error(invalid);
    paySetup(r, c, designMoney(r, 40), 'Chuẩn bị thiết bị và chỗ làm nội dung');
    channels.push(c);
    message = `Bạn bắt đầu kênh ${PLATFORM_NAMES[platform]}. Chi phí thiết lập đã vào sổ; người xem chưa phải thu nhập.`;
  } else {
    const c = channels.find((c) => c.id === a.id);
    if (!c || c.owner !== r.id || c.status === 'closed')
      throw Error('Kênh không thuộc cuộc đời này hoặc đã khép lại.');
    switch (a.operation) {
      case 'policy': {
        const invalid = creatorPolicyReason(r, c, a.policy!);
        if (invalid) throw Error(invalid);
        if (JSON.stringify(c.policy) === JSON.stringify(a.policy))
          throw Error('Cách làm kênh chưa thay đổi.');
        c.policy = structuredClone(a.policy!);
        message = 'Bạn đổi nhịp và hướng nội dung; kết quả chỉ được tính khi tháng tiếp tục.';
        break;
      }
      case 'equipment':
        if (c.equipment >= 3) throw Error('Thiết bị đã ở bậc cao nhất của mô phỏng.');
        c.equipment++;
        paySetup(r, c, designMoney(r, 40 * c.equipment), 'Nâng thiết bị làm nội dung');
        c.quality = cap(c.quality + 10);
        message = 'Thiết bị tốt hơn giúp chất lượng, nhưng chi phí không bảo đảm lượt xem.';
        break;
      case 'apply':
        applyMonetization(r, c);
        message =
          'Kênh gửi xét điều kiện kiếm tiền trong mô phỏng; cần ít nhất hai tháng để có kết quả.';
        break;
      case 'pause':
        if (c.status !== 'active') throw Error('Kênh đã dừng.');
        c.status = 'paused';
        c.pauseReason = 'manual';
        message =
          'Bạn ngừng sản xuất, không thu hay chi cho kênh trong thời gian nghỉ. Khán giả có thể rời đi.';
        break;
      case 'resume': {
        const invalid = creatorPolicyReason(r, c, c.policy);
        if (invalid) throw Error(invalid);
        if (c.status !== 'paused' || c.burnout > 60 || r.finance.cash < creatorCosts(r, c.policy))
          throw Error('Cần hồi sức và đủ tiền sản xuất trước khi trở lại.');
        c.status = 'active';
        c.pauseReason = null;
        message =
          'Bạn trở lại làm nội dung; số người từng theo dõi không bảo đảm họ vẫn còn ở lại.';
        break;
      }
      case 'close':
        c.status = 'closed';
        c.closedMonth = r.month;
        c.pauseReason = null;
        c.sponsor = null;
        message = 'Bạn khép kênh và giữ sổ cũ. Chi phí thiết lập đã tiêu dùng không được hoàn lại.';
        break;
    }
  }
  r.actions.push(a);
  channelNote(r, message!);
  assertCreators(r);
  return r;
}
export function settleCreators(r: GameRun) {
  for (const c of r.creator?.channels ?? []) {
    if (c.status === 'closed') continue;
    if (c.settledThrough + 1 !== r.month) throw Error('Invariant: creator clock');
    const report: CreatorMonth = {
      month: r.month,
      audience: c.audience,
      gained: 0,
      lost: 0,
      published: 0,
      viral: false,
      platformIncome: 0,
      sponsorIncome: 0,
      cost: 0,
      profit: 0,
    };
    const cost = creatorCosts(r, c.policy);
    const invalid = creatorPolicyReason(r, c, c.policy);
    if (c.status === 'active' && (r.finance.cash < cost || c.burnout >= 90 || invalid)) {
      c.status = 'paused';
      c.pauseReason = r.finance.cash < cost ? 'funds' : c.burnout >= 90 ? 'burnout' : 'eligibility';
      channelNote(
        r,
        `Kênh ${PLATFORM_NAMES[c.platform]} tạm dừng: ${c.pauseReason === 'funds' ? 'chưa đủ tiền sản xuất' : c.pauseReason === 'burnout' ? 'cần hồi sức' : 'điều kiện nội dung đã đổi'}. Không tự vay hoặc trả thu nhập khi nghỉ.`,
      );
    }
    if (c.status === 'active') {
      const [roll, s1] = nextRandom(hashSeed(`${r.seed}:${c.id}:${r.month}:creator`)),
        [pay, s2] = nextRandom(s1),
        [review] = nextRandom(s2);
      let count =
        { light: 2, steady: 4, intense: 8 }[c.policy.rhythm] * (c.policy.format === 'live' ? 2 : 1);
      if (c.platform === 'youtube' && currentCareer(r) && c.policy.rhythm === 'intense')
        count = Math.max(1, count - 2);
      report.published = count;
      report.cost = cost;
      c.skill = cap(c.skill + 1);
      if (c.policy.focus === 'craft') c.quality = cap(c.quality + 2);
      if (c.policy.niche === 'gaming' && c.equipment >= 2) c.quality = cap(c.quality + 1);
      c.engagement = cap(
        c.engagement +
          Math.floor(roll * 5) -
          2 +
          (c.policy.focus === 'community' ? 2 : 0) -
          (c.burnout > 70 ? 2 : 0),
      );
      c.reputation = cap(
        c.reputation +
          (c.policy.focus === 'community' ? 1 : 0) +
          (c.quality > 70 && r.month % 3 === 0 ? 1 : 0) -
          (roll < 0.04 ? 5 : 0),
      );
      if (c.policy.format === 'live' && c.policy.niche === 'conversation')
        c.engagement = cap(c.engagement + 1);
      report.viral = roll < 0.008;
      report.gained = Math.floor(
        ((c.skill + c.quality) / 6) *
          count *
          (0.2 + roll) *
          (0.3 + c.quality / 100) *
          (0.5 + c.reputation / 100) *
          (c.policy.focus === 'reach' ? 1.3 : 1) *
          (report.viral ? 30 : 1),
      );
      const nicheFactor = {
        education: 0.7 + r.player.stats.knowledge / 150,
        entertainment: 0.7 + r.player.stats.mood / 150,
        conversation: 0.7 + r.player.stats.social / 150,
        gaming: 0.6 + c.skill / 150 + (c.equipment - 1) * 0.15,
        performance: 0.6 + (c.skill + r.player.stats.social) / 250,
        selling:
          0.8 +
          (r.enterprise?.ventures.find((e) => e.status === 'operating')?.reputation ?? 0) / 200,
      }[c.policy.niche];
      report.gained = Math.floor(report.gained * nicheFactor);
      report.lost = Math.min(
        c.audience,
        Math.floor(c.audience * (0.005 + (c.burnout > 70 ? 0.045 : 0) + (roll > 0.9 ? 0.02 : 0))),
      );
      c.audience = Math.max(0, Math.min(10_000_000, c.audience + report.gained - report.lost));
      if (c.monetization === 'pending' && r.month - c.appliedMonth! >= 2) {
        c.monetization = monetizationReady(r, c) && review < 0.8 ? 'approved' : 'rejected';
        channelNote(
          r,
          c.monetization === 'approved'
            ? 'Kênh được xét nhận thu nhập trong mô phỏng; từng tháng vẫn có thể không nhận đồng nào.'
            : 'Lượt xét kênh chưa đạt; có thể sửa nội dung và thử lại sau mười hai tháng tính từ lần nộp.',
        );
      }
      if (c.monetization === 'approved' && !monetizationReady(r, c)) c.monetization = 'rejected';
      if (c.monetization === 'approved' && pay >= 0.25)
        report.platformIncome = designMoney(
          r,
          Math.min(
            500,
            Math.floor(
              (c.audience / 1000) *
                (c.engagement / 100) *
                (c.quality / 100) *
                pay *
                (c.policy.format === 'live' ? 16 : 12),
            ),
          ),
        );
      if (c.sponsor) {
        report.sponsorIncome = c.sponsor.fee;
        if (--c.sponsor.remaining === 0) c.sponsor = null;
      }
      c.burnout = cap(
        c.burnout +
          { light: -2, steady: 1, intense: 5 }[c.policy.rhythm] +
          (c.policy.format === 'live' ? 1 : 0) +
          (currentCareer(r) ? 1 : 0) +
          (r.academics?.studies.some((s) => s.status === 'studying') ? 1 : 0) +
          (r.enterprise?.ventures.some((e) => e.status === 'operating') ? 1 : 0),
      );
      if (c.policy.niche === 'selling') {
        const book = r.enterprise?.ventures.find((e) => e.status === 'operating');
        if (book) book.reputation = cap(book.reputation + 1);
      }
      report.profit = report.platformIncome + report.sponsorIncome - report.cost;
      transact(r, `${c.id}:month:${r.month}`, 'Sản xuất và thu nhập kênh nội dung', {
        cash: report.profit,
      });
      c.totals.platformIncome += report.platformIncome;
      c.totals.sponsorIncome += report.sponsorIncome;
      c.totals.cost += report.cost;
      c.totals.published += report.published;
      if (r.month % 12 === 0)
        r.player.stats.stress = cap(
          r.player.stats.stress + Math.min(6, 1 + Math.floor(c.burnout / 25)),
        );
    } else {
      c.burnout = cap(c.burnout - 4);
      report.lost = Math.floor(c.audience * 0.01);
      c.audience -= report.lost;
    }
    report.audience = c.audience;
    c.recent.push(report);
    if (c.recent.length > 12) c.recent.shift();
    c.settledThrough = r.month;
  }
}
export function closeCreatorsAtEnd(r: GameRun) {
  for (const c of r.creator?.channels ?? [])
    if (c.status !== 'closed') {
      c.status = 'closed';
      c.closedMonth = r.month;
      c.pauseReason = null;
      c.sponsor = null;
      channelNote(
        r,
        `Kênh ${PLATFORM_NAMES[c.platform]} khép lại cùng cuộc đời, giữ số liệu và các chặng đã qua.`,
      );
    }
}
export const storyChannel = (r: GameRun) => r.creator?.channels.find((c) => c.status !== 'closed');
export function creatorSceneEligible(r: GameRun, id: string) {
  const c = storyChannel(r);
  if (!hasCreatorRules(r) || !c || r.month - r.creator!.lastSceneMonth < 12) return false;
  switch (id) {
    case 'cr-first':
      return c.totals.published > 0;
    case 'cr-slow':
      return r.month - c.startedMonth >= 12 && c.audience < 1000;
    case 'cr-viral':
      return c.recent.some((m) => m.viral);
    case 'cr-criticism':
      return c.reputation < 40;
    case 'cr-ready':
      return monetizationReady(r, c) && c.monetization === 'none';
    case 'cr-sponsor':
      return c.status === 'active' && c.audience >= 1500 && c.reputation >= 55 && !c.sponsor;
    case 'cr-burnout':
      return c.burnout >= 60;
    case 'cr-family':
      return r.player.stats.stress >= 60;
    case 'cr-return':
      return c.status === 'paused' && c.burnout <= 30;
    default:
      return false;
  }
}
export function applyCreatorStory(r: GameRun, operation: CreatorOperation) {
  const c = storyChannel(r);
  if (!c || !hasCreatorRules(r)) throw Error('Kênh không còn phù hợp với câu chuyện.');
  switch (operation) {
    case 'craft':
      c.quality = cap(c.quality + 5);
      c.skill = cap(c.skill + 3);
      c.policy.focus = 'craft';
      c.burnout = cap(c.burnout + 2);
      break;
    case 'community':
      c.engagement = cap(c.engagement + 5);
      c.reputation = cap(c.reputation + 4);
      c.policy.focus = 'community';
      r.player.stats.social = cap(r.player.stats.social + 2);
      break;
    case 'reach':
      c.policy.focus = 'reach';
      c.policy.rhythm = 'intense';
      c.burnout = cap(c.burnout + 5);
      r.player.stats.stress = cap(r.player.stats.stress + 3);
      break;
    case 'rest':
      c.status = 'paused';
      c.pauseReason = 'manual';
      c.burnout = cap(c.burnout - 10);
      r.player.stats.stress = cap(r.player.stats.stress - 5);
      break;
    case 'apply':
      applyMonetization(r, c);
      break;
    case 'accept':
      if (c.sponsor || c.status !== 'active' || c.audience < 1500 || c.reputation < 55)
        throw Error('Đề nghị hợp tác không còn phù hợp.');
      c.sponsor = { remaining: 3, fee: designMoney(r, 12) };
      c.burnout = cap(c.burnout + 5);
      break;
    case 'decline':
      c.reputation = cap(c.reputation + 2);
      r.player.stats.mood = cap(r.player.stats.mood + 3);
      break;
    case 'reflect':
      c.policy.rhythm = 'light';
      c.policy.focus = 'craft';
      r.player.stats.knowledge = cap(r.player.stats.knowledge + 3);
      c.burnout = cap(c.burnout - 3);
      break;
  }
  r.creator!.lastSceneMonth = r.month;
}
export function assertCreators(r: GameRun) {
  if (!hasCreatorRules(r)) {
    if (r.creator !== undefined) throw Error('Invariant: historical creator state');
    return;
  }
  const state = r.creator;
  if (
    !state ||
    state.channels.length + (r.enterprise?.ventures.length ?? 0) > 4 ||
    !integer(state.lastSceneMonth, -12, r.month)
  )
    throw Error('Invariant: creator state');
  for (const [i, c] of state.channels.entries()) {
    if (
      c.id !== `creator:${i}` ||
      c.owner !== r.id ||
      !['youtube', 'tiktok'].includes(c.platform) ||
      !integer(c.startedMonth, 216, r.month) ||
      !['active', 'paused', 'closed'].includes(c.status) ||
      ![null, 'manual', 'funds', 'burnout', 'eligibility'].includes(c.pauseReason) ||
      (c.status === 'paused') !== (c.pauseReason !== null) ||
      !['none', 'pending', 'approved', 'rejected'].includes(c.monetization) ||
      (c.monetization === 'none') !== (c.appliedMonth === null) ||
      (c.appliedMonth !== null && !integer(c.appliedMonth, c.startedMonth, r.month)) ||
      !integer(c.equipment, 1, 3) ||
      !integer(c.audience, 0, 10_000_000) ||
      [c.engagement, c.reputation, c.quality, c.skill, c.burnout].some(
        (n) => !integer(n, 0, 100),
      ) ||
      c.settledThrough !== (c.status === 'closed' ? c.closedMonth : r.month) ||
      (c.status === 'closed') !== (c.closedMonth !== null) ||
      (r.status === 'ended' && c.status !== 'closed') ||
      c.recent.length !== Math.min(12, c.settledThrough - c.startedMonth) ||
      (c.recent.length > 0 && c.recent.at(-1)!.month !== c.settledThrough) ||
      !creatorPolicySchema.safeParse(c.policy).success ||
      Object.values(c.totals).some((n) => !integer(n, 0, designMoney(r, 1_000_000_000)))
    )
      throw Error('Invariant: creator identity/clock/balance');
    if (
      r.finance.transactions
        .filter((t) => t.id.startsWith(c.id + ':'))
        .reduce((sum, t) => sum + t.cash, 0) !== channelProfit(c)
    )
      throw Error('Invariant: creator ledger reconciliation');
    if (
      c.recent.some(
        (m, j) =>
          !integer(m.month, c.startedMonth + 1, c.settledThrough) ||
          (j > 0 && m.month !== c.recent[j - 1].month + 1) ||
          [
            m.platformIncome,
            m.sponsorIncome,
            m.cost,
            m.audience,
            m.gained,
            m.lost,
            m.published,
          ].some((n) => !integer(n, 0, designMoney(r, 1_000_000_000))) ||
          m.profit !== m.platformIncome + m.sponsorIncome - m.cost,
      )
    )
      throw Error('Invariant: creator reports');
    if (c.sponsor && (!integer(c.sponsor.remaining, 1, 3) || c.sponsor.fee !== designMoney(r, 12)))
      throw Error('Invariant: creator sponsor');
  }
  if (
    state.channels.some((c) => c.status !== 'closed') &&
    ['business', 'freelance'].includes(currentCareer(r)?.id ?? '')
  )
    throw Error('Invariant: duplicate creator salary');
}
