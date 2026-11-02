import { it, expect } from 'vitest';
import { stableGoldenRuns } from '../scripts/stable-golden-fixture';
import { hashSeed } from '../src/engine/random';
import { assertRun } from '../src/engine/invariants';
import { replay } from '../src/engine/engine';
import { canonical, snapshot, parseSave } from '../src/persistence/saves';
const expected = {
  opening: 1024699387,
  'long-life': 3885952072,
  'combined-life': 4020914179,
  'learning-complete': 3028092477,
  'learning-withdraw': 2588809235,
  'elderly-agency': 527979475,
};
const runs = stableGoldenRuns();
for (const name of Object.keys(expected) as (keyof typeof expected)[])
  it('locks stable-v1 independently: ' + name, () => {
    const r = runs[name];
    assertRun(r);
    expect(hashSeed(JSON.stringify(r))).toBe(expected[name]);
    expect(canonical(replay(r.seed, r.setup, r.actions))).toBe(canonical(r));
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    if (name === 'long-life') expect(r.month / 12).toBe(118);
    if (name === 'combined-life') {
      expect(r.actions.filter((a) => !['choose', 'advance'].includes(a.type))).toHaveLength(120);
      expect(r.actions.length).toBeLessThan(512);
      expect(r.family!.children).toHaveLength(3);
      expect(r.freelance!.projects.length).toBeGreaterThan(0);
      expect(r.creative!.artist!.showCount).toBeGreaterThan(0);
    }
  });
