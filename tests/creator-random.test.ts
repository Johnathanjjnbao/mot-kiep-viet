import { describe, it, expect } from 'vitest';
import { randomizeCreatorTraits } from '../src/application/creatorRandom';
import type { CreatorTraitGroups } from '../src/application/creatorRandom';
import { playerPersonalitySchema } from '../src/domain/personality';
import { setupSchema } from '../src/domain/creator';
const groups: CreatorTraitGroups = {
  player: ['Hay tò mò'],
  mother: ['gentle', 'academic'],
  father: ['frugal'],
};
const counters = { player: 0, mother: 0, father: 0 },
  locks = { player: false, mother: false, father: false };
describe('independent creator randomization foundation', () => {
  it.each(['player', 'mother', 'father'] as const)(
    'rerolls only %s and preserves the input',
    (subject) => {
      const original = structuredClone(groups),
        r = randomizeCreatorTraits(groups, 'creator-seed', [subject], counters, locks);
      expect(groups).toEqual(original);
      for (const other of ['player', 'mother', 'father'] as const)
        if (other !== subject) expect(r[other]).toEqual(groups[other]);
    },
  );
  it('is deterministic across group order and independent reroll counters', () => {
    const a = randomizeCreatorTraits(
      groups,
      'same',
      ['player', 'mother', 'father'],
      counters,
      locks,
    );
    const b = randomizeCreatorTraits(
      groups,
      'same',
      ['father', 'player', 'mother'],
      counters,
      locks,
    );
    expect(a).toEqual(b);
    const c = randomizeCreatorTraits(
      groups,
      'same',
      ['player', 'mother', 'father'],
      { ...counters, mother: 3 },
      locks,
    );
    expect(c.player).toEqual(a.player);
    expect(c.father).toEqual(a.father);
  });
  it('preserves a locked manual combination while randomizing all other groups', () => {
    const r = randomizeCreatorTraits(groups, 'locked', ['player', 'mother', 'father'], counters, {
      ...locks,
      mother: true,
    });
    expect(r.mother).toEqual(groups.mother);
    expect(r).not.toBe(groups);
  });
  it('produces only compatible unique combinations over500 seeds', () => {
    for (let i = 0; i < 500; i++) {
      const r = randomizeCreatorTraits(
        groups,
        'traits-' + i,
        ['player', 'mother', 'father'],
        counters,
        locks,
      );
      expect(playerPersonalitySchema.safeParse(r.player).success).toBe(true);
      expect(setupSchema.shape.motherTraits.safeParse(r.mother).success).toBe(true);
      expect(setupSchema.shape.fatherTraits.safeParse(r.father).success).toBe(true);
    }
  });
  it('rejects invalid counters and incompatible manual player traits', () => {
    expect(() =>
      randomizeCreatorTraits(groups, 'seed', ['player'], { ...counters, player: -1 }, locks),
    ).toThrow();
    expect(playerPersonalitySchema.safeParse(['Dễ gần', 'Ưa yên tĩnh']).success).toBe(false);
  });
});
