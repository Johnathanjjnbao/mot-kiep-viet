import { it, expect } from 'vitest';
import { simulateLife } from '../src/diagnostics/simulation';
import { REGIONS } from '../src/content/world';
import { FAMILIES } from '../src/domain/creator';
import type { RunSetup } from '../src/domain/model';
import { discretionaryCount } from '../src/domain/rules';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
for (const i of [103, 118])
  it('finishes when a second optional step no longer fits the story reserve: seed ' + i, () => {
    const families = Object.keys(FAMILIES) as NonNullable<RunSetup['family']>[];
    const setup: RunSetup = {
      cohort: [1975, 1995, 2005, 2026][i % 4],
      region: REGIONS[i % 3].id,
      wealth: (i % 5) as 0 | 1 | 2 | 3 | 4,
      family: families[i % families.length],
      expansion: 'family',
      lifeRules: 'assets-v1',
      currency: 'vnd-v1',
      motherTraits: i % 2 ? ['academic'] : ['gentle'],
      fatherTraits: i % 2 ? ['generous'] : ['strict'],
    };
    const r = simulateLife('assets-release-' + i, setup, i % 5);
    expect(r.status).toBe('ended');
    expect(r.actions.length).toBeLessThanOrEqual(512);
    expect(discretionaryCount(r)).toBeLessThanOrEqual(120);
    expect(canonical(parseSave(JSON.stringify(snapshot(r))).run)).toBe(canonical(r));
  });
