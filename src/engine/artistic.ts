import type { GameRun } from '../domain/model';
import {
  artisticActionSchema,
  type ArtisticAction,
  type ArtisticCareer,
  type ArtPolicy,
  type AgencyTerms,
  type ArtStoryOperation,
} from '../domain/artistic';
import { hasCreativeRules, detailedBooks, discretionaryCount } from '../domain/rules';
import { designMoney, formatMoney } from '../domain/currency';
import { ageOf, currentCareer } from '../content/world';
import { hashSeed, nextRandom } from './random';
import { transact } from './finance';
const cap = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const roll = (r: GameRun, key: string) => nextRandom(hashSeed(`${r.seed}:artist:${key}`))[0];
export const ART_NAMES = { music: 'Âm nhạc', dance: 'Vũ đạo', acting: 'Diễn xuất' };
export const ART_POLICY_NAMES: Record<ArtPolicy, string> = {
  technique: 'Luyện nền tảng',
  stage: 'Tập và diễn sân khấu',
  community: 'Tiết mục và người xem',
  rest: 'Nghỉ tập và diễn',
};
export const AGENCY_CONDITIONS: Record<
  AgencyTerms,
  { name: string; share: number; bonus: number }
> = {
  balanced: { name: 'Lịch vừa sức · chia 30% phí show', share: 30, bonus: 0 },
  'fast-track': { name: 'Lịch dồn hơn · chia 45% phí show', share: 45, bonus: 8 },
};
export const artisticNet = (p: ArtisticCareer) =>
  p.totals.received - p.totals.training - p.totals.stage - p.totals.audition - p.totals.comeback;
export const artisticMonthlyCost = (r: GameRun, policy: ArtPolicy) =>
  designMoney(r, { technique: 2, stage: 4, community: 3, rest: 0 }[policy]);
const pending = (p: ArtisticCareer) =>
  p.auditions.find((x) => x.result === 'pending' || x.result === 'offered');
