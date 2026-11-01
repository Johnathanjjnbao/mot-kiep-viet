import {
  createRun,
  dispatch,
  activeDefinition,
  choiceReason,
  choose,
  advance,
} from '../src/engine/engine';
import type { GameRun } from '../src/domain/model';
import type { CreatorPolicy, CreatorChannel } from '../src/domain/creator-economy';
import { healthyChoice } from './annual-fixture';
export const channelPolicy: CreatorPolicy = {
  format: 'video',
  rhythm: 'light',
  focus: 'craft',
  niche: 'education',
};
export function creatorAdult(seed = 'creator-economy-canonical', cohort = 2005) {
  let r = createRun(seed, {
    cohort,
    region: 'northern-village',
    wealth: 4,
    family: 'both',
    expansion: 'family',
    lifeRules: 'creator-v1',
    currency: 'vnd-v1',
    motherTraits: ['gentle'],
    fatherTraits: ['academic'],
  });
  for (let i = 0; i < 100 && r.month < 216; i++) r = creatorStep(r);
  if (r.month !== 216) throw Error('Missing creator adult');
  return r;
}
export function startChannel(
  r: GameRun,
  platform: CreatorChannel['platform'] = 'youtube',
  policy = channelPolicy,
) {
  return dispatch(r, {
    type: 'creator',
    operation: 'start',
    platform,
    policy,
    expected: r.actions.length,
  });
}
export function creatorStep(r: GameRun) {
  if (!r.activeEvent) return advance(r);
  const e = activeDefinition(r)!,
    choices = e.choices.filter((c) => !choiceReason(r, c));
  if (choices.length < 4) throw Error(`Creator choices: ${e.id}`);
  const preferred =
    e.version === 11
      ? (choices.find((c) => c.id === 'apply') ??
        choices.find((c) => c.id === 'accept') ??
        choices.find((c) => c.id === 'community') ??
        choices.find((c) => c.id === 'craft'))
      : e.version === 10
        ? choices.find(
            (c) =>
              !c.effects.some(
                (x) => x.kind === 'enterprise' && ['pause', 'close'].includes(x.operation),
              ),
          )
        : undefined;
  return choose(r, e.id, (preferred ?? healthyChoice(r)).id);
}
export function channelYears(r: GameRun, years: number) {
  const target = r.month + years * 12;
  for (let i = 0; i < years * 8 + 30 && r.status !== 'ended' && r.month < target; i++)
    r = creatorStep(r);
  return r;
}
