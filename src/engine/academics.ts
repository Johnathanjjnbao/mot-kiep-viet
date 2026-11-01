import { hasAcademicRules } from '../domain/rules';
import { designMoney, formatMoney } from '../domain/currency';
import type { GameRun } from '../domain/model';
import type { AcademicAction, AcademicMethod, StudyRecord, ProgramId } from '../domain/academics';
import { academicTemplates, programById } from '../content/programs';
import { transact } from './finance';
import { isAnnual } from './annual';
import { stageTemplate } from '../content/academic-stages';

type Roll = (run: GameRun) => number;
const cap = (v: number) => Math.max(0, Math.min(100, v));
export const currentStudy = (r: GameRun) =>
  r.academics?.studies.find((s) => s.status === 'studying' || s.status === 'paused');
export function studyCosts(r: GameRun, id: ProgramId) {
  const p = programById(id)!;
  const tuition = designMoney(r, p.tuition);
  const scholarship =
    r.player.stats.knowledge >= p.knowledge + 25 && r.player.stats.stress <= 70
      ? Math.round(tuition * 0.5)
      : 0;
  const support =
    r.household.resources >= 2 &&
    r.month < 300 &&
    r.npcs.some((n) => ['mother', 'father'].includes(n.id) && n.presence === 'resident' && n.alive)
      ? Math.round(tuition * 0.2)
      : 0;
  return { tuition, scholarship, support, required: tuition - scholarship - support };
}
function note(r: GameRun, title: string, text: string) {
  r.journal.push({
    id: `academic-note:${r.journal.length}`,
    month: r.month,
    title,
    text,
    category: 'education',
  });
}
function payTerm(r: GameRun, s: StudyRecord) {
  if (s.paidTerms > s.termAttempts) return;
  const cost = studyCosts(r, s.programId),
    key = `academic:${s.id}:${s.termAttempts}`;
  if (r.finance.cash < cost.required)
    throw Error(
      `Cần ${formatMoney(cost.required, r)} học phí còn lại; có thể đi làm hoặc tích lũy rồi học tiếp.`,
    );
  if (cost.scholarship)
    transact(r, key + ':scholarship', 'Học bổng kỳ học', { cash: cost.scholarship });
  if (cost.support)
    transact(r, key + ':support', 'Gia đình hỗ trợ học phí', { cash: cost.support });
  transact(r, key + ':tuition', `Học phí ${programById(s.programId)!.name}`, {
    cash: -cost.tuition,
  });
  s.paidTerms++;
}
export function admissionReason(r: GameRun, id: ProgramId, switching = false): string | null {
  const p = programById(id);
  if (!r.academics || !p) return 'Chương trình chưa có trong cuộc đời này.';
  if (r.status === 'ended' || r.month < 216 || r.month >= 720)
    return 'Có thể nộp hồ sơ từ 18 đến trước 60 tuổi trong mô phỏng.';
  if (!r.flags['edu-direction-chosen'])
    return 'Hãy chọn hướng sau phổ thông trong câu chuyện trước.';
  if (r.academics.focus || r.social?.focus || r.family?.focus)
    return 'Hãy hoàn tất cuộc đối thoại đang chờ.';
  if (!switching && currentStudy(r))
    return 'Hãy bảo lưu, nghỉ học hoặc chuyển ngành của chương trình hiện tại.';
  if (r.player.careers.some((c) => c.endMonth === null))
    return 'Hãy sắp xếp rời công việc toàn thời gian trước khi nhập học.';
  if (r.player.education.some((e) => e.endMonth > r.month))
    return 'Hãy hoàn thành khóa học đang có trước.';
  if (r.world.year < p.from) return `Chương trình này mở trong mô phỏng từ năm ${p.from}.`;
  if (r.player.stats.knowledge < p.knowledge)
    return `Cần ít nhất ${p.knowledge} tri thức để nộp hồ sơ.`;
  if (r.academics.applications.length >= 24 || r.academics.studies.length >= 12)
    return 'Đã đạt giới hạn hồ sơ trong cuộc đời.';
  if (r.academics.applications.some((a) => a.programId === id && r.month - a.month < 6))
    return 'Cần đợi 6 tháng trước khi nộp lại cùng ngành.';
  const cost = studyCosts(r, id);
  if (r.finance.cash < cost.required)
    return `Cần chuẩn bị ${formatMoney(cost.required, r)} sau hỗ trợ cho năm đầu.`;
  return null;
}
export function academicDue(r: GameRun) {
  return !!r.academics?.studies.some((s) => s.status === 'studying' && r.month >= s.nextTermMonth);
}
export function focusAcademic(r: GameRun) {
  if (!r.academics || r.academics.focus || r.social?.focus || r.family?.focus) return false;
  const s = r.academics.studies.find((s) => s.status === 'studying' && r.month >= s.nextTermMonth);
  if (!s) return false;
  const instanceId = `academic:${r.academics.studies.indexOf(s)}:${s.termAttempts}:${r.month}`;
  r.academics.focus = { studyId: s.id, instanceId, resume: r.activeEvent };
  r.activeEvent = { id: instanceId, month: r.month };
  return true;
}
export function academicDefinition(r: GameRun) {
  const focus = r.academics?.focus;
  if (!focus || focus.instanceId !== r.activeEvent?.id) return undefined;
  const s = r.academics!.studies.find((s) => s.id === focus.studyId)!;
  const p = programById(s.programId)!;
  if (isAnnual(r)) return { ...stageTemplate(r, s), id: focus.instanceId };
  const template = academicTemplates.find((e) => e.id === 'edu-' + p.id)!;
  return { ...template, id: focus.instanceId, title: `Năm ${s.completedYears + 1}: ${p.incident}` };
}
export function requestAcademic(input: GameRun, a: AcademicAction, roll: Roll) {
  if (!input.academics || !hasAcademicRules(input))
    throw Error('Cuộc đời này giữ luật học tập đã tạo trước đây.');
  if (a.expected !== input.actions.length || input.status !== 'playing')
    throw Error('Thao tác học tập đã cũ; hãy tải trạng thái mới.');
  if (input.academics.focus || input.social?.focus || input.family?.focus)
    throw Error('Hãy giải quyết sự kiện đang chờ trước.');
  const management = input.actions.filter((x) =>
    ['manage', 'wardrobe', 'social', 'family-talk', 'academic', 'enterprise'].includes(x.type),
  ).length;
  if (
    (input.family && management >= 120) ||
    input.actions.filter((x) => x.type === 'academic').length >= 40
  )
    throw Error('Hãy tiếp tục câu chuyện trước khi quản lý thêm.');
  if ((a.operation === 'apply' || a.operation === 'switch') !== !!a.program)
    throw Error('Hãy chọn đúng chương trình cho thao tác này.');
  const r = structuredClone(input),
    state = r.academics!;
  const previousStudy = currentStudy(r) ? structuredClone(currentStudy(r)) : undefined;
  let study = currentStudy(r);
  let message: string;
  if (a.operation === 'pause') {
    if (!study || study.status !== 'studying') throw Error('Chưa có chương trình đang học.');
    study.status = 'paused';
    study.pausedMonth = r.month;
    message = 'Bạn bảo lưu. Tiến độ và học phí đã đóng được giữ.';
  } else if (a.operation === 'resume') {
    if (!study || study.status !== 'paused') throw Error('Chưa có chương trình đang bảo lưu.');
    if (isAnnual(r) && r.month - study.pausedMonth! < 6)
      throw Error('Cần bảo lưu ít nhất6 tháng trước khi trở lại học.');
    if (r.player.careers.some((c) => c.endMonth === null))
      throw Error('Hãy rời công việc toàn thời gian trước khi trở lại học.');
    payTerm(r, study);
    study.nextTermMonth =
      r.month + Math.max(1, study.nextTermMonth - (study.pausedMonth ?? r.month));
    study.pausedMonth = null;
    study.status = 'studying';
    message = 'Bạn trở lại học, tiếp tục phần chương trình còn lại.';
  } else if (a.operation === 'dropout') {
    if (!study) throw Error('Chưa có chương trình để nghỉ học.');
    study.status = 'dropped';
    study.endMonth = r.month;
    study.pausedMonth = null;
    message = 'Bạn nghỉ chương trình. Những năm đã học được ghi lại, chưa có bằng tốt nghiệp.';
  } else if (a.operation === 'term') {
    if (!focusAcademic(r)) throw Error('Chưa tới kỳ đánh giá năm học.');
    message = 'Bạn xem lại một năm học và chọn bước tiếp theo.';
  } else {
    if (a.operation === 'switch') {
      if (!study || study.programId === a.program)
        throw Error('Hãy chọn một ngành khác với chương trình hiện tại.');
      study.status = 'switched';
      study.endMonth = r.month;
      study.pausedMonth = null;
    }
    const reason = admissionReason(r, a.program!);
    if (reason) throw Error(reason);
    const p = programById(a.program!)!;
    const probability = Math.max(
      0.15,
      Math.min(
        0.9,
        0.45 +
          (r.player.stats.knowledge - p.knowledge) / 100 +
          r.household.resources * 0.02 +
          (r.flags['academic-interest'] ? 0.02 : 0) +
          (r.flags['childhood-project'] ? 0.03 : 0),
      ),
    );
    const accepted = roll(r) < probability;
    state.applications.push({
      id: `application:${state.applications.length}`,
      programId: p.id,
      month: r.month,
      result: accepted ? 'accepted' : 'rejected',
      probability,
    });
    if (accepted) {
      study = {
        id: `${r.id}:study:${state.studies.length}`,
        programId: p.id,
        startMonth: r.month,
        endMonth: null,
        status: 'studying',
        completedYears: 0,
        termAttempts: 0,
        paidTerms: 0,
        nextTermMonth: r.month + 12,
        pausedMonth: null,
        internship: false,
        results: [],
      };
      payTerm(r, study);
      state.studies.push(study);
      message = `Bạn được nhận vào ${p.name}. Học phí năm đầu đã ghi sổ; chưa có văn bằng cho đến khi hoàn thành ${p.years} năm đạt yêu cầu.`;
    } else {
      if (a.operation === 'switch' && study && previousStudy) Object.assign(study, previousStudy);
      r.player.stats.stress = cap(r.player.stats.stress + 3);
      message = `Hồ sơ ${p.name} chưa được nhận. Bạn có thể chuẩn bị thêm, thử ngành khác hoặc nộp lại sau 6 tháng; không bị trừ học phí.`;
    }
  }
  r.actions.push({ ...a });
  r.lastOutcome = message;
  note(r, 'Một lựa chọn học tập', message);
  return r;
}
export function resolveAcademic(r: GameRun, method: AcademicMethod, roll: Roll) {
  const focus = r.academics?.focus,
    s = r.academics?.studies.find((s) => s.id === focus?.studyId);
  if (!s || s.status !== 'studying' || r.month < s.nextTermMonth)
    throw Error('Kỳ học không còn hợp lệ.');
  const p = programById(s.programId)!;
  if (method === 'pause') {
    if (!isAnnual(r)) throw Error('Luật học tập cũ không có lựa chọn này.');
    s.status = 'paused';
    s.pausedMonth = r.month;
    r.lastOutcome =
      'Bạn bảo lưu thật sự. Tiến độ và học phí đã đóng được giữ; không thu học phí năm mới khi đang bảo lưu. Có thể trở lại sau6 tháng, hoặc nghỉ chương trình.';
    note(r, p.name, r.lastOutcome);
    return;
  }
  const templateId = isAnnual(r) ? stageTemplate(r, s).id : undefined;
  const score =
    method === 'rest'
      ? 0
      : cap(
          Math.round(
            35 +
              r.player.stats.knowledge * 0.35 +
              r.player.stats.skill * 0.2 -
              r.player.stats.stress * 0.2 -
              p.difficulty * 0.2 +
              { steady: 8, project: 3, work: -10 }[method] +
              (roll(r) * 36 - 18),
          ),
        );
  const passed = method !== 'rest' && score >= 45;
  s.results.push({ month: r.month, method, score, passed, ...(templateId ? { templateId } : {}) });
  s.termAttempts++;
  if (method === 'rest') {
    r.player.stats.stress = cap(r.player.stats.stress - 10);
    r.player.stats.mood = cap(r.player.stats.mood + 5);
  } else {
    for (const skill of p.skills)
      r.player.stats[skill] = cap(r.player.stats[skill] + (method === 'project' ? 5 : 3));
    r.player.stats.stress = cap(
      r.player.stats.stress + (method === 'work' ? 6 : method === 'project' ? 4 : 1),
    );
    if (method === 'work')
      transact(
        r,
        `academic:part-time:${s.id}:${s.termAttempts}`,
        'Thu nhập làm thêm trong năm học',
        { cash: designMoney(r, 36) },
      );
    if (passed) {
      s.completedYears++;
      if (method === 'project' && s.completedYears >= 3) s.internship = true;
    }
  }
  let text =
    method === 'rest'
      ? 'Bạn hồi phục và lùi tiến độ một năm.'
      : passed
        ? `Bạn đạt đánh giá năm ${s.completedYears} (${score} điểm mô phỏng).`
        : `Đánh giá ${score} điểm, chưa đạt. Bạn cần học lại phần năm này.`;
  if (s.completedYears === p.years) {
    s.status = 'graduated';
    s.endMonth = r.month;
    r.academics!.qualifications.push({
      studyId: s.id,
      programId: s.programId,
      awardedMonth: r.month,
      kind: 'degree',
    });
    text += ` Bạn tốt nghiệp ${p.name}. Văn bằng không thay giấy phép hành nghề có điều kiện.`;
  } else if (s.termAttempts >= p.years + 4) {
    s.status = 'failed';
    s.endMonth = r.month;
    text +=
      ' Chương trình khép lại khi đã hết số năm học lại trong mô phỏng; chưa cấp bằng. Bạn vẫn có thể đi làm hoặc chọn hướng học khác.';
  } else {
    s.nextTermMonth = r.month + 12;
    if (r.finance.cash < studyCosts(r, s.programId).required) {
      s.status = 'paused';
      s.pausedMonth = r.month;
      text += ' Năm tiếp theo cần thêm học phí; tiến độ được bảo lưu để bạn chuẩn bị.';
    } else payTerm(r, s);
  }
  r.lastOutcome = text;
  note(r, p.name, text);
}
export function assertAcademics(r: GameRun) {
  const state = r.academics;
  if (!hasAcademicRules(r)) {
    if (state) throw Error('Invariant: unexpected academic rules');
    return;
  }
  if (!state || state.applications.length > 24 || state.studies.length > 12)
    throw Error('Invariant: academic state');
  if (state.studies.filter((s) => s.status === 'studying' || s.status === 'paused').length > 1)
    throw Error('Invariant: competing studies');
  for (const s of state.studies) {
    const p = programById(s.programId);
    if (
      !p ||
      s.startMonth < 216 ||
      s.startMonth > r.month ||
      s.completedYears < 0 ||
      s.completedYears > p.years ||
      s.termAttempts !== s.results.length ||
      s.paidTerms > s.termAttempts + 1 ||
      s.paidTerms < 1 ||
      s.termAttempts > p.years + 4
    )
      throw Error('Invariant: academic progress');
    if (
      s.completedYears !== s.results.filter((x) => x.passed).length ||
      s.results.some(
        (x) => x.month > r.month || !Number.isInteger(x.score) || x.score < 0 || x.score > 100,
      )
    )
      throw Error('Invariant: academic results');
    if ((s.status === 'graduated') !== (s.completedYears === p.years))
      throw Error('Invariant: graduation');
    if ((s.status === 'paused') !== (s.pausedMonth !== null)) throw Error('Invariant: study pause');
    const q = state.qualifications.filter((q) => q.studyId === s.id);
    if (
      q.length !== (s.status === 'graduated' ? 1 : 0) ||
      q.some((q) => q.programId !== s.programId || q.awardedMonth !== s.endMonth)
    )
      throw Error('Invariant: qualification');
    if (
      r.finance.transactions.filter(
        (t) => t.id.startsWith(`academic:${s.id}:`) && t.id.endsWith(':tuition'),
      ).length !== s.paidTerms
    )
      throw Error('Invariant: tuition ledger');
  }
  if (state.qualifications.some((q) => !state.studies.some((s) => s.id === q.studyId)))
    throw Error('Invariant: orphan degree');
  if (new Set(state.studies.map((s) => s.id)).size !== state.studies.length)
    throw Error('Invariant: duplicate study');
  if (
    state.focus &&
    (!state.studies.some((s) => s.id === state.focus!.studyId) ||
      state.focus.instanceId !== r.activeEvent?.id ||
      r.family?.focus ||
      r.social?.focus)
  )
    throw Error('Invariant: academic focus');
  if (
    state.studies.some((s) => s.status === 'studying') &&
    r.player.careers.some((c) => c.endMonth === null)
  )
    throw Error('Invariant: fulltime study and work');
}
