import { writeFileSync } from 'node:fs';
import { createRun, advance, activeDefinition } from '../src/engine/engine';
import { storyAction, decisionKey } from '../src/application/story-flow';
import { snapshot, parseSave } from '../src/persistence/saves';
const callbacks = [
  ['reading', 'realism-reading-line', 'realism-reading-routine'],
  ['sharedcare', 'realism-club-time', 'realism-shared-care'],
  ['budget', 'realism-first-small-task', 'realism-budget-plan'],
  ['work', 'realism-future-route', 'realism-small-work'],
  ['project', 'realism-last-school-project', 'realism-project-practice'],
];
for (const [label, target, flag] of callbacks) {
  let found = false;
  for (let seed = 0; seed < 100 && !found; seed++) {
    let r = advance(
      createRun(`realism-context-${label}-${seed}`, {
        cohort: 2005,
        region: 'northern-village',
        wealth: 4,
        family: 'both',
        currency: 'vnd-v1',
        lifeRules: 'realism-v1',
      }),
    );
    for (let i = 0; i < 25 && r.month < 216; i++) {
      const e = activeDefinition(r)!;
      if (e.id === target && r.flags[flag]) {
        const text = JSON.stringify(snapshot(r));
        parseSave(text);
        writeFileSync(`tests/data/viewport-realism-${label}.json`, text + '\n');
        console.log(label, r.seed, r.month / 12, e.text.length);
        found = true;
        break;
      }
      const c =
        e.choices.find((c) =>
          c.effects.some((f) => f.kind === 'flag' && f.flag === flag && f.value),
        ) ?? e.choices[0];
      r = storyAction(r, { type: 'choose', eventId: e.id, choiceId: c.id }, decisionKey(r));
    }
  }
  if (!found) throw Error('Missing canonical callback ' + label);
}
