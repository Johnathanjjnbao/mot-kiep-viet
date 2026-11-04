import { test } from '@playwright/test';
import { viewportCases } from '../../scripts/qa-decision-viewport.mjs';
import { creativeViewportJourney } from '../../scripts/qa-creative-viewport';
for (const config of viewportCases)
  test(`assets25 scenes and20 first/middle/last decisions: ${config.name}`, async ({
    browser,
    baseURL,
  }) => {
    test.setTimeout(180000);
    await creativeViewportJourney(browser, baseURL!, config, 'assets-local', 'assets');
  });
