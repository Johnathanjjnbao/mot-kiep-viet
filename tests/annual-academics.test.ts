import { describe, it, expect } from 'vitest';
import type { GameRun } from '../src/domain/model';
import { PROGRAMS } from '../src/content/programs';
import {
  academicStages,
  authoredAcademicStageCount,
  stageTemplate,
} from '../src/content/academic-stages';
import { EVENTS } from '../src/content/events';
import { validateContent } from '../src/content/validation';
import { admittedStudent, advanceStudy } from '../scripts/academic-fixture';
import { advance, choose, activeDefinition, choiceReason, dispatch } from '../src/engine/engine';
import { currentStudy } from '../src/engine/academics';
import { assertRun } from '../src/engine/invariants';
import { parseSave, snapshot } from '../src/persistence/saves';

function nextAssessment(input: GameRun) {
  let r = input;
  for (let i = 0; i < 60 && !r.academics?.focus; i++) {
    if (!r.activeEvent) r = advance(r);
    else {
      const e = activeDefinition(r)!;
      r = choose(
        r,
        e.id,
        e.choices.find(
          (c) =>
            !choiceReason(r, c) &&
            !c.effects.some((x) => x.kind === 'career' || x.kind === 'education'),
        )!.id,
      );
    }
  }
  expect(r.academics?.focus).toBeTruthy();
  return r;
}
describe('annual university correction and authored stages', () => {
  it.each(PROGRAMS)(
    '$id has a distinct incident each normal year, true outcomes, graduation and replay',
    (p) => {
      const { run } = admittedStudent(p.id, 0, 'annual-v1');
      const end = advanceStudy(run, 'project');
      assertRun(end);
      const s = end.academics!.studies[0];
      expect(s.status).toBe('graduated');
      const successful = s.results.filter((x) => x.passed);
      expect(new Set(successful.map((x) => x.templateId)).size).toBe(p.years);
      expect(academicStages[p.id]).toHaveLength(p.years);
      expect(s.internship).toBe(true);
      expect(end.academics!.qualifications).toHaveLength(1);
      expect(parseSave(JSON.stringify(snapshot(end))).run).toEqual(end);
    },
    120000,
  );
  it('validates all50 authored normal-stage definitions with five distinct paths, no invented licenses', () => {
    const { run } = admittedStudent('health', 0, 'annual-v1');
    const sample = currentStudy(run)!;
    const templates = PROGRAMS.flatMap((p) =>
      academicStages[p.id].map((_, year) =>
        stageTemplate(run, { ...sample, programId: p.id, completedYears: year }),
      ),
    );
    expect(authoredAcademicStageCount).toBe(50);
    expect(new Set(templates.map((e) => e.id)).size).toBe(50);
    expect(new Set(templates.map((e) => e.text)).size).toBe(50);
    expect(validateContent([...EVENTS, ...templates]).errors).toEqual([]);
  });
  it('health pause keeps paid terms/progress, charges nothing while paused, resumes prepaid assessment, then bills once', () => {
    let r = nextAssessment(admittedStudent('health', 0, 'annual-v1').run);
    const before = structuredClone(currentStudy(r)!);
    const tuition = () => r.finance.transactions.filter((t) => t.id.endsWith(':tuition')).length;
    const fees = tuition();
    const cash = r.finance.cash;
    r = choose(r, activeDefinition(r)!.id, 'pause');
    expect(r.finance.cash).toBe(cash);
    expect(currentStudy(r)).toMatchObject({
      status: 'paused',
      pausedMonth: r.month,
      paidTerms: before.paidTerms,
      completedYears: before.completedYears,
      termAttempts: before.termAttempts,
    });
    const pauseMonth = r.month;
    const resume = () =>
      dispatch(r, { type: 'academic', operation: 'resume', expected: r.actions.length });
    expect(resume).toThrow('6 tháng');
    r = parseSave(JSON.stringify(snapshot(r))).run;
    for (let i = 0; i < 50 && r.month < pauseMonth + 6; i++) {
      if (!r.activeEvent) r = advance(r);
      else {
        const e = activeDefinition(r)!;
        const c = e.choices.find(
          (c) =>
            !choiceReason(r, c) &&
            !c.effects.some(
              (x) =>
                x.kind === 'career' ||
                x.kind === 'education' ||
                (x.kind === 'employment' && x.operation !== 'rest'),
            ),
        )!;
        r = choose(r, e.id, c.id);
      }
    }
    expect(currentStudy(r)!.status).toBe('paused');
    expect(tuition()).toBe(fees);
    expect(currentStudy(r)!.results).toEqual(before.results);
    if (r.activeEvent?.id === 'employment-search') {
      const month = r.month;
      const resumed = resume();
      expect(resumed.month).toBe(month);
      expect(resumed.activeEvent?.id).not.toBe('employment-search');
      expect(currentStudy(resumed)!.status).toBe('studying');
      expect(parseSave(JSON.stringify(snapshot(resumed))).run).toEqual(resumed);
    }
    // Finish any ordinary event before returning; academic controls retain strict focus guards.
    for (let i = 0; i < 20 && r.activeEvent; i++) {
      const e = activeDefinition(r)!;
      r = choose(
        r,
        e.id,
        e.choices.find(
          (c) =>
            !choiceReason(r, c) &&
            c.effects.every((x) => x.kind !== 'employment' || x.operation === 'rest'),
        )!.id,
      );
    }
    r = resume();
    expect(currentStudy(r)!.status).toBe('studying');
    expect(tuition()).toBe(fees);
    r = nextAssessment(r);
    r = choose(r, activeDefinition(r)!.id, 'steady');
    expect(currentStudy(r)!.paidTerms).toBe(before.paidTerms + 1);
    expect(tuition()).toBe(fees + 1);
    expect(currentStudy(r)!.termAttempts).toBe(before.termAttempts + 1);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    assertRun(r);
  });
  it('keeps rest enrolled and paid, separately from pause, and uses remediation after a failed assessment', () => {
    let r = nextAssessment(admittedStudent('it', 0, 'annual-v1').run);
    const first = stageTemplate(r, currentStudy(r)!).id;
    r = choose(r, activeDefinition(r)!.id, 'rest');
    expect(currentStudy(r)!.status).toBe('studying');
    expect(currentStudy(r)!.termAttempts).toBe(1);
    expect(currentStudy(r)!.paidTerms).toBe(2);
    expect(currentStudy(r)!.completedYears).toBe(0);
    r = nextAssessment(r);
    expect(stageTemplate(r, currentStudy(r)!).id).toBe(first + '-remediation');
    expect(activeDefinition(r)!.text).toContain('chưa đạt');
    r = choose(r, activeDefinition(r)!.id, 'project');
    expect(currentStudy(r)!.results.at(-1)!.templateId).toBe(first + '-remediation');
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  });
});
