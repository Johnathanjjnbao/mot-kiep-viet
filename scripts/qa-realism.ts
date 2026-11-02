import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readGuestRun, assertDecisionViewport } from './decision-viewport.mjs';
import { replay } from '../src/engine/engine';
import { parseSave, snapshot } from '../src/persistence/saves';
export async function realismJourney(page: Page, url: string, prefix = 'realism-local') {
  async function readRun() {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        readGuestRun(page),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(Error('Guest autosave read exceeded15seconds')), 15000);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  const trace = (stage: string) => {
    if (process.env.MKV_QA_DEBUG) console.log('realism: ' + stage);
  };
  trace('navigate');
  await page.goto(url);
  trace('page ready');
  await page.getByRole('button', { name: 'Bắt đầu một kiếp mới' }).click();
  await page.getByRole('button', { name: 'Tự chọn bối cảnh' }).click();
  await page.getByLabel('Ngoại hình nhân vật', { exact: true }).selectOption('girl');
  await page.getByLabel('Kiểu tóc', { exact: true }).selectOption('short');
  await page.getByText('Một hạt giống để gặp lại cuộc đời này').click();
  await page.getByLabel('Hạt giống (tùy chọn)').fill('realism-browser');
  await page.getByRole('button', { name: 'Xem trước cuộc đời' }).click();
  const preview = await page.locator('.preview-avatar svg').getAttribute('data-avatar');
  await expect(page.locator('.preview-avatar svg')).toHaveAttribute('data-pose', 'lying');
  await page.getByRole('button', { name: 'Bắt đầu với nhân vật này' }).click();
  await expect(page.locator('.birth-avatar svg')).toHaveAttribute('data-avatar', preview!);
  trace('birth ready');
  await page.getByRole('button', { name: 'Bắt đầu câu chuyện' }).click();
  trace('first story');
  await expect(page.locator('.choice-prompt')).toHaveAttribute('data-actor', 'caregiver');
  await assertDecisionViewport(page);
  expect((await readRun()).finance.cash).toBe(0);
  trace('baby saved');
  await page.screenshot({ path: `docs/evidence/${prefix}-infant.png` });
  await page.getByRole('button', { name: 'Tài chính', exact: true }).click();
  await expect(page.getByTestId('childhood-finance')).toContainText('Trẻ nhỏ chưa có ví');
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  for (let i = 0; i < 45; i++) {
    const r = await readRun();
    if (r.month >= 72) break;
    await page.getByTestId('event-choice').first().click();
  }
  let r = await readRun();
  trace('age6 read');
  expect(r.month).toBe(72);
  expect(r.finance.cash).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Tài chính', exact: true }).click();
  await page.screenshot({ path: `docs/evidence/${prefix}-child-finance.png`, fullPage: true });
  const before = r.finance.cash + r.finance.savings;
  await page.getByRole('button', { name: /^Để dành / }).click();
  r = await readRun();
  expect(r.finance.cash + r.finance.savings).toBe(before);
  expect(r.actions.at(-1)?.type).toBe('minor-finance');
  trace('child saved');
  await page.reload();
  trace('reloaded');
  await page.getByRole('button', { name: 'Tiếp tục cuộc đời' }).click();
  trace('continued');
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  for (let i = 0; i < 60; i++) {
    r = await readRun();
    if (r.month >= 216) break;
    await page.getByTestId('event-choice').first().click();
  }
  r = await readRun();
  trace('adult read');
  expect(r.month).toBe(216);
  expect(r.childhoodFinance!.adultAccess).toBe(true);
  await expect(page.locator('.character-hud svg:visible').first()).toHaveAttribute(
    'data-avatar',
    preview!,
  );
  await expect(page.locator('.choice-prompt')).toHaveAttribute('data-actor', 'player');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
  await page.screenshot({ path: `docs/evidence/${prefix}-adult.png` });
  return {
    status: 'VERIFIED PASS',
    viewport: page.viewportSize(),
    presentation: r.setup.presentation,
    hairstyle: r.setup.hairstyle,
    previewMatches: true,
    caregiver: true,
    minorSaving: true,
    adultUnlock: true,
    canonical: true,
    axeViolations: 0,
    actions: r.actions.length,
  };
}
