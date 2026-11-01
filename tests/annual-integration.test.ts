import { it, expect } from 'vitest';
import { admittedStudent } from '../scripts/academic-fixture';
import { dispatch, manage, advance } from '../src/engine/engine';
import { currentStudy, studyCosts } from '../src/engine/academics';
import { currentCareer } from '../src/content/world';
import { snapshot, parseSave } from '../src/persistence/saves';
import { assertRun } from '../src/engine/invariants';

it('settles precisely six salary months for an annual birthday-spanning contract while studies stay paused', () => {
  let r = admittedStudent('it', 0, 'annual-v1').run;
  r = dispatch(r, { type: 'academic', operation: 'pause', expected: r.actions.length });
  const start = r.month,
    fees = currentStudy(r)!.paidTerms;
  r = manage(r, 'temporary-job');
  r = advance(r);
  expect(r.month).toBe(start + 6);
  expect(currentCareer(r)).toBeUndefined();
  expect(r.player.careers.at(-1)).toMatchObject({ ending: 'contract-ended', experience: 6 });
  expect(
    r.finance.transactions.filter(
      (t) =>
        t.id.endsWith(':income') && t.id.startsWith('month:') && Number(t.id.split(':')[1]) > start,
    ),
  ).toHaveLength(6);
  expect(currentStudy(r)).toMatchObject({ status: 'paused', paidTerms: fees });
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  assertRun(r);
});
it('preserves a rejected switch and closes only the previous program on an accepted annual switch', () => {
  const found = new Set<string>();
  for (let i = 0; i < 50 && found.size < 2; i++) {
    const r = admittedStudent('it', i, 'annual-v1').run;
    const old = structuredClone(currentStudy(r)!);
    const next = dispatch(r, {
      type: 'academic',
      operation: 'switch',
      program: 'korean',
      expected: r.actions.length,
    });
    const result = next.academics!.applications.at(-1)!.result;
    found.add(result);
    if (result === 'rejected') {
      expect(currentStudy(next)).toEqual(old);
      expect(next.finance.transactions).toEqual(r.finance.transactions);
    } else {
      expect(next.academics!.studies[0]).toMatchObject({ status: 'switched', endMonth: r.month });
      expect(currentStudy(next)).toMatchObject({ programId: 'korean', completedYears: 0 });
    }
    expect(next.academics!.qualifications).toHaveLength(0);
    expect(parseSave(JSON.stringify(snapshot(next))).run).toEqual(next);
  }
  expect([...found].sort()).toEqual(['accepted', 'rejected']);
});
it('records annual dropout as an attempted program and allows a new application without gifting a degree', () => {
  let r = admittedStudent('health', 0, 'annual-v1').run;
  r = dispatch(r, { type: 'academic', operation: 'dropout', expected: r.actions.length });
  expect(currentStudy(r)).toBeUndefined();
  expect(r.academics!.studies[0].status).toBe('dropped');
  expect(r.academics!.qualifications).toHaveLength(0);
  const fees = r.finance.transactions.filter((t) => t.id.endsWith(':tuition')).length;
  expect(fees).toBe(1);
  r = dispatch(r, {
    type: 'academic',
    operation: 'apply',
    program: 'design',
    expected: r.actions.length,
  });
  expect(r.academics!.studies[0].status).toBe('dropped');
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
});
it('removes conditional academic scholarship under high stress without fabricating credit', () => {
  const r = admittedStudent('health', 0, 'annual-v1').run;
  // Explicit branch fixture for the quote function, not canonical real-cloud/save evidence.
  const calm = structuredClone(r),
    stressed = structuredClone(r);
  calm.player.stats.knowledge = 100;
  calm.player.stats.stress = 20;
  stressed.player.stats.knowledge = 100;
  stressed.player.stats.stress = 71;
  expect(studyCosts(calm, 'health').scholarship).toBeGreaterThan(0);
  expect(studyCosts(stressed, 'health').scholarship).toBe(0);
  expect(studyCosts(stressed, 'health').required).toBeGreaterThan(
    studyCosts(calm, 'health').required,
  );
  expect(stressed.academics!.qualifications).toHaveLength(0);
});
