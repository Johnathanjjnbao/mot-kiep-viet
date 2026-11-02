import { test } from '@playwright/test';
import { realismJourney } from '../../scripts/qa-realism';
test('explicit girl preview, caregiver money, child saving and adulthood persist through the real UI', async ({
  page,
  baseURL,
}, info) => {
  await realismJourney(page, baseURL!, `realism-local-${info.project.name}`);
});
