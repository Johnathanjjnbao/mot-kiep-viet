import { test, expect } from '@playwright/test';
import { viewportCases, viewportJourney } from '../../scripts/qa-decision-viewport.mjs';
import { replay } from '../../src/engine/engine';
import { readFileSync, writeFileSync } from 'node:fs';
for (const config of viewportCases) {
  test(`persistent HUD and 20 mixed decisions without document scrolling: ${config.name}`, async ({
    browser,
    baseURL,
  }) => {
    const { report, run } = await viewportJourney(browser, baseURL!, config);
    expect(report.status).toBe('VERIFIED PASS');
    expect(replay(run.seed, run.setup, run.actions)).toEqual(run);
    const file = 'docs/evidence/v031-local-viewport.json';
    const previous =
      config.name === viewportCases[0].name ? [] : JSON.parse(readFileSync(file, 'utf8')).reports;
    previous.push(report);
    writeFileSync(
      file,
      JSON.stringify(
        {
          url: baseURL,
          status: previous.length === viewportCases.length ? 'VERIFIED PASS' : 'INCOMPLETE',
          reports: previous,
        },
        null,
        2,
      ) + '\n',
    );
  });
}
