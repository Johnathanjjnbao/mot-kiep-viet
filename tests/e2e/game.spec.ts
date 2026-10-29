import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function start(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Bắt đầu một kiếp mới' }).click();
  await page.getByRole('button', { name: 'Tự chọn bối cảnh' }).click();
  await page.getByRole('radio', { name: /1995/ }).check();
  await page.getByRole('radio', { name: /Một làng quê Bắc Bộ/ }).check();
  await page.getByText('Một hạt giống để gặp lại cuộc đời này').click();
  await page.getByLabel('Hạt giống (tùy chọn)').fill('browser-life');
  await page.getByRole('button', { name: 'Gieo một cuộc đời' }).click();
  await expect(page.getByRole('heading', { name: /Chào đời/ })).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu câu chuyện' }).click();
}
async function step(page: Page) {
  const options = page.getByTestId('event-choice').filter({ visible: true });
  if (await options.count()) {
    const enabled = page.locator('[data-testid="event-choice"]:not(:disabled)');
    await enabled.first().click();
  } else await page.getByTestId('advance-life').click();
}
test('starts, decides, saves, reloads, imports, reaches an ending, and begins another life', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page);
  await page.locator('[data-testid="event-choice"]:not(:disabled)').first().click();
  await expect(page.getByTestId('advance-life')).toBeVisible();
  for (let i = 0; i < 7; i++) await step(page);
  const year = await page.locator('.year-stamp strong').textContent();
  const event = await page.locator('.story-card h2').textContent();
  await expect(page.getByText('Đã tự lưu trên máy')).toBeVisible();
  await page.getByRole('button', { name: 'Lưu và tải game' }).click();
  await page.getByRole('button', { name: 'Lưu vào ô 1', exact: true }).click();
  await expect(page.getByText('Đã lưu vào ô bạn chọn.')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất tệp lưu' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  await expect(page.locator('.year-stamp strong')).toHaveText(year!);
  await expect(page.locator('.story-card h2')).toHaveText(event!);
  await step(page);
  await page.getByRole('button', { name: 'Lưu và tải game' }).click();
  await page.getByLabel('Chọn tệp game đã lưu').setInputFiles(path!);
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.story-card h2')).toHaveText(event!);
  // Continue entirely through the visible player interface; no hidden fast-forward.
  for (let i = 0; i < 90; i++) {
    if (await page.getByRole('heading', { name: /Một đời đã sống/ }).isVisible()) break;
    await step(page);
  }
  await expect(page.getByRole('heading', { name: /Một đời đã sống/ })).toBeVisible();
  const cardPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải thẻ kỷ niệm' }).click();
  expect((await cardPromise).suggestedFilename()).toMatch(/\.svg$/);
  await page.getByRole('button', { name: 'Đọc lại nhật ký' }).click();
  await expect(page.getByRole('heading', { name: 'Nhật ký một đời' })).toBeVisible();
  expect(await page.locator('.journal li').count()).toBeGreaterThan(25);
  await page.getByRole('button', { name: 'Trở về cuộc đời' }).click();
  await page.getByRole('button', { name: 'Sống một kiếp khác' }).click();
  await page.getByRole('button', { name: 'Gieo một cuộc đời' }).click();
  await expect(page.getByRole('heading', { name: /Chào đời/ })).toBeVisible();
  expect(errors).toEqual([]);
});
test('responsive pages, keyboard dialogs, settings, and accessibility', async ({
  page,
}, testInfo) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /Nếu được sống/ })).toBeVisible();
  await page.screenshot({
    path: `docs/evidence/home-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await page.getByLabel('Chữ lớn hơn').check();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Cài đặt', exact: true })).toBeFocused();
  await start(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: `docs/evidence/game-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Tài chính', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Đủ sống hôm nay/ })).toBeVisible();
  expect(await page.getByRole('button', { name: 'Gửi 50 đSM' }).isDisabled()).toBe(true);
  await page.getByRole('button', { name: 'Người thân', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mẹ · Thu' })).toBeVisible();
  await page.setViewportSize({ width: 812, height: 375 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('adult career, savings, household costs, and invalid import feedback work through the UI', async ({
  page,
}) => {
  await start(page);
  for (
    let i = 0;
    i < 30 && (await page.locator('.year-stamp strong').textContent()) !== '2013';
    i++
  )
    await step(page);
  await page.getByRole('button', { name: /Đi làm và tự học/ }).click();
  await page.getByRole('button', { name: 'Nghề nghiệp', exact: true }).click();
  await page.getByRole('button', { name: 'Nhận công việc', exact: true }).first().click();
  await expect(page.locator('.current-job')).toContainText('Làm nông');
  await page.getByRole('button', { name: 'Tài chính', exact: true }).click();
  await page.getByRole('button', { name: 'Gửi 50 đSM', exact: true }).click();
  await expect(page.locator('.finance-overview')).toContainText('50 đSM');
  await page.getByRole('button', { name: 'Rút tối đa 50 đSM' }).click();
  await page.getByRole('button', { name: 'Vay 50 đSM', exact: true }).click();
  await page.getByRole('button', { name: 'Trả tối đa 50 đSM' }).click();
  await page.getByRole('button', { name: 'Ra ở trọ', exact: true }).click();
  await expect(page.locator('.housing-card')).toContainText('Một căn phòng trọ');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Lưu và tải game' }).click();
  await page.getByLabel('Chọn tệp game đã lưu').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{invalid'),
  });
  await expect(page.getByRole('status')).toContainText('không phải JSON hợp lệ');
  await expect(page.getByRole('dialog')).toBeVisible();
});
