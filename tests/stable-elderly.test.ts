import { it, expect } from 'vitest';
import { createRun, replay } from '../src/engine/engine';
import { nativeLongStep } from '../scripts/creative-forced-fixture';
import { found, businessStep } from '../scripts/business-fixture';
import { businessReason } from '../src/engine/business';
import { assertRun } from '../src/engine/invariants';
import { canonical, snapshot, parseSave } from '../src/persistence/saves';
it('an83-year-old can invest their own money, make real sales and suspend a loss-making shop without an age82 ending', () => {
  let r = createRun('realism-canonical', {
    cohort: 2005,
    region: 'northern-village',
    wealth: 4,
    family: 'both',
    expansion: 'family',
    lifeRules: 'stable-v1',
    currency: 'vnd-v1',
  });
  while (r.month < 996 && r.status !== 'ended') r = nativeLongStep(r);
  expect(r.month).toBe(996);
  expect(r.player.alive).toBe(true);
  expect(businessReason(r)).toBeNull();
  const cash = r.finance.cash;
  r = found(r, 4000000);
  expect(r.finance.cash).toBe(cash - 4000000);
  for (let i = 0; i < 16 && r.month < 1020 && r.status !== 'ended'; i++) r = businessStep(r);
  const shop = r.enterprise!.ventures[0];
  expect(r.month).toBe(1020);
  expect(r.status).toBe('playing');
  expect(shop.status).toBe('suspended');
  expect(shop.cash).toBeGreaterThanOrEqual(0);
  expect(shop.totals.revenue).toBe(2400000);
  expect(shop.totals.operating).toBe(2800000);
  assertRun(r);
  expect(canonical(replay(r.seed, r.setup, r.actions))).toBe(canonical(r));
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
});
