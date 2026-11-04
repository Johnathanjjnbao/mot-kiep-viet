import { test } from '@playwright/test';
import { livingAssetsJourney, livingAssetsNewLifeJourney } from '../../scripts/qa-living-assets';
test('living assets: housing, vehicle, devices, PC and canonical saves', async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(180000);
  await livingAssetsNewLifeJourney(page, baseURL!);
  await livingAssetsJourney(page, baseURL!, `assets-${info.project.name}`);
});
