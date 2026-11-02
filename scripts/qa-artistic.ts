import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { freelanceAdult } from './freelance-fixture';
import { artisticStep, artisticOffer, artisticReady } from './artistic-fixture';
import {
  readGuestRun,
  assertDecisionViewport,
  clickChoiceWithoutDocumentScroll,
} from './decision-viewport.mjs';
import { importStudent } from './qa-university';
import { activeDefinition, replay } from '../src/engine/engine';
import { storyAction, decisionKey } from '../src/application/story-flow';
import { canonical, parseSave } from '../src/persistence/saves';
import { artisticReason, artisticReadiness } from '../src/engine/artistic';
export async function artisticDecision(page: Page) {
  const r = await readGuestRun(page),
    e = activeDefinition(r)!;
  await assertDecisionViewport(page);
  const a = artisticStep(r).actions.at(-1)!;
  if (a.type !== 'choose') throw Error('Missing artistic decision');
  const expected = storyAction(r, a, decisionKey(r));
  await clickChoiceWithoutDocumentScroll(
    page,
    e.choices.findIndex((c) => c.id === a.choiceId),
  );
  await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(expected));
  return expected;
}
async function panel(page: Page) {
  await page.getByRole('button', { name: 'Nghề nghiệp', exact: true }).click();
  const entry = page.getByRole('button', { name: 'Biểu diễn và idol', exact: true });
  if (await entry.isVisible()) await entry.click();
  await expect(page.locator('.artistic-panel')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function clear(page: Page) {
  let r = await readGuestRun(page);
  for (let i = 0; i < 12 && artisticReason(r); i++) {
    await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
    r = await artisticDecision(page);
  }
  expect(artisticReason(r)).toBeNull();
  await panel(page);
  return r;
}
export async function artisticJourney(page: Page, url: string, prefix: string) {
  await page.goto(url);
  await importStudent(page, freelanceAdult('native-stage-0'));
  await panel(page);
  const before = (await readGuestRun(page)).finance.cash;
  await page
    .locator('[data-discipline="music"]')
    .getByRole('button', { name: 'Bắt đầu học nghề', exact: true })
    .dblclick();
  const profile = page.getByTestId('artistic-profile');
  await expect(profile.getByTestId('artist-status')).toHaveText('Đang học và tập');
  let r = await readGuestRun(page);
  expect(r.finance.cash).toBe(before - 3000000);
  expect(r.creative!.artist!.fans).toBe(0);
  expect(r.creative!.artist!.totals.received).toBe(0);
  await page.screenshot({ path: `docs/evidence/${prefix}-training.png`, fullPage: true });
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  for (let i = 0; i < 12 && artisticReadiness(r); i++) r = await artisticDecision(page);
  expect(artisticReadiness(r)).toBeNull();
  await clear(page);
  await profile.getByLabel('Điều kiện muốn thử', { exact: true }).selectOption('fast-track');
  await profile.getByRole('button', { name: 'Gửi tiết mục audition', exact: true }).dblclick();
  await expect
    .poll(async () => (await readGuestRun(page)).creative!.artist!.auditions.length)
    .toBe(1);
  await expect(profile.getByTestId('artist-status')).toHaveText('Đang chờ lượt xét');
  expect((await readGuestRun(page)).creative!.artist!.totals.received).toBe(0);
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  r = await readGuestRun(page);
  for (let i = 0; i < 8 && r.creative!.artist!.auditions[0].result === 'pending'; i++)
    r = await artisticDecision(page);
  const auditionOutcome = r.creative!.artist!.auditions[0].result;
  if (auditionOutcome !== 'offered') await importStudent(page, artisticOffer('offered'));
  await panel(page);
  await expect(profile.getByTestId('artist-status')).toHaveText('Có đề nghị cần trả lời');
  await page.screenshot({ path: `docs/evidence/${prefix}-offer.png`, fullPage: true });
  await profile.getByRole('button', { name: 'Nhận lịch với tổ chức', exact: true }).click();
  expect((await readGuestRun(page)).creative!.artist!.management).toBe('agency');
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  r = await readGuestRun(page);
  for (let i = 0; i < 18 && r.creative!.artist!.totals.received === 0; i++)
    r = await artisticDecision(page);
  expect(r.creative!.artist!.showCount).toBeGreaterThan(0);
  expect(r.creative!.artist!.totals.received).toBeGreaterThan(0);
  const p = r.creative!.artist!;
  expect(p.totals.gross).toBe(p.totals.received + p.totals.agencyCut);
  expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
  await clear(page);
  await page.screenshot({ path: `docs/evidence/${prefix}-shows.png`, fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
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
  await panel(page);
  await profile
    .getByRole('button', { name: 'Tính chuyện khép lịch biểu diễn', exact: true })
    .click();
  await profile.getByRole('button', { name: 'Xác nhận khép lịch biểu diễn', exact: true }).click();
  await expect(profile.getByTestId('artist-status')).toHaveText('Đã khép lịch biểu diễn');
  await profile.getByRole('button', { name: 'Xét một lần trở lại', exact: true }).click();
  r = await readGuestRun(page);
  expect(r.creative!.artist!.comebackUsed).toBe(true);
  expect(r.creative!.artist!.totals.comeback).toBe(1000000);
  expect(artisticReadiness(r)).not.toBeNull();
  await page.screenshot({ path: `docs/evidence/${prefix}-comeback.png`, fullPage: true });
  const rejected = artisticOffer('rejected');
  await importStudent(page, artisticReady(rejected.seed));
  await panel(page);
  await profile.getByLabel('Điều kiện muốn thử', { exact: true }).selectOption('fast-track');
  await profile.getByRole('button', { name: 'Gửi tiết mục audition', exact: true }).click();
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  r = await readGuestRun(page);
  for (let i = 0; i < 8 && r.creative!.artist!.auditions[0].result === 'pending'; i++)
    r = await artisticDecision(page);
  expect(r.creative!.artist!.auditions[0].result).toBe('rejected');
  expect(r.creative!.artist!.totals.received).toBe(0);
  expect(r.creative!.artist!.fans).toBe(0);
  await panel(page);
  await page.screenshot({ path: `docs/evidence/${prefix}-rejected.png`, fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  return {
    auditionOutcome,
    received: saved.creative!.artist!.totals.received,
    share: saved.creative!.artist!.totals.agencyCut,
    shows: saved.creative!.artist!.showCount,
    rejected: r.creative!.artist!.auditions[0].result,
  };
}
