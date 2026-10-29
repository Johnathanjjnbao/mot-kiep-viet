import { expect, it } from 'vitest';
import { simulateLife } from '../src/diagnostics/simulation';
import { hashSeed } from '../src/engine/random';
import { parseSave, snapshot } from '../src/persistence/saves';
it('keeps the released engine/content 1.0.0 replay fingerprint stable', () => {
  const run = simulateLife('golden-1995', { cohort: 1995, region: 'central-coast' }, 2);
  expect({
    fingerprint: hashSeed(JSON.stringify(run)),
    month: run.month,
    ending: run.ending,
    choices: run.choices.length,
    cash: run.finance.cash,
  }).toEqual({ fingerprint: 2525264403, month: 876, ending: 'death', choices: 33, cash: 13265 });
  expect(parseSave(JSON.stringify(snapshot(run))).run).toEqual(run);
});
