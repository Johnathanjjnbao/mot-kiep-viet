import { readFileSync, writeFileSync } from 'node:fs';
import type { GameRun } from '../src/domain/model';
import { stableEvents } from '../src/content/stable-events';
import { activeDefinition, replay, dispatch, createRun } from '../src/engine/engine';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
import { creativeGraduateParent, nativeLongStep } from './creative-forced-fixture';
import { married } from './social-fixture';
const file = 'tests/data/stable-viewport-replays.json';
type Row = Pick<GameRun, 'seed' | 'setup' | 'actions'> & { id: string };
const found = new Map((JSON.parse(readFileSync(file, 'utf8')) as Row[]).map((r) => [r.id, r]));
function capture(r: GameRun) {
  const e = activeDefinition(r);
  if (e?.version === 16 && !found.has(e.id))
    found.set(
      e.id,
      structuredClone({ id: e.id, seed: r.seed, setup: r.setup, actions: r.actions }),
    );
  return r;
}
for (let i = 0; i < 8; i++) {
  let r = capture(creativeGraduateParent(i, 'stable-v1'));
  let prefix = createRun(r.seed, r.setup);
  for (const action of r.actions) prefix = capture(dispatch(prefix, action));
  for (let j = 0; j < 400 && r.status !== 'ended'; j++) r = capture(nativeLongStep(r));
}
for (
  let i = 0;
  i < 20 && (!found.has('stable-neighbor-4') || !found.has('stable-distance-4'));
  i++
) {
  let r = createRun('stable-long-' + i, {
    cohort: 2005,
    region: 'northern-village',
    wealth: 4,
    lifeRules: 'stable-v1',
    currency: 'vnd-v1',
    expansion: 'family',
  });
  for (let j = 0; j < 512 && r.status !== 'ended'; j++) {
    const e = activeDefinition(r);
    r = capture(
      e?.version === 16
        ? dispatch(r, { type: 'choose', eventId: e.id, choiceId: e.choices[0].id })
        : nativeLongStep(r),
    );
  }
}
for (let i = 0; i < 30 && !found.has('stable-rented-corner'); i++) {
  let r = createRun('stable-rental-' + i, {
    cohort: 2005,
    region: 'southern-city',
    wealth: 4,
    lifeRules: 'stable-v1',
    currency: 'vnd-v1',
    expansion: 'family',
  });
  while (r.month < 216 && r.status !== 'ended') r = capture(nativeLongStep(r));
  if (r.status === 'ended') continue;
  r = capture(dispatch(r, { type: 'manage', action: 'move-home' }));
  while (r.month < 312 && r.status !== 'ended') r = capture(nativeLongStep(r));
}
for (let i = 0; i < 60 && !found.has('stable-shared-evening'); i++) {
  const start = createRun('stable-young-family-' + i, {
    cohort: 2005,
    region: 'northern-village',
    wealth: 4,
    lifeRules: 'stable-v1',
    currency: 'vnd-v1',
    expansion: 'family',
  });
  const p = start.social!.people[0];
  if (!p.romanticOpen || !p.exclusivityOpen || !p.marriageOpen) continue;
  let r: GameRun;
  try {
    r = capture(married(start));
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('Cuộc trò chuyện chưa phù hợp'))
      throw error;
    continue; // A candidate may not meet the real social prerequisites; never forge the relationship.
  }
  while (r.month < 492 && r.status !== 'ended') r = capture(nativeLongStep(r));
}
const missing = stableEvents.filter((e) => !found.has(e.id)).map((e) => e.id);
for (const row of found.values()) {
  const r = replay(row.seed, row.setup, row.actions);
  if (activeDefinition(r)?.id !== row.id) throw Error('Fixture target ' + row.id);
  if (canonical(parseSave(JSON.stringify(snapshot(r))).run) !== canonical(r))
    throw Error('Parse ' + row.id);
}
writeFileSync(
  file,
  JSON.stringify([...found.values()].sort((a, b) => a.id.localeCompare(b.id))) + '\n',
);
console.log(JSON.stringify({ authored: stableEvents.length, covered: found.size, missing }));
if (missing.length) process.exitCode = 1;
