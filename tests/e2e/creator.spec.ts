import { test } from '@playwright/test';
import { creatorJourney } from '../../scripts/qa-creator';

test('creator locks, independent rerolls, preview, 20 decisions and save roundtrip', async ({
  page,
  baseURL,
}, info) => {
  await creatorJourney(page, baseURL!, `m5-a-local-${info.project.name}`);
});
