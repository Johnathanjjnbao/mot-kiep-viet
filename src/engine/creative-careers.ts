import type { GameRun } from '../domain/model';
import {
  creativeActionSchema,
  type CreativeAction,
  type CreativeStoryOperation,
  type GamingChannel,
  type GamingPolicy,
  type CollabPeer,
  type CollabTerms,
  type CreatorCollaboration,
} from '../domain/creative-careers';
import type { CreatorChannel } from '../domain/creator-economy';
import { hasCreativeRules, discretionaryCount } from '../domain/rules';
import { designMoney, formatMoney } from '../domain/currency';
import { ageOf, currentCareer } from '../content/world';
import { peerById, COLLAB_CONDITIONS } from '../content/creative-peers';
import { hashSeed, nextRandom } from './random';
import { transact } from './finance';

const cap = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const roll = (r: GameRun, key: string) => nextRandom(hashSeed(`${r.seed}:creative:${key}`))[0];
const openCollab = (c: CreatorCollaboration) =>
  ['proposal', 'offered', 'working'].includes(c.status);
export const currentCollaboration = (r: GameRun) => r.creative?.collaborations.find(openCollab);
export const gamingChannel = (r: GameRun) =>
  r.creator?.channels.find((c) => c.id === r.creative?.gaming?.channelId);
