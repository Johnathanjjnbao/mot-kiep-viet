import {
  CONTENT_VERSION,
  ENGINE_VERSION,
  type Choice,
  type Condition,
  type Effect,
  type GameRun,
  type ManageAction,
  type RunAction,
  type RunSetup,
  type Stat,
} from '../domain/model';
import {
  CAREERS,
  COHORTS,
  REGIONS,
  ageOf,
  careerReason,
  currentCareer,
  educationLevel,
  worldFor,
} from '../content/world';
import { EVENTS, FALLBACK, allEvents } from '../content/events';
import { hashSeed, nextRandom } from './random';
import { mandatoryCost, settleMonth, transact } from './finance';

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const names = [
  'Nguyễn Minh An',
  'Trần Hoài Linh',
  'Lê Thanh Bình',
  'Phạm Bảo Ngọc',
  'Võ Khánh Duy',
  'Đặng Hà My',
  'Bùi Gia Hân',
  'Đỗ Nhật Nam',
];
const traits = ['Hay tò mò', 'Kiên trì', 'Dễ gần', 'Ưa yên tĩnh', 'Thích giúp đỡ', 'Khéo tay'];
function random(run: GameRun, stream: 'world' | 'event') {
  const [v, next] = nextRandom(run.rng[stream]);
  run.rng[stream] = next;
  return v;
}
function note(
  run: GameRun,
  title: string,
  text: string,
  category: GameRun['journal'][number]['category'] = 'system',
  choice?: string,
) {
  run.journal.push({
    id: `journal:${run.journal.length}`,
    month: run.month,
    title,
    text,
    category,
    ...(choice ? { choice } : {}),
  });
}
export function createRun(seed: string, requested?: RunSetup): GameRun {
  if (!seed.length || seed.length > 100) throw new Error('Hạt giống cần từ 1 đến 100 ký tự.');
  const [a, s] = nextRandom(hashSeed(seed + ':setup'));
  const [b] = nextRandom(s);
  const setup: RunSetup = requested ?? {
    cohort: COHORTS[Math.floor(a * COHORTS.length)],
    region: REGIONS[Math.floor(b * REGIONS.length)].id,
  };
  if (!COHORTS.includes(setup.cohort) || !REGIONS.some((r) => r.id === setup.region))
    throw new Error('Bối cảnh không hợp lệ.');
  const run: GameRun = {
    engineVersion: ENGINE_VERSION,
    contentVersion: CONTENT_VERSION,
    id: `life:${hashSeed(seed + JSON.stringify(setup)).toString(16)}`,
    seed,
    setup: { ...setup },
    rng: { world: hashSeed(seed + ':world'), event: hashSeed(seed + ':events') },
    month: 0,
    status: 'intro',
    ending: null,
    player: {
      name: '',
      birthYear: setup.cohort,
      region: setup.region,
      stats: { health: 85, mood: 65, knowledge: 12, skill: 8, social: 25, stress: 8 },
      traits: [],
      education: [],
      careers: [],
      alive: true,
    },
    world: worldFor(setup.cohort),
    household: { background: '', resources: 0, housing: 'family', moved: false },
    npcs: [
      { id: 'mother', name: 'Mẹ · Thu', role: 'mother', birthYear: setup.cohort - 25, alive: true },
      {
        id: 'father',
        name: 'Cha · Thành',
        role: 'father',
        birthYear: setup.cohort - 28,
        alive: true,
      },
      {
        id: 'friend',
        name: 'Người bạn · Hòa',
        role: 'friend',
        birthYear: setup.cohort,
        alive: true,
      },
    ],
    relationships: [
      { npcId: 'mother', type: 'family', strength: 75, history: [] },
      { npcId: 'father', type: 'family', strength: 65, history: [] },
      { npcId: 'friend', type: 'friend', strength: 35, history: [] },
    ],
    finance: {
      cash: 0,
      savings: 0,
      assets: [],
      liability: { id: 'living-credit', principal: 0, monthlyRate: 0.004 },
      transactions: [],
      settledThrough: 0,
    },
    health: { lifestyle: 0 },
    flags: {},
    seen: {},
    activeEvent: null,
    scheduled: [],
    journal: [],
    choices: [],
    actions: [],
    lastOutcome: null,
  };
  run.player.name = names[Math.floor(random(run, 'world') * names.length)];
  run.household.resources = Math.floor(random(run, 'world') * 3);
  run.household.background = [
    'Gia đình chắt chiu',
    'Một mái nhà đủ đầy',
    'Gia đình có chút dành dụm',
  ][run.household.resources];
  run.player.traits = [traits[Math.floor(random(run, 'world') * traits.length)]];
  if (run.player.traits.includes('Hay tò mò')) run.player.stats.knowledge += 5;
  if (run.player.traits.includes('Khéo tay')) run.player.stats.skill += 7;
  if (run.player.traits.includes('Dễ gần')) run.player.stats.social += 8;
  transact(run, 'opening', 'Khoản gia đình để dành cho bạn', {
    cash: 90 + run.household.resources * 60,
  });
  note(
    run,
    'Một cuộc đời bắt đầu',
    `${run.player.name} chào đời tại ${REGIONS.find((r) => r.id === setup.region)!.short.toLowerCase()}, trong một ${run.household.background.toLowerCase()}.`,
    'life',
  );
  return run;
}
export const partnerOf = (run: GameRun) =>
  run.relationships.find(
    (r) => r.type === 'partner' && run.npcs.find((n) => n.id === r.npcId)?.alive,
  );
