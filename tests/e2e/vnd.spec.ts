import { test, expect } from '@playwright/test';
import { vndJourney } from '../../scripts/qa-vnd';
test('VND and historical DSM preserve actual balances through decisions, savings, save/load and export/import', async ({
  page,
  baseURL,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const report = await vndJourney(page, baseURL!, `vnd-local-${info.project.name}`);
  expect(report.status).toBe('VERIFIED PASS');
  expect(errors).toEqual([]);
});
