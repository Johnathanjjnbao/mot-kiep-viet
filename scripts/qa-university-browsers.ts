import { chromium, firefox, webkit } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { universityApplications, universityGraduation, universityRecovery } from './qa-university';

const target = process.argv[2] ?? 'http://127.0.0.1:5173/mot-kiep-viet/';
const scope = target.includes('github.io') ? 'live' : 'local';
const reports: unknown[] = [];
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  if (process.argv[3] && process.argv[3] !== name) continue;
  let browser;
  try {
    browser = await type.launch({ timeout: 15000 });
  } catch (e) {
    reports.push({ browser: name, status: 'NOT RUN', reason: String(e).slice(0, 500) });
    process.exitCode = 1;
    continue;
  }
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
        const prefix = `m5-university-${scope}-${name}-${label}`;
        console.log(`${name}/${label}: applications`);
        const applications = await universityApplications(page, target, prefix);
        console.log(`${name}/${label}: graduation`);
        const graduation = await universityGraduation(page, target, prefix);
        console.log(`${name}/${label}: recovery`);
        const recovery = await universityRecovery(page, target);
        if (errors.length) throw Error(errors.join('\n'));
        reports.push({
          browser: name,
          label,
          status: 'VERIFIED PASS',
          applications,
          graduation,
          recovery,
          errors,
        });
        console.log(`${name}/${label}: VERIFIED PASS`);
      } finally {
        await context.close();
      }
    }
  } catch (e) {
    reports.push({
      browser: name,
      status: 'FAIL',
      reason: (e instanceof Error ? e.stack : String(e))?.slice(0, 2500),
    });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
writeFileSync(
  `docs/evidence/m5-university-${scope}-browsers.json`,
  JSON.stringify({ target, reports }, null, 2) + '\n',
);
