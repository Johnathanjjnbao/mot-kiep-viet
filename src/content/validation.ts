import { z } from 'zod';
import type { Effect, EventDefinition } from '../domain/model';
import { CAREERS } from './world';
import { EVENTS } from './events';
import { STORY_ARCS } from './arcs';
const id = z.string().min(1).max(100);
const stat = z.enum(['health', 'mood', 'knowledge', 'skill', 'social', 'stress']);
const education = z.enum(['none', 'general', 'vocational', 'university', 'self']);
const career = z.enum([
  'farm',
  'labor',
  'trade',
  'retail',
  'service',
  'office',
  'teacher',
  'tech',
  'freelance',
  'business',
]);
const stats = z
  .object({
    health: z.number().optional(),
    mood: z.number().optional(),
    knowledge: z.number().optional(),
    skill: z.number().optional(),
    social: z.number().optional(),
    stress: z.number().optional(),
  })
  .strict();
export const conditionSchema = z
  .object({
    minAge: z.number().int().min(0).max(82).optional(),
    maxAge: z.number().int().max(82).optional(),
    minYear: z.number().int().optional(),
    maxYear: z.number().int().optional(),
    region: z.enum(['southern-city', 'northern-village', 'central-coast']).optional(),
    housing: z.enum(['family', 'rent', 'owned']).optional(),
    job: z.union([career, z.enum(['employed', 'unemployed'])]).optional(),
    education: z.array(education).optional(),
    minStats: stats.optional(),
    maxStats: stats.optional(),
    flags: z.array(id).optional(),
    absent: z.array(id).optional(),
    partner: z.boolean().optional(),
    npc: id.optional(),
    minCash: z.number().nonnegative().optional(),
    technology: z.enum(['internet', 'smartphone']).optional(),
    minDebt: z.number().nonnegative().optional(),
  })
  .strict();
const effect: z.ZodType<Effect> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z
      .object({
        kind: z.literal('academic'),
        method: z.enum(['steady', 'project', 'work', 'rest']),
      })
      .strict(),
    z
      .object({
        kind: z.literal('parenting'),
        style: z.enum([
          'support',
          'discipline',
          'achievement',
          'explore',
          'protect',
          'distant',
          'inconsistent',
          'balanced',
        ]),
      })
      .strict(),
    z
      .object({
        kind: z.literal('social'),
        operation: z.enum([
          'meet',
          'listen',
          'learn',
          'share',
          'flirt',
          'date',
          'exclusive',
          'cohabit',
          'propose',
          'wait',
          'respect',
          'leave',
          'secret',
          'confess',
          'repair',
          'separate',
          'divorce',
          'support',
          'blame',
          'decline',
          'plan-child',
          'grieve',
        ]),
      })
      .strict(),
    z
      .object({
        kind: z.literal('presentation'),
        context: z.enum(['interview', 'ceremony', 'exercise', 'creative', 'thrifty']),
      })
      .strict(),
    z
      .object({ kind: z.literal('stat'), stat, amount: z.number().int().min(-100).max(100) })
      .strict(),
    z
      .object({
        kind: z.literal('cash'),
        amount: z.number().int().min(-10000).max(10000),
        label: z.string().min(1),
      })
      .strict(),
    z.object({ kind: z.literal('flag'), flag: id, value: z.boolean() }).strict(),
    z
      .object({
        kind: z.literal('education'),
        level: education,
        years: z.number().int().min(0).max(6),
      })
      .strict(),
    z.object({ kind: z.literal('career'), career: career.nullable() }).strict(),
    z
      .object({
        kind: z.literal('relationship'),
        target: z.enum(['mother', 'father', 'friend', 'partner']),
        amount: z.number().int().min(-100).max(100),
      })
      .strict(),
    z
      .object({ kind: z.literal('family'), action: z.enum(['partner', 'breakup', 'child']) })
      .strict(),
    z.object({ kind: z.literal('housing'), housing: z.enum(['family', 'rent', 'owned']) }).strict(),
    z.object({ kind: z.literal('habit'), amount: z.number().int().min(-3).max(3) }).strict(),
    z
      .object({
        kind: z.literal('schedule'),
        afterMonths: z.number().int().positive().max(240),
        label: z.string().min(1),
        effects: z.array(effect).min(1).max(20),
      })
      .strict(),
  ]),
);
const choice = z
  .object({
    id,
    text: z.string().min(1),
    hint: z.string().min(1),
    outcome: z.string().min(1),
    effects: z.array(effect),
    requires: conditionSchema.optional(),
    chance: z
      .object({
        probability: z.number().min(0).max(1),
        success: z.array(effect),
        failure: z.array(effect),
        successText: z.string().min(1),
        failureText: z.string().min(1),
      })
      .strict()
      .optional(),
  })
  .strict();
