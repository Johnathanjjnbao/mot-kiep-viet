import { PARENT_TRAITS, setupSchema } from '../domain/creator';
import { PLAYER_PERSONALITIES, playerPersonalitySchema } from '../domain/personality';
import type { PlayerPersonality } from '../domain/personality';
import type { ParentTrait } from '../domain/model';
import { hashSeed, nextRandom } from '../engine/random';

export type CreatorSubject = 'player' | 'mother' | 'father';
export interface CreatorTraitGroups {
  player: PlayerPersonality[];
  mother: ParentTrait[];
  father: ParentTrait[];
}
export type CreatorCounters = Record<CreatorSubject, number>;
export type CreatorLocks = Record<CreatorSubject, boolean>;
export function randomizeCreatorTraits(
  groups: CreatorTraitGroups,
  seed: string,
  subjects: CreatorSubject[],
  counters: CreatorCounters,
  locks: CreatorLocks,
): CreatorTraitGroups {
  if (!seed.length || seed.length > 100) throw Error('Hạt giống cần từ 1 đến 100 ký tự.');
  const result = structuredClone(groups);
  for (const subject of subjects) {
    if (locks[subject]) continue;
    const revision = counters[subject];
    if (!Number.isInteger(revision) || revision < 0) throw Error('Lượt gieo không hợp lệ.');
    let state = hashSeed(`${seed}:creator-traits-v1:${subject}:${revision}`);
    const roll = () => {
      const [value, next] = nextRandom(state);
      state = next;
      return value;
    };
    const pool: string[] =
      subject === 'player' ? [...PLAYER_PERSONALITIES] : Object.keys(PARENT_TRAITS);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(roll() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const count = 1 + Math.floor(roll() * 3),
      selected: string[] = [];
    for (const item of pool) {
      const candidate = [...selected, item];
      const valid =
        subject === 'player'
          ? playerPersonalitySchema.safeParse(candidate).success
          : setupSchema.shape.motherTraits.safeParse(candidate).success;
      if (valid) selected.push(item);
      if (selected.length === count) break;
    }
    if (subject === 'player') result.player = playerPersonalitySchema.parse(selected);
    else result[subject] = setupSchema.shape.motherTraits.parse(selected)!;
  }
  return result;
}
