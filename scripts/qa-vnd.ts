import { expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { admittedStudent } from './academic-fixture';
import { importStudent } from './qa-university';
import {
  readGuestRun,
  assertDecisionViewport,
  clickChoiceWithoutDocumentScroll,
} from './decision-viewport.mjs';
import { activeDefinition, choiceReason, replay, advance, choose } from '../src/engine/engine';
import { healthyChoice } from './annual-fixture';
import { designMoney, formatMoney } from '../src/domain/currency';
import { canonical, parseSave } from '../src/persistence/saves';
import { storyAction, decisionKey } from '../src/application/story-flow';

export async function vndJourney(page: Page, url: string, prefix: string) {
  await page.goto(url);
  const cases = [];
  for (const currency of ['vnd-v1', undefined] as const) {
    let expected = admittedStudent('korean', 0, 'annual-v1', currency).run;
    for (let i = 0; i < 60 && !expected.academics?.focus; i++)
      expected = expected.activeEvent
        ? choose(expected, activeDefinition(expected)!.id, healthyChoice(expected).id)
        : advance(expected);
    if (!expected.academics?.focus) throw Error('Missing academic assessment fixture');
    await importStudent(page, expected);
    await expect(page.getByTestId('hud-cash')).toHaveText(
      formatMoney(expected.finance.cash, expected),
    );
    await assertDecisionViewport(page);
    const event = activeDefinition(expected)!;
    const choices = event.choices.filter((c) => !choiceReason(expected, c));
    const choice = choices.find((c) => c.id === 'work') ?? choices[0];
    await clickChoiceWithoutDocumentScroll(page, choices.indexOf(choice));
    expected = storyAction(
      expected,
      { type: 'choose', eventId: event.id, choiceId: choice.id },
      decisionKey(expected),
    );
    await expect
      .poll(async () => canonical(await readGuestRun(page)) === canonical(expected))
      .toBe(true);
    expect(replay(expected.seed, expected.setup, expected.actions)).toEqual(expected);
    await page.getByRole('button', { name: 'Nghề nghiệp', exact: true }).click();
    await expect(page.locator('main')).toContainText(
      formatMoney(designMoney(expected, 20), expected),
    );
    if (currency) expect(await page.locator('body').innerText()).not.toContain('đSM');
    await page.getByRole('button', { name: 'Tủ đồ', exact: true }).click();
    if (currency) expect(await page.locator('body').innerText()).not.toContain('đSM');
    await page.getByRole('button', { name: 'Tài chính', exact: true }).click();
    await page
      .getByRole('button', {
        name: `Gửi ${formatMoney(designMoney(expected, 50), expected)}`,
        exact: true,
      })
      .click();
    await expect
      .poll(async () => (await readGuestRun(page)).finance.savings)
      .toBe(designMoney(expected, 50));
    const saved = await readGuestRun(page);
    await expect(page.locator('.finance-overview')).toContainText(
      formatMoney(saved.finance.savings, saved),
    );
    if (currency)
      expect(
        await page.locator('.finance-overview strong').evaluateAll((nodes) =>
          nodes.every((node) => {
            const range = document.createRange();
            range.selectNodeContents(node);
            return range.getClientRects().length === 1 && node.scrollWidth <= node.clientWidth;
          }),
        ),
      ).toBe(true);
    if (currency) expect(await page.locator('body').innerText()).not.toContain('đSM');
    await page.screenshot({ path: `docs/evidence/${prefix}-${currency ?? 'legacy'}-finance.png` });
    await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
    const slot = currency ? 1 : 2;
    await page.getByRole('button', { name: `Lưu vào ô ${slot}`, exact: true }).click();
    await expect(page.getByText('Đã lưu vào ô bạn chọn.')).toBeVisible();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Xuất tệp lưu', exact: true }).click();
    const download = await downloading;
    const text = await readFile((await download.path())!, 'utf8');
    expect(parseSave(text).run).toEqual(saved);
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await page.reload();
    await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
    await expect(page.getByTestId('hud-cash')).toHaveText(formatMoney(saved.finance.cash, saved));
    await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
    await page
      .locator('.save-slot')
      .nth(slot - 1)
      .getByRole('button', { name: 'Tải lại', exact: true })
      .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect
      .poll(async () => canonical(await readGuestRun(page)) === canonical(saved))
      .toBe(true);
    await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
    await page.getByLabel('Chọn tệp game đã lưu').setInputFiles({
      name: 'roundtrip.json',
      mimeType: 'application/json',
      buffer: Buffer.from(text),
    });
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect
      .poll(async () => canonical(await readGuestRun(page)) === canonical(saved))
      .toBe(true);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    cases.push({
      currency: currency ?? 'absent → dsm-v1',
      canonical: true,
      cash: saved.finance.cash,
      savings: saved.finance.savings,
      exportImport: true,
      reload: true,
    });
  }
  return { status: 'VERIFIED PASS', viewport: page.viewportSize(), cases };
}
