import { it, expect } from 'vitest';
import rows from './data/stable-viewport-replays.json';
import type { RunAction, RunSetup } from '../src/domain/model';
import { stableEvents, STABLE_SCENE_META } from '../src/content/stable-events';
import { createRun, replay, eventEligible, activeDefinition, dispatch } from '../src/engine/engine';
import { stableSceneEligible } from '../src/engine/stable-stories';
import { assertRun } from '../src/engine/invariants';
import { hasCreativeRules, hasRealismRules } from '../src/domain/rules';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
it('isolates stable content from every existing ruleset and enables inherited careers', () => {
  for (const lifeRules of [undefined, 'annual-v1', 'realism-v1', 'creative-v1'] as const) {
    const r = createRun('stable-isolation', { cohort: 2005, region: 'southern-city', lifeRules });
    expect(stableEvents.every((e) => !eventEligible(r, e))).toBe(true);
  }
  const r = createRun('stable-isolation', {
    cohort: 2005,
    region: 'southern-city',
    lifeRules: 'stable-v1',
    currency: 'vnd-v1',
  });
  expect(hasCreativeRules(r) && hasRealismRules(r)).toBe(true);
  expect(r.creative).toBeDefined();
  expect(r.freelance).toBeDefined();
  expect(stableEvents.every((e) => !eventEligible(r, e))).toBe(true);
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
});
it('contains56 distinct scenes,8 connected arcs and a canonical fixture for every scene', () => {
  expect(stableEvents).toHaveLength(56);
  expect(new Set(stableEvents.map((e) => e.text)).size).toBe(56);
  expect(
    new Set(
      Object.values(STABLE_SCENE_META)
        .map((m) => m.arc)
        .filter(Boolean),
    ).size,
  ).toBe(8);
  expect(rows.map((r) => r.id).sort()).toEqual(stableEvents.map((e) => e.id).sort());
});
for (const row of rows)
  it('canonical context and four distinct consequences: ' + row.id, () => {
    const r = replay(row.seed, row.setup as RunSetup, row.actions as RunAction[]),
      e = activeDefinition(r)!;
    expect(e.id).toBe(row.id);
    expect(eventEligible(r, e)).toBe(true);
    expect(e.choices).toHaveLength(4);
    expect(new Set(e.choices.map((c) => c.outcome)).size).toBe(4);
    assertRun(r);
    expect(canonical(parseSave(JSON.stringify(snapshot(r))).run)).toBe(canonical(r));
    for (const c of e.choices) {
      const n = dispatch(r, {
        type: 'choose',
        eventId: e.id,
        choiceId: c.id,
      });
      assertRun(n);
      expect(n.finance).toEqual(r.finance);
      expect(n.month).toBe(r.month);
      expect(n.actions.length).toBe(r.actions.length + 1);
      const meta = STABLE_SCENE_META[e.id];
      if (meta.arc) {
        if (c.id === 'd') expect(n.flags[`stable-${meta.arc}-closed`]).toBe(true);
        else expect(n.flags[`stable-${meta.arc}-${meta.stage}`]).toBe(true);
        if (c.id === 'd')
          for (const next of stableEvents.filter((x) => STABLE_SCENE_META[x.id].arc === meta.arc))
            expect(eventEligible(n, next)).toBe(false);
      }
    }
    const negative = structuredClone(r);
    negative.month = (e.condition.minAge! - 1) * 12;
    expect(eventEligible(negative, e)).toBe(false);
    if (e.condition.npc === 'adult-child') {
      const noChild = structuredClone(r);
      noChild.npcs.forEach((n) => {
        if (n.role === 'child') n.alive = false;
      });
      expect(eventEligible(noChild, e)).toBe(false);
    }
    const requirement = STABLE_SCENE_META[e.id].requires;
    if (requirement) {
      const empty = structuredClone(r);
      empty.employment!.applications = [];
      empty.player.careers = [];
      empty.enterprise!.ventures = [];
      empty.creator!.channels = [];
      empty.freelance!.projects = [];
      empty.creative!.artist = null;
      empty.npcs.forEach((n) => {
        if (n.role === 'mother' || n.role === 'father') {
          n.alive = false;
          n.presence = 'deceased';
        }
      });
      expect(stableSceneEligible(empty, e.id)).toBe(false);
    }
  });
