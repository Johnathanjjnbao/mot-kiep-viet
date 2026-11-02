import { chromium, firefox, webkit } from 'playwright';
import { writeFileSync } from 'node:fs';
import { realismJourney } from './qa-realism';
const url = process.argv[2] ?? 'http://127.0.0.1:5173/mot-kiep-viet/';
const label = url.includes('github.io') ? 'live' : 'local';
const reports = [];
for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  if (process.env.MKV_BROWSER && process.env.MKV_BROWSER !== name) continue;
  const browser = await engine.launch(
    name === 'chromium' && !process.env.CI ? { channel: 'msedge' } : {},
  );
  try {
    for (const [device, viewport] of Object.entries({
      desktop: { width: 1440, height: 1000 },
      mobile: { width: 375, height: 812 },
    })) {
      const context = await browser.newContext({
        viewport,
        ...(name !== 'firefox' ? { isMobile: device === 'mobile' } : {}),
        hasTouch: device === 'mobile',
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(30000);
      console.log(`${name}/${device}: started`);
      const errors: string[] = [],
        assets = new Set<string>();
      page.on('pageerror', () => errors.push('Uncaught application error'));
      page.on('response', (r) => {
        const path = new URL(r.url()).pathname;
        if (r.status() >= 400) errors.push(`${r.status()} ${path}`);
        if (r.ok() && /\.(js|css|woff2?)$/.test(path)) assets.add(path);
      });
      page.on('requestfailed', (r) => errors.push('Request failed ' + new URL(r.url()).pathname));
      try {
        const report = await realismJourney(page, url, `realism-${label}-${name}-${device}`);
        if (errors.length) throw Error(errors.join('; '));
        if (![...assets].some((p) => p.endsWith('.woff2')))
          throw Error('No verified font response');
        reports.push({ engine: name, device, ...report, assets: [...assets], errors });
        console.log(`${name}/${device}: VERIFIED PASS`);
      } catch (error) {
        await page
          .screenshot({ path: `.local/realism-native-${name}-${device}-failure.png` })
          .catch(() => {});
        console.error(`${name}/${device}: failed at ${page.url()}`);
        throw error;
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}
writeFileSync(
  process.env.MKV_REALISM_BROWSER_REPORT ?? `docs/evidence/realism-${label}-browsers.json`,
  JSON.stringify(
    {
      url,
      source: process.env.MKV_EXPECTED_SHA ?? 'working tree candidate',
      status: 'VERIFIED PASS',
      reports,
    },
    null,
    2,
  ) + '\n',
);
