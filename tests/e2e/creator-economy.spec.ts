import { test, expect } from '@playwright/test';
import { creatorEconomyJourney } from '../../scripts/qa-creator-economy';
test('YouTube and TikTok LIVE keep audience, equipment, costs, monetization, rest and canonical saves', async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const report = await creatorEconomyJourney(
    page,
    baseURL!,
    `creator-economy-local-${info.project.name}`,
  );
  expect(report.status).toBe('VERIFIED PASS');
  expect(errors).toEqual([]);
});