export const gamingNet = (r: GameRun) => {
  const g = r.creative?.gaming;
  return g ? g.totals.prizes - g.totals.entries - g.totals.training : 0;
};
export function initCreativeCareers(r: GameRun) {
  if (hasCreativeRules(r))
    r.creative = { owner: r.id, settledThrough: 0, gaming: null, collaborations: [], artist: null };
}
function note(r: GameRun, text: string) {
  r.journal.push({
    id: `journal:${r.journal.length}`,
    month: r.month,
    title: 'Một chặng sáng tạo',
    text,
    category: 'career',
  });
  r.lastOutcome = text;
}
export function creativeReason(r: GameRun): string | null {
  if (!hasCreativeRules(r) || !r.creative)
    return 'Cuộc đời này giữ luật trước nhánh nghề sáng tạo độc lập.';
  if (r.status !== 'playing' || ageOf(r) < 18) return 'Nhánh nghề độc lập mở từ 18 tuổi.';
  if (
    r.social?.focus ||
    r.family?.focus ||
    r.academics?.focus ||
    (r.activeEvent && /^(biz-|cr-|fl-|ar-)/.test(r.activeEvent.id))
  )
    return 'Hãy giải quyết câu chuyện đang chờ trước khi đổi nhánh sáng tạo.';
  if (discretionaryCount(r) >= 120) return 'Đã dùng hết lượt quản lý; hãy tiếp tục câu chuyện.';
  return null;
}
export function gamingStartReason(r: GameRun, c: GamingChannel): string | null {
  const reason = creativeReason(r);
  if (reason) return reason;
  if (r.creative!.gaming) return 'Mỗi đời giữ một đường gaming có hồ sơ riêng, kể cả khi đã nghỉ.';
  if (
    c.status !== 'active' ||
    c.policy.niche !== 'gaming' ||
    c.policy.format !== 'live' ||
    c.equipment < 2
  )
    return 'Cần kênh trò chơi đang LIVE với thiết bị bậc 2; dùng chung khán giả và tiền nền tảng của kênh ấy.';
  if (['business', 'freelance'].includes(currentCareer(r)?.id ?? ''))
    return 'Hãy rời lương khoán kinh doanh/tự do trước khi theo nghề có sổ riêng.';
  return null;
}
export function gamingMonthlyCost(r: GameRun, policy: GamingPolicy) {
  return designMoney(r, { practice: 3, community: 2, competition: 5, rest: 0 }[policy]);
}
export function gamingContestReason(r: GameRun): string | null {
  const g = r.creative?.gaming,
    c = gamingChannel(r);
  if (
    !g ||
    g.status !== 'active' ||
    !c ||
    c.status !== 'active' ||
    c.policy.niche !== 'gaming' ||
    c.policy.format !== 'live'
  )
    return 'Cần đang theo nghề và phát trò chơi trên kênh gắn với hồ sơ.';
  if (g.skill < 35 || g.community < 15)
    return 'Cần 35 kỹ năng trò chơi và 15 gắn kết cộng đồng để vào giải.';
  if (g.fatigue >= 75) return 'Cần hồi sức trước khi nhận thêm lịch thi đấu.';
  if (g.rounds.length >= 8) return 'Đã theo đủ tám kỳ thi đấu chi tiết trong đời.';
  if (
    g.rounds.some((x) => x.result === 'pending') ||
    (g.rounds.at(-1) && r.month - g.rounds.at(-1)!.enteredMonth < 12)
  )
    return 'Mỗi năm chỉ theo một kỳ thi đấu; hãy chờ kỳ hiện tại khép.';
  if (r.finance.cash < designMoney(r, 12)) return 'Cần phí dự giải từ tiền của bạn; không tự vay.';
  return null;
}
function enterContest(r: GameRun) {
  const reason = gamingContestReason(r);
  if (reason) throw Error(reason);
  const g = r.creative!.gaming!,
    id = `gaming:round:${g.rounds.length}`,
    fee = designMoney(r, 12);
  transact(r, id + ':entry', 'Phí dự kỳ thi đấu trò chơi', { cash: -fee });
  g.totals.entries += fee;
  g.rounds.push({
    id,
    enteredMonth: r.month,
    dueMonth: r.month + 6,
    resolvedMonth: null,
    entryFee: fee,
    prize: 0,
    result: 'pending',
  });
  note(
    r,
    'Bạn nhận lịch một kỳ thi đấu. Phí dự giải đã chi; kỹ năng và thể lực vẫn có thể khiến bạn dừng sớm, không có giải thưởng chắc chắn.',
  );
}
function gamingPolicy(r: GameRun, policy: GamingPolicy, story = false) {
  const g = r.creative?.gaming;
  if (!g || g.status === 'retired') throw Error('Đường gaming này đã khép hoặc chưa bắt đầu.');
  const c = gamingChannel(r);
  if (
    policy !== 'rest' &&
    (!c || c.status !== 'active' || c.policy.niche !== 'gaming' || c.policy.format !== 'live')
  )
    throw Error('Hãy mở lại kênh trò chơi LIVE trước khi trở lại tập luyện.');
  g.policy = policy;
  g.status = policy === 'rest' ? 'resting' : 'active';
  if (story) {
    if (policy === 'practice') {
      g.skill = cap(g.skill + 3);
      r.player.stats.stress = cap(r.player.stats.stress + 2);
    } else if (policy === 'community') {
      g.community = cap(g.community + 4);
      g.retention = cap(g.retention + 1);
      r.player.stats.stress = cap(r.player.stats.stress + 1);
    } else if (policy === 'competition') {
      g.retention = cap(g.retention + 4);
      g.skill = cap(g.skill + 1);
      g.fatigue = cap(g.fatigue + 3);
    } else {
      g.fatigue = cap(g.fatigue - 8);
      r.player.stats.stress = cap(r.player.stats.stress - 2);
    }
  }
  note(
    r,
    policy === 'rest'
      ? 'Bạn để lịch tập nghỉ. Kênh vẫn có lịch sản xuất riêng; muốn ngừng cả phát và chi sản xuất, hãy tạm dừng kênh.'
      : `Bạn chọn nhịp ${policy === 'practice' ? 'luyện kỹ năng' : policy === 'community' ? 'chăm cộng đồng' : 'chuẩn bị thi đấu và giữ người xem'}. Chi phí tập tách khỏi chi sản xuất kênh, không thêm một nguồn thu nền tảng thứ hai.`,
  );
}
function retireGaming(r: GameRun) {
  const g = r.creative?.gaming;
  if (!g || g.status === 'retired') throw Error('Chưa có đường gaming đang theo.');
  g.status = 'retired';
  g.policy = 'rest';
  g.endedMonth = r.month;
  for (const round of g.rounds)
    if (round.result === 'pending') {
      round.result = 'cancelled';
      round.resolvedMonth = r.month;
    }
  note(
    r,
    'Bạn khép lịch gaming độc lập. Chi phí và kỳ thi cũ vẫn giữ; kênh có thể tiếp tục với nội dung khác, không được cấp lại giải thưởng.',
  );
}
export function collaborationReason(
  r: GameRun,
  c: CreatorChannel,
  peer: CollabPeer,
): string | null {
  const reason = creativeReason(r);
  if (reason) return reason;
  if (r.creative!.collaborations.length >= 6)
    return 'Đã theo đủ sáu cuộc hợp tác chi tiết, gồm cuộc không thành.';
  if (currentCollaboration(r)) return 'Hãy khép cuộc hợp tác đang theo trước khi mời thêm.';
  if (c.status !== 'active' || r.month - c.startedMonth < 12 || c.skill < 20)
    return 'Cần kênh hoạt động ít nhất một năm và 20 kỹ năng nội dung.';
  if (c.reputation < peerById(peer).minReputation)
    return `Đối tác cần ít nhất ${peerById(peer).minReputation} uy tín kênh.`;
  if (r.finance.cash < designMoney(r, 1)) return 'Cần phí chuẩn bị lời mời từ tiền cá nhân.';
  return null;
}
function closeCollab(
  r: GameRun,
  c: CreatorCollaboration,
  status: 'settled' | 'rejected' | 'cancelled',
  text: string,
) {
  c.status = status;
  c.closedMonth = r.month;
  c.outcome = text;
  note(r, text);
}
function quoteCollab(r: GameRun, c: CreatorCollaboration, terms: CollabTerms) {
  if (c.status !== 'proposal') throw Error('Chỉ đề nghị điều kiện một lần cho lời mời mới.');
  const channel = r.creator!.channels.find((x) => x.id === c.channelId)!;
  c.terms = terms;
  const chance = Math.max(
    15,
    Math.min(
      85,
      20 +
        c.compatibility / 3 +
        channel.reputation / 5 +
        channel.skill / 10 +
        COLLAB_CONDITIONS[terms].acceptance,
    ),
  );
  if (roll(r, c.id + ':offer:' + terms) * 100 >= chance) {
    closeCollab(
      r,
      c,
      'rejected',
      'Đối tác chưa chọn lời mời. Phí chuẩn bị đã chi; không có khán giả hoặc khoản thu được cộng thêm.',
    );
    return;
  }
  c.status = 'offered';
  c.dueMonth = r.month + 24;
  note(
    r,
    `Đối tác nhận trao đổi theo điều kiện “${COLLAB_CONDITIONS[terms].name}”. Cần tự chi phần sản xuất trước khi bắt đầu; lượt xem chưa thay đổi.`,
  );
}
function acceptCollab(r: GameRun, c: CreatorCollaboration) {
  if (c.status !== 'offered' || !c.terms) throw Error('Chưa có điều kiện hợp tác được chọn.');
  const channel = r.creator!.channels.find((x) => x.id === c.channelId)!;
  if (channel.status !== 'active') throw Error('Kênh cần hoạt động trước khi nhận lịch chung.');
  const cost = designMoney(r, COLLAB_CONDITIONS[c.terms].cost);
  if (r.finance.cash < cost)
    throw Error('Tiền cá nhân chưa đủ chi sản xuất chung; chưa nhận lịch và không tự vay.');
  transact(r, c.id + ':production', 'Chi phần sản xuất nội dung hợp tác', { cash: -cost });
  c.cost += cost;
  c.status = 'working';
  c.dueMonth = r.month + 6;
  c.quality = cap(
    (channel.skill + channel.quality + c.compatibility) / 3 +
      COLLAB_CONDITIONS[c.terms].quality -
      channel.burnout / 6,
  );
  note(
    r,
    'Bạn nhận lịch làm chung trong sáu tháng thiết kế. Hai bên đã chia công; phí đã chi và hiệu quả có thể âm, bằng không hoặc tăng người xem.',
  );
}
function ownedCollab(r: GameRun, id: string) {
  const c = r.creative!.collaborations.find((x) => x.id === id);
  if (!c) throw Error('Không có hồ sơ hợp tác của cuộc đời này.');
  return c;
}
export function requestCreative(input: GameRun, raw: CreativeAction): GameRun {
  const parsed = creativeActionSchema.safeParse(raw);
  if (!parsed.success) throw Error('Thao tác sáng tạo không hợp lệ.');
  const a = parsed.data;
  if (a.expected !== input.actions.length) throw Error('Thao tác thuộc bản cũ; hãy mở lại hồ sơ.');
  const reason = creativeReason(input);
  if (reason) throw Error(reason);
  const r = structuredClone(input),
    f = r.creative!;
  if (a.operation === 'gaming-start') {
    const c = r.creator?.channels.find((x) => x.id === a.channelId);
    if (!c) throw Error('Không có kênh thuộc cuộc đời này.');
    const why = gamingStartReason(r, c);
    if (why) throw Error(why);
    f.gaming = {
      channelId: c.id,
      startedMonth: r.month,
      endedMonth: null,
      status: 'active',
      policy: 'practice',
      skill: cap(Math.min(30, (r.player.stats.skill + c.skill) / 3)),
      community: cap(Math.min(25, c.engagement / 3)),
      retention: 20,
      fatigue: 0,
      totals: { training: 0, entries: 0, prizes: 0 },
      rounds: [],
      recent: [],
    };
    note(
      r,
      'Bạn theo nghề chơi và phát trực tiếp trên kênh đang có. Hồ sơ giữ kỹ năng, cộng đồng và thi đấu; người xem và tiền nền tảng vẫn chỉ ở một sổ kênh.',
    );
  } else if (a.operation === 'gaming-policy') gamingPolicy(r, a.policy!);
  else if (a.operation === 'gaming-contest') enterContest(r);
  else if (a.operation === 'gaming-retire') retireGaming(r);
  else if (a.operation === 'collab-inquire') {
    const c = r.creator?.channels.find((x) => x.id === a.channelId);
    if (!c) throw Error('Không có kênh thuộc cuộc đời này.');
    const why = collaborationReason(r, c, a.peer!);
    if (why) throw Error(why);
    const id = `collab:${f.collaborations.length}`,
      peer = peerById(a.peer!),
      cost = designMoney(r, 1);
    transact(r, id + ':preparation', 'Chuẩn bị lời mời hợp tác nội dung', { cash: -cost });
    const compatible =
      c.policy.niche === peer.niche
        ? 85
        : [c.policy.niche, peer.niche].includes('conversation')
          ? 65
          : [c.policy.niche, peer.niche].includes('entertainment')
            ? 70
            : 45;
    f.collaborations.push({
      id,
      channelId: c.id,
      peer: a.peer!,
      createdMonth: r.month,
      status: 'proposal',
      terms: null,
      dueMonth: r.month + 24,
      closedMonth: null,
      overlap: Math.floor(roll(r, id + ':overlap') * 81) + 10,
      compatibility: compatible,
      quality: 0,
      audienceDelta: 0,
      cost,
      outcome: '',
    });
    note(
      r,
      `Bạn gửi lời hỏi tới ${peer.name}. Đây là đối tác hư cấu; uy tín, chủ đề, phần khán giả trùng và điều kiện chia công ảnh hưởng kết quả.`,
    );
  } else {
    const c = ownedCollab(r, a.id!);
    if (a.operation === 'collab-negotiate') quoteCollab(r, c, a.terms!);
    else if (a.operation === 'collab-accept') acceptCollab(r, c);
    else {
      if (!openCollab(c)) throw Error('Cuộc hợp tác đã khép.');
      closeCollab(
        r,
        c,
        'cancelled',
        'Bạn khép lời hẹn hợp tác; chi phí đã chi vẫn giữ, không cộng lượt xem hoặc tiền công chưa có.',
      );
    }
  }
  r.actions.push(a);
  return r;
}
/** Called once per month before creator settlement. Training has its own cost, never a platform payout. */
export function settleCreativeCareers(r: GameRun) {
  if (!hasCreativeRules(r)) return;
  const f = r.creative!;
  if (f.settledThrough + 1 !== r.month) throw Error('Invariant: creative clock');
  const g = f.gaming,
    c = gamingChannel(r);
  if (g && g.status !== 'retired') {
    let cost = 0;
    if (!c || c.status === 'closed') {
      retireGaming(r);
    } else if (g.status === 'active') {
      cost = gamingMonthlyCost(r, g.policy);
      if (
        c.status !== 'active' ||
        c.policy.niche !== 'gaming' ||
        c.policy.format !== 'live' ||
        g.fatigue >= 85 ||
        r.finance.cash < cost
      ) {
        g.status = 'resting';
        g.policy = 'rest';
        cost = 0;
        note(
          r,
          'Lịch gaming tạm nghỉ vì kênh, thể lực hoặc tiền tập chưa phù hợp. Không tự vay và không trả thu nhập khi nghỉ.',
        );
      } else {
        transact(r, `gaming:training:${r.month}`, 'Luyện tập và chăm cộng đồng trò chơi', {
          cash: -cost,
        });
        g.totals.training += cost;
        g.skill = cap(g.skill + (g.policy === 'practice' ? 2 : 1));
        g.community = cap(g.community + (g.policy === 'community' ? 2 : 0));
        g.retention = cap(
          g.retention + (g.policy === 'community' || g.policy === 'competition' ? 1 : 0),
        );
        g.fatigue = cap(
          g.fatigue +
            (g.policy === 'competition' ? 3 : g.policy === 'practice' ? 2 : 1) +
            (currentCareer(r) ? 1 : 0),
        );
      }
    }
    if (g.status === 'resting') {
      g.fatigue = cap(g.fatigue - 5);
      g.community = cap(g.community - (r.month % 6 === 0 ? 1 : 0));
    }
    for (const round of g.rounds.filter((x) => x.result === 'pending' && x.dueMonth <= r.month)) {
      const score =
        g.skill * 0.6 +
        g.retention * 0.2 +
        g.community * 0.2 -
        g.fatigue / 4 +
        (roll(r, round.id + ':result') - 0.5) * 45;
      round.result = score >= 70 ? 'won' : score >= 48 ? 'placed' : 'lost';
      round.resolvedMonth = r.month;
      round.prize =
        round.result === 'won'
          ? designMoney(r, 45)
          : round.result === 'placed'
            ? designMoney(r, 15)
            : 0;
      if (round.prize) {
        transact(r, round.id + ':prize', 'Giải thưởng kỳ thi đấu trò chơi', { cash: round.prize });
        g.totals.prizes += round.prize;
      }
      if (c && c.status !== 'closed')
        c.reputation = cap(
          c.reputation + (round.result === 'won' ? 3 : round.result === 'lost' ? -2 : 1),
        );
      note(
        r,
        round.prize
          ? `Kỳ thi khép với ${formatMoney(round.prize, r)} giải thưởng thực nhận. Đây là tiền giải một lần, không phải lần trả thu nhập nền tảng thứ hai.`
          : 'Kỳ thi khép mà không có giải thưởng. Phí dự giải đã chi; bạn giữ kinh nghiệm và có thể hồi sức trước kỳ khác.',
      );
    }
    g.recent.push({
      month: r.month,
      skill: g.skill,
      community: g.community,
      retention: g.retention,
      fatigue: g.fatigue,
      cost,
    });
    if (g.recent.length > 12) g.recent.shift();
  }
  for (const x of f.collaborations.filter(openCollab)) {
    const channel = r.creator!.channels.find((y) => y.id === x.channelId)!;
    if (channel.status === 'closed') {
      closeCollab(
        r,
        x,
        'cancelled',
        'Kênh đã khép trước khi hoàn thành lời hẹn. Chi phí giữ nguyên, không cộng thu hoặc khán giả.',
      );
      continue;
    }
    if (r.month < x.dueMonth) continue;
    if (x.status !== 'working') {
      closeCollab(
        r,
        x,
        'cancelled',
        'Lời hẹn đã qua kỳ trao đổi; chưa nhận sản xuất và không cộng người xem hay thu nhập.',
      );
      continue;
    }
    if (channel.status !== 'active') {
      closeCollab(
        r,
        x,
        'cancelled',
        'Kênh đang nghỉ nên nội dung chung chưa ra mắt. Chi phí đã làm giữ trong sổ; không cộng khán giả.',
      );
      continue;
    }
    const terms = COLLAB_CONDITIONS[x.terms!],
      value =
        x.quality +
        channel.reputation / 8 -
        x.overlap / 4 -
        terms.risk +
        (roll(r, x.id + ':result') - 0.5) * 70;
    const limit = Math.min(2500, Math.floor(channel.audience * 0.12) + 25);
    const proposed =
      value < 35
        ? -Math.min(limit, Math.floor(channel.audience * 0.04))
        : value < 63
          ? 0
          : Math.min(limit, Math.floor((limit * (1 - x.overlap / 100) * (value - 55)) / 60));
    const after = Math.max(0, Math.min(10_000_000, channel.audience + proposed));
    x.audienceDelta = after - channel.audience;
    channel.audience = after;
    channel.reputation = cap(
      channel.reputation + (x.audienceDelta > 0 ? 2 : x.audienceDelta < 0 ? -5 : 0),
    );
    closeCollab(
      r,
      x,
      'settled',
      x.audienceDelta > 0
        ? `Nội dung chung đem thêm ${x.audienceDelta} người xem theo dõi kênh. Không có phí hợp tác tự sinh; nếu được xét, tiền nền tảng vẫn theo lịch kênh.`
        : x.audienceDelta < 0
          ? `Cách làm chung chưa hợp với khán giả, kênh giảm ${-x.audienceDelta} người theo dõi. Chi phí đã chi vẫn giữ.`
          : 'Nội dung chung đến phần lớn người xem trùng; số theo dõi không đổi. Công và chi phí đã bỏ ra chưa chắc tạo tăng trưởng.',
    );
  }
  f.settledThrough = r.month;
}
/** Null for every historical ruleset and for channels outside the linked gaming career. */
export function gamingEffects(r: GameRun, c: CreatorChannel) {
  const g = r.creative?.gaming;
  return hasCreativeRules(r) &&
    g &&
    g.status === 'active' &&
    g.channelId === c.id &&
    c.policy.niche === 'gaming' &&
    c.policy.format === 'live'
    ? {
        gain: 0.8 + g.skill / 250 + g.community / 400,
        loss: 1.2 - g.retention / 200,
        quality: g.skill >= 50 ? 1 : 0,
        engagement: g.community >= 40 ? 1 : 0,
        burnout: g.fatigue >= 70 ? 2 : 0,
      }
    : null;
}
export function creativeSceneEligible(r: GameRun, id: string) {
  if (!hasCreativeRules(r) || !r.creative || ageOf(r) < 18) return false;
  const g = r.creative.gaming,
    c = gamingChannel(r),
    x = currentCollaboration(r),
    last = r.creative.collaborations.at(-1);
  if (id.startsWith('gm-')) {
    if (!g || g.status === 'retired' || !c || c.status === 'closed') return false;
    if (id === 'gm-burnout') return g.status === 'resting' || g.fatigue >= 60;
    if (id === 'gm-round')
      return g.rounds.some((z) => z.result === 'pending') || !gamingContestReason(r);
    if (id === 'gm-long-path') return r.month - g.startedMonth >= 120;
    return (
      g.status === 'active' &&
      c.status === 'active' &&
      c.policy.niche === 'gaming' &&
      c.policy.format === 'live'
    );
  }
  if (id === 'co-proposal') return x?.status === 'proposal';
  if (id === 'co-offered') return x?.status === 'offered';
  if (id === 'co-working') return x?.status === 'working';
  if (id === 'co-result') return !x && !!last?.closedMonth && r.month - last.closedMonth < 24;
  return false;
}
export function applyCreativeStory(r: GameRun, operation: CreativeStoryOperation) {
  if (!hasCreativeRules(r)) throw Error('Cảnh sáng tạo không đúng ruleset.');
  if (operation.startsWith('gaming-')) {
    const g = r.creative?.gaming,
      c = gamingChannel(r);
    if (!g || g.status === 'retired') throw Error('Cảnh gaming không đúng hồ sơ.');
    if (operation === 'gaming-retire') retireGaming(r);
    else if (operation === 'gaming-contest') {
      const why = gamingContestReason(r);
      if (why) note(r, why + ' Bạn giữ lịch hiện tại, chưa mất phí dự giải.');
      else enterContest(r);
    } else if (
      operation !== 'gaming-rest' &&
      (!c || c.status !== 'active' || c.policy.niche !== 'gaming' || c.policy.format !== 'live')
    )
      note(
        r,
        'Bạn ghi lại nhịp muốn trở lại. Kênh chưa đủ điều kiện phát nên lịch tập vẫn nghỉ; chưa thu thêm tiền.',
      );
    else
      gamingPolicy(
        r,
        operation === 'gaming-practice'
          ? 'practice'
          : operation === 'gaming-community'
            ? 'community'
            : operation === 'gaming-retention'
              ? 'competition'
              : 'rest',
        true,
      );
  } else {
    const c = currentCollaboration(r);
    if (!c) {
      note(
        r,
        'Bạn giữ lại kết quả cuộc hợp tác cũ để xét lời hẹn sau. Không cộng lại khán giả hoặc khoản thu đã ghi.',
      );
      return;
    }
    if (['collab-balanced', 'collab-flexible', 'collab-exclusive'].includes(operation)) {
      if (c.status !== 'proposal') {
        note(r, 'Điều kiện hợp tác đã được trao đổi; không gửi lại hoặc cộng hiệu quả lần nữa.');
        return;
      }
      quoteCollab(r, c, operation.slice(7) as CollabTerms);
    } else if (operation === 'collab-accept') {
      if (c.status !== 'offered') {
        note(r, 'Chưa có lời hẹn để nhận. Bạn chưa chi phần sản xuất.');
        return;
      }
      const channel = r.creator!.channels.find((x) => x.id === c.channelId)!;
      if (
        channel.status !== 'active' ||
        r.finance.cash < designMoney(r, COLLAB_CONDITIONS[c.terms!].cost)
      ) {
        note(r, 'Kênh hoặc quỹ chưa đủ để nhận lịch; lời hẹn vẫn chờ, không tự vay.');
        return;
      }
      acceptCollab(r, c);
    } else if (operation === 'collab-cancel')
      closeCollab(
        r,
        c,
        'cancelled',
        'Bạn khép lời hẹn sau khi trao đổi; giữ chi phí đã chi và không cộng khoản thu chưa có.',
      );
    else if (operation === 'collab-polish' && c.status === 'working') {
      const cost = designMoney(r, 2);
      if (r.finance.cash < cost) {
        note(r, 'Bạn ghi lại việc cần soát; chưa đủ tiền cho vòng dựng thêm và không tự vay.');
        return;
      }
      transact(r, c.id + ':polish:' + r.month, 'Soát bản dựng chung', { cash: -cost });
      c.cost += cost;
      c.quality = cap(c.quality + 8);
      r.player.stats.stress = cap(r.player.stats.stress + 2);
      note(
        r,
        'Bạn trả thêm chi phí soát bản dựng chung, tăng độ chỉn chu nhưng chưa chắc tăng người xem.',
      );
    } else if (operation === 'collab-protect' && c.status === 'working') {
      c.quality = cap(c.quality + 2);
      r.player.stats.stress = cap(r.player.stats.stress + 1);
      note(
        r,
        'Bạn rà lại nguồn và phần ghi công với đối tác. Chất lượng tăng nhẹ; quyền đã thống nhất và kỳ hẹn vẫn giữ.',
      );
    } else
      note(
        r,
        'Bạn giữ liên lạc theo lịch đã hẹn. Chưa cộng người xem hoặc tiền trước khi nội dung có kết quả.',
      );
  }
}
export function closeCreativeAtEnd(r: GameRun) {
  if (!r.creative) return;
  if (r.creative.gaming && r.creative.gaming.status !== 'retired') retireGaming(r);
  for (const c of r.creative.collaborations.filter(openCollab))
    closeCollab(
      r,
      c,
      'cancelled',
      'Cuộc đời đã khép; lịch chung dừng ở phần đã làm. Giữ chi phí và không trả khoản thu chưa có.',
    );
}
export function assertCreativeCareers(r: GameRun) {
  const f = r.creative;
  if (!hasCreativeRules(r)) {
    if (f !== undefined) throw Error('Invariant: legacy creative careers');
    return;
  }
  const int = (n: number, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    Number.isSafeInteger(n) && n >= min && n <= max;
  if (
    !f ||
    f.owner !== r.id ||
    f.settledThrough !== r.month ||
    !Array.isArray(f.collaborations) ||
    f.collaborations.length > 6 ||
    f.collaborations.filter(openCollab).length > 1
  )
    throw Error('Invariant: creative ownership/clock/bounds');
  const g = f.gaming;
  if (g) {
    const c = gamingChannel(r);
    if (
      !c ||
      !int(g.startedMonth, 216, r.month) ||
      !['active', 'resting', 'retired'].includes(g.status) ||
      !['practice', 'community', 'competition', 'rest'].includes(g.policy) ||
      [g.skill, g.community, g.retention, g.fatigue].some((n) => !int(n, 0, 100)) ||
      g.rounds.length > 8 ||
      g.recent.length > 12 ||
      !Object.values(g.totals).every((n) => int(n))
    )
      throw Error('Invariant: gaming career');
    if (
      (g.status === 'retired') !== (g.endedMonth !== null) ||
      (g.endedMonth !== null && !int(g.endedMonth, g.startedMonth, r.month)) ||
      (g.status === 'resting' && g.policy !== 'rest')
    )
      throw Error('Invariant: gaming status');
    const training = r.finance.transactions.filter((t) => t.id.startsWith('gaming:training:'));
    if (
      training.some((t) => t.cash >= 0 || t.savings || t.debt || t.assets) ||
      -training.reduce((n, t) => n + t.cash, 0) !== g.totals.training
    )
      throw Error('Invariant: gaming training ledger');
    let entries = 0,
      prizes = 0;
    for (const [i, x] of g.rounds.entries()) {
      if (
        x.id !== `gaming:round:${i}` ||
        !int(x.enteredMonth, g.startedMonth, r.month) ||
        x.dueMonth !== x.enteredMonth + 6 ||
        !int(x.entryFee) ||
        !int(x.prize) ||
        !['pending', 'won', 'placed', 'lost', 'cancelled'].includes(x.result) ||
        (x.result === 'pending') !== (x.resolvedMonth === null) ||
        (x.resolvedMonth !== null && !int(x.resolvedMonth, x.enteredMonth, r.month))
      )
        throw Error('Invariant: gaming round');
      const posts = r.finance.transactions.filter((t) => t.id.startsWith(x.id + ':')),
        entry = posts.filter((t) => t.id === x.id + ':entry'),
        paid = posts.filter((t) => t.id === x.id + ':prize');
      if (
        entry.length !== 1 ||
        entry[0].cash !== -x.entryFee ||
        paid.length !== (x.prize ? 1 : 0) ||
        (x.prize && paid[0].cash !== x.prize) ||
        posts.some((t) => t.savings || t.debt || t.assets) ||
        posts.length !== entry.length + paid.length
      )
        throw Error('Invariant: gaming round ledger');
      entries += x.entryFee;
      prizes += x.prize;
    }
    if (
      entries !== g.totals.entries ||
      prizes !== g.totals.prizes ||
      g.rounds.filter((x) => x.result === 'pending').length > 1 ||
      g.recent.some(
        (x) =>
          !int(x.month, g.startedMonth, r.month) ||
          [x.skill, x.community, x.retention, x.fatigue].some((n) => !int(n, 0, 100)) ||
          !int(x.cost),
      )
    )
      throw Error('Invariant: gaming totals/recent');
  }
  for (const [i, x] of f.collaborations.entries()) {
    const c = r.creator?.channels.find((y) => y.id === x.channelId);
    if (
      !c ||
      x.id !== `collab:${i}` ||
      !['patient-teacher', 'club-host', 'stage-editor'].includes(x.peer) ||
      !['proposal', 'offered', 'working', 'settled', 'rejected', 'cancelled'].includes(x.status) ||
      !int(x.createdMonth, 216, r.month) ||
      !int(x.dueMonth, x.createdMonth) ||
      [x.compatibility, x.overlap, x.quality].some((n) => !int(n, 0, 100)) ||
      !int(x.cost) ||
      !int(x.audienceDelta, -10_000_000, 2500) ||
      openCollab(x) !== (x.closedMonth === null) ||
      (x.closedMonth !== null && !int(x.closedMonth, x.createdMonth, r.month)) ||
      (x.terms !== null && !['balanced', 'flexible', 'exclusive'].includes(x.terms))
    )
      throw Error('Invariant: collaboration record');
    const posts = r.finance.transactions.filter((t) => t.id.startsWith(x.id + ':'));
    if (
      posts.some((t) => t.cash >= 0 || t.savings || t.debt || t.assets) ||
      -posts.reduce((n, t) => n + t.cash, 0) !== x.cost ||
      posts.filter((t) => t.id === x.id + ':preparation').length !== 1 ||
      posts.filter((t) => t.id === x.id + ':production').length > 1
    )
      throw Error('Invariant: collaboration ledger');
    if (x.status !== 'settled' && x.audienceDelta !== 0)
      throw Error('Invariant: collaboration premature audience');
  }
  for (const t of r.finance.transactions) {
    if (t.id.startsWith('gaming:') && !g) throw Error('Invariant: orphan gaming posting');
    if (t.id.startsWith('collab:') && !f.collaborations.some((x) => t.id.startsWith(x.id + ':')))
      throw Error('Invariant: orphan collaboration posting');
  }
}
