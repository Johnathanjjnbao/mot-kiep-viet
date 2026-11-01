import {
  hasAcademicRules,
  hasEmploymentRules,
  hasEnterpriseRules,
  discretionaryCount,
} from '../domain/rules';
import {
  requestEnterprise,
  settleBusinesses,
  closeBusinessesAtEnd,
  businessSceneEligible,
  applyBusinessStory,
} from './business';
import { designMoney, formatMoney, currencyText } from '../domain/currency';
import {
  initFamily,
  planBirth,
  tickFamily,
  syncCare,
  requestFamily,
  familyDefinition,
  nextFamily,
  applyParenting,
  childAge,
} from './family';
import {
  initSocial,
  refreshSocial,
  socialDefinition,
  socialTarget,
  focusSocial,
  requestSocial,
  applySocial,
  tickSocial,
  socialInterrupt,
} from './social';
import * as frozen2 from '../legacy/v2/engine/engine';
import { defaultWardrobe, applyWardrobe } from './wardrobe';
import { presentationScore } from '../content/clothing';
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
import {
  setupSchema,
  WEALTH,
  residentParents,
  parentAvailable,
  familyText,
  birthplaceOf,
} from '../domain/creator';
import { hashSeed, nextRandom } from './random';
import { mandatoryCost, settleMonth, transact } from './finance';
import { dynamicPool, diversityWeight, originEligible } from './lifeDiversity';
import { isAnnual, ageExperienced } from './annual';
import { contextualAnnual } from '../content/annual-events';
import {
  applyEmployment,
  endEmployment,
  syncEmployment,
  tickEmployment,
  employmentSceneEligible,
  employmentInterrupt,
  resolveEmployment,
  trainEmployment,
} from './employment';
import {
  academicDefinition,
  academicDue,
  focusAcademic,
  requestAcademic,
  resolveAcademic,
} from './academics';

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
  const setup: RunSetup = setupSchema.parse(
    requested ?? {
      cohort: COHORTS[Math.floor(a * COHORTS.length)],
      region: REGIONS[Math.floor(b * REGIONS.length)].id,
    },
  );
  if (setup.cohort < 1975 || setup.cohort > 2026 || !REGIONS.some((r) => r.id === setup.region))
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
  run.player.name = setup.name ?? run.player.name;
  const wealthRoll = Math.floor(random(run, 'world') * 5) as 0 | 1 | 2 | 3 | 4,
    familyRoll = Math.floor(random(run, 'world') * 5);
  run.setup = {
    cohort: setup.cohort,
    region: setup.region,
    name: run.player.name,
    birthplace: setup.birthplace ?? REGIONS.find((r) => r.id === setup.region)!.short,
    environment:
      setup.environment ??
      (REGIONS.find((r) => r.id === setup.region)!.environment === 'urban' ? 'urban' : 'rural'),
    wealth: setup.wealth ?? wealthRoll,
    family:
      setup.family ??
      (['both', 'father-only', 'mother-only', 'with-father', 'with-mother'] as const)[familyRoll],
    motherTraits: setup.motherTraits ?? [],
    fatherTraits: setup.fatherTraits ?? [],
  };
  if (setup.currency) run.setup.currency = setup.currency;
  run.setup.expansion = setup.expansion ?? 'family';
  if (setup.lifeRules) run.setup.lifeRules = setup.lifeRules;
  if (hasAcademicRules(run))
    run.academics = { applications: [], studies: [], qualifications: [], focus: null };
  if (hasEmploymentRules(run))
    run.employment = {
      applications: [],
      periods: [],
      trainingMonths: [],
      placements: [],
      notice: false,
    };
  if (hasEnterpriseRules(run)) run.enterprise = { ventures: [], lastSceneMonth: -12 };
  if (setup.playerTraits !== undefined) run.setup.playerTraits = [...setup.playerTraits];
  run.wardrobe = defaultWardrobe();
  if (run.setup.expansion === 'social' || run.setup.expansion === 'family') initSocial(run);
  if (run.setup.expansion === 'family') initFamily(run);
  run.id = `life:${hashSeed(seed + JSON.stringify(run.setup)).toString(16)}`;
  run.household.resources = run.setup.wealth!;
  for (const npc of run.npcs.filter((n) => ['mother', 'father'].includes(n.id))) {
    const family = run.setup.family!;
    npc.presence =
      family === 'both' ||
      (family === 'father-only' && npc.id === 'father') ||
      (family === 'mother-only' && npc.id === 'mother') ||
      (family === 'with-father' && npc.id === 'father') ||
      (family === 'with-mother' && npc.id === 'mother')
        ? 'resident'
        : family.startsWith('with-')
          ? 'nonresident'
          : 'unknown';
    npc.personality = npc.id === 'mother' ? run.setup.motherTraits : run.setup.fatherTraits;
    if (npc.presence === 'unknown') npc.alive = null;
  }
  run.relationships = run.relationships.filter(
    (r) => !['mother', 'father'].includes(r.npcId) || parentAvailable(run, r.npcId),
  );
  for (const rel of run.relationships) {
    const npc = run.npcs.find((n) => n.id === rel.npcId)!;
    if (npc.presence === 'nonresident') rel.strength = 45;
    if (npc.personality?.includes('gentle')) rel.strength = 85;
    if (npc.personality?.includes('distant')) rel.strength = 35;
  }
  run.household.background = WEALTH[run.household.resources];
  run.player.traits = [traits[Math.floor(random(run, 'world') * traits.length)]];
  // Consume the historical draw even when a new life explicitly selects its traits.
  if (setup.playerTraits !== undefined) run.player.traits = [...setup.playerTraits];
  if (run.player.traits.includes('Hay tò mò')) run.player.stats.knowledge += 5;
  if (run.player.traits.includes('Khéo tay')) run.player.stats.skill += 7;
  if (run.player.traits.includes('Dễ gần')) run.player.stats.social += 8;
  if (setup.playerTraits !== undefined) {
    if (run.player.traits.includes('Kiên trì')) run.player.stats.stress -= 2;
    if (run.player.traits.includes('Ưa yên tĩnh')) run.player.stats.mood += 3;
    if (run.player.traits.includes('Thích giúp đỡ')) run.player.stats.social += 3;
  }
  transact(run, 'opening', 'Khoản gia đình để dành cho bạn', {
    cash: designMoney(
      run,
      [25, 70, 150, 300, 600][run.household.resources] +
        residentParents(run).filter((p) => p.personality?.includes('frugal')).length * 25,
    ),
  });
  note(
    run,
    'Một cuộc đời bắt đầu',
    `${run.player.name} chào đời tại ${birthplaceOf(run)}, gia cảnh ${run.household.background.toLowerCase()}. ${familyText(run)}.`,
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
        n.presence !== 'unknown' &&
        n.presence !== 'deceased' &&
        (c.npc === 'adult-child'
          ? n.role === 'child' &&
            (run.family?.children.some((c) => c.npcId === n.id)
              ? childAge(
                  run,
                  run.family.children.find((c) => c.npcId === n.id)!,
                ) >= 18
              : run.world.year - n.birthYear >= 18)
          : n.id === c.npc || n.role === c.npc),
    )
  )
    return false;
  if (c.minCash !== undefined && run.finance.cash < designMoney(run, c.minCash)) return false;
  if (c.minDebt !== undefined && run.finance.liability.principal < designMoney(run, c.minDebt))
    return false;
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
  const cost = designMoney(
    run,
    -choice.effects
      .filter((e) => e.kind === 'cash' && e.amount < 0)
      .reduce((s, e) => s + (e.kind === 'cash' ? e.amount : 0), 0),
  );
  if (cost > run.finance.cash) return `Cần ${formatMoney(cost, run)} tiền mặt.`;
  for (const effect of choice.effects) {
    if (isAnnual(run) && effect.kind === 'employment' && !employmentSceneEligible(run))
      return 'Hoàn cảnh tìm việc đã thay đổi; hãy hoàn tất câu chuyện trước khi đổi việc học.';
    if (
      effect.kind === 'education' &&
      run.academics?.studies.some((s) => s.status === 'studying' || s.status === 'paused')
    )
      return 'Hãy hoàn tất hoặc rời chương trình hiện tại trước khi bắt đầu khóa học khác.';
    if (
      effect.kind === 'relationship' &&
      ['mother', 'father'].includes(effect.target) &&
      !parentAvailable(run, effect.target)
    )
      return 'Người thân này không hiện diện trong cuộc đời.';
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
const rawActiveDefinition = (run: GameRun) => {
  const definition =
    academicDefinition(run) ??
    familyDefinition(run) ??
    socialDefinition(run) ??
    allEvents().find((e) => e.id === run.activeEvent?.id);
  if (!definition || !isAnnual(run)) return definition;
  const annualDefinition = contextualAnnual(run, definition);
  // These focused continuations used the historical memoir age as a ceiling.
  // Loss and parenting remain valid beyond82; never drop their pending focus.
  return (run.social?.focus || run.family?.focus) &&
    (annualDefinition.condition.maxAge === 81 || annualDefinition.condition.maxAge === 82)
    ? { ...annualDefinition, condition: { ...annualDefinition.condition, maxAge: undefined } }
    : annualDefinition;
};
export const activeDefinition = (run: GameRun) => {
  const event = rawActiveDefinition(run);
  if (!event || run.setup.currency !== 'vnd-v1') return event;
  return {
    ...event,
    title: currencyText(run, event.title),
    text: currencyText(run, event.text),
    choices: event.choices.map((c) => ({
      ...c,
      text: currencyText(run, c.text),
      hint: c.hint ? currencyText(run, c.hint) : c.hint,
      outcome: currencyText(run, c.outcome),
      ...(c.chance
        ? {
            chance: {
              ...c.chance,
              successText: currencyText(run, c.chance.successText),
              failureText: currencyText(run, c.chance.failureText),
            },
          }
        : {}),
    })),
  };
};
export function eventEligible(run: GameRun, event: typeof FALLBACK) {
  if (event.version === 10 && !businessSceneEligible(run, event.id)) return false;
  if (event.version === 9 && !isAnnual(run)) return false;
  if (event.version === 5) return false;
  if (event.version === 7 && (!hasAcademicRules(run) || event.id !== 'edu-direction')) return false;
  if (run.academics && event.id === 'education-path') return false;
  if (event.version === 8 && !employmentSceneEligible(run)) return false;
  if (event.version === 6 && (!run.setup.lifeRules || !originEligible(run, event.id))) return false;
  const last = run.seen[event.id];
  return (
    eligible(run, event.condition) &&
    (event.version !== 4 || !!socialTarget(run, event.id)) &&
    (!run.social || !event.choices.some((c) => c.effects.some((e) => e.kind === 'family'))) &&
    (last === undefined || (!event.once && run.month - last >= event.cooldown)) &&
    event.choices.filter((c) => !choiceReason(run, c)).length >= 4
  );
}
function selectEvent(run: GameRun) {
  if (run.social?.discoveryPending) {
    const id = run.social.breach?.primaryId;
    if (id) {
      focusSocial(run, 'soc-discovery', id, true);
      return;
    }
  }
  if (run.social?.lossPending) {
    focusSocial(run, 'soc-loss', run.social.lossPending, true);
    return;
  }
  if (focusAcademic(run)) return;
  if (employmentInterrupt(run)) {
    if (nextFamily(run)) return;
    run.employment!.notice = false;
    run.activeEvent = { id: 'employment-search', month: run.month };
    return;
  }
  let options = EVENTS.filter(
    (e) => eventEligible(run, e) && (!isAnnual(run) || ageOf(run) >= 3 || e.version === 9),
  );
  if (!options.length) options = [FALLBACK];
  const dynamic = !!run.setup.lifeRules && ageOf(run) < 18 && (!isAnnual(run) || ageOf(run) >= 3);
  if (dynamic) options = dynamicPool(run, options);
  const priority = Math.max(...options.map((e) => e.priority));
  if (priority <= 0 && nextFamily(run)) return;
  if (!dynamic && priority > 0) options = options.filter((e) => e.priority === priority);
  const job = CAREERS.find((c) => c.id === currentCareer(run)?.id);
  const weight = (e: typeof FALLBACK) =>
    e.weight *
    (e.id === 'career-collapse' && job ? 0.2 + (1 - job.stability) * 3 : 1) *
    (dynamic ? diversityWeight(run, e) : 1) *
    (isAnnual(run) && run.seen[e.id] !== undefined ? 0.3 : 1);
  let value = random(run, 'event') * options.reduce((n, e) => n + weight(e), 0);
  const selected = options.find((e) => (value -= weight(e)) < 0) ?? options[options.length - 1];
  if (selected.version === 4) {
    focusSocial(run, selected.id, socialTarget(run, selected.id)!);
    return;
  }
  run.activeEvent = { id: selected.id, month: run.month };
}
function startCareer(
  run: GameRun,
  id: Parameters<typeof careerReason>[1] | null,
  source: 'panel' | 'story' = 'story',
) {
  if (run.employment) {
    if (id) {
      const job = CAREERS.find((j) => j.id === id);
      if (!job) throw Error('Công việc không tồn tại.');
      applyEmployment(run, job.id, (r) => random(r, 'event'), source);
    } else
      endEmployment(
        run,
        source === 'panel'
          ? 'resigned'
          : run.activeEvent?.id === 'career-collapse'
            ? 'layoff'
            : 'story',
      );
    return;
  }
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
    case 'enterprise':
      applyBusinessStory(run, e.operation);
      break;
    case 'employment':
      resolveEmployment(run, e.operation, (r) => random(r, 'event'));
      break;
    case 'academic':
      resolveAcademic(run, e.method, (r) => random(r, 'event'));
      break;
    case 'parenting': {
      const text = applyParenting(run, e.style);
      run.lastOutcome = text;
      break;
    }
    case 'social': {
      let result = applySocial(run, e.operation);
      if (e.operation === 'plan-child' && run.family) result += planBirth(run);
      note(run, 'Một lời đối thoại', result, 'relationship');
      run.lastOutcome = result;
      break;
    }
    case 'presentation': {
      const value = presentationScore(run, e.context);
      const key = e.context === 'exercise' ? 'skill' : 'social';
      run.player.stats[key] = clamp(run.player.stats[key] + value);
      note(
        run,
        'Bộ đồ và hoàn cảnh',
        `Cách ăn mặc ở dịp này: ${value >= 0 ? '+' : ''}${value} ${key === 'skill' ? 'tay nghề' : 'giao tiếp'}. Không phải đánh giá giá trị con người.`,
        'relationship',
      );
      break;
    }
    case 'stat':
      run.player.stats[e.stat] = clamp(run.player.stats[e.stat] + e.amount);
      break;
    case 'cash':
      if (e.amount < 0)
        mandatoryCost(run, id, currencyText(run, e.label), designMoney(run, -e.amount));
      else transact(run, id, currencyText(run, e.label), { cash: designMoney(run, e.amount) });
      break;
    case 'flag':
      run.flags[e.flag] = e.value;
      break;
    case 'education':
      if (run.academics && e.level === 'university') break;
      if (run.academics?.studies.some((s) => s.status === 'studying' || s.status === 'paused'))
        break;
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
        if (run.finance.cash < designMoney(run, 600))
          throw new Error(currencyText(run, 'Chưa đủ 600 đSM mua nhà.'));
        transact(run, id, 'Mua một căn nhà nhỏ', {
          cash: -designMoney(run, 600),
          assets: designMoney(run, 600),
        });
        run.finance.assets.push({ id: 'home', name: 'Căn nhà nhỏ', value: designMoney(run, 600) });
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
  closeBusinessesAtEnd(run);
  if (run.social) run.social.focus = null;
  if (run.family) run.family.focus = null;
  run.ending = ending;
  run.status = 'ended';
  run.player.alive = ending !== 'death';
  syncCare(run);
  run.activeEvent = null;
  const job = currentCareer(run);
  if (job) job.endMonth = run.month;
  syncEmployment(run);
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
    if (npc.alive && npc.presence !== 'unknown' && run.world.year - npc.birthYear >= 88) {
      npc.alive = false;
      if (npc.presence) npc.presence = 'deceased';
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
    if (run.employment) endEmployment(run, 'retired');
    else {
      const job = currentCareer(run)!;
      job.endMonth = run.month;
      note(
        run,
        'Khép lại ngày đi làm',
        'Bạn nghỉ hưu; trợ cấp tuổi già bắt đầu trong sổ chi tiêu.',
        'career',
      );
    }
  }
  if (run.month % 12 === 0) {
    const record = currentCareer(run);
    if (record) {
      const job = CAREERS.find((j) => j.id === record.id)!;
      record.incomeFactor = 1 + (random(run, 'world') - 0.5) * (1 - job.stability);
    }
  }
  settleMonth(run);
  settleBusinesses(run);
  tickEmployment(run, (r) => random(r, 'world'));
  const age = ageOf(run),
    stats = run.player.stats;
  if (run.month % 12 === 0) {
    if (currentCareer(run)) stats.skill = clamp(stats.skill + 2);
    if (age >= 6 && age < 18) {
      stats.knowledge = clamp(stats.knowledge + 1.5);
      for (const parent of residentParents(run)) {
        for (const t of parent.personality ?? []) {
          if (t === 'academic') stats.knowledge = clamp(stats.knowledge + 1);
          if (t === 'gentle' || t === 'easygoing') stats.mood = clamp(stats.mood + 1);
          if (t === 'strict' || t === 'ambitious') {
            stats.stress = clamp(stats.stress + 1);
            stats.skill = clamp(stats.skill + 0.5);
          }
          if (t === 'anxious') stats.stress = clamp(stats.stress + 1.5);
          if (t === 'adventurous') stats.skill = clamp(stats.skill + 1);
          if (t === 'distant') {
            const rel = run.relationships.find((r) => r.npcId === parent.id);
            if (rel) rel.strength = clamp(rel.strength - 1);
          }
        }
      }
    }
    const close = run.relationships.some(
      (r) => r.strength > 65 && run.npcs.find((n) => n.id === r.npcId)?.alive,
    );
    stats.stress = clamp(
      stats.stress +
        (run.finance.liability.principal > designMoney(run, 300) ? 5 : 0) +
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
  tickSocial(run);
  tickFamily(run);
  if (stats.health <= 0) conclude(run, 'death');
  else if (age >= 82 && !isAnnual(run)) conclude(run, 'memoir');
}
export function advance(input: GameRun): GameRun {
  if (input.engineVersion === '2.0.0')
    return frozen2.advance(input as Parameters<typeof frozen2.advance>[0]);
  if (input.engineVersion !== ENGINE_VERSION)
    throw new Error('Bản lưu v1 chỉ mở để đọc và xuất lại; hãy bắt đầu kiếp v0.2 mới.');
  if (input.status === 'ended' || input.activeEvent)
    throw new Error('Hãy giải quyết lựa chọn hiện tại trước khi đi tiếp.');
  const run = structuredClone(input);
  run.actions.push({ type: 'advance' });
  run.status = 'playing';
  run.lastOutcome = null;
  // An unresolved age is presented at the current month, including newborn age0.
  // Monthly effects still settle exactly once; no advance can cross two birthdays.
  const next = isAnnual(run)
    ? ageOf(run) + (ageExperienced(run) ? 1 : 0)
    : (MILESTONES.find((age) => age * 12 > run.month) ?? 82);
  while (run.month < next * 12 && !run.ending) {
    tick(run);
    if (
      socialInterrupt(run) ||
      run.family?.queue.length ||
      academicDue(run) ||
      employmentInterrupt(run)
    )
      break;
  }
  if (!run.ending) selectEvent(run);
  return run;
}
export function choose(input: GameRun, eventId: string, choiceId: string): GameRun {
  if (input.engineVersion === '2.0.0')
    return frozen2.choose(input as Parameters<typeof frozen2.choose>[0], eventId, choiceId);
  if (input.engineVersion !== ENGINE_VERSION) throw new Error('Bản lưu v1 chỉ đọc.');
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
  if (run.social?.focus || run.family?.focus || run.academics?.focus)
    outcome += ' ' + (run.lastOutcome ?? '');
  if (selected.chance) {
    const success = random(run, 'event') < selected.chance.probability;
    (success ? selected.chance.success : selected.chance.failure).forEach((e, i) =>
      applyEffect(run, e, `${source}:chance`, i),
    );
    outcome += ' ' + (success ? selected.chance.successText : selected.chance.failureText);
  }
  if (
    run.employment &&
    (run.employment.applications.length !== input.employment?.applications.length ||
      selected.effects.some((e) => e.kind === 'employment' || e.kind === 'career'))
  )
    outcome = run.lastOutcome ?? outcome;
  run.seen[eventId] = run.month;
  run.activeEvent = null;
  run.lastOutcome = outcome;
  run.choices.push({ eventId, choiceId, month: run.month, outcome });
  run.actions.push({ type: 'choose', eventId, choiceId });
  note(run, definition.title, outcome, definition.category, selected.text);
  if (run.social?.focus) {
    const f = run.social.focus;
    run.seen[f.templateId] = run.month;
    run.social.focus = null;
    if (f.templateId === 'soc-loss') run.social.lossPending = null;
    run.activeEvent = f.resume;
    if (run.activeEvent) {
      const d = activeDefinition(run);
      if (
        !d ||
        !eligible(run, d.condition) ||
        d.choices.filter((c) => !choiceReason(run, c)).length < 4
      ) {
        note(
          run,
          'Hoàn cảnh đã thay đổi',
          'Hoàn cảnh đã thay đổi sau cuộc đối thoại; câu chuyện được chọn lại.',
        );
        run.activeEvent = null;
        selectEvent(run);
      }
    }
  }
  if (input.family?.focus && run.family?.focus?.instanceId === eventId) {
    const f = run.family.focus;
    run.family.focus = null;
    run.activeEvent = f.resume;
  }
  if (input.academics?.focus && run.academics?.focus?.instanceId === eventId) {
    run.activeEvent = run.academics.focus.resume;
    run.academics.focus = null;
  }
  if (run.family) {
    syncCare(run);
    if (!run.activeEvent) nextFamily(run);
  }
  refreshSocial(run);
  syncEmployment(run);
  if (run.player.stats.health <= 0) conclude(run, 'death');
  return run;
}
export function manage(
  input: GameRun,
  action: ManageAction,
  career?: Parameters<typeof careerReason>[1],
): GameRun {
  if (input.engineVersion === '2.0.0') {
    if (action === 'train-job' || action === 'temporary-job')
      throw Error('Cuộc đời này giữ luật nghề nghiệp cũ.');
    return frozen2.manage(input as Parameters<typeof frozen2.manage>[0], action, career);
  }
  if (input.engineVersion !== ENGINE_VERSION) throw new Error('Bản lưu v1 chỉ đọc.');
  if (input.status === 'ended' || ageOf(input) < 18)
    throw new Error('Chưa thể thực hiện hành động này.');
  if (
    input.family &&
    input.actions.filter((a) =>
      ['manage', 'wardrobe', 'social', 'family-talk', 'academic', 'enterprise'].includes(a.type),
    ).length >= 120
  )
    throw Error('Đã đạt giới hạn quản lý; hãy tiếp tục câu chuyện.');
  if (input.actions.filter((a) => a.type === 'manage').length >= 400)
    throw new Error('Đã đạt 350 thao tác quản lý/tủ đồ cho một cuộc đời. Hãy tiếp tục câu chuyện.');
  const run = structuredClone(input),
    id = `manage:${run.actions.length}`;
  if (
    ['apply-job', 'quit-job', 'train-job', 'temporary-job'].includes(action) &&
    input.employment &&
    (input.academics?.focus || input.social?.focus || input.family?.focus)
  )
    throw Error('Hãy hoàn tất câu chuyện đang chờ trước khi đổi việc.');
  let message = '';
  switch (action) {
    case 'train-job':
      trainEmployment(run);
      message = run.lastOutcome!;
      break;
    case 'temporary-job':
      applyEmployment(run, 'labor', (r) => random(r, 'event'), 'support');
      message = run.lastOutcome!;
      break;
    case 'save-money':
      if (run.finance.cash < designMoney(run, 50))
        throw new Error(currencyText(run, 'Cần ít nhất 50 đSM.'));
      transact(run, id, 'Gửi tiết kiệm', {
        cash: -designMoney(run, 50),
        savings: designMoney(run, 50),
      });
      message = currencyText(run, 'Bạn gửi 50 đSM vào khoản dành dụm.');
      break;
    case 'withdraw-money': {
      const amount = Math.min(designMoney(run, 50), run.finance.savings);
      if (!amount) throw new Error('Chưa có tiền tiết kiệm.');
      transact(run, id, 'Rút tiết kiệm', { cash: amount, savings: -amount });
      message = `Bạn rút ${formatMoney(amount, run)} từ tiết kiệm.`;
      break;
    }
    case 'borrow':
      if (run.finance.liability.principal > designMoney(run, 250))
        throw new Error(currencyText(run, 'Đã đạt hạn mức vay chủ động 300 đSM.'));
      transact(run, id, 'Vay chủ động', { cash: designMoney(run, 50), debt: designMoney(run, 50) });
      message = currencyText(run, 'Bạn vay 50 đSM, lãi 0,4% mỗi tháng.');
      break;
    case 'repay': {
      const amount = Math.min(
        designMoney(run, 50),
        run.finance.cash,
        run.finance.liability.principal,
      );
      if (!amount) throw new Error('Không có khoản nợ hoặc tiền để trả.');
      transact(run, id, 'Trả nợ', { cash: -amount, debt: -amount });
      message = `Bạn trả ${formatMoney(amount, run)} tiền nợ.`;
      break;
    }
    case 'buy-home':
      if (run.finance.assets.some((a) => a.id === 'home')) throw new Error('Bạn đã có nhà.');
      applyEffect(run, { kind: 'housing', housing: 'owned' }, id, 0);
      message = currencyText(run, 'Bạn mua căn nhà nhỏ với 600 đSM.');
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
      startCareer(run, career, 'panel');
      message = run.employment
        ? run.lastOutcome!
        : 'Bạn bắt đầu công việc mới, thu nhập sẽ vào sổ hằng tháng.';
      break;
    case 'quit-job':
      if (!currentCareer(run)) throw new Error('Bạn chưa có công việc.');
      startCareer(run, null, 'panel');
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
  if (
    active &&
    (!eligible(run, active.condition) ||
      (run.employment && active.choices.filter((c) => !choiceReason(run, c)).length < 4))
  ) {
    note(run, active.title, 'Hoàn cảnh đã thay đổi trước khi bạn quyết định.');
    run.activeEvent = null;
  }
  return run;
}
export function dispatch(run: GameRun, action: RunAction): GameRun {
  if (
    hasEnterpriseRules(run) &&
    !['choose', 'advance'].includes(action.type) &&
    discretionaryCount(run) >= 120
  )
    throw Error('Đã dùng hết lượt quản lý; hãy tiếp tục câu chuyện.');
  if (action.type === 'enterprise') {
    const next = requestEnterprise(run, action),
      active = activeDefinition(next);
    if (
      active &&
      (!eligible(next, active.condition) ||
        active.choices.filter((c) => !choiceReason(next, c)).length < 4)
    )
      throw Error(
        'Hãy hoàn tất câu chuyện đang chờ trước khi chuyển vốn; tiền và cửa hàng chưa thay đổi.',
      );
    return next;
  }
  if (action.type === 'academic') {
    const next = requestAcademic(run, action, (r) => random(r, 'event')),
      active = activeDefinition(next);
    syncEmployment(next);
    if (isAnnual(next) && active?.id === 'employment-search' && !employmentSceneEligible(next)) {
      // Reenrollment ends unemployment. Replace only the now-inapplicable job
      // search at the SAME month; annual coverage remains owed until a choice.
      note(
        next,
        'Trở lại chương trình',
        'Việc tìm việc tạm nhường chỗ cho chương trình đang học.',
        'education',
      );
      next.activeEvent = null;
      selectEvent(next);
      return next;
    }
    if (
      active &&
      (!eligible(next, active.condition) ||
        active.choices.filter((c) => !choiceReason(next, c)).length < 4)
    )
      throw Error('Hãy giải quyết câu chuyện đang chờ trước khi thay đổi việc học.');
    return next;
  }
  if (action.type === 'family-talk') return requestFamily(run, action);
  if (action.type === 'social') return requestSocial(run, action);
  if (action.type === 'wardrobe') {
    const next = applyWardrobe(run, action),
      active = activeDefinition(next);
    if (
      active &&
      (!eligible(next, active.condition) ||
        active.choices.filter((c) => !choiceReason(next, c)).length < 4)
    )
      throw Error(
        'Hãy giải quyết câu chuyện đang chờ trước khi chi khoản này. Tiền và tủ đồ chưa thay đổi.',
      );
    return next;
  }
  if (action.type === 'advance') return advance(run);
  if (action.type === 'choose') return choose(run, action.eventId, action.choiceId);
  return manage(run, action.action, action.career);
}
export function replay(seed: string, setup: RunSetup, actions: RunAction[]): GameRun {
  if (!setup.expansion && !hasEnterpriseRules({ setup }))
    return frozen2.replay(seed, setup, actions as Parameters<typeof frozen2.replay>[2]);
  return actions.reduce(dispatch, createRun(seed, setup));
}
