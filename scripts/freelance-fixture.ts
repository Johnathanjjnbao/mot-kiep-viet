import type { GameRun, RunSetup } from '../src/domain/model';
import type { FreelanceAction, FreelanceService } from '../src/domain/freelance';
import { createRun, activeDefinition, choiceReason, dispatch } from '../src/engine/engine';
import { healthyChoice } from './annual-fixture';
import { currentProject } from '../src/engine/freelance';
import { careerReason, currentCareer } from '../src/content/world';
export function freelanceStep(r: GameRun) {
  const e = activeDefinition(r);
  if (!e) return dispatch(r, { type: 'advance' });
  const available = e.choices.filter((c) => !choiceReason(r, c));
  if (available.length < 4) throw Error('Freelance fewer than four choices: ' + e.id);
  const p = currentProject(r);
  const desired =
    p?.status === 'inquiry'
      ? 'quote-modest'
      : p?.status === 'offered'
        ? 'accept-careful'
        : p?.status === 'working'
          ? 'careful'
          : p?.status === 'ready'
            ? 'deliver'
            : p?.status === 'rework'
              ? 'revise'
              : 'wait';
  const learning =
    r.month < 216
      ? [...available].sort((a, b) => {
          const score = (c: typeof a) =>
            c.effects.reduce(
              (n, f) =>
                n +
                (f.kind === 'stat'
                  ? f.stat === 'skill' && r.player.stats.skill < 24
                    ? f.amount * 6
                    : f.stat === 'knowledge' && r.player.stats.knowledge < 38
                      ? f.amount * 6
                      : f.stat === 'health'
                        ? f.amount
                        : 0
                  : f.kind === 'habit'
                    ? f.amount * 3
                    : 0),
              0,
            );
          return score(b) - score(a);
        })[0]
      : undefined;
  const chosen =
    learning ??
    (e.version === 13
      ? (available.find((c) =>
          c.effects.some((f) => f.kind === 'freelance' && f.operation === desired),
        ) ?? available[0])
      : healthyChoice(r));
  return dispatch(r, { type: 'choose', eventId: e.id, choiceId: chosen.id });
}
export function freelanceAdult(seed = 'native-client-0', extra: Partial<RunSetup> = {}) {
  let r = createRun(seed, {
    cohort: 2005,
    region: 'northern-village',
    wealth: 4,
    family: 'both',
    expansion: 'family',
    lifeRules: 'creative-v1',
    currency: 'vnd-v1',
    ...extra,
  });
  for (let i = 0; i < 100 && r.month < 216; i++) r = freelanceStep(r);
  if (r.month !== 216) throw Error('Missing native adult');
  if (!currentCareer(r) && !careerReason(r, 'retail'))
    r = dispatch(r, { type: 'manage', action: 'apply-job', career: 'retail' });
  return r;
}
export function projectAction(
  r: GameRun,
  operation: FreelanceAction['operation'],
  extra: Partial<FreelanceAction> = {},
) {
  return dispatch(r, {
    type: 'freelance',
    operation,
    ...(operation === 'inquire' ? {} : { id: currentProject(r)!.id }),
    ...extra,
    expected: r.actions.length,
  });
}
export function openProject(r: GameRun, service: FreelanceService = 'writing') {
  r = projectAction(r, 'inquire', { service });
  r = projectAction(r, 'negotiate', { terms: 'modest' });
  if (currentProject(r)?.status === 'offered') r = projectAction(r, 'accept');
  return r;
}
export function finishProject(input: GameRun) {
  let r = input;
  for (let i = 0; i < 40 && currentProject(r) && r.status !== 'ended'; i++) {
    const p = currentProject(r)!;
    if (p.status === 'ready' && !r.social?.focus && !r.family?.focus && !r.academics?.focus)
      r = projectAction(r, 'deliver');
    else if (p.status === 'rework' && !r.social?.focus && !r.family?.focus && !r.academics?.focus)
      r = projectAction(r, 'revise');
    else r = freelanceStep(r);
  }
  if (currentProject(r)) throw Error('Unbounded client project');
  return r;
}

/** Search genuine action histories; never forge balances, review rolls or skills. */
export function freelanceCase(kind: 'paid' | 'rejected' | 'rework' | 'partial' | 'unpaid') {
  for (let i = 0; i < 160; i++) {
    let r = openProject(freelanceAdult('native-client-' + i));
    if (kind === 'rejected' && r.freelance!.projects[0].ending === kind) return r;
    if (!currentProject(r)) continue;
    if (kind === 'rework' || kind === 'partial') r = projectAction(r, 'policy', { policy: 'rush' });
    for (let step = 0; step < 40 && currentProject(r); step++) {
      const p = currentProject(r)!;
      if (p.status === 'rework' && kind === 'rework') return r;
      if (p.status === 'rework' && kind === 'partial') r = projectAction(r, 'settle');
      else if (p.status === 'ready') r = projectAction(r, 'deliver');
      else if (p.status === 'rework') r = projectAction(r, 'revise');
      else r = freelanceStep(r);
    }
    if (r.freelance!.projects[0].ending === kind) return r;
  }
  throw Error('Missing genuine client fixture: ' + kind);
}
