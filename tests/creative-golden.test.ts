import { it, expect } from 'vitest';
import { creativeGoldenRuns } from '../scripts/creative-golden-fixture';
import { hashSeed } from '../src/engine/random';
import { assertRun } from '../src/engine/invariants';
import { replay } from '../src/engine/engine';
import { canonical, snapshot, parseSave } from '../src/persistence/saves';
const expected = {
  opening: 2429901562,
  'freelance-paid': 1418848543,
  'gaming-round': 2703101395,
  collaboration: 3381035672,
  'artistic-shows': 3195023051,
  'combined-life': 590703711,
  'long-life': 918369720,
};
const runs = creativeGoldenRuns();
for (const name of Object.keys(expected) as (keyof typeof expected)[])
  it('locks creative-v1 independently: ' + name, () => {
    const r = runs[name];
    assertRun(r);
    expect(hashSeed(JSON.stringify(r))).toBe(expected[name]);
    expect(canonical(replay(r.seed, r.setup, r.actions))).toBe(canonical(r));
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    if (name === 'long-life') expect(r.month / 12).toBe(123);
    if (name === 'combined-life')
      expect(r.actions.filter((a) => !['choose', 'advance'].includes(a.type))).toHaveLength(120);
  });
