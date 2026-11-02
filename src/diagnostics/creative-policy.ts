/** QA policy only: every move still passes the public dispatch and uses owned funds. */
import type { GameRun } from '../domain/model';
import { hasCreativeRules, detailedBooks } from '../domain/rules';
import { dispatch } from '../engine/engine';
import { designMoney } from '../domain/currency';
import { CLIENT_SERVICES } from '../content/freelance-services';
import {
  currentProject,
  freelanceReason,
  serviceReason,
  projectMonthlyCost,
} from '../engine/freelance';
import {
  creativeReason,
  gamingStartReason,
  gamingContestReason,
  currentCollaboration,
  collaborationReason,
} from '../engine/creative-careers';
import { creatorReason, creatorPolicyReason } from '../engine/creator-economy';
import {
  artisticReason,
  artisticStartReason,
  artisticReadiness,
  auditionReason,
  comebackReason,
  artisticMonthlyCost,
} from '../engine/artistic';
import { COLLAB_CONDITIONS } from '../content/creative-peers';
export function creativeOptional(r: GameRun, policy: number): GameRun | null {
  if (!hasCreativeRules(r) || r.month < 216) return null;
  const f = r.creative!,
    p = currentProject(r),
    a = f.artist;
  const move = (action: Record<string, unknown>) =>
    dispatch(r, { ...action, expected: r.actions.length } as never);
  const flCount = r.actions.filter((x) => x.type === 'freelance').length;
  if ([0, 3, 4].includes(policy) && flCount < 16 && !freelanceReason(r)) {
    if (!p && r.freelance!.projects.length < (policy === 0 ? 2 : 1) && detailedBooks(r) < 4) {
      const s = CLIENT_SERVICES.filter((s) => !serviceReason(r, s.id))[
        policy % Math.max(1, CLIENT_SERVICES.filter((s) => !serviceReason(r, s.id)).length)
      ];
      if (s) return move({ type: 'freelance', operation: 'inquire', service: s.id });
    }
    if (p) {
      const base = { type: 'freelance', id: p.id };
      if (p.status === 'inquiry')
        return move({
          ...base,
          operation: 'negotiate',
          terms: policy === 3 ? 'premium' : 'modest',
        });
      if (p.status === 'offered' && r.finance.cash >= projectMonthlyCost(r, p))
        return move({ ...base, operation: 'accept' });
      const desired = policy === 3 ? 'rush' : 'careful';
      if (p.status === 'working' && p.policy !== desired)
        return move({ ...base, operation: 'policy', policy: desired });
      if (p.status === 'ready') return move({ ...base, operation: 'deliver' });
      if (p.status === 'rework')
        return move({ ...base, operation: policy === 0 ? 'settle' : 'revise' });
    }
  }
  const artCount = r.actions.filter((x) => x.type === 'artistic').length;
  if ([1, 3, 4].includes(policy) && artCount < 18 && !artisticReason(r)) {
    if (!a && !artisticStartReason(r))
      return move({
        type: 'artistic',
        operation: 'start',
        discipline: (['music', 'dance', 'acting'] as const)[(policy + r.player.birthYear) % 3],
      });
    if (a) {
      if (
        a.status === 'offered' &&
        r.finance.cash >= artisticMonthlyCost(r, a.policy === 'rest' ? 'technique' : a.policy)
      )
        return move({
          type: 'artistic',
          operation: policy === 3 ? (artisticReadiness(r) ? 'decline' : 'independent') : 'accept',
        });
      if (a.status === 'retired' && !comebackReason(r) && r.month - a.endedMonth! >= 12)
        return move({ type: 'artistic', operation: 'comeback' });
      const desired = a.skill < 60 ? 'technique' : a.presence < 50 ? 'stage' : 'community';
      if (a.status === 'resting' && a.burnout <= 20)
        return move({ type: 'artistic', operation: 'policy', policy: desired });
      if (['training', 'active'].includes(a.status) && a.burnout >= 65)
        return move({ type: 'artistic', operation: 'policy', policy: 'rest' });
      if (a.status === 'training' && !artisticReadiness(r)) {
        if (policy !== 3 && !auditionReason(r) && a.auditions.length < 2)
          return move({
            type: 'artistic',
            operation: 'audition',
            terms: policy === 4 ? 'fast-track' : 'balanced',
          });
        if (!a.auditions.some((x) => x.result === 'pending' || x.result === 'offered'))
          return move({ type: 'artistic', operation: 'independent' });
      }
      if (a.status === 'active' && a.policy !== desired)
        return move({ type: 'artistic', operation: 'policy', policy: desired });
      if (
        a.status === 'active' &&
        !a.comebackUsed &&
        r.month - a.startedMonth >= 180 &&
        policy === 1
      )
        return move({ type: 'artistic', operation: 'retire' });
    }
  }
  const c = r.creator?.channels.find((c) => c.status !== 'closed'),
    g = f.gaming;
  if (c && [2, 4].includes(policy) && !creatorReason(r)) {
    const count = r.actions.filter((x) => x.type === 'creator').length;
    if (count < 20 && !g) {
      if (c.policy.niche !== 'gaming')
        return move({
          type: 'creator',
          operation: 'policy',
          id: c.id,
          policy: { ...c.policy, niche: 'gaming' },
        });
      if (c.equipment < 2 && r.finance.cash >= designMoney(r, 40 * (c.equipment + 1)))
        return move({ type: 'creator', operation: 'equipment', id: c.id });
      const live = { ...c.policy, format: 'live' as const, rhythm: 'light' as const };
      if (c.policy.format !== 'live' && !creatorPolicyReason(r, c, live))
        return move({ type: 'creator', operation: 'policy', id: c.id, policy: live });
    }
  }
  if (c && !creativeReason(r)) {
    const gameCount = r.actions.filter(
      (x) => x.type === 'creative' && x.operation.startsWith('gaming-'),
    ).length;
    if ([2, 4].includes(policy) && gameCount < 16) {
      if (!g && !gamingStartReason(r, c))
        return move({ type: 'creative', operation: 'gaming-start', channelId: c.id });
      if (g && g.status !== 'retired') {
        const desired =
          g.skill < 40
            ? 'practice'
            : g.community < 35
              ? 'community'
              : policy === 2
                ? 'competition'
                : 'community';
        if (
          g.status === 'resting' &&
          g.fatigue <= 20 &&
          c.status === 'active' &&
          c.policy.niche === 'gaming' &&
          c.policy.format === 'live'
        )
          return move({ type: 'creative', operation: 'gaming-policy', policy: desired });
        if (
          g.status === 'active' &&
          (c.status !== 'active' || c.policy.niche !== 'gaming' || c.policy.format !== 'live')
        )
          return move({ type: 'creative', operation: 'gaming-policy', policy: 'rest' });
        if (g.status === 'active' && g.policy !== desired)
          return move({ type: 'creative', operation: 'gaming-policy', policy: desired });
        if (g.rounds.length < 3 && !gamingContestReason(r))
          return move({ type: 'creative', operation: 'gaming-contest' });
      }
    }
    if ([0, 2, 4].includes(policy)) {
      const x = currentCollaboration(r),
        count = r.actions.filter(
          (x) => x.type === 'creative' && x.operation.startsWith('collab-'),
        ).length;
      if (count < 12) {
        if (x?.status === 'proposal')
          return move({
            type: 'creative',
            operation: 'collab-negotiate',
            id: x.id,
            terms: policy === 0 ? 'exclusive' : policy === 2 ? 'flexible' : 'balanced',
          });
        if (
          x?.status === 'offered' &&
          c.status === 'active' &&
          r.finance.cash >= designMoney(r, COLLAB_CONDITIONS[x.terms!].cost)
        )
          return move({ type: 'creative', operation: 'collab-accept', id: x.id });
        if (
          !x &&
          f.collaborations.length < 3 &&
          (!f.collaborations.length || r.month - f.collaborations.at(-1)!.createdMonth >= 24)
        ) {
          const peer = (['patient-teacher', 'club-host', 'stage-editor'] as const)[policy % 3];
          if (!collaborationReason(r, c, peer))
            return move({ type: 'creative', operation: 'collab-inquire', channelId: c.id, peer });
        }
      }
    }
  }
  return null;
}
