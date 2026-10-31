import { test } from '@playwright/test';
import {
  employmentApplications,
  employmentRecovery,
  employmentLayoffAndFamily,
  employmentOldSave,
} from '../../scripts/qa-employment';
test('job applications accept or reject, honor cooldown and preserve past work on career switches', async ({
  page,
  baseURL,
}, info) => {
  await employmentApplications(page, baseURL!, `m5-employment-local-${info.project.name}`);
});
test('temporary work pays six months, training and graduate out-of-field work survive export and reload', async ({
  page,
  baseURL,
}, info) => {
  await employmentRecovery(page, baseURL!, `m5-employment-local-${info.project.name}`);
});
test('layoff and unemployment with a dependent have actual financial and recovery paths', async ({
  page,
  baseURL,
}, info) => {
  await employmentLayoffAndFamily(page, baseURL!, `m5-employment-local-${info.project.name}`);
});
test('old university saves keep immediate work and exact historical replay', async ({
  page,
  baseURL,
}) => {
  await employmentOldSave(page, baseURL!);
});
