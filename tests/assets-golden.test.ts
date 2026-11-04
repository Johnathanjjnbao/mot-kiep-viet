import { it, expect } from 'vitest';
import { assetsGoldenRuns } from '../scripts/assets-golden-fixture';
import { hashSeed } from '../src/engine/random';
import { assertRun } from '../src/engine/invariants';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
const expected = {
  opening: 252946752,
  'rental-damage-exit': 2465470076,
  mortgage: 1452652033,
  'pc-upgrade-financed': 4294886524,
  'mortgage-distress': 3969371280,
  'combined-life': 45474902,
  'long-life': 1775103204,
  'outstanding-death': 3750889396,
};
const runs = assetsGoldenRuns();
for (const name of Object.keys(expected) as (keyof typeof expected)[])
  it('locks assets-v1 independently: ' + name, () => {
    const r = runs[name];
    assertRun(r);
    expect(hashSeed(JSON.stringify(r))).toBe(expected[name]);
    expect(canonical(parseSave(JSON.stringify(snapshot(r))).run)).toBe(canonical(r));
    expect(r.actions.length).toBeLessThanOrEqual(512);
    if (name === 'long-life') {
      expect(r.status).toBe('ended');
      expect(r.month / 12).toBeGreaterThanOrEqual(100);
    }
    if (name === 'outstanding-death') {
      expect(r.status).toBe('ended');
      expect(r.livingAssets!.loans[0].principal).toBeGreaterThan(0);
      expect(r.livingAssets!.owned).toHaveLength(1);
    }
    if (name === 'combined-life') {
      expect(r.family!.children).toHaveLength(3);
      expect(r.academics!.qualifications.length).toBeGreaterThan(0);
      expect(r.player.careers.length).toBeGreaterThan(1);
      expect(r.enterprise!.ventures).toHaveLength(1);
      expect(r.creator!.channels).toHaveLength(1);
      expect(
        r.actions.filter(
          (a) =>
            a.type === 'living-assets' && a.operation === 'buy' && a.item?.startsWith('phone-'),
        ),
      ).toHaveLength(4);
    }
  });
