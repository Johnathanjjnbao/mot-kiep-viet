import { chromium, firefox, webkit } from '@playwright/test';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import {
  livingAssetsJourney,
  livingAssetsHistoryJourney,
  livingAssetsNewLifeJourney,
} from './qa-living-assets';
const url = process.argv[2],
  label = process.argv[3] ?? 'local',
  outDir = process.argv[4];
if (!url) throw Error('Target URL required');
const server = outDir
  ? spawn(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        new URL(url).port,
        '--strictPort',
        '--outDir',
        outDir,
      ],
      {
        windowsHide: true,
        stdio: 'ignore',
        env: { ...process.env, VITE_BASE_PATH: new URL(url).pathname },
      },
    )
  : null;
const results = [];
try {
  if (server) {
    let ready = false;
    for (let i = 0; i < 100 && !ready; i++) {
      if (server.exitCode !== null) throw Error('Owned preview stopped');
      try {
        ready = (await fetch(url)).ok;
      } catch {
        /* starting own preview */
      }
      if (!ready) await delay(100);
    }
    if (!ready) throw Error('Preview did not start');
  }
  for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
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
          ...(name === 'firefox' ? {} : { isMobile: device === 'mobile' }),
          hasTouch: device === 'mobile',
          reducedMotion: 'reduce',
        });
        try {
          const page = await context.newPage(),
            prefix = `assets-${label}-${name}-${device}`;
          const fresh = await livingAssetsNewLifeJourney(
            page,
            url,
            'assets-' + name + '-' + device,
          );
          const assets = await livingAssetsJourney(page, url, prefix);
          const history = await livingAssetsHistoryJourney(page, url, prefix);
          results.push({
            engine: name,
            device,
            viewport,
            mobileEmulation:
              name === 'firefox'
                ? 'viewport and touch; Firefox has no isMobile option'
                : device === 'mobile',
            fresh,
            assets,
            history,
          });
          console.log(name + '/' + device + ': PASS');
        } catch (error) {
          const page = context.pages()[0];
          await page
            ?.screenshot({
              path: `.local/assets-${label}-${name}-${device}-failure.png`,
              fullPage: true,
            })
            .catch(() => {});
          throw error;
        } finally {
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  }
  const report = { status: 'VERIFIED PASS', url, label, combinations: results.length, results };
  writeFileSync(
    `docs/evidence/assets-browsers-${label}.json`,
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify({ status: report.status, combinations: results.length }));
} finally {
  server?.kill();
}
