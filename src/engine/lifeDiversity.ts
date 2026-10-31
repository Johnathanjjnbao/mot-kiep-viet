import type { EventDefinition, GameRun } from '../domain/model';
import { allEvents } from '../content/events';
import { origins } from '../content/childhood-diversity';
import { residentParents } from '../domain/creator';

export function originEligible(run: GameRun, id: string) {
  const origin = origins[id];
  if (!origin) return true;
  return (
    (!origin.environment || run.setup.environment === origin.environment) &&
    (origin.minWealth === undefined || run.household.resources >= origin.minWealth) &&
    (origin.maxWealth === undefined || run.household.resources <= origin.maxWealth) &&
    (!origin.trait || run.player.traits.includes(origin.trait)) &&
    (!origin.parentTrait ||
      residentParents(run).some((n) => n.personality?.includes(origin.parentTrait!))) &&
    (!origin.separated || run.setup.family?.startsWith('with-'))
  );
}
export function dynamicPool(run: GameRun, options: EventDefinition[]) {
  // These beats have a short eligibility window and carry the school transition.
  const required =
    options.find((e) => e.id === 'first-school') ??
    (run.month >= 204 ? options.find((e) => e.id === 'exam-night') : undefined);
  return required ? [required] : options;
}
export function diversityWeight(run: GameRun, event: EventDefinition) {
  const recent = run.choices
    .slice(-2)
    .map((c) => allEvents().find((e) => e.id === c.eventId)?.category);
  const repetition =
    recent.at(-1) === event.category ? 0.35 : recent.includes(event.category) ? 0.7 : 1;
  return (1 + Math.min(20, event.priority) / 10) * repetition;
}
