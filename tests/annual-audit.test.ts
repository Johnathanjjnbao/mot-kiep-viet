import { describe, it, expect } from 'vitest';
import { createRun, advance, activeDefinition, choose, choiceReason } from '../src/engine/engine';
import { admittedStudent } from '../scripts/academic-fixture';
import { currentStudy } from '../src/engine/academics';
import { ageOf } from '../src/content/world';

describe('published rules: independent audit reproductions retained for compatibility', () => {
  it('shows the original 3 → 6 → 9 checkpoints rather than individual ages', () => {
    let r = createRun('audit-age', {
      cohort: 1995,
      region: 'northern-village',
      lifeRules: 'career-v1',
    });
    const ages: number[] = [];
    for (let i = 0; i < 6; i++) {
      r = advance(r);
      ages.push(ageOf(r));
      const e = activeDefinition(r)!;
      r = choose(r, e.id, e.choices.find((c) => !choiceReason(r, c))!.id);
    }
    expect(ages.slice(0, 3)).toEqual([3, 6, 9]);
  });
  it('reproduces health Bảo lưu executing rest, paying next term and remaining enrolled', () => {
    let r = admittedStudent('health').run;
    for (let i = 0; i < 30 && !r.academics?.focus; i++) {
      if (!r.activeEvent) r = advance(r);
      else {
        const e = activeDefinition(r)!;
        r = choose(r, e.id, e.choices.find((c) => !choiceReason(r, c))!.id);
      }
    }
    const e = activeDefinition(r)!;
    expect(e.choices.find((c) => c.id === 'rest')!.text).toContain('Bảo lưu');
    const before = structuredClone(currentStudy(r)!);
    const cash = r.finance.cash;
    r = choose(r, e.id, 'rest');
    expect(currentStudy(r)!.status).toBe('studying');
    expect(currentStudy(r)!.pausedMonth).toBeNull();
    expect(currentStudy(r)!.paidTerms).toBe(before.paidTerms + 1);
    expect(r.finance.cash).toBeLessThan(cash);
    expect(currentStudy(r)!.completedYears).toBe(before.completedYears);
  });
  it('repeats the IT principal incident across successive academic years', () => {
    let r = admittedStudent('it').run;
    const stories: string[] = [];
    for (let i = 0; i < 100 && stories.length < 3; i++) {
      if (!r.activeEvent) r = advance(r);
      else {
        const e = activeDefinition(r)!;
        if (r.academics?.focus) stories.push(e.text);
        r = choose(
          r,
          e.id,
          r.academics?.focus ? 'steady' : e.choices.find((c) => !choiceReason(r, c))!.id,
        );
      }
    }
    expect(stories).toHaveLength(3);
    expect(new Set(stories).size).toBe(1);
  });
});
