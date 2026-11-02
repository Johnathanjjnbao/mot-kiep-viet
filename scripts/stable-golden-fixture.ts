import { createRun, dispatch, replay } from '../src/engine/engine';
import type { RunSetup, RunAction } from '../src/domain/model';
import rows from '../tests/data/stable-viewport-replays.json';
import { creativeFullPortfolio, nativeLongStep } from './creative-forced-fixture';
export function stableGoldenRuns() {
  const setup = {
    cohort: 2005,
    region: 'northern-village',
    wealth: 4,
    family: 'both',
    expansion: 'family',
    lifeRules: 'stable-v1',
    currency: 'vnd-v1',
  } as const;
  const opening = createRun('stable-canonical', setup);
  let long = createRun('realism-canonical', setup);
  for (let i = 0; i < 512 && long.status !== 'ended'; i++) long = nativeLongStep(long);
  let combined = creativeFullPortfolio(0, 'stable-v1');
  while (combined.actions.filter((a) => !['choose', 'advance'].includes(a.type)).length < 120)
    combined = dispatch(combined, {
      type: 'manage',
      action: combined.finance.savings ? 'withdraw-money' : 'save-money',
    });
  for (let i = 0; i < 512 && combined.status !== 'ended'; i++) combined = nativeLongStep(combined);
  const learning = rows.find((r) => r.id === 'stable-learning-4')!,
    old = rows.find((r) => r.id === 'stable-help-with-consent')!;
  const before = replay(learning.seed, learning.setup as RunSetup, learning.actions as RunAction[]);
  const elderly = replay(old.seed, old.setup as RunSetup, old.actions as RunAction[]);
  return {
    opening,
    'long-life': long,
    'combined-life': combined,
    'learning-complete': dispatch(before, { type: 'choose', eventId: learning.id, choiceId: 'a' }),
    'learning-withdraw': dispatch(before, { type: 'choose', eventId: learning.id, choiceId: 'd' }),
    'elderly-agency': dispatch(elderly, { type: 'choose', eventId: old.id, choiceId: 'a' }),
  };
}
