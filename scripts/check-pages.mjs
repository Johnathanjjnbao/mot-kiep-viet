import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
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
    await page.getByTestId('advance-life').click();
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
    expect(errors).toEqual([]);
    report.viewports.push({
      viewport,
      status: 'VERIFIED PASS',
      checks: [
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
  writeFileSync('docs/evidence/' + file, JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}