export const eventSchema = z
  .object({
    id,
    version: z.number().int().positive(),
    category: z.enum([
      'childhood',
      'education',
      'career',
      'relationship',
      'finance',
      'history',
      'humor',
    ]),
    title: z.string().min(1),
    text: z.string().min(20),
    condition: conditionSchema,
    weight: z.number().positive(),
    cooldown: z.number().int().nonnegative(),
    once: z.boolean(),
    priority: z.number().int().nonnegative(),
    choices: z.array(choice).min(4).max(6),
    sensitivity: z.array(z.string()),
    provenance: z
      .object({
        kind: z.enum(['designed', 'historical-context']),
        source: z.url().optional(),
        note: z.string().min(1),
      })
      .strict(),
    arc: id.optional(),
  })
  .strict();
const walk = (effects: Effect[]): Effect[] =>
  effects.flatMap((e) => (e.kind === 'schedule' ? [e, ...walk(e.effects)] : [e]));
export function validateContent(events: EventDefinition[] = EVENTS) {
  const errors: string[] = [],
    ids = new Set<string>(),
    counts: Record<string, number> = {};
  const produced = new Set(
    events
      .flatMap((e) =>
        e.choices.flatMap((c) =>
          walk([...c.effects, ...(c.chance?.success ?? []), ...(c.chance?.failure ?? [])]),
        ),
      )
      .filter((e) => e.kind === 'flag')
      .map((e) => (e.kind === 'flag' ? e.flag : '')),
  );
  for (const e of events) {
    const result = eventSchema.safeParse(e);
    if (!result.success) errors.push(`${e.id}: ${result.error.message}`);
    if (ids.has(e.id)) errors.push(`Duplicate ID ${e.id}`);
    ids.add(e.id);
    counts[e.category] = (counts[e.category] ?? 0) + 1;
    const signatures = e.choices.map((c) => JSON.stringify([c.effects, c.chance]));
    if (new Set(signatures).size !== signatures.length) errors.push(`Identical paths ${e.id}`);
    if (e.choices.some((c) => !c.effects.length && !c.chance))
      errors.push(`Inconsequential path ${e.id}`);
    if (new Set(e.choices.map((c) => c.id)).size !== e.choices.length)
      errors.push(`Duplicate choice ${e.id}`);
    if (
      e.condition.minAge !== undefined &&
      e.condition.maxAge !== undefined &&
      e.condition.minAge > e.condition.maxAge
    )
      errors.push(`Age range ${e.id}`);
    if (e.provenance.kind === 'historical-context' && !e.provenance.source)
      errors.push(`Missing source ${e.id}`);
    for (const condition of [
      e.condition,
      ...e.choices.map((c) => c.requires).filter((c) => c !== undefined),
    ]) {
      if (
        condition.minAge !== undefined &&
        condition.maxAge !== undefined &&
        condition.minAge > condition.maxAge
      )
        errors.push(`Contradictory age ${e.id}`);
      if (
        condition.minYear !== undefined &&
        condition.maxYear !== undefined &&
        condition.minYear > condition.maxYear
      )
        errors.push(`Contradictory year ${e.id}`);
      for (const f of [...(condition.flags ?? []), ...(condition.absent ?? [])])
        if (!produced.has(f)) errors.push(`Unresolved flag ${e.id}/${f}`);
      if (condition.flags?.some((f) => condition.absent?.includes(f)))
        errors.push(`Contradictory flags ${e.id}`);
      if (
        condition.npc &&
        !['mother', 'father', 'friend', 'partner', 'child', 'adult-child'].includes(condition.npc)
      )
        errors.push(`Unresolved NPC ${e.id}/${condition.npc}`);
    }
    if (
      (e.condition.technology === 'smartphone' && (e.condition.minYear ?? 0) < 2010) ||
      (e.condition.technology === 'internet' && (e.condition.minYear ?? 0) < 2000)
    )
      errors.push(`Technology era ${e.id}`);
  }
  for (const arc of STORY_ARCS)
    for (const stage of arc.stages)
      if (!events.some((e) => e.id === stage && e.arc === arc.id))
        errors.push(`Unresolved arc ${arc.id}/${stage}`);
  const reachable = new Set<string>();
  for (let pass = 0; pass < events.length; pass++)
    for (const e of events) {
      if ((e.condition.flags ?? []).every((f) => reachable.has(f)))
        for (const c of e.choices) {
          if ((c.requires?.flags ?? []).every((f) => reachable.has(f)))
            for (const effect of walk([
              ...c.effects,
              ...(c.chance?.success ?? []),
              ...(c.chance?.failure ?? []),
            ]))
              if (effect.kind === 'flag' && effect.value) reachable.add(effect.flag);
        }
    }
  for (const e of events)
    if ((e.condition.flags ?? []).some((f) => !reachable.has(f)))
      errors.push(`Unreachable event chain ${e.id}`);
  const targets = {
    childhood: 8,
    education: 12,
    career: 16,
    relationship: 10,
    finance: 10,
    history: 8,
    humor: 8,
  };
  for (const [cat, count] of Object.entries(targets))
    if ((counts[cat] ?? 0) < count) errors.push(`${cat}: ${counts[cat]} / ${count}`);
  if (CAREERS.length !== 10 || new Set(CAREERS.map((c) => c.id)).size !== 10)
    errors.push('Career catalog');
  return { total: events.length, counts, arcs: STORY_ARCS.length, errors };
}
