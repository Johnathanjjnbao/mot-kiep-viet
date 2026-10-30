import { hashSeed } from '../engine/random';
import type { GameRun } from '../domain/model';
export const AGE_STAGES = [
  'Sơ sinh',
  'Tuổi thơ',
  'Thiếu niên',
  'Thanh niên',
  'Trung niên',
  'Cao niên',
] as const;
export function ageStage(age: number) {
  return age < 3 ? 0 : age < 13 ? 1 : age < 18 ? 2 : age < 36 ? 3 : age < 60 ? 4 : 5;
}
export function appearance(seed: string) {
  const h = hashSeed('mkv-portrait-v1:' + seed);
  return {
    key: h.toString(16),
    skin: ['#f0c6a0', '#dbab81', '#c28b65', '#a77150', '#88573f'][h % 5],
    hair: ['#302c28', '#48332b', '#65503c', '#252c30'][(h >>> 4) % 4],
    style: (h >>> 8) % 5,
    face: (h >>> 13) % 3,
    silhouette: (h >>> 17) % 3,
    fabric: ['#526d50', '#974733', '#3c5969', '#9a774b', '#6d586b'][(h >>> 21) % 5],
  };
}
export function avatarState(
  run: Pick<GameRun, 'seed' | 'month' | 'player'>,
  biologicalAge?: number,
) {
  const age = biologicalAge ?? Math.floor(run.month / 12);
  const stage = ageStage(age),
    identity = appearance(run.seed);
  const expression =
    run.player.stats.health < 35
      ? 'Mệt mỏi'
      : run.player.stats.stress > 65
        ? 'Lo lắng'
        : run.player.stats.mood > 70
          ? 'Vui vẻ'
          : run.player.stats.social > 65
            ? 'Tự tin'
            : 'Bình thản';
  return { identity, age, stage, stageName: AGE_STAGES[stage], expression };
}
