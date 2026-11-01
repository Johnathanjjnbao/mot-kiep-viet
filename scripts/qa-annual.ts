import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { newbornAnnual, healthyChoice, annualAssessment } from './annual-fixture';
import { storyAction, decisionKey } from '../src/application/story-flow';
import { activeDefinition, choiceReason } from '../src/engine/engine';
import { ageOf } from '../src/content/world';
import { canonical, parseSave } from '../src/persistence/saves';
import { currentStudy } from '../src/engine/academics';
import { importStudent } from './qa-university';
import {
  readGuestRun,
  assertDecisionViewport,
  clickChoiceWithoutDocumentScroll,
} from './decision-viewport.mjs';
import { readFile } from 'node:fs/promises';

export async function annualJourney(page: Page, url: string, prefix: string, targetAge = 82) {
  await page.goto(url);
  let expected = storyAction(newbornAnnual(), { type: 'advance' });
  await importStudent(page, expected);
  await expect(page.locator('#event-heading')).toBeFocused();
  const displayed = new Set<number>(),
    measurements = [];
  for (
    let step = 0;
    step < 250 && expected.status !== 'ended' && ageOf(expected) <= targetAge;
    step++
  ) {
    const age = ageOf(expected),
      e = activeDefinition(expected)!;
    displayed.add(age);
    await expect(page.getByTestId('hud-age')).toHaveText(`${age} tuổi`);
    measurements.push(await assertDecisionViewport(page));
    if (step === 0 || age === 82)
      await page.screenshot({ path: `docs/evidence/${prefix}-age${age}.png` });
    const option = healthyChoice(expected),
      index = e.choices
        .filter((c) => !choiceReason(expected, c))
        .findIndex((c) => c.id === option.id);
    expected = storyAction(
      expected,
      { type: 'choose', eventId: e.id, choiceId: option.id },
      decisionKey(expected),
    );
    await clickChoiceWithoutDocumentScroll(page, index);
    await expect
      .poll(async () => canonical(await readGuestRun(page)) === canonical(expected), {
        timeout: 15000,
      })
      .toBe(true);
  }
  expect([...displayed]).toEqual(Array.from({ length: targetAge + 1 }, (_, i) => i));
  expect(ageOf(expected)).toBeGreaterThan(targetAge);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
  for (let i = 1; i <= 3; i++)
    await page.getByRole('button', { name: `Lưu vào ô ${i}`, exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất tệp lưu', exact: true }).click();
  const file = await (await download).path();
  expect(canonical(parseSave(await readFile(file!, 'utf8')).run)).toBe(canonical(expected));
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  expect(canonical(await readGuestRun(page))).toBe(canonical(expected));
  return {
    status: 'VERIFIED PASS',
    displayedAges: [...displayed],
    maxSkippedAge: 0,
    actions: expected.actions.length,
    measurements,
  };
}

export async function annualPause(page: Page, url: string, prefix: string) {
  await page.goto(url);
  const start = annualAssessment('health'),
    before = currentStudy(start)!;
  await importStudent(page, start);
  await expect(page.locator('#event-heading')).toBeFocused();
  await assertDecisionViewport(page);
  await page.screenshot({ path: `docs/evidence/${prefix}-health-assessment.png` });
  const buttons = page.getByTestId('event-choice');
  await clickChoiceWithoutDocumentScroll(page, (await buttons.count()) - 1);
  await expect.poll(async () => currentStudy(await readGuestRun(page))?.status).toBe('paused');
  let paused = await readGuestRun(page);
  expect(currentStudy(paused)!.paidTerms).toBe(before.paidTerms);
  expect(currentStudy(paused)!.termAttempts).toBe(before.termAttempts);
  const pausedMonth = currentStudy(paused)!.pausedMonth!;
  // The one-tap story may already reach the next birthday; no future tuition while paused.
  expect(paused.finance.transactions.filter((t) => t.id.endsWith(':tuition'))).toHaveLength(
    before.paidTerms,
  );
  await page.getByRole('button', { name: 'Nghề nghiệp', exact: true }).click();
  await expect(page.getByTestId('current-study')).toContainText('Đang bảo lưu');
  if (paused.month - pausedMonth < 6)
    await expect(page.getByRole('button', { name: 'Trở lại học', exact: true })).toBeDisabled();
  await page.screenshot({ path: `docs/evidence/${prefix}-paused.png`, fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  paused = await readGuestRun(page);
  expect(currentStudy(paused)!.status).toBe('paused');
  expect(
    parseSave(JSON.stringify((await import('../src/persistence/saves')).snapshot(paused))).run,
  ).toEqual(paused);
  return {
    status: 'VERIFIED PASS',
    paidTerms: before.paidTerms,
    pausedMonth,
    monthAfterChoice: paused.month,
  };
}
