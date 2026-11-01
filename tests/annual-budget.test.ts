import { it, expect } from 'vitest';
import { familyStart, growFamily } from '../scripts/family-fixture';
import { talk } from '../scripts/social-fixture';
import { healthyChoice } from '../scripts/annual-fixture';
import { manage, advance, choose, activeDefinition } from '../src/engine/engine';
import { assertRun } from '../src/engine/invariants';
import { parseSave, snapshot, MAX_SAVE_BYTES } from '../src/persistence/saves';
import { writeFileSync } from 'node:fs';

it('finishes a replay-valid large family after all120 discretionary operations without spending story capacity', () => {
  let r = growFamily(familyStart('annual-v1'), 23);
  for (const age of [25, 27, 29, 31]) {
    if (r.family!.children.length >= 4) break;
    r = talk(r, 'soc-child-plan', 'friend', 'plan-child');
    r = growFamily(r, age);
  }
  expect(r.family!.children.length).toBeGreaterThanOrEqual(3);
  const management = () =>
    r.actions.filter((a) =>
      ['manage', 'wardrobe', 'social', 'family-talk', 'academic'].includes(a.type),
    ).length;
  while (management() < 120)
    r = manage(r, r.finance.savings >= 50 ? 'withdraw-money' : 'save-money');
  expect(() => manage(r, 'save-money')).toThrow('giới hạn quản lý');
  for (let step = 0; step < 400 && r.status !== 'ended'; step++) {
    r = r.activeEvent ? choose(r, activeDefinition(r)!.id, healthyChoice(r).id) : advance(r);
    assertRun(r);
  }
  expect(r.status).toBe('ended');
  expect(r.actions.length).toBeLessThanOrEqual(512);
  const text = JSON.stringify(snapshot(r));
  const bytes = Buffer.byteLength(text);
  expect(bytes).toBeLessThan(MAX_SAVE_BYTES);
  expect(parseSave(text).run).toEqual(r);
  writeFileSync(
    'docs/evidence/yearly-family-budget.json',
    JSON.stringify(
      {
        status: 'VERIFIED PASS',
        seed: r.seed,
        age: Math.floor(r.month / 12),
        children: r.family!.children.length,
        discretionary: management(),
        actions: r.actions.length,
        bytes,
      },
      null,
      2,
    ) + '\n',
  );
}, 120000);
