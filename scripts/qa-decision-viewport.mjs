import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  assertDecisionViewport,
  clickChoiceWithoutDocumentScroll,
  readGuestRun,
} from './decision-viewport.mjs';

export const viewportCases = [
  { name: 'desktop1440', width: 1440, height: 900 },
  { name: 'desktop1366', width: 1366, height: 768 },
  { name: 'mobile390', width: 390, height: 844, mobile: true },
  { name: 'mobile375', width: 375, height: 667, mobile: true },
  { name: 'landscape', width: 667, height: 375, mobile: true },
  { name: 'large-text', width: 375, height: 667, mobile: true, large: true },
];

export const viewportVersion =
  'v' + JSON.parse(readFileSync('package.json', 'utf8')).version.replaceAll('.', '');

export async function viewportJourney(
  browser,
  target,
  config,
  evidencePrefix = viewportVersion + '-local',
) {
  const context = await browser.newContext({
    viewport: { width: config.width, height: config.height },
    hasTouch: Boolean(config.mobile),
    isMobile: Boolean(config.mobile),
    reducedMotion: 'reduce',
  });
  const page = await context.newPage(),
    errors = [],
    measurements = [];
  page.on('pageerror', () => errors.push('Uncaught application error'));
  const report = { config, status: 'FAIL', measurements, errors };
  try {
    await page.goto(target);
    if (config.large) {
      await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
      await page.getByLabel('Chữ lớn hơn').check();
      await page.keyboard.press('Escape');
    }
    await page.getByRole('button', { name: 'Bắt đầu một kiếp mới' }).click();
    await page.getByRole('button', { name: 'Tự chọn bối cảnh' }).click();
    await page.getByRole('radio', { name: /1995/ }).check();
    await page.getByRole('radio', { name: /Một làng quê Bắc Bộ/ }).check();
    await page.getByText('Một hạt giống để gặp lại cuộc đời này').click();
    await page.getByLabel('Hạt giống (tùy chọn)').fill('viewport-0');
    await page.getByRole('button', { name: 'Xem trước cuộc đời' }).click();
    await page.getByRole('button', { name: 'Bắt đầu với nhân vật này' }).click();
    await page.getByRole('button', { name: 'Bắt đầu câu chuyện' }).click();
    expect((await readGuestRun(page)).setup.lifeRules).toBe('annual-v1');
    await expect(page.getByTestId('hud-age')).toHaveText('0 tuổi');
    await page.evaluate(() => document.fonts.ready);
    let lastTouch = -Infinity;
    for (let i = 0; i <= 20; i++) {
      await expect.poll(async () => (await readGuestRun(page)).choices.length).toBe(i);
      const m = await assertDecisionViewport(page);
      const run = await readGuestRun(page);
      for (const [key, value] of Object.entries(run.player.stats)) {
        const displayed = await page
          .getByTestId('hud-' + key)
          .evaluate((node) => node.firstChild.textContent.trim());
        expect(displayed).toBe(String(Math.round(value)));
      }
      await expect(page.getByTestId('hud-age')).toHaveText(`${Math.floor(run.month / 12)} tuổi`);
      await expect(page.getByTestId('hud-year')).toHaveText(String(run.world.year));
      await expect(page.getByTestId('hud-cash')).toHaveText(
        `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(run.finance.cash)} đSM`,
      );
      m.step = i;
      measurements.push(m);
      if ([0, 10, 20].includes(i))
        await page.screenshot({ path: `docs/evidence/${evidencePrefix}-${config.name}-${i}.png` });
      if (i === 20) break;
      const index =
        i % 3 === 0 ? 0 : i % 3 === 1 ? Math.floor(m.choiceCount / 2) : m.choiceCount - 1;
      const selectedChoice = await page
        .getByTestId('event-choice')
        .nth(index)
        .getAttribute('data-choice-id');
      const selectedEvent = run.activeEvent.id;
      if (config.mobile)
        await expect.poll(() => Date.now() - lastTouch, { intervals: [50] }).toBeGreaterThan(620);
      lastTouch = Date.now();
      await clickChoiceWithoutDocumentScroll(page, index, Boolean(config.mobile));
      await expect
        .poll(async () => (await readGuestRun(page)).choices.at(-1)?.choiceId)
        .toBe(selectedChoice);
      expect((await readGuestRun(page)).choices.at(-1)?.eventId).toBe(selectedEvent);
    }
    const counts = [...new Set(measurements.map((m) => m.choiceCount))].sort();
    expect(counts.every((n) => n >= 4 && n <= 6)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    const before = await readGuestRun(page);
    await page.reload();
    await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
    await expect.poll(async () => (await readGuestRun(page)).choices.length).toBe(20);
    await assertDecisionViewport(page);
    expect(await readGuestRun(page)).toEqual(before);
    // New education lives replace the old six-choice school direction with four
    // distinct paths. Retain explicit coverage of the published six-choice save.
    const fixture = JSON.parse(readFileSync('tests/data/viewport-dynamic-v1.json', 'utf8'));
    await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
    await page.getByLabel('Chọn tệp game đã lưu').setInputFiles({
      name: 'viewport-dynamic-v1.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(fixture)),
    });
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect.poll(() => readGuestRun(page)).toEqual(fixture.run);
    await page.reload();
    await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
    await page.evaluate(() => document.fonts.ready);
    const compatibility = await assertDecisionViewport(page);
    expect(compatibility.choiceCount).toBe(6);
    expect([...new Set([...counts, compatibility.choiceCount])].sort()).toEqual([4, 5, 6]);
    expect(
      Math.max(...measurements.map((m) => m.narrativeLength), compatibility.narrativeLength),
    ).toBeGreaterThanOrEqual(100);
    expect(
      Math.max(...measurements.map((m) => m.longestChoice), compatibility.longestChoice),
    ).toBeGreaterThanOrEqual(70);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    report.compatibility = compatibility;
    await page.screenshot({
      path: `docs/evidence/${evidencePrefix}-${config.name}-six-choices.png`,
    });
    expect(errors).toEqual([]);
    report.status = 'VERIFIED PASS';
    report.decisions = 20;
    report.choiceCounts = counts;
    return { report, run: before };
  } catch (e) {
    report.overflowElements = await page
      .evaluate(
        (width) =>
          [...document.querySelectorAll('body *')]
            .filter((n) => {
              const r = n.getBoundingClientRect();
              return r.width > 0 && r.right > width + 0.5;
            })
            .slice(0, 20)
            .map((n) => ({
              tag: n.tagName,
              cls: n.className,
              right: n.getBoundingClientRect().right,
            })),
        config.width,
      )
      .catch(() => []);
    report.error = String(e.message).slice(0, 1200);
    await page.screenshot({ path: `.local/v031-${config.name}-failure.png` }).catch(() => {});
    throw Object.assign(e, { viewportReport: report });
  } finally {
    await context.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = process.argv[2] ?? 'http://127.0.0.1:4173/mot-kiep-viet/';
  const prefix = viewportVersion + (target.includes('github.io') ? '-live' : '-local');
  const browser = await chromium.launch({ channel: process.env.CI ? 'chromium' : 'msedge' }),
    reports = [];
  try {
    for (const config of viewportCases) {
      const { report } = await viewportJourney(browser, target, config, prefix);
      reports.push(report);
      console.log(config.name + ': VERIFIED PASS, 20 decisions');
    }
  } catch (e) {
    if (e.viewportReport) reports.push(e.viewportReport);
    console.log('Viewport QA failed: ' + String(e.message).slice(0, 600));
    process.exitCode = 1;
  } finally {
    await browser.close();
    writeFileSync(
      `docs/evidence/${prefix}-viewport.json`,
      JSON.stringify(
        { url: target, status: process.exitCode ? 'FAIL' : 'VERIFIED PASS', reports },
        null,
        2,
      ) + '\n',
    );
  }
}
