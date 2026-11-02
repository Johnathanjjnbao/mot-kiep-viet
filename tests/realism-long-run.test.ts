import { familyStart, growFamily } from '../scripts/family-fixture';
import { talk } from '../scripts/social-fixture';
import { found } from '../scripts/business-fixture';
import { startChannel, creatorStep } from '../scripts/creator-economy-fixture';
import { admittedStudent, advanceStudy } from '../scripts/academic-fixture';
import { dispatch, replay, createRun } from '../src/engine/engine';
import { assertRun } from '../src/engine/invariants';
import { canonical, snapshot, parseSave } from '../src/persistence/saves';
import { discretionaryCount } from '../src/domain/rules';
import { ageOf } from '../src/content/world';
import { writeFileSync } from 'node:fs';
import { it, expect } from 'vitest';
it('reconciles university, three children, shop, channel,120 operations and natural life beyond100', () => {
  function report(r: ReturnType<typeof createRun>) {
    assertRun(r);
    if (canonical(replay(r.seed, r.setup, r.actions)) !== canonical(r)) throw Error('replay');
    parseSave(JSON.stringify(snapshot(r)));
    return {
      seed: r.seed,
      age: ageOf(r),
      actions: r.actions.length,
      bytes: Buffer.byteLength(JSON.stringify(snapshot(r))),
      transactions: r.finance.transactions.length + r.childhoodFinance!.transactions.length,
      children: r.family?.children.length,
    };
  }
  let r = familyStart('realism-v1', 'vnd-v1');
  expect(r.setup.lifeRules).toBe('realism-v1');
  r = found(r, 4_000_000);
  r = startChannel(r);
  r = growFamily(r, 23);
  for (const age of [25, 27, 29, 31]) {
    if (r.family!.children.length >= 3) break;
    r = talk(r, 'soc-child-plan', 'friend', 'plan-child');
    r = growFamily(r, age);
  }
  while (discretionaryCount(r) < 120) {
    const c = r.creator!.channels[0];
    r = dispatch(r, {
      type: 'creator',
      operation: 'policy',
      id: 'creator:0',
      policy: { ...c.policy, focus: c.policy.focus === 'craft' ? 'community' : 'craft' },
      expected: r.actions.length,
    });
  }
  for (let i = 0; i < 500 && r.status !== 'ended'; i++) r = creatorStep(r);
  expect(r.family!.children.length).toBeGreaterThanOrEqual(3);
  expect(r.status).toBe('ended');
  expect(r.actions.length).toBeLessThanOrEqual(512);
  expect(ageOf(r)).toBeGreaterThan(100);
  const output: { status: string; family: object; university?: object; longLife?: object } = {
    status: 'VERIFIED PASS',
    family: {
      ...report(r),
      optional: discretionaryCount(r),
      shops: r.enterprise!.ventures.length,
      channels: r.creator!.channels.length,
    },
  };
  let student = admittedStudent('korean', 0, 'realism-v1', 'vnd-v1').run;
  student = advanceStudy(student, 'steady', 2);
  output.university = report(student);
  expect(student.academics!.studies[0].completedYears).toBeGreaterThanOrEqual(2);
  let long = createRun('realism-canonical', {
    cohort: 2005,
    region: 'northern-village',
    wealth: 4,
    family: 'both',
    lifeRules: 'realism-v1',
    currency: 'vnd-v1',
    expansion: 'family',
  });
  for (let i = 0; i < 512 && long.status !== 'ended'; i++) long = creatorStep(long);
  output.longLife = report(long);
  expect(long.status).toBe('ended');
  expect(ageOf(long)).toBeGreaterThan(100);
  writeFileSync('docs/evidence/realism-forced-paths.json', JSON.stringify(output, null, 2) + '\n');
}, 120_000);
