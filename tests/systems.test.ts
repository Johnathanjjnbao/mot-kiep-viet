import { describe, expect, it } from 'vitest';
import { EVENTS } from '../src/content/events';
import { validateContent } from '../src/content/validation';
import {
  CAREERS,
  ageOf,
  careerReason,
  currentCareer,
  monthlyIncome,
  worldFor,
} from '../src/content/world';
import {
  activeDefinition,
  advance,
  choiceReason,
  choose,
  createRun,
  eligible,
  manage,
} from '../src/engine/engine';
import { assertRun } from '../src/engine/invariants';
import { mandatoryCost, netWorth, settleMonth, transact } from '../src/engine/finance';
import type { GameRun } from '../src/domain/model';
export function adult(seed = 'adult'): GameRun {
  let run = createRun(seed, { cohort: 1995, region: 'southern-city', wealth: 2, family: 'both' });
  while (ageOf(run) < 18 || run.activeEvent) {
    if (run.activeEvent) {
      const e = activeDefinition(run)!;
      run = choose(
        run,
        e.id,
        (e.id === 'education-path'
          ? e.choices.find((c) => c.id === 'work')!
          : e.choices.filter((c) => !choiceReason(run, c)).at(-1)!
        ).id,
      );
    } else run = advance(run);
  }
  return run;
}
describe('authored content and eligibility', () => {
  it('validates the released115 plus23 versioned templates and retains7 arcs', () => {
    expect(validateContent(EVENTS.filter((e) => e.version !== 6))).toMatchObject({
      total: 115,
      arcs: 7,
      errors: [],
    });
    expect(validateContent()).toMatchObject({ total: 138, arcs: 7, errors: [] });
  });
  it('detects duplicate IDs and broken references', () => {
    const events = structuredClone(EVENTS);
    events[0].id = events[1].id;
    events[0].condition.flags = ['missing-flag'];
    expect(validateContent(events).errors.join()).toMatch(/Duplicate/);
    expect(validateContent(events).errors.join()).toMatch(/Unresolved/);
  });
  it('respects technology, cohort, family, and employment prerequisites', () => {
    const run = adult();
    expect(eligible(run, { job: 'employed' })).toBe(false);
    expect(eligible(run, { partner: true })).toBe(false);
    expect(eligible(run, { npc: 'adult-child' })).toBe(false);
    run.world = worldFor(1980);
    expect(eligible(run, { minYear: 2010, technology: 'smartphone' })).toBe(false);
    expect(careerReason(run, 'tech')).not.toBeNull();
    expect(CAREERS).toHaveLength(10);
  });
});
describe('financial consistency and player agency', () => {
  it('enforces amount validation, insufficient funds, and unique transaction IDs', () => {
    const run = createRun('ledger');
    expect(() => transact(run, 'bad', 'bad', { cash: NaN })).toThrow();
    expect(() => transact(run, 'bad', 'bad', { cash: -100000 })).toThrow();
    expect(() => transact(run, 'opening', 'again', { cash: 10 })).toThrow();
    assertRun(run);
  });
  it('records emergency credit and savings withdrawals with their costs', () => {
    const run = createRun('shortfall');
    const amount = run.finance.cash + 50;
    mandatoryCost(run, 'cost', 'Mandatory expense', amount);
    expect(run.finance.cash).toBe(0);
    expect(run.finance.liability.principal).toBe(50);
    expect(netWorth(run)).toBe(-50);
    assertRun(run);
  });
  it('savings transfers and loan repayments reconcile without creating wealth', () => {
    let run = adult();
    const before = netWorth(run);
    run = manage(run, 'save-money');
    expect(netWorth(run)).toBe(before);
    run = manage(run, 'withdraw-money');
    run = manage(run, 'borrow');
    expect(netWorth(run)).toBe(before);
    run = manage(run, 'repay');
    expect(netWorth(run)).toBe(before);
    assertRun(run);
  });
  it('income changes with employment and career history stays consistent', () => {
    let run = adult();
    const old = structuredClone(run);
    run = manage(run, 'apply-job', 'labor');
    expect(monthlyIncome(run)).toBeGreaterThan(0);
    expect(old.player.careers).toHaveLength(0);
    run = advance(run);
    expect(currentCareer(run)!.experience).toBeGreaterThan(0);
    expect(run.finance.transactions.some((t) => t.label === 'Thu nhập công việc')).toBe(true);
    run = manage(run, 'quit-job');
    expect(monthlyIncome(run)).toBe(0);
    expect(run.player.careers[0].endMonth).toBe(run.month);
    assertRun(run);
  });
  it('rejects duplicate monthly settlement', () => {
    const run = adult();
    expect(() => settleMonth(run)).toThrow('already settled');
  });
  it('does not buy the same home twice after returning to a family home', () => {
    let run = adult();
    transact(run, 'test-capital', 'Fixture capital', { cash: 600 });
    run = manage(run, 'buy-home');
    expect(run.finance.assets).toHaveLength(1);
    run.household.housing = 'family';
    expect(() => manage(run, 'buy-home')).toThrow('đã có nhà');
    assertRun(run);
  });
});
