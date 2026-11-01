import { chromium, firefox, webkit } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { businessJourney } from './qa-business';
const url = process.argv[2] ?? 'http://127.0.0.1:5173/mot-kiep-viet/';
const scope = url.includes('github.io') ? 'live' : 'local';
const reports: unknown[] = [];
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  try {
    for (const [label, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 375, height: 667 },
    })) {
      const context = await browser.newContext({ viewport });
      context.setDefaultTimeout(15000);
      context.setDefaultNavigationTimeout(20000);
      try {
        const page = await context.newPage(),
          errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('response', (r) => {
          if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
        });
        const report = await businessJourney(page, url, `business-${scope}-${name}-${label}`);
        if (errors.length) throw Error(errors.join('\n'));
        reports.push({ browser: name, label, ...report, errors });
        console.log(`${name}/${label}: VERIFIED PASS`);
      } finally {
        await context.close();
      }
    }
  } catch (e) {
    console.error(`${name}: ${String(e)}`);
    reports.push({ browser: name, status: 'FAIL', reason: String(e) });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
writeFileSync(
  `docs/evidence/business-${scope}-browsers.json`,
  JSON.stringify({ url, reports }, null, 2) + '\n',
);
