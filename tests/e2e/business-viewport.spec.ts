import { test, expect } from '@playwright/test';
import { viewportCases } from '../../scripts/qa-decision-viewport.mjs';
import { businessAdult, found, businessStep } from '../../scripts/business-fixture';
import { importStudent } from '../../scripts/qa-university';
import { activeDefinition, choiceReason, replay } from '../../src/engine/engine';
import {
  assertDecisionViewport,
  clickChoiceWithoutDocumentScroll,
  readGuestRun,
} from '../../scripts/decision-viewport.mjs';
import { storyAction, decisionKey } from '../../src/application/story-flow';
import { canonical } from '../../src/persistence/saves';
for (const config of viewportCases)
  test(`business HUD and20 first/middle/last decisions: ${config.name}`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      viewport: { width: config.width, height: config.height },
      isMobile: !!config.mobile,
      hasTouch: !!config.mobile,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      await page.goto(baseURL!);
      if (config.large) await page.addStyleTag({ content: ':root{font-size:18px !important}' });
      let r = found(businessAdult('business-viewport'));
      for (let i = 0; i < 40 && activeDefinition(r)?.version !== 10; i++) r = businessStep(r);
      expect(activeDefinition(r)?.version).toBe(10);
      await importStudent(page, r);
      let lastTouch = 0;
      for (let i = 0; i < 20; i++) {
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
      await page.screenshot({ path: `docs/evidence/business-local-viewport-${config.name}.png` });
    } finally {
      await context.close();
    }
  });
