import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';

const report = {
  status: 'FAIL',
  origin: 'http://127.0.0.1:4173',
  browser: process.env.CI ? 'chromium' : 'msedge',
  checks: [],
  errors: [],
};
const base = readFileSync('dist/index.html', 'utf8').match(/src="([^"]*)assets\//)?.[1] ?? '/';
let browser;
let serverOutput = '';
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4173',
    '--strictPort',
  ],
  { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
);
server.stdout.on('data', (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString();
});
try {
  let ready = false;
  for (let i = 0; i < 100 && !ready; i++) {
    if (server.exitCode !== null) throw new Error(serverOutput);
    try {
      ready = (await fetch(report.origin + base)).ok;
    } catch {
      /* Starting. */
    }
    if (!ready) await delay(100);
  }
  if (!ready) throw new Error('Preview did not become ready.');
  browser = await chromium.launch({ channel: report.browser });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (error) => report.errors.push(error.message));
  const response = await page.goto(report.origin + base);
  expect(response.status()).toBe(200);
  report.checks.push('built HTML returns 200');
  expect((await page.request.get(report.origin + base + 'licenses/newsreader.txt')).status()).toBe(
    200,
  );
  report.checks.push('font license included in distribution');
  await page.getByRole('button', { name: 'Bắt đầu một kiếp mới' }).click();
  await page.getByRole('button', { name: 'Gieo một cuộc đời' }).click();
  await page.getByRole('button', { name: 'Bắt đầu câu chuyện' }).click();
  await page.locator('[data-testid="event-choice"]:not(:disabled)').first().click();
  await page.getByTestId('advance-life').click();
  const event = await page.locator('.story-card h2').textContent();
  await expect(page.getByText('Đã tự lưu trên máy')).toBeVisible();
  report.checks.push('new life, event choice, time advance and autosave');
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  await expect(page.locator('.story-card h2')).toHaveText(event);
  report.checks.push('reload resumes exact active event');
  expect(report.errors).toEqual([]);
  report.status = 'VERIFIED PASS';
} catch (error) {
  report.errors.push(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill();
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/production-smoke.json', JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}
