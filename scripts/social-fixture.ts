import {createRun,activeDefinition,choiceReason,advance,choose} from '../src/engine/engine';
import {requestSocial} from '../src/engine/social';
import type {GameRun} from '../src/domain/model';
import type {SocialOperation} from '../src/domain/social';
export function born(seed = 'social-1') {
  return createRun(seed, {
    expansion: 'social',
    cohort: 1995,
    region: 'northern-village',
    wealth: 4,
    family: 'both',
  });
}
export function toAge(r: GameRun, age: number) {
  for (let i = 0; i < 180 && r.month < age * 12 && r.status !== 'ended'; i++) {
    if (r.activeEvent) {
      const e = activeDefinition(r)!;
      r = choose(r, e.id, e.choices.find((c) => !choiceReason(r, c))!.id);
    } else r = advance(r);
  }
  return r;
}
export function talk(r: GameRun, id: string, npcId: string, op: SocialOperation) {
  r = requestSocial(r, { type: 'social', templateId: id, npcId, expected: r.actions.length });
  const e = activeDefinition(r)!;
  return choose(
    r,
    e.id,
    e.choices.find((c) => c.effects.some((e) => e.kind === 'social' && e.operation === op))!.id,
  );
}
export function friendly(r: GameRun, id: string) {
  for (const [scene, op] of [
    ['soc-meet', 'meet'],
    ['soc-listen', 'listen'],
    ['soc-book', 'learn'],
    ['soc-boundary', 'respect'],
  ] as const)
    r = talk(r, scene, id, op);
  return r;
}
export function suitable() {
  for (let i = 0; i < 2000; i++) {
    const r = born('social-all-' + i),
      p = r.social!.people;
    if (
      p.every((p) => p.romanticOpen) &&
      p[0].exclusivityOpen &&
      p[0].marriageOpen &&
      p[0].reconciliationOpen &&
      p[1].secretWilling
    )
      return r;
  }
  throw Error('No fixture');
}
export function married(input?:GameRun) {
  let r = toAge(input??suitable(), 18);
  const id = r.social!.people[0].npcId;
  r = friendly(r, id);
  r = talk(r, 'soc-date', id, 'date');
  r = talk(r, 'soc-exclusive', id, 'exclusive');
  r = toAge(r, 20);
  r = talk(r, 'soc-listen', id, 'listen');
  r = talk(r, 'soc-book', id, 'learn');
  r = talk(r, 'soc-boundary', id, 'respect');
  r = talk(r, 'soc-cohabit', id, 'cohabit');
  r = talk(r, 'soc-proposal', id, 'propose');
  if(r.social!.people[0].status!=='married')throw Error('Marriage fixture failed');
  return r;
}
