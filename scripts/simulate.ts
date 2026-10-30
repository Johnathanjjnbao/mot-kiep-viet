import { canonical, snapshot, MAX_SAVE_BYTES } from '../src/persistence/saves';
import { mkdirSync, writeFileSync } from 'node:fs';
import { COHORTS, REGIONS, ageOf } from '../src/content/world';
import { netWorth } from '../src/engine/finance';
import { simulateLife } from '../src/diagnostics/simulation';
import { activeDefinition, choiceReason, replay } from '../src/engine/engine';
import { FAMILIES, PARENT_TRAITS } from '../src/domain/creator';
import type { RunSetup, ParentTrait } from '../src/domain/model';
const total = Number(process.argv[2] ?? 1000);
if (!Number.isInteger(total) || total < 1 || total > 10000) throw new Error('Choose 1–10000 runs');
const report = {
  runs: 0,
  replayChecked: 0,
  wardrobePurchases: 0,
  maxSaveBytes: 0,
  seedPattern: 'stress-0 … stress-N (N = runs - 1)',
  invariantViolations: 0,
  endings: { death: 0, memoir: 0 },
  cohorts: {} as Record<string, number>,
  regions: {} as Record<string, number>,
  ages: { min: 82, max: 0, mean: 0 },
  finances: { meanNetWorth: 0, minNetWorth: Infinity, maxNetWorth: -Infinity },
  arcs: { business: 0, family: 0, recovery: 0 },
  business: { profit: 0, loss: 0, exited: 0 },
  observedEventIds: [] as string[],
  failures: [] as { seed: string; message: string }[],
  enabledChoices: { min: 6, max: 0, eventsChecked: 0 },
  families: {} as Record<string, number>,
};
const observed = new Set<string>();
for (let i = 0; i < total; i++) {
  const cohort = i % 4 === 0 ? COHORTS[i % 3] : 1975 + (i % 52),
    region = REGIONS[Math.floor(i / 3) % 3].id,
    seed = `stress-${i}`;
  try {
    const family = (Object.keys(FAMILIES) as NonNullable<RunSetup['family']>[])[
      Math.floor(i / 5) % 5
    ];
    const run = simulateLife(
      seed,
      {
        cohort,
        region,
        name: `Nguyễn An ${i}`,
        birthplace: `Quê nhà ${i}`,
        environment: i % 2 ? 'urban' : 'rural',
        wealth: (i % 5) as RunSetup['wealth'],
        family,
        motherTraits: [Object.keys(PARENT_TRAITS)[i % 10] as ParentTrait],
        fatherTraits: [],
      },
      i % 5,
      (r) => {
        const e = activeDefinition(r);
        if (e) {
          const n = e.choices.filter((c) => !choiceReason(r, c)).length;
          report.enabledChoices.min = Math.min(report.enabledChoices.min, n);
          report.enabledChoices.max = Math.max(report.enabledChoices.max, n);
          report.enabledChoices.eventsChecked++;
        }
      },
    );
    if (canonical(replay(run.seed,run.setup,run.actions)) !== canonical(run)) throw Error('Replay divergence');
    report.replayChecked++;
    const bytes = new TextEncoder().encode(JSON.stringify(snapshot(run))).length;
    report.maxSaveBytes = Math.max(report.maxSaveBytes,bytes);
    if (bytes > MAX_SAVE_BYTES || run.actions.length > 512) throw Error('Save limit');
    report.wardrobePurchases += run.finance.transactions.filter(t=>t.id.startsWith('wardrobe:buy:')).length;
    report.families[family] = (report.families[family] ?? 0) + 1;
    report.runs++;
    report.cohorts[cohort] = (report.cohorts[cohort] ?? 0) + 1;
    report.regions[region] = (report.regions[region] ?? 0) + 1;
    report.endings[run.ending!]++;
    const age = ageOf(run),
      worth = netWorth(run);
    report.ages.min = Math.min(report.ages.min, age);
    report.ages.max = Math.max(report.ages.max, age);
    report.ages.mean += age;
    report.finances.meanNetWorth += worth;
    report.finances.minNetWorth = Math.min(report.finances.minNetWorth, worth);
    report.finances.maxNetWorth = Math.max(report.finances.maxNetWorth, worth);
    if (run.flags['business-complete']) report.arcs.business++;
    if (run.flags['family-complete']) report.arcs.family++;
    if (run.flags['recovery-complete']) report.arcs.recovery++;
    if (run.flags['business-profited']) report.business.profit++;
    if (run.flags['business-lost']) report.business.loss++;
    if (run.flags['business-exited']) report.business.exited++;
    run.choices.forEach((c) => observed.add(c.eventId));
  } catch (error) {
    report.invariantViolations++;
    report.failures.push({ seed, message: error instanceof Error ? error.message : String(error) });
  }
  if ((i + 1) % 100 === 0)
    console.log(`${i + 1}/${total} lives · ${report.invariantViolations} violations`);
}
report.ages.mean = Number((report.ages.mean / report.runs).toFixed(2));
report.finances.meanNetWorth = Math.round(report.finances.meanNetWorth / report.runs);
report.observedEventIds = [...observed].sort();
mkdirSync('docs/evidence', { recursive: true });
writeFileSync(process.env.MKV_SIMULATION_REPORT ?? 'docs/evidence/simulation.json', JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify({ ...report, observedEventIds: `${observed.size} distinct events` }, null, 2),
);
if (report.failures.length) process.exitCode = 1;
