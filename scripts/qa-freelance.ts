import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { freelanceAdult, freelanceCase, freelanceStep } from './freelance-fixture';
import {
  readGuestRun,
  assertDecisionViewport,
  clickChoiceWithoutDocumentScroll,
} from './decision-viewport.mjs';
import { importStudent } from './qa-university';
import { currentProject } from '../src/engine/freelance';
import { activeDefinition, replay } from '../src/engine/engine';
import { storyAction, decisionKey } from '../src/application/story-flow';
import { canonical, parseSave } from '../src/persistence/saves';

export async function freelanceDecision(page: Page) {
  const r = await readGuestRun(page),
    e = activeDefinition(r)!;
  await assertDecisionViewport(page);
  const choice = freelanceStep(r).actions.at(-1)!;
  if (choice.type !== 'choose') throw Error('Missing native story choice');
  const expected = storyAction(r, choice, decisionKey(r));
  await clickChoiceWithoutDocumentScroll(
    page,
    e.choices.findIndex((c) => c.id === choice.choiceId),
  );
  await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(expected));
  return expected;
}
async function panel(page: Page) {
  await page.getByRole('button', { name: 'Nghề nghiệp', exact: true }).click();
  const entry = page.getByRole('button', { name: 'Dự án khách hàng', exact: true });
  if (await entry.isVisible()) await entry.click();
  await expect(page.locator('.freelance-panel')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
export async function freelanceJourney(page: Page, url: string, prefix: string) {
  await page.goto(url);
  const paidCase = freelanceCase('paid');
  await importStudent(page, freelanceAdult(paidCase.seed));
  await panel(page);
  const start = await readGuestRun(page),
    ownedCash = start.finance.cash;
  await page
    .locator('[data-service="writing"]')
    .getByRole('button', { name: 'Hỏi về dự án', exact: true })
    .dblclick();
  await expect.poll(async () => (await readGuestRun(page)).freelance!.projects.length).toBe(1);
  expect((await readGuestRun(page)).finance.cash).toBe(ownedCash - 400000);
  const p = page.locator('[data-project="freelance:0"]');
  await p.getByLabel('Phạm vi và mức phí đề nghị', { exact: true }).selectOption('modest');
  await p.getByRole('button', { name: 'Gửi đề nghị', exact: true }).click();
  await expect(p.getByTestId('project-status')).toHaveText('Đề nghị đã được chọn');
  expect((await readGuestRun(page)).freelance!.projects[0].totals.received).toBe(0);
  await p.getByRole('button', { name: 'Nhận hợp đồng', exact: true }).click();
  await p.getByLabel('Nhịp làm dự án', { exact: true }).selectOption('careful');
  await p.getByRole('button', { name: 'Giữ nhịp này', exact: true }).click();
  await page.screenshot({ path: `docs/evidence/${prefix}-working.png`, fullPage: true });
  let r = await readGuestRun(page);
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  for (let i = 0; i < 12 && currentProject(r)?.status !== 'ready'; i++)
    r = await freelanceDecision(page);
  expect(currentProject(r)?.status).toBe('ready');
  await panel(page);
  await p.getByRole('button', { name: 'Giao bản cho khách soát', exact: true }).click();
  await expect(p.getByTestId('project-status')).toHaveText('Khách đang soát');
  expect((await readGuestRun(page)).freelance!.projects[0].totals.received).toBe(0);
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  r = await readGuestRun(page);
  for (let i = 0; i < 24 && currentProject(r); i++) r = await freelanceDecision(page);
  expect(r.freelance!.projects[0].ending).toBe('paid');
  expect(r.finance.transactions.filter((t) => t.id === 'freelance:0:payout')).toHaveLength(1);
  expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
  await panel(page);
  await expect(p.getByTestId('project-received')).not.toHaveText('0 ₫');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `docs/evidence/${prefix}-paid.png`, fullPage: true });
  const saved = await readGuestRun(page);
  await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
  for (let i = 1; i <= 3; i++) {
    await page.getByRole('button', { name: `Lưu vào ô ${i}`, exact: true }).click();
    await expect(page.getByText('Đã lưu vào ô bạn chọn.')).toBeVisible();
  }
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất tệp lưu', exact: true }).click();
  const data = await readFile((await (await downloading).path())!, 'utf8');
  expect(parseSave(data).run).toEqual(saved);
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(saved));
  for (let i = 1; i <= 3; i++) {
    await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
    await page
      .locator('.save-slot')
      .nth(i - 1)
      .getByRole('button', { name: 'Tải lại', exact: true })
      .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(saved));
  }
  await importStudent(page, parseSave(data).run);
  await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(saved));

  const rejected = freelanceCase('rejected');
  await importStudent(page, freelanceAdult(rejected.seed));
  await panel(page);
  await page
    .locator('[data-service="writing"]')
    .getByRole('button', { name: 'Hỏi về dự án', exact: true })
    .click();
  await p.getByLabel('Phạm vi và mức phí đề nghị', { exact: true }).selectOption('modest');
  await p.getByRole('button', { name: 'Gửi đề nghị', exact: true }).click();
  await expect(p).toContainText('Khách không chọn đề nghị');
  r = await readGuestRun(page);
  expect(r.freelance!.projects[0].totals.received).toBe(0);
  expect(r.freelance!.projects[0].totals.cost).toBe(400000);
  await page.screenshot({ path: `docs/evidence/${prefix}-rejected.png`, fullPage: true });

  await importStudent(page, freelanceCase('rework'));
  await panel(page);
  await expect(p).toContainText('Cần một vòng sửa');
  const cost = (await readGuestRun(page)).freelance!.projects[0].totals.cost;
  await page.screenshot({ path: `docs/evidence/${prefix}-rework.png`, fullPage: true });
  await p.getByRole('button', { name: 'Thỏa thuận phần phí 60%', exact: true }).click();
  await expect(p.getByTestId('project-status')).toHaveText('Chờ thanh toán');
  expect((await readGuestRun(page)).freelance!.projects[0].totals.received).toBe(0);
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  r = await readGuestRun(page);
  for (let i = 0; i < 8 && currentProject(r); i++) r = await freelanceDecision(page);
  const end = r.freelance!.projects[0];
  expect(end.ending).toBe('partial');
  expect(end.totals.received).toBe(Math.floor(end.fee * 0.6));
  expect(end.totals.cost).toBe(cost);
  expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
  await panel(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  return {
    paid: saved.freelance!.projects[0],
    rejected: rejected.freelance!.projects[0],
    partial: end,
  };
}
