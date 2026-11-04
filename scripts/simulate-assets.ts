import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { simulateLife } from '../src/diagnostics/simulation';
import { REGIONS } from '../src/content/world';
import { FAMILIES } from '../src/domain/creator';
import type { GameRun, RunSetup } from '../src/domain/model';
import { activeDefinition, choiceReason } from '../src/engine/engine';
import { canonical, parseSave, snapshot, MAX_SAVE_BYTES } from '../src/persistence/saves';
import { discretionaryCount } from '../src/domain/rules';
import { assertRun } from '../src/engine/invariants';
const count = Number(process.argv[2] ?? 1000);
if (!Number.isInteger(count) || count < 1 || count > 10000) throw Error('Choose 1–10000 lives');
const families = Object.keys(FAMILIES) as NonNullable<RunSetup['family']>[];
const authorityHash = createHash('sha256');
for (const dir of ['src/domain', 'src/engine', 'src/content', 'src/diagnostics'])
  for (const file of (readdirSync(dir, { recursive: true }) as string[])
    .filter((f) => f.endsWith('.ts'))
    .sort())
    authorityHash
      .update(dir + '/' + file.replaceAll('\\', '/') + '\0')
      .update(readFileSync(dir + '/' + file));
authorityHash.update(readFileSync('src/persistence/saves.ts'));
const report = {
  authoritySHA256: authorityHash.digest('hex'),
  sourceSHA: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  startedAt: new Date().toISOString(),
  status: 'INCOMPLETE',
  ruleset: 'assets-v1',
  runs: 0,
  replays: 0,
  invariantFailures: 0,
  replayMismatches: 0,
  maxActions: 0,
  maxOptional: 0,
  maxSaveBytes: 0,
  maxReplayMs: 0,
  totalReplayMs: 0,
  maxHeapBytes: 0,
  minAge: 1000,
  maxAge: 0,
  fallbackCount: 0,
  missingAges: 0,
  skippedAges: 0,
  duplicateTransactions: 0,
  invalidAssetRecords: 0,
  invalidEraAssets: 0,
  unaffordablePurchasesAccepted: 0,
  minimumEnabledChoices: 100,
  assetOwners: 0,
  renters: 0,
  borrowers: 0,
  ownedCategories: {} as Record<string, number>,
  operations: {} as Record<string, number>,
  scenes: {} as Record<string, number>,
  failures: [] as { seed: string; message: string }[],
};
let longest: GameRun | undefined, largest: GameRun | undefined;
const start = performance.now();
for (let i = 0; i < count; i++) {
  const seed = 'assets-release-' + i,
    presented = new Set<string>();
  try {
    const setup: RunSetup = {
      cohort: [1975, 1995, 2005, 2026][i % 4],
      region: REGIONS[i % REGIONS.length].id,
      wealth: (i % 5) as 0 | 1 | 2 | 3 | 4,
      family: families[i % families.length],
      expansion: 'family',
      lifeRules: 'assets-v1',
      currency: 'vnd-v1',
      motherTraits: i % 2 ? ['academic'] : ['gentle'],
      fatherTraits: i % 2 ? ['generous'] : ['strict'],
    };
    const run = simulateLife(seed, setup, i % 5, (r) => {
      const e = activeDefinition(r);
      if (!e) return;
      report.minimumEnabledChoices = Math.min(
        report.minimumEnabledChoices,
        e.choices.filter((c) => !choiceReason(r, c)).length,
      );
      const key = e.id + ':' + r.month;
      if (!presented.has(key)) {
        presented.add(key);
        if (e.id === 'ordinary-days') report.fallbackCount++;
        if (e.version === 17) report.scenes[e.id] = (report.scenes[e.id] ?? 0) + 1;
      }
    });
    assertRun(run);
    const text = JSON.stringify(snapshot(run)),
      bytes = Buffer.byteLength(text);
    if (bytes > MAX_SAVE_BYTES || run.actions.length > 512 || discretionaryCount(run) > 120)
      throw Error('Save/action limit');
    const t = performance.now(),
      rebuilt = parseSave(text).run,
      duration = performance.now() - t;
    report.maxReplayMs = Math.max(report.maxReplayMs, duration);
    report.totalReplayMs += duration;
    if (canonical(rebuilt) !== canonical(run)) {
      report.replayMismatches++;
      throw Error('Canonical replay mismatch');
    }
    report.replays++;
    const reached = [...new Set(run.choices.map((c) => Math.floor(c.month / 12)))];
    for (let age = 0; age < Math.floor(run.month / 12); age++)
      if (!reached.includes(age)) report.missingAges++;
    for (let j = 1; j < reached.length; j++)
      report.skippedAges += Math.max(0, reached[j] - reached[j - 1] - 1);
    if (new Set(run.finance.transactions.map((t) => t.id)).size !== run.finance.transactions.length)
      report.duplicateTransactions++;
    const actions = run.actions.filter((a) => a.type === 'living-assets');
    if (actions.some((a) => a.operation === 'buy' || a.operation === 'build')) report.assetOwners++;
    if (actions.some((a) => a.operation === 'rent')) report.renters++;
    if (run.livingAssets!.loans.length) report.borrowers++;
    for (const a of actions)
      report.operations[a.operation] = (report.operations[a.operation] ?? 0) + 1;
    for (const a of run.livingAssets!.owned)
      report.ownedCategories[a.category] = (report.ownedCategories[a.category] ?? 0) + 1;
    report.maxActions = Math.max(report.maxActions, run.actions.length);
    report.maxOptional = Math.max(report.maxOptional, discretionaryCount(run));
    report.maxSaveBytes = Math.max(report.maxSaveBytes, bytes);
    report.maxHeapBytes = Math.max(report.maxHeapBytes, process.memoryUsage().heapUsed);
    report.minAge = Math.min(report.minAge, run.month / 12);
    report.maxAge = Math.max(report.maxAge, run.month / 12);
    if (!longest || run.actions.length > longest.actions.length) longest = run;
    if (!largest || bytes > Buffer.byteLength(JSON.stringify(snapshot(largest)))) largest = run;
    report.runs++;
  } catch (error) {
    report.invariantFailures++;
    report.failures.push({ seed, message: error instanceof Error ? error.message : String(error) });
    console.error(seed + ': ' + report.failures.at(-1)!.message);
  }
  if ((i + 1) % 100 === 0)
    console.log(
      `${i + 1}/${count} · failures ${report.invariantFailures} · max actions ${report.maxActions}`,
    );
}
report.status =
  report.runs === count &&
  !report.invariantFailures &&
  !report.replayMismatches &&
  !report.fallbackCount &&
  !report.missingAges &&
  !report.skippedAges &&
  !report.duplicateTransactions
    ? 'VERIFIED PASS'
    : 'FAIL';
writeFileSync(
  `docs/evidence/assets-${count}-lives.json`,
  JSON.stringify(
    {
      ...report,
      elapsedMs: performance.now() - start,
      averageReplayMs: report.totalReplayMs / Math.max(1, report.replays),
      notes: [
        'invalid asset/era/affordability checks run inside every authoritative action and assertRun; failures are in invariantFailures',
        'Heap is a Node QA sample, not proof of browser leak behavior.',
        'Scene reachability additionally checked by25 canonical authored fixtures.',
      ],
    },
    null,
    2,
  ) + '\n',
);
if (longest) writeFileSync('.local/assets-high-actions.json', JSON.stringify(snapshot(longest)));
if (largest) writeFileSync('.local/assets-largest-save.json', JSON.stringify(snapshot(largest)));
console.log(
  JSON.stringify({
    status: report.status,
    runs: report.runs,
    replays: report.replays,
    maxActions: report.maxActions,
    maxSaveBytes: report.maxSaveBytes,
    maxAge: report.maxAge,
    failures: report.failures,
  }),
);
if (report.status !== 'VERIFIED PASS') process.exitCode = 1;
