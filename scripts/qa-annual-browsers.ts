import { chromium, firefox, webkit } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { annualJourney, annualPause } from './qa-annual';
const target = process.argv[2] ?? 'http://127.0.0.1:5173/mot-kiep-viet/';
const scope = target.includes('github.io') ? 'live' : 'local',
  reports: unknown[] = [];
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  try {
    for (const [label, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 375, height: 667 },
    })) {
      const context = await browser.newContext({ viewport });
      try {
        const page = await context.newPage(),
          errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        const prefix = `yearly-${scope}-${name}-${label}`;
        const journey = await annualJourney(page, target, prefix);
        const pause = await annualPause(page, target, prefix);
        if (errors.length) throw Error(errors.join('\n'));
        reports.push({ browser: name, label, status: 'VERIFIED PASS', journey, pause, errors });
        console.log(`${name}/${label}: VERIFIED PASS`);
      } finally {
        await context.close();
      }
    }
  } catch (e) {
    reports.push({ browser: name, status: 'FAIL', reason: String(e) });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
writeFileSync(
  `docs/evidence/yearly-${scope}-browsers.json`,
  JSON.stringify(reports, null, 2) + '\n',
);
