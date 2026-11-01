import { writeFileSync } from 'node:fs';
import { createRun, advance, choose, activeDefinition, choiceReason } from '../src/engine/engine';
import type { RunSetup } from '../src/domain/model';
import { newbornAnnual } from './annual-fixture';
const reports = [];
for (const varied of [false, true])
  for (const rules of ['career-v1', 'annual-v1'] as const) {
    const openings = new Set<string>(),
      first5 = new Set<string>(),
      first10 = new Set<string>();
    const counts: Record<string, number> = {},
      visibleAges: Record<string, number> = {};
    let fallback = 0;
    for (let i = 0; i < 200; i++) {
      const setup: RunSetup = {
        ...newbornAnnual().setup,
        lifeRules: rules,
        ...(varied
          ? {
              cohort: 1975 + (i % 52),
              wealth: (i % 5) as RunSetup['wealth'],
              region: (['southern-city', 'northern-village', 'central-coast'] as const)[i % 3],
              family: (
                ['both', 'father-only', 'mother-only', 'with-father', 'with-mother'] as const
              )[i % 5],
              environment: i % 2 ? 'urban' : 'rural',
            }
          : {}),
      };
      let r = createRun('annual-diversity-' + i, setup);
      const ids: string[] = [];
      for (let step = 0; step < 50 && ids.length < 10; step++) {
        if (!r.activeEvent) r = advance(r);
        else {
          const e = activeDefinition(r)!;
          ids.push(e.id);
          counts[e.id] = (counts[e.id] ?? 0) + 1;
          visibleAges[Math.floor(r.month / 12)] = (visibleAges[Math.floor(r.month / 12)] ?? 0) + 1;
          if (e.id === 'ordinary-days') fallback++;
          r = choose(r, e.id, e.choices.find((c) => !choiceReason(r, c))!.id);
        }
      }
      openings.add(ids[0]);
      first5.add(ids.slice(0, 5).join('|'));
      first10.add(ids.join('|'));
    }
    reports.push({
      rules,
      sample: varied ? '200 varied setups' : '200 same setup',
      authoredOpeningTemplates: openings.size,
      uniqueFirst5: first5.size,
      uniqueFirst10: first10.size,
      fallback,
      visibleAges,
      templateCounts: counts,
    });
  }
writeFileSync(
  'docs/evidence/yearly-diversity-200.json',
  JSON.stringify(
    {
      note: 'Actual template IDs. The annual opening is newborn age0; career-v1 begins at age3, so the opening pools are different life stages, not a direct quality ratio.',
      reports,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify(
    reports.map(({ templateCounts, visibleAges, ...r }) => ({
      ...r,
      authoredTemplates: Object.keys(templateCounts).length,
      displayedAgeCount: Object.keys(visibleAges).length,
    })),
    null,
    2,
  ),
);
