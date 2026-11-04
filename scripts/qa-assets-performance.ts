import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { assetsCombined } from './assets-combined-fixture';
import { importStudent } from './qa-university';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
import { readGuestRun } from './decision-viewport.mjs';
const url = process.argv[2],
  label = process.argv[3] ?? 'local',
  outDir = process.argv[4];
if (!url) throw Error('Target URL required');
const generated = assetsCombined(),
  initial = generated.checkpoints.acquired,
  long = generated.checkpoints['last-decision'];
const largest = parseSave(readFileSync('.local/assets-largest-save.json', 'utf8')).run;
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
const samples = [];
try {
  if (server) {
    let ready = false;
    for (let i = 0; i < 100 && !ready; i++) {
      if (server.exitCode !== null) throw Error('Owned preview stopped');
      try {
        ready = (await fetch(url)).ok;
      } catch {
        /* own preview startup */
      }
      if (!ready) await delay(100);
    }
    if (!ready) throw Error('Preview not ready');
  }
  for (let trial = 0; trial < 3; trial++) {
    const browser = await chromium.launch({ channel: 'msedge', args: ['--js-flags=--expose-gc'] });
    try {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage(),
        cdp = await context.newCDPSession(page),
        errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      let t = performance.now();
      await page.goto(url);
      await expect(
        page.getByRole('button', { name: 'Bắt đầu một kiếp mới', exact: true }),
      ).toBeEnabled({ timeout: 60000 });
      const homeMs = performance.now() - t;
      t = performance.now();
      await importStudent(page, initial, 60000);
      const importAcquiredMs = performance.now() - t;
      t = performance.now();
      await page.getByRole('button', { name: 'Tài chính', exact: true }).click();
      await page.getByRole('button', { name: 'Mở Đời sống và tài sản', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Đời sống và tài sản', exact: true }),
      ).toBeVisible();
      const lazyPanelMs = performance.now() - t;
      t = performance.now();
      await importStudent(page, largest, 60000);
      const importLargestMs = performance.now() - t;
      t = performance.now();
      await importStudent(page, long, 60000);
      const importLongMs = performance.now() - t;
      t = performance.now();
      await page.reload();
      await expect(page.getByRole('button', { name: /Tiếp tục cuộc đời của/ })).toBeVisible({
        timeout: 60000,
      });
      await expect
        .poll(async () => canonical(await readGuestRun(page)) === canonical(long), {
          timeout: 60000,
        })
        .toBe(true);
      const reloadLongMs = performance.now() - t;
      const heaps = [];
      for (let i = 0; i < 5; i++) {
        await importStudent(page, initial, 60000);
        await page.evaluate(() => {
          (globalThis as typeof globalThis & { gc?: () => void }).gc?.();
        });
        heaps.push((await cdp.send('Runtime.getHeapUsage')).usedSize);
      }
      const resources = await page.evaluate(() =>
        performance
          .getEntriesByType('resource')
          .filter((x) => x.name.includes('/assets/'))
          .map((x) => ({
            name: x.name.split('/').at(-1),
            encodedBytes: (x as PerformanceResourceTiming).encodedBodySize,
          })),
      );
      expect(errors).toEqual([]);
      samples.push({
        trial,
        homeMs,
        importAcquiredMs,
        lazyPanelMs,
        importLargestMs,
        importLongMs,
        reloadLongMs,
        largestActions: largest.actions.length,
        largestBytes: Buffer.byteLength(JSON.stringify(snapshot(largest))),
        heapsBytesAfterRequestedGC: heaps,
        resources,
        errors,
      });
      console.log(`assets performance trial${trial + 1}: measured`);
      await context.close();
    } finally {
      await browser.close();
    }
  }
  const report = {
    status: 'MEASURED',
    url,
    label,
    context:
      'Fresh Edge process per trial; desktop1440x1000,CPU4x,cache disabled,local HTTP. Import includes strict validation and autosave observation; history archival may complete later. Synthetic measurements, not field performance. Heap samples do not prove absence of leaks.',
    samples,
  };
  writeFileSync(
    `docs/evidence/assets-performance-${label}.json`,
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify({ status: report.status, trials: samples.length }));
} finally {
  server?.kill();
}
