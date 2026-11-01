import { canonical, snapshot, MAX_SAVE_BYTES } from '../src/persistence/saves';
import { mkdirSync, writeFileSync } from 'node:fs';
import { COHORTS, REGIONS, ageOf } from '../src/content/world';
import { netWorth } from '../src/engine/finance';
import { simulateLife } from '../src/diagnostics/simulation';
import { activeDefinition, choiceReason, replay } from '../src/engine/engine';
import { FAMILIES, PARENT_TRAITS } from '../src/domain/creator';
import type { RunSetup, ParentTrait } from '../src/domain/model';
import { randomizeCreatorTraits } from '../src/application/creatorRandom';
import { stageTemplate } from '../src/content/academic-stages';
const total = Number(process.argv[2] ?? 1000);
const testCreator = process.argv.includes('--creator');
const testDiversity = process.argv.includes('--dynamic');
const testEducation = process.argv.includes('--education');
const testEmployment = process.argv.includes('--employment');
const testAnnual = process.argv.includes('--annual');
if (!Number.isInteger(total) || total < 1 || total > 10000) throw new Error('Choose 1–10000 runs');
const report = {
  runs: 0,
  replayChecked: 0,
  creatorRuns: 0,
  fallbackEvents: 0,
  admissions: { accepted: 0, rejected: 0 },
  employment: {
    accepted: 0,
    rejected: 0,
    supportedPlacements: 0,
    layoffs: 0,
    contractsEnded: 0,
    resignations: 0,
    switches: 0,
    outOfField: 0,
    longestUnemployment: 0,
    unemployedMonths: 0,
    reemployedPeriods: 0,
    trainings: 0,
  },
  academics: { graduated: 0, failed: 0, dropped: 0, switched: 0, paused: 0, internships: 0 },
  maxActions: 0,
  familyChildren: 0,
  adultChildren: 0,
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
  ...(testAnnual
    ? {
        annual: {
          missingAges: 0,
          maxSkippedAge: 0,
          completedDecisions: 0,
          templateCounts: {} as Record<string, number>,
          remediationVariants: 0,
        },
      }
    : {}),
  families: {} as Record<string, number>,
};
const observed = new Set<string>();
for (let i = 0; i < total; i++) {
  const cohort = i % 4 === 0 ? COHORTS[i % 3] : 1975 + (i % 52),
    region = REGIONS[Math.floor(i / 3) % 3].id,
    seed = `stress-${i}`;
  try {
    const presented = new Set<string>();
    const family = (Object.keys(FAMILIES) as NonNullable<RunSetup['family']>[])[
      Math.floor(i / 5) % 5
    ];
    const run = simulateLife(
      seed,
      {
        expansion: i % 4 === 0 ? 'wardrobe' : i % 4 === 1 ? 'social' : 'family',
        cohort,
        region,
        name: `Nguyễn An ${i}`,
        birthplace: `Quê nhà ${i}`,
        environment: i % 2 ? 'urban' : 'rural',
        wealth: (i % 5) as RunSetup['wealth'],
        family,
        motherTraits: [Object.keys(PARENT_TRAITS)[i % 10] as ParentTrait],
        fatherTraits: [],
        ...(testAnnual
          ? { lifeRules: 'annual-v1' as const }
          : testEmployment
            ? { lifeRules: 'career-v1' as const }
            : testEducation
              ? { lifeRules: 'education-v1' as const }
              : testDiversity
                ? { lifeRules: 'dynamic-v1' as const }
                : {}),
        ...(testCreator && i % 2 === 0
          ? {
              playerTraits: randomizeCreatorTraits(
                { player: [], mother: [], father: [] },
                seed,
                ['player'],
                { player: i % 7, mother: 0, father: 0 },
                { player: false, mother: false, father: false },
              ).player,
            }
          : {}),
      },
      i % 5,
      (r) => {
        const e = activeDefinition(r);
        if (e) {
          if (testAnnual) {
            const key = `${r.month}:${e.id}:${r.choices.length}`;
            if (presented.has(key)) return;
            presented.add(key);
            const study = r.academics?.studies.find((s) => s.id === r.academics?.focus?.studyId);
            const rawTemplate = study
              ? stageTemplate(r, study).id
              : (r.social?.focus?.templateId ?? r.family?.focus?.templateId ?? e.id);
            if (rawTemplate.endsWith('-remediation')) report.annual!.remediationVariants++;
            const template = rawTemplate.replace(/-remediation$/, '');
            report.annual!.templateCounts[template] =
              (report.annual!.templateCounts[template] ?? 0) + 1;
          }
          if (e.id === 'ordinary-days') report.fallbackEvents++;
          const n = e.choices.filter((c) => !choiceReason(r, c)).length;
          report.enabledChoices.min = Math.min(report.enabledChoices.min, n);
          report.enabledChoices.max = Math.max(report.enabledChoices.max, n);
          report.enabledChoices.eventsChecked++;
        }
      },
    );
    if (canonical(replay(run.seed, run.setup, run.actions)) !== canonical(run))
      throw Error('Replay divergence');
    report.replayChecked++;
    if (testAnnual) {
      const ages = [...new Set(run.choices.map((c) => Math.floor(c.month / 12)))];
      for (let age = 0; age < ageOf(run); age++)
        if (!ages.includes(age)) report.annual!.missingAges++;
      for (let j = 1; j < ages.length; j++)
        report.annual!.maxSkippedAge = Math.max(
          report.annual!.maxSkippedAge,
          ages[j] - ages[j - 1] - 1,
        );
      report.annual!.completedDecisions += run.choices.length;
    }
    for (const a of run.employment?.applications ?? []) report.employment[a.result]++;
    if (run.employment) {
      report.employment.supportedPlacements += run.employment.placements.length;
      report.employment.trainings += run.employment.trainingMonths.length;
      for (const p of run.employment.periods) {
        const months = (p.endMonth ?? run.month) - p.startMonth;
        report.employment.unemployedMonths += months;
        report.employment.longestUnemployment = Math.max(
          report.employment.longestUnemployment,
          months,
        );
        if (
          months > 0 &&
          p.endMonth !== null &&
          run.player.careers.some((c) => c.startMonth === p.endMonth)
        )
          report.employment.reemployedPeriods++;
      }
      for (const c of run.player.careers) {
        if (c.ending === 'layoff') report.employment.layoffs++;
        if (c.ending === 'contract-ended') report.employment.contractsEnded++;
        if (c.ending === 'resigned') report.employment.resignations++;
        if (c.ending === 'switched') report.employment.switches++;
        if (c.field === 'outside') report.employment.outOfField++;
      }
    }
    for (const a of run.academics?.applications ?? []) report.admissions[a.result]++;
    for (const s of run.academics?.studies ?? []) {
      if (s.status !== 'studying') report.academics[s.status]++;
      if (s.internship) report.academics.internships++;
    }
    if (run.setup.playerTraits) report.creatorRuns++;
    report.maxActions = Math.max(report.maxActions, run.actions.length);
    report.familyChildren += run.family?.children.length ?? 0;
    report.adultChildren += run.family?.children.filter((c) => c.occupation).length ?? 0;
    const bytes = new TextEncoder().encode(JSON.stringify(snapshot(run))).length;
    report.maxSaveBytes = Math.max(report.maxSaveBytes, bytes);
    if (bytes > MAX_SAVE_BYTES || run.actions.length > 512) throw Error('Save limit');
    report.wardrobePurchases += run.finance.transactions.filter((t) =>
      t.id.startsWith('wardrobe:buy:'),
    ).length;
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
    if (testAnnual) Object.keys(report.annual!.templateCounts).forEach((id) => observed.add(id));
    else run.choices.forEach((c) => observed.add(c.eventId.split('@')[0]));
  } catch (error) {
    report.invariantViolations++;
    report.failures.push({ seed, message: error instanceof Error ? error.message : String(error) });
    if (testEmployment)
      console.error(`${seed}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if ((i + 1) % 100 === 0)
    console.log(`${i + 1}/${total} lives · ${report.invariantViolations} violations`);
}
report.ages.mean = Number((report.ages.mean / report.runs).toFixed(2));
report.finances.meanNetWorth = Math.round(report.finances.meanNetWorth / report.runs);
report.observedEventIds = [...observed].sort();
mkdirSync('docs/evidence', { recursive: true });
writeFileSync(
  process.env.MKV_SIMULATION_REPORT ?? 'docs/evidence/simulation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify({ ...report, observedEventIds: `${observed.size} distinct events` }, null, 2),
);
if (report.failures.length) process.exitCode = 1;
