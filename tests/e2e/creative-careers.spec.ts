import { test } from '@playwright/test';
import { creativeCareerJourney } from '../../scripts/qa-creative-careers';
test('independent gaming, one competition and bounded collaboration on the same channel', async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(150000);
  await creativeCareerJourney(page, baseURL!, `creative-${info.project.name}`);
});
