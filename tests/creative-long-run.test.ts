import { it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { creativeFullPortfolio, nativeLongStep } from '../scripts/creative-forced-fixture';
import { dispatch, replay } from '../src/engine/engine';
import { assertRun } from '../src/engine/invariants';
import { ageOf } from '../src/content/world';
import { discretionaryCount, detailedBooks } from '../src/domain/rules';
import { snapshot, canonical, parseSave } from '../src/persistence/saves';
import { lifeSummary } from '../src/application/summary';
it('finishes a real degree/three-child/job/shop/channel/contracts/art/gaming/collab life with all120 optional actions inside512/5MiB', () => {
  let r = creativeFullPortfolio();
  expect(r.family!.children.length).toBeGreaterThanOrEqual(3);
  expect(r.academics!.qualifications.length).toBeGreaterThan(0);
  expect(detailedBooks(r)).toBe(4);
  expect(r.creative!.artist!.showCount).toBeGreaterThan(0);
  expect(r.creative!.gaming).not.toBeNull();
  while (discretionaryCount(r) < 120) {
    r = dispatch(r, {
      type: 'manage',
      action: r.finance.savings ? 'withdraw-money' : 'save-money',
    });
    assertRun(r);
  }
  expect(() => dispatch(r, { type: 'manage', action: 'save-money' })).toThrow(/lượt/);
  for (let i = 0; i < 512 && r.status !== 'ended'; i++) r = nativeLongStep(r);
  expect(r.status).toBe('ended');
  expect(r.actions.length).toBeLessThanOrEqual(512);
  expect(discretionaryCount(r)).toBe(120);
  assertRun(r);
  const bytes = Buffer.byteLength(JSON.stringify(snapshot(r)));
  expect(bytes).toBeLessThan(5 * 1024 * 1024);
  expect(canonical(replay(r.seed, r.setup, r.actions))).toBe(canonical(r));
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  expect(lifeSummary(r).biography).toContain('Hợp đồng khách hàng');
  expect(lifeSummary(r).biography).toContain('Gaming trên một kênh');
  expect(lifeSummary(r).biography).toContain('Biểu diễn:');
  writeFileSync(
    'docs/evidence/creative-forced-paths.json',
    JSON.stringify(
      {
        status: 'LOCAL PASS',
        seed: r.seed,
        age: ageOf(r),
        actions: r.actions.length,
        optional: discretionaryCount(r),
        bytes,
        postings: r.finance.transactions.length + r.childhoodFinance!.transactions.length,
        children: r.family!.children.length,
        degree: r.academics!.qualifications[0].programId,
        books: detailedBooks(r),
        project: r.freelance!.projects[0].ending,
        gaming: !!r.creative!.gaming,
        collaboration: r.creative!.collaborations[0].status,
        shows: r.creative!.artist!.showCount,
      },
      null,
      2,
    ),
  );
}, 120000);