export function eligible(run: GameRun, c: Condition): boolean {
  const age = ageOf(run),
    stats = run.player.stats,
    job = currentCareer(run);
  if (run.status === 'ended' || !run.player.alive) return false;
  if ((c.minAge !== undefined && age < c.minAge) || (c.maxAge !== undefined && age > c.maxAge))
    return false;
  if (
    (c.minYear !== undefined && run.world.year < c.minYear) ||
    (c.maxYear !== undefined && run.world.year > c.maxYear)
  )
    return false;
  if (c.region && c.region !== run.player.region) return false;
  if (c.housing && c.housing !== run.household.housing) return false;
  if ((c.job === 'employed' && !job) || (c.job === 'unemployed' && job)) return false;
  if (c.job && c.job !== 'employed' && c.job !== 'unemployed' && job?.id !== c.job) return false;
  if (c.education && !c.education.includes(educationLevel(run))) return false;
  if (c.flags?.some((f) => !run.flags[f]) || c.absent?.some((f) => run.flags[f])) return false;
  if (c.partner !== undefined && Boolean(partnerOf(run)) !== c.partner) return false;
  if (
    c.npc &&
    !run.npcs.some(
      (n) =>
        n.alive &&
        (c.npc === 'adult-child'
          ? n.role === 'child' && run.world.year - n.birthYear >= 18
          : n.id === c.npc || n.role === c.npc),
    )
  )
    return false;
  if (c.minCash !== undefined && run.finance.cash < c.minCash) return false;
  if (c.minDebt !== undefined && run.finance.liability.principal < c.minDebt) return false;
  if (c.technology && !run.world.technologies.includes(c.technology)) return false;
  for (const [key, value] of Object.entries(c.minStats ?? {}))
    if (stats[key as Stat] < value) return false;
  for (const [key, value] of Object.entries(c.maxStats ?? {}))
    if (stats[key as Stat] > value) return false;
  return true;
}
export function choiceReason(run: GameRun, choice: Choice): string | null {
  if (choice.requires && !eligible(run, choice.requires))
    return 'Chưa đủ điều kiện: xem gợi ý của lựa chọn.';
  const cost = -choice.effects
    .filter((e) => e.kind === 'cash' && e.amount < 0)
    .reduce((s, e) => s + (e.kind === 'cash' ? e.amount : 0), 0);
  if (cost > run.finance.cash) return `Cần ${cost} đSM tiền mặt.`;
  for (const effect of choice.effects) {
    if (effect.kind === 'career' && effect.career) {
      const reason = careerReason(run, effect.career);
      if (reason) return reason;
    }
    if (effect.kind === 'family' && ageOf(run) < 18) return 'Chưa đến tuổi trưởng thành.';
    if (effect.kind === 'family' && effect.action === 'child' && !partnerOf(run))
      return 'Cần có bạn đời.';
  }
  return null;
}
export const activeDefinition = (run: GameRun) =>
  allEvents().find((e) => e.id === run.activeEvent?.id);
