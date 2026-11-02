import { readFileSync, writeFileSync } from 'node:fs';
import type { GameRun } from '../src/domain/model';
import { activeDefinition, dispatch, replay } from '../src/engine/engine';
import { canonical, snapshot, parseSave } from '../src/persistence/saves';
import { assertRun } from '../src/engine/invariants';
import { CLIENT_SERVICES } from '../src/content/freelance-services';
import { freelanceEvents } from '../src/content/freelance-events';
import { creativeEvents } from '../src/content/creative-events';
import { artisticEvents } from '../src/content/artistic-events';
import { creativeGraduateParent } from './creative-forced-fixture';
import { freelanceCase, freelanceStep, projectAction } from './freelance-fixture';
import { creativeChannel, creativeAction, creativeStep, gamingFixture } from './creative-fixture';
import { artisticReady, artisticStep, artisticAction, artisticOffer } from './artistic-fixture';
import { creativeOptional } from '../src/diagnostics/creative-policy';
import { discretionaryCount } from '../src/domain/rules';
import { serviceReason, currentProject } from '../src/engine/freelance';
import { creativeReason, collaborationReason } from '../src/engine/creative-careers';
const targets = [...freelanceEvents, ...creativeEvents, ...artisticEvents].map((e) => e.id),
  found = new Map<string, GameRun>();
function capture(r: GameRun) {
  const e = activeDefinition(r);
  if (e && targets.includes(e.id) && !found.has(e.id)) {
    assertRun(r);
    found.set(e.id, r);
    console.log(`${found.size}/${targets.length}: ${e.id}`);
  }
  return r;
}
// Genuine seed68 prefix: the previous fixture rested/delayed through the early show window.
const firstShow = JSON.parse(readFileSync('tests/data/creative-first-show-prefix.json', 'utf8'));
capture(replay(firstShow.seed, firstShow.setup, firstShow.actions));
for (const service of CLIENT_SERVICES) {
  for (let seed = 0; seed < 12 && !found.has('fl-service-' + service.id); seed++) {
    let r = creativeGraduateParent();
    for (let j = 0; j < seed * 2; j++) r = freelanceStep(r);
    if (serviceReason(r, service.id)) continue;
    r = capture(projectAction(r, 'inquire', { service: service.id }));
    for (
      let i = 0;
      i < 8 && currentProject(r)?.status === 'inquiry' && r.activeEvent?.id !== 'fl-inquiry';
      i++
    )
      r = capture(freelanceStep(r));
    if (currentProject(r)?.status !== 'inquiry') continue;
    r = capture(projectAction(r, 'negotiate', { terms: 'modest' }));
    if (currentProject(r)?.status !== 'offered') continue;
    r = capture(projectAction(r, 'accept'));
    for (let i = 0; i < 20 && currentProject(r)?.status === 'working'; i++)
      r = capture(freelanceStep(r));
    if (currentProject(r)?.status === 'ready') capture(projectAction(r, 'deliver'));
  }
}
const repair = capture(freelanceCase('rework'));
capture(projectAction(repair, 'settle'));
for (
  let seed = 0;
  seed < 12 &&
  targets.some((id) => (id.startsWith('gm-') || id.startsWith('co-')) && !found.has(id));
  seed++
) {
  let r = capture(gamingFixture('native-stream-' + seed));
  for (let i = 0; i < 180 && r.status !== 'ended'; i++) {
    const optional = discretionaryCount(r) < 108 ? creativeOptional(r, 2) : null;
    if (optional) {
      r = capture(optional);
      continue;
    }
    const e = activeDefinition(r),
      g = r.creative!.gaming!;
    if (e?.id === 'gm-burnout' && g.fatigue < 30) {
      const c = e.choices.find((c) =>
        c.effects.some((f) => f.kind === 'creative' && f.operation === 'gaming-community'),
      )!;
      r = capture(dispatch(r, { type: 'choose', eventId: e.id, choiceId: c.id }));
    } else r = capture(creativeStep(r));
    if (creativeEvents.every((e) => found.has(e.id))) break;
  }
}
for (
  let seed = 0;
  seed < 20 && creativeEvents.some((e) => e.id.startsWith('co-') && !found.has(e.id));
  seed++
) {
  let r = creativeChannel('native-stream-' + seed);
  if (r.creator!.channels[0].policy.focus !== 'community')
    r = dispatch(r, {
      type: 'creator',
      operation: 'policy',
      id: 'creator:0',
      policy: { ...r.creator!.channels[0].policy, focus: 'community' },
      expected: r.actions.length,
    });
  for (let i = 0; i < 30 && collaborationReason(r, r.creator!.channels[0], 'club-host'); i++)
    r = capture(creativeStep(r));
  if (collaborationReason(r, r.creator!.channels[0], 'club-host')) continue;
  r = capture(creativeAction(r, 'collab-inquire', { channelId: 'creator:0', peer: 'club-host' }));
  for (
    let i = 0;
    i < 16 &&
    r.creative!.collaborations[0].status === 'proposal' &&
    r.activeEvent?.id !== 'co-proposal';
    i++
  )
    r = capture(creativeStep(r));
  if (r.creative!.collaborations[0].status === 'proposal' && !creativeReason(r))
    r = capture(creativeAction(r, 'collab-negotiate', { id: 'collab:0', terms: 'balanced' }));
  if (r.creative!.collaborations[0].status === 'offered' && !creativeReason(r))
    r = capture(creativeAction(r, 'collab-accept', { id: 'collab:0' }));
  for (let i = 0; i < 10; i++) r = capture(creativeStep(r));
}
capture(artisticOffer('offered'));
for (const discipline of ['music', 'dance', 'acting'] as const) {
  let r = capture(artisticReady('native-stage-0', discipline));
  r = capture(artisticAction(r, 'independent'));
  for (let i = 0; i < 160 && r.status !== 'ended'; i++) {
    r = capture(artisticStep(r));
  }
}

let retired = capture(artisticAction(artisticReady(), 'retire'));
for (let i = 0; i < 150 && !found.has('ar-comeback') && retired.status !== 'ended'; i++)
  retired = capture(artisticStep(retired));
const missing = targets.filter((id) => !found.has(id));
if (missing.length) throw Error('Missing canonical creative scenes: ' + missing.join(', '));
const rows = [...found]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([id, r]) => {
    if (canonical(replay(r.seed, r.setup, r.actions)) !== canonical(r)) throw Error('Replay ' + id);
    parseSave(JSON.stringify(snapshot(r)));
    return { id, seed: r.seed, setup: r.setup, actions: r.actions };
  });
writeFileSync('tests/data/creative-viewport-replays.json', JSON.stringify(rows) + '\n');
console.log(
  JSON.stringify({
    status: 'PASS',
    authored: rows.length,
    bytes: Buffer.byteLength(JSON.stringify(rows)),
  }),
);
