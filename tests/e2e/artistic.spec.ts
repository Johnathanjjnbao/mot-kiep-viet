import { test } from '@playwright/test';
import { artisticJourney } from '../../scripts/qa-artistic';
test('artistic training, audition, offer/show money, rejection, comeback and save roundtrip', async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(150000);
  await artisticJourney(page, baseURL!, `artistic-${info.project.name}`);
});
