import { createRun, advance, choose, activeDefinition, choiceReason } from '../src/engine/engine';
import { snapshot } from '../src/persistence/saves';
import { writeFileSync } from 'node:fs';
let run = createRun('viewport-0', {
  lifeRules: 'dynamic-v1',
  expansion: 'family',
  cohort: 1995,
  region: 'northern-village',
});
for (let i = 0; i < 60 && run.activeEvent?.id !== 'education-path'; i++) {
  if (!run.activeEvent) run = advance(run);
  else {
    const event = activeDefinition(run)!;
    run = choose(run, event.id, event.choices.find((c) => !choiceReason(run, c))!.id);
  }
}
if (activeDefinition(run)?.choices.length !== 6)
  throw Error('Fixture must exercise six authored choices');
writeFileSync(
  'tests/data/viewport-dynamic-v1.json',
  JSON.stringify(snapshot(run, '55555555-5555-4555-8555-555555555555'), null, 2) + '\n',
);
