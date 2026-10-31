import { chromium, firefox, webkit } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { creatorJourney } from './qa-creator';

const target = process.argv[2] ?? 'http://127.0.0.1:5173/mot-kiep-viet/';
const scope = target.includes('github.io') ? 'live' : 'local';
const reports: unknown[] = [];
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  let browser;
  try {
    browser = await type.launch({ timeout: 15000 });
  } catch (e) {
    reports.push({ browser: name, status: 'NOT RUN', reason: String(e).slice(0, 500) });
    continue;
  }
  try {
    for (const [label, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 375, height: 667 },
    })) {
      const context = await browser.newContext({ viewport });
      try {
        const report = await creatorJourney(
          await context.newPage(),
          target,
          `m5-a-${scope}-${name}-${label}`,
        );
        reports.push({ browser: name, label, ...report });
        console.log(`${name}/${label}: VERIFIED PASS`);
      } finally {
        await context.close();
      }
    }
  } catch (e) {
    reports.push({ browser: name, status: 'FAIL', reason: String(e).slice(0, 1200) });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
writeFileSync(
  `docs/evidence/m5-a-${scope}-creator-browsers.json`,
  JSON.stringify({ target, reports }, null, 2) + '\n',
);
