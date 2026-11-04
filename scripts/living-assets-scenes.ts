import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { GameRun } from '../src/domain/model';
import { academicApplicant } from './academic-fixture';
import { assetsFunded, assetAction } from './living-assets-fixture';
import { creativeGraduateParent } from './creative-forced-fixture';
import { healthyChoice } from './annual-fixture';
import {
  activeDefinition,
  advance,
  choose,
  dispatch,
  createRun,
  replay,
  manage,
} from '../src/engine/engine';
import { currentCareer, careerReason } from '../src/content/world';
import { livingAssetReason } from '../src/engine/living-assets';
import { creatorReason } from '../src/engine/creator-economy';
import { storyCapacityReason } from '../src/domain/rules';
import { assertRun } from '../src/engine/invariants';
import { pcPreset } from '../src/content/pc-parts';
import { livingAssetsEvents } from '../src/content/living-assets-events';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
const file = 'tests/data/assets-viewport-replays.json';
type Row = Pick<GameRun, 'seed' | 'setup' | 'actions'> & { id: string };
const found = new Map<string, Row>(
  existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Row[]).map((x) => [x.id, x]) : [],
);
function capture(r: GameRun) {
  assertRun(r);
  const e = activeDefinition(r);
  if (e?.version === 17 && !found.has(e.id)) {
    found.set(
      e.id,
      structuredClone({ id: e.id, seed: r.seed, setup: r.setup, actions: r.actions }),
    );
    writeFileSync(file, JSON.stringify([...found.values()]) + '\n');
    console.log(found.size + '/' + livingAssetsEvents.length + ': ' + e.id);
  }
  return r;
}
function step(r: GameRun) {
  const e = activeDefinition(r);
  return capture(
    e
      ? choose(
          r,
          e.id,
          e.id === 'employment-search'
            ? 'rest'
            : e.version === 17
              ? e.choices[0].id
              : healthyChoice(r).id,
        )
      : advance(r),
  );
}
function clear(r: GameRun) {
  for (let i = 0; i < 20 && r.activeEvent?.id.startsWith('living-'); i++) r = step(r);
  return r;
}
function prefix(r: GameRun) {
  let n = createRun(r.seed, r.setup);
  capture(n);
  for (const a of r.actions) n = capture(dispatch(n, a));
  return n;
}
function attempt(r: GameRun, a: Parameters<typeof assetAction>[1]) {
  r = clear(r);
  const full = { type: 'living-assets' as const, expected: r.actions.length, ...a };
  return livingAssetReason(r, full) ? r : capture(assetAction(r, a));
}
const summaries = [];
for (let index = 0; index < 10 && found.size < livingAssetsEvents.length; index++) {
  for (const mode of ['rental', 'owner', 'poor', 'loan', 'family'] as const) {
    let r =
      mode === 'owner'
        ? prefix(assetsFunded(520_000_000, index))
        : mode === 'loan'
          ? prefix(assetsFunded(170_000_000, index))
          : mode === 'family'
            ? prefix(creativeGraduateParent(index, 'assets-v1'))
            : capture(academicApplicant(index, 'assets-v1', 'vnd-v1'));
    if (mode === 'owner' || mode === 'loan')
      r = attempt(r, {
        operation: 'buy',
        item: 'home-rural',
        locality: 'quiet',
        payment: mode === 'loan' ? 'loan' : 'cash',
      });
    else
      r = attempt(r, {
        operation: 'rent',
        item: 'rent-room',
        locality: mode === 'family' ? 'central' : 'quiet',
      });
    r = attempt(r, { operation: 'buy', item: 'phone-basic' });
    r = attempt(r, { operation: 'buy', item: 'bicycle' });
    if (mode === 'loan' && currentCareer(r)) r = manage(r, 'quit-job');
    let replacement = false;
    for (let i = 0; i < 500 && r.status !== 'ended'; i++) {
      if (mode === 'family' && !r.livingAssets!.residence)
        r = attempt(r, { operation: 'rent', item: 'rent-room', locality: 'central' });
      if (
        (mode === 'poor' || mode === 'loan') &&
        currentCareer(r) &&
        !storyCapacityReason(r) &&
        !r.social?.focus &&
        !r.family?.focus &&
        !r.academics?.focus
      )
        r = capture(manage(r, 'quit-job'));
      if (
        mode !== 'poor' &&
        mode !== 'loan' &&
        !currentCareer(r) &&
        r.month < 768 &&
        !careerReason(r, 'office') &&
        !storyCapacityReason(r) &&
        !r.social?.focus &&
        !r.family?.focus &&
        !r.academics?.focus
      )
        r = capture(manage(r, 'apply-job', 'office'));
      if (
        r.month >= 300 &&
        !r.livingAssets!.owned.some((a) => a.category === 'pc') &&
        !r.actions.some((a) => a.type === 'living-assets' && a.operation === 'build')
      )
        r = attempt(r, { operation: 'build', parts: pcPreset(r.world.year) });
      const pc = r.livingAssets!.owned.find((a) => a.category === 'pc');
      if (pc?.parts?.cpu === 'balanced-cpu' && r.seen['living-pc-2'] !== undefined)
        for (const [slot, item] of [
          ['case', 'roomy-case'],
          ['psu', 'strong-psu'],
          ['gpu', 'balanced-gpu-pro'],
        ] as const)
          if (pc.parts[slot] !== item) {
            r = attempt(r, { operation: 'upgrade', assetId: pc.id, slot, item });
            break;
          }
      if (
        !r.creator!.channels.length &&
        !['business', 'freelance'].includes(currentCareer(r)?.id ?? '') &&
        r.world.year >= 2014 &&
        r.finance.cash >= 4_000_000 &&
        !creatorReason(r) &&
        !storyCapacityReason(r)
      )
        r = capture(
          dispatch(r, {
            type: 'creator',
            operation: 'start',
            platform: 'youtube',
            policy: { format: 'video', rhythm: 'light', focus: 'craft', niche: 'gaming' },
            expected: r.actions.length,
          }),
        );
      if (
        !replacement &&
        r.seen['living-phone-wear'] !== undefined &&
        r.month > r.seen['living-phone-wear'] &&
        r.finance.cash > 7_000_000
      ) {
        const phone = r.livingAssets!.owned.find((a) => a.category === 'phone');
        if (phone) r = attempt(r, { operation: 'sell', assetId: phone.id });
        if (!r.livingAssets!.owned.some((a) => a.category === 'phone'))
          r = attempt(r, { operation: 'buy', item: 'phone-balanced' });
        replacement = r.livingAssets!.owned.some((a) => a.catalogId === 'phone-balanced');
      }
      r = step(r);
    }
    if (r.status !== 'ended') throw Error('Unfinished canonical scenario ' + mode + ':' + r.seed);
    if (canonical(parseSave(JSON.stringify(snapshot(r))).run) !== canonical(r))
      throw Error('Scenario save mismatch ' + mode);
    summaries.push({
      mode,
      seed: r.seed,
      age: r.month / 12,
      actions: r.actions.length,
      bytes: Buffer.byteLength(JSON.stringify(snapshot(r))),
    });
  }
}
for (const row of found.values()) {
  const r = replay(row.seed, row.setup, row.actions);
  if (activeDefinition(r)?.id !== row.id) throw Error('Unreachable ' + row.id);
  if (canonical(parseSave(JSON.stringify(snapshot(r))).run) !== canonical(r))
    throw Error('Scene save ' + row.id);
}
writeFileSync(
  file,
  JSON.stringify([...found.values()].sort((a, b) => a.id.localeCompare(b.id))) + '\n',
);
const missing = livingAssetsEvents.filter((e) => !found.has(e.id)).map((e) => e.id);
writeFileSync(
  'docs/evidence/assets-scenes.json',
  JSON.stringify(
    {
      status: missing.length ? 'INCOMPLETE' : 'VERIFIED PASS',
      covered: found.size,
      missing,
      summaries,
    },
    null,
    2,
  ) + '\n',
);
console.log(JSON.stringify({ covered: found.size, missing, summaries }));
if (missing.length) process.exitCode = 1;
