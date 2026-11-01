import { describe, it, expect } from 'vitest';
import type { GameRun, RunSetup } from '../src/domain/model';
import {
  createRun,
  advance,
  choose,
  choiceReason,
  activeDefinition,
  replay,
} from '../src/engine/engine';
import { ageOf } from '../src/content/world';
import { assertRun } from '../src/engine/invariants';
import { assertAnnual } from '../src/engine/annual';
import { canonical, snapshot, parseSave } from '../src/persistence/saves';
import { storyAction, decisionKey } from '../src/application/story-flow';
import { annualEvents } from '../src/content/annual-events';

export const annualSetup: RunSetup = {
  cohort: 1995,
  region: 'northern-village',
  wealth: 4,
  expansion: 'family',
  family: 'both',
  motherTraits: ['gentle'],
  fatherTraits: ['academic'],
  lifeRules: 'annual-v1',
};
function decide(r: GameRun) {
  const e = activeDefinition(r)!;
  const options = e.choices.filter((c) => !choiceReason(r, c));
  expect(options.length).toBeGreaterThanOrEqual(4);
  const score = (c: (typeof options)[number]) =>
    c.effects.reduce(
      (n, x) =>
        n +
        (x.kind === 'stat'
          ? x.stat === 'health'
            ? x.amount * 4
            : x.stat === 'stress'
              ? -x.amount
              : 0
          : x.kind === 'habit'
            ? x.amount * 8
            : 0),
      0,
    );
  options.sort((a, b) => score(b) - score(a));
  return choose(r, e.id, options[0].id);
}
function toAge(target: number, seed = 'annual-coverage') {
  let r = createRun(seed, annualSetup);
  for (
    let i = 0;
    i < 500 && (ageOf(r) < target || !r.choices.some((c) => Math.floor(c.month / 12) === target));
    i++
  ) {
    if (r.status === 'ended') break;
    const before = ageOf(r);
    r = r.activeEvent ? decide(r) : advance(r);
    expect(ageOf(r) - before).toBeLessThanOrEqual(1);
    assertRun(r);
  }
  return r;
}
describe('non-default annual-v1 foundation', () => {
  it('locks annual-v1 to an independent golden without changing any earlier ruleset', async () => {
    const { simulateLife } = await import('../src/diagnostics/simulation');
    const { hashSeed } = await import('../src/engine/random');
    const { newbornAnnual } = await import('../scripts/annual-fixture');
    const r = simulateLife('golden-annual-v1', newbornAnnual().setup, 0);
    expect(hashSeed(JSON.stringify(r))).toBe(432954253);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  });
  it('replays the stress-13 regression with a social-loss focus after the historical age81 ceiling', async () => {
    const { simulateLife } = await import('../src/diagnostics/simulation');
    const { PARENT_TRAITS } = await import('../src/domain/creator');
    const r = simulateLife(
      'stress-13',
      {
        lifeRules: 'annual-v1',
        expansion: 'social',
        cohort: 1988,
        region: 'northern-village',
        name: 'Nguyễn An 13',
        birthplace: 'Quê nhà 13',
        environment: 'urban',
        wealth: 3,
        family: 'mother-only',
        motherTraits: [
          Object.keys(PARENT_TRAITS)[3] as NonNullable<RunSetup['motherTraits']>[number],
        ],
        fatherTraits: [],
      },
      3,
    );
    expect(r.ending).toBe('death');
    expect(ageOf(r)).toBeGreaterThan(82);
    expect(r.choices.some((c) => c.eventId.startsWith('soc-loss@') && c.month > 984)).toBe(true);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    expect(r.actions.length).toBeLessThanOrEqual(512);
  });
  it('starts with age0, requires a choice before ticking, and guards repeated advance', () => {
    const original = createRun('newborn', annualSetup);
    const r = advance(original);
    expect(r.month).toBe(0);
    expect(original.status).toBe('intro');
    expect(activeDefinition(r)!.id).toMatch(/^annual-/);
    expect(() => advance(r)).toThrow();
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    expect(advance(decide(r)).month).toBe(12);
  });
  it.each([5, 18, 30])('shows and completes every age0..%i with canonical replay', (target) => {
    const r = toAge(target);
    expect(ageOf(r)).toBe(target);
    expect([...new Set(r.choices.map((c) => Math.floor(c.month / 12)))]).toEqual(
      Array.from({ length: target + 1 }, (_, i) => i),
    );
    expect(canonical(replay(r.seed, r.setup, r.actions))).toBe(canonical(r));
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    expect(r.actions.length).toBeLessThan(512);
  });
  it('keeps one-tap presentation orchestration at consecutive ages and persists birthday edges', () => {
    let r = createRun('one-tap-annual', annualSetup);
    r = storyAction(r, { type: 'advance' });
    for (let age = 0; age <= 18; age++) {
      while (ageOf(r) === age && r.status !== 'ended') {
        const e = activeDefinition(r)!;
        expect(e).toBeDefined();
        r = storyAction(
          r,
          {
            type: 'choose',
            eventId: e.id,
            choiceId: e.choices.find((c) => !choiceReason(r, c))!.id,
          },
          decisionKey(r),
        );
        expect(ageOf(r)).toBeLessThanOrEqual(age + 1);
      }
      r = parseSave(JSON.stringify(snapshot(r))).run;
    }
    expect(ageOf(r)).toBe(19);
  });
  it.each(['both', 'father-only', 'mother-only', 'with-father', 'with-mother'] as const)(
    'narrates actual %s caregivers without creating parents',
    (family) => {
      const r = advance(createRun('infant-family', { ...annualSetup, family }));
      const text = activeDefinition(r)!.text;
      const residents = r.npcs.filter((n) => n.presence === 'resident');
      expect(residents.length).toBe(family === 'both' ? 2 : 1);
      for (const n of residents) expect(text).toContain(n.name);
      expect(r.player.careers).toHaveLength(0);
      expect(
        activeDefinition(r)!.choices.every(
          (c) => !c.effects.some((x) => x.kind === 'career' || x.kind === 'education'),
        ),
      ).toBe(true);
    },
  );
  it('rejects a missing completed age even when month and journal look plausible', () => {
    const r = toAge(5);
    r.choices = r.choices.filter((c) => Math.floor(c.month / 12) !== 2);
    expect(() => assertAnnual(r)).toThrow('missing decision at age 2');
  });
  it('permits valid health death before the next birthday, with no forced future milestone', () => {
    let r = decide(advance(createRun('annual-terminal-fixture', annualSetup)));
    // Deliberate terminal fixture; this modified run is not offered as canonical save evidence.
    r.player.stats.health = 0;
    r = advance(r);
    expect(r.status).toBe('ended');
    expect(r.ending).toBe('death');
    expect(r.month).toBe(1);
    assertRun(r);
  });
  it('does not end at82, and maintains coverage beyond82 on an explicit healthy boundary fixture', () => {
    let r = decide(advance(createRun('annual-long-boundary-fixture', annualSetup)));
    for (let i = 0; i < 400 && ageOf(r) < 84; i++) {
      // Controlled survival fixture, separate from deterministic unmodified-life simulations.
      r.player.stats.health = 100;
      r.player.stats.stress = 0;
      r = r.activeEvent ? decide(r) : advance(r);
      assertRun(r);
    }
    expect(ageOf(r)).toBe(84);
    expect(r.status).toBe('playing');
    expect(r.ending).toBeNull();
    expect(r.actions.length).toBeLessThan(512);
  });
  it('keeps new templates inaccessible under every historical selector', async () => {
    const { eventEligible } = await import('../src/engine/engine');
    for (const lifeRules of [undefined, 'dynamic-v1', 'education-v1', 'career-v1'] as const) {
      const r = createRun('older-selector', { ...annualSetup, lifeRules });
      expect(annualEvents.every((e) => !eventEligible(r, e))).toBe(true);
    }
  });
});
