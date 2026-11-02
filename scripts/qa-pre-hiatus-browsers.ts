import { chromium, firefox, webkit, expect, type Page } from '@playwright/test';
import { writeFileSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { realismJourney } from './qa-realism';
import { freelanceJourney } from './qa-freelance';
import { creativeCareerJourney } from './qa-creative-careers';
import { artisticJourney } from './qa-artistic';
import { importStudent } from './qa-university';
import { replay, activeDefinition } from '../src/engine/engine';
import type { RunSetup, RunAction } from '../src/domain/model';
import { assertDecisionViewport } from './decision-viewport.mjs';
const url = process.argv[2],
  label = process.argv[3] ?? 'local',
  outDir = process.argv[4];
if (!url) throw Error('Provide a target URL');
const rows = JSON.parse(readFileSync('tests/data/stable-viewport-replays.json', 'utf8')) as {
  id: string;
  seed: string;
  setup: RunSetup;
  actions: RunAction[];
}[];
const reports: unknown[] = [];
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
const flows: Record<string, (page: Page, url: string, prefix: string) => Promise<unknown>> = {
  creator: realismJourney,
  freelance: freelanceJourney,
  creative: creativeCareerJourney,
  artistic: artisticJourney,
  stable: async (page, target) => {
    await page.goto(target);
    for (const row of rows) {
      const r = replay(row.seed, row.setup, row.actions);
      expect(activeDefinition(r)?.id).toBe(row.id);
      await importStudent(page, r);
      await assertDecisionViewport(page);
    }
    return { authoredScenes: rows.length };
  },
};
try {
  if (server) {
    let ready = false;
    for (let i = 0; i < 100 && !ready; i++) {
      if (server.exitCode !== null) throw Error('Preview stopped');
      try {
        ready = (await fetch(url)).ok;
      } catch {
        /* Starting owned preview. */
      }
      if (!ready) await delay(100);
    }
    if (!ready) throw Error('Preview not ready');
  }
  for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await engine.launch();
    try {
      for (const [device, viewport] of Object.entries({
        desktop: { width: 1440, height: 900 },
        mobile: { width: 375, height: 812 },
      })) {
        const results: Record<string, unknown> = {},
          allAssets = new Set<string>();
        for (const [stage, journey] of Object.entries(flows)) {
          // Journeys own their slot fixtures. Fresh contexts preserve isolation instead of bypassing overwrite confirmation.
          const context = await browser.newContext({
            viewport,
            ...(name === 'firefox' ? {} : { isMobile: device === 'mobile' }),
            hasTouch: device === 'mobile',
            reducedMotion: 'reduce',
          });
          const page = await context.newPage(),
            errors: string[] = [],
            assets = new Set<string>();
          page.setDefaultTimeout(15000);
          const prefix = `pre-hiatus-${label}-${name}-${device}-${stage}`;
          page.on('pageerror', (e) => errors.push(e.message));
          page.on('requestfailed', (r) =>
            errors.push('Request failed ' + new URL(r.url()).pathname),
          );
          page.on('response', (r) => {
            const p = new URL(r.url()).pathname;
            if (r.status() >= 400) errors.push(r.status() + ' ' + p);
            if (r.ok() && /\.(js|css|woff2?)$/.test(p)) assets.add(p);
          });
          try {
            results[stage] = await journey(page, url, prefix);
            expect(errors).toEqual([]);
            expect([...assets].some((p) => p.endsWith('.woff2'))).toBe(true);
            assets.forEach((p) => allAssets.add(p));
            console.log(name + '/' + device + '/' + stage + ': VERIFIED PASS');
          } catch (error) {
            await page.screenshot({ path: `.local/${prefix}-failure.png` }).catch(() => {});
            writeFileSync(
              `.local/${prefix}-failure.json`,
              JSON.stringify(
                { browser: name, device, stage, error: String(error), errors },
                null,
                2,
              ),
            );
            throw error;
          } finally {
            await context.close();
          }
        }
        reports.push({
          browser: name,
          device,
          viewport,
          firefoxMobileViewport: name === 'firefox' && device === 'mobile',
          ...results,
          assets: [...allAssets],
          errors: [],
          status: 'VERIFIED PASS',
        });
        writeFileSync(
          `.local/pre-hiatus-${label}-browsers-progress.json`,
          JSON.stringify({ status: 'INCOMPLETE', reports }, null, 2),
        );
      }
    } finally {
      await browser.close();
    }
  }
  writeFileSync(
    `docs/evidence/pre-hiatus-${label}-browsers.json`,
    JSON.stringify(
      {
        status: 'VERIFIED PASS',
        url,
        source: process.env.MKV_EXPECTED_SHA ?? 'runtime freeze candidate',
        reports,
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  server?.kill();
}
