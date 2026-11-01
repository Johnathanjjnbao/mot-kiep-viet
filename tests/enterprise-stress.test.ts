import { it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { createRun } from '../src/engine/engine';
import { worldFor } from '../src/content/world';
import {
  foundRetail,
  settleRetail,
  closeRetail,
  assertEnterprise,
  retailPolicy,
} from '../src/engine/enterprise';

it('replays1000 isolated ten-year accounting scenarios with conserved money and bounded records', () => {
  const report = {
    scope: 'Isolated accounting reducer, NOT full lives or canonical save replay',
    seeds: 0,
    reducerReplays: 0,
    months: 120,
    violations: 0,
    maxSerializedBytes: 0,
    positive: 0,
    negative: 0,
    suspended: 0,
    returnedUnits: 0,
  };
  function play(i: number) {
    const r = createRun('retail-stress-' + i, {
      cohort: 1995,
      region: 'southern-city',
      wealth: 4,
      expansion: 'family',
      lifeRules: 'annual-v1',
    });
    r.month = 216;
    r.world = worldFor(2013);
    r.status = 'playing';
    let x = foundRetail(
      r,
      0,
      20 + (i % 281),
      (['clothing', 'household', 'handmade'] as const)[i % 3],
    );
    x = retailPolicy(x.run, x.enterprise, {
      price: (['budget', 'balanced', 'premium'] as const)[i % 3],
      marketing: i % 2 === 0,
      reorderTarget: i % 201,
    });
    for (let m = 0; m < 120; m++) {
      const run = structuredClone(x.run);
      run.month++;
      x = settleRetail(run, x.enterprise);
      assertEnterprise(x.run, x.enterprise);
    }
    return closeRetail(x.run, x.enterprise);
  }
  for (let i = 0; i < 1000; i++) {
    const a = play(i),
      b = play(i);
    expect(a).toEqual(b);
    assertEnterprise(a.run, a.enterprise);
    const t = a.enterprise.totals,
      profit = t.revenue - t.cogs - t.operating - t.writeOff;
    report.seeds++;
    report.reducerReplays++;
    report.positive += Number(profit > 0);
    report.negative += Number(profit < 0);
    report.suspended += Number(a.enterprise.recent.some((m) => m.operating === 0));
    report.returnedUnits += a.enterprise.recent.reduce((sum, m) => sum + m.returned, 0);
    report.maxSerializedBytes = Math.max(
      report.maxSerializedBytes,
      Buffer.byteLength(JSON.stringify(a)),
    );
    expect(a.enterprise.recent.length).toBeLessThanOrEqual(12);
    expect(a.run.finance.cash).toBe(a.run.finance.transactions.reduce((sum, t) => sum + t.cash, 0));
  }
  expect(report.positive).toBeGreaterThan(0);
  expect(report.negative).toBeGreaterThan(0);
  writeFileSync(
    'docs/evidence/enterprise-foundation-stress.json',
    JSON.stringify(report, null, 2) + '\n',
  );
}, 300000);
