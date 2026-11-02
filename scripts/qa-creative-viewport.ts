import { expect, type Browser } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import type { RunSetup, RunAction } from '../src/domain/model';
import { activeDefinition, choiceReason, replay } from '../src/engine/engine';
import { canonical } from '../src/persistence/saves';
import { storyAction, decisionKey } from '../src/application/story-flow';
import { importStudent } from './qa-university';
import {
  assertDecisionViewport,
  clickChoiceWithoutDocumentScroll,
  readGuestRun,
} from './decision-viewport.mjs';
type Config = { name: string; width: number; height: number; mobile?: boolean; large?: boolean };
type Case = { id: string; seed: string; setup: RunSetup; actions: RunAction[] };
export async function creativeViewportJourney(
  browser: Browser,
  url: string,
  config: Config,
  prefix = 'creative-local',
) {
  const rows = JSON.parse(
    readFileSync('tests/data/creative-viewport-replays.json', 'utf8'),
  ) as Case[];
  const context = await browser.newContext({
    viewport: { width: config.width, height: config.height },
    isMobile: !!config.mobile,
    hasTouch: !!config.mobile,
    reducedMotion: 'reduce',
  });
  const measurements: Record<string, unknown>[] = [];
  let current = 'navigation';
  try {
    const page = await context.newPage();
    await page.goto(url);
    if (config.large) await page.addStyleTag({ content: ':root{font-size:18px !important}' });
    let worst: Case | undefined,
      worstBottom = 0;
    for (const row of rows) {
      current = row.id;
      const r = replay(row.seed, row.setup, row.actions);
      expect(activeDefinition(r)!.id).toBe(row.id);
      await importStudent(page, r);
      const m = await assertDecisionViewport(page);
      expect(await page.evaluate(() => ({ width: innerWidth, height: innerHeight }))).toEqual({
        width: config.width,
        height: config.height,
      });
      measurements.push({ id: row.id, measurement: m });
      const bottom = (await page.getByTestId('event-choice').first().boundingBox())!;
      if (bottom.y + bottom.height > worstBottom) {
        worstBottom = bottom.y + bottom.height;
        worst = row;
      }
    }
    let r = replay(
      rows.find((x) => x.id === 'fl-service-writing')!.seed,
      rows.find((x) => x.id === 'fl-service-writing')!.setup,
      rows.find((x) => x.id === 'fl-service-writing')!.actions,
    );
    await importStudent(page, r);
    let lastTouch = 0;
    for (let i = 0; i < 20; i++) {
      current = 'decision-' + i;
      await assertDecisionViewport(page);
      const e = activeDefinition(r)!;
      const available = e.choices
        .map((c, index) => ({ c, index }))
        .filter(({ c }) => !choiceReason(r, c));
      expect(available.length).toBeGreaterThanOrEqual(4);
      const { c, index } =
        available[
          i % 3 === 0 ? 0 : i % 3 === 1 ? Math.floor(available.length / 2) : available.length - 1
        ];
      const next = storyAction(
        r,
        { type: 'choose', eventId: e.id, choiceId: c.id },
        decisionKey(r),
      );
      if (config.mobile)
        await expect.poll(() => Date.now() - lastTouch, { intervals: [50] }).toBeGreaterThan(620);
      lastTouch = Date.now();
      await clickChoiceWithoutDocumentScroll(page, index, !!config.mobile);
      await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(next));
      r = next;
    }
    expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await importStudent(page, replay(worst!.seed, worst!.setup, worst!.actions));
    await assertDecisionViewport(page);
    await page.screenshot({ path: `docs/evidence/${prefix}-viewport-${config.name}.png` });
    const result = {
      status: 'LOCAL PASS',
      name: config.name,
      authoredCases: rows.length,
      decisions: 20,
      worst: worst!.id,
      worstBottom,
      measurements,
    };
    writeFileSync(
      `docs/evidence/${prefix}-viewport-${config.name}.json`,
      JSON.stringify(result, null, 2),
    );
    return result;
  } catch (error) {
    const page = context.pages()[0];
    await page.screenshot({ path: `.local/creative-viewport-${config.name}-failed.png` });
    writeFileSync(
      `.local/creative-viewport-${config.name}-failed.json`,
      JSON.stringify({ current, error: String(error), measurements }, null, 2),
    );
    throw error;
  } finally {
    await context.close();
  }
}
