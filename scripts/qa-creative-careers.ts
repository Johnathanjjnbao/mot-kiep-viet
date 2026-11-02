import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { creativeChannel, creativeStep } from './creative-fixture';
import {
  readGuestRun,
  assertDecisionViewport,
  clickChoiceWithoutDocumentScroll,
} from './decision-viewport.mjs';
import { importStudent } from './qa-university';
import { activeDefinition, replay } from '../src/engine/engine';
import { storyAction, decisionKey } from '../src/application/story-flow';
import { canonical } from '../src/persistence/saves';
import { creatorReason } from '../src/engine/creator-economy';
import {
  creativeReason,
  gamingContestReason,
  collaborationReason,
  currentCollaboration,
} from '../src/engine/creative-careers';
export async function creativeDecision(page: Page) {
  const r = await readGuestRun(page),
    e = activeDefinition(r)!;
  await assertDecisionViewport(page);
  const a = creativeStep(r).actions.at(-1)!;
  if (a.type !== 'choose') throw Error('Missing creative decision');
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
  await expect(page.locator('.panel-page').first()).toBeVisible();
  const entry = page.getByRole('button', { name: 'Kênh sáng tạo của bạn', exact: true });
  if (await entry.isVisible()) await entry.click();
  await expect(page.locator('.creator-economy-panel')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function clear(page: Page) {
  let r = await readGuestRun(page);
  for (let i = 0; i < 16 && creativeReason(r); i++) {
    await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
    r = await creativeDecision(page);
  }
  expect(creativeReason(r)).toBeNull();
  await panel(page);
  return r;
}
export async function creativeCareerJourney(page: Page, url: string, prefix: string) {
  await page.goto(url);
  const initial = creativeChannel();
  await importStudent(page, initial);
  await panel(page);
  const c = page.locator('[data-channel="creator:0"]'),
    g = page.getByTestId('gaming-career');
  await c.getByLabel('Điều muốn chăm hơn', { exact: true }).selectOption('community');
  await c.getByRole('button', { name: 'Giữ cách làm này', exact: true }).click();
  await g.getByRole('button', { name: 'Theo nghề gaming trên kênh này', exact: true }).dblclick();
  await expect(g.getByTestId('gaming-status')).toHaveText('Đang theo nghề');
  let r = await readGuestRun(page);
  expect(r.creator!.channels).toHaveLength(1);
  expect(r.creator!.channels[0].audience).toBe(initial.creator!.channels[0].audience);
  await g.getByLabel('Nhịp nghề gaming', { exact: true }).selectOption('community');
  await g.getByRole('button', { name: 'Giữ nhịp gaming', exact: true }).click();
  r = await readGuestRun(page);
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  for (let i = 0; i < 16 && gamingContestReason(r); i++) r = await creativeDecision(page);
  expect(gamingContestReason(r)).toBeNull();
  await clear(page);
  await g.getByRole('button', { name: 'Đăng ký kỳ thi đấu', exact: true }).dblclick();
  await expect.poll(async () => (await readGuestRun(page)).creative!.gaming!.rounds.length).toBe(1);
  const fee = (await readGuestRun(page)).creative!.gaming!.totals.entries;
  expect(fee).toBe(2400000);
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  r = await readGuestRun(page);
  for (let i = 0; i < 8 && r.creative!.gaming!.rounds[0].result === 'pending'; i++)
    r = await creativeDecision(page);
  const round = r.creative!.gaming!.rounds[0];
  expect(round.result).not.toBe('pending');
  expect(r.finance.transactions.filter((t) => t.id === round.id + ':prize')).toHaveLength(
    round.prize ? 1 : 0,
  );
  r = await clear(page);
  await page.screenshot({ path: `docs/evidence/${prefix}-gaming.png`, fullPage: true });
  for (let i = 0; i < 12 && collaborationReason(r, r.creator!.channels[0], 'club-host'); i++) {
    await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
    r = await creativeDecision(page);
  }
  expect(collaborationReason(r, r.creator!.channels[0], 'club-host')).toBeNull();
  await panel(page);
  await c.getByLabel('Người muốn cùng làm', { exact: true }).selectOption('club-host');
  await c.getByRole('button', { name: 'Gửi lời hỏi hợp tác', exact: true }).dblclick();
  await expect.poll(async () => (await readGuestRun(page)).creative!.collaborations.length).toBe(1);
  const x = page.locator('[data-collab="collab:0"]');
  await x.getByLabel('Điều kiện hợp tác', { exact: true }).selectOption('balanced');
  await x.getByRole('button', { name: 'Gửi điều kiện hợp tác', exact: true }).click();
  r = await readGuestRun(page);
  if (currentCollaboration(r)?.status === 'offered') {
    await x.getByRole('button', { name: 'Nhận lịch làm chung', exact: true }).click();
    await expect(x.getByTestId('collab-status')).toHaveText('Đang làm chung');
    await page.screenshot({
      path: `docs/evidence/${prefix}-collaboration-working.png`,
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
    r = await readGuestRun(page);
    for (let i = 0; i < 10 && currentCollaboration(r); i++) r = await creativeDecision(page);
  }
  const result = r.creative!.collaborations[0];
  expect(['settled', 'rejected']).toContain(result.status);
  expect(
    r.finance.transactions.filter((t) => t.id.startsWith('collab:')).every((t) => t.cash < 0),
  ).toBe(true);
  expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
  await panel(page);
  await page.screenshot({
    path: `docs/evidence/${prefix}-collaboration-result.png`,
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const saved = await readGuestRun(page);
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(saved));
  await panel(page);
  // A pending authored scene must be resolved before changing the original channel.
  if (creatorReason(saved))
    expect(
      await c.getByRole('button', { name: 'Giữ cách làm này', exact: true }).isDisabled(),
    ).toBe(true);
  return {
    round,
    collaboration: result,
    gaming: saved.creative!.gaming,
    actions: saved.actions.length,
  };
}
