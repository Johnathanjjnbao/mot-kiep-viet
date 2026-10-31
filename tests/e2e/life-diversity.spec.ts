import { test } from '@playwright/test';
import { diversityJourney } from '../../scripts/qa-life-diversity';
test('new lives have distinct openings, explicit seeds reproduce them, and fresh starts do not reuse seeds', async ({
  page,
  baseURL,
}) => {
  await diversityJourney(page, baseURL!);
});
