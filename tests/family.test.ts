import { describe, it, expect } from 'vitest';
import { familyStart, familyBirth, growFamily } from '../scripts/family-fixture';
import { talk, friendly } from '../scripts/social-fixture';
import {
  childAge,
  assertFamily,
  syncCare,
  requestFamily,
  applyParenting,
  PARENTING_LABELS,
  tickFamily,
} from '../src/engine/family';
import { socialEligible, requestSocial } from '../src/engine/social';
import { activeDefinition, choose, replay, createRun } from '../src/engine/engine';
import { assertRun } from '../src/engine/invariants';
import { parseSave, snapshot } from '../src/persistence/saves';
import { parentingEvents } from '../src/content/parenting-events';
import { hashSeed } from '../src/engine/random';
import 'fake-indexeddb/auto';
import { archiveLife, listHistory, exportHistory, importHistory } from '../src/persistence/history';
describe('family ruleset', () => {
  it('records a care transition once and preserves deceased child history without further development', () => {
    let r = familyBirth();
    r = talk(r, 'soc-separate', 'friend', 'separate');
    const c = r.family!.children[0],
      memories = c.memories.length,
      wellbeing = c.wellbeing;
    syncCare(r);
    syncCare(r);
    expect(c.memories).toHaveLength(memories);
    expect(c.wellbeing).toBe(wellbeing);
    expect(c.memories.some((m) => m.text.includes('Người chăm sóc'))).toBe(true);
    r.npcs.find((n) => n.id === c.npcId)!.alive = false;
    syncCare(r);
    const saved = structuredClone(c);
    r.month += 12;
    tickFamily(r);
    expect(c).toEqual(saved);
    expect(c.parents[1]).toBe('friend');
    expect(c.inHousehold).toBe(false);
    assertFamily(r);
  });
  it('locks the family golden separately from wardrobe, social and frozen rulesets', () => {
    expect(hashSeed(JSON.stringify(growFamily(familyBirth(), 44)))).toBe(2051297714);
  });
  it('keeps a parenting decision active when another social conversation is requested', () => {
    const r = growFamily(familyBirth(), 24),
      childId = r.family!.children[0].npcId;
    const focused = requestFamily(r, {
      type: 'family-talk',
      templateId: 'family-sleep',
      childId,
      expected: r.actions.length,
    });
    expect(() =>
      requestSocial(focused, {
        type: 'social',
        templateId: 'soc-introduce',
        npcId: 'social:linh',
        expected: focused.actions.length,
      }),
    ).toThrow();
    const event = activeDefinition(focused)!;
    expect(event.id).toBe(focused.family!.focus!.instanceId);
    const resolved = choose(focused, event.id, event.choices[0].id);
    expect(resolved.family!.focus).toBeNull();
    expect(parseSave(JSON.stringify(snapshot(resolved))).run).toEqual(resolved);
  });
  it('archives the full child development independently of active save slots and roundtrips the original memoir', async () => {
    const r = growFamily(familyBirth(), 82);
    expect(r.status).toBe('ended');
    const id = crypto.randomUUID();
    await archiveLife(r, id);
    const record = (await listHistory()).find((x) => x.id === id)!;
    expect(record.memoir).toContain(r.family!.children[0].occupation!);
    expect(record.save.run.family).toEqual(r.family);
    await importHistory(exportHistory([record]));
    expect((await listHistory()).filter((x) => x.id === id)).toHaveLength(1);
  });
  it('keeps eight accumulated approaches distinct rather than fixing one permanent parenting label', () => {
    for (const style of Object.keys(PARENTING_LABELS) as (keyof typeof PARENTING_LABELS)[]) {
      const r = familyBirth(),
        c = r.family!.children[0],
        instanceId = 'forced-parenting';
      r.family!.focus = { templateId: 'family-birth', childId: c.npcId, instanceId, resume: null };
      r.activeEvent = { id: instanceId, month: r.month };
      const before = c.patterns[style];
      applyParenting(r, style);
      applyParenting(r, style);
      expect(c.patterns[style]).toBe(before + 2);
      expect(c.memories.at(-1)?.style).toBe(style);
      assertFamily(r);
    }
  });
  it('adds a new spouse as caregiver without rewriting the recorded parents', () => {
    let r = familyBirth();
    const parents = [...r.family!.children[0].parents];
    r = talk(r, 'soc-separate', 'friend', 'separate');
    r = talk(r, 'soc-divorce', 'friend', 'divorce');
    const id = 'social:linh';
    r = friendly(r, id);
    r = talk(r, 'soc-date', id, 'date');
    r = talk(r, 'soc-exclusive', id, 'exclusive');
    for (const age of [24, 26, 28]) {
      r = growFamily(r, age);
      for (const [scene, op] of [
        ['soc-listen', 'listen'],
        ['soc-book', 'learn'],
        ['soc-boundary', 'respect'],
        ['soc-proposal', 'propose'],
      ] as const)
        if (socialEligible(r, scene, id, true)) r = talk(r, scene, id, op);
      if (r.social!.people[1].status === 'married') break;
    }
    expect(r.social!.people[1].status).toBe('married');
    expect(r.family!.children[0].parents).toEqual(parents);
    expect(r.family!.children[0].caregivers).toContain(id);
    expect(r.family!.children[0].visitingParents).toContain('friend');
    assertRun(r);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  });
  it('chooses a valid guardian after the player caregiver dies, preserving parent identity', () => {
    const r = familyBirth(),
      c = r.family!.children[0];
    r.player.alive = false;
    r.npcs.find((n) => n.id === 'friend')!.alive = false;
    syncCare(r);
    expect(c.parents[0]).toBe('player:' + r.id);
    expect(c.caregivers.length).toBeGreaterThan(0);
    expect(c.caregivers).not.toContain('player:' + r.id);
    expect(c.caregivers).not.toContain('friend');
    assertFamily(r);
  });
  it('creates a single child at the scheduled date with stable parents and caregivers', () => {
    const planned = familyStart();
    expect(planned.family!.nextBirth).not.toBeNull();
    const r = familyBirth(),
      c = r.family!.children[0];
    expect(r.family!.children).toHaveLength(1);
    expect(c.parents).toEqual(['player:' + r.id, 'friend']);
    expect(c.caregivers).toContain(c.parents[0]);
    expect(c.bornMonth).toBe(252);
    expect(c.patterns.support).toBe(1);
    assertRun(r);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  });
  it('authors sixteen distinct family templates with four enabled parenting approaches', () => {
    expect(parentingEvents).toHaveLength(16);
    for (const e of parentingEvents) {
      expect(e.choices).toHaveLength(4);
      expect(new Set(e.choices.map((c) => JSON.stringify(c.effects))).size).toBe(4);
    }
  });
  it('accumulates parenting, school progress and child agency through career entry', () => {
    const r = growFamily(familyBirth(), 44),
      c = r.family!.children[0];
    expect(childAge(r, c)).toBeGreaterThanOrEqual(22);
    expect(c.patterns.support + c.patterns.balanced + c.patterns.explore).toBeGreaterThan(5);
    expect(c.skills.study).toBeGreaterThan(15);
    expect(c.occupation).toBeTruthy();
    expect(c.memories.some((m) => m.text.includes('Tự chọn hướng'))).toBe(true);
    expect(c.memories.some((m) => m.text.includes('Bước vào đời sống nghề'))).toBe(true);
    expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
    assertRun(r);
  });
  it('responds differently to accumulated pressure and retains independent interests', () => {
    const start = familyBirth(),
      a = growFamily(start, 40, 'support'),
      b = growFamily(start, 40, 'achievement');
    expect(a.family!.children[0].patterns).not.toEqual(b.family!.children[0].patterns);
    expect(a.family!.children[0].tendencies.stress).not.toBe(
      b.family!.children[0].tendencies.stress,
    );
    expect(b.family!.children[0].interest).toBe(a.family!.children[0].interest);
    expect(b.family!.children[0].aspiration).toBe(a.family!.children[0].aspiration);
  });
  it('supports two children without copying identity, patterns or development between them', () => {
    let r = growFamily(familyBirth(), 23);
    r = talk(r, 'soc-child-plan', 'friend', 'plan-child');
    r = growFamily(r, 29);
    expect(r.family!.children).toHaveLength(2);
    const [a, b] = r.family!.children;
    expect(a.npcId).not.toBe(b.npcId);
    expect(a.bornMonth).not.toBe(b.bornMonth);
    expect(a.skills).not.toEqual(b.skills);
    expect(a.patterns).not.toBe(b.patterns);
    assertRun(r);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  });
  it('preserves biological/recorded parents, visits and care after divorce and death', () => {
    let r = familyBirth();
    r = talk(r, 'soc-separate', 'friend', 'separate');
    r = talk(r, 'soc-divorce', 'friend', 'divorce');
    const c = r.family!.children[0];
    expect(c.parents[1]).toBe('friend');
    expect(c.custody).toBe('player');
    expect(c.visitingParents).toContain('friend');
    r.npcs.find((n) => n.id === 'friend')!.alive = false;
    syncCare(r);
    expect(c.parents[1]).toBe('friend');
    expect(c.caregivers).not.toContain('friend');
    expect(c.visitingParents).not.toContain('friend');
    expect(c.caregivers).toContain('player:' + r.id);
    assertFamily(r);
  });
  it('rejects arbitrary child references, stale requests and family operations in older rulesets', () => {
    const r = familyBirth();
    expect(() =>
      requestFamily(r, {
        type: 'family-talk',
        templateId: 'family-birth',
        childId: 'bad',
        expected: r.actions.length,
      }),
    ).toThrow();
    const old = createRun('old-social', {
      expansion: 'social',
      cohort: 1995,
      region: 'northern-village',
    });
    expect(() =>
      requestFamily(old, {
        type: 'family-talk',
        templateId: 'family-class',
        childId: 'child:6',
        expected: 0,
      }),
    ).toThrow();
    const s = snapshot(r);
    s.run.family!.children[0].parents[1] = 'bad';
    expect(() => parseSave(JSON.stringify(s))).toThrow();
    expect(() => assertFamily(s.run)).toThrow();
  });
  it('executes only one parenting action for an obsolete event and keeps the original save', () => {
    const r = familyStart();
    let child = growFamily(r, 24);
    child = requestFamily(child, {
      type: 'family-talk',
      templateId: 'family-sleep',
      childId: child.family!.children[0].npcId,
      expected: child.actions.length,
    });
    const e = activeDefinition(child)!;
    const next = choose(child, e.id, e.choices[0].id);
    expect(() => choose(next, e.id, e.choices[0].id)).toThrow();
    expect(child.family!.children[0].patterns).not.toEqual(next.family!.children[0].patterns);
  });
});
