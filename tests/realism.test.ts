import { describe, it, expect } from 'vitest';
import { createRun, dispatch, activeDefinition, choiceReason, replay } from '../src/engine/engine';
import { assertRun } from '../src/engine/invariants';
import { decisionActor, applyChildMoney } from '../src/engine/childhood';
import { FAMILIES } from '../src/domain/creator';
import type { GameRun, RunSetup } from '../src/domain/model';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
import { realismEvents } from '../src/content/realism-events';
import { EVENTS } from '../src/content/events';
import { validateContent } from '../src/content/validation';
import { creatorStep } from '../scripts/creator-economy-fixture';
import { hashSeed } from '../src/engine/random';
import { contextualChildhood } from '../src/engine/childhood';

function start(seed = 'realism-canonical', extra: Partial<RunSetup> = {}) {
  return createRun(seed, {
    cohort: 2005,
    region: 'northern-village',
    wealth: 4,
    family: 'both',
    lifeRules: 'realism-v1',
    currency: 'vnd-v1',
    expansion: 'family',
    ...extra,
  });
}
function step(r: GameRun) {
  const e = activeDefinition(r);
  if (!e) return dispatch(r, { type: 'advance' });
  const available = e.choices.filter((c) => !choiceReason(r, c));
  expect(available.length).toBeGreaterThanOrEqual(4);
  const c =
    available.find((c) =>
      c.effects.some((f) => f.kind === 'stat' && f.stat === 'health' && f.amount > 0),
    ) ?? available[0];
  return dispatch(r, { type: 'choose', eventId: e.id, choiceId: c.id });
}
function until(r: GameRun, month: number) {
  for (let i = 0; i < 500 && r.status !== 'ended' && r.month < month; i++) {
    r = step(r);
    assertRun(r);
  }
  expect(r.month).toBeGreaterThanOrEqual(month);
  return r;
}
function checked(r: GameRun) {
  assertRun(r);
  expect(canonical(replay(r.seed, r.setup, r.actions))).toBe(canonical(r));
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
}
describe('immutable realism childhood', () => {
  it('offers four honest fallback paths after a real child has put all cash aside', () => {
    let r = until(start(), 72);
    r = dispatch(r, {
      type: 'minor-finance',
      operation: 'save',
      amount: r.finance.cash,
      expected: r.actions.length,
    });
    expect(r.finance.cash).toBe(0);
    const e = contextualChildhood(
      r,
      realismEvents.find((e) => e.id === 'realism-first-pocket'),
    )!;
    expect(e.choices).toHaveLength(4);
    expect(e.choices[0].text).toContain('Lập kế hoạch');
    expect(e.choices[1].text).toContain('chờ có đủ tiền');
    expect(e.choices[1].outcome).toContain('Không nhận món đồ');
    expect(
      e.choices
        .slice(0, 2)
        .flatMap((c) => c.effects)
        .some((f) => f.kind === 'child-money'),
    ).toBe(false);
    checked(r);
    const futureGift = contextualChildhood(
      r,
      realismEvents.find((e) => e.id === 'realism-birthday-fund'),
    )!;
    expect(futureGift.choices[0].effects.filter((f) => f.kind === 'child-money')).toHaveLength(2);
    const poor = start('no-household-surplus', { wealth: 0 });
    for (let i = 0; i < 3; i++) applyChildMoney(poor, 'household-cost', 10, 'care-' + i);
    expect(poor.childhoodFinance!.cash).toBe(0);
    assertRun(poor);
    const gift = contextualChildhood(
      poor,
      realismEvents.find((e) => e.id === 'realism-first-gift'),
    )!;
    expect(gift.choices[0].text).toContain('Giữ lời chúc');
    expect(gift.choices[1].text).toContain('Dùng đồ sẵn có');
    expect(
      gift.choices
        .slice(0, 2)
        .flatMap((c) => c.effects)
        .some((f) => f.kind === 'child-money'),
    ).toBe(false);
  });
  it('locks new opening/full-life goldens independently of the14 historical fixtures', () => {
    let r = start();
    expect(hashSeed(JSON.stringify(r))).toBe(1290334862);
    for (let i = 0; i < 512 && r.status !== 'ended'; i++) r = creatorStep(r);
    expect(r.status).toBe('ended');
    expect(hashSeed(JSON.stringify(r))).toBe(387617215);
    checked(r);
  });
  it('carries a childhood reading routine into later choices without changing the authored template', () => {
    const r = start(),
      template = realismEvents.find((e) => e.id === 'realism-reading-line')!;
    expect(contextualChildhood(r, template)).toBe(template);
    r.flags['realism-reading-routine'] = true;
    const later = contextualChildhood(r, template)!;
    expect(later.text).toContain('Những giờ xem sách');
    expect(later.choices[0].effects.length).toBe(template.choices[0].effects.length + 1);
    expect(template.text).not.toContain('Những giờ xem sách');
  });
  it('authors45 age-specific scenes/180 available paths and rejects adult or scheduled minor effects', () => {
    expect(realismEvents).toHaveLength(45);
    expect(new Set(realismEvents.map((e) => e.title)).size).toBe(45);
    expect(realismEvents.reduce((n, e) => n + e.choices.length, 0)).toBe(180);
    expect(validateContent().errors).toEqual([]);
    const bad = structuredClone(EVENTS);
    const e = bad.find((e) => e.version === 12)!;
    e.choices[0].effects.push({
      kind: 'schedule',
      afterMonths: 1,
      label: 'bad',
      effects: [{ kind: 'cash', amount: -1, label: 'adult' }],
    });
    expect(validateContent(bad).errors.some((e) => e.startsWith('Minor effect'))).toBe(true);
  });
  it.each(Object.keys(FAMILIES))(
    'keeps baby money and actual caregivers separate: %s',
    (family) => {
      for (const wealth of [0, 4] as const) {
        let r = start('realism-family-' + family + wealth, {
          family: family as RunSetup['family'],
          wealth,
        });
        expect(r.finance.cash).toBe(0);
        expect(r.finance.savings).toBe(0);
        expect(r.finance.liability.principal).toBe(0);
        expect(r.childhoodFinance!.cash).toBeGreaterThan(0);
        r = step(r);
        expect(activeDefinition(r)!.version).toBe(12);
        const actor = decisionActor(r, activeDefinition(r));
        expect(actor.kind).toBe('caregiver');
        if (family === 'mother-only' || family === 'with-mother') {
          expect(actor.label).toContain('Mẹ');
          expect(actor.label).not.toContain('Cha');
        }
        if (family === 'father-only' || family === 'with-father') {
          expect(actor.label).toContain('Cha');
          expect(actor.label).not.toContain('Mẹ');
        }
        r = until(r, 36);
        expect(r.finance.cash).toBe(0);
        expect(r.finance.liability.principal).toBe(0);
        checked(r);
      }
    },
  );
  it('records equal household debits and child-owned credits; gifts held without disposable baby cash', () => {
    const r = start();
    const combined = r.childhoodFinance!.cash + r.finance.cash + r.finance.savings;
    applyChildMoney(r, 'gift', 1, 'test-gift');
    expect(r.finance.cash).toBe(0);
    expect(r.finance.savings).toBe(200_000);
    expect(r.childhoodFinance!.cash + r.finance.cash + r.finance.savings).toBe(combined);
    assertRun(r);
    expect(() => applyChildMoney(r, 'earn', 1, 'early-earn')).toThrow();
    expect(() => applyChildMoney(r, 'spend', 1, 'early-spend')).toThrow();
    const forged = structuredClone(r);
    forged.childhoodFinance!.transactions[1].personal++;
    expect(() => assertRun(forged)).toThrow(/reconciliation/);
  });
  it('replays pocket money from6, bounded saving/spending, teen earnings and adulthood without a household windfall', () => {
    let r = until(start(), 72);
    expect(r.finance.cash).toBeGreaterThan(0);
    expect(decisionActor(r, activeDefinition(r)).kind).toBe('child');
    const first = r,
      money = r.finance.cash + r.finance.savings;
    r = dispatch(r, {
      type: 'minor-finance',
      operation: 'save',
      amount: 1,
      expected: r.actions.length,
    });
    expect(r.finance.cash + r.finance.savings).toBe(money);
    expect(first.finance.cash).toBe(r.finance.cash + 1);
    expect(() =>
      dispatch(r, {
        type: 'minor-finance',
        operation: 'spend',
        amount: 1,
        expected: first.actions.length,
      }),
    ).toThrow(/cũ/);
    expect(() =>
      dispatch(r, {
        type: 'minor-finance',
        operation: 'spend',
        amount: 9_000_000,
        expected: r.actions.length,
      }),
    ).toThrow();
    checked(r);
    r = until(r, 156);
    const teen = structuredClone(r),
      cash = teen.finance.cash;
    applyChildMoney(teen, 'earn', 1, 'teen');
    expect(teen.finance.cash).toBe(cash + 200_000);
    assertRun(teen);
    r = until(r, 204);
    const household = r.childhoodFinance!.cash,
      owned = r.finance.cash + r.finance.savings;
    r = until(r, 216);
    expect(r.childhoodFinance!.adultAccess).toBe(true);
    expect(r.finance.cash + r.finance.savings - owned).toBeLessThan(household);
    expect(
      r.finance.transactions.some((t) => t.month === 216 && t.id.startsWith('household:transfer:')),
    ).toBe(false);
    expect(() =>
      dispatch(r, {
        type: 'minor-finance',
        operation: 'save',
        amount: 1,
        expected: r.actions.length,
      }),
    ).toThrow();
    checked(r);
    r = until(r, 1200);
    checked(r);
    expect(r.actions.length).toBeLessThanOrEqual(512);
    expect(JSON.stringify(snapshot(r)).length).toBeLessThan(5 * 1024 * 1024);
  }, 120_000);
  it('persists seeded presentation and rejects adding it to historical rules', () => {
    const a = start('same');
    expect(a.setup.presentation).toMatch(/boy|girl/);
    expect(start('same').setup).toEqual(a.setup);
    expect(start('same', { presentation: 'girl' }).setup.presentation).toBe('girl');
    expect(() => start('same', { lifeRules: 'creator-v1', presentation: 'girl' })).toThrow();
    checked(a);
  });
});
