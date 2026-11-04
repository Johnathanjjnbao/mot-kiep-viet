import { readFileSync } from 'node:fs';
import type { RunSetup, RunAction } from '../src/domain/model';
import { createRun, replay, choose, manage, activeDefinition } from '../src/engine/engine';
import { currentCareer } from '../src/content/world';
import {
  assetsFunded,
  assetAction,
  assetsUntil,
  assetsStep,
  clearAssetStory,
} from './living-assets-fixture';
import { assetsCombined } from './assets-combined-fixture';
import { pcPreset } from '../src/content/pc-parts';
import { storyCapacityReason } from '../src/domain/rules';
const rows = JSON.parse(
  readFileSync(new URL('../tests/data/assets-viewport-replays.json', import.meta.url), 'utf8'),
) as { id: string; seed: string; setup: RunSetup; actions: RunAction[] }[];
export function assetsGoldenRuns() {
  const opening = createRun('assets-canonical', {
    cohort: 2005,
    region: 'northern-village',
    wealth: 4,
    family: 'both',
    expansion: 'family',
    lifeRules: 'assets-v1',
    currency: 'vnd-v1',
  });
  const row = rows.find((r) => r.id === 'living-room-2')!;
  const damage = choose(
    replay(row.seed, row.setup as RunSetup, row.actions as RunAction[]),
    row.id,
    'c',
  );
  const rental = assetAction(clearAssetStory(damage), { operation: 'leave' });
  const home = assetAction(assetsFunded(520_000_000), {
    operation: 'buy',
    item: 'home-rural',
    locality: 'quiet',
    payment: 'loan',
  });
  const mortgage = assetsUntil(home, home.month + 12);
  let pc = assetAction(assetsFunded(520_000_000), {
    operation: 'build',
    parts: pcPreset(2020),
    payment: 'loan',
  });
  const id = pc.livingAssets!.owned[0].id;
  for (const [slot, item] of [
    ['case', 'roomy-case'],
    ['psu', 'strong-psu'],
    ['gpu', 'balanced-gpu-pro'],
  ] as const)
    pc = assetAction(pc, { operation: 'upgrade', assetId: id, slot, item });
  pc = assetsUntil(pc, pc.month + 12);
  let stress = assetAction(assetsFunded(170_000_000), {
    operation: 'buy',
    item: 'home-rural',
    locality: 'quiet',
    payment: 'loan',
  });
  stress = manage(stress, 'quit-job');
  for (
    let i = 0;
    i < 100 && stress.livingAssets!.loans[0].status === 'active' && stress.status !== 'ended';
    i++
  ) {
    if (currentCareer(stress) && !storyCapacityReason(stress)) stress = manage(stress, 'quit-job');
    const e = activeDefinition(stress);
    stress = e?.id === 'employment-search' ? choose(stress, e.id, 'rest') : assetsStep(stress);
  }
  const combined = assetsCombined().run;
  let long = assetAction(assetsFunded(520_000_000), {
    operation: 'buy',
    item: 'home-rural',
    locality: 'quiet',
  });
  long = assetAction(long, { operation: 'build', parts: pcPreset(2020) });
  long = assetAction(long, { operation: 'buy', item: 'phone-balanced' });
  long = assetAction(long, { operation: 'buy', item: 'motorcycle-basic' });
  long = assetAction(long, { operation: 'train', item: 'motorcycle' });
  for (let i = 0; i < 512 && long.status !== 'ended'; i++) long = assetsStep(long);
  return {
    opening,
    'rental-damage-exit': rental,
    mortgage,
    'pc-upgrade-financed': pc,
    'mortgage-distress': stress,
    'combined-life': combined,
    'long-life': long,
    'outstanding-death': assetsLateLoanDeath(),
  };
}
export function assetsLateLoanDeath() {
  let r = assetsFunded(520_000_000, 5);
  for (
    let i = 0;
    i < 512 && r.status !== 'ended' && !(r.month >= 960 && r.player.stats.health <= 8);
    i++
  )
    r = assetsStep(r);
  if (r.status === 'ended') throw Error('Missing canonical late-life borrower');
  r = assetAction(r, { operation: 'build', parts: pcPreset(2010), payment: 'loan' });
  for (let i = 0; i < 60 && r.status !== 'ended'; i++) r = assetsStep(r);
  if (r.status !== 'ended' || !r.livingAssets!.loans[0].principal)
    throw Error('Missing outstanding loan at natural ending');
  return r;
}
export function assetsLoanCapacity() {
  let r = assetsFunded(520_000_000);
  for (let i = 0; i < 12; i++) {
    r = assetAction(r, { operation: 'build', parts: pcPreset(2020), payment: 'loan' });
    const loan = r.livingAssets!.loans.at(-1)!;
    r = assetAction(r, { operation: 'repay', loanId: loan.id, amount: loan.principal });
    r = assetAction(r, { operation: 'sell', assetId: loan.assetId });
  }
  return r;
}
