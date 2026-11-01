import { chromium, firefox, webkit } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { creatorEconomyJourney } from './qa-creator-economy';
const url = process.argv[2] ?? 'http://127.0.0.1:5175/mot-kiep-viet/';
const scope = url.includes('github.io') ? 'live' : 'local',
  reports: unknown[] = [];
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  if (process.env.MKV_BROWSER && name !== process.env.MKV_BROWSER) continue;
  const browser = await type.launch();
  try {
    for (const [label, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 375, height: 667 },
    })) {
      if (process.argv.includes('--desktop') && label !== 'desktop') continue;
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
        const report = await creatorEconomyJourney(
          page,
          url,
          `creator-economy-${scope}-${name}-${label}`,
        );
        if (errors.length) throw Error(errors.join('\n'));
        reports.push({ browser: name, label, ...report, errors });
        console.log(`${name}/${label}: VERIFIED PASS`);
      } finally {
        await context.close();
      }
    }
  } catch (e) {
    reports.push({ browser: name, status: 'FAIL', reason: String(e) });
    console.error(`${name}: ${String(e)}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
writeFileSync(
  process.env.MKV_CREATOR_REPORT ?? `docs/evidence/creator-economy-${scope}-browsers.json`,
  JSON.stringify({ url, reports }, null, 2) + '\n',
);
