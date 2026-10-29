import { mkdirSync, writeFileSync } from 'node:fs';
import { COHORTS, REGIONS, ageOf } from '../src/content/world';
import { netWorth } from '../src/engine/finance';
import { simulateLife } from '../src/diagnostics/simulation';
const total = Number(process.argv[2] ?? 1000);
if (!Number.isInteger(total) || total < 1 || total > 10000) throw new Error('Choose 1–10000 runs');
const report = {
  runs: 0,
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
};
const observed = new Set<string>();
for (let i = 0; i < total; i++) {
  const cohort = COHORTS[i % 3],
    region = REGIONS[Math.floor(i / 3) % 3].id,
    seed = `stress-${i}`;
  try {
    const run = simulateLife(seed, { cohort, region }, i % 5);
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
writeFileSync('docs/evidence/simulation.json', JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify({ ...report, observedEventIds: `${observed.size} distinct events` }, null, 2),
);
if (report.failures.length) process.exitCode = 1;
