import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  createRun,
  advance,
  choose,
  activeDefinition,
  choiceReason,
  eventEligible,
  replay,
} from '../src/engine/engine';
import { diverseChildhood } from '../src/content/childhood-diversity';
import { dynamicPool } from '../src/engine/lifeDiversity';
import { assertRun } from '../src/engine/invariants';
import { snapshot, parseSave, canonical } from '../src/persistence/saves';
import { simulateLife } from '../src/diagnostics/simulation';
import { hashSeed } from '../src/engine/random';
import type { RunSetup, GameRun } from '../src/domain/model';

const setup: RunSetup = {
  cohort: 1995,
  region: 'northern-village',
  wealth: 2,
  family: 'both',
  motherTraits: ['academic'],
  fatherTraits: [],
  playerTraits: ['Hay tò mò'],
  expansion: 'family',
};
function opening(seed: string, config: RunSetup) {
  let r = createRun(seed, config);
  for (let i = 0; i < 10; i++) {
    if (!r.activeEvent) r = advance(r);
    assertRun(r);
    const e = activeDefinition(r)!;
    r = choose(r, e.id, e.choices.find((c) => !choiceReason(r, c))!.id);
  }
  return r;
}
describe('immutable dynamic-life rules', () => {
  it('locks a full dynamic-v1 life independently from all earlier golden rulesets', () => {
    const r = simulateLife('golden-dynamic-v1', { ...setup, lifeRules: 'dynamic-v1' }, 2);
    expect(hashSeed(JSON.stringify(r))).toBe(3732162397);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  });
  it('preserves all400 recorded released opening sequences without rewriting expected results', () => {
    const baseline = JSON.parse(readFileSync('docs/evidence/m5-diversity-before.json', 'utf8'));
    for (const sample of baseline.samples)
      for (const life of sample.lives) {
        const r = opening(life.seed, life.setup);
        expect(r.choices.map((c) => c.eventId)).toEqual(life.firstTen);
        expect(r.setup.lifeRules).toBeUndefined();
      }
  }, 120000);
  it('has200 reproducible first-five sequences and broad opening alternatives, not just permuted choice labels', () => {
    const sequences = new Set<string>(),
      first = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const r = opening('diversity-' + i, { ...setup, lifeRules: 'dynamic-v1' });
      expect(canonical(replay(r.seed, r.setup, r.actions))).toBe(canonical(r));
      sequences.add(
        r.choices
          .slice(0, 5)
          .map((c) => c.eventId)
          .join('|'),
      );
      first.add(r.choices[0].eventId);
      expect(r.choices.filter((c) => c.eventId === 'first-school')).toHaveLength(1);
      expect(r.choices.filter((c) => c.eventId === 'exam-night')).toHaveLength(1);
      expect(r.choices.filter((c) => c.eventId === 'education-path')).toHaveLength(1);
    }
    expect(sequences.size).toBeGreaterThanOrEqual(190);
    expect(first.size).toBeGreaterThanOrEqual(10);
  }, 120000);
  it('gates origin, technology and all23 new templates out of old lives', () => {
    const r = advance(createRun('origins', { ...setup, lifeRules: 'dynamic-v1' }));
    const old = advance(createRun('origins', setup));
    for (const e of diverseChildhood) expect(eventEligible(old, e)).toBe(false);
    expect(diverseChildhood).toHaveLength(23);
    expect(
      eventEligible(
        r,
        diverseChildhood.find((e) => e.id === 'dl-two-homes')!,
      ),
    ).toBe(false);
    expect(
      eventEligible(
        r,
        diverseChildhood.find((e) => e.id === 'dl-urban')!,
      ),
    ).toBe(false);
    expect(
      eventEligible(
        r,
        diverseChildhood.find((e) => e.id === 'dl-clouds')!,
      ),
    ).toBe(true);
    expect(
      eventEligible(
        { ...r, player: { ...r.player, traits: ['Ưa yên tĩnh'] } },
        diverseChildhood.find((e) => e.id === 'dl-clouds')!,
      ),
    ).toBe(false);
    const preInternet = { ...r, month: 108, world: { ...r.world, year: 1984, technologies: [] } };
    expect(
      eventEligible(
        preInternet,
        diverseChildhood.find((e) => e.id === 'dl-computer')!,
      ),
    ).toBe(false);
  });
  it('keeps at least4 valid real choices for every new scene under a valid forced context', () => {
    for (const event of diverseChildhood) {
      const r = createRun('forced-' + event.id, {
        ...setup,
        lifeRules: 'dynamic-v1',
        wealth: 1,
        family: 'with-mother',
      });
      r.month = (event.condition.minAge ?? 3) * 12;
      r.status = 'playing';
      r.world.year = r.player.birthYear + Math.floor(r.month / 12);
      r.world.technologies = ['internet', 'smartphone'];
      for (const f of event.condition.flags ?? []) r.flags[f] = true;
      if (event.id === 'dl-urban') r.setup.environment = 'urban';
      if (event.id === 'dl-shell') r.player.region = 'central-coast';
      r.activeEvent = { id: event.id, month: r.month };
      expect(eventEligible(r, event), event.id).toBe(true);
      const choices = event.choices.filter((c) => !choiceReason(r, c));
      expect(choices.length, event.id).toBeGreaterThanOrEqual(4);
      const outcomes = choices.map((c) => choose(r, event.id, c.id));
      expect(
        new Set(
          outcomes.map((x) =>
            canonical([x.player.stats, x.flags, x.finance, x.relationships, x.scheduled]),
          ),
        ).size,
        event.id,
      ).toBe(choices.length);
    }
  });
  it('honors once/cooldown and gives school beats priority over optional scenes', () => {
    const r = advance(createRun('cooldown', { ...setup, lifeRules: 'dynamic-v1' }));
    const e = diverseChildhood.find((e) => e.id === 'dl-box')!;
    r.seen[e.id] = r.month;
    expect(eventEligible(r, e)).toBe(false);
    expect(eventEligible(r, { ...e, once: false, cooldown: 0 })).toBe(true);
    expect(eventEligible(r, { ...e, once: false, cooldown: 60 })).toBe(false);
    const school = { ...e, id: 'first-school' };
    expect(dynamicPool(r, [e, school])).toEqual([school]);
  });
  it('strictly roundtrips new flags/schedules and rejects adding a ruleset to an old snapshot', () => {
    const r = opening('new-save', { ...setup, lifeRules: 'dynamic-v1' });
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    const old = snapshot(opening('new-save', setup));
    (old.run as GameRun).setup.lifeRules = 'dynamic-v1';
    expect(() => parseSave(JSON.stringify(old))).toThrow();
  });
});
