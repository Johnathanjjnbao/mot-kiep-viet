import { expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { admittedStudent } from './academic-fixture';
import { PROGRAMS } from '../src/content/programs';
import { snapshot, canonical, parseSave } from '../src/persistence/saves';
import { readGuestRun, assertDecisionViewport } from './decision-viewport.mjs';
import type { GameRun } from '../src/domain/model';
import AxeBuilder from '@axe-core/playwright';
import { academicApplicant } from './academic-fixture';
import { dispatch } from '../src/engine/engine';

export async function importStudent(page: Page, run: GameRun) {
  await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
  await page.getByLabel('Chọn tệp game đã lưu').setInputFiles({
    name: 'university-fixture.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(snapshot(run, randomUUID()))),
  });
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect
    .poll(async () => {
      try {
        return canonical(await readGuestRun(page));
      } catch {
        return 'autosave pending';
      }
    })
    .toBe(canonical(run));
}
export async function universityApplications(page: Page, url: string, prefix: string) {
  await page.goto(url);
  for (const p of PROGRAMS) {
    const { before } = admittedStudent(p.id);
    await importStudent(page, before);
    await page.getByRole('button', { name: 'Nghề nghiệp', exact: true }).click();
    await page.getByLabel('Tìm ngành', { exact: true }).fill(p.name);
    const card = page.locator(`[data-program="${p.id}"]`);
    await expect(card).toContainText(p.name);
    await card.getByRole('button', { name: 'Nộp hồ sơ', exact: true }).dblclick();
    await expect
      .poll(async () => (await readGuestRun(page)).academics!.applications.length)
      .toBe(1);
    const run = await readGuestRun(page);
    expect(run.academics!.studies[0].programId).toBe(p.id);
    expect(run.academics!.qualifications).toHaveLength(0);
    expect(run.finance.transactions.filter((t) => t.id.endsWith(':tuition'))).toHaveLength(1);
  }
  await page.screenshot({ path: `docs/evidence/${prefix}-catalog.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  return { status: 'VERIFIED PASS', programs: 12, viewport: page.viewportSize() };
}
export async function universityGraduation(page: Page, url: string, prefix: string) {
  await page.goto(url);
  await importStudent(page, admittedStudent('korean').run);
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  if (await page.getByTestId('advance-life').count())
    await page.getByTestId('advance-life').click();
  for (let i = 0; i < 10; i++) {
    const r = await readGuestRun(page);
    if (r.academics!.qualifications.length) break;
    expect(r.academics!.focus).toBeTruthy();
    await assertDecisionViewport(page);
    if (i === 0) await page.screenshot({ path: `docs/evidence/${prefix}-assessment.png` });
    await page.getByTestId('event-choice').first().click();
    await expect
      .poll(async () => (await readGuestRun(page)).academics!.studies[0].termAttempts)
      .toBe(i + 1);
  }
  const saved = await readGuestRun(page);
  expect(saved.academics!.qualifications[0].programId).toBe('korean');
  await page.getByRole('button', { name: 'Nghề nghiệp', exact: true }).click();
  await expect(page.getByTestId('qualifications')).toContainText('Ngôn ngữ Hàn Quốc');
  await page.screenshot({ path: `docs/evidence/${prefix}-graduation.png`, fullPage: true });
  await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
  for (let i = 1; i <= 3; i++)
    await page.getByRole('button', { name: `Lưu vào ô ${i}`, exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất tệp lưu', exact: true }).click();
  const file = (await (await downloading).path())!;
  const { readFile } = await import('node:fs/promises');
  expect(canonical(parseSave(await readFile(file, 'utf8')).run)).toBe(canonical(saved));
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  expect(canonical(await readGuestRun(page))).toBe(canonical(saved));
  return {
    status: 'VERIFIED PASS',
    program: 'korean',
    years: saved.academics!.studies[0].completedYears,
    viewport: page.viewportSize(),
  };
}

export async function universityRecovery(page: Page, url: string) {
  await page.goto(url);
  let rejected: GameRun | undefined;
  for (let i = 0; i < 100; i++) {
    const before = academicApplicant(i);
    const after = dispatch(before, {
      type: 'academic',
      operation: 'apply',
      program: 'business',
      expected: before.actions.length,
    });
    if (after.academics!.applications[0].result === 'rejected') {
      rejected = before;
      break;
    }
  }
  expect(rejected).toBeTruthy();
  await importStudent(page, rejected!);
  await page.getByRole('button', { name: 'Nghề nghiệp', exact: true }).click();
  await page.getByLabel('Tìm ngành', { exact: true }).fill('Quản trị');
  const rejectedCard = page.locator('[data-program="business"]');
  await rejectedCard.getByRole('button', { name: 'Nộp hồ sơ', exact: true }).click();
  await expect(page.locator('.academic-result')).toContainText('Chưa được nhận');
  await expect(rejectedCard).toContainText('6 tháng');
  await expect(rejectedCard.getByRole('button', { name: 'Nộp hồ sơ', exact: true })).toBeDisabled();
  expect(
    (await readGuestRun(page)).finance.transactions.some((t) => t.id.endsWith(':tuition')),
  ).toBe(false);

  const admitted = admittedStudent('it').run;
  await importStudent(page, admitted);
  await page.getByRole('button', { name: 'Nghề nghiệp', exact: true }).click();
  await page.getByRole('button', { name: 'Bảo lưu', exact: true }).click();
  await expect(page.getByTestId('current-study')).toContainText('Đang bảo lưu');
  await page.getByRole('button', { name: 'Trở lại học', exact: true }).click();
  await expect(page.getByTestId('current-study')).toContainText('Đang học');
  expect(canonical((await readGuestRun(page)).finance)).toBe(canonical(admitted.finance));
  await page.locator('.academic-catalog > summary').click();
  await page.getByLabel('Tìm ngành', { exact: true }).fill('Thiết kế');
  const oldCount = (await readGuestRun(page)).academics!.applications.length;
  await page
    .locator('[data-program="design"]')
    .getByRole('button', { name: 'Nộp hồ sơ chuyển ngành', exact: true })
    .click();
  await expect
    .poll(async () => (await readGuestRun(page)).academics!.applications.length)
    .toBe(oldCount + 1);
  const switched = await readGuestRun(page);
  expect(switched.academics!.studies[0].programId).toBe('it');
  expect(switched.academics!.studies[0].status).toBe(
    switched.academics!.applications.at(-1)!.result === 'accepted' ? 'switched' : 'studying',
  );
  await page.getByRole('button', { name: 'Nghỉ chương trình', exact: true }).click();
  await expect(page.getByTestId('current-study')).toHaveCount(0);
  const dropped = await readGuestRun(page);
  expect(dropped.academics!.studies.at(-1)!.status).toBe('dropped');
  expect(dropped.academics!.qualifications).toHaveLength(0);
  expect(canonical(parseSave(JSON.stringify(snapshot(dropped))).run)).toBe(canonical(dropped));
  return {
    status: 'VERIFIED PASS',
    rejection: true,
    cooldown: true,
    pauseResume: true,
    switching: true,
    dropout: true,
  };
}
