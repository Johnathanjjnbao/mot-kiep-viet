import type { GameRun } from '../src/domain/model';
import type { ArtisticAction, ArtDiscipline } from '../src/domain/artistic';
import { freelanceAdult } from './freelance-fixture';
import { creativeStep } from './creative-fixture';
import { dispatch, activeDefinition, choiceReason } from '../src/engine/engine';
import { artisticReadiness, artisticReason } from '../src/engine/artistic';
export function artisticAction(
  r: GameRun,
  operation: ArtisticAction['operation'],
  extra: Partial<ArtisticAction> = {},
) {
  return dispatch(r, { type: 'artistic', operation, ...extra, expected: r.actions.length });
}
export function artisticStep(r: GameRun) {
  const e = activeDefinition(r);
  if (!e || e.version !== 15) return creativeStep(r);
  const p = r.creative!.artist!,
    wanted =
      p.status === 'offered'
        ? 'accept'
        : p.status === 'retired'
          ? 'reflect'
          : p.burnout >= 65
            ? 'rest'
            : p.status === 'resting' && p.burnout < 40
              ? 'technique'
              : p.skill < 70
                ? 'technique'
                : p.presence < 65
                  ? 'stage'
                  : 'community';
  const choices = e.choices.filter((c) => !choiceReason(r, c));
  if (choices.length < 4) throw Error('Artistic choices ' + e.id);
  const chosen =
    choices.find((c) => c.effects.some((x) => x.kind === 'artistic' && x.operation === wanted)) ??
    choices.find((c) =>
      c.effects.some((x) => x.kind === 'artistic' && x.operation === 'reflect'),
    ) ??
    choices[0];
  return dispatch(r, { type: 'choose', eventId: e.id, choiceId: chosen.id });
}
export function artisticReady(seed = 'native-stage-0', discipline: ArtDiscipline = 'music') {
  let r = artisticAction(freelanceAdult(seed), 'start', { discipline });
  for (let i = 0; i < 16 && artisticReadiness(r); i++) r = artisticStep(r);
  if (artisticReadiness(r))
    throw Error('Missing real artistic readiness ' + seed + ': ' + artisticReadiness(r));
  return r;
}
export function artisticOffer(kind: 'offered' | 'rejected', discipline: ArtDiscipline = 'music') {
  for (let i = 0; i < 80; i++) {
    let r = artisticReady('native-stage-' + i, discipline);
    if (artisticReason(r)) continue;
    r = artisticAction(r, 'audition', { terms: 'fast-track' });
    for (let step = 0; step < 8 && r.creative!.artist!.auditions[0].result === 'pending'; step++)
      r = artisticStep(r);
    // Stop on the untouched offer so UI must explicitly accept it.
    if (r.creative!.artist!.auditions[0].result === kind) return r;
  }
  throw Error('Missing genuine artistic ' + kind);
}
