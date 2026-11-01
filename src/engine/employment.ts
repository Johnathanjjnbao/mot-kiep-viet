import type { CareerId, GameRun } from '../domain/model';
import type { EmploymentEnding, EmploymentOperation } from '../domain/employment';
import { CAREERS, careerReason, currentCareer, monthlyIncome } from '../content/world';
import { programById } from '../content/programs';
import { transact } from './finance';

type Roll = (run: GameRun) => number;
const cap = (v: number) => Math.max(0, Math.min(100, v));
const studying = (r: GameRun) =>
  r.academics?.studies.some((s) => s.status === 'studying') ||
  r.player.education.some((e) => e.endMonth > r.month);
function note(r: GameRun, title: string, text: string) {
  r.journal.push({
    id: `employment:${r.journal.length}`,
    month: r.month,
    title,
    text,
    category: 'career',
  });
  r.lastOutcome = text;
}
export function syncEmployment(r: GameRun) {
  const state = r.employment;
  if (!state) return;
  const seeking =
    r.month >= 216 && r.month < 780 && !currentCareer(r) && !studying(r) && r.status !== 'ended';
  const open = state.periods.at(-1);
  if (seeking && (!open || open.endMonth !== null))
    state.periods.push({ startMonth: r.month, endMonth: null });
  else if (!seeking && open?.endMonth === null) open.endMonth = r.month;
}
export function jobProbability(r: GameRun, id: CareerId) {
  const job = CAREERS.find((j) => j.id === id)!;
  const related = r.academics?.qualifications.some((q) =>
    programById(q.programId)!.careers.includes(id),
  );
  const experience = r.player.careers
    .filter((c) => c.id === id)
    .reduce((n, c) => n + c.experience, 0);
  const rejections =
    r.employment?.applications.filter((a) => a.career === id && a.result === 'rejected').length ??
    0;
  return Math.max(
    0.15,
    Math.min(
      0.92,
      0.42 +
        (r.player.stats.skill - job.skill) / 300 +
        (r.player.stats.knowledge - job.knowledge) / 500 +
        r.player.stats.social / 500 -
        r.player.stats.stress / 1000 +
        (related ? 0.12 : 0) +
        Math.min(0.12, experience / 600) +
        Math.min(0.09, rejections * 0.03) +
        (r.player.traits.includes('Kiên trì') ? 0.015 : 0),
    ),
  );
}
export function endEmployment(r: GameRun, ending: EmploymentEnding) {
  const job = currentCareer(r);
  if (!job) return;
  const index = r.player.careers.indexOf(job),
    name = CAREERS.find((j) => j.id === job.id)!.name;
  const support = ending === 'layoff' ? Math.min(80, monthlyIncome(r) * 2) : 0;
  job.endMonth = r.month;
  job.ending = ending;
  if (support)
    transact(r, `employment:transition:${index}`, 'Hỗ trợ chuyển tiếp khi mất việc (mô phỏng)', {
      cash: support,
    });
  const labels: Record<EmploymentEnding, string> = {
    resigned: 'Bạn chủ động rời việc',
    switched: 'Bạn khép công việc để chuyển hướng',
    layoff: 'Nơi làm việc cắt giảm vị trí',
    'contract-ended': 'Hợp đồng sáu tháng đã kết thúc',
    retired: 'Bạn khép lại chặng đi làm để nghỉ hưu',
    story: 'Chặng công việc đã khép lại',
  };
  note(
    r,
    `Khép lại: ${name}`,
    `${labels[ending]}. Kinh nghiệm đã làm được giữ trong lịch sử.${support ? ` Khoản hỗ trợ ${support} đSM đã vào sổ; đây là tham số trò chơi.` : ''}`,
  );
  if (r.employment && ending !== 'switched' && ending !== 'retired') r.employment.notice = true;
  syncEmployment(r);
}
export function applyEmployment(
  r: GameRun,
  id: CareerId,
  roll: Roll,
  source: 'panel' | 'story' | 'support' = 'panel',
) {
  if (!r.employment) throw Error('Cuộc đời này giữ luật nghề nghiệp cũ.');
  if (source === 'story' && currentCareer(r)?.id === id) {
    note(
      r,
      'Tiếp tục hướng nghề đã chọn',
      'Bạn tiếp tục công việc hiện tại. Kinh nghiệm, hợp đồng và thu nhập theo tháng được giữ; không tạo thêm hồ sơ hay một lần nhận lương.',
    );
    return true;
  }
  const reason = source === 'support' ? temporaryReason(r) : careerReason(r, id);
  if (reason) throw Error(reason);
  if (currentCareer(r)?.id === id) throw Error('Bạn đang làm công việc này.');
  const probability = source === 'support' ? 1 : jobProbability(r, id);
  const accepted = source === 'support' || roll(r) < probability;
  r.employment.applications.push({
    id: `job:${r.employment.applications.length}`,
    career: id,
    month: r.month,
    result: accepted ? 'accepted' : 'rejected',
    probability,
    source,
  });
  const name = CAREERS.find((j) => j.id === id)!.name;
  if (!accepted) {
    r.player.stats.stress = cap(r.player.stats.stress + 3);
    if (!currentCareer(r)) r.employment.notice = true;
    note(
      r,
      `Hồ sơ: ${name}`,
      `Hồ sơ ${name} chưa được nhận. Không có lương hay phí tuyển dụng; bạn có thể thử nơi khác, học thêm hoặc nộp lại cùng nghề sau 6 tháng.${currentCareer(r) ? ' Công việc hiện tại vẫn được giữ.' : ''}`,
    );
    syncEmployment(r);
    return false;
  }
  if (currentCareer(r)) endEmployment(r, 'switched');
  const qualified = !!r.academics?.qualifications.length;
  const related = r.academics?.qualifications.some((q) =>
    programById(q.programId)!.careers.includes(id),
  );
  r.player.careers.push({
    id,
    startMonth: r.month,
    endMonth: null,
    experience: 0,
    level: 0,
    incomeFactor: 1,
    field: qualified ? (related ? 'related' : 'outside') : 'none',
    ...(id === 'labor' ? { contractEndMonth: r.month + 6 } : {}),
  });
  if (source === 'support') r.employment.placements.push(r.month);
  r.employment.notice = false;
  syncEmployment(r);
  note(
    r,
    `Bắt đầu: ${name}`,
    `Bạn được nhận vào công việc ${name}.${id === 'labor' ? ' Đây là hợp đồng tạm sáu tháng.' : ''}${qualified && !related ? ' Bạn chọn làm ngoài hướng ngành đã học; văn bằng vẫn được giữ.' : ''} Thu nhập chỉ ghi theo từng tháng thực sự làm việc.`,
  );
  return true;
}
export function temporaryReason(r: GameRun): string | null {
  const state = r.employment;
  if (!state) return 'Cuộc đời này giữ luật nghề nghiệp cũ.';
  if (currentCareer(r)) return 'Hãy giữ hoặc rời công việc hiện tại trước.';
  if (state.placements.length >= 40 || state.applications.length >= 120)
    return 'Đã dùng hết số lượt hỗ trợ việc tạm trong mô phỏng.';
  if (state.placements.length && r.month - state.placements.at(-1)! < 6)
    return 'Điểm giới thiệu việc tạm nhận lại hồ sơ sau 6 tháng.';
  return careerReason(r, 'labor', true);
}
export function trainingReason(r: GameRun) {
  if (!r.employment || r.month < 216 || r.month >= 780 || r.status === 'ended')
    return 'Chưa thể đăng ký lớp kỹ năng này.';
  if (studying(r)) return 'Hãy sắp xếp chương trình đang học trước.';
  if (r.employment.trainingMonths.length >= 40) return 'Đã đạt giới hạn lớp kỹ năng trong một đời.';
  if (r.employment.trainingMonths.length && r.month - r.employment.trainingMonths.at(-1)! < 6)
    return 'Hãy dành 6 tháng thực hành trước lớp tiếp theo.';
  if (r.finance.cash < 20) return 'Cần 20 đSM; buổi hướng dẫn hồ sơ trong câu chuyện vẫn miễn phí.';
  return null;
}
export function trainEmployment(r: GameRun) {
  const reason = trainingReason(r);
  if (reason) throw Error(reason);
  transact(
    r,
    `employment:training:${r.employment!.trainingMonths.length}`,
    'Lớp chuyển kỹ năng ngắn hạn',
    { cash: -20 },
  );
  r.employment!.trainingMonths.push(r.month);
  r.player.stats.skill = cap(r.player.stats.skill + 5);
  r.player.stats.knowledge = cap(r.player.stats.knowledge + 3);
  r.player.stats.stress = cap(r.player.stats.stress + 2);
  note(
    r,
    'Tập một kỹ năng khác',
    'Bạn học lớp ngắn hạn rồi dành thời gian thực hành. Kỹ năng tăng, chưa có thêm văn bằng hay lời hứa tuyển dụng.',
  );
}
export function employmentSceneEligible(r: GameRun) {
  return (
    !!r.employment &&
    !r.social?.focus &&
    !r.family?.focus &&
    !r.academics?.focus &&
    !currentCareer(r) &&
    !studying(r) &&
    !temporaryReason(r)
  );
}
export function employmentInterrupt(r: GameRun) {
  return !!r.employment?.notice && employmentSceneEligible(r);
}
export function resolveEmployment(r: GameRun, operation: EmploymentOperation, roll: Roll) {
  if (!r.employment || !employmentSceneEligible(r))
    throw Error('Câu chuyện tìm việc không còn phù hợp.');
  if (operation === 'temporary') applyEmployment(r, 'labor', roll, 'support');
  else if (operation === 'search') {
    const jobs = CAREERS.filter((j) => !careerReason(r, j.id));
    if (jobs.length) applyEmployment(r, jobs[Math.floor(roll(r) * jobs.length)].id, roll, 'story');
    else {
      r.player.stats.social = cap(r.player.stats.social + 3);
      note(
        r,
        'Giữ liên hệ tìm việc',
        'Bạn hỏi thêm những nơi khác, chuẩn bị hồ sơ trong lúc chờ hết thời hạn nộp lại.',
      );
    }
  } else if (operation === 'train') {
    r.player.stats.skill = cap(r.player.stats.skill + 3);
    r.player.stats.knowledge = cap(r.player.stats.knowledge + 2);
    note(
      r,
      'Sửa lại hồ sơ',
      'Bạn tham gia buổi hướng dẫn miễn phí, tập trình bày việc mình đã làm và thử một kỹ năng. Chưa có văn bằng mới.',
    );
  } else {
    r.player.stats.stress = cap(r.player.stats.stress - 7);
    r.player.stats.health = cap(r.player.stats.health + 2);
    note(
      r,
      'Giữ nhịp sống khi chưa có việc',
      'Bạn chăm lại giấc ngủ và sinh hoạt. Sức khỏe được cải thiện, còn chi phí vẫn tiếp tục tính theo tháng.',
    );
  }
}
export function tickEmployment(r: GameRun, roll: Roll) {
  if (!r.employment) return;
  const job = currentCareer(r);
  if (job?.contractEndMonth && r.month >= job.contractEndMonth) endEmployment(r, 'contract-ended');
  else if (
    job &&
    r.month % 12 === 0 &&
    r.month - job.startMonth >= 12 &&
    !['farm', 'business', 'freelance'].includes(job.id)
  ) {
    const definition = CAREERS.find((j) => j.id === job.id)!;
    if (roll(r) < (1 - definition.stability) * 0.25) endEmployment(r, 'layoff');
  }
  syncEmployment(r);
  const period = r.employment.periods.at(-1);
  if (period?.endMonth === null) {
    const duration = r.month - period.startMonth;
    if (duration > 0 && duration % 6 === 0) {
      const dependents = r.npcs.filter(
        (n) =>
          n.role === 'child' &&
          n.alive &&
          n.presence === 'resident' &&
          r.world.year - n.birthYear < 18,
      ).length;
      r.player.stats.stress = cap(r.player.stats.stress + 2 + Math.min(3, dependents));
      r.employment.notice = true;
      if (duration % 12 === 0)
        note(
          r,
          'Một năm tìm hướng mưu sinh',
          `Bạn đã trải qua ${duration} tháng liên tiếp chưa có việc. Chi phí và khoản nợ vẫn được ghi sổ; việc tạm, học thêm và những hồ sơ khác vẫn là các hướng có thể thử.`,
        );
    }
  }
}
export function assertEmployment(r: GameRun) {
  const state = r.employment;
  if (!['career-v1', 'annual-v1'].includes(r.setup.lifeRules ?? '')) {
    if (state) throw Error('Invariant: unexpected employment rules');
    return;
  }
  if (
    !state ||
    state.applications.length > 120 ||
    state.periods.length > 200 ||
    state.trainingMonths.length > 40 ||
    state.placements.length > 40
  )
    throw Error('Invariant: employment state');
  if (
    state.applications.some(
      (a, i) =>
        a.id !== `job:${i}` ||
        a.month > r.month ||
        a.month < 216 ||
        a.probability < 0 ||
        a.probability > 1 ||
        !CAREERS.some((j) => j.id === a.career),
    )
  )
    throw Error('Invariant: job application');
  if (state.periods.filter((p) => p.endMonth === null).length > 1)
    throw Error('Invariant: overlapping unemployment');
  for (let i = 0; i < state.periods.length; i++) {
    const p = state.periods[i],
      previous = state.periods[i - 1];
    if (
      p.startMonth < 216 ||
      p.startMonth > r.month ||
      (p.endMonth !== null && (p.endMonth < p.startMonth || p.endMonth > r.month)) ||
      (previous && (previous.endMonth === null || previous.endMonth > p.startMonth))
    )
      throw Error('Invariant: unemployment period');
  }
  if (state.periods.at(-1)?.endMonth === null && currentCareer(r))
    throw Error('Invariant: unemployed with a full-time job');
  for (const [i, job] of r.player.careers.entries()) {
    if (job.ending && job.endMonth === null) throw Error('Invariant: active ended employment');
    if (job.contractEndMonth && (job.id !== 'labor' || job.contractEndMonth !== job.startMonth + 6))
      throw Error('Invariant: temporary contract');
    const payments = r.finance.transactions.filter((t) => t.id === `employment:transition:${i}`);
    if (payments.length !== (job.ending === 'layoff' ? 1 : 0))
      throw Error('Invariant: transition support ledger');
  }
  if (
    r.finance.transactions.filter((t) => t.id.startsWith('employment:training:')).length !==
    state.trainingMonths.length
  )
    throw Error('Invariant: retraining ledger');
}
