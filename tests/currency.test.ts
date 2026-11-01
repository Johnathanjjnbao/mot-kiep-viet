import { describe, expect, it } from 'vitest';
import {
  createRun,
  advance,
  choose,
  activeDefinition,
  choiceReason,
  manage,
  dispatch,
  replay,
  eligible,
} from '../src/engine/engine';
import { designMoney, currencyOf, currencyText, formatMoney } from '../src/domain/currency';
import type { GameRun, RunSetup } from '../src/domain/model';
import { transact, settleMonth, mandatoryCost, netWorth } from '../src/engine/finance';
import { monthlyIncome, monthlyExpense, worldFor } from '../src/content/world';
import { studyCosts } from '../src/engine/academics';
import { assertRun } from '../src/engine/invariants';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
import { simulateLife } from '../src/diagnostics/simulation';
import { summaryCardSvg } from '../src/application/summary';
import { foundRetail, settleRetail, closeRetail, assertEnterprise } from '../src/engine/enterprise';
import { hashSeed } from '../src/engine/random';
import { admittedStudent } from '../scripts/academic-fixture';
import { healthyChoice } from '../scripts/annual-fixture';

const setup: RunSetup = {
  cohort: 1995,
  region: 'northern-village',
  wealth: 4,
  family: 'both',
  expansion: 'family',
  lifeRules: 'annual-v1',
};
const fresh = (currency?: RunSetup['currency']) =>
  createRun('currency-fixture', { ...setup, ...(currency ? { currency } : {}) });
