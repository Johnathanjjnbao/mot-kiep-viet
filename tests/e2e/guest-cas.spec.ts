import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import type { RunSetup, RunAction } from '../../src/domain/model';
import { replay, activeDefinition, choiceReason } from '../../src/engine/engine';
import { canonical, parseSave } from '../../src/persistence/saves';
import { storyAction, decisionKey } from '../../src/application/story-flow';
import { importStudent } from '../../scripts/qa-university';
import {
  readGuestRun,
  assertDecisionViewport,
  clickChoiceWithoutDocumentScroll,
} from '../../scripts/decision-viewport.mjs';
const fixture=JSON.parse(readFileSync('tests/data/creative-first-show-prefix.json','utf8'));
test('two guest tabs preserve the saved winner and export the conflicting branch', async ({
  page,
  context,
  baseURL,
}) => {
  test.setTimeout(120000);
  await page.goto(baseURL!);
  const start = replay(fixture.seed, fixture.setup as RunSetup, fixture.actions as RunAction[]);
  await importStudent(page, start);
  const other = await context.newPage();
  await other.goto(baseURL!);
  await other.getByRole('button', { name: /Tiếp tục cuộc đời/ }).click();
  await assertDecisionViewport(page);
  await assertDecisionViewport(other);
  const e = activeDefinition(start)!,
    choices = e.choices
      .map((c, index) => ({ c, index }))
      .filter(({ c }) => !choiceReason(start, c));
  const winner = storyAction(
    start,
    { type: 'choose', eventId: e.id, choiceId: choices[0].c.id },
    decisionKey(start),
  );
  const branch = storyAction(
    start,
    { type: 'choose', eventId: e.id, choiceId: choices.at(-1)!.c.id },
    decisionKey(start),
  );
  await clickChoiceWithoutDocumentScroll(page, choices[0].index);
  await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(winner));
  await clickChoiceWithoutDocumentScroll(other, choices.at(-1)!.index);
  await expect(other.getByRole('alert')).toContainText('Một tab khác vừa lưu tiến độ');
  expect(canonical(await readGuestRun(other))).toBe(canonical(winner));
  await other.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
  const download = other.waitForEvent('download');
  await other.getByRole('button', { name: 'Xuất tệp lưu', exact: true }).click();
  const saved = parseSave(await readFile((await (await download).path())!, 'utf8'));
  expect(canonical(saved.run)).toBe(canonical(branch));
  expect(canonical(saved.run)).not.toBe(canonical(winner));
  expect(
    await page.evaluate(
      () =>
        new Promise<number>((resolve, reject) => {
          const q = indexedDB.open('mot-kiep-viet');
          q.onerror = reject;
          q.onsuccess = () => {
            const db = q.result;
            resolve(db.version);
            db.close();
          };
        }),
    ),
  ).toBe(1);
  await other.close();
});
