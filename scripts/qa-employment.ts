import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import {
  jobApplication,
  jobSwitch,
  jobApplicant,
  careerGraduate,
  naturalLayoff,
  unemployedParent,
} from './employment-fixture';
import { importStudent } from './qa-university';
import { admittedStudent } from './academic-fixture';
import { currentCareer } from '../src/content/world';
import { manage } from '../src/engine/engine';
import { canonical, parseSave } from '../src/persistence/saves';
import { readGuestRun, assertDecisionViewport } from './decision-viewport.mjs';
const careerTab = (page: Page) =>
  page.getByRole('button', { name: 'Nghề nghiệp', exact: true }).click();
export async function employmentApplications(page: Page, url: string, prefix: string) {
  await page.goto(url);
  for (const switching of [false, true])
    for (const result of ['accepted', 'rejected'] as const) {
      const { before, run } = switching ? jobSwitch(result) : jobApplication(result);
      await importStudent(page, before);
      await careerTab(page);
      const card = page.locator('[data-career="office"]');
      await card.getByRole('button', { name: 'Ứng tuyển', exact: true }).dblclick();
      await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(run));
      await expect(page.getByTestId('job-result')).toContainText(
        result === 'accepted' ? 'Đã được nhận' : 'Chưa được nhận',
      );
      if (switching) {
        const old = run.player.careers[0];
        expect(old.experience).toBeGreaterThan(0);
        expect(old.endMonth === null).toBe(result === 'rejected');
      }
      if (result === 'rejected') {
        await expect(card).toContainText('6 tháng');
        await expect(card.getByRole('button')).toBeDisabled();
      }
    }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `docs/evidence/${prefix}-applications.png`, fullPage: true });
  return {
    status: 'VERIFIED PASS',
    acceptance: true,
    rejection: true,
    cooldown: true,
    acceptedAndRejectedSwitches: true,
    oldExperiencePreserved: true,
  };
}
export async function employmentRecovery(page: Page, url: string, prefix: string) {
  await page.goto(url);
  const applicant = jobApplicant();
  await importStudent(page, applicant);
  await careerTab(page);
  await page.getByRole('button', { name: 'Nhờ giới thiệu việc tạm', exact: true }).click();
  await expect(page.locator('.current-job')).toContainText('hợp đồng tạm sáu tháng');
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  await page.getByTestId('advance-life').click();
  await expect.poll(async () => (await readGuestRun(page)).month).toBe(applicant.month + 6);
  await assertDecisionViewport(page);
  let run = await readGuestRun(page);
  expect(run.player.careers[0].experience).toBe(6);
  expect(run.player.careers[0].ending).toBe('contract-ended');
  expect(currentCareer(run)).toBeUndefined();
  await page.screenshot({ path: `docs/evidence/${prefix}-recovery-scene.png` });
  await careerTab(page);
  await page.getByRole('button', { name: 'Học kỹ năng · 20 đSM', exact: true }).click();
  await expect
    .poll(async () => (await readGuestRun(page)).employment!.trainingMonths.length)
    .toBe(1);
  const trained = await readGuestRun(page);
  expect(trained.finance.cash).toBe(run.finance.cash - 20);
  await expect(
    page.getByRole('button', { name: 'Học kỹ năng · 20 đSM', exact: true }),
  ).toBeDisabled();
  await importStudent(page, careerGraduate('korean'));
  await careerTab(page);
  await page.getByRole('button', { name: 'Nhờ giới thiệu việc tạm', exact: true }).click();
  await expect.poll(async () => currentCareer(await readGuestRun(page))?.field).toBe('outside');
  run = await readGuestRun(page);
  expect(run.academics!.qualifications[0].programId).toBe('korean');
  await page.screenshot({ path: `docs/evidence/${prefix}-graduate-work.png`, fullPage: true });
  await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
  for (let i = 1; i <= 3; i++)
    await page.getByRole('button', { name: `Lưu vào ô ${i}`, exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất tệp lưu', exact: true }).click();
  const file = (await (await downloading).path())!;
  expect(canonical(parseSave(await readFile(file, 'utf8')).run)).toBe(canonical(run));
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  expect(canonical(await readGuestRun(page))).toBe(canonical(run));
  return {
    status: 'VERIFIED PASS',
    sixPaidMonths: true,
    contractEnd: true,
    retraining: true,
    graduationToOutOfFieldWork: true,
    slots: 3,
    exportReplayReload: true,
  };
}
export async function employmentLayoffAndFamily(page: Page, url: string, prefix: string) {
  await page.goto(url);
  const laidOff = naturalLayoff();
  await importStudent(page, laidOff);
  await careerTab(page);
  expect(currentCareer(await readGuestRun(page))).toBeUndefined();
  expect(laidOff.finance.transactions.some((t) => t.id.startsWith('employment:transition:'))).toBe(
    true,
  );
  await page.locator('.employment-panel .academic-history > summary').click();
  await expect(page.locator('.employment-panel')).toContainText('cắt giảm vị trí');
  await page.screenshot({ path: `docs/evidence/${prefix}-layoff.png`, fullPage: true });
  const parent = unemployedParent();
  await importStudent(page, parent);
  await careerTab(page);
  const before = await readGuestRun(page);
  expect(before.family!.children.length).toBeGreaterThan(0);
  expect(currentCareer(before)).toBeUndefined();
  await page.getByRole('button', { name: 'Nhờ giới thiệu việc tạm', exact: true }).click();
  await expect.poll(async () => currentCareer(await readGuestRun(page))?.id).toBe('labor');
  const restored = await readGuestRun(page);
  expect(restored.family!.children.map((c) => c.parents)).toEqual(
    before.family!.children.map((c) => c.parents),
  );
  await page.screenshot({ path: `docs/evidence/${prefix}-parent-recovery.png`, fullPage: true });
  return {
    status: 'VERIFIED PASS',
    seededLayoff: true,
    transitionPayment: true,
    dependents: before.family!.children.length,
    reemployment: true,
    recordedParentsPreserved: true,
  };
}
export async function employmentOldSave(page: Page, url: string) {
  await page.goto(url);
  const before = admittedStudent('business').before;
  await importStudent(page, before);
  await careerTab(page);
  await page
    .locator('[data-career="farm"]')
    .getByRole('button', { name: 'Nhận công việc', exact: true })
    .click();
  await expect
    .poll(async () => canonical(await readGuestRun(page)))
    .toBe(canonical(manage(before, 'apply-job', 'farm')));
  expect((await readGuestRun(page)).employment).toBeUndefined();
  return {
    status: 'VERIFIED PASS',
    ruleset: 'education-v1',
    oldImmediateEmploymentAndReplayPreserved: true,
  };
}
