import { test } from '@playwright/test';
import { livingAssetsHistoryJourney } from '../../scripts/qa-living-assets';
test('assets: natural old-age ending and debt survive independent life history', async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(180000);
  await livingAssetsHistoryJourney(page, baseURL!, `assets-${info.project.name}`);
});
