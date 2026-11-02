import { describe, it, expect } from 'vitest';
import {
  freelanceAdult,
  openProject,
  finishProject,
  projectAction,
  freelanceStep,
  freelanceCase,
} from '../scripts/freelance-fixture';
import { activeDefinition, dispatch, replay, createRun } from '../src/engine/engine';
import { assertRun } from '../src/engine/invariants';
import { currentProject, serviceReason, projectProfit } from '../src/engine/freelance';
import { canonical, snapshot, parseSave } from '../src/persistence/saves';
import { designMoney } from '../src/domain/currency';
import { CLIENT_SERVICES } from '../src/content/freelance-services';
import { freelanceEvents } from '../src/content/freelance-events';
import { admittedStudent, advanceStudy } from '../scripts/academic-fixture';
import { CAREERS, careerReason, currentCareer } from '../src/content/world';
import { discretionaryCount } from '../src/domain/rules';
function checked(r: ReturnType<typeof freelanceAdult>) {
  assertRun(r);
  expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
}
function caseEnding(ending: string) {
  for (let i = 0; i < 80; i++) {
    let r = freelanceAdult('native-client-' + i);
    r = openProject(r);
    if (currentProject(r)) r = finishProject(r);
    if (r.freelance!.projects[0].ending === ending) return r;
  }
  throw Error('Missing project ending ' + ending);
}
describe('versioned client contracts', () => {
  it('keeps six concrete services and12 authored scenes behind the new immutable selector', () => {
    expect(CLIENT_SERVICES).toHaveLength(6);
    expect(freelanceEvents).toHaveLength(12);
    const old = createRun('old-client', {
      cohort: 2005,
      region: 'northern-village',
      lifeRules: 'realism-v1',
      currency: 'vnd-v1',
    });
    expect(old.freelance).toBeUndefined();
    expect(() =>
      dispatch(old, { type: 'freelance', operation: 'inquire', service: 'writing', expected: 0 }),
    ).toThrow();
    checked(old);
    const baby = createRun('baby-client', {
      cohort: 2005,
      region: 'northern-village',
      lifeRules: 'creative-v1',
      currency: 'vnd-v1',
    });
    expect(() => projectAction(baby, 'inquire', { service: 'writing' })).toThrow();
    checked(baby);
  });
  it('charges preparation once and rejects stale, forged, mismatched and premature requests without mutation', () => {
    const before = freelanceAdult(),
      cash = before.finance.cash;
    const r = projectAction(before, 'inquire', { service: 'writing' });
    expect(r.finance.cash).toBe(cash - designMoney(r, 2));
    expect(before.freelance!.projects).toHaveLength(0);
    const text = canonical(r);
    expect(() =>
      dispatch(r, {
        type: 'freelance',
        operation: 'negotiate',
        id: 'freelance:0',
        terms: 'standard',
        expected: before.actions.length,
      }),
    ).toThrow(/cũ/);
    for (const extra of [{ owner: 'elsewhere' }, { service: 'writing' }, { terms: 'premium' }])
      expect(() =>
        dispatch(r, {
          type: 'freelance',
          operation: 'deliver',
          id: 'freelance:0',
          expected: r.actions.length,
          ...extra,
        } as never),
      ).toThrow();
    expect(() => projectAction(r, 'deliver')).toThrow();
    expect(canonical(r)).toBe(text);
    checked(r);
  });
  it('uses actual requirements, qualifications and skills rather than a service label', () => {
    const r = freelanceAdult();
    expect(serviceReason(r, 'writing')).toBeNull();
    expect(serviceReason(r, 'programming')).not.toBeNull();
    expect(() => dispatch(r, { type: 'manage', action: 'apply-job', career: 'freelance' })).toThrow(
      /hợp đồng/,
    );
  });
  it('really rejects a client proposal with spent costs and no income', () => {
    const r = caseEnding('rejected'),
      p = r.freelance!.projects[0];
    expect(p.totals.received).toBe(0);
    expect(projectProfit(p)).toBe(-designMoney(r, 2));
    expect(p.acceptedMonth).toBeNull();
    checked(r);
  });
  it('runs work/delivery/review/payment/closure and cannot pay twice through replay or later years', () => {
    let r = caseEnding('paid');
    const p = r.freelance!.projects[0],
      paid = p.totals.received;
    expect(p.workMonths).toBeGreaterThanOrEqual(12);
    expect(p.quality).toBeGreaterThan(0);
    expect(p.milestones.some((m) => m.status === 'review')).toBe(true);
    expect(p.milestones.some((m) => m.status === 'payment')).toBe(true);
    expect(paid).toBe(p.fee);
    expect(p.totals.cost).toBeGreaterThan(designMoney(r, 2));
    expect(r.finance.transactions.filter((t) => t.id === p.id + ':payout')).toHaveLength(1);
    checked(r);
    for (let i = 0; i < 6; i++) r = freelanceStep(r);
    expect(r.freelance!.projects[0].totals.received).toBe(paid);
    expect(r.finance.transactions.filter((t) => t.id === p.id + ':payout')).toHaveLength(1);
    expect(() =>
      dispatch(r, {
        type: 'freelance',
        operation: 'deliver',
        id: p.id,
        expected: r.actions.length,
      }),
    ).toThrow();
    checked(r);
  }, 120000);
  it('keeps monthly costs out of savings/debt and reconciles a failed/unpaid project', () => {
    const r = caseEnding('failed'),
      p = r.freelance!.projects[0];
    expect(p.totals.received).toBe(0);
    expect(p.totals.cost).toBeGreaterThan(0);
    expect(
      r.finance.transactions
        .filter((t) => t.id.startsWith(p.id + ':'))
        .every((t) => t.debt === 0 && t.savings === 0 && t.assets === 0),
    ).toBe(true);
    checked(r);
  }, 120000);
  it('settles partial fees only after payment and records a genuinely unpaid client', () => {
    const partial = freelanceCase('partial'),
      p = partial.freelance!.projects[0];
    expect(p.totals.received).toBe(Math.floor(p.fee * 0.6));
    expect(p.milestones.some((m) => m.status === 'rework')).toBe(true);
    expect(partial.finance.transactions.filter((t) => t.id === p.id + ':payout')).toHaveLength(1);
    checked(partial);
    const unpaid = freelanceCase('unpaid'),
      u = unpaid.freelance!.projects[0];
    expect(u.amountDue).toBeGreaterThan(0);
    expect(u.totals.received).toBe(0);
    expect(u.paidMonth).toBeNull();
    expect(unpaid.finance.transactions.filter((t) => t.id === u.id + ':payout')).toEqual([]);
    checked(unpaid);
  });
  it('supports all six services from genuine degrees and subsequent salaried work', () => {
    for (const s of CLIENT_SERVICES) {
      let funded: ReturnType<typeof freelanceAdult> | undefined;
      for (let attempt = 0; attempt < 20; attempt++) {
        let candidate = advanceStudy(
          admittedStudent(s.programs[0], attempt, 'creative-v1', 'vnd-v1').run,
          'project',
        );
        expect(
          candidate.academics!.qualifications.some((q) => s.programs.includes(q.programId)),
        ).toBe(true);
        const job = CAREERS.filter(
          (c) => !['business', 'freelance'].includes(c.id) && !careerReason(candidate, c.id),
        ).at(-1)!;
        candidate = dispatch(candidate, { type: 'manage', action: 'apply-job', career: job.id });
        if (currentCareer(candidate)) {
          funded = candidate;
          break;
        }
      }
      expect(funded).toBeDefined();
      let r = funded!;
      for (let i = 0; i < 10 && r.finance.cash < designMoney(r, 10); i++) r = freelanceStep(r);
      expect(serviceReason(r, s.id)).toBeNull();
      r = openProject(r, s.id);
      if (currentProject(r)) r = finishProject(r);
      expect(r.freelance!.projects[0].service).toBe(s.id);
      expect(r.freelance!.projects[0].status).toBe('closed');
      checked(r);
    }
  });
  it('can resolve a project in annual story after all120 management actions are spent', () => {
    let r = freelanceCase('rework');
    // Retain the exact genuine rework history, then spend the shared budget on real savings moves.
    // Rework still has four story operations including revise/partial/close/wait.
    while (discretionaryCount(r) < 120) {
      if (r.finance.savings) r = dispatch(r, { type: 'manage', action: 'withdraw-money' });
      else if (r.finance.cash >= designMoney(r, 50))
        r = dispatch(r, { type: 'manage', action: 'save-money' });
      else throw Error('Insufficient real money for budget fixture');
    }
    expect(() => projectAction(r, 'settle')).toThrow(/lượt/);
    expect(() => dispatch(r, { type: 'manage', action: 'withdraw-money' })).toThrow(/lượt/);
    for (let i = 0; i < 40 && currentProject(r); i++) r = freelanceStep(r);
    expect(currentProject(r)).toBeUndefined();
    expect(discretionaryCount(r)).toBe(120);
    expect(r.actions.length).toBeLessThanOrEqual(512);
    checked(r);
  });
  it('keeps the four-book limit after closing projects and conserves their histories', () => {
    let r = freelanceAdult('four-native-books');
    for (let i = 0; i < 4; i++) {
      r = projectAction(r, 'inquire', { service: 'writing' });
      r = projectAction(r, 'close');
    }
    expect(r.freelance!.projects.map((p) => p.id)).toEqual([
      'freelance:0',
      'freelance:1',
      'freelance:2',
      'freelance:3',
    ]);
    expect(() => projectAction(r, 'inquire', { service: 'writing' })).toThrow(/bốn/);
    expect(() =>
      dispatch(r, {
        type: 'creator',
        operation: 'start',
        platform: 'youtube',
        policy: { format: 'video', rhythm: 'light', focus: 'craft', niche: 'education' },
        expected: r.actions.length,
      }),
    ).toThrow(/bốn/);
    checked(r);
  });
  it('rebases an obsolete project scene in the same month and retains a valid four-choice story', () => {
    let r = freelanceAdult('same-month-native');
    r = projectAction(r, 'inquire', { service: 'writing' });
    for (let i = 0; i < 8 && r.activeEvent?.id !== 'fl-inquiry'; i++) r = freelanceStep(r);
    expect(r.activeEvent?.id).toBe('fl-inquiry');
    const month = r.month;
    r = projectAction(r, 'close');
    expect(r.month).toBe(month);
    expect(r.activeEvent?.id).not.toBe('fl-inquiry');
    expect(activeDefinition(r)!.choices.length).toBeGreaterThanOrEqual(4);
    checked(r);
  });
});