export function eventEligible(run: GameRun, event: typeof FALLBACK) {
  const last = run.seen[event.id];
  return (
    eligible(run, event.condition) &&
    (last === undefined || (!event.once && run.month - last >= event.cooldown)) &&
    event.choices.some((c) => !choiceReason(run, c))
  );
}
function selectEvent(run: GameRun) {
  let options = EVENTS.filter((e) => eventEligible(run, e));
  if (!options.length) options = [FALLBACK];
  const priority = Math.max(...options.map((e) => e.priority));
  if (priority > 0) options = options.filter((e) => e.priority === priority);
  const job = CAREERS.find((c) => c.id === currentCareer(run)?.id);
  const weight = (e: typeof FALLBACK) =>
    e.weight * (e.id === 'career-collapse' && job ? 0.2 + (1 - job.stability) * 3 : 1);
  let value = random(run, 'event') * options.reduce((n, e) => n + weight(e), 0);
  const selected = options.find((e) => (value -= weight(e)) < 0) ?? options[options.length - 1];
  run.activeEvent = { id: selected.id, month: run.month };
}
function startCareer(run: GameRun, id: Parameters<typeof careerReason>[1] | null) {
  if (id) {
    const reason = careerReason(run, id);
    if (reason) throw new Error(reason);
  }
  const old = currentCareer(run);
  if (old) old.endMonth = run.month;
  if (id) {
    const job = CAREERS.find((c) => c.id === id)!;
    run.player.careers.push({
      id: job.id,
      startMonth: run.month,
      endMonth: null,
      experience: 0,
      level: 0,
      incomeFactor: 1,
    });
    note(run, `Bắt đầu: ${job.name}`, 'Một chương nghề nghiệp mới mở ra.', 'career');
  } else note(run, 'Rời công việc', 'Bạn khép lại chặng nghề hiện tại.', 'career');
}
function applyEffect(run: GameRun, e: Effect, source: string, index: number) {
  const id = `${source}:${index}`;
  switch (e.kind) {
    case 'stat':
      run.player.stats[e.stat] = clamp(run.player.stats[e.stat] + e.amount);
      break;
    case 'cash':
      if (e.amount < 0) mandatoryCost(run, id, e.label, -e.amount);
      else transact(run, id, e.label, { cash: e.amount });
      break;
    case 'flag':
      run.flags[e.flag] = e.value;
      break;
    case 'education':
      run.player.education.push({
        level: e.level,
        startMonth: run.month,
        endMonth: run.month + e.years * 12,
      });
      break;
    case 'career':
      startCareer(run, e.career);
      break;
    case 'relationship': {
      const target =
        e.target === 'partner'
          ? partnerOf(run)
          : run.relationships.find((r) => r.npcId === e.target);
      if (target && run.npcs.find((n) => n.id === target.npcId)?.alive) {
        target.strength = clamp(target.strength + e.amount);
        target.history.push(
          `${run.world.year}: ${e.amount >= 0 ? 'Thêm gắn bó' : 'Có khoảng cách'}`,
        );
      }
      break;
    }
    case 'family': {
      if (ageOf(run) < 18) throw new Error('Invalid family age');
      if (e.action === 'partner') {
        if (partnerOf(run)) throw new Error('Already partnered');
        const npcId = `partner:${run.npcs.length}`;
        run.npcs.push({
          id: npcId,
          name: 'Bạn đời · Minh',
          role: 'partner',
          birthYear: run.player.birthYear - 1,
          alive: true,
        });
        run.relationships.push({
          npcId,
          type: 'partner',
          strength: 65,
          history: [`${run.world.year}: Quyết định đồng hành`],
        });
        note(
          run,
          'Có người cùng bước',
          'Bạn và Minh quyết định xây dựng cuộc sống chung.',
          'relationship',
        );
      } else if (e.action === 'breakup') {
        const partner = partnerOf(run);
        if (!partner) throw new Error('No partner');
        partner.type = 'ex';
        partner.history.push(`${run.world.year}: Chia tay`);
      } else {
        if (!partnerOf(run)) throw new Error('No partner for child');
        const npcId = `child:${run.npcs.length}`;
        run.npcs.push({
          id: npcId,
          name: `Con · ${run.npcs.filter((n) => n.role === 'child').length ? 'Bình' : 'An'}`,
          role: 'child',
          birthYear: run.world.year,
          alive: true,
        });
        run.relationships.push({
          npcId,
          type: 'child',
          strength: 80,
          history: [`${run.world.year}: Chào đời`],
        });
        note(
          run,
          'Nhà thêm một tiếng cười',
          'Bạn đón một người con; chi phí nuôi con được tính vào sinh hoạt.',
          'relationship',
        );
      }
      break;
    }
    case 'housing':
      if (e.housing === 'owned' && !run.finance.assets.some((a) => a.id === 'home')) {
        if (run.finance.cash < 600) throw new Error('Chưa đủ 600 đSM mua nhà.');
        transact(run, id, 'Mua một căn nhà nhỏ', { cash: -600, assets: 600 });
        run.finance.assets.push({ id: 'home', name: 'Căn nhà nhỏ', value: 600 });
      }
      run.household.housing = e.housing;
      run.household.moved = e.housing !== 'family';
      break;
    case 'habit':
      run.health.lifestyle = Math.max(-3, Math.min(3, run.health.lifestyle + e.amount));
      break;
    case 'schedule':
      run.scheduled.push({
        id,
        dueMonth: run.month + e.afterMonths,
        source,
        label: e.label,
        effects: e.effects,
        executed: false,
      });
      break;
  }
}
function conclude(run: GameRun, ending: 'death' | 'memoir') {
  run.ending = ending;
  run.status = 'ended';
  run.player.alive = ending !== 'death';
  run.activeEvent = null;
  const job = currentCareer(run);
  if (job) job.endMonth = run.month;
  note(
    run,
    ending === 'death' ? 'Một kiếp khép lại' : 'Trang hồi ký cuối',
    ending === 'death'
      ? `Bạn ra đi ở tuổi ${ageOf(run)}. Những dấu chân đã đi vẫn ở lại trong ký ức.`
      : `Ở tuổi ${ageOf(run)}, bạn đặt bút xuống. Cuộc đời trong mô phỏng khép lại ở đây.`,
    'life',
  );
}
const MILESTONES = [
  3, 6, 9, 12, 15, 17, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54,
  56, 58, 60, 63, 65, 66, 69, 72, 75, 78, 81, 82,
];
function tick(run: GameRun) {
  run.month++;
  run.world = worldFor(run.player.birthYear + ageOf(run));
  for (const npc of run.npcs)
    if (npc.alive && run.world.year - npc.birthYear >= 88) {
      npc.alive = false;
      note(
        run,
        `Tiễn ${npc.name.toLowerCase()}`,
        'Một người thân quen đã qua đời. Bạn giữ lại những kỷ niệm.',
        'relationship',
      );
      run.player.stats.mood = clamp(run.player.stats.mood - 8);
    }
  if (ageOf(run) >= 18 && !run.player.education.length)
    run.player.education.push({ level: 'general', startMonth: 72, endMonth: 216 });
  if (ageOf(run) >= 65 && currentCareer(run)) {
    const job = currentCareer(run)!;
    job.endMonth = run.month;
    note(
      run,
      'Khép lại ngày đi làm',
      'Bạn nghỉ hưu; trợ cấp tuổi già bắt đầu trong sổ chi tiêu.',
      'career',
    );
  }
  if (run.month % 12 === 0) {
    const record = currentCareer(run);
    if (record) {
      const job = CAREERS.find((j) => j.id === record.id)!;
      record.incomeFactor = 1 + (random(run, 'world') - 0.5) * (1 - job.stability);
    }
  }
  settleMonth(run);
  const age = ageOf(run),
    stats = run.player.stats;
  if (run.month % 12 === 0) {
    if (currentCareer(run)) stats.skill = clamp(stats.skill + 2);
    if (age >= 6 && age < 18) stats.knowledge = clamp(stats.knowledge + 1.5);
    const close = run.relationships.some(
      (r) => r.strength > 65 && run.npcs.find((n) => n.id === r.npcId)?.alive,
    );
    stats.stress = clamp(
      stats.stress +
        (run.finance.liability.principal > 300 ? 5 : 0) +
        (stats.mood < 25 ? 2 : 0) -
        (close ? 2 : 0),
    );
    stats.health = clamp(
      stats.health -
        Math.max(0, (age - 45) * 0.12) -
        stats.stress * 0.018 +
        run.health.lifestyle * 0.4,
    );
    stats.mood = clamp(stats.mood + (close ? 1 : -1) - (stats.stress > 70 ? 3 : 0));
  }
  for (const effect of run.scheduled)
    if (!effect.executed && effect.dueMonth <= run.month) {
      effect.executed = true;
      effect.effects.forEach((e, i) => applyEffect(run, e, `scheduled:${effect.id}`, i));
      note(run, effect.label, 'Một quyết định trước đây vừa để lại hệ quả.', 'life');
    }
  if (stats.health <= 0) conclude(run, 'death');
  else if (age >= 82) conclude(run, 'memoir');
}
export function advance(input: GameRun): GameRun {
  if (input.status === 'ended' || input.activeEvent)
    throw new Error('Hãy giải quyết lựa chọn hiện tại trước khi đi tiếp.');
  const run = structuredClone(input);
  run.actions.push({ type: 'advance' });
  run.status = 'playing';
  run.lastOutcome = null;
  const next = MILESTONES.find((age) => age * 12 > run.month) ?? 82;
  while (run.month < next * 12 && !run.ending) tick(run);
  if (!run.ending) selectEvent(run);
  return run;
}
export function choose(input: GameRun, eventId: string, choiceId: string): GameRun {
  const definition = activeDefinition(input);
  if (
    input.status !== 'playing' ||
    definition?.id !== eventId ||
    !eligible(input, definition.condition)
  )
    throw new Error('Sự kiện không còn hợp lệ.');
  const selected = definition.choices.find((c) => c.id === choiceId);
  if (!selected) throw new Error('Lựa chọn không tồn tại.');
  const reason = choiceReason(input, selected);
  if (reason) throw new Error(reason);
  const run = structuredClone(input),
    source = `choice:${run.choices.length}:${eventId}`;
  selected.effects.forEach((e, i) => applyEffect(run, e, source, i));
  let outcome = selected.outcome;
  if (selected.chance) {
    const success = random(run, 'event') < selected.chance.probability;
    (success ? selected.chance.success : selected.chance.failure).forEach((e, i) =>
      applyEffect(run, e, `${source}:chance`, i),
    );
    outcome += ' ' + (success ? selected.chance.successText : selected.chance.failureText);
  }
  run.seen[eventId] = run.month;
  run.activeEvent = null;
  run.lastOutcome = outcome;
  run.choices.push({ eventId, choiceId, month: run.month, outcome });
  run.actions.push({ type: 'choose', eventId, choiceId });
  note(run, definition.title, outcome, definition.category, selected.text);
  if (run.player.stats.health <= 0) conclude(run, 'death');
  return run;
}
export function manage(
  input: GameRun,
  action: ManageAction,
  career?: Parameters<typeof careerReason>[1],
): GameRun {
  if (input.status === 'ended' || ageOf(input) < 18)
    throw new Error('Chưa thể thực hiện hành động này.');
  if (input.actions.filter((a) => a.type === 'manage').length >= 400)
    throw new Error('Đã đạt 400 thao tác quản lý cho một cuộc đời. Hãy tiếp tục câu chuyện.');
  const run = structuredClone(input),
    id = `manage:${run.actions.length}`;
  let message = '';
  switch (action) {
    case 'save-money':
      if (run.finance.cash < 50) throw new Error('Cần ít nhất 50 đSM.');
      transact(run, id, 'Gửi tiết kiệm', { cash: -50, savings: 50 });
      message = 'Bạn gửi 50 đSM vào khoản dành dụm.';
      break;
    case 'withdraw-money': {
      const amount = Math.min(50, run.finance.savings);
      if (!amount) throw new Error('Chưa có tiền tiết kiệm.');
      transact(run, id, 'Rút tiết kiệm', { cash: amount, savings: -amount });
      message = `Bạn rút ${amount} đSM từ tiết kiệm.`;
      break;
    }
    case 'borrow':
      if (run.finance.liability.principal > 250)
        throw new Error('Đã đạt hạn mức vay chủ động 300 đSM.');
      transact(run, id, 'Vay chủ động', { cash: 50, debt: 50 });
      message = 'Bạn vay 50 đSM, lãi 0,4% mỗi tháng.';
      break;
    case 'repay': {
      const amount = Math.min(50, run.finance.cash, run.finance.liability.principal);
      if (!amount) throw new Error('Không có khoản nợ hoặc tiền để trả.');
      transact(run, id, 'Trả nợ', { cash: -amount, debt: -amount });
      message = `Bạn trả ${amount} đSM tiền nợ.`;
      break;
    }
    case 'buy-home':
      if (run.finance.assets.some((a) => a.id === 'home')) throw new Error('Bạn đã có nhà.');
      applyEffect(run, { kind: 'housing', housing: 'owned' }, id, 0);
      message = 'Bạn mua căn nhà nhỏ với 600 đSM.';
      break;
    case 'move-home':
      if (run.household.housing === 'owned') throw new Error('Bạn đang ở nhà riêng.');
      run.household.housing = run.household.housing === 'family' ? 'rent' : 'family';
      run.household.moved = run.household.housing === 'rent';
      message = run.household.moved
        ? 'Bạn ra ở trọ; tiền thuê sẽ tính mỗi tháng.'
        : 'Bạn trở về mái nhà gia đình.';
      break;
    case 'apply-job':
      if (!career) throw new Error('Hãy chọn một nghề.');
      if (currentCareer(run)?.id === career) throw new Error('Bạn đang làm nghề này.');
      startCareer(run, career);
      message = 'Bạn bắt đầu công việc mới, thu nhập sẽ vào sổ hằng tháng.';
      break;
    case 'quit-job':
      if (!currentCareer(run)) throw new Error('Bạn chưa có công việc.');
      startCareer(run, null);
      message = 'Bạn rời công việc. Hãy cân đối chi phí trong lúc tìm hướng khác.';
      break;
  }
  run.actions.push({
    type: 'manage',
    action,
    ...(career ? { career: career as GameRun['player']['careers'][number]['id'] } : {}),
  });
  note(run, 'Một quyết định chủ động', message, action.includes('job') ? 'career' : 'finance');
  run.lastOutcome = message;
  // A management action can change the prerequisites of a pending event. Resolve safely before presenting another.
  const active = activeDefinition(run);
  if (active && !eligible(run, active.condition)) {
    note(run, active.title, 'Hoàn cảnh đã thay đổi trước khi bạn quyết định.');
    run.activeEvent = null;
  }
  return run;
}
export function dispatch(run: GameRun, action: RunAction): GameRun {
  if (action.type === 'advance') return advance(run);
  if (action.type === 'choose') return choose(run, action.eventId, action.choiceId);
  return manage(run, action.action, action.career);
}
export function replay(seed: string, setup: RunSetup, actions: RunAction[]): GameRun {
  return actions.reduce(dispatch, createRun(seed, setup));
}
