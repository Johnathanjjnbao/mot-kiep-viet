import { test, expect } from '@playwright/test';
import { viewportCases } from '../../scripts/qa-decision-viewport.mjs';
import {
  assertDecisionViewport,
  readGuestRun,
  clickChoiceWithoutDocumentScroll,
} from '../../scripts/decision-viewport.mjs';
import { jobApplication } from '../../scripts/employment-fixture';
import { importStudent } from '../../scripts/qa-university';
import { writeFileSync } from 'node:fs';
for (const config of viewportCases)
  test(`employment HUD, narrative and20 decisions: ${config.name}`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      viewport: { width: config.width, height: config.height },
      isMobile: !!config.mobile,
      hasTouch: !!config.mobile,
    });
    try {
      const page = await context.newPage();
      await page.goto(baseURL!);
      if (config.large) {
        await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
        await page.getByLabel('Chữ lớn hơn').check();
        await page.keyboard.press('Escape');
      }
      await importStudent(page, jobApplication('rejected').run);
      await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
      await page.getByTestId('advance-life').click();
      const measurements = [],
        start = (await readGuestRun(page)).choices.length;
      for (let i = 0; i < 20; i++) {
        measurements.push(await assertDecisionViewport(page));
        const count = await page.getByTestId('event-choice').count();
        await clickChoiceWithoutDocumentScroll(
          page,
          i % 3 === 0 ? 0 : i % 3 === 1 ? Math.floor(count / 2) : count - 1,
        );
        await expect
          .poll(async () => (await readGuestRun(page)).choices.length)
          .toBe(start + i + 1);
      }
      await page.screenshot({ path: `docs/evidence/m5-employment-local-${config.name}.png` });
      writeFileSync(
        `docs/evidence/m5-employment-local-${config.name}.json`,
        JSON.stringify({ status: 'VERIFIED PASS', config, measurements }, null, 2) + '\n',
      );
    } finally {
      await context.close();
    }
  });
