import { describe, it, expect } from 'vitest';
import {
  creatorAdult,
  startChannel,
  creatorStep,
  channelYears,
  channelPolicy,
} from '../scripts/creator-economy-fixture';
import { createRun, dispatch, replay } from '../src/engine/engine';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
import { assertRun } from '../src/engine/invariants';
import {
  creatorCosts,
  channelProfit,
  monetizationReady,
  creatorReason,
} from '../src/engine/creator-economy';
import { careerReason, ageOf } from '../src/content/world';
import { found } from '../scripts/business-fixture';
import { discretionaryCount } from '../src/domain/rules';
import { hashSeed } from '../src/engine/random';
import { admittedStudent } from '../scripts/academic-fixture';
import { familyStart, growFamily } from '../scripts/family-fixture';
import { talk } from '../scripts/social-fixture';
import { writeFileSync } from 'node:fs';
function checked(r: ReturnType<typeof creatorAdult>) {
  assertRun(r);
  expect(canonical(replay(r.seed, r.setup, r.actions))).toBe(canonical(r));
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
}
describe('versioned creator economy', () => {
  it('converts design setup and production prices once for a new DSM creator fixture', () => {
    let r = createRun('creator-dsm', {
      cohort: 2005,
      region: 'northern-village',
      wealth: 4,
      lifeRules: 'creator-v1',
    });
    for (let i = 0; i < 100 && r.month < 216; i++) r = creatorStep(r);
    const before = r.finance.cash;
    r = startChannel(r);
    expect(r.finance.cash).toBe(before - 40);
    expect(r.creator!.channels[0].totals.cost).toBe(40);
    r = channelYears(r, 1);
    checked(r);
  });
  it('starts a channel alongside a real pending university assessment without dropping it', () => {
    let r = admittedStudent('korean', 0, 'creator-v1', 'vnd-v1').run;
    for (let i = 0; i < 40 && (!r.academics?.focus || r.world.year < 2014); i++) r = creatorStep(r);
    expect(r.academics?.focus).toBeDefined();
    const before = r;
    r = startChannel(r);
    expect(r.academics?.focus).toEqual(before.academics?.focus);
    expect(r.activeEvent).toEqual(before.activeEvent);
    r = channelYears(r, 5);
    expect(r.academics!.studies[0].completedYears).toBeGreaterThan(0);
    expect(r.creator!.channels[0].settledThrough).toBe(r.month);
    checked(r);
  });
  it('finishes a real family, job, shop and channel after all120 optional actions within512/5MiB', () => {
    let r = familyStart('creator-v1', 'vnd-v1');
    while (r.world.year < 2014) r = creatorStep(r);
    r = found(r, 4_000_000);
    r = startChannel(r);
    r = growFamily(r, 23);
    for (const age of [25, 27, 29, 31]) {
      if (r.family!.children.length >= 3) break;
      r = talk(r, 'soc-child-plan', 'friend', 'plan-child');
      r = growFamily(r, age);
    }
    expect(r.family!.children.length).toBeGreaterThanOrEqual(3);
    while (creatorReason(r) && r.activeEvent) r = creatorStep(r);
    while (discretionaryCount(r) < 120) {
      const c = r.creator!.channels[0];
      r = dispatch(r, {
        type: 'creator',
        operation: 'policy',
        id: 'creator:0',
        policy: { ...c.policy, focus: c.policy.focus === 'craft' ? 'community' : 'craft' },
        expected: r.actions.length,
      });
    }
    for (let i = 0; i < 500 && r.status !== 'ended'; i++) r = creatorStep(r);
    expect(r.status).toBe('ended');
    expect(r.actions.length).toBeLessThanOrEqual(512);
    expect(discretionaryCount(r)).toBe(120);
    const bytes = Buffer.byteLength(JSON.stringify(snapshot(r)));
    expect(bytes).toBeLessThan(5 * 1024 * 1024);
    expect(ageOf(r)).toBeGreaterThan(82);
    checked(r);
    writeFileSync(
      'docs/evidence/creator-family-budget.json',
      JSON.stringify(
        {
          status: 'VERIFIED PASS',
          seed: r.seed,
          age: ageOf(r),
          children: r.family!.children.length,
          ventures: r.enterprise!.ventures.length,
          channels: r.creator!.channels.length,
          actions: r.actions.length,
          discretionary: 120,
          bytes,
        },
        null,
        2,
      ) + '\n',
    );
  });
  it('inherits shop, annual, university and employment without changing enterprise-v1', () => {
    const r = creatorAdult();
    expect(r.creator).toEqual({ channels: [], lastSceneMonth: -12 });
    expect(r.academics).toBeDefined();
    expect(r.employment).toBeDefined();
    expect(r.enterprise).toBeDefined();
    const old = createRun('unchanged', {
      cohort: 1995,
      region: 'northern-village',
      lifeRules: 'enterprise-v1',
      currency: 'vnd-v1',
    });
    expect(old.creator).toBeUndefined();
    expect(() => startChannel(old)).toThrow();
    checked(r);
    checked(old);
  });
  it('charges actual setup, preserves the active story and rejects forged/stale operations atomically', () => {
    const r = creatorAdult(),
      text = canonical(r),
      next = startChannel(r);
    expect(canonical(r)).toBe(text);
    expect(next.activeEvent).toEqual(r.activeEvent);
    expect(next.finance.cash).toBe(r.finance.cash - 8_000_000);
    expect(next.creator!.channels[0].totals.cost).toBe(8_000_000);
    expect(() =>
      dispatch(next, {
        type: 'creator',
        operation: 'pause',
        id: 'creator:0',
        expected: r.actions.length,
      }),
    ).toThrow('đã cũ');
    for (const extra of [
      { owner: 'other' },
      { amount: 1 },
      { platform: 'invented' },
      { policy: { ...channelPolicy, injected: true } },
    ])
      expect(() =>
        dispatch(r, {
          type: 'creator',
          operation: 'start',
          platform: 'youtube',
          policy: channelPolicy,
          expected: r.actions.length,
          ...extra,
        } as never),
      ).toThrow();
    const forged = snapshot(next);
    forged.run.creator!.channels[0].audience = 999999;
    expect(() => parseSave(JSON.stringify(forged))).toThrow();
    checked(next);
  });
  it('keeps researched eras distinct and never offers TikTok LIVE to a new empty channel', () => {
    expect(() => startChannel(creatorAdult('old-yt', 1995), 'youtube')).toThrow('chưa mở');
    const yt = creatorAdult('old-tiktok', 1996);
    expect(() => startChannel(yt, 'tiktok')).toThrow('chưa mở');
    expect(() =>
      startChannel(creatorAdult(), 'tiktok', { ...channelPolicy, format: 'live' }),
    ).toThrow('1.000');
    const started = startChannel(creatorAdult());
    expect(() =>
      dispatch(started, {
        type: 'creator',
        operation: 'apply',
        id: 'creator:0',
        expected: started.actions.length,
      }),
    ).toThrow('chưa đủ');
  });
  it('settles once per real month, distinguishes followers from money and records real losses', () => {
    let r = startChannel(creatorAdult());
    r = channelYears(r, 1);
    const c = r.creator!.channels[0];
    expect(c.settledThrough).toBe(r.month);
    expect(c.audience).toBeGreaterThan(0);
    expect(c.totals.platformIncome).toBe(0);
    expect(channelProfit(c)).toBeLessThan(0);
    expect(c.recent.length).toBe(12);
    expect(c.recent.every((m) => m.profit === m.platformIncome + m.sponsorIncome - m.cost)).toBe(
      true,
    );
    expect(new Set(r.finance.transactions.map((t) => t.id)).size).toBe(
      r.finance.transactions.length,
    );
    checked(r);
  });
  it('suspends without cost or income, recovers through time and archives a closed channel', () => {
    let r = startChannel(creatorAdult());
    r = dispatch(r, {
      type: 'creator',
      operation: 'pause',
      id: 'creator:0',
      expected: r.actions.length,
    });
    r = channelYears(r, 2);
    while (creatorReason(r) && r.activeEvent) r = creatorStep(r);
    const c = r.creator!.channels[0];
    expect(c.totals.published).toBe(0);
    expect(c.totals.cost).toBe(8_000_000);
    expect(c.recent.every((m) => m.cost === 0 && m.profit === 0)).toBe(true);
    r = dispatch(r, {
      type: 'creator',
      operation: 'resume',
      id: 'creator:0',
      expected: r.actions.length,
    });
    r = channelYears(r, 1);
    while (creatorReason(r) && r.activeEvent) r = creatorStep(r);
    r = dispatch(r, {
      type: 'creator',
      operation: 'close',
      id: 'creator:0',
      expected: r.actions.length,
    });
    const closed = r.creator!.channels[0];
    expect(closed.status).toBe('closed');
    r = channelYears(r, 2);
    expect(r.creator!.channels[0]).toEqual(closed);
    checked(r);
  });
  it('shares four lifetime venture IDs and the same 120 optional operations with shops', () => {
    let r = startChannel(creatorAdult());
    for (let i = 0; i < 3; i++) r = found(r, 4_000_000);
    expect(() => startChannel(r, 'tiktok')).toThrow('bốn');
    expect(() => found(r, 4_000_000)).toThrow('bốn');
    expect(careerReason(r, 'freelance')).toContain('sổ riêng');
    expect(careerReason(r, 'business')).toContain('sổ riêng');
    while (discretionaryCount(r) < 120) {
      const c = r.creator!.channels[0];
      r = dispatch(r, {
        type: 'creator',
        operation: 'policy',
        id: 'creator:0',
        policy: { ...c.policy, focus: c.policy.focus === 'craft' ? 'community' : 'craft' },
        expected: r.actions.length,
      });
    }
    expect(() =>
      dispatch(r, {
        type: 'creator',
        operation: 'close',
        id: 'creator:0',
        expected: r.actions.length,
      }),
    ).toThrow('lượt');
    for (let i = 0; i < 500 && r.status !== 'ended'; i++) r = creatorStep(r);
    expect(r.status).toBe('ended');
    expect(r.creator!.channels.every((c) => c.status === 'closed')).toBe(true);
    expect(r.actions.length).toBeLessThanOrEqual(512);
    expect(Buffer.byteLength(JSON.stringify(snapshot(r)))).toBeLessThan(5 * 1024 * 1024);
    expect(ageOf(r)).toBeGreaterThan(82);
    checked(r);
  });
  it('grows, applies, reviews and pays only when eligible; TikTok LIVE has its own hardware and rhythm', () => {
    let r = startChannel(creatorAdult('creator-monetization'), 'tiktok');
    r = channelYears(r, 5);
    while (creatorReason(r) && r.activeEvent) r = creatorStep(r);
    let c = r.creator!.channels[0];
    expect(c.audience).toBeGreaterThanOrEqual(1000);
    expect(() =>
      dispatch(r, {
        type: 'creator',
        operation: 'policy',
        id: 'creator:0',
        policy: { ...c.policy, format: 'live', niche: 'gaming' },
        expected: r.actions.length,
      }),
    ).toThrow('bậc 2');
    r = dispatch(r, {
      type: 'creator',
      operation: 'equipment',
      id: 'creator:0',
      expected: r.actions.length,
    });
    c = r.creator!.channels[0];
    r = dispatch(r, {
      type: 'creator',
      operation: 'policy',
      id: 'creator:0',
      policy: { ...c.policy, format: 'live', rhythm: 'light', focus: 'community', niche: 'gaming' },
      expected: r.actions.length,
    });
    expect(creatorCosts(r, r.creator!.channels[0].policy)).toBe(1_000_000);
    r = channelYears(r, 1);
    while (creatorReason(r) && r.activeEvent) r = creatorStep(r);
    c = r.creator!.channels[0];
    expect(monetizationReady(r, c)).toBe(true);
    if (c.monetization !== 'approved' && c.monetization !== 'pending')
      r = dispatch(r, {
        type: 'creator',
        operation: 'apply',
        id: 'creator:0',
        expected: r.actions.length,
      });
    r = channelYears(r, 2);
    c = r.creator!.channels[0];
    expect(c.appliedMonth).not.toBeNull();
    expect(c.totals.platformIncome).toBeGreaterThan(0);
    expect(c.recent.some((m) => m.platformIncome === 0)).toBe(true);
    checked(r);
  });
  it('locks a separate creator opening golden', () => {
    const r = startChannel(creatorAdult('golden-creator-economy-v1'));
    expect(hashSeed(JSON.stringify(r))).toBe(3366108938);
  });
  it('locks a full-life creator golden past100 with a bounded canonical save', () => {
    let r = startChannel(creatorAdult('golden-creator-economy-full-v1'));
    for (let i = 0; i < 500 && r.status !== 'ended'; i++) r = creatorStep(r);
    expect(r.status).toBe('ended');
    expect(ageOf(r)).toBe(121);
    expect(hashSeed(JSON.stringify(r))).toBe(1900092503);
    expect(r.actions.length).toBe(248);
    expect(Buffer.byteLength(JSON.stringify(snapshot(r)))).toBeLessThan(5 * 1024 * 1024);
    checked(r);
  });
});
