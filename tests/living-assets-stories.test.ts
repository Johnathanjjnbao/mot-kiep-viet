import { it, expect } from 'vitest';
import rows from './data/assets-viewport-replays.json';
import type { RunSetup, RunAction } from '../src/domain/model';
import { livingAssetsEvents } from '../src/content/living-assets-events';
import { replay, choose, activeDefinition, choiceReason } from '../src/engine/engine';
import { assertRun } from '../src/engine/invariants';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
import { assetAction, clearAssetStory } from '../scripts/living-assets-fixture';
import { depositRefund } from '../src/engine/living-assets';
const before = (id: string) => {
  const row = rows.find((r) => r.id === id)!;
  return replay(row.seed, row.setup as RunSetup, row.actions as RunAction[]);
};
it('covers the exact new scene registry', () => {
  expect(rows.map((r) => r.id).sort()).toEqual(livingAssetsEvents.map((e) => e.id).sort());
});
for (const row of rows)
  it('canonical reachability and all four choices: ' + row.id, () => {
    const r = before(row.id),
      e = activeDefinition(r)!;
    expect(e.id).toBe(row.id);
    expect(e.choices.filter((c) => !choiceReason(r, c))).toHaveLength(4);
    for (const c of e.choices) {
      const next = choose(r, e.id, c.id);
      assertRun(next);
      expect(canonical(parseSave(JSON.stringify(snapshot(next))).run)).toBe(canonical(next));
    }
  });
it('damage reduces the actual rental deposit; paid repair restores only the recorded claim', () => {
  const r = before('living-room-2'),
    damaged = choose(r, 'living-room-2', 'c');
  expect(damaged.livingAssets!.lease!.damage).toBe(20);
  const refund = depositRefund(damaged);
  expect(refund).toBeLessThan(depositRefund(r));
  const ready = clearAssetStory(damaged),
    fixed = assetAction(ready, { operation: 'repair-rental' });
  expect(fixed.livingAssets!.lease!.damage).toBe(0);
  expect(fixed.finance.cash).toBeLessThan(ready.finance.cash);
  expect(depositRefund(fixed)).toBe(fixed.livingAssets!.lease!.deposit);
  const left = assetAction(ready, { operation: 'leave' });
  expect(left.finance.cash).toBe(ready.finance.cash + refund - 300_000);
  expect(left.finance.assets.some((a) => a.id === ready.livingAssets!.lease!.id)).toBe(false);
  assertRun(left);
  expect(canonical(parseSave(JSON.stringify(snapshot(left))).run)).toBe(canonical(left));
});
