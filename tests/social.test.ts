import {born,toAge,talk,friendly,suitable,married} from '../scripts/social-fixture';
import { describe, it, expect } from 'vitest';
import {
  createRun,
  dispatch,
  activeDefinition,
  replay,
  advance,
  choose,
} from '../src/engine/engine';
import { requestSocial, tickSocial, assertSocial } from '../src/engine/social';
import { snapshot, parseSave, canonical } from '../src/persistence/saves';
import { assertRun } from '../src/engine/invariants';
import { romanceEvents } from '../src/content/romance-events';
import {hashSeed} from '../src/engine/random';
describe('social ruleset', () => {
  it('locks the social ruleset golden independently of future family mechanics',()=>{expect(hashSeed(JSON.stringify(married()))).toBe(520037075);});
  it('supports a new marriage after divorce while keeping the former partner',()=>{
    let r=married();r=talk(r,'soc-separate','friend','separate');r=talk(r,'soc-divorce','friend','divorce');const id='social:linh';r=friendly(r,id);r=talk(r,'soc-date',id,'date');r=talk(r,'soc-exclusive',id,'exclusive');r=toAge(r,22);r=talk(r,'soc-listen',id,'listen');r=talk(r,'soc-book',id,'learn');r=talk(r,'soc-boundary',id,'respect');r=toAge(r,24);r=talk(r,'soc-listen',id,'listen');r=talk(r,'soc-proposal',id,'propose');expect(r.social!.primaryId).toBe(id);expect(r.social!.people[1].status).toBe('married');expect(r.social!.people[0].status).toBe('divorced');assertRun(r);expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  });
  it('allows an NPC to refuse an infidelity attempt without manufacturing a secret relationship',()=>{
    let r=born('secret-refusal-0');
    for(let i=1;!(r.social!.people[0].romanticOpen&&r.social!.people[0].exclusivityOpen&&r.social!.people[0].marriageOpen&&r.social!.people[1].romanticOpen&&!r.social!.people[1].secretWilling);i++)r=born('secret-refusal-'+i);
    r=married(r);const id=r.social!.people[1].npcId;r=friendly(r,id);r=talk(r,'soc-temptation',id,'secret');
    expect(r.social!.secretId).toBeNull();expect(r.social!.breach).toBeNull();expect(r.lastOutcome).toContain('không chấp nhận');
  });
  it('requires time and willingness before reconciliation, and preserves the marriage date',()=>{
    let r=married();const month=r.social!.people[0].marriedMonth;
    r=talk(r,'soc-separate','friend','separate');r=talk(r,'soc-repair','friend','repair');expect(r.social!.people[0].status).toBe('separated');
    r=toAge(r,22);r=talk(r,'soc-listen','friend','listen');r=talk(r,'soc-repair','friend','repair');expect(r.social!.people[0].status).toBe('married');expect(r.social!.people[0].marriedMonth).toBe(month);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);assertRun(r);
  });
  it('has 22 distinct active scenes with four meaningful choices each', () => {
    expect(romanceEvents).toHaveLength(22);
    for (const e of romanceEvents) {
      expect(e.choices).toHaveLength(4);
      expect(new Set(e.choices.map((c) => JSON.stringify(c.effects))).size).toBe(4);
    }
  });
  it('keeps three interested NPCs independent and resumes the exact pending story', () => {
    let r = toAge(suitable(), 18);
    const pending = structuredClone(r.activeEvent);
    for (const p of r.social!.people) r = friendly(r, p.npcId);
    expect(r.social!.people.every((p) => p.interest !== 'none')).toBe(true);
    expect(r.activeEvent).toEqual(pending);
    const others = structuredClone(r.social!.people.slice(1));
    r = talk(r, 'soc-date', 'friend', 'date');
    expect(r.social!.people[0].status).toBe('dating');
    expect(r.social!.people.slice(1)).toEqual(others);
    expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    assertRun(r);
  });
  it('enforces adulthood, known NPCs, cooldown and stale actions inside the engine', () => {
    const r = advance(born());
    for (const id of ['friend', 'nonexistent'])
      expect(() =>
        requestSocial(r, {
          type: 'social',
          npcId: id,
          templateId: 'soc-date',
          expected: r.actions.length,
        }),
      ).toThrow();
    let a = toAge(suitable(), 18);
    const action = {
      type: 'social',
      npcId: 'friend',
      templateId: 'soc-meet',
      expected: a.actions.length,
    } as const;
    a = dispatch(a, action);
    expect(() => dispatch(a, action)).toThrow();
    const e = activeDefinition(a)!;
    a = choose(a, e.id, e.choices[0].id);
    expect(() => requestSocial(a, { ...action, expected: a.actions.length })).toThrow();
  });
  it('permits rejection regardless of high knowledge without modifying other NPCs', () => {
    let r = born('reject-0');
    for (let i = 1; r.social!.people[0].romanticOpen; i++) r = born('reject-' + i);
    r = toAge(r, 18);
    r = friendly(r, 'friend');
    const others = structuredClone(r.social!.people.slice(1));
    r = talk(r, 'soc-date', 'friend', 'date');
    expect(r.social!.people[0].status).not.toBe('dating');
    expect(r.social!.people.slice(1)).toEqual(others);
    expect(r.lastOutcome).toMatch(/từ chối|khoảng cách/);
  });
  it('makes marriage change the household without removing other candidates', () => {
    const r = married();
    expect(r.relationships.filter((x) => x.type === 'partner')).toHaveLength(1);
    expect(r.household.housing).toBe('rent');
    expect(r.social!.people).toHaveLength(3);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    assertRun(r);
  });
  it('treats admirers differently from breaches and preserves delayed discovery after secret contact ends', () => {
    let r = married();
    expect(r.social!.breach).toBeNull();
    const id = r.social!.people[1].npcId;
    r = friendly(r, id);
    r = talk(r, 'soc-temptation', id, 'secret');
    expect(r.social!.secretId).toBe(id);
    const due = r.social!.discoveryMonth!;
    r = talk(r, 'soc-secret', id, 'leave');
    expect(r.social!.secretId).toBeNull();
    expect(r.social!.discoveryMonth).toBe(due);
    r = toAge(r, 24);
    expect(r.social!.breach?.revealed).toBe(true);
    expect(r.social!.people[0].trust).toBeLessThan(65);
    expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
    assertRun(r);
  });
  it('retains former partners and permits separation, reconciliation conditions and divorce', () => {
    let r = married();
    r = talk(r, 'soc-separate', 'friend', 'separate');
    expect(r.social!.people[0].status).toBe('separated');
    r = talk(r, 'soc-divorce', 'friend', 'divorce');
    expect(r.social!.people[0].status).toBe('divorced');
    expect(r.social!.primaryId).toBeNull();
    expect(r.npcs.some((n) => n.id === 'friend')).toBe(true);
    expect(r.finance.transactions.some((t) => t.label.includes('ly hôn'))).toBe(true);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    assertRun(r);
  });
  it('keeps partner death scoped and preserves history and other NPCs', () => {
    const r = married();
    const others = structuredClone(r.social!.people.slice(1));
    r.npcs.find((n) => n.id === 'friend')!.alive = false;
    tickSocial(r);
    expect(r.social!.primaryId).toBeNull();
    expect(r.social!.people[0].status).toBe('widowed');
    expect(r.relationships.find((x) => x.npcId === 'friend')!.type).toBe('ex');
    expect(r.social!.people.slice(1)).toEqual(others);
    assertSocial(r);
  });
  it('rejects forged status, non-existent references and new actions in wardrobe-only lives', () => {
    const r = married();
    const save = snapshot(r);
    save.run.social!.people[1].status = 'married';
    expect(() => parseSave(JSON.stringify(save))).toThrow();
    const old = createRun('wardrobe-only', {
      expansion: 'wardrobe',
      cohort: 1995,
      region: 'northern-village',
    });
    expect(() =>
      requestSocial(old, { type: 'social', templateId: 'soc-meet', npcId: 'friend', expected: 0 }),
    ).toThrow();
    r.social!.primaryId = 'bad';
    expect(() => assertSocial(r)).toThrow();
    expect(canonical(snapshot(old).run)).not.toContain('social:linh');
  });
});
