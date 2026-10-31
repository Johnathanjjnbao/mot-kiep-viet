import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  readGuestRun,
  assertDecisionViewport,
  clickChoiceWithoutDocumentScroll,
} from './decision-viewport.mjs';
import { parseSave, canonical } from '../src/persistence/saves';
import { replay } from '../src/engine/engine';

export async function creatorJourney(page: Page, url: string, prefix: string) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.getByRole('button', { name: 'Bắt đầu một kiếp mới' }).click();
  await page.getByRole('button', { name: 'Tự chọn bối cảnh' }).click();
  await page.getByLabel('Tên nhân vật', { exact: true }).fill('Trần Ánh Mai');
  await page.getByText('Một hạt giống để gặp lại cuộc đời này').click();
  await page.getByLabel('Hạt giống (tùy chọn)').fill('m5-creator-browser');
  const player = page.getByTestId('traits-player'),
    mother = page.getByTestId('traits-mother'),
    father = page.getByTestId('traits-father');
  const picked = async (panel: ReturnType<Page['getByTestId']>) =>
    panel
      .locator('input:checked')
      .evaluateAll((items) => items.map((n) => n.parentElement!.textContent!.trim()));
  await player.getByLabel('Kiên trì', { exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(player.getByLabel('Kiên trì', { exact: true })).toBeChecked();
  await player.getByRole('button', { name: 'Khóa Kiên trì', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(
    player.getByRole('button', { name: 'Mở khóa Kiên trì', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await mother.locator('summary').click();
  await mother.getByLabel('Dịu dàng', { exact: true }).check();
  await mother.getByRole('button', { name: 'Khóa Dịu dàng', exact: true }).click();
  await father.locator('summary').click();
  await father.getByLabel('Tiết kiệm', { exact: true }).check();
  await father.getByRole('button', { name: 'Khóa Tiết kiệm', exact: true }).click();
  for (const [subject, others] of [
    [player, [mother, father]],
    [mother, [player, father]],
    [father, [player, mother]],
  ] as const) {
    const before = await Promise.all(others.map(picked));
    await subject.getByRole('button', { name: 'Gieo lại', exact: true }).click();
    expect(await Promise.all(others.map(picked))).toEqual(before);
  }
  await page.getByRole('button', { name: 'Ngẫu nhiên tất cả tính cách', exact: true }).click();
  expect(await picked(player)).toContain('Kiên trì');
  expect(await picked(mother)).toContain('Dịu dàng');
  expect(await picked(father)).toContain('Tiết kiệm');
  await expect(page.getByLabel('Tên nhân vật', { exact: true })).toHaveValue('Trần Ánh Mai');
  await expect(page.getByLabel('Năm sinh (1975–2026)')).toHaveValue('1995');
  await expect(page.getByLabel('Cấu trúc gia đình')).toHaveValue('both');
  await expect(page.getByRole('radio', { name: /Một làng quê Bắc Bộ/ })).toBeChecked();
  if (await player.getByRole('button', { name: 'Bỏ chọn chưa khóa', exact: true }).isEnabled())
    await player.getByRole('button', { name: 'Bỏ chọn chưa khóa', exact: true }).click();
  expect(await picked(player)).toEqual(['Kiên trì']);
  await player.getByLabel('Ưa yên tĩnh', { exact: true }).check();
  await expect(player.getByLabel('Dễ gần', { exact: true })).toBeDisabled();
  await player.getByLabel('Thích giúp đỡ', { exact: true }).check();
  // Remove an absent parent's lock as well as its selections, then restore the panel.
  await page.getByLabel('Cấu trúc gia đình').selectOption('mother-only');
  await expect(father).toHaveCount(0);
  await page.getByLabel('Cấu trúc gia đình').selectOption('both');
  await page.getByRole('button', { name: 'Ngẫu nhiên tất cả tính cách', exact: true }).click();
  // Keep one locked trait, then choose the final visible personality by hand.
  if (await player.getByRole('button', { name: 'Bỏ chọn chưa khóa', exact: true }).isEnabled())
    await player.getByRole('button', { name: 'Bỏ chọn chưa khóa', exact: true }).click();
  await player.getByLabel('Ưa yên tĩnh', { exact: true }).check();
  await player.getByLabel('Thích giúp đỡ', { exact: true }).check();
  const expected = await picked(player);
  await page.getByLabel('Cấu trúc gia đình').selectOption('with-mother');
  await expect(father.locator('summary')).toContainText('không sống cùng');
  await page.screenshot({ path: `docs/evidence/${prefix}-creator.png`, fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Xem trước cuộc đời', exact: true }).click();
  for (const trait of expected)
    await expect(page.getByTestId('preview-player-traits')).toContainText(trait);
  if (page.viewportSize()!.width <= 640) {
    const value = await page.locator('.creator-preview dd').first().boundingBox();
    expect(
      value!.width,
      'preview values keep a readable column beside the labels',
    ).toBeGreaterThanOrEqual(150);
  }
  await page.screenshot({ path: `docs/evidence/${prefix}-preview.png`, fullPage: true });
  await page.getByRole('button', { name: 'Bắt đầu với nhân vật này', exact: true }).click();
  await expect.poll(async () => (await readGuestRun(page))?.setup.playerTraits).toEqual(expected);
  let saved = await readGuestRun(page);
  expect(saved.player.traits).toEqual(expected);
  expect(saved.npcs.find((n) => n.id === 'father')!.presence).toBe('nonresident');
  expect(saved.npcs.find((n) => n.id === 'mother')!.personality).toContain('gentle');
  await page.getByRole('button', { name: 'Bắt đầu câu chuyện', exact: true }).click();
  const measurements = [];
  for (let i = 0; i < 20; i++) {
    measurements.push(await assertDecisionViewport(page));
    const count = await page.getByTestId('event-choice').count();
    await clickChoiceWithoutDocumentScroll(
      page,
      i % 3 === 0 ? 0 : i % 3 === 1 ? Math.floor(count / 2) : count - 1,
    );
    await expect.poll(async () => (await readGuestRun(page))?.choices.length).toBe(i + 1);
  }
  saved = await readGuestRun(page);
  expect(canonical(replay(saved.seed, saved.setup, saved.actions))).toBe(canonical(saved));
  await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
  for (let i = 1; i <= 3; i++) {
    await page.getByRole('button', { name: `Lưu vào ô ${i}`, exact: true }).click();
    await expect(page.getByText('Đã lưu vào ô bạn chọn.')).toBeVisible();
  }
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất tệp lưu', exact: true }).click();
  const file = (await (await downloading).path())!;
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  expect(canonical(await readGuestRun(page))).toBe(canonical(saved));
  await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
  await page.getByLabel('Chọn tệp game đã lưu').setInputFiles(file);
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(canonical(await readGuestRun(page))).toBe(canonical(saved));
  // The downloaded payload is verified by the same strict parser used by imports/cloud.
  const { readFile } = await import('node:fs/promises');
  expect(canonical(parseSave(await readFile(file, 'utf8')).run)).toBe(canonical(saved));
  expect(errors).toEqual([]);
  return {
    status: 'VERIFIED PASS',
    viewport: page.viewportSize(),
    traits: expected,
    decisions: 20,
    measurements,
    errors,
  };
}
