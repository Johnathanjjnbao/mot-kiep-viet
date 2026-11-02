import { test } from '@playwright/test';
import { freelanceJourney } from '../../scripts/qa-freelance';
test('client inquiry, delivery, review, paid/rejected/rework and save roundtrip', async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(150000);
  await freelanceJourney(page, baseURL!, `freelance-${info.project.name}`);
});
