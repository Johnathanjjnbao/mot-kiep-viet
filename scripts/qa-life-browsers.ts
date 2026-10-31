import { chromium, firefox, webkit } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { diversityJourney } from './qa-life-diversity';
const url = process.argv[2] ?? 'http://127.0.0.1:5173/mot-kiep-viet/';
const reports = [];
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  let browser;
  try {
    browser = await type.launch({ timeout: 15000 });
  } catch {
    reports.push({
      browser: name,
      status: 'NOT RUN',
      reason: 'Installed browser could not launch',
    });
    continue;
  }
  try {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 375, height: 667 },
    ]) {
      const context = await browser.newContext({ viewport });
      try {
        const page = await context.newPage();
        reports.push({ browser: name, ...(await diversityJourney(page, url)) });
        await page
          .getByRole('button', { name: 'Tiếp tục cuộc đời của', exact: false })
          .first()
          .click();
        await page.screenshot({
          path: `docs/evidence/m5-diversity-${url.includes('github.io') ? 'live' : 'local'}-${name}-${viewport.width}.png`,
        });
      } finally {
        await context.close();
      }
    }
  } catch (e) {
    reports.push({ browser: name, status: 'FAIL', reason: String(e).slice(0, 1000) });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
writeFileSync(
  `docs/evidence/m5-diversity-${url.includes('github.io') ? 'live' : 'local'}-browsers.json`,
  JSON.stringify({ url, reports }, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    reports.map((r) => ({ browser: r.browser, status: r.status })),
    null,
    2,
  ),
);
