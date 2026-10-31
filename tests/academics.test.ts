import { describe, it, expect } from 'vitest';
import { PROGRAMS, academicTemplates } from '../src/content/programs';
import { academicApplicant, admittedStudent, advanceStudy } from '../scripts/academic-fixture';
import { dispatch, choose, activeDefinition, replay, advance } from '../src/engine/engine';
import { currentStudy, admissionReason, studyCosts } from '../src/engine/academics';
import { assertRun } from '../src/engine/invariants';
import { snapshot, parseSave, canonical } from '../src/persistence/saves';
import { educationLevel, careerReason } from '../src/content/world';
import { socialEligible } from '../src/engine/social';
import { simulateLife } from '../src/diagnostics/simulation';
import { hashSeed } from '../src/engine/random';

describe('versioned university studies', () => {
  it('locks education-v1 separately from the published dynamic-life golden', () => {
    const r = simulateLife(
      'golden-education-v1',
      {
        lifeRules: 'education-v1',
        expansion: 'family',
        cohort: 1995,
        region: 'northern-village',
        wealth: 4,
        family: 'both',
        motherTraits: ['academic'],
        fatherTraits: ['gentle'],
        playerTraits: ['Hay tò mò', 'Kiên trì'],
      },
      0,
    );
    expect(hashSeed(JSON.stringify(r))).toBe(2785536325);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  }, 120000);
  it('has12 complete programs with stable IDs, distinct incidents, costs, durations and real4-path assessments', () => {
    expect(PROGRAMS).toHaveLength(12);
    expect(new Set(PROGRAMS.map((p) => p.id)).size).toBe(12);
    expect(new Set(academicTemplates.map((e) => e.text)).size).toBe(12);
    for (const p of PROGRAMS) {
      expect(p.tuition).toBeGreaterThan(0);
      expect(p.years).toBeGreaterThanOrEqual(4);
      expect(p.careers.length).toBeGreaterThan(0);
      expect(academicTemplates.find((e) => e.id === 'edu-' + p.id)?.choices).toHaveLength(4);
    }
  });
  it.each(PROGRAMS)(
    'admits, assesses and awards only the completed $id program with canonical replay',
    (p) => {
      const { before, run } = admittedStudent(p.id);
      expect(run.academics!.applications.at(-1)?.result).toBe('accepted');
      expect(educationLevel(run)).not.toBe('university');
      expect(run.finance.transactions.filter((t) => t.id.endsWith(':tuition'))).toHaveLength(1);
      expect(() =>
        dispatch(run, {
          type: 'academic',
          operation: 'apply',
          program: p.id,
          expected: before.actions.length,
        }),
      ).toThrow();
      const ended = advanceStudy(run, 'steady');
      assertRun(ended);
      const study = ended.academics!.studies[0];
      expect(study.status).toBe('graduated');
      expect(study.completedYears).toBe(p.years);
      expect(ended.academics!.qualifications).toEqual([
        { studyId: study.id, programId: p.id, kind: 'degree', awardedMonth: study.endMonth },
      ]);
      expect(educationLevel(ended)).toBe('university');
      expect(canonical(replay(ended.seed, ended.setup, ended.actions))).toBe(canonical(ended));
      expect(parseSave(JSON.stringify(snapshot(ended))).run).toEqual(ended);
      if (p.id !== 'education') expect(careerReason(ended, 'teacher')).toContain('Sư phạm');
    },
    120000,
  );
  it('records rejection without a tuition charge and enforces6month retry instead of brute force', () => {
    let rejected;
    for (let i = 0; i < 100; i++) {
      const r = academicApplicant(i);
      if (admissionReason(r, 'business')) continue;
      const n = dispatch(r, {
        type: 'academic',
        operation: 'apply',
        program: 'business',
        expected: r.actions.length,
      });
      if (!currentStudy(n)) {
        rejected = n;
        break;
      }
    }
    expect(rejected).toBeTruthy();
    expect(rejected!.academics!.applications.at(-1)?.result).toBe('rejected');
    expect(rejected!.finance.transactions.some((t) => t.id.endsWith(':tuition'))).toBe(false);
    expect(() =>
      dispatch(rejected!, {
        type: 'academic',
        operation: 'apply',
        program: 'business',
        expected: rejected!.actions.length,
      }),
    ).toThrow('6 tháng');
    expect(parseSave(JSON.stringify(snapshot(rejected!))).run).toEqual(rejected);
  });
  it('preserves paid tuition on same-term pause/resume, permits dropout, and awards no premature degree', () => {
    let r = admittedStudent('it').run;
    const before = canonical(r.finance);
    r = dispatch(r, { type: 'academic', operation: 'pause', expected: r.actions.length });
    expect(currentStudy(r)?.status).toBe('paused');
    r = dispatch(r, { type: 'academic', operation: 'resume', expected: r.actions.length });
    expect(canonical(r.finance)).toBe(before);
    r = dispatch(r, { type: 'academic', operation: 'dropout', expected: r.actions.length });
    expect(r.academics!.studies[0].status).toBe('dropped');
    expect(r.academics!.qualifications).toHaveLength(0);
    assertRun(r);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  });
  it('keeps a distinct previous study when a major switch is accepted or rejected', () => {
    const r = admittedStudent('it').run;
    const n = dispatch(r, {
      type: 'academic',
      operation: 'switch',
      program: 'english',
      expected: r.actions.length,
    });
    expect(n.academics!.studies[0].programId).toBe('it');
    expect(n.academics!.qualifications).toHaveLength(0);
    if (n.academics!.applications.at(-1)?.result === 'accepted') {
      expect(n.academics!.studies[0].status).toBe('switched');
      expect(currentStudy(n)?.programId).toBe('english');
    } else expect(currentStudy(n)?.programId).toBe('it');
    assertRun(n);
    expect(parseSave(JSON.stringify(snapshot(n))).run).toEqual(n);
  });
  it('delays graduation with rest, supports internships, and rejects forged qualification state', () => {
    let r = admittedStudent('design').run;
    while (!r.academics!.focus) {
      if (r.activeEvent) {
        const e = activeDefinition(r)!;
        r = choose(r, e.id, e.choices[0].id);
      } else r = advance(r);
    }
    const delayed = choose(r, r.activeEvent!.id, 'rest');
    expect(currentStudy(delayed)?.completedYears).toBe(0);
    expect(currentStudy(delayed)?.termAttempts).toBe(1);
    const graduated = advanceStudy(delayed, 'project');
    expect(graduated.academics!.studies[0].internship).toBe(true);
    expect(
      graduated.academics!.studies[0].endMonth! - graduated.academics!.studies[0].startMonth,
    ).toBeGreaterThan(PROGRAMS.find((p) => p.id === 'design')!.years * 12);
    const fake = snapshot(graduated);
    fake.run.academics!.qualifications[0].programId = 'health';
    expect(() => parseSave(JSON.stringify(fake))).toThrow();
  }, 120000);
  it('exposes finite funding requirements and preserves money when admission is not yet possible', () => {
    const r = academicApplicant();
    const c = studyCosts(r, 'health');
    expect(c.required).toBeGreaterThan(0);
    expect(c.required + c.scholarship + c.support).toBe(c.tuition);
    const child = { ...r, month: 204 };
    expect(admissionReason(child, 'health')).toContain('18');
    const poor = { ...r, finance: { ...r.finance, cash: 0 } };
    expect(admissionReason(poor, 'health')).toContain('đSM');
  });
  it('can end an unfinished course without granting a degree after repeated recovery years', () => {
    const r = advanceStudy(admittedStudent('business').run, 'rest');
    expect(r.academics!.studies[0].status).toBe('failed');
    expect(r.academics!.qualifications).toHaveLength(0);
    assertRun(r);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  }, 120000);
  it('pauses when next-year tuition is unavailable, then resumes from saved funds with one fee per term', () => {
    let r = admittedStudent('it').run;
    while (r.finance.cash >= 50) r = dispatch(r, { type: 'manage', action: 'save-money' });
    r = advanceStudy(r, 'steady', 1);
    expect(currentStudy(r)?.status).toBe('paused');
    r = dispatch(r, { type: 'manage', action: 'withdraw-money' });
    const count = r.finance.transactions.filter((t) => t.id.endsWith(':tuition')).length;
    r = dispatch(r, { type: 'academic', operation: 'resume', expected: r.actions.length });
    expect(r.finance.transactions.filter((t) => t.id.endsWith(':tuition'))).toHaveLength(count + 1);
    assertRun(r);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  });
  it('does not offer or nest social conversations during an academic assessment', () => {
    let r = admittedStudent('it').run;
    const before = ['soc-meet', 'soc-listen', 'soc-book', 'soc-date'].filter((id) =>
      socialEligible(r, id, 'friend', true),
    );
    expect(before.length).toBeGreaterThan(0);
    r = advance(r);
    expect(r.academics!.focus).toBeTruthy();
    for (const id of before) expect(socialEligible(r, id, 'friend', true)).toBe(false);
    expect(() =>
      dispatch(r, {
        type: 'social',
        templateId: before[0],
        npcId: 'friend',
        expected: r.actions.length,
      }),
    ).toThrow();
  });
  it('shares the family120 operation budget with university actions and keeps scholarships conditional', () => {
    let r = admittedStudent('it').run;
    for (let i = 0; i < 119; i++)
      r = dispatch(r, { type: 'manage', action: i % 2 ? 'withdraw-money' : 'save-money' });
    expect(() =>
      dispatch(r, { type: 'academic', operation: 'pause', expected: r.actions.length }),
    ).toThrow('quản lý');
    expect(() =>
      dispatch(r, {
        type: 'wardrobe',
        operation: 'buy',
        item: 'linen-shirt',
        expected: r.actions.length,
      }),
    ).toThrow('giới hạn');
    const good = studyCosts(r, 'it');
    expect(good.scholarship).toBeGreaterThan(0);
    expect(
      studyCosts({ ...r, player: { ...r.player, stats: { ...r.player.stats, stress: 90 } } }, 'it')
        .scholarship,
    ).toBe(0);
  });
});
