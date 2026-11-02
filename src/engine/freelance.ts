import type { GameRun } from '../domain/model';
import {
  freelanceActionSchema,
  type FreelanceAction,
  type FreelanceService,
  type ClientProject,
  type ProjectStatus,
  type ProjectEnding,
  type ProjectPolicy,
  type ProjectTerms,
  type FreelanceStoryOperation,
} from '../domain/freelance';
import { hasCreativeRules, discretionaryCount, detailedBooks } from '../domain/rules';
import { CLIENT_SERVICES, serviceById } from '../content/freelance-services';
import { ageOf, currentCareer } from '../content/world';
import { designMoney, formatMoney } from '../domain/currency';
import { hashSeed } from './random';
import { transact } from './finance';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const unit = (r: GameRun, key: string) => hashSeed(`${r.seed}:client-project:${key}`) / 4294967296;
const active = (p: ClientProject) => p.status !== 'closed';
export const currentProject = (r: GameRun) => r.freelance?.projects.find(active);
export const projectProfit = (p: ClientProject) => p.totals.received - p.totals.cost;
export function initFreelance(r: GameRun) {
  r.freelance = { owner: r.id, settledThrough: 0, reputation: 40, projects: [] };
}
function note(r: GameRun, text: string) {
  r.lastOutcome = text;
  r.journal.push({
    id: `journal:${r.journal.length}`,
    month: r.month,
    title: 'Một chặng với khách hàng',
    text,
    category: 'career',
  });
}
function mark(r: GameRun, p: ClientProject, status: ProjectStatus, text: string) {
  if (p.milestones.length >= 16) throw Error('Invariant: project milestone capacity');
  p.status = status;
  p.milestones.push({ month: r.month, status, text });
  note(r, text);
}
function reputation(r: GameRun, delta: number) {
  r.freelance!.reputation = clamp(r.freelance!.reputation + delta);
}
function close(r: GameRun, p: ClientProject, ending: ProjectEnding, text: string) {
  if (!active(p)) throw Error('Hồ sơ đã khép, không quyết toán lại.');
  p.ending = ending;
  p.closedMonth = r.month;
  mark(r, p, 'closed', text);
}
function degreeBonus(r: GameRun, p: Pick<ClientProject, 'service'>) {
  return r.academics?.qualifications.some((q) =>
    serviceById(p.service).programs.includes(q.programId),
  )
    ? 12
    : 0;
}
function workQuality(r: GameRun, p: ClientProject) {
  const workload =
    (currentCareer(r) ? 10 : 0) +
    (r.academics?.studies.some((s) => s.status === 'studying') ? 8 : 0);
  return clamp(
    30 +
      (r.player.stats.knowledge + r.player.stats.skill) / 4 +
      degreeBonus(r, p) +
      r.freelance!.reputation / 10 -
      r.player.stats.stress / 7 -
      workload +
      (p.policy === 'careful' ? 9 : p.policy === 'rush' ? -10 : 0) +
      (unit(r, `${p.id}:work:${r.month}`) - 0.5) * 12,
  );
}
export function projectMonthlyCost(r: GameRun, p: ClientProject) {
  if (p.policy === 'rest') return 0;
  return designMoney(
    r,
    Math.max(
      1,
      serviceById(p.service).monthlyCost +
        (p.policy === 'careful' ? 1 : p.policy === 'rush' ? -1 : 0),
    ),
  );
}
export function freelanceReason(r: GameRun): string | null {
  if (!hasCreativeRules(r) || !r.freelance)
    return 'Cuộc đời này giữ luật trước khi có hợp đồng khách hàng.';
  if (r.status !== 'playing' || ageOf(r) < 18) return 'Từ 18 tuổi, bạn có thể tự nhận dự án.';
  if (r.activeEvent && /^(biz-|cr-|gm-|co-|ar-)/.test(r.activeEvent.id))
    return 'Hãy giải quyết cảnh khách hàng đang chờ trước khi đổi hồ sơ.';
  if (r.social?.focus || r.family?.focus || r.academics?.focus)
    return 'Hãy hoàn tất cuộc đối thoại hoặc đánh giá đang chờ trước khi đổi hồ sơ khách hàng.';
  if (discretionaryCount(r) >= 120) return 'Đã dùng hết lượt quản lý; hãy tiếp tục câu chuyện.';
  return null;
}
export function serviceReason(r: GameRun, id: FreelanceService): string | null {
  const reason = freelanceReason(r);
  if (reason) return reason;
  const s = serviceById(id);
  if (detailedBooks(r) >= 4)
    return 'Đã theo đủ bốn hồ sơ tiệm, kênh và dự án chi tiết, kể cả hồ sơ đã khép.';
  if (currentProject(r)) return 'Hãy hoàn tất hoặc khép dự án đang theo trước khi nhận thêm.';
  if (r.world.year < s.from) return 'Dịch vụ này chưa mở trong thời kỳ của mô phỏng.';
  if (['business', 'freelance'].includes(currentCareer(r)?.id ?? ''))
    return 'Hãy rời nghề kinh doanh/tự do theo lương khoán trước khi nhận hợp đồng có sổ riêng.';
  if (r.player.stats.knowledge < s.knowledge)
    return `Cần ${s.knowledge} tri thức để hiểu yêu cầu cơ bản.`;
  if (r.player.stats.skill < s.skill)
    return `Cần ${s.skill} tay nghề để nhận phạm vi công việc này.`;
  if (r.finance.cash < designMoney(r, 2))
    return 'Cần tiền cá nhân cho bước tìm hiểu và chuẩn bị; không tự vay.';
  return null;
}
function owned(r: GameRun, id: string) {
  const p = r.freelance!.projects.find((p) => p.id === id);
  if (!p || p.owner !== r.id || !active(p))
    throw Error('Hồ sơ không còn hoạt động hoặc không thuộc cuộc đời này.');
  return p;
}
function negotiate(r: GameRun, p: ClientProject, terms: ProjectTerms) {
  if (p.status !== 'inquiry') throw Error('Chỉ thương lượng một lần cho lời hỏi mới.');
  p.terms = terms;
  p.fee = designMoney(
    r,
    Math.round(
      serviceById(p.service).fee *
        r.world.wageFactor *
        { modest: 0.8, standard: 1, premium: 1.25 }[terms],
    ),
  );
  const chance = Math.max(
    20,
    Math.min(
      85,
      30 +
        (r.player.stats.knowledge + r.player.stats.skill) / 4 +
        degreeBonus(r, p) +
        r.freelance!.reputation / 10 +
        (terms === 'modest' ? 15 : terms === 'premium' ? -18 : 0),
    ),
  );
  if (unit(r, p.id + ':proposal:' + terms) * 100 >= chance) {
    reputation(r, -2);
    close(
      r,
      p,
      'rejected',
      `${p.client} không chọn đề nghị này. Phí chuẩn bị đã chi; chưa có thu nhập hợp đồng.`,
    );
    return;
  }
  mark(
    r,
    p,
    'offered',
    `${p.client} đồng ý phạm vi đã trao đổi với phí ${formatMoney(p.fee, r)} sau nghiệm thu. Đây là đề nghị, chưa phải tiền đã nhận.`,
  );
}
function accept(r: GameRun, p: ClientProject) {
  if (p.status !== 'offered') throw Error('Chưa có đề nghị để nhận.');
  if (r.finance.cash < projectMonthlyCost(r, p))
    throw Error('Tiền mặt chưa đủ cho một tháng thực hiện; chưa nhận việc và không tự vay.');
  p.acceptedMonth = r.month;
  p.deadlineMonth = r.month + 24;
  mark(
    r,
    p,
    'working',
    'Bạn nhận đợt dự án 12 tháng của mô phỏng. Phí thực hiện ghi từng tháng; chỉ nghiệm thu và trả tiền mới tạo thu nhập.',
  );
}
function policy(r: GameRun, p: ClientProject, value: ProjectPolicy) {
  if (p.status !== 'working') throw Error('Chỉ đổi nhịp khi dự án đang thực hiện.');
  p.policy = value;
  note(
    r,
    value === 'rest'
      ? 'Bạn dừng làm để hồi sức; deadline vẫn đi cùng thời gian.'
      : value === 'careful'
        ? 'Bạn dành thêm chi phí để kiểm tra kỹ hơn.'
        : value === 'rush'
          ? 'Bạn rút ngắn tiến độ, đổi lại chất lượng dễ hụt.'
          : 'Bạn giữ nhịp đều và phạm vi đã nhận.',
  );
}
function deliver(r: GameRun, p: ClientProject) {
  if (p.status !== 'ready') throw Error('Cần làm xong phần việc trước khi giao.');
  p.reviewAttempts++;
  p.reviewDue = r.month + 1;
  mark(r, p, 'review', 'Bạn gửi bản giao và chờ khách soát. Chưa ghi tiền công vào ví.');
}
function revise(r: GameRun, p: ClientProject) {
  if (p.status !== 'rework' || p.reworkUsed) throw Error('Không còn lượt làm lại của hồ sơ này.');
  p.reworkUsed = true;
  p.progress = 0;
  p.requiredMonths = 6;
  p.policy = 'careful';
  p.deadlineMonth = r.month + 18;
  mark(
    r,
    p,
    'working',
    'Bạn nhận một lượt sửa có giới hạn:6 tháng thiết kế, thêm công và chi phí, chưa chắc được nghiệm thu.',
  );
}
function settle(r: GameRun, p: ClientProject) {
  if (p.status !== 'rework')
    throw Error('Chỉ thương lượng thanh toán phần đã dùng khi có yêu cầu sửa.');
  p.amountDue = Math.floor(p.fee * 0.6);
  p.paymentDue = r.month + 2;
  mark(
    r,
    p,
    'payment',
    'Bạn thống nhất khép phạm vi với 60% phí đề nghị cho phần có thể dùng. Vẫn chờ khoản thanh toán thực nhận.',
  );
}
export function requestFreelance(input: GameRun, raw: FreelanceAction): GameRun {
  const parsed = freelanceActionSchema.safeParse(raw);
  if (!parsed.success) throw Error('Thông số hợp đồng không hợp lệ.');
  const a = parsed.data;
  if (a.expected !== input.actions.length)
    throw Error('Thao tác hợp đồng đã cũ; bản lưu được giữ nguyên.');
  const reason = freelanceReason(input);
  if (reason) throw Error(reason);
  const r = structuredClone(input);
  if (a.operation === 'inquire') {
    const unavailable = serviceReason(r, a.service!);
    if (unavailable) throw Error(unavailable);
    const index = r.freelance!.projects.length,
      s = serviceById(a.service!);
    const cost = designMoney(r, 2);
    const p: ClientProject = {
      id: `freelance:${index}`,
      owner: r.id,
      client: s.client,
      service: s.id,
      createdMonth: r.month,
      acceptedMonth: null,
      closedMonth: null,
      paidMonth: null,
      status: 'inquiry',
      ending: null,
      terms: null,
      policy: 'steady',
      fee: 0,
      amountDue: 0,
      progress: 0,
      requiredMonths: 12,
      workMonths: 0,
      stalledMonths: 0,
      quality: 0,
      reviewAttempts: 0,
      reworkUsed: false,
      lateUsed: false,
      deadlineMonth: r.month + 24,
      reviewDue: null,
      paymentDue: null,
      totals: { cost, received: 0 },
      milestones: [],
    };
    transact(r, p.id + ':preparation', 'Tìm hiểu yêu cầu và chuẩn bị mẫu', { cash: -cost });
    r.freelance!.projects.push(p);
    mark(
      r,
      p,
      'inquiry',
      `${p.client} hỏi về${s.name.toLowerCase()}. ${s.scope} Phí chuẩn bị đã chi, chưa chắc có hợp đồng.`,
    );
  } else {
    const p = owned(r, a.id!);
    switch (a.operation) {
      case 'negotiate':
        negotiate(r, p, a.terms!);
        break;
      case 'accept':
        accept(r, p);
        break;
      case 'policy':
        policy(r, p, a.policy!);
        break;
      case 'deliver':
        deliver(r, p);
        break;
      case 'revise':
        revise(r, p);
        break;
      case 'settle':
        settle(r, p);
        break;
      case 'close':
        reputation(r, p.acceptedMonth === null ? -1 : -5);
        close(
          r,
          p,
          'declined',
          'Bạn khép hồ sơ, giữ chi phí đã chi và không nhận khoản phí chưa được trả.',
        );
        break;
    }
  }
  r.actions.push(a);
  return r;
}
export function settleFreelance(r: GameRun) {
  if (!hasCreativeRules(r)) return;
  const f = r.freelance!;
  if (f.settledThrough + 1 !== r.month) throw Error('Invariant: freelance clock');
  for (const p of f.projects.filter(active)) {
    if (
      ['inquiry', 'offered', 'working', 'ready', 'rework'].includes(p.status) &&
      r.month > p.deadlineMonth
    ) {
      reputation(r, p.acceptedMonth === null ? -1 : -6);
      close(
        r,
        p,
        'expired',
        'Thời hạn dự án đã qua. Hồ sơ giữ lại công và chi phí đã thực hiện, không ghi phí chưa nhận.',
      );
      continue;
    }
    if (p.status === 'working') {
      if (p.policy === 'rest') {
        r.player.stats.stress = clamp(r.player.stats.stress - 1);
        continue;
      }
      const cost = projectMonthlyCost(r, p);
      if (r.finance.cash < cost) {
        p.stalledMonths++;
        if (p.stalledMonths >= 6) {
          reputation(r, -5);
          close(
            r,
            p,
            'failed',
            'Dự án thiếu quỹ liên tiếp, phải dừng. Không lấy quỹ hộ cũ hoặc tự vay để tiếp tục.',
          );
        }
        continue;
      }
      transact(r, `${p.id}:work:${r.month}`, 'Chi phí thực hiện dự án khách hàng', { cash: -cost });
      p.totals.cost += cost;
      p.stalledMonths = 0;
      const score = workQuality(r, p);
      p.quality = clamp((p.quality * p.workMonths + score) / (p.workMonths + 1));
      p.workMonths++;
      p.progress = Math.min(p.requiredMonths, p.progress + (p.policy === 'rush' ? 2 : 1));
      r.player.stats.stress = clamp(r.player.stats.stress + (p.policy === 'rush' ? 2 : 1));
      if (p.progress === p.requiredMonths) {
        p.deadlineMonth = r.month + 18;
        mark(
          r,
          p,
          'ready',
          'Phần việc đã sẵn sàng. Bạn có thể giao trong 18 tháng thiết kế; chưa có khoản thu trước nghiệm thu.',
        );
      }
    } else if (p.status === 'review' && r.month >= p.reviewDue!) {
      const score = p.quality + (unit(r, `${p.id}:review:${p.reviewAttempts}`) - 0.5) * 20;
      if (score >= 55 && unit(r, `${p.id}:review-response:${p.reviewAttempts}`) < 0.92) {
        p.amountDue = p.fee;
        p.paymentDue = r.month + 2;
        mark(
          r,
          p,
          'payment',
          'Khách nghiệm thu bản giao. Số tiền dự kiến vẫn tách khỏi tiền đã nhận, chờ kỳ thanh toán.',
        );
      } else if (!p.reworkUsed) {
        p.deadlineMonth = r.month + 18;
        mark(
          r,
          p,
          'rework',
          'Khách yêu cầu sửa. Bạn có thể làm lại một lượt, thỏa thuận nhận phần phí hoặc dừng lỗ.',
        );
      } else {
        reputation(r, -10);
        close(r, p, 'failed', 'Bản sửa vẫn chưa đạt thỏa thuận. Hồ sơ khép mà không có tiền công.');
      }
    } else if (p.status === 'payment' && r.month >= p.paymentDue!) {
      if (!p.lateUsed && unit(r, p.id + ':late') < 0.2) {
        p.lateUsed = true;
        p.paymentDue = r.month + 3;
        mark(
          r,
          p,
          'payment',
          'Khách báo trả chậm thêm 3 tháng thiết kế. Ví chưa tăng, chi phí đã làm vẫn giữ nguyên.',
        );
        continue;
      }
      if (unit(r, p.id + ':unpaid') < 0.06) {
        close(
          r,
          p,
          'unpaid',
          'Khách không thanh toán trong kỳ hẹn cuối. Khoản chưa thu được giữ trong hồ sơ, không biến thành tiền mặt.',
        );
        continue;
      }
      if (p.totals.received !== 0) throw Error('Invariant: repeated project payout');
      transact(r, p.id + ':payout', 'Khách thanh toán phần việc đã nghiệm thu', {
        cash: p.amountDue,
      });
      p.totals.received = p.amountDue;
      p.paidMonth = r.month;
      r.player.stats.skill = clamp(r.player.stats.skill + 2);
      reputation(r, p.amountDue === p.fee ? 8 : 3);
      close(
        r,
        p,
        p.amountDue === p.fee ? 'paid' : 'partial',
        `Bạn thực nhận ${formatMoney(p.amountDue, r)}. Hồ sơ khép, tiền công không được trả lại lần nữa khi tải hoặc tiến thời gian.`,
      );
    }
  }
  f.settledThrough = r.month;
}
export function closeFreelanceAtEnd(r: GameRun) {
  if (!hasCreativeRules(r)) return;
  for (const p of r.freelance!.projects.filter(active))
    close(
      r,
      p,
      'death',
      'Cuộc đời khép khi hồ sơ chưa hoàn tất. Công, chi phí và khoản chưa thu vẫn được ghi, không trả phí tự động.',
    );
}
export function freelanceSceneEligible(r: GameRun, id: string) {
  if (!hasCreativeRules(r) || r.month < 216 || !currentProject(r)) return false;
  const p = currentProject(r)!;
  if (id.startsWith('fl-service-'))
    return p.status === 'working' && id === 'fl-service-' + p.service;
  return id === 'fl-' + p.status;
}
export function applyFreelanceStory(r: GameRun, operation: FreelanceStoryOperation) {
  const p = currentProject(r);
  if (!hasCreativeRules(r) || !p || r.month < 216)
    throw Error('Cảnh hợp đồng không đúng hoàn cảnh.');
  let blocked: string | null = null;
  if (operation.startsWith('quote-') && p.status !== 'inquiry')
    blocked = 'Lời hỏi này đã được thương lượng.';
  if (['accept', 'accept-careful', 'accept-rush'].includes(operation)) {
    if (p.status !== 'offered') blocked = 'Chưa có đề nghị để nhận.';
    else {
      p.policy =
        operation === 'accept-careful'
          ? 'careful'
          : operation === 'accept-rush'
            ? 'rush'
            : 'steady';
      if (r.finance.cash < projectMonthlyCost(r, p))
        blocked = 'Bạn ghi nhịp dự kiến nhưng chưa nhận việc vì quỹ cá nhân chưa đủ; không tự vay.';
    }
  }
  if (['steady', 'careful', 'rush', 'rest'].includes(operation) && p.status !== 'working')
    blocked = 'Dự án không ở giai đoạn thực hiện.';
  if (operation === 'deliver' && p.status !== 'ready') blocked = 'Phần việc chưa sẵn sàng để giao.';
  if (operation === 'revise' && (p.status !== 'rework' || p.reworkUsed))
    blocked = 'Không còn lượt sửa của hồ sơ này.';
  if (operation === 'settle' && p.status !== 'rework')
    blocked = 'Chưa có yêu cầu sửa để thỏa thuận phần phí.';
  if (operation === 'polish' && (p.status !== 'ready' || p.reworkUsed))
    blocked = 'Không còn lượt tự kiểm tra lại.';
  if (blocked) {
    r.lastOutcome = blocked;
    return;
  }
  if (operation.startsWith('quote-')) negotiate(r, p, operation.slice(6) as ProjectTerms);
  else if (['accept', 'accept-careful', 'accept-rush'].includes(operation)) accept(r, p);
  else if (['steady', 'careful', 'rush', 'rest'].includes(operation))
    policy(r, p, operation as ProjectPolicy);
  else if (operation === 'deliver') deliver(r, p);
  else if (operation === 'revise') revise(r, p);
  else if (operation === 'settle') settle(r, p);
  else if (operation === 'polish') {
    p.reworkUsed = true;
    p.progress = 0;
    p.requiredMonths = 6;
    p.policy = 'careful';
    p.deadlineMonth = r.month + 18;
    mark(
      r,
      p,
      'working',
      'Bạn dùng lượt sửa để tự kiểm thêm 6 tháng trước khi giao. Nếu khách còn yêu cầu sửa, hồ sơ không có lượt sửa thứ hai.',
    );
  } else if (operation === 'wait')
    note(
      r,
      'Bạn kiểm lại hồ sơ và giữ lịch hiện tại. Tiền chưa nhận vẫn không được tính là tiền mặt.',
    );
  else {
    reputation(r, -3);
    close(r, p, 'declined', 'Bạn dừng hồ sơ đúng phần đã làm; không nhận khoản phí chưa được trả.');
  }
}
export function assertFreelance(r: GameRun) {
  if (!hasCreativeRules(r)) {
    if (r.freelance !== undefined) throw Error('Invariant: legacy freelance state');
    return;
  }
  const f = r.freelance;
  const integer = (n: number) => Number.isSafeInteger(n) && n >= 0;
  if (
    !f ||
    f.owner !== r.id ||
    f.settledThrough !== r.month ||
    !integer(f.reputation) ||
    f.reputation > 100 ||
    f.projects.length > 4 ||
    detailedBooks(r) > 4 ||
    f.projects.filter(active).length > 1
  )
    throw Error('Invariant: freelance ownership/budget');
  const known = new Set<string>();
  for (const [i, p] of f.projects.entries()) {
    known.add(p.id);
    if (
      p.id !== `freelance:${i}` ||
      p.owner !== r.id ||
      !CLIENT_SERVICES.some((s) => s.id === p.service) ||
      p.createdMonth < 216 ||
      p.createdMonth > r.month ||
      !['inquiry', 'offered', 'working', 'ready', 'review', 'rework', 'payment', 'closed'].includes(
        p.status,
      ) ||
      !['steady', 'careful', 'rush', 'rest'].includes(p.policy) ||
      !integer(p.fee) ||
      !integer(p.amountDue) ||
      p.amountDue > p.fee ||
      !integer(p.totals.cost) ||
      !integer(p.totals.received) ||
      p.totals.received > p.fee ||
      !integer(p.quality) ||
      p.quality > 100 ||
      !integer(p.progress) ||
      p.progress > p.requiredMonths ||
      ![6, 12].includes(p.requiredMonths) ||
      !integer(p.workMonths) ||
      !integer(p.stalledMonths) ||
      !integer(p.reviewAttempts) ||
      p.reviewAttempts > 2 ||
      p.milestones.length > 16
    )
      throw Error('Invariant: client project');
    if (
      p.status === 'closed'
        ? p.closedMonth === null || p.closedMonth > r.month || p.ending === null
        : p.closedMonth !== null || p.ending !== null
    )
      throw Error('Invariant: project closure');
    if (r.status === 'ended' && active(p)) throw Error('Invariant: terminal project');
    const tx = r.finance.transactions.filter((t) => t.id.startsWith(p.id + ':'));
    if (
      tx.some((t) => t.savings || t.debt || t.assets) ||
      tx.filter((t) => t.cash > 0).reduce((n, t) => n + t.cash, 0) !== p.totals.received ||
      -tx.filter((t) => t.cash < 0).reduce((n, t) => n + t.cash, 0) !== p.totals.cost ||
      tx.some((t) => t.cash > 0 && t.id !== p.id + ':payout') ||
      tx.reduce((n, t) => n + t.cash, 0) !== projectProfit(p) ||
      tx.filter((t) => t.id === p.id + ':payout').length !== (p.totals.received > 0 ? 1 : 0)
    )
      throw Error('Invariant: project cash reconciliation');
    if (
      p.totals.received > 0 !== (p.paidMonth !== null) ||
      (p.totals.received > 0 &&
        (!['paid', 'partial'].includes(p.ending ?? '') || p.status !== 'closed'))
    )
      throw Error('Invariant: project payment');
    for (const date of [p.acceptedMonth, p.closedMonth, p.paidMonth])
      if (date !== null && (!integer(date) || date < p.createdMonth || date > r.month))
        throw Error('Invariant: project date');
    if (
      !integer(p.deadlineMonth) ||
      p.deadlineMonth < p.createdMonth ||
      p.deadlineMonth > r.month + 24
    )
      throw Error('Invariant: project deadline');
    if (p.status !== 'inquiry' && p.status !== 'closed' && p.terms === null)
      throw Error('Invariant: project terms');
    if (p.terms !== null && !['modest', 'standard', 'premium'].includes(p.terms))
      throw Error('Invariant: project quote');
    for (const m of p.milestones)
      if (!integer(m.month) || m.month < p.createdMonth || m.month > r.month)
        throw Error('Invariant: project timeline');
  }
  if (
    r.finance.transactions.some(
      (t) => t.id.startsWith('freelance:') && !known.has(t.id.split(':').slice(0, 2).join(':')),
    )
  )
    throw Error('Invariant: orphan project payment');
}
