import { test } from '@playwright/test';
import {
  universityApplications,
  universityGraduation,
  universityRecovery,
} from '../../scripts/qa-university';
test('all12 programs apply through UI without double fees or premature qualifications', async ({
  page,
  baseURL,
}, info) => {
  await universityApplications(page, baseURL!, `m5-university-local-${info.project.name}`);
});

test('admission rejection, cooldown, pause, return and leaving a program remain recoverable', async ({
  page,
  baseURL,
}) => {
  await universityRecovery(page, baseURL!);
});
test('major assessments lead to a real qualification and exact save/export/reload', async ({
  page,
  baseURL,
}, info) => {
  await universityGraduation(page, baseURL!, `m5-university-local-${info.project.name}`);
});
