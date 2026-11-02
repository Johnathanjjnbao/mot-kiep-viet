import type { GameRun } from '../src/domain/model';
import type { CreativeAction } from '../src/domain/creative-careers';
import { freelanceAdult, freelanceStep } from './freelance-fixture';
import { startChannel } from './creator-economy-fixture';
import { dispatch, activeDefinition, choiceReason } from '../src/engine/engine';
import { creatorReason } from '../src/engine/creator-economy';
import { creativeReason, currentCollaboration } from '../src/engine/creative-careers';
import { healthyChoice } from './annual-fixture';
export function creativeStep(r: GameRun) {
  const e = activeDefinition(r);
  if (!e) return dispatch(r, { type: 'advance' });
  const choices = e.choices.filter((c) => !choiceReason(r, c));
  if (choices.length < 4) throw Error('Creative choices ' + e.id);
  const x = currentCollaboration(r),
    g = r.creative?.gaming;
  const wanted =
    x?.status === 'proposal'
      ? 'collab-balanced'
      : x?.status === 'offered'
        ? 'collab-accept'
        : x?.status === 'working'
          ? 'collab-protect'
          : g?.fatigue && g.fatigue >= 65
            ? 'gaming-rest'
            : g && g.community < 25
              ? 'gaming-community'
              : g && g.skill < 60
                ? 'gaming-practice'
                : 'gaming-retention';
  const chosen =
    e.version === 14
      ? (choices.find((c) =>
          c.effects.some((f) => f.kind === 'creative' && f.operation === wanted),
        ) ??
        choices.find((c) =>
          c.effects.some((f) => f.kind === 'creative' && f.operation === 'collab-wait'),
        ) ??
        choices[0])
      : e.version === 11
        ? (choices.find((c) => c.id === 'apply') ??
          choices.find((c) => c.id === 'accept') ??
          choices.find((c) => c.id === 'community') ??
          choices.find((c) => c.id === 'craft') ??
          healthyChoice(r))
        : healthyChoice(r);
  return dispatch(r, { type: 'choose', eventId: e.id, choiceId: chosen.id });
}
export function creativeAction(
  r: GameRun,
  operation: CreativeAction['operation'],
  extra: Partial<CreativeAction> = {},
) {
  return dispatch(r, { type: 'creative', operation, ...extra, expected: r.actions.length });
}
export function creativeChannel(
  seed = 'native-stream-0',
  platform: 'youtube' | 'tiktok' = 'youtube',
) {
  let r = startChannel(freelanceAdult(seed), platform, {
    format: 'video',
    rhythm: 'light',
    focus: 'craft',
    niche: 'gaming',
  });
  for (let i = 0; i < 32 && r.creator!.channels[0].audience < 1000; i++) r = freelanceStep(r);
  for (let i = 0; i < 12 && creatorReason(r); i++) r = freelanceStep(r);
  const c = r.creator!.channels[0];
  if (c.audience < 1000 || c.status !== 'active')
    throw Error('Missing genuine audience/funds for ' + seed);
  r = dispatch(r, {
    type: 'creator',
    operation: 'equipment',
    id: 'creator:0',
    expected: r.actions.length,
  });
  r = dispatch(r, {
    type: 'creator',
    operation: 'policy',
    id: 'creator:0',
    policy: { ...c.policy, format: 'live' },
    expected: r.actions.length,
  });
  if (creativeReason(r)) throw Error(creativeReason(r)!);
  return r;
}
export function gamingFixture(seed = 'native-stream-0') {
  return creativeAction(creativeChannel(seed), 'gaming-start', { channelId: 'creator:0' });
}
