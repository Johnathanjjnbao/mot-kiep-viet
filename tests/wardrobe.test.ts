import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CLOTHING, presentationScore } from '../src/content/clothing';
import {
  activeDefinition,
  advance,
  choiceReason,
  choose,
  createRun,
  dispatch,
  replay,
} from '../src/engine/engine';
import { assertRun } from '../src/engine/invariants';
import { snapshot, parseSave, canonical } from '../src/persistence/saves';
import * as v2 from '../src/legacy/v2/engine/engine';
import { snapshot as v2Snapshot } from '../src/legacy/v2/persistence/saves';
import type { GameRun, WardrobeAction } from '../src/domain/model';
import { Avatar } from '../src/ui/Avatar';
import { simulateLife } from '../src/diagnostics/simulation';
import { hashSeed } from '../src/engine/random';
function adult() {
  let r = createRun('wardrobe-adult', {
    cohort: 1995,
    region: 'northern-village',
    wealth: 4,
    family: 'both',
  });
  for (let i = 0; i < 40 && r.month < 216; i++)
    r = r.activeEvent
      ? choose(
          r,
          r.activeEvent.id,
          activeDefinition(r)!.choices.find((c) => !choiceReason(r, c))!.id,
        )
      : advance(r);
  return r;
}
function action(r: GameRun, operation: WardrobeAction['operation'], item: string) {
  return dispatch(r, { type: 'wardrobe', operation, item, expected: r.actions.length });
}
describe('versioned wardrobe', () => {
  it('locks the wardrobe ruleset separately so later social/family rules cannot rewrite it', () => {
    const run = simulateLife('golden-v02', { expansion:'wardrobe', cohort:2026, region:'central-coast', name:'Ánh Nguyệt', birthplace:'Xóm Cát', wealth:1, family:'with-mother', motherTraits:['academic'], fatherTraits:['distant'] }, 2);
    expect(hashSeed(JSON.stringify(run))).toBe(1173022751);
    expect(parseSave(JSON.stringify(snapshot(run))).run).toEqual(run);
  });
  it('ships 28 distinct items with real cuts, categories and a free default outfit', () => {
    expect(CLOTHING).toHaveLength(28);
    expect(new Set(CLOTHING.map((i) => i.shape)).size).toBeGreaterThanOrEqual(12);
    expect(new Set(CLOTHING.map((i) => i.id)).size).toBe(CLOTHING.length);
    expect(createRun('no-money').wardrobe?.owned).toEqual([
      'plain-top',
      'plain-bottom',
      'canvas-shoes',
    ]);
  });
  it('pays once through the ledger, survives replay/reload, and retains both owned and equipped state', () => {
    let r = adult();
    const cash = r.finance.cash,
      before = structuredClone(r);
    r = action(r, 'buy', 'linen-shirt');
    expect(r.finance.cash).toBe(cash - 24);
    expect(r.finance.transactions.filter((t) => t.id === 'wardrobe:buy:linen-shirt')).toHaveLength(
      1,
    );
    expect(() => action(r, 'buy', 'linen-shirt')).toThrow(/đã có/);
    expect(before.finance.cash).toBe(cash);
    r = action(r, 'equip', 'linen-shirt');
    r = action(r, 'save-outfit', 'Ngày đi gặp');
    r = action(r, 'unequip', 'top');
    r = action(r, 'wear-outfit', 'outfit:0');
    expect(r.wardrobe!.equipped.top).toBe('linen-shirt');
    expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    assertRun(r);
  });
  it('rejects stale rapid input, unowned equipment, unaffordable and underage purchases', () => {
    const r = adult(),
      stale = {
        type: 'wardrobe',
        operation: 'buy',
        item: 'indigo-tee',
        expected: r.actions.length,
      } as const;
    const next = dispatch(r, stale);
    expect(() => dispatch(next, stale)).toThrow(/đã cũ/);
    expect(() => action(r, 'equip', 'silk-aodai')).toThrow(/chưa sở hữu/);
    const infant = advance(createRun('baby-wardrobe'));
    expect(() => action(infant, 'buy', 'silk-aodai')).toThrow(/tuổi/);
    const poor = structuredClone(r);
    poor.finance.cash = 0;
    expect(() => action(poor, 'buy', 'silk-aodai')).toThrow(/đủ/);
    expect(poor.finance.cash).toBe(0);
    expect(() => action(r, 'wear-outfit', 'missing')).toThrow();
  });
  it('rejects forged ownership or outfit grants when importing a snapshot', () => {
    const save = snapshot(adult());
    save.run.wardrobe!.owned.push('silk-aodai');
    expect(() => parseSave(JSON.stringify(save))).toThrow(/khớp|tái hiện/);
    expect(() => assertRun(save.run)).toThrow(/purchase/);
  });
  it('uses contextual presentation without universal expensive-item attraction bonuses', () => {
    const r = adult();
    const formal = {
      ...r,
      wardrobe: {
        ...r.wardrobe!,
        equipped: { top: 'white-shirt', outer: 'formal-vest', shoes: 'leather-shoes' },
      },
    };
    const sport = {
      ...r,
      wardrobe: {
        ...r.wardrobe!,
        equipped: { top: 'sport-top', bottom: 'sport-pants', shoes: 'running-shoes' },
      },
    };
    expect(presentationScore(formal, 'interview')).toBeGreaterThan(
      presentationScore(sport, 'interview'),
    );
    expect(presentationScore(formal, 'exercise')).toBeLessThan(
      presentationScore(sport, 'exercise'),
    );
    expect(presentationScore(formal, 'thrifty')).toBeLessThan(presentationScore(r, 'thrifty'));
    expect(formal.player.stats.knowledge).toBe(r.player.stats.knowledge);
  });
  it('renders actual clothing layers, varied cuts and accessories without changing identity', () => {
    const r = adult(),
      base = renderToStaticMarkup(createElement(Avatar, { run: r }));
    const appearances = ['floral-dress', 'silk-aodai', 'sport-top', 'white-shirt'].map((top) =>
      renderToStaticMarkup(
        createElement(Avatar, {
          run: {
            ...r,
            wardrobe: {
              ...r.wardrobe!,
              equipped: {
                top,
                outer: 'formal-vest',
                hair: 'hair-ribbon',
                accessory: 'round-glasses',
              },
            },
          },
        }),
      ),
    );
    expect(new Set(appearances).size).toBe(4);
    for (const markup of appearances) {
      expect(markup).toContain('data-layer="outerwear"');
      expect(markup).toContain('data-layer="hair-accessory"');
      expect(markup.match(/data-avatar="([^"]+)/)?.[1]).toBe(
        base.match(/data-avatar="([^"]+)/)?.[1],
      );
    }
  });
  it('keeps v2 active saves continuable under frozen rules, preserving schema and exact old state', () => {
    let old = v2.advance(v2.createRun('v2-compat'));
    const loaded = parseSave(JSON.stringify(v2Snapshot(old)));
    expect(snapshot(loaded.run).schemaVersion).toBe(3);
    const e = v2.activeDefinition(old)!;
    const c = e.choices.find((c) => !v2.choiceReason(old, c))!;
    const current = dispatch(loaded.run, { type: 'choose', eventId: e.id, choiceId: c.id });
    old = v2.choose(old, e.id, c.id);
    expect(canonical(current)).toBe(canonical(old));
    expect(replay(current.seed, current.setup, current.actions)).toEqual(old);
    expect(current.wardrobe).toBeUndefined();
  });
});
