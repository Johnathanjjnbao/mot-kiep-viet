import { assertFamily } from './family';
import { assertSocial } from './social';
import { assertRun as assertFrozen2 } from '../legacy/v2/engine/invariants';
import { assertWardrobe } from './wardrobe';
import type { GameRun } from '../domain/model';
import { playerPersonalitySchema } from '../domain/personality';
import { assertAcademics } from './academics';
import { CAREERS, ageOf, currentCareer, worldFor } from '../content/world';
import { activeDefinition, eligible, partnerOf, choiceReason } from './engine';
export function assertRun(run: GameRun) {
  if (run.engineVersion === '2.0.0')
    return assertFrozen2(run as Parameters<typeof assertFrozen2>[0]);
  assertWardrobe(run);
  assertSocial(run);
  assertFamily(run);
  assertAcademics(run);
  const fail = (text: string): never => {
    throw new Error(`Invariant: ${text}`);
  };
  if (
    run.setup.playerTraits !== undefined &&
    (!playerPersonalitySchema.safeParse(run.setup.playerTraits).success ||
      JSON.stringify(run.player.traits) !== JSON.stringify(run.setup.playerTraits))
  )
    fail('immutable player personality');
  if (!Number.isInteger(run.month) || run.month < 0 || run.month > 984) fail('month');
  if (
    run.world.year !== run.player.birthYear + ageOf(run) ||
    JSON.stringify(run.world) !== JSON.stringify(worldFor(run.world.year))
  )
    fail('world/year');
  if (run.status === 'ended' && (!run.ending || run.activeEvent || currentCareer(run)))
    fail('ending');
  if (!run.player.alive && (run.status !== 'ended' || run.ending !== 'death')) fail('life status');
  Object.values(run.player.stats).forEach((n) => {
    if (!Number.isFinite(n) || n < 0 || n > 100) fail('stat limits');
  });
  const ids = new Set(run.npcs.map((n) => n.id));
  if (ids.size !== run.npcs.length) fail('NPC identity');
  for (const r of run.relationships)
    if (!ids.has(r.npcId) || !Number.isFinite(r.strength) || r.strength < 0 || r.strength > 100)
      fail('relationship');
  if (new Set(run.relationships.map((r) => r.npcId)).size !== run.relationships.length)
    fail('duplicate relationship');
  if (
    run.relationships.filter(
      (r) => r.type === 'partner' && run.npcs.find((n) => n.id === r.npcId)?.alive,
    ).length > 1
  )
    fail('partner exclusivity');
  if (partnerOf(run) && ageOf(run) < 18) fail('partner age');
  if (run.npcs.some((n) => n.role === 'child' && n.birthYear - run.player.birthYear < 18))
    fail('parent age');
  const careers = run.player.careers;
  if (careers.filter((c) => c.endMonth === null).length > 1) fail('active career');
  careers.forEach((c, i) => {
    const definition = CAREERS.find((job) => job.id === c.id);
    if (
      !definition ||
      run.player.birthYear + Math.floor(c.startMonth / 12) < definition.from ||
      Math.floor(c.startMonth / 12) < definition.minAge
    )
      fail('career era/age');
    if (
      c.startMonth > run.month ||
      (c.endMonth !== null && (c.endMonth < c.startMonth || c.endMonth > run.month)) ||
      (i > 0 && (careers[i - 1].endMonth === null || careers[i - 1].endMonth! > c.startMonth))
    )
      fail('career history');
  });
  if (new Set(run.finance.assets.map((a) => a.id)).size !== run.finance.assets.length)
    fail('duplicate asset');
  const sums = { cash: 0, savings: 0, debt: 0, assets: 0 },
    transactionIds = new Set<string>();
  for (const t of run.finance.transactions) {
    if (transactionIds.has(t.id) || t.month > run.month) fail('duplicate/future transaction');
    transactionIds.add(t.id);
    for (const k of Object.keys(sums) as (keyof typeof sums)[]) {
      if (!Number.isSafeInteger(t[k])) fail('transaction amount');
      sums[k] += t[k];
    }
  }
  if (
    !Number.isSafeInteger(run.finance.cash) ||
    !Number.isSafeInteger(run.finance.savings) ||
    !Number.isSafeInteger(run.finance.liability.principal) ||
    sums.cash !== run.finance.cash ||
    sums.savings !== run.finance.savings ||
    sums.debt !== run.finance.liability.principal ||
    sums.assets !== run.finance.assets.reduce((n, a) => n + a.value, 0)
  )
    fail('ledger reconciliation');
  if (
    run.finance.cash < 0 ||
    run.finance.savings < 0 ||
    run.finance.liability.principal < 0 ||
    run.finance.settledThrough !== run.month
  )
    fail('balances/settlement');
  const scheduledIds = new Set(run.scheduled.map((s) => s.id));
  if (scheduledIds.size !== run.scheduled.length) fail('scheduled duplicate');
  if (
    run.scheduled.some(
      (s) =>
        (s.executed && s.dueMonth > run.month) ||
        (!s.executed && s.dueMonth <= run.month && run.status !== 'ended'),
    )
  )
    fail('scheduled lifecycle');
  const active = activeDefinition(run);
  if (active && active.choices.filter((c) => !choiceReason(run, c)).length < 4)
    fail('fewer than four enabled choices');
  if (run.engineVersion === '3.0.0') {
    if (run.setup.cohort < 1975 || run.setup.cohort > 2026) fail('birth year');
    for (const n of run.npcs.filter((n) => n.id === 'mother' || n.id === 'father')) {
      if (!n.presence) fail('parent presence');
      if (n.presence === 'unknown' && run.relationships.some((r) => r.npcId === n.id))
        fail('unknown parent relationship');
      if (n.presence === 'deceased' && n.alive) fail('parent death');
    }
  }
  if (
    run.activeEvent &&
    (!active || !eligible(run, active.condition) || run.activeEvent.month !== run.month)
  )
    fail('event eligibility');
  const choiceIds = new Set<string>();
  for (const c of run.choices) {
    const key = `${c.month}:${c.eventId}`;
    if (choiceIds.has(key) || c.month > run.month) fail('duplicate/future choice');
    choiceIds.add(key);
  }
  for (let i = 1; i < run.journal.length; i++)
    if (run.journal[i].month < run.journal[i - 1].month) fail('journal order');
}
