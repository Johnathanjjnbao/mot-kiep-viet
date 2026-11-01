import { describe, it, expect } from 'vitest';
import { createRun } from '../src/engine/engine';
import { worldFor } from '../src/content/world';
import {
  foundRetail,
  settleRetail,
  closeRetail,
  retailPolicy,
  fundRetail,
  assertEnterprise,
} from '../src/engine/enterprise';
import type { GameRun } from '../src/domain/model';

// Isolated ledger clock. This is NOT a canonical life/save fixture or production selector.
function ledgerFixture(seed = 'enterprise-ledger'): GameRun {
  const r = createRun(seed, {
    cohort: 1995,
    region: 'southern-city',
    wealth: 4,
    expansion: 'family',
    lifeRules: 'annual-v1',
  });
  r.month = 216;
  r.world = worldFor(2013);
  r.status = 'playing';
  return r;
}
function nextMonth(pair: ReturnType<typeof foundRetail>) {
  const run = structuredClone(pair.run);
  run.month++;
  return settleRetail(run, pair.enterprise);
}
function reconcile(pair: ReturnType<typeof foundRetail>) {
  assertEnterprise(pair.run, pair.enterprise);
  expect(pair.run.finance.cash).toBe(pair.run.finance.transactions.reduce((a, t) => a + t.cash, 0));
  expect(pair.run.finance.assets.reduce((a, t) => a + t.value, 0)).toBe(
    pair.run.finance.transactions.reduce((a, t) => a + t.assets, 0),
  );
  expect(new Set(pair.run.finance.transactions.map((t) => t.id)).size).toBe(
    pair.run.finance.transactions.length,
  );
}
describe('isolated enterprise accounting foundation; not enabled gameplay', () => {
  it.each(['budget', 'balanced', 'premium'] as const)(
    'allows positive months under %s pricing without guaranteeing them',
    (price) => {
      const profits = [];
      for (let i = 0; i < 40; i++) {
        let x = foundRetail(ledgerFixture('pricing-' + i), 0, 300, 'clothing');
        x = retailPolicy(x.run, x.enterprise, { price, marketing: false, reorderTarget: 20 });
        x = nextMonth(x);
        profits.push(x.enterprise.recent[0].profit);
      }
      expect(profits.some((p) => p > 0)).toBe(true);
      expect(profits.some((p) => p <= 0)).toBe(true);
    },
  );
  it('moves capital into an owned asset without income or input mutation', () => {
    const r = ledgerFixture(),
      before = structuredClone(r);
    const x = foundRetail(r, 0, 200, 'clothing');
    expect(r).toEqual(before);
    expect(x.run.finance.cash).toBe(r.finance.cash - 200);
    expect(x.enterprise.cash).toBe(200);
    expect(x.enterprise.totals.revenue).toBe(0);
    reconcile(x);
  });
  it('has integer COGS, finite purchased stock, refunds and separate cash flow/profit', () => {
    let losses = 0,
      returns = 0,
      profits = 0;
    for (let i = 0; i < 60; i++) {
      const x = nextMonth(foundRetail(ledgerFixture('demand-' + i), 0, 200, 'clothing'));
      const m = x.enterprise.recent[0];
      expect(m.bought).toBe(20);
      expect(m.cogs).toBe((m.orders - m.returned) * 3);
      expect(x.enterprise.stock).toBe(m.bought - m.orders + m.returned);
      expect(m.revenue).toBe((m.orders - m.returned) * 6);
      expect(m.profit).toBe(m.revenue - m.cogs - m.operating);
      expect(m.cashFlow).toBe(m.revenue - m.operating - m.bought * 3);
      expect(m.profit).not.toBe(m.cashFlow);
      losses += Number(m.profit < 0);
      returns += m.returned;
      profits += Number(m.profit > 0);
      reconcile(x);
    }
    expect(returns).toBeGreaterThan(0);
    expect(profits).toBeGreaterThan(0);
    expect(losses).toBeGreaterThan(0);
  });
  it('rejects insufficient player funding and all unsafe policies atomically', () => {
    const r = ledgerFixture();
    expect(() => foundRetail(r, 0, 10000, 'clothing')).toThrow();
    const x = foundRetail(r, 0, 200, 'clothing'),
      before = structuredClone(x);
    for (const reorderTarget of [-1, 0.5, 201, Infinity])
      expect(() =>
        retailPolicy(x.run, x.enterprise, { price: 'balanced', marketing: false, reorderTarget }),
      ).toThrow();
    expect(() => fundRetail(x.run, x.enterprise, 10000)).toThrow();
    expect(x).toEqual(before);
    expect(() => foundRetail(x.run, 0, 100, 'clothing')).toThrow();
  });
  it('suspends without borrowing or sales, resumes only with explicit funding, and preserves stock', () => {
    let x = foundRetail(ledgerFixture(), 0, 20, 'household');
    x = retailPolicy(x.run, x.enterprise, { price: 'premium', marketing: true, reorderTarget: 0 });
    x = nextMonth(x);
    x = nextMonth(x);
    x = nextMonth(x);
    expect(x.enterprise.status).toBe('suspended');
    const revenue = x.enterprise.totals.revenue;
    const debt = x.run.finance.liability.principal;
    x = nextMonth(x);
    expect(x.enterprise.totals.revenue).toBe(revenue);
    expect(x.run.finance.liability.principal).toBe(debt);
    x = fundRetail(x.run, x.enterprise, 100);
    expect(x.enterprise.status).toBe('operating');
    reconcile(x);
  });
  it('does not sell without stock and cannot double-settle, skip a month, or earn after closure', () => {
    let x = foundRetail(ledgerFixture(), 0, 200, 'handmade');
    x = retailPolicy(x.run, x.enterprise, {
      price: 'balanced',
      marketing: false,
      reorderTarget: 0,
    });
    x = nextMonth(x);
    expect(x.enterprise.recent[0].orders).toBe(0);
    expect(x.enterprise.recent[0].profit).toBe(-6);
    const before = structuredClone(x);
    expect(() => settleRetail(x.run, x.enterprise)).toThrow();
    const skipped = structuredClone(x.run);
    skipped.month += 2;
    expect(() => settleRetail(skipped, x.enterprise)).toThrow();
    expect(x).toEqual(before);
    x = closeRetail(x.run, x.enterprise);
    expect(() => nextMonth(x)).toThrow();
    expect(() => closeRetail(x.run, x.enterprise)).toThrow();
    reconcile(x);
  });
  it('liquidates at a loss, closes all resources and permits a new stable ID', () => {
    let x = foundRetail(ledgerFixture(), 0, 200, 'clothing');
    x = nextMonth(x);
    const stock = x.enterprise.stock;
    const cash = x.enterprise.cash;
    const closed = closeRetail(x.run, x.enterprise);
    expect(closed.enterprise.totals.writeOff).toBe(stock * 3 - Math.floor((stock * 3) / 2));
    expect(closed.enterprise.totals.withdrawn).toBe(cash + Math.floor((stock * 3) / 2));
    expect(closed.enterprise.stock).toBe(0);
    expect(closed.enterprise.cash).toBe(0);
    reconcile(closed);
    const restarted = foundRetail(closed.run, 1, 100, 'handmade');
    expect(restarted.enterprise.id).toBe('enterprise:1');
  });
  it('rejects forged stock, equity, ownership, reports and duplicate IDs', () => {
    const x = nextMonth(foundRetail(ledgerFixture(), 0, 200, 'clothing'));
    for (const patch of [
      { stock: -1 },
      { cash: 1000001 },
      { owner: 'other' },
      { unitCost: 99 },
      { totals: { ...x.enterprise.totals, revenue: 99999 } },
    ])
      expect(() => assertEnterprise(x.run, { ...x.enterprise, ...patch })).toThrow();
    expect(() =>
      assertEnterprise(x.run, {
        ...x.enterprise,
        recent: [{ ...x.enterprise.recent[0], returned: 999 }],
      }),
    ).toThrow();
  });
  it('keeps old business/freelance abstraction separate to prevent duplicate business salary', () => {
    const r = ledgerFixture();
    r.player.careers.push({
      id: 'business',
      startMonth: r.month,
      endMonth: null,
      experience: 0,
      level: 0,
      incomeFactor: 1,
    });
    expect(() => foundRetail(r, 0, 200, 'clothing')).toThrow('abstraction');
  });
  it('operates30 years from a fixed policy with bounded recent reports and deterministic reducer replay', () => {
    function play() {
      let x = foundRetail(ledgerFixture('thirty-years'), 0, 300, 'handmade');
      for (let m = 0; m < 360; m++) x = nextMonth(x);
      return x;
    }
    const a = play(),
      b = play();
    expect(a).toEqual(b);
    expect(a.enterprise.recent).toHaveLength(12);
    expect(a.enterprise.settledThrough).toBe(576);
    expect(a.run.actions).toHaveLength(0);
    // No monthly user command is needed. Real GameRun dispatch/persistence remains unimplemented.
    reconcile(a);
  });
});
