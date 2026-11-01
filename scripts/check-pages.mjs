import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const version = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version;
const url = process.argv[2] ?? 'https://johnathanjjnbao.github.io/mot-kiep-viet/';
const report = { url, status: 'FAIL', viewports: [], errors: [] };
const browser = await chromium.launch({ channel: process.env.CI ? 'chromium' : 'msedge' });
try {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 375, height: 812 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    page.on('requestfailed', (r) => errors.push(r.url()));
    expect((await page.goto(url)).status()).toBe(200);
    await page.getByRole('button', { name: 'Bắt đầu một kiếp mới' }).click();
    await page.getByRole('button', { name: 'Gieo một cuộc đời' }).click();
    await page.getByRole('button', { name: 'Bắt đầu câu chuyện' }).click();
    await page.locator('[data-testid="event-choice"]:not(:disabled)').first().click();
    await expect(page.getByTestId('advance-life')).toHaveCount(0);
    await expect(page.locator('.story-card h2')).toBeFocused();
    const event = await page.locator('.story-card h2').textContent();
    await expect(page.getByText('Đã tự lưu trên máy')).toBeVisible();
    await page.getByRole('button', { name: 'Lưu và tải game' }).click();
    await page.getByRole('button', { name: 'Lưu vào ô 1', exact: true }).click();
    await expect(page.getByText('Đã lưu vào ô bạn chọn.')).toBeVisible();
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await page.reload();
    await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
    await expect(page.locator('.story-card h2')).toHaveText(event);
    await page.locator('[data-testid="event-choice"]:not(:disabled)').first().click();
    await page.getByRole('button', { name: 'Lưu và tải game' }).click();
    await page.getByRole('button', { name: 'Tải lại', exact: true }).first().click();
    await expect(page.locator('.story-card h2')).toHaveText(event);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.locator('.footer-version')).toContainText(version);
    for (const family of ['both', 'father-only', 'mother-only', 'with-father', 'with-mother']) {
      await page.getByTitle('Về trang đầu').click();
      await page.getByRole('button', { name: 'Bắt đầu một kiếp mới' }).click();
      await page.getByRole('button', { name: 'Tự chọn bối cảnh' }).click();
      await page.getByLabel('Tên nhân vật', { exact: true }).fill('Nguyễn Ánh Mai');
      await page.getByLabel('Năm sinh (1975–2026)').fill('2026');
      await page.getByLabel('Địa danh cụ thể').fill('Xóm Biển, quê mình');
      await page.getByLabel('Cấu trúc gia đình').selectOption(family);
      await page.getByRole('button', { name: 'Xem trước cuộc đời' }).click();
      await page.getByRole('button', { name: 'Sửa trước khi bắt đầu' }).click();
      await expect(page.getByLabel('Tên nhân vật', { exact: true })).toHaveValue('Nguyễn Ánh Mai');
      await page.getByRole('button', { name: 'Xem trước cuộc đời' }).click();
      await page.getByRole('button', { name: 'Bắt đầu với nhân vật này' }).click();
      await expect(page.locator('.birth-location')).toContainText('Xóm Biển, quê mình');
      await page.getByRole('button', { name: 'Bắt đầu câu chuyện' }).click();
      expect(await page.getByTestId('event-choice').count()).toBeGreaterThanOrEqual(4);
    }
    for (let i = 0; i < 512; i++) {
      if (await page.getByRole('heading', { name: /Một đời đã sống/ }).isVisible()) break;
      const choices = page.getByTestId('event-choice');
      if (await choices.count()) {
        expect(await choices.count()).toBeGreaterThanOrEqual(4);
        await choices.first().click();
      } else await page.getByTestId('advance-life').click();
    }
    await expect(page.getByRole('heading', { name: /Một đời đã sống/ })).toBeVisible();
    await page.getByRole('button', { name: 'Lịch sử cuộc đời', exact: true }).click();
    await expect(page.locator('.history-grid article')).toHaveCount(1);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Xuất toàn bộ lịch sử' }).click();
    const path = await (await download).path();
    await page.getByLabel('Chọn tệp lịch sử').setInputFiles(path);
    await expect(page.getByRole('status')).toHaveText('Đã giữ lại lịch sử.');
    await expect(page.locator('.history-grid article')).toHaveCount(1);
    await page.getByRole('button', { name: 'Đọc cuộc đời này' }).click();
    await expect(page.locator('.history-reading')).toContainText('Nguyễn Ánh Mai');
    await page.getByRole('button', { name: 'Sống một kiếp khác' }).click();
    await page.getByRole('button', { name: 'Gieo một cuộc đời' }).click();
    await page.getByRole('button', { name: 'Lịch sử cuộc đời', exact: true }).click();
    await expect(page.locator('.history-grid article')).toHaveCount(1);
    await page.reload();
    await page.getByRole('button', { name: 'Lịch sử cuộc đời', exact: true }).click();
    await expect(page.locator('.history-grid article')).toHaveCount(1);
    expect(errors).toEqual([]);
    report.viewports.push({
      viewport,
      status: 'VERIFIED PASS',
      checks: [
        `release UI version ${version}`,
        'five custom household forms and preview/edit',
        'four or more choices throughout a complete life',
        'immutable history, export/import dedup and retention after new run/reload',
        'HTML and assets',
        'new life',
        'choice and time advance',
        'autosave reload',
        'manual slot save/load',
        'fonts',
        'no horizontal overflow',
        'no page/network errors',
      ],
    });
    await context.close();
  }
  report.status = 'VERIFIED PASS';
} catch (error) {
  report.errors.push(String(error));
  process.exitCode = 1;
} finally {
  await browser.close();
  mkdirSync('docs/evidence', { recursive: true });
  const file = url.includes('github.io') ? 'pages-live.json' : 'pages-local.json';
  writeFileSync(
    process.env.MKV_PAGES_REPORT ?? 'docs/evidence/' + file,
    JSON.stringify(report, null, 2) + '\n',
  );
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}
