import { writeFileSync } from 'node:fs';
import {
  createRun,
  advance,
  choose,
  activeDefinition,
  eventEligible,
  choiceReason,
  replay,
} from '../src/engine/engine';
import { EVENTS } from '../src/content/events';
import { canonical } from '../src/persistence/saves';
import { REGIONS } from '../src/content/world';
import type { RunSetup } from '../src/domain/model';

const rules = process.argv[2] === 'dynamic-v1';
const output = process.argv[3] ?? 'docs/evidence/m5-diversity-before.json';
const samples = [];
for (const mode of ['same', 'diverse']) {
  const lives = [];
  const categories: Record<string, number> = {},
    coverage = new Set<string>();
  const openingCounts: Record<string, number> = {};
  for (let i = 0; i < 200; i++) {
    const setup: RunSetup = {
      expansion: 'family',
      cohort: mode === 'same' ? 1995 : 1975 + (i % 52),
      region: mode === 'same' ? 'northern-village' : REGIONS[i % 3].id,
      wealth: mode === 'same' ? 2 : ((i % 5) as RunSetup['wealth']),
      family:
        mode === 'same'
          ? 'both'
          : (['both', 'father-only', 'mother-only', 'with-father', 'with-mother'] as const)[i % 5],
      motherTraits: ['academic'],
      fatherTraits: [],
      playerTraits: ['Hay tò mò'],
      ...(rules ? { lifeRules: 'dynamic-v1' } : {}),
    };
    let run = createRun('diversity-' + i, setup);
    const scenes = [],
      pools = [];
    while (scenes.length < 10 && run.status !== 'ended') {
      if (!run.activeEvent) run = advance(run);
      if (!run.activeEvent) break;
      const event = activeDefinition(run)!;
      const eligible = EVENTS.filter((e) => eventEligible(run, e));
      const priority = Math.max(...eligible.map((e) => e.priority));
      pools.push({
        age: Math.floor(run.month / 12),
        eligible: eligible.length,
        topPriority: priority,
        topCandidates: eligible.filter((e) => e.priority === priority).map((e) => e.id),
      });
      scenes.push(event.id);
      categories[event.category] = (categories[event.category] ?? 0) + 1;
      coverage.add(event.id);
      run = choose(run, event.id, event.choices.find((c) => !choiceReason(run, c))!.id);
    }
    if (canonical(replay(run.seed, run.setup, run.actions)) !== canonical(run))
      throw Error('Opening replay mismatch');
    openingCounts[scenes[0]] = (openingCounts[scenes[0]] ?? 0) + 1;
    lives.push({
      seed: run.seed,
      setup: run.setup,
      firstFive: scenes.slice(0, 5),
      firstTen: scenes,
      pools,
    });
  }
  samples.push({
    mode,
    seeds: lives.length,
    uniqueFirstFive: new Set(lives.map((x) => x.firstFive.join('|'))).size,
    uniqueFirstTen: new Set(lives.map((x) => x.firstTen.join('|'))).size,
    openingCounts,
    categories,
    observed: [...coverage].sort(),
    fallbackCount: lives.reduce(
      (n, l) => n + l.firstTen.filter((id) => id === 'ordinary-days').length,
      0,
    ),
    lives,
  });
}
writeFileSync(
  output,
  JSON.stringify({ rules: rules ? 'dynamic-v1' : 'released', samples }) + '\n',
);
console.log(
  JSON.stringify(
    samples.map((sample) => ({ ...sample, lives: undefined })),
    null,
    2,
  ),
);