function note(r: GameRun, text: string) {
  r.journal.push({
    id: `journal:${r.journal.length}`,
    month: r.month,
    title: 'Một chặng biểu diễn',
    text,
    category: 'career',
  });
  r.lastOutcome = text;
}
export function artisticReason(r: GameRun): string | null {
  if (!hasCreativeRules(r) || !r.creative)
    return 'Cuộc đời này giữ luật trước hồ sơ biểu diễn độc lập.';
  if (r.status !== 'playing' || ageOf(r) < 18)
    return 'Học nghề và tự nhận lịch biểu diễn mở từ 18 tuổi.';
  if (
    r.social?.focus ||
    r.family?.focus ||
    r.academics?.focus ||
    (r.activeEvent && /^(biz-|cr-|fl-|gm-|co-)/.test(r.activeEvent.id))
  )
    return 'Hãy hoàn tất câu chuyện đang chờ trước khi đổi hồ sơ biểu diễn.';
  if (discretionaryCount(r) >= 120) return 'Đã dùng hết lượt quản lý; hãy tiếp tục câu chuyện.';
  return null;
}
export function artisticStartReason(r: GameRun): string | null {
  const reason = artisticReason(r);
  if (reason) return reason;
  if (r.creative!.artist)
    return 'Mỗi đời theo một chuyên môn biểu diễn có hồ sơ, kể cả hồ sơ đã nghỉ.';
  if (detailedBooks(r) >= 4)
    return 'Đã theo đủ bốn hồ sơ tiệm, kênh, dự án và biểu diễn chi tiết trong đời.';
  if (['business', 'freelance'].includes(currentCareer(r)?.id ?? ''))
    return 'Hãy rời lương khoán kinh doanh/tự do trước khi theo đường có sổ riêng.';
  if (r.finance.cash < designMoney(r, 15))
    return 'Cần tiền của bạn cho bước chuẩn bị học nghề; không tự vay.';
  return null;
}
export function artisticReadiness(r: GameRun): string | null {
  const p = r.creative?.artist;
  if (!p || p.status === 'retired') return 'Chưa có lịch biểu diễn đang theo.';
  if (p.trainingMonths < 12 || r.month < p.readyMonth)
    return 'Cần ít nhất một năm luyện thật; sau trở lại cần thêm sáu tháng chuẩn bị.';
  if (p.skill < 35 || p.presence < 25)
    return 'Cần 35 chuyên môn và 25 làm chủ sân khấu trước khi nhận lịch.';
  if (p.burnout >= 75) return 'Cần hồi sức trước khi nhận thêm lịch.';
  return null;
}
export function auditionReason(r: GameRun): string | null {
  const why = artisticReadiness(r);
  if (why) return why;
  const p = r.creative!.artist!;
  if (p.management === 'agency' && p.agencyThroughMonth !== null && r.month <= p.agencyThroughMonth)
    return 'Đang trong lịch hợp tác đã nhận; hãy để thỏa thuận hiện tại đi hết kỳ.';
  if (pending(p)) return 'Đang có một lượt thử hoặc đề nghị cần trả lời.';
  if (p.auditions.length >= 4)
    return 'Đã theo đủ bốn lượt audition chi tiết trong đời; vẫn có thể chọn làm tự do khi phù hợp.';
  if (p.auditions.at(-1) && r.month - p.auditions.at(-1)!.appliedMonth < 12)
    return 'Các lượt audition cách nhau ít nhất một năm.';
  if (r.finance.cash < designMoney(r, 4)) return 'Cần phí chuẩn bị audition từ tiền cá nhân.';
  return null;
}
function audition(r: GameRun, terms: AgencyTerms) {
  const reason = auditionReason(r);
  if (reason) throw Error(reason);
  const p = r.creative!.artist!,
    id = `artist:0:audition:${p.auditions.length}`,
    cost = designMoney(r, 4);
  transact(r, id + ':preparation', 'Chuẩn bị và đi thử tiết mục', { cash: -cost });
  p.totals.audition += cost;
  p.auditions.push({
    id,
    appliedMonth: r.month,
    dueMonth: r.month + 6,
    resolvedMonth: null,
    terms,
    result: 'pending',
  });
  p.status = 'audition';
  note(
    r,
    'Bạn gửi tiết mục thử theo điều kiện đã chọn. Sáu tháng thiết kế để xét; phí đã chi, chưa có hợp đồng, fan hoặc tiền show.',
  );
}
function decline(r: GameRun) {
  const p = r.creative!.artist!,
    a = pending(p);
  if (!a || a.result !== 'offered') throw Error('Chưa có đề nghị đang chờ để từ chối.');
  a.result = 'declined';
  p.status = p.policy === 'rest' ? 'resting' : p.management ? 'active' : 'training';
  note(
    r,
    'Bạn không nhận lịch được mời. Phí audition đã chi vẫn giữ; không có tiền hoặc danh tiếng tự sinh từ lời đề nghị.',
  );
}
function accept(r: GameRun) {
  const p = r.creative!.artist!,
    a = pending(p);
  if (!a || a.result !== 'offered') throw Error('Chưa có đề nghị hợp tác để nhận.');
  if (r.finance.cash < artisticMonthlyCost(r, p.policy === 'rest' ? 'technique' : p.policy))
    throw Error('Cần quỹ cho lịch đầu tiên; chưa nhận và không tự vay.');
  a.result = 'accepted';
  p.management = 'agency';
  p.agencyTerms = a.terms;
  p.agencyThroughMonth = r.month + 36;
  p.status = 'active';
  if (p.policy === 'rest') p.policy = 'technique';
  note(
    r,
    `Bạn nhận lịch hợp tác 36 tháng thiết kế. Bên tổ chức giữ ${AGENCY_CONDITIONS[a.terms].share}% phí show thực có; chưa có show thì chưa có phí để chia, không bảo đảm nổi tiếng.`,
  );
}
function independent(r: GameRun) {
  const why = artisticReadiness(r);
  if (why) throw Error(why);
  const p = r.creative!.artist!;
  if (p.management === 'agency' && p.agencyThroughMonth !== null && r.month <= p.agencyThroughMonth)
    throw Error('Lịch hợp tác còn hiệu lực; không tự đổi phần chia đã nhận.');
  if (pending(p)?.result === 'pending')
    throw Error('Hãy chờ kết quả audition trước khi nhận lịch khác.');
  const offer = pending(p);
  if (offer) offer.result = 'declined';
  p.management = 'independent';
  p.agencyTerms = null;
  p.agencyThroughMonth = null;
  p.status = 'active';
  if (p.policy === 'rest') p.policy = 'technique';
  note(
    r,
    'Bạn tự nhận tiết mục nhỏ, tự lo chi phí và lịch. Phí show tùy chất lượng và người xem; có đợt không thu đủ chi, không cần được agency chọn mới có đường đi.',
  );
}
function policy(r: GameRun, value: ArtPolicy, story = false) {
  const p = r.creative!.artist!;
  if (p.status === 'retired') throw Error('Hồ sơ đang nghỉ nghề; cần xét một lần trở lại trước.');
  p.policy = value;
  if (value === 'rest' && ['active', 'training'].includes(p.status)) p.status = 'resting';
  else if (value !== 'rest' && p.status === 'resting')
    p.status = p.policy === 'rest' ? 'resting' : p.management ? 'active' : 'training';
  if (story) {
    if (value === 'technique') {
      p.skill = cap(p.skill + 3);
      r.player.stats.stress = cap(r.player.stats.stress + 2);
    } else if (value === 'stage') {
      p.presence = cap(p.presence + 4);
      p.burnout = cap(p.burnout + 3);
    } else if (value === 'community') {
      p.reputation = cap(p.reputation + 3);
      r.player.stats.stress = cap(r.player.stats.stress + 1);
    } else {
      p.burnout = cap(p.burnout - 10);
      r.player.stats.stress = cap(r.player.stats.stress - 2);
    }
  }
  note(
    r,
    value === 'rest'
      ? 'Bạn cho cả phần tập và show nghỉ, không thu phí show trong lúc nghỉ. Kỳ hợp tác đã nhận vẫn theo thời gian.'
      : `Bạn chọn ${ART_POLICY_NAMES[value].toLowerCase()}. Chi phí ghi từng tháng từ quỹ cá nhân; tập luyện không tự biến thành tiền hoặc fan.`,
  );
}
function retire(r: GameRun) {
  const p = r.creative!.artist!;
  if (p.status === 'retired') throw Error('Lịch biểu diễn đã nghỉ.');
  for (const a of p.auditions)
    if (a.result === 'pending' || a.result === 'offered') {
      a.result = 'declined';
      if (a.resolvedMonth === null) a.resolvedMonth = r.month;
    }
  p.status = 'retired';
  p.policy = 'rest';
  p.management = null;
  p.agencyTerms = null;
  p.agencyThroughMonth = null;
  p.endedMonth = r.month;
  note(
    r,
    'Bạn khép lịch biểu diễn hiện tại. Công, phí và những người đã theo dõi được ghi lại; không nhận lại tiền show cũ hoặc xóa hồ sơ để mở lại.',
  );
}
export function comebackReason(r: GameRun): string | null {
  const p = r.creative?.artist;
  if (!p || p.status !== 'retired') return 'Chỉ xét trở lại sau khi đã khép lịch biểu diễn.';
  if (p.comebackUsed) return 'Hồ sơ đã dùng một lần trở lại; kỷ niệm và kết quả cũ vẫn giữ.';
  if (['business', 'freelance'].includes(currentCareer(r)?.id ?? ''))
    return 'Hãy rời lương khoán kinh doanh/tự do trước khi trở lại nghề có sổ riêng.';
  if (r.finance.cash < designMoney(r, 5)) return 'Cần quỹ cá nhân cho việc tập lại, không tự vay.';
  return null;
}
function comeback(r: GameRun) {
  const why = comebackReason(r);
  if (why) throw Error(why);
  const p = r.creative!.artist!,
    cost = designMoney(r, 5);
  transact(r, 'artist:0:comeback', 'Chuẩn bị một lần trở lại biểu diễn', { cash: -cost });
  p.totals.comeback += cost;
  p.comebackUsed = true;
  p.endedMonth = null;
  p.status = 'training';
  p.policy = 'technique';
  p.readyMonth = r.month + 6;
  p.skill = cap(p.skill - 5);
  p.burnout = cap(p.burnout + 5);
  note(
    r,
    'Bạn dùng quỹ riêng để trở lại luyện. Cần ít nhất sáu tháng chuẩn bị rồi xét hướng nhận lịch; người xem và tiền show không được trả lại từ quá khứ.',
  );
}
export function requestArtistic(input: GameRun, raw: ArtisticAction): GameRun {
  const parsed = artisticActionSchema.safeParse(raw);
  if (!parsed.success) throw Error('Thao tác biểu diễn không hợp lệ.');
  const a = parsed.data;
  if (a.expected !== input.actions.length) throw Error('Thao tác thuộc bản cũ; hãy mở lại hồ sơ.');
  const why = artisticReason(input);
  if (why) throw Error(why);
  const r = structuredClone(input);
  if (a.operation === 'start') {
    const reason = artisticStartReason(r);
    if (reason) throw Error(reason);
    const cost = designMoney(r, 15);
    transact(r, 'artist:0:setup', 'Chuẩn bị học và tập biểu diễn', { cash: -cost });
    r.creative!.artist = {
      id: 'artist:0',
      owner: r.id,
      discipline: a.discipline!,
      startedMonth: r.month,
      settledThrough: r.month,
      readyMonth: r.month + 12,
      status: 'training',
      policy: 'technique',
      management: null,
      agencyTerms: null,
      agencyThroughMonth: null,
      skill: cap(Math.min(30, r.player.stats.skill / 2)),
      presence: cap(Math.min(25, r.player.stats.social / 3)),
      fans: 0,
      reputation: 40,
      burnout: 0,
      trainingMonths: 0,
      endedMonth: null,
      comebackUsed: false,
      showCount: 0,
      auditions: [],
      invoices: [],
      recent: [],
      totals: {
        training: cost,
        stage: 0,
        audition: 0,
        comeback: 0,
        gross: 0,
        agencyCut: 0,
        received: 0,
        shows: 0,
      },
    };
    note(
      r,
      `Bạn bắt đầu học ${ART_NAMES[a.discipline!].toLowerCase()}. Chưa có fan, hợp đồng hoặc phí show; công và chi phí phải đi trước kết quả.`,
    );
  } else {
    if (!r.creative!.artist) throw Error('Chưa có hồ sơ biểu diễn.');
    if (a.operation === 'policy') policy(r, a.policy!);
    else if (a.operation === 'audition') audition(r, a.terms!);
    else if (a.operation === 'accept') accept(r);
    else if (a.operation === 'decline') decline(r);
    else if (a.operation === 'independent') independent(r);
    else if (a.operation === 'retire') retire(r);
    else comeback(r);
  }
  r.actions.push(a);
  return r;
}
export function settleArtistic(r: GameRun) {
  const p = r.creative?.artist;
  if (!p) return;
  if (!hasCreativeRules(r) || p.settledThrough + 1 !== r.month)
    throw Error('Invariant: artistic clock');
  if (p.status === 'retired') {
    if (p.fans) p.fans = Math.max(0, p.fans - Math.max(1, Math.floor(p.fans * 0.01)));
    p.settledThrough = r.month;
    return;
  }
  if (
    p.management === 'agency' &&
    p.agencyThroughMonth !== null &&
    r.month > p.agencyThroughMonth
  ) {
    p.management = 'independent';
    p.agencyTerms = null;
    p.agencyThroughMonth = null;
    note(
      r,
      'Kỳ hợp tác đã hết. Bạn giữ chuyên môn và có thể làm tự do; từ đây không còn trích phần chia agency cũ.',
    );
  }
  const cost = artisticMonthlyCost(r, p.policy);
  if (p.policy !== 'rest' && (p.burnout >= 85 || r.finance.cash < cost)) {
    p.policy = 'rest';
    if (['active', 'training'].includes(p.status)) p.status = 'resting';
    note(
      r,
      'Lịch tập và diễn tạm nghỉ vì sức hoặc quỹ chưa đủ. Không tự vay để tiếp tục và không thu phí show khi nghỉ.',
    );
  }
  if (p.policy === 'rest') {
    p.burnout = cap(p.burnout - 5);
    if (p.fans && r.month % 6 === 0)
      p.fans = Math.max(0, p.fans - Math.max(1, Math.floor(p.fans * 0.01)));
  } else {
    transact(r, `artist:0:training:${r.month}`, 'Tập và chuẩn bị tiết mục biểu diễn', {
      cash: -cost,
    });
    p.totals.training += cost;
    p.trainingMonths++;
    p.skill = cap(p.skill + (p.policy === 'technique' ? 2 : 1));
    p.presence = cap(p.presence + (p.policy === 'stage' ? 2 : 1));
    if (p.policy === 'community' && r.month % 3 === 0) p.reputation = cap(p.reputation + 1);
    p.burnout = cap(
      p.burnout +
        { technique: 1, stage: 3, community: 2 }[p.policy] +
        (currentCareer(r) ? 1 : 0) +
        (r.academics?.studies.some((s) => s.status === 'studying') ? 1 : 0),
    );
  }
  for (const a of p.auditions) {
    if (a.result === 'pending' && r.month >= a.dueMonth) {
      const bonus = r.academics?.qualifications.some((q) =>
        ['design', 'communications'].includes(q.programId),
      )
        ? 4
        : 0;
      const score =
        p.skill * 0.55 +
        p.presence * 0.3 +
        p.reputation * 0.15 -
        p.burnout / 4 +
        bonus +
        AGENCY_CONDITIONS[a.terms].bonus +
        (roll(r, a.id + ':score') - 0.5) * 40;
      a.result = score >= 60 && roll(r, a.id + ':response') < 0.82 ? 'offered' : 'rejected';
      a.resolvedMonth = r.month;
      if (a.result === 'offered') {
        p.status = 'offered';
        note(
          r,
          `Nhóm tổ chức mời bạn theo một lịch có phần chia ${AGENCY_CONDITIONS[a.terms].share}% phí show. Bạn có thể nhận, từ chối hoặc tự làm khi phù hợp; lời mời chưa tạo thu nhập.`,
        );
      } else {
        p.status = p.management
          ? p.policy === 'rest'
            ? 'resting'
            : 'active'
          : p.policy === 'rest'
            ? 'resting'
            : 'training';
        p.reputation = cap(p.reputation - 2);
        note(
          r,
          'Lượt audition chưa được chọn. Phí chuẩn bị đã chi; bạn vẫn có thể học tiếp, thử kỳ khác trong giới hạn hoặc làm tự do khi đủ khả năng.',
        );
      }
    } else if (a.result === 'offered' && r.month > a.resolvedMonth! + 18) {
      a.result = 'expired';
      p.status = p.policy === 'rest' ? 'resting' : p.management ? 'active' : 'training';
      note(
        r,
        'Đề nghị đã qua thời hạn trả lời. Bạn chưa nhận lịch và không có tiền hoặc fan được cộng từ lời mời.',
      );
    }
  }
  if (p.status === 'active' && p.policy !== 'rest' && (r.month - p.startedMonth) % 6 === 0) {
    const stageCost = designMoney(r, { technique: 8, stage: 12, community: 10 }[p.policy]);
    if (r.finance.cash < stageCost) {
      note(
        r,
        'Tiết mục chưa thể lên lịch vì quỹ sân khấu chưa đủ. Không tự vay và không ghi phí show chưa diễn.',
      );
    } else {
      const id = `artist:0:show:${p.showCount}`,
        noise = roll(r, id + ':show');
      const quality = cap(
        p.skill * 0.55 +
          p.presence * 0.35 +
          p.reputation * 0.1 -
          p.burnout / 4 -
          (currentCareer(r) ? 8 : 0) -
          (r.academics?.studies.some((s) => s.status === 'studying') ? 6 : 0) +
          (noise - 0.5) * 35,
      );
      const gross =
        quality < 45
          ? 0
          : designMoney(
              r,
              Math.min(200, Math.floor(8 + quality * 0.45 + (p.fans / 1000) * (0.5 + noise))),
            );
      const agencyCut =
          p.management === 'agency'
            ? Math.floor((gross * AGENCY_CONDITIONS[p.agencyTerms!].share) / 100)
            : 0,
        received = gross - agencyCut;
      transact(r, id + ':cost', 'Chi phí thực hiện tiết mục sân khấu', { cash: -stageCost });
      if (received)
        transact(r, id + ':payout', 'Phí show thực nhận sau phần chia tổ chức', { cash: received });
      const proposed =
        quality < 45
          ? -Math.min(2000, Math.floor(p.fans * 0.04) + 1)
          : quality < 65 || noise < 0.3
            ? 0
            : Math.min(
                2500,
                Math.floor(
                  (quality - 45) * 3 * (1 + p.fans / 10000) * (p.management === 'agency' ? 1.2 : 1),
                ),
              );
      const after = Math.max(0, Math.min(2_000_000, p.fans + proposed)),
        fansDelta = after - p.fans;
      p.fans = after;
      p.reputation = cap(p.reputation + (quality >= 65 ? 2 : quality < 45 ? -4 : 0));
      p.burnout = cap(p.burnout + (p.agencyTerms === 'fast-track' ? 8 : 5));
      p.showCount++;
      p.totals.shows++;
      p.totals.stage += stageCost;
      p.totals.gross += gross;
      p.totals.agencyCut += agencyCut;
      p.totals.received += received;
      p.recent.push({
        id,
        month: r.month,
        quality,
        gross,
        agencyCut,
        received,
        cost: stageCost,
        fansDelta,
      });
      p.invoices.push(p.recent.at(-1)!);
      if (p.recent.length > 12) p.recent.shift();
      note(
        r,
        gross
          ? `Tiết mục có phí ${formatMoney(gross, r)}, phần chia ${formatMoney(agencyCut, r)}, thực nhận ${formatMoney(received, r)} trước chi phí sân khấu ${formatMoney(stageCost, r)}. Người theo dõi thay đổi ${fansDelta >= 0 ? '+' : ''}${fansDelta}.`
          : 'Tiết mục chưa có phí show. Chi phí sân khấu đã chi, người xem có thể rời đi; học nghề và lên sân khấu không chắc dẫn tới nổi tiếng.',
      );
    }
  }
  p.settledThrough = r.month;
}
export function artisticSceneEligible(r: GameRun, id: string) {
  const p = r.creative?.artist;
  if (!hasCreativeRules(r) || !p || r.month < 216) return false;
  if (id === 'ar-comeback') return p.status === 'retired' && !p.comebackUsed;
  if (p.status === 'retired') return false;
  if (id === 'ar-offer') return p.status === 'offered';
  if (id === 'ar-audition')
    return p.status === 'audition' || (p.status === 'training' && !auditionReason(r));
  if (id === 'ar-burnout') return p.status === 'resting' || p.burnout >= 60;
  if (id === 'ar-first-show') return p.status === 'active' && p.showCount < 6;
  if (id === 'ar-fans') return p.status === 'active' && p.fans >= 100;
  if (id === 'ar-incident') return p.status === 'active' && p.showCount >= 2;
  return id === `ar-${p.discipline}` && ['training', 'active', 'resting'].includes(p.status);
}
export function applyArtisticStory(r: GameRun, op: ArtStoryOperation) {
  const p = r.creative?.artist;
  if (!hasCreativeRules(r) || !p) throw Error('Cảnh biểu diễn không đúng hồ sơ.');
  if (['technique', 'stage', 'community', 'rest'].includes(op)) {
    if (p.status === 'retired') {
      note(r, 'Bạn giữ bài học cũ; lịch biểu diễn chưa tự mở lại.');
      return;
    }
    policy(r, op as ArtPolicy, true);
  } else if (op.startsWith('audition-')) {
    const why = auditionReason(r);
    if (why) {
      note(r, why + ' Bạn chưa gửi thêm tiết mục hoặc mất phí.');
      return;
    }
    audition(r, op.slice(9) as AgencyTerms);
  } else if (op === 'accept') {
    const a = pending(p);
    if (
      !a ||
      a.result !== 'offered' ||
      r.finance.cash < artisticMonthlyCost(r, p.policy === 'rest' ? 'technique' : p.policy)
    ) {
      note(
        r,
        'Bạn chưa nhận lịch vì đề nghị hoặc quỹ chưa phù hợp; không tự vay và chưa có tiền show.',
      );
      return;
    }
    accept(r);
  } else if (op === 'decline') {
    if (pending(p)?.result !== 'offered') {
      note(r, 'Không có đề nghị cần từ chối; hồ sơ và tiền đã ghi vẫn giữ.');
      return;
    }
    decline(r);
  } else if (op === 'independent') {
    const why = artisticReadiness(r);
    if (why || pending(p)?.result === 'pending' || p.management === 'agency') {
      note(
        r,
        (why ?? 'Lịch đang chờ hoặc đã nhận cần được giải quyết trước.') +
          ' Chưa mở thêm lịch show.',
      );
      return;
    }
    independent(r);
  } else if (op === 'retire') {
    if (p.status !== 'retired') retire(r);
    else note(r, 'Lịch đã khép; không nhận lại tiền cũ.');
  } else if (op === 'comeback') {
    const why = comebackReason(r);
    if (why) {
      note(r, why);
      return;
    }
    comeback(r);
  } else if (op === 'credit') {
    p.reputation = cap(p.reputation + 3);
    p.burnout = cap(p.burnout + 2);
    note(
      r,
      'Bạn soát lại nguồn và ghi công với người cùng dựng tiết mục. Uy tín tăng nhẹ, thêm công phải làm; không có tiền hoặc fan được cộng tức thì.',
    );
  } else if (op === 'apologize') {
    p.reputation = cap(p.reputation + 2);
    r.player.stats.stress = cap(r.player.stats.stress + 3);
    p.fans = Math.max(0, p.fans - Math.min(500, Math.floor(p.fans * 0.02)));
    note(
      r,
      'Bạn nhận phần thiếu sót và sửa cách làm. Có người rời đi, uy tín hồi lại chậm và bạn chịu thêm áp lực; không xóa kết quả show cũ.',
    );
  } else
    note(
      r,
      'Bạn nhìn lại chặng đã đi và giữ hồ sơ. Không cộng lại người xem hoặc khoản phí của tiết mục đã diễn.',
    );
}
export function closeArtisticAtEnd(r: GameRun) {
  const p = r.creative?.artist;
  if (p && p.status !== 'retired') retire(r);
}
export function assertArtistic(r: GameRun) {
  const p = r.creative?.artist;
  if (!hasCreativeRules(r)) {
    if (p) throw Error('Invariant: legacy artist');
    return;
  }
  if (p === null) {
    if (r.finance.transactions.some((t) => t.id.startsWith('artist:')))
      throw Error('Invariant: orphan artist ledger');
    return;
  }
  if (!p) throw Error('Invariant: missing artist selector');
  const int = (n: number, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    Number.isSafeInteger(n) && n >= min && n <= max;
  if (
    p.id !== 'artist:0' ||
    p.owner !== r.id ||
    p.settledThrough !== r.month ||
    !int(p.startedMonth, 216, r.month) ||
    !int(p.readyMonth, p.startedMonth) ||
    !['music', 'dance', 'acting'].includes(p.discipline) ||
    !['training', 'audition', 'offered', 'active', 'resting', 'retired'].includes(p.status) ||
    !['technique', 'stage', 'community', 'rest'].includes(p.policy) ||
    [p.skill, p.presence, p.reputation, p.burnout].some((n) => !int(n, 0, 100)) ||
    !int(p.fans, 0, 2_000_000) ||
    !int(p.trainingMonths, 0, r.month - p.startedMonth) ||
    !int(p.showCount) ||
    p.showCount !== p.totals.shows ||
    p.auditions.length > 4 ||
    p.recent.length > 12 ||
    !Object.values(p.totals).every((n) => int(n)) ||
    detailedBooks(r) > 4
  )
    throw Error('Invariant: artistic profile/bounds');
  if (
    (p.status === 'retired') !== (p.endedMonth !== null) ||
    (p.endedMonth !== null && !int(p.endedMonth, p.startedMonth, r.month)) ||
    typeof p.comebackUsed !== 'boolean' ||
    (p.management !== null && !['independent', 'agency'].includes(p.management)) ||
    (p.management === 'agency') !== (p.agencyTerms !== null && p.agencyThroughMonth !== null) ||
    (p.agencyTerms !== null && !['balanced', 'fast-track'].includes(p.agencyTerms)) ||
    (p.agencyThroughMonth !== null && !int(p.agencyThroughMonth, p.startedMonth))
  )
    throw Error('Invariant: artistic status/contract');
  if (
    p.totals.gross !== p.totals.received + p.totals.agencyCut ||
    p.auditions.filter((a) => a.result === 'pending' || a.result === 'offered').length > 1
  )
    throw Error('Invariant: artistic gross/offer');
  if (p.status !== 'retired' && ['business', 'freelance'].includes(currentCareer(r)?.id ?? ''))
    throw Error('Invariant: duplicated abstract artistic salary');
  for (const [i, a] of p.auditions.entries())
    if (
      a.id !== `artist:0:audition:${i}` ||
      !int(a.appliedMonth, p.startedMonth, r.month) ||
      a.dueMonth !== a.appliedMonth + 6 ||
      !['balanced', 'fast-track'].includes(a.terms) ||
      !['pending', 'offered', 'rejected', 'accepted', 'declined', 'expired'].includes(a.result) ||
      (a.result === 'pending') !== (a.resolvedMonth === null) ||
      (a.resolvedMonth !== null && !int(a.resolvedMonth, a.appliedMonth, r.month))
    )
      throw Error('Invariant: artistic audition');
  const posts = r.finance.transactions.filter((t) => t.id.startsWith('artist:0:'));
  const byId = new Map(posts.map((t) => [t.id, t]));
  if (posts.some((t) => t.debt || t.savings || t.assets))
    throw Error('Invariant: artistic ownership');
  const cost = (pattern: (id: string) => boolean) =>
    -posts
      .filter((t) => pattern(t.id))
      .reduce((n, t) => {
        if (t.cash >= 0) throw Error('Invariant: artistic cost sign');
        return n + t.cash;
      }, 0);
  if (
    cost((id) => id === 'artist:0:setup' || id.startsWith('artist:0:training:')) !==
      p.totals.training ||
    cost((id) => /^artist:0:show:\d+:cost$/.test(id)) !== p.totals.stage ||
    cost((id) => id.startsWith('artist:0:audition:')) !== p.totals.audition ||
    cost((id) => id === 'artist:0:comeback') !== p.totals.comeback
  )
    throw Error('Invariant: artistic cost ledger');
  const payouts = posts.filter((t) => /^artist:0:show:\d+:payout$/.test(t.id));
  if (
    payouts.some((t) => t.cash <= 0) ||
    payouts.reduce((n, t) => n + t.cash, 0) !== p.totals.received ||
    posts.filter((t) => /^artist:0:show:\d+:cost$/.test(t.id)).length !== p.showCount ||
    posts.filter((t) => t.id === 'artist:0:comeback').length !== (p.comebackUsed ? 1 : 0) ||
    posts.filter((t) => t.id === 'artist:0:setup').length !== 1
  )
    throw Error('Invariant: artistic payout/count');
  if (
    p.invoices.length !== p.showCount ||
    p.invoices.length > 1024 ||
    p.invoices.reduce((n, s) => n + s.gross, 0) !== p.totals.gross ||
    p.invoices.reduce((n, s) => n + s.agencyCut, 0) !== p.totals.agencyCut ||
    p.invoices.reduce((n, s) => n + s.received, 0) !== p.totals.received ||
    p.invoices.reduce((n, s) => n + s.cost, 0) !== p.totals.stage ||
    JSON.stringify(p.recent) !== JSON.stringify(p.invoices.slice(-12))
  )
    throw Error('Invariant: artistic invoice archive');
  for (const [index, s] of p.invoices.entries()) {
    if (s.id !== `artist:0:show:${index}`) throw Error('Invariant: artistic invoice sequence');
    const fee = byId.get(s.id + ':payout'),
      expense = byId.get(s.id + ':cost');
    if (
      !/^artist:0:show:\d+$/.test(s.id) ||
      !int(s.month, p.startedMonth, r.month) ||
      !int(s.quality, 0, 100) ||
      ![s.gross, s.agencyCut, s.received, s.cost].every((n) => int(n)) ||
      s.gross !== s.agencyCut + s.received ||
      !int(s.fansDelta, -2000, 2500) ||
      !expense ||
      expense.cash !== -s.cost ||
      Boolean(fee) !== Boolean(s.received) ||
      (s.received && fee?.cash !== s.received)
    )
      throw Error('Invariant: artistic recent invoice');
  }
}
