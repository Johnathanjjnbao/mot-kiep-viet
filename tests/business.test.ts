import { describe, it, expect } from 'vitest';
import type { GameRun, RunSetup } from '../src/domain/model';
import {
  createRun,
  advance,
  choose,
  activeDefinition,
  choiceReason,
  dispatch,
  replay,
} from '../src/engine/engine';
import { healthyChoice } from '../scripts/annual-fixture';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
import { assertRun } from '../src/engine/invariants';
import { hasAnnualRules, hasAcademicRules, hasEmploymentRules } from '../src/domain/rules';
import { careerReason, currentCareer, ageOf } from '../src/content/world';
import { enterpriseEquity, enterpriseProfit } from '../src/engine/business';
import { hashSeed } from '../src/engine/random';

export const businessSetup: RunSetup = {
  cohort: 1995,
  region: 'northern-village',
  wealth: 4,
  family: 'both',
  expansion: 'family',
  lifeRules: 'enterprise-v1',
  currency: 'vnd-v1',
  motherTraits: ['gentle'],
  fatherTraits: ['academic'],
};
export const defaultPolicy = { price: 'balanced' as const, marketing: false, reorderTarget: 20 };
export function businessAdult(seed = 'business-canonical') {
  let r = createRun(seed, businessSetup);
  for (let steps = 0; steps < 100 && r.month < 216; steps++)
    r = r.activeEvent ? choose(r, activeDefinition(r)!.id, healthyChoice(r).id) : advance(r);
  if (r.month !== 216) throw Error('Missing adult business fixture');
  return r;
}
export const found = (r: GameRun, capital = 20_000_000) =>
  dispatch(r, {
    type: 'enterprise',
    operation: 'found',
    category: 'clothing',
    capital,
    policy: defaultPolicy,
    expected: r.actions.length,
  });
export function businessStep(r: GameRun) {
  if (!r.activeEvent) return advance(r);
  const e = activeDefinition(r)!;
  const choices = e.choices.filter((c) => !choiceReason(r, c));
  expect(choices.length).toBeGreaterThanOrEqual(4);
  return choose(r, e.id, healthyChoice(r).id);
}
function checked(r: GameRun) {
  assertRun(r);
  expect(canonical(replay(r.seed, r.setup, r.actions))).toBe(canonical(r));
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
}
describe('authoritative enterprise-v1 GameRun', () => {
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
        id: e.id,
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
    expect(e.recent.some((x) => x.returned > 0)).toBe(true);
    expect(r.finance.transactions.filter((t) => t.id.startsWith(e.id + ':month:'))).toHaveLength(
      r.month - start,
    );
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
    while (r.academics?.focus || r.social?.focus || r.family?.focus) r = businessStep(r);
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
});
