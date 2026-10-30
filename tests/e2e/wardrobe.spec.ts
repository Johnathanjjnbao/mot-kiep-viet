import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readGuestRun } from '../../scripts/decision-viewport.mjs';
test('shops, previews without paying, buys once, equips, saves an outfit and reloads it', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Bắt đầu một kiếp mới' }).click();
  await page.getByRole('button', { name: 'Tự chọn bối cảnh' }).click();
  await page.getByText('Một hạt giống để gặp lại cuộc đời này').click();
  await page.getByLabel('Hạt giống (tùy chọn)').fill('wardrobe-browser');
  await page.getByRole('button', { name: 'Xem trước cuộc đời' }).click();
  await page.getByRole('button', { name: 'Bắt đầu với nhân vật này' }).click();
  await page.getByRole('button', { name: 'Bắt đầu câu chuyện' }).click();
  for (let i = 0; i < 4; i++) {
    const r = await readGuestRun(page);
    if (r.month >= 72) break;
    await page.getByTestId('event-choice').first().click();
    await expect
      .poll(async () => (await readGuestRun(page)).choices.length)
      .toBe(r.choices.length + 1);
  }
  await page.getByRole('button', { name: 'Tủ đồ', exact: true }).click();
  const before = await readGuestRun(page),
    card = page.locator('[data-clothing="indigo-tee"]');
  await card.getByRole('button', { name: 'Xem thử', exact: true }).click();
  await expect(page.locator('.wardrobe-preview .living-avatar')).toHaveAttribute(
    'data-wearing',
    /indigo-tee/,
  );
  expect((await readGuestRun(page)).finance.cash).toBe(before.finance.cash);
  expect((await readGuestRun(page)).wardrobe?.owned).not.toContain('indigo-tee');
  await card.getByRole('button', { name: /Mua/ }).dblclick();
  await expect
    .poll(async () => (await readGuestRun(page)).finance.cash)
    .toBe(before.finance.cash - 12);
  expect(
    (await readGuestRun(page)).finance.transactions.filter(
      (t) => t.id === 'wardrobe:buy:indigo-tee',
    ),
  ).toHaveLength(1);
  await card.getByRole('button', { name: 'Mặc', exact: true }).click();
  await expect
    .poll(async () => (await readGuestRun(page)).wardrobe?.equipped.top)
    .toBe('indigo-tee');
  await page.getByLabel('Tên bộ đồ').fill('Áo chàm ngày nắng');
  await page.getByRole('button', { name: 'Lưu cách phối này' }).click();
  await expect.poll(async () => (await readGuestRun(page)).wardrobe?.outfits.length).toBe(1);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: `docs/evidence/wardrobe-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  await page.getByRole('button', { name: 'Tủ đồ', exact: true }).click();
  await expect(page.locator('.wardrobe-preview .living-avatar')).toHaveAttribute(
    'data-wearing',
    /indigo-tee/,
  );
  await expect(page.getByRole('button', { name: 'Mặc bộ Áo chàm ngày nắng' })).toBeVisible();
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  await expect(page.getByTestId('event-choice').first()).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
