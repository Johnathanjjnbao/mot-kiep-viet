import type { GameRun, EventDefinition } from '../domain/model';
import type { ChildDevelopment, FamilyAction, ParentingStyle } from '../domain/family';
import { parentingEvents } from '../content/parenting-events';
import { hashSeed } from './random';
const cap = (n: number) => Math.max(0, Math.min(100, n));
export const playerId = (r: GameRun) => 'player:' + r.id;
export const childAge = (r: GameRun, c: ChildDevelopment) =>
  Math.floor((r.month - c.bornMonth) / 12);
export const PARENTING_LABELS: Record<ParentingStyle, string> = {
  support: 'Nâng đỡ',
  discipline: 'Kỷ luật',
  achievement: 'Kỳ vọng thành tích',
  explore: 'Khuyến khích tự chủ',
  protect: 'Bao bọc',
  distant: 'Ít hiện diện',
  inconsistent: 'Thất thường',
  balanced: 'Trao đổi và giới hạn',
};
export function initFamily(r: GameRun) {
  r.family = { children: [], nextBirth: null, queue: [], focus: null, encounters: {} };
}
function note(r: GameRun, text: string) {
  r.journal.push({
    id: `journal:${r.journal.length}`,
    month: r.month,
    title: 'Những mùa con lớn',
    text,
    category: 'relationship',
  });
}
function remember(r: GameRun, c: ChildDevelopment, text: string, style?: ParentingStyle) {
  c.memories.push({ month: r.month, text, ...(style ? { style } : {}) });
  note(r, `${r.npcs.find((n) => n.id === c.npcId)!.name}: ${text}`);
}
export function planBirth(r: GameRun): string {
  const f = r.family,
    s = r.social;
  if (!f || !s?.childrenPlanned) return '';
  if (f.nextBirth) return ' Kế hoạch đón con đã có; không tạo thêm lịch trùng.';
  if (
    f.children.length >= 4 ||
    r.month > 55 * 12 ||
    f.children.some((c) => r.month - c.bornMonth < 24)
  )
    return ' Gia đình cần thêm thời gian hoặc đã đạt phạm vi bốn người con của mô phỏng.';
  const p = s.people.find((p) => p.npcId === s.primaryId);
  if (
    !p ||
    !p.wantsChildren ||
    !['married', 'cohabiting'].includes(p.status) ||
    !r.npcs.find((n) => n.id === p.npcId)?.alive
  )
    return ' Chưa có kế hoạch đón con được cả hai xác nhận.';
  f.nextBirth = { dueMonth: r.month + 12, parentId: p.npcId };
  return ' Gia đình ghi kế hoạch đón con sau một năm chuẩn bị.';
}
function queue(r: GameRun, id: string, c: ChildDevelopment) {
  const f = r.family!,
    key = `scheduled:${id}:${c.npcId}`;
  if (f.encounters[key] !== undefined) return;
  f.encounters[key] = r.month;
  f.queue.push({ templateId: id, childId: c.npcId, dueMonth: r.month });
}
function birth(r: GameRun, parentId: string) {
  const f = r.family!,
    npcId = `child:${r.npcs.length}`,
    h = hashSeed(r.seed + ':child:' + npcId),
    name = ['An', 'Bình', 'Mai', 'Khuê'][f.children.length];
  r.npcs.push({
    id: npcId,
    name: 'Con · ' + name,
    role: 'child',
    birthYear: r.world.year,
    alive: true,
  });
  r.relationships.push({
    npcId,
    type: 'child',
    strength: 75,
    history: [`${r.world.year}: Chào đời`],
  });
  const c: ChildDevelopment = {
    npcId,
    bornMonth: r.month,
    parents: [playerId(r), parentId],
    caregivers: [playerId(r), parentId],
    visitingParents: [],
    custody: 'shared',
    inHousehold: true,
    temperament: (['curious', 'cautious', 'intense', 'easygoing'] as const)[h % 4],
    interest: (['academic', 'practical', 'creative', 'technology'] as const)[(h >>> 4) % 4],
    tendencies: {
      confidence: 40 + (h % 21),
      curiosity: 35 + ((h >>> 5) % 31),
      discipline: 40 + ((h >>> 8) % 21),
      ambition: 35 + ((h >>> 11) % 26),
      stress: 15 + ((h >>> 15) % 21),
    },
    wellbeing: 65,
    bond: 75,
    skills: { study: 15, craft: 15, art: 15, technology: 15 },
    patterns: {
      support: 0,
      discipline: 0,
      achievement: 0,
      explore: 0,
      protect: 0,
      distant: 0,
      inconsistent: 0,
      balanced: 0,
    },
    caregiverBonds: { [playerId(r)]: 75, [parentId]: 75 },
    education: 'Chưa đến tuổi đi học',
    parentPreference: null,
    aspiration: 'Đang khám phá',
    occupation: null,
    adultFamily: false,
    memories: [],
  };
  f.children.push(c);
  f.nextBirth = null;
  r.social!.childrenPlanned = false;
  remember(r, c, 'Chào đời với hai tham chiếu cha mẹ được giữ riêng khỏi tình trạng hôn nhân.');
  queue(r, 'family-birth', c);
  for (const sibling of f.children.filter((x) => x !== c)) queue(r, 'family-sibling', sibling);
}
export function syncCare(r: GameRun) {
  const f = r.family;
  if (!f) return;
  for (const c of f.children) {
    if (!r.npcs.find((n) => n.id === c.npcId)?.alive) {
      c.inHousehold = false;
      continue;
    }
    const previousCare = c.caregivers.join('|');
    const alive = (id: string) =>
      id === playerId(r) ? r.player.alive : !!r.npcs.find((n) => n.id === id)?.alive;
    if (childAge(r, c) >= 24 && !c.inHousehold) {
      c.caregivers = [];
      c.visitingParents = c.parents.filter(alive);
      c.custody = 'independent';
      continue;
    }
    let caregivers = c.parents.filter(
      (id) =>
        alive(id) &&
        (id === playerId(r) || r.social?.people.some((p) => p.npcId === id && p.cohabiting)),
    );
    const step = r.social?.people.find((p) => p.cohabiting && alive(p.npcId));
    if (step && !caregivers.includes(step.npcId)) caregivers.push(step.npcId);
    if (!caregivers.length) {
      const guardian = r.npcs.find(
        (n) => n.alive && n.role !== 'child' && r.world.year - n.birthYear >= 18,
      );
      if (guardian) caregivers = [guardian.id];
    }
    c.caregivers = caregivers;
    if (previousCare !== caregivers.join('|')) {
      const response = 2 + (hashSeed(r.seed + ':care-change:' + c.npcId + ':' + r.month) % 5);
      c.tendencies.stress = cap(
        c.tendencies.stress + response + (c.temperament === 'cautious' ? 2 : 0),
      );
      c.wellbeing = cap(c.wellbeing - response);
      remember(
        r,
        c,
        'Người chăm sóc trong nhà thay đổi; con cần thời gian thích nghi, các quan hệ cha mẹ vẫn được giữ.',
      );
    }
    c.visitingParents = c.parents.filter((id) => alive(id) && !caregivers.includes(id));
    c.custody = caregivers.includes(playerId(r))
      ? caregivers.includes(c.parents[1])
        ? 'shared'
        : 'player'
      : 'guardian';
    for (const id of caregivers) if (c.caregiverBonds[id] === undefined) c.caregiverBonds[id] = 50;
  }
}
const milestones: Record<number, string> = {
  1: 'family-sleep',
  5: 'family-class',
  7: 'family-curiosity',
  9: 'family-friends',
  12: 'family-exam',
  14: 'family-boundaries',
  16: 'family-creative',
  18: 'family-path',
  20: 'family-study',
  22: 'family-career',
  24: 'family-leaving',
  26: 'family-adult-love',
  28: 'family-help',
  30: 'family-legacy-memory',
};
export function tickFamily(r: GameRun) {
  const f = r.family;
  if (!f) return;
  if (f.nextBirth && r.month >= f.nextBirth.dueMonth) birth(r, f.nextBirth.parentId);
  f.queue = f.queue.filter((q) => r.npcs.find((n) => n.id === q.childId)?.alive);
  for (const c of f.children) {
    if (!r.npcs.find((n) => n.id === c.npcId)?.alive) continue;
    const age = childAge(r, c);
    if ((r.month - c.bornMonth) % 12 !== 0 || age === 0) continue;
    const p = c.patterns,
      t = c.tendencies,
      own = (hashSeed(r.seed + ':experience:' + c.npcId + ':' + age) % 5) - 2;
    const stress =
      (p.achievement + p.inconsistent) * 0.25 -
      p.support * 0.2 +
      (r.finance.liability.principal > 300 ? 2 : 0);
    t.confidence = cap(
      t.confidence +
        Math.max(-3, Math.min(4, (p.explore + p.support - p.protect - p.distant) * 0.2)) +
        own,
    );
    t.curiosity = cap(
      t.curiosity +
        (c.temperament === 'curious' ? 1 : 0) +
        Math.min(3, p.explore * 0.3) +
        own * 0.5,
    );
    t.discipline = cap(t.discipline + Math.min(3, (p.discipline + p.balanced) * 0.3));
    t.stress = cap(t.stress + Math.max(-3, Math.min(5, stress)) + own);
    c.wellbeing = cap(
      c.wellbeing + Math.min(2, p.support * 0.2) - Math.max(0, (t.stress - 55) * 0.04) + own,
    );
    c.skills.study = cap(
      c.skills.study + 2 + Math.min(3, p.achievement * 0.2) + (c.interest === 'academic' ? 1 : 0),
    );
    c.skills.craft = cap(c.skills.craft + 1 + (c.interest === 'practical' ? 2 : 0));
    c.skills.art = cap(c.skills.art + 1 + (c.interest === 'creative' ? 2 : 0));
    c.skills.technology = cap(c.skills.technology + 1 + (c.interest === 'technology' ? 2 : 0));
    c.bond = cap(
      c.bond +
        Math.max(-2, Math.min(2, (p.support + p.balanced - p.distant - p.inconsistent) * 0.2)),
    );
    if (age === 6) c.education = 'Tiểu học';
    if (age === 12) c.education = 'Trung học cơ sở';
    if (age === 16) c.education = 'Trung học phổ thông';
    if (age === 14 && hashSeed(r.seed + ':peers:' + c.npcId) % 3 === 0) {
      c.interest = c.interest === 'academic' ? 'creative' : 'practical';
      remember(r, c, 'Một nhóm bạn mới mở thêm sở thích ngoài kỳ vọng của gia đình.');
    }
    if (age === 18) {
      c.education =
        c.interest === 'academic' && c.skills.study >= 55 && r.household.resources >= 2
          ? 'Đại học'
          : c.interest === 'technology' && c.skills.study >= 50
            ? 'Học công nghệ'
            : c.interest === 'creative'
              ? 'Học nghệ thuật / thực hành sáng tạo'
              : 'Học nghề / vừa học vừa làm';
      c.aspiration = {
        academic: 'Giáo dục và nghiên cứu',
        practical: 'Một nghề thực hành vững vàng',
        creative: 'Công việc sáng tạo',
        technology: 'Công nghệ và kỹ thuật',
      }[c.interest];
      remember(
        r,
        c,
        `Tự chọn hướng ${c.education.toLowerCase()}; lời khuyên của cha mẹ là một phần của quyết định.`,
      );
    }
    if (age === 22 || (age === 24 && c.occupation === 'Đang tìm việc')) {
      c.occupation =
        c.wellbeing < 30 && own < 0
          ? 'Đang tìm việc'
          : {
              academic: 'Trợ giảng / công việc chuyên môn',
              practical: 'Thợ nghề / dịch vụ kỹ thuật',
              creative: 'Thiết kế / biểu diễn sáng tạo',
              technology: 'Kỹ thuật viên / lập trình viên',
            }[c.interest];
      remember(r, c, `Bước vào đời sống nghề: ${c.occupation}. Con giữ quyền chọn hướng riêng.`);
    }
    if (age === 24 && t.confidence > 40) {
      c.inHousehold = false;
      remember(r, c, 'Tự quyết định ra ở riêng, vẫn giữ liên hệ với người chăm sóc.');
    }
    if (age === 26) {
      c.adultFamily = hashSeed(r.seed + ':adult-family:' + c.npcId) % 3 !== 0;
      remember(
        r,
        c,
        c.adultFamily
          ? 'Xây dựng một quan hệ riêng và dự định về gia đình của mình.'
          : 'Hiện chọn tập trung vào cuộc sống độc lập.',
      );
    }
    r.relationships.find((x) => x.npcId === c.npcId)!.strength = c.bond;
    c.caregiverBonds[playerId(r)] = c.bond;
    if (milestones[age]) queue(r, milestones[age], c);
  }
  syncCare(r);
}
const ageRanges: Record<string, [number, number]> = {
  'family-birth': [0, 1],
  'family-sleep': [1, 4],
  'family-sibling': [0, 17],
  'family-class': [5, 7],
  'family-curiosity': [7, 12],
  'family-friends': [9, 14],
  'family-exam': [12, 16],
  'family-boundaries': [14, 19],
  'family-creative': [16, 19],
  'family-path': [18, 22],
  'family-study': [20, 25],
  'family-career': [22, 30],
  'family-leaving': [24, 35],
  'family-adult-love': [26, 40],
  'family-help': [28, 60],
  'family-legacy-memory': [30, 64],
};
export function familyEligible(r: GameRun, id: string, childId: string) {
  if (r.academics?.focus) return false;
  const c = r.family?.children.find((c) => c.npcId === childId),
    range = ageRanges[id];
  if (!c || !range || !r.npcs.find((n) => n.id === childId)?.alive) return false;
  const age = childAge(r, c);
  return (
    age >= range[0] &&
    age <= range[1] &&
    (id !== 'family-sibling' || r.family!.children.length >= 2)
  );
}
export function focusFamily(r: GameRun, templateId: string, childId: string, manual = false) {
  const f = r.family;
  if (
    !f ||
    f.focus ||
    r.social?.focus ||
    r.academics?.focus ||
    !familyEligible(r, templateId, childId)
  )
    throw Error('Câu chuyện gia đình chưa phù hợp.');
  f.focus = {
    templateId,
    childId,
    instanceId: `${templateId}@${childId}@${r.actions.length}`,
    resume: manual ? structuredClone(r.activeEvent) : null,
  };
  f.encounters[templateId + ':' + childId] = r.month;
  r.activeEvent = { id: f.focus.instanceId, month: r.month };
}
export function nextFamily(r: GameRun) {
  const f = r.family;
  if (!f || f.focus || r.social?.focus || r.academics?.focus) return false;
  const item = f.queue.shift();
  if (!item) return false;
  if (!familyEligible(r, item.templateId, item.childId))
    throw Error('Một mốc phát triển bị chậm quá giới hạn.');
  focusFamily(r, item.templateId, item.childId);
  return true;
}
export function familyDefinition(r: GameRun): EventDefinition | undefined {
  const f = r.family?.focus;
  if (!f || r.activeEvent?.id !== f.instanceId) return;
  const e = parentingEvents.find((e) => e.id === f.templateId),
    npc = r.npcs.find((n) => n.id === f.childId);
  return e && npc
    ? { ...e, id: f.instanceId, text: e.text.replaceAll('{child}', npc.name) }
    : undefined;
}
export function requestFamily(input: GameRun, a: FamilyAction) {
  const f = input.family;
  if (
    !f ||
    input.engineVersion !== '3.0.0' ||
    input.status !== 'playing' ||
    a.expected !== input.actions.length ||
    input.month - (f.encounters[a.templateId + ':' + a.childId] ?? -999) < 12
  )
    throw Error('Cuộc trò chuyện gia đình không còn phù hợp.');
  if (
    input.actions.filter((a) =>
      ['social', 'family-talk', 'manage', 'wardrobe', 'academic'].includes(a.type),
    ).length >= 120
  )
    throw Error('Đã đạt giới hạn quản lý; hãy tiếp tục câu chuyện.');
  if (f.queue.some((x) => x.templateId === a.templateId && x.childId === a.childId))
    throw Error('Mốc này đã chờ trong câu chuyện.');
  const r = structuredClone(input);
  focusFamily(r, a.templateId, a.childId, true);
  r.actions.push(a);
  return r;
}
export function applyParenting(r: GameRun, style: ParentingStyle) {
  const f = r.family,
    c = f?.children.find((c) => c.npcId === f.focus?.childId);
  if (!f?.focus || !c) throw Error('Thiếu người con đang đối thoại.');
  c.patterns[style]++;
  if (style === 'achievement' && ['family-creative', 'family-path'].includes(f.focus.templateId))
    c.parentPreference = 'academic';
  const t = c.tendencies;
  const changes: Record<ParentingStyle, [number, number, number, number]> = {
    support: [5, 4, -3, 2],
    discipline: [-1, 0, 3, 3],
    achievement: [-2, -1, 5, 4],
    explore: [2, 2, 1, 1],
    protect: [2, -2, 2, 0],
    distant: [-4, -3, 2, 0],
    inconsistent: [-5, -3, 5, -1],
    balanced: [4, 3, -2, 2],
  };
  const [bond, confidence, stress, discipline] = changes[style];
  c.bond = cap(c.bond + bond);
  t.confidence = cap(t.confidence + confidence);
  t.stress = cap(t.stress + stress);
  t.discipline = cap(t.discipline + discipline);
  if (style === 'achievement') t.ambition = cap(t.ambition + 5);
  if (style === 'explore') t.curiosity = cap(t.curiosity + 5);
  c.wellbeing = cap(c.wellbeing + (bond > 0 ? 2 : -2));
  r.relationships.find((x) => x.npcId === c.npcId)!.strength = c.bond;
  c.caregiverBonds[playerId(r)] = c.bond;
  remember(
    r,
    c,
    `${PARENTING_LABELS[style]}: một lần đối thoại ở ${childAge(r, c)} tuổi. Khuynh hướng tích lũy, không khóa trước tương lai.`,
    style,
  );
  syncCare(r);
  return `Mối gắn bó ${Math.round(c.bond)}, an tâm ${Math.round(c.wellbeing)}. Những lần trước vẫn tiếp tục ảnh hưởng cùng trải nghiệm riêng của con.`;
}
export function assertFamily(r: GameRun) {
  const f = r.family;
  if (!f) {
    if (r.setup.expansion === 'family') throw Error('Invariant: missing family');
    return;
  }
  if (r.setup.expansion !== 'family') throw Error('Invariant: family ruleset');
  const ids = new Set([...r.npcs.map((n) => n.id), playerId(r)]);
  if (f.children.length > 4 || new Set(f.children.map((c) => c.npcId)).size !== f.children.length)
    throw Error('Invariant: children identity');
  if (
    f.nextBirth &&
    (!r.social?.people.some((p) => p.npcId === f.nextBirth!.parentId) ||
      f.nextBirth.dueMonth <= r.month)
  )
    throw Error('Invariant: birth plan');
  if (
    f.queue.some(
      (q) =>
        !f.children.some((c) => c.npcId === q.childId) ||
        !parentingEvents.some((e) => e.id === q.templateId) ||
        q.dueMonth > r.month,
    )
  )
    throw Error('Invariant: child queue');
  for (const c of f.children) {
    if (
      !r.social?.people.some((p) => p.npcId === c.parents[1]) ||
      Object.values(c.patterns).some((n) => !Number.isInteger(n) || n < 0)
    )
      throw Error('Invariant: parent identity/patterns');
    if (
      !r.npcs.some((n) => n.id === c.npcId && n.role === 'child') ||
      c.parents[0] !== playerId(r) ||
      c.parents[0] === c.parents[1] ||
      c.parents.some((id) => !ids.has(id) || id === c.npcId) ||
      c.caregivers.some((id) => !ids.has(id) || id === c.npcId) ||
      c.visitingParents.some((id) => !c.parents.includes(id))
    )
      throw Error('Invariant: family references');
    if (c.bornMonth < 216 || c.bornMonth > r.month || (c.occupation && childAge(r, c) < 18))
      throw Error('Invariant: child age');
    if (r.npcs.find((n) => n.id === c.npcId)?.alive && childAge(r, c) < 18 && !c.caregivers.length)
      throw Error('Invariant: minor caregiver');
    for (const n of [
      c.bond,
      c.wellbeing,
      ...Object.values(c.skills),
      ...Object.values(c.tendencies),
    ])
      if (!Number.isFinite(n) || n < 0 || n > 100) throw Error('Invariant: development bounds');
  }
  if (f.focus && f.focus.instanceId !== r.activeEvent?.id) throw Error('Invariant: family focus');
}