// Deliberately isolated accounting fixture, not a canonical save.
function adult(currency: RunSetup['currency'] = 'vnd-v1'): GameRun {
  const r = fresh(currency);
  r.month = 216;
  r.status = 'playing';
  r.world = worldFor(2013);
  return r;
}
describe('immutable denomination and raw VND accounting', () => {
  it('defaults only missing fields to DSM and stores actual integer dong for opt-in lives', () => {
    const d = fresh(),
      v = fresh('vnd-v1');
    expect(d.setup).not.toHaveProperty('currency');
    expect(currencyOf(d)).toBe('dsm-v1');
    expect(v.finance.cash).toBe(d.finance.cash * 200_000);
    expect(v.finance.transactions[0].cash).toBe(120_000_000);
    expect(v.player.stats).toEqual(d.player.stats);
    expect(v.rng).toEqual(d.rng);
    expect(formatMoney(5_000_000, v)).toBe('5.000.000 ₫');
    expect(formatMoney(25, d)).toBe('25 đSM');
    expect(currencyText(v, 'Tuổi 18 · 36 đSM · +5 tay nghề')).toBe(
      'Tuổi 18 · 7.200.000 ₫ · +5 tay nghề',
    );
    expect(() => designMoney(v, Number.MAX_SAFE_INTEGER)).toThrow();
  });
  it('uses raw ledger inputs and applies one-dong interest without rescaling', () => {
    const r = adult();
    transact(r, 'raw-one', 'Một đồng', { cash: 1, savings: 667, debt: 1 });
    const before = r.finance.cash;
    r.month++;
    settleMonth(r);
    expect(r.finance.cash).toBe(before - monthlyExpense(r));
    expect(r.finance.savings).toBe(668);
    expect(r.finance.liability.principal).toBe(2);
    expect(() => settleMonth(r)).toThrow('already settled');
    expect(() => transact(r, 'raw-one', '', { cash: 1 })).toThrow('Duplicate');
  });
  it('withdraws savings and records exactly the mandatory deficit, without invented cash', () => {
    const r = adult();
    transact(r, 'empty', '', { cash: -r.finance.cash, savings: 7 });
    mandatoryCost(r, 'cost', '', 12);
    expect([r.finance.cash, r.finance.savings, r.finance.liability.principal]).toEqual([0, 0, 5]);
    expect(r.finance.transactions.slice(-3).map((t) => [t.cash, t.savings, t.debt])).toEqual([
      [7, -7, 0],
      [5, 0, 5],
      [-12, 0, 0],
    ]);
  });
  it('rejects overflow and fractional postings before any balance mutation', () => {
    const r = adult();
    const before = structuredClone(r.finance);
    expect(() => transact(r, 'overflow', '', { cash: Number.MAX_SAFE_INTEGER })).toThrow(
      'overflow',
    );
    expect(() => transact(r, 'fraction', '', { cash: 0.5 })).toThrow('Invalid');
    expect(r.finance).toEqual(before);
  });
  it('scales eligibility, savings, borrowing, repayment and housing once, conserving net worth', () => {
    let r = adult();
    expect(eligible(r, { minCash: 600 })).toBe(true);
    expect(eligible(r, { minCash: 601 })).toBe(false);
    r = manage(r, 'save-money');
    expect(r.finance.savings).toBe(10_000_000);
    r = manage(r, 'withdraw-money');
    r = manage(r, 'borrow');
    expect(r.finance.liability.principal).toBe(10_000_000);
    r = manage(r, 'repay');
    r = manage(r, 'buy-home');
    expect(r.finance.cash).toBe(0);
    expect(r.finance.assets[0].value).toBe(120_000_000);
    expect(netWorth(r)).toBe(120_000_000);
    expect(r.journal.some((j) => /đSM/.test(j.text))).toBe(false);
    expect(() => manage(r, 'save-money')).toThrow('10.000.000 ₫');
  });
  it('keeps salary and household multipliers while converting base amounts', () => {
    const d = adult('dsm-v1'),
      v = adult();
    for (const r of [d, v])
      r.player.careers.push({
        id: 'labor',
        startMonth: 216,
        endMonth: null,
        experience: 0,
        level: 0,
        incomeFactor: 1,
      });
    expect(monthlyIncome(v)).toBe(monthlyIncome(d) * 200_000);
    expect(monthlyExpense(v)).toBe(monthlyExpense(d) * 200_000);
    v.player.stats.skill = 60;
    v.player.stats.stress = 10;
    expect(monthlyIncome(v)).toBeGreaterThanOrEqual(4_000_000);
    expect(monthlyIncome(v)).toBeLessThanOrEqual(6_000_000);
  });
  it('computes tuition, scholarship and family support in the actual denomination', () => {
    const r = adult();
    r.player.stats.knowledge = 100;
    r.player.stats.stress = 0;
    const c = studyCosts(r, 'korean');
    expect(c.tuition).toBeGreaterThan(1_000_000);
    expect(c.scholarship).toBe(Math.round(c.tuition * 0.5));
    expect(c.support).toBe(Math.round(c.tuition * 0.2));
    expect(c.required).toBe(c.tuition - c.scholarship - c.support);
  });
  it('posts real annual tuition, scholarship, support and part-time earnings exactly once', () => {
    let r = admittedStudent('korean', 0, 'annual-v1', 'vnd-v1').run;
    const tuition = studyCosts(r, 'korean').tuition;
    const posts = r.finance.transactions.filter((t) => t.id.startsWith('academic:'));
    expect(posts.filter((t) => t.id.endsWith(':tuition'))).toHaveLength(1);
    expect(posts.find((t) => t.id.endsWith(':tuition'))!.cash).toBe(-tuition);
    for (let i = 0; i < 60 && !r.academics?.focus; i++)
      r = r.activeEvent ? choose(r, activeDefinition(r)!.id, healthyChoice(r).id) : advance(r);
    const e = activeDefinition(r)!;
    const before = r.actions.length;
    r = choose(r, e.id, 'work');
    expect(r.actions.length).toBe(before + 1);
    expect(
      r.finance.transactions.filter((t) => t.id.startsWith('academic:part-time:')).at(-1)!.cash,
    ).toBe(7_200_000);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    assertRun(r);
  });
  it('uses VND for clothing affordability, posting and stored wardrobe memories', () => {
    const r = adult();
    const bought = dispatch(r, {
      type: 'wardrobe',
      operation: 'buy',
      item: 'linen-shirt',
      expected: r.actions.length,
    });
    const tx = bought.finance.transactions.at(-1)!;
    expect(tx.cash).toBeLessThan(-200_000);
    expect(bought.lastOutcome).toContain(formatMoney(-tx.cash, r));
    expect(() =>
      dispatch(bought, {
        type: 'wardrobe',
        operation: 'buy',
        item: 'linen-shirt',
        expected: bought.actions.length,
      }),
    ).toThrow('đã có');
  });
  it('converts narrative and choice text without scaling age, stats or choice effect twice', () => {
    let r = advance(fresh('vnd-v1'));
    const event = activeDefinition(r)!;
    expect(JSON.stringify(event)).not.toContain('đSM');
    const c = event.choices.find((x) => !choiceReason(r, x))!;
    r = choose(r, event.id, c.id);
    expect(r.lastOutcome).not.toContain('đSM');
    assertRun(r);
    expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
  });
  it('rejects a changed denomination on an existing canonical save, preserving old saves', () => {
    const old = advance(fresh()),
      vnd = advance(fresh('vnd-v1'));
    expect(parseSave(JSON.stringify(snapshot(old))).run).toEqual(old);
    expect(parseSave(JSON.stringify(snapshot(vnd))).run).toEqual(vnd);
    const forged = snapshot(old);
    forged.run.setup.currency = 'vnd-v1';
    expect(() => parseSave(JSON.stringify(forged))).toThrow();
  });
  it('keeps isolated retail quantities unchanged while converting every financial posting', () => {
    let d = foundRetail(adult('dsm-v1'), 0, 300, 'clothing');
    let v = foundRetail(adult(), 0, 60_000_000, 'clothing');
    for (let i = 0; i < 24; i++) {
      d.run.month++;
      v.run.month++;
      d = settleRetail(d.run, d.enterprise);
      v = settleRetail(v.run, v.enterprise);
      assertEnterprise(v.run, v.enterprise);
      expect(v.enterprise.stock).toBe(d.enterprise.stock);
      expect(v.enterprise.reputation).toBe(d.enterprise.reputation);
      expect(v.enterprise.cash).toBe(d.enterprise.cash * 200_000);
      expect(v.enterprise.recent.at(-1)!.orders).toBe(d.enterprise.recent.at(-1)!.orders);
    }
    const closed = closeRetail(v.run, v.enterprise);
    expect(closed.run.finance.assets[0].value).toBe(0);
    expect(closed.enterprise.cash).toBe(0);
    expect(() => foundRetail(adult(), 0, 300, 'clothing')).toThrow('Invalid launch');
  });
  it('locks a separate VND full-life golden, canonical replay, import and summary card', () => {
    const r = simulateLife('golden-vnd-v1', { ...setup, currency: 'vnd-v1' }, 0);
    expect(r.status).toBe('ended');
    expect(r.actions.length).toBeLessThanOrEqual(512);
    expect(canonical(replay(r.seed, r.setup, r.actions))).toBe(canonical(r));
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    expect(summaryCardSvg(r)).toContain('₫');
    expect(summaryCardSvg(r)).not.toContain('đSM');
    expect(r.journal.some((j) => /đSM/.test(j.text))).toBe(false);
    // Independent VND golden; historical goldens remain unchanged.
    expect(hashSeed(JSON.stringify(r))).toBe(3126831863);
  });
});
