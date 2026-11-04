import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { assetsGoldenRuns, assetsLoanCapacity } from './assets-golden-fixture';
import { assetsCombined } from './assets-combined-fixture';
import { assetsAdult, assetsStep, assetAction } from './living-assets-fixture';
import { currentCareer } from '../src/content/world';
import { dispatch } from '../src/engine/engine';
import { assertRun } from '../src/engine/invariants';
import { discretionaryCount, storyCapacityReason } from '../src/domain/rules';
import { snapshot, parseSave, canonical, MAX_SAVE_BYTES } from '../src/persistence/saves';
import type { GameRun } from '../src/domain/model';
const runs = assetsGoldenRuns(),
  early = assetsCombined(0, 40),
  late = assetsCombined();
const cases: Record<string, GameRun> = {
  ...runs,
  'shared120-life': early.run,
  'loan-record-limit': assetsLoanCapacity(),
};
let churn = assetAction(assetsAdult(), { operation: 'buy', item: 'bicycle' }),
  boundary: GameRun | undefined;
for (let i = 0; i < 512 && churn.status !== 'ended'; i++) {
  if (currentCareer(churn) && !storyCapacityReason(churn))
    churn = dispatch(churn, { type: 'manage', action: 'quit-job' });
  if (storyCapacityReason(churn) && !boundary) boundary = churn;
  churn = assetsStep(churn);
}
cases['reserve-boundary-churn'] = churn;
const results = [];
for (const [name, r] of Object.entries(cases)) {
  assertRun(r);
  const text = JSON.stringify(snapshot(r)),
    bytes = Buffer.byteLength(text);
  if (bytes > MAX_SAVE_BYTES || r.actions.length > 512 || discretionaryCount(r) > 120)
    throw Error('Limit ' + name);
  if (canonical(parseSave(text).run) !== canonical(r)) throw Error('Canonical ' + name);
  const attained = [...new Set(r.choices.map((c) => Math.floor(c.month / 12)))];
  for (let age = 0; age < Math.floor(r.month / 12); age++)
    if (!attained.includes(age)) throw Error('Missing age ' + name + ':' + age);
  results.push({
    name,
    seed: r.seed,
    status: r.status,
    age: r.month / 12,
    actions: r.actions.length,
    optional: discretionaryCount(r),
    bytes,
    loans: r.livingAssets!.loans.length,
    outstanding: r.livingAssets!.loans.reduce((n, l) => n + l.principal, 0),
    owned: r.livingAssets!.owned.length,
    qualifications: r.academics!.qualifications.length,
    children: r.family!.children.length,
    careers: r.player.careers.length,
    books: r.enterprise!.ventures.length + r.creator!.channels.length,
    missingAges: 0,
    canonical: 'PASS',
  });
}
if (!boundary) throw Error('Missing real reserve boundary');
let rejected = false;
try {
  dispatch(boundary, { type: 'manage', action: 'save-money' });
} catch (e) {
  rejected = String(e).includes('Cần giữ phần bản lưu');
}
if (!rejected) throw Error('Optional command was accepted at reserve boundary');
const malformed = JSON.parse(JSON.stringify(snapshot(churn)));
while (malformed.run.actions.length < 513) malformed.run.actions.push({ type: 'advance' });
let oversizedRejected = false;
try {
  parseSave(JSON.stringify(malformed));
} catch {
  oversizedRejected = true;
}
if (!oversizedRejected) throw Error('513-action input accepted');
const report = {
  status: 'VERIFIED PASS',
  sourceSHA: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  cases: results,
  combined: {
    lateReplacements: late.swaps,
    changedJob: late.changedJob,
    earlyOptional: discretionaryCount(early.run),
  },
  reserveBoundary: {
    age: boundary.month / 12,
    actions: boundary.actions.length,
    projected:
      boundary.actions.length + 2 * Math.max(0, 160 - Math.floor(boundary.month / 12)) + 40,
    rejected,
    continuedToNaturalEnd: churn.status === 'ended',
  },
  negative513InputRejected: oversizedRejected,
  notes: [
    'Reserve boundary is reached by the projected remaining story budget; actual action counts are reported separately. No claim that a canonical life reached511 actions.',
    'The malformed513 input is a negative parser test, not a playable or canonical life.',
    'Opening/contract-limit cases are partial canonical fixtures; completed lives are marked ended.',
  ],
};
writeFileSync('docs/evidence/assets-forced-paths.json', JSON.stringify(report, null, 2) + '\n');
writeFileSync(
  '.local/assets-forced-checkpoints.json',
  JSON.stringify({
    acquired: snapshot(late.checkpoints.acquired),
    last: snapshot(late.checkpoints['last-decision']),
    ended: snapshot(late.run),
    long: snapshot(runs['long-life']),
    outstanding: snapshot(runs['outstanding-death']),
  }),
);
console.log(JSON.stringify(report));
