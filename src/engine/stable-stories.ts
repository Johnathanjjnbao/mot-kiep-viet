import type { GameRun } from '../domain/model';
import { hasStableRules } from '../domain/rules';
import { STABLE_SCENE_META } from '../content/stable-events';

/** Context is read from recorded history; narrative never creates a job, NPC or payout. */
export function stableSceneEligible(r: GameRun, id: string): boolean {
  if (!hasStableRules(r) || !Object.hasOwn(STABLE_SCENE_META, id)) return false;
  const requirement = STABLE_SCENE_META[id].requires;
  const shops = (r.enterprise?.ventures.length ?? 0) > 0;
  const creative = !!r.creative?.artist || (r.creator?.channels.length ?? 0) > 0;
  switch (requirement) {
    case 'job-rejection':
      return !!r.employment?.applications.some((a) => a.result === 'rejected');
    case 'known-parent':
      return r.npcs.some(
        (n) =>
          (n.role === 'mother' || n.role === 'father') &&
          n.alive === true &&
          n.presence !== 'unknown' &&
          n.presence !== 'deceased',
      );
    case 'shop-record':
      return shops;
    case 'creative-record':
      return creative;
    case 'work-record':
      return (
        r.player.careers.length > 0 || shops || creative || (r.freelance?.projects.length ?? 0) > 0
      );
    default:
      return true;
  }
}
