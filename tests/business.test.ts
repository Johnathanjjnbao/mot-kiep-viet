import { describe, it, expect } from 'vitest';
import type { GameRun } from '../src/domain/model';
import {
  createRun,
  advance,
  activeDefinition,
  choiceReason,
  dispatch,
  replay,
} from '../src/engine/engine';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
import { assertRun } from '../src/engine/invariants';
import { hasAnnualRules, hasAcademicRules, hasEmploymentRules } from '../src/domain/rules';
import { careerReason, currentCareer, ageOf } from '../src/content/world';
import { enterpriseEquity, enterpriseProfit } from '../src/engine/business';
import { hashSeed } from '../src/engine/random';
import { businessEvents } from '../src/content/business-events';
import { applyBusinessStory, businessSceneEligible } from '../src/engine/business';
import { admittedStudent } from '../scripts/academic-fixture';
import { currentStudy } from '../src/engine/academics';
import { discretionaryCount } from '../src/domain/rules';
import { lifeSummary } from '../src/application/summary';
import { familyStart, growFamily } from '../scripts/family-fixture';

import {
  businessSetup,
  defaultPolicy,
  businessAdult,
  found,
  businessStep,
} from '../scripts/business-fixture';
function checked(r: GameRun) {
  assertRun(r);
  expect(canonical(replay(r.seed, r.setup, r.actions))).toBe(canonical(r));
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
}
describe('authoritative enterprise-v1 GameRun', () => {
  it.each(['clothing', 'household', 'handmade'] as const)(
    'plays %s with real integer VND orders, costs and canonical reports',
    (category) => {
      const adult = businessAdult('category-' + category);
      let r = dispatch(adult, {
        type: 'enterprise',
        operation: 'found',
        category,
        capital: 20_000_000,
        policy: defaultPolicy,
        expected: adult.actions.length,
      });
      for (let i = 0; i < 40 && r.month < adult.month + 24; i++) r = businessStep(r);
      const e = r.enterprise!.ventures[0];
      expect(e.totals.revenue).toBeGreaterThan(0);
      expect(e.totals.operating).toBeGreaterThan(0);
      expect(e.recent.every((m) => Number.isSafeInteger(m.profit) && m.returned <= m.orders)).toBe(
        true,
      );
      expect(e.recent.some((m) => m.cogs > 0)).toBe(true);
      checked(r);
    },
  );
  it('inherits all annual, university and employment routes without stamping older lives', () => {
    const r = createRun('enterprise-init', businessSetup);
    expect([hasAnnualRules(r), hasAcademicRules(r), hasEmploymentRules(r)]).toEqual([
      true,
      true,
      true,
    ]);
    expect(r.academics).toBeDefined();
    expect(r.employment).toBeDefined();
    expect(r.enterprise).toEqual({ ventures: [], lastSceneMonth: -12 });
    const old = createRun('enterprise-init', { ...businessSetup, lifeRules: 'annual-v1' });
    expect(old.enterprise).toBeUndefined();
    expect(() => found(old)).toThrow('giữ luật kinh tế');
    checked(r);
    checked(old);
  });
  it('creates a real ledger asset via strict dispatch without changing the pending story or input', () => {
    const before = businessAdult(),
      original = canonical(before),
      r = found(before);
    expect(canonical(before)).toBe(original);
    expect(r.activeEvent).toEqual(before.activeEvent);
    expect(r.enterprise!.ventures).toHaveLength(1);
    const e = r.enterprise!.ventures[0];
    expect(e.owner).toBe(r.id);
    expect(e.cash).toBe(20_000_000);
    expect(e.stock).toBe(0);
    expect(r.finance.cash).toBe(before.finance.cash - 20_000_000);
    expect(r.finance.assets.find((a) => a.id === e.id)!.value).toBe(20_000_000);
    checked(r);
    expect(() =>
      dispatch(r, {
        type: 'enterprise',
        operation: 'fund',
        id: 'enterprise:0',
        amount: 1,
        expected: before.actions.length,
      }),
    ).toThrow('đã cũ');
  });
  it('rejects forged shapes, fractions, foreign IDs, unaffordable capital and double taps atomically', () => {
    const r = businessAdult(),
      before = canonical(r);
    for (const extra of [
      { owner: 'other' },
      { capital: 0.5 },
      { capital: Number.MAX_SAFE_INTEGER },
      { id: 'enterprise:0' },
      { policy: { ...defaultPolicy, injected: 1 } },
    ]) {
      const a = {
        type: 'enterprise',
        operation: 'found',
        category: 'clothing',
        capital: 20_000_000,
        policy: defaultPolicy,
        expected: r.actions.length,
        ...extra,
      };
      expect(() => dispatch(r, a as never)).toThrow();
      expect(canonical(r)).toBe(before);
    }
    const next = found(r),
      book = next.enterprise!.ventures[0];
    expect(() =>
      dispatch(next, {
        type: 'enterprise',
        operation: 'close',
        id: 'enterprise:3',
        expected: next.actions.length,
      }),
    ).toThrow();
    const tampered = snapshot(next);
    tampered.run.enterprise!.ventures[0].owner = 'foreign';
    expect(() => parseSave(JSON.stringify(tampered))).toThrow();
    const tx = next.finance.transactions.filter((t) => t.id === `${book.id}:found`);
    expect(tx).toHaveLength(1);
  });
  it('settles every elapsed business month once through ordinary annual gameplay and canonical replay', () => {
    let r = found(businessAdult());
    const start = r.month;
    for (let i = 0; i < 50 && r.month < start + 120; i++) r = businessStep(r);
    const e = r.enterprise!.ventures[0];
    expect(e.settledThrough).toBe(r.month);
    expect(r.month).toBeGreaterThanOrEqual(start + 120);
    expect(e.recent).toHaveLength(12);
    expect(e.recent.every((x) => x.returned <= x.orders)).toBe(true);
    const posts = r.finance.transactions.filter((t) => t.id.startsWith(e.id + ':month:'));
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.length).toBeLessThanOrEqual(r.month - start);
    expect(new Set(posts.map((t) => t.month)).size).toBe(posts.length);
    for (const month of e.recent.filter((m) => m.operating > 0))
      expect(posts.find((t) => t.month === month.month)?.assets).toBe(month.profit);
    expect(e.totals.revenue).toBeGreaterThan(0);
    expect(enterpriseEquity(e)).toBe(
      e.totals.contributed - e.totals.withdrawn + enterpriseProfit(e),
    );
    checked(r);
    const forged = snapshot(r);
    forged.run.enterprise!.ventures[0].stock++;
    expect(() => parseSave(JSON.stringify(forged))).toThrow();
  });
  it('suspends without costs, resumes with funds, and keeps personal withdrawals distinct from expenses', () => {
    let r = found(businessAdult());
    r = dispatch(r, {
      type: 'enterprise',
      operation: 'suspend',
      id: 'enterprise:0',
      expected: r.actions.length,
    });
    for (let i = 0; i < 10 && r.month < 240; i++) r = businessStep(r);
    expect(r.enterprise!.ventures[0].cash).toBe(20_000_000);
    expect(r.enterprise!.ventures[0].recent.every((m) => m.operating === 0 && m.orders === 0)).toBe(
      true,
    );
    // Management during a dedicated dialogue is protected; finish it first.
    while (r.activeEvent?.id.startsWith('biz-')) r = businessStep(r);
    r = dispatch(r, {
      type: 'enterprise',
      operation: 'resume',
      id: 'enterprise:0',
      expected: r.actions.length,
    });
    const cash = r.finance.cash;
    r = dispatch(r, {
      type: 'enterprise',
      operation: 'withdraw',
      id: 'enterprise:0',
      amount: 5_000_000,
      expected: r.actions.length,
    });
    expect(r.finance.cash).toBe(cash + 5_000_000);
    expect(r.enterprise!.ventures[0].cash).toBe(15_000_000);
    expect(r.enterprise!.ventures[0].totals.operating).toBe(0);
    checked(r);
  });
  it('blocks incompatible salary abstractions in both directions and preserves closed IDs', () => {
    let r = found(businessAdult());
    expect(careerReason(r, 'business')).toContain('sổ riêng');
    expect(careerReason(r, 'freelance')).toContain('sổ riêng');
    r = dispatch(r, {
      type: 'enterprise',
      operation: 'close',
      id: 'enterprise:0',
      expected: r.actions.length,
    });
    expect(r.enterprise!.ventures[0].status).toBe('closed');
    expect(r.finance.assets.find((a) => a.id === 'enterprise:0')!.value).toBe(0);
    r = found(r);
    expect(r.enterprise!.ventures[1].id).toBe('enterprise:1');
    checked(r);
  });
  it('liquidates active enterprises at a real terminal ending, keeps equity history, and never ticks again', () => {
    let r = found(businessAdult('business-estate'));
    for (let i = 0; i < 500 && r.status !== 'ended'; i++) r = businessStep(r);
    expect(r.status).toBe('ended');
    expect(ageOf(r)).toBeGreaterThan(82);
    expect(
      r.enterprise!.ventures.every((e) => e.status === 'closed' && e.stock === 0 && e.cash === 0),
    ).toBe(true);
    expect(currentCareer(r)).toBeUndefined();
    expect(r.journal.some((j) => j.title === 'Khép sổ cửa hàng')).toBe(true);
    checked(r);
    expect(() => advance(r)).toThrow();
  });
  it('locks an independent new golden without rewriting any released golden', () => {
    const r = found(businessAdult('golden-enterprise-v1'));
    expect(hashSeed(JSON.stringify(r))).toBe(2481017761);
  });
  it('locks a full-life enterprise golden independently of its opening checkpoint', () => {
    let r = found(businessAdult('golden-enterprise-full-v1'));
    for (let i = 0; i < 500 && r.status !== 'ended'; i++) r = businessStep(r);
    expect(r.status).toBe('ended');
    expect(hashSeed(JSON.stringify(r))).toBe(548030889);
    checked(r);
  });
  it('keeps an ordinary salary, marriage and recorded children alongside a real shop', () => {
    let r = familyStart('enterprise-v1', 'vnd-v1');
    r = found(r, 4_000_000);
    r = growFamily(r, 32);
    expect(r.family!.children.length).toBeGreaterThan(0);
    expect(r.player.careers.some((c) => !['business', 'freelance'].includes(c.id))).toBe(true);
    expect(r.finance.transactions.some((t) => t.id.startsWith('enterprise:0:month:'))).toBe(true);
    expect(r.enterprise!.ventures[0].settledThrough).toBe(r.month);
    expect(r.actions.length).toBeLessThanOrEqual(512);
    checked(r);
  });
  it('keeps the pending university assessment valid while a student starts a side shop', () => {
    let r = admittedStudent('korean', 0, 'enterprise-v1', 'vnd-v1').run;
    for (let i = 0; i < 40 && !r.academics?.focus; i++) r = businessStep(r);
    expect(r.academics?.focus).toBeDefined();
    const before = r,
      event = activeDefinition(r)!;
    r = found(r);
    expect(r.academics?.focus).toEqual(before.academics?.focus);
    expect(activeDefinition(r)!.id).toBe(event.id);
    expect(event.choices.filter((c) => !choiceReason(r, c)).length).toBeGreaterThanOrEqual(4);
    const target = r.month + 48;
    for (let i = 0; i < 90 && r.month < target; i++) r = businessStep(r);
    expect(r.academics!.studies[0].completedYears).toBeGreaterThan(0);
    expect(currentStudy(r)?.status ?? r.academics!.studies[0].status).toBeTruthy();
    expect(r.enterprise!.ventures[0].settledThrough).toBe(r.month);
    checked(r);
  });
  it('rejects starting a shop while the same abstract business already pays a salary', () => {
    let r = businessAdult();
    // Finish the education direction, then use an ordinary authoritative job action.
    r = businessStep(r);
    for (let i = 0; i < 80 && careerReason(r, 'business'); i++) r = businessStep(r);
    expect(careerReason(r, 'business')).toBeNull();
    r = dispatch(r, { type: 'manage', action: 'apply-job', career: 'business' });
    expect(currentCareer(r)?.id).toBe('business');
    expect(() => found(r)).toThrow();
    checked(r);
  });
  it('has twelve contextual scenes with four distinct real outcomes, and no scenes for old runs', () => {
    const r = found(businessAdult());
    expect(businessEvents).toHaveLength(12);
    for (const scene of businessEvents) {
      expect(scene.choices).toHaveLength(4);
      const results = scene.choices.map((c) => {
        expect(choiceReason(r, c)).toBeNull();
        const next = structuredClone(r);
        const effect = c.effects.find((x) => x.kind === 'enterprise')!;
        if (effect.kind !== 'enterprise') throw Error('Missing outcome');
        applyBusinessStory(next, effect.operation);
        assertRun(next);
        return canonical(next);
      });
      expect(new Set(results).size).toBe(4);
      expect(
        businessSceneEligible(
          createRun('old', { ...businessSetup, lifeRules: 'annual-v1' }),
          scene.id,
        ),
      ).toBe(false);
    }
  });
  it('exhausts the shared 120 optional actions without blocking story progression or raising 512', () => {
    let r = found(businessAdult());
    while (discretionaryCount(r) < 120) {
      const p = r.enterprise!.ventures[0].policy;
      r = dispatch(r, {
        type: 'enterprise',
        operation: 'policy',
        id: 'enterprise:0',
        policy: { ...p, price: p.price === 'premium' ? 'balanced' : 'premium' },
        expected: r.actions.length,
      });
    }
    expect(() =>
      dispatch(r, {
        type: 'enterprise',
        operation: 'close',
        id: 'enterprise:0',
        expected: r.actions.length,
      }),
    ).toThrow('lượt');
    const before = r.month;
    for (let i = 0; i < 500 && r.status !== 'ended'; i++) r = businessStep(r);
    expect(r.status).toBe('ended');
    expect(r.month).toBeGreaterThan(before + 360);
    expect(r.actions.length).toBeLessThanOrEqual(512);
    expect(discretionaryCount(r)).toBe(120);
    expect(Buffer.byteLength(JSON.stringify(snapshot(r)))).toBeLessThan(5 * 1024 * 1024);
    checked(r);
  });
  it('runs four distinct ledgers for 30 years and through age 100+ with natural estate settlement', () => {
    let r = businessAdult('business-long-lived');
    for (let i = 0; i < 4; i++) r = found(r, 4_000_000);
    expect(() => found(r, 4_000_000)).toThrow('bốn');
    const start = r.month;
    let thirty: GameRun | undefined;
    for (let i = 0; i < 500 && r.status !== 'ended'; i++) {
      r = businessStep(r);
      if (!thirty && r.month >= start + 360) thirty = r;
    }
    expect(thirty).toBeDefined();
    expect(ageOf(r)).toBeGreaterThanOrEqual(100);
    expect(new Set(r.enterprise!.ventures.map((e) => e.id)).size).toBe(4);
    expect(r.enterprise!.ventures.every((e) => e.status === 'closed')).toBe(true);
    expect(r.actions.length).toBeLessThan(512);
    expect(lifeSummary(r).biography).toContain('Tự mở tiệm:');
    checked(thirty!);
    checked(r);
  });
});
