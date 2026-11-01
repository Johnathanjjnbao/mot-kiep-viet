import { test, expect } from '@playwright/test';
import { businessJourney } from '../../scripts/qa-business';
test('online shop from birth through loss, recovery, save slots, closure and re-entry', async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const report = await businessJourney(page, baseURL!, `business-local-${info.project.name}`);
  expect(report.status).toBe('VERIFIED PASS');
  expect(errors).toEqual([]);
});
