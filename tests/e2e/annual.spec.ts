import { test } from '@playwright/test';
import { annualJourney, annualPause } from '../../scripts/qa-annual';
test('completes every displayed age0..82 and canonical guest saves without skipped birthdays', async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(240000);
  await annualJourney(page, baseURL!, `yearly-local-${info.project.name}`);
});
test('health academic pause really suspends the program and tuition through reload', async ({
  page,
  baseURL,
}, info) => {
  await annualPause(page, baseURL!, `yearly-local-${info.project.name}`);
});
