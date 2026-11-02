import { chromium, expect, type Browser } from '@playwright/test';
import { writeFileSync, readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { importStudent } from './qa-university';
import { readGuestRun } from './decision-viewport.mjs';
import { replay, activeDefinition, choiceReason } from '../src/engine/engine';
import { canonical } from '../src/persistence/saves';
import { storyAction, decisionKey } from '../src/application/story-flow';
import { creativeGoldenRuns } from './creative-golden-fixture';
import type { RunSetup, RunAction } from '../src/domain/model';
const url = process.argv[2],
  label = process.argv[3];
if (!url || !label) throw Error('URL and evidence label required');
const fixture = JSON.parse(readFileSync('tests/data/creative-first-show-prefix.json', 'utf8')) as {
  seed: string;
  setup: RunSetup;
  actions: RunAction[];
};
const initial = replay(fixture.seed, fixture.setup, fixture.actions);
const long = creativeGoldenRuns()['combined-life'];
const outDir = process.argv[4];
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
let browser:Browser|undefined;
const report: { [key: string]: unknown } = {
  url,
  label,
  context:
    'Fresh Edge process per trial; desktop1440x1000, CPU4x, local HTTP, cache disabled; UI+IndexedDB latency; not field performance',
  samples: [],
};
try {
  if (server) {
    let ready = false;
    for (let i = 0; i < 100 && !ready; i++) {
      if (server.exitCode !== null) throw Error('Performance preview stopped');
      try {
        ready = (await fetch(url)).ok;
      } catch {
        /* Starting owned preview. */
      }
      if (!ready) await delay(100);
    }
    if (!ready) throw Error('Performance preview not ready');
  }
  const samples = [];
  for (let trial = 0; trial < 3; trial++) {
    browser=await chromium.launch({ channel: 'msedge', args: ['--js-flags=--expose-gc'] });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage(),
      cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const start = performance.now();
    await page.goto(url);
    await expect(
      page.getByRole('button', { name: 'Bắt đầu một kiếp mới', exact: true }),
    ).toBeEnabled();
    const homeMs = performance.now() - start;
    const creatorStart = performance.now();
    await page.getByRole('button', { name: 'Bắt đầu một kiếp mới', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Đặt tên cho một cuộc đời.' })).toBeVisible();
    const creatorMs = performance.now() - creatorStart;
    const importStart = performance.now();
    await importStudent(page, initial);
    const importMs = performance.now() - importStart;
    let run = initial;
    const decisions = [];
    for (let n = 0; n < 20; n++) {
      const e = activeDefinition(run)!;
      const c = e.choices.find((c) => !choiceReason(run, c))!;
      const next = storyAction(
        run,
        { type: 'choose', eventId: e.id, choiceId: c.id },
        decisionKey(run),
      );
      const t = performance.now();
      await page.getByTestId('event-choice').first().click();
      await expect
        .poll(async () => canonical(await readGuestRun(page)), {
          timeout: 15000,
          intervals: [10, 20, 40],
        })
        .toBe(canonical(next));
      decisions.push(performance.now() - t);
      run = next;
    }
    const reloadStart = performance.now();
    await page.reload();
    await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(run));
    await expect(page.getByRole('button', { name: new RegExp('Tiếp tục cuộc đời') })).toBeVisible();
    const reloadMs = performance.now() - reloadStart;
    const largeStart = performance.now();
    await importStudent(page, long, 30000);
    const importLargeMs = performance.now() - largeStart;
    const resources = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .filter((x) => x.name.includes('/assets/'))
        .map((x) => ({
          name: x.name.split('/').at(-1),
          bytes: (x as PerformanceResourceTiming).encodedBodySize,
        })),
    );
    const heaps = [];
    for (let j = 0; j < 20; j++) {
      await importStudent(page, initial);
      await page.evaluate(() => {
        (globalThis as typeof globalThis & { gc?: () => void }).gc?.();
      });
      heaps.push((await cdp.send('Runtime.getHeapUsage')).usedSize);
    }
    samples.push({
      homeMs,
      creatorMs,
      importMs,
      reloadMs,
      importLargeMs,
      largeActions: long.actions.length,
      decisionsMs: decisions,
      resources,
      heapsBytesAfterGC: heaps,
      errors,
    });
    expect(errors).toEqual([]);
    await context.close();
    await browser.close();browser=undefined;
  }
  report.samples = samples;
  report.status = 'MEASURED';
  writeFileSync(
    `docs/evidence/pre-hiatus-performance-${label}.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  server?.kill();
}
