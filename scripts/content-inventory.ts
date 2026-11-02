import { EVENTS } from '../src/content/events';
import { STABLE_SCENE_META } from '../src/content/stable-events';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const evidence = 'docs/evidence/pre-hiatus-stable-1000-lives.json';
const simulation = existsSync(evidence) ? JSON.parse(readFileSync(evidence, 'utf8')) : null;
const observed = new Set<string>(simulation?.observedEventIds ?? []);
const stableFixtures = new Set<string>(
  JSON.parse(readFileSync('tests/data/stable-viewport-replays.json', 'utf8')).map(
    (r: { id: string }) => r.id,
  ),
);
const creativeFixtures = new Set<string>(
  JSON.parse(readFileSync('tests/data/creative-viewport-replays.json', 'utf8')).map(
    (r: { id: string }) => r.id,
  ),
);
const bands = [
  [0, 2],
  [3, 5],
  [6, 12],
  [13, 17],
  [18, 25],
  [26, 40],
  [41, 60],
  [61, 82],
  [83, 130],
];
const rows = EVENTS.map((e) => ({
  id: e.id,
  version: e.version,
  category: e.category,
  age: [e.condition.minAge ?? 0, e.condition.maxAge ?? null] as [number, number|null],
  era: [e.condition.minYear ?? null, e.condition.maxYear ?? null],
  region: e.condition.region ?? 'any',
  conditions: e.condition,
  context: STABLE_SCENE_META[e.id]?.requires ?? null,
  arc: STABLE_SCENE_META[e.id]?.arc ?? null,
  stage: STABLE_SCENE_META[e.id]?.stage ?? null,
  weight: e.weight,
  priority: e.priority,
  once: e.once,
  cooldown: e.cooldown,
  definedChoices: e.choices.length,
  enabledChoices:
    stableFixtures.has(e.id) || creativeFixtures.has(e.id)
      ? 4
      : 'context-dependent; runtime requires >=4',
  consequenceTypes: [...new Set(e.choices.flatMap((c) => c.effects.map((f) => f.kind)))],
  selection:
    e.version === 5
      ? 'focused-family'
      : e.version === 4
        ? 'focused-social'
        : e.version === 7 && e.id !== 'edu-direction'
          ? 'focused-academic'
          : 'main/contextual',
  reachability:
    stableFixtures.has(e.id) || creativeFixtures.has(e.id)
      ? 'canonical fixture verified'
      : observed.has(e.id)
        ? 'observed in final stable simulation'
        : 'not observed in this batch; conditional/focused/historical, not proof of unreachable',
  observedInFinalSimulation: observed.has(e.id),
}));
const summary = {
  authoredRegistry: rows.length,
  newCreative: rows.filter((e) => [13, 14, 15].includes(e.version)).length,
  newStable: rows.filter((e) => e.version === 16).length,
  stableArcs: 8,
  ageBands: bands.map(([lo, hi]) => ({
    lo,
    hi,
    potentialOverlap: rows.filter((e) => e.age[0] <= hi && (e.age[1] ?? Infinity) >= lo).length,
    focusedMinimumAge: rows.filter((e) => e.age[0] >= lo && e.age[0] <= hi).length,
    newStable: rows.filter((e) => e.version === 16 && e.age[0] >= lo && e.age[0] <= hi).length,
  })),
  notes: [
    'Registry entries count authored templates once; annual ages, academic attempts and family instances are not new authored stories.',
    'Potential overlap includes historical definitions and focused templates. It is not the eligible pool or observed frequency of one ruleset.',
    'Min-age focus is a density heuristic. Age82+ scenes use minAge82 with no maxAge and remain available beyond82; they are counted in61–82 by minimum.',
    'Versions1–3 include historical/backward-compatible content; v4 social/v5 family/v7 academic usually enter through focus rather than annual random pool.',
    'Frozen legacy copies are not counted a second time. Disabled/focused/historical entries are labeled, not silently reported reachable.',
  ],
};
writeFileSync(
  'docs/evidence/pre-hiatus-content-inventory.json',
  JSON.stringify({ summary, events: rows }, null, 2) + '\n',
);
console.log(JSON.stringify(summary, null, 2));
