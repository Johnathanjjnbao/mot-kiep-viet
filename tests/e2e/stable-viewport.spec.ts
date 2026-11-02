import { test, expect } from '@playwright/test';
import { viewportCases } from '../../scripts/qa-decision-viewport.mjs';
import { creativeViewportJourney } from '../../scripts/qa-creative-viewport';
for (const config of viewportCases)
  test('stable56 scenes and20 first/middle/last: ' + config.name, async ({ browser, baseURL }) => {
    test.setTimeout(300000);
    const result = await creativeViewportJourney(
      browser,
      baseURL!,
      config,
      'pre-hiatus-stable',
      'stable',
    );
    expect(result.authoredCases).toBe(56);
  });
