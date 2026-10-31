import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { randomizeCreatorTraits } from '../src/application/creatorRandom';
import { createRun, replay } from '../src/engine/engine';
import { assertRun } from '../src/engine/invariants';
import { playerPersonalitySchema, PLAYER_PERSONALITIES } from '../src/domain/personality';
import { setupSchema } from '../src/domain/creator';
import { simulateLife } from '../src/diagnostics/simulation';
import { parseSave, snapshot, writeSave, readSave } from '../src/persistence/saves';
import type { CreatorTraitGroups } from '../src/application/creatorRandom';

const groups: CreatorTraitGroups = {
  player: ['Hay tò mò', 'Kiên trì'],
  mother: ['gentle'],
  father: ['frugal'],
};
const counters = { player: 0, mother: 0, father: 0 },
  locks = { player: false, mother: false, father: false };
const setup = { cohort: 1995, region: 'northern-village' as const, family: 'both' as const };

describe('creator opt-in and replay boundary', () => {
  it('retains individual locked traits and fills only compatible unlocked slots across rerolls', () => {
    for (let i = 0; i < 150; i++) {
      const result = randomizeCreatorTraits(
        groups,
        'individual-lock',
        ['player', 'mother', 'father'],
        { ...counters, player: i, mother: i, father: i },
        locks,
        { player: ['Kiên trì'], mother: ['gentle'], father: ['frugal'] },
      );
      expect(result.player).toContain('Kiên trì');
      expect(result.mother).toContain('gentle');
      expect(result.father).toContain('frugal');
      expect(playerPersonalitySchema.safeParse(result.player).success).toBe(true);
      expect(setupSchema.shape.motherTraits.safeParse(result.mother).success).toBe(true);
      expect(setupSchema.shape.fatherTraits.safeParse(result.father).success).toBe(true);
    }
    expect(groups.player).toEqual(['Hay tò mò', 'Kiên trì']);
  });
  it('rejects forged locks and preserves three locked slots without a fourth trait', () => {
    expect(() =>
      randomizeCreatorTraits(groups, 'locks', ['player'], counters, locks, {
        player: ['Khéo tay'],
      }),
    ).toThrow();
    const full: CreatorTraitGroups = { ...groups, player: ['Hay tò mò', 'Kiên trì', 'Khéo tay'] };
    expect(
      randomizeCreatorTraits(full, 'locks', ['player'], counters, locks, { player: full.player })
        .player,
    ).toEqual(full.player);
  });
  it('keeps the old random stream, money, NPCs and setup shape when personality is omitted', () => {
    const old = createRun('creator-boundary', setup),
      selected = createRun('creator-boundary', {
        ...setup,
        playerTraits: ['Hay tò mò', 'Khéo tay'],
      });
    expect(old.setup).not.toHaveProperty('playerTraits');
    expect(selected.rng).toEqual(old.rng);
    expect(selected.finance).toEqual(old.finance);
    expect(selected.npcs).toEqual(old.npcs);
    expect(selected.player.stats.knowledge).toBe(17);
    expect(selected.player.stats.skill).toBe(15);
    expect(selected.player.traits).toEqual(['Hay tò mò', 'Khéo tay']);
  });
  it('gives each chosen trait a bounded starting effect without penalizing quiet personalities', () => {
    for (const trait of PLAYER_PERSONALITIES) {
      const r = createRun('bounded', { ...setup, playerTraits: [trait] });
      const s = r.player.stats;
      expect(s.social).toBeGreaterThanOrEqual(25);
      expect(s.knowledge).toBeGreaterThanOrEqual(12);
      expect(s.stress).toBeLessThanOrEqual(8);
      expect(Object.values(s).every((n) => n >= 0 && n <= 100)).toBe(true);
      expect(r.player.traits).toEqual([trait]);
    }
  });
  it('rejects invalid setup and forged save traits instead of silently replacing them', () => {
    for (const traits of [[], ['Dễ gần', 'Ưa yên tĩnh'], ['Kiên trì', 'Kiên trì'], ['invented']])
      expect(() => createRun('invalid', { ...setup, playerTraits: traits as never })).toThrow();
    const r = createRun('forged', { ...setup, playerTraits: ['Kiên trì'] });
    r.player.traits = ['Dễ gần'];
    expect(() => assertRun(r)).toThrow('personality');
    expect(() => parseSave(JSON.stringify(snapshot(r)))).toThrow();
  });
  it('does not alias the caller setup or the recorded traits', () => {
    const input = { ...setup, playerTraits: ['Kiên trì'] as const };
    const r = createRun('immutable', { ...input, playerTraits: [...input.playerTraits] });
    r.player.traits.push('Khéo tay');
    expect(r.setup.playerTraits).toEqual(['Kiên trì']);
    expect(input.playerTraits).toEqual(['Kiên trì']);
  });
  it.each(['wardrobe', 'social', 'family'] as const)(
    'replays a complete opted-in %s life and all three manual slots',
    async (expansion) => {
      const r = simulateLife(
        'creator-' + expansion,
        { ...setup, expansion, playerTraits: ['Ưa yên tĩnh', 'Thích giúp đỡ'] },
        2,
      );
      expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
      expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
      for (const slot of ['autosave', 'slot-1', 'slot-2', 'slot-3'] as const) {
        await writeSave(slot, r);
        expect((await readSave(slot))?.run).toEqual(r);
      }
    },
  );
});
