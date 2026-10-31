import { describe, it, expect } from 'vitest';
import {
  jobApplicant,
  jobApplication,
  careerGraduate,
  continueJobless,
} from '../scripts/employment-fixture';
import { manage, advance, choose, activeDefinition, replay, dispatch } from '../src/engine/engine';
import { currentCareer, careerReason, CAREERS } from '../src/content/world';
import {
  applyEmployment,
  assertEmployment,
  endEmployment,
  jobProbability,
  tickEmployment,
} from '../src/engine/employment';
import { canonical, snapshot, parseSave } from '../src/persistence/saves';
import { assertRun } from '../src/engine/invariants';
import { admittedStudent } from '../scripts/academic-fixture';
import { simulateLife } from '../src/diagnostics/simulation';
import { hashSeed } from '../src/engine/random';
import type { RunSetup } from '../src/domain/model';

describe('career-v1 applications, job gaps and recovery', () => {
  it.each([
    {
      seed: 'stress-519',
      policy: 4,
      setup: {
        expansion: 'family',
        cohort: 2026,
        region: 'central-coast',
        name: 'Nguyễn An 519',
        birthplace: 'Quê nhà 519',
        environment: 'urban',
        wealth: 4,
        family: 'with-father',
        motherTraits: ['academic'],
        fatherTraits: [],
        lifeRules: 'career-v1',
      } as RunSetup,
    },
    {
      seed: 'stress-524',
      policy: 4,
      setup: {
        expansion: 'wardrobe',
        cohort: 2005,
        region: 'southern-city',
        name: 'Nguyễn An 524',
        birthplace: 'Quê nhà 524',
        environment: 'rural',
        wealth: 4,
        family: 'with-mother',
        motherTraits: ['frugal'],
        fatherTraits: [],
        lifeRules: 'career-v1',
        playerTraits: ['Hay tò mò', 'Khéo tay', 'Kiên trì'],
      } as RunSetup,
    },
    {
      seed: 'stress-569',
      policy: 4,
      setup: {
        expansion: 'social',
        cohort: 2024,
        region: 'southern-city',
        name: 'Nguyễn An 569',
        birthplace: 'Quê nhà 569',
        environment: 'urban',
        wealth: 4,
        family: 'with-father',
        motherTraits: ['academic'],
        fatherTraits: [],
        lifeRules: 'career-v1',
      } as RunSetup,
    },
  ])(
    'continues $seed when a story reaffirms the current career without rehiring or resetting experience',
    ({ seed, policy, setup }) => {
      const r = simulateLife(seed, setup, policy);
      expect(r.status).toBe('ended');
      expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    },
    120000,
  );
  it('locks the new career rules independently of all published university and older goldens', () => {
    const r = simulateLife(
      'golden-career-v1',
      {
        lifeRules: 'career-v1',
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
    expect(hashSeed(JSON.stringify(r))).toBe(3510531914);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  }, 120000);
  it.each([
    {
      seed: 'stress-48',
      setup: {
        expansion: 'wardrobe',
        cohort: 1975,
        region: 'northern-village',
        name: 'Nguyễn An 48',
        birthplace: 'Quê nhà 48',
        environment: 'rural',
        wealth: 3,
        family: 'with-mother',
        motherTraits: ['distant'],
        fatherTraits: [],
        lifeRules: 'career-v1',
        playerTraits: ['Thích giúp đỡ', 'Khéo tay'],
      } as RunSetup,
    },
    {
      seed: 'stress-88',
      setup: {
        expansion: 'wardrobe',
        cohort: 1995,
        region: 'central-coast',
        name: 'Nguyễn An 88',
        birthplace: 'Quê nhà 88',
        environment: 'rural',
        wealth: 3,
        family: 'mother-only',
        motherTraits: ['distant'],
        fatherTraits: [],
        lifeRules: 'career-v1',
        playerTraits: ['Dễ gần'],
      } as RunSetup,
    },
  ])(
    'finishes $seed with annual job/study scenes within the unchanged 512-action save limit',
    ({ seed, setup }) => {
      const r = simulateLife(seed, setup, 3);
      expect(r.status).toBe('ended');
      expect(r.actions.length).toBeLessThanOrEqual(512);
      expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    },
    120000,
  );
  it('rejects forged application outcomes and enforces the shared family-management budget', () => {
    const r = jobApplication('rejected').run;
    const forged = snapshot(r);
    forged.run.employment!.applications[0].result = 'accepted';
    expect(() => parseSave(JSON.stringify(forged))).toThrow();
    const bounded = structuredClone(r);
    bounded.actions = Array(120).fill({ type: 'manage', action: 'save-money' });
    expect(() => manage(bounded, 'temporary-job')).toThrow('giới hạn quản lý');
    expect(() => manage(bounded, 'train-job')).toThrow('giới hạn quản lý');
  });
  it.each(CAREERS)(
    'allows an eligible application for $id with a replayed qualification and no hiring fee',
    (job) => {
      const before = careerGraduate(job.id === 'teacher' ? 'education' : 'it');
      expect(careerReason(before, job.id)).toBeNull();
      const run = manage(before, 'apply-job', job.id);
      expect(run.employment!.applications.at(-1)!.career).toBe(job.id);
      expect(['accepted', 'rejected']).toContain(run.employment!.applications.at(-1)!.result);
      expect(canonical(run.finance)).toBe(canonical(before.finance));
      expect(parseSave(JSON.stringify(snapshot(run))).run).toEqual(run);
    },
    120000,
  );
  it('accepts and rejects reproducibly without a fee or premature salary', () => {
    for (const result of ['accepted', 'rejected'] as const) {
      const { before, run } = jobApplication(result);
      expect(run.employment!.applications.at(-1)!.result).toBe(result);
      expect(canonical(run.finance)).toBe(canonical(before.finance));
      expect(!!currentCareer(run)).toBe(result === 'accepted');
      expect(canonical(manage(before, 'apply-job', 'office'))).toBe(canonical(run));
      expect(parseSave(JSON.stringify(snapshot(run))).run).toEqual(run);
    }
  });
  it('rejects rapid retries atomically and preserves the exact old save contract', () => {
    const { run } = jobApplication('rejected');
    const before = canonical(run);
    expect(() => manage(run, 'apply-job', 'office')).toThrow('6 tháng');
    expect(canonical(run)).toBe(before);
    expect(() =>
      parseSave(
        JSON.stringify({
          ...snapshot(run),
          run: { ...run, setup: { ...run.setup, lifeRules: 'education-v1' } },
        }),
      ),
    ).toThrow();
  });
  it('retains a job and its experience when a proposed career switch is rejected', () => {
    let sample;
    for (let i = 0; i < 100; i++) {
      let r = jobApplicant(i);
      r = manage(r, 'apply-job', 'farm');
      if (!currentCareer(r)) continue;
      const before = structuredClone(currentCareer(r)!);
      const n = manage(r, 'apply-job', 'office');
      if (n.employment!.applications.at(-1)!.result === 'rejected') {
        sample = { n, before };
        break;
      }
    }
    expect(sample).toBeTruthy();
    expect(currentCareer(sample!.n)).toEqual(sample!.before);
    expect(sample!.n.player.careers).toHaveLength(1);
    expect(parseSave(JSON.stringify(snapshot(sample!.n))).run).toEqual(sample!.n);
  });
  it('ends one past record on an accepted switch, then permits resignation and recovery', () => {
    let sample;
    for (let i = 0; i < 100; i++) {
      let r = manage(jobApplicant(i), 'apply-job', 'farm');
      if (!currentCareer(r)) continue;
      r = manage(r, 'apply-job', 'office');
      if (currentCareer(r)?.id === 'office') {
        sample = r;
        break;
      }
    }
    expect(sample).toBeTruthy();
    expect(sample!.player.careers[0].ending).toBe('switched');
    expect(sample!.player.careers.filter((c) => c.endMonth === null)).toHaveLength(1);
    sample = manage(sample!, 'quit-job');
    expect(currentCareer(sample)).toBeUndefined();
    expect(sample.player.careers.at(-1)!.ending).toBe('resigned');
    sample = manage(sample, 'temporary-job');
    expect(currentCareer(sample)?.id).toBe('labor');
    expect(parseSave(JSON.stringify(snapshot(sample))).run).toEqual(sample);
  });
  it('pays exactly six actual months for temporary work, expires it and saves its ending', () => {
    const start = jobApplicant();
    let r = manage(start, 'temporary-job');
    r = advance(r);
    expect(r.month).toBe(start.month + 6);
    expect(currentCareer(r)).toBeUndefined();
    expect(r.player.careers[0].ending).toBe('contract-ended');
    expect(r.player.careers[0].experience).toBe(6);
    expect(
      r.finance.transactions.filter(
        (t) =>
          t.id.endsWith(':income') &&
          t.id.startsWith('month:') &&
          Number(t.id.split(':')[1]) > start.month,
      ),
    ).toHaveLength(6);
    expect(activeDefinition(r)?.choices).toHaveLength(4);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  });
  it('records years of unemployment, recurring costs and an eventual supported reemployment', () => {
    let r = continueJobless(jobApplicant(), 96);
    expect(r.employment!.periods.at(-1)!.endMonth).toBeNull();
    expect(r.month - r.employment!.periods.at(-1)!.startMonth).toBeGreaterThanOrEqual(96);
    expect(r.finance.transactions.filter((t) => t.id.endsWith(':income'))).toHaveLength(0);
    expect(r.finance.transactions.some((t) => t.id.endsWith(':living'))).toBe(true);
    const old = structuredClone(r.employment!.periods.at(-1)!);
    r = manage(r, 'temporary-job');
    expect(r.employment!.periods.find((p) => p.startMonth === old.startMonth)?.endMonth).toBe(
      r.month,
    );
    expect(currentCareer(r)).toBeTruthy();
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  });
  it('charges retraining once, improves skills without a degree and enforces a recovery interval', () => {
    const r = jobApplicant(),
      n = manage(r, 'train-job');
    expect(n.finance.cash).toBe(r.finance.cash - 20);
    expect(n.player.stats.skill).toBeGreaterThan(r.player.stats.skill);
    expect(n.academics!.qualifications).toEqual(r.academics!.qualifications);
    expect(() => manage(n, 'train-job')).toThrow('6 tháng');
    expect(parseSave(JSON.stringify(snapshot(n))).run).toEqual(n);
  });
  it('keeps Korean graduation useful without forbidding out-of-field employment', () => {
    const r = careerGraduate('korean');
    expect(r.academics!.qualifications[0].programId).toBe('korean');
    expect(careerReason(r, 'farm')).toBeNull();
    const without = structuredClone(r);
    without.academics!.qualifications = [];
    expect(jobProbability(r, 'office')).toBeGreaterThan(jobProbability(without, 'office'));
    const employed = structuredClone(r);
    applyEmployment(employed, 'farm', () => 0);
    expect(currentCareer(employed)?.field).toBe('outside');
    expect(careerReason(r, 'teacher')).toContain('Sư phạm');
  }, 120000);
  it('separates study from unemployment and allows pause-work-return without two full-time roles', () => {
    const original = admittedStudent('it').run;
    let r = replay(original.seed, { ...original.setup, lifeRules: 'career-v1' }, original.actions);
    expect(careerReason(r, 'farm')).toContain('học toàn thời gian');
    expect(r.employment!.periods.at(-1)?.endMonth).not.toBeNull();
    r = dispatch(r, { type: 'academic', operation: 'pause', expected: r.actions.length });
    r = manage(r, 'temporary-job');
    expect(() =>
      dispatch(r, { type: 'academic', operation: 'resume', expected: r.actions.length }),
    ).toThrow('toàn thời gian');
    r = manage(r, 'quit-job');
    r = dispatch(r, { type: 'academic', operation: 'resume', expected: r.actions.length });
    assertRun(r);
    expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  });
  it('applies a seeded layoff, one transition payment and dependent pressure without removing history', () => {
    const r = structuredClone(jobApplication('accepted').run);
    r.month += 12;
    const job = currentCareer(r)!;
    job.experience = 12;
    tickEmployment(r, () => 0);
    expect(job.ending).toBe('layoff');
    expect(currentCareer(r)).toBeUndefined();
    expect(
      r.finance.transactions.filter((t) => t.id.startsWith('employment:transition:')),
    ).toHaveLength(1);
    endEmployment(r, 'layoff');
    expect(
      r.finance.transactions.filter((t) => t.id.startsWith('employment:transition:')),
    ).toHaveLength(1);
    const alone = structuredClone(r),
      parent = structuredClone(r);
    parent.npcs.push({
      id: 'test-dependent',
      name: 'Con',
      role: 'child',
      birthYear: parent.world.year - 4,
      alive: true,
      presence: 'resident',
    });
    alone.month += 6;
    parent.month += 6;
    tickEmployment(alone, () => 1);
    tickEmployment(parent, () => 1);
    expect(parent.player.stats.stress).toBeGreaterThan(alone.player.stats.stress);
    assertEmployment(parent);
  });
  it('offers four distinct enabled recovery choices without requiring money', () => {
    let r = jobApplication('rejected').run;
    r = advance(r);
    expect(activeDefinition(r)?.id).toBe('employment-search');
    const outcomes = activeDefinition(r)!.choices.map((c) => choose(r, 'employment-search', c.id));
    expect(new Set(outcomes.map((n) => canonical([n.player, n.employment, n.finance]))).size).toBe(
      4,
    );
    outcomes.forEach(assertRun);
  });
});
