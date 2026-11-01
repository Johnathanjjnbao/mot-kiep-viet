import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { creatorAdult, startChannel, channelYears, creatorStep } from './creator-economy-fixture';
import {
  readGuestRun,
  assertDecisionViewport,
  clickChoiceWithoutDocumentScroll,
} from './decision-viewport.mjs';
import { creatorReason } from '../src/engine/creator-economy';
import { storyAction, decisionKey } from '../src/application/story-flow';
import { activeDefinition, replay } from '../src/engine/engine';
import { canonical, parseSave } from '../src/persistence/saves';
import { importStudent } from './qa-university';
export async function creatorDecision(page: Page) {
  const r = await readGuestRun(page),
    e = activeDefinition(r)!;
  await expect(page.locator('#event-heading')).toBeFocused();
  await assertDecisionViewport(page);
  const choice = creatorStep(r).actions.at(-1)!;
  if (choice.type !== 'choose') throw Error('Missing creator decision');
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
  const entry = page.getByRole('button', { name: 'Kênh sáng tạo của bạn', exact: true });
  if (await entry.isVisible()) await entry.click();
  await expect(page.locator('.creator-economy-panel')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function clear(page: Page) {
  let r = await readGuestRun(page);
  for (let i = 0; i < 12 && creatorReason(r); i++) {
    const story = page.getByRole('button', { name: 'Câu chuyện', exact: true });
    if ((await story.getAttribute('aria-current')) !== 'page') await story.click();
    r = await creatorDecision(page);
  }
  expect(creatorReason(r)).toBeNull();
  await panel(page);
  return r;
}
export async function creatorEconomyJourney(page: Page, url: string, prefix: string) {
  await page.goto(url);
  await page.getByRole('button', { name: 'Bắt đầu một kiếp mới', exact: true }).click();
  await page.getByRole('button', { name: 'Tự chọn bối cảnh', exact: true }).click();
  await page.getByRole('radio', { name: /1995/ }).check();
  await page.getByRole('radio', { name: /Một làng quê Bắc Bộ/ }).check();
  await page.getByLabel('Điều kiện kinh tế gia đình', { exact: true }).selectOption('4');
  await page.getByText('Một hạt giống để gặp lại cuộc đời này').click();
  await page.getByLabel('Hạt giống (tùy chọn)').fill('creator-browser-youtube');
  await page.getByRole('button', { name: 'Xem trước cuộc đời', exact: true }).click();
  await page.getByRole('button', { name: 'Bắt đầu với nhân vật này', exact: true }).click();
  await page.getByRole('button', { name: 'Bắt đầu câu chuyện', exact: true }).click();
  let expected = await readGuestRun(page);
  expect(expected.setup.lifeRules).toBe('creator-v1');
  expect(expected.setup.currency).toBe('vnd-v1');
  for (let i = 0; i < 70 && expected.month < 228; i++) expected = await creatorDecision(page);
  expect(expected.month).toBe(228);
  await panel(page);
  const launch = page.locator('.channel-launch');
  const before = expected.finance.cash,
    active = expected.activeEvent;
  await launch.getByRole('button', { name: 'Bắt đầu kênh', exact: true }).dblclick();
  await expect.poll(async () => (await readGuestRun(page)).creator!.channels.length).toBe(1);
  let r = await readGuestRun(page);
  expect(r.finance.cash).toBe(before - 8_000_000);
  expect(r.activeEvent).toEqual(active);
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  const start = r.month;
  for (let i = 0; i < 20 && r.month < start + 24; i++) r = await creatorDecision(page);
  r = await clear(page);
  expect(r.creator!.channels[0].audience).toBeGreaterThan(0);
  expect(r.creator!.channels[0].totals.cost).toBeGreaterThan(8_000_000);
  const youtube = page.locator('[data-channel="creator:0"]');
  await youtube.getByRole('button', { name: 'Nghỉ làm nội dung', exact: true }).click();
  await expect
    .poll(async () => (await readGuestRun(page)).creator!.channels[0].status)
    .toBe('paused');
  const paused = await readGuestRun(page),
    cost = paused.creator!.channels[0].totals.cost;
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  await creatorDecision(page);
  r = await clear(page);
  expect(r.creator!.channels[0].totals.cost).toBe(cost);
  await youtube.getByRole('button', { name: 'Trở lại làm nội dung', exact: true }).click();
  await expect
    .poll(async () => (await readGuestRun(page)).creator!.channels[0].status)
    .toBe('active');
  const youtubeSaved = await readGuestRun(page);
  expect(replay(youtubeSaved.seed, youtubeSaved.setup, youtubeSaved.actions)).toEqual(youtubeSaved);
  await page.screenshot({ path: `docs/evidence/${prefix}-youtube.png`, fullPage: true });
  expected = channelYears(startChannel(creatorAdult('creator-monetization'), 'tiktok'), 5);
  while (creatorReason(expected) && expected.activeEvent) expected = creatorStep(expected);
  await importStudent(page, expected);
  await panel(page);
  const channel = page.locator('[data-channel="creator:0"]');
  await channel.getByRole('button', { name: /^Nâng thiết bị/ }).click();
  await expect.poll(async () => (await readGuestRun(page)).creator!.channels[0].equipment).toBe(2);
  await channel.getByLabel('Hình thức', { exact: true }).selectOption('live');
  await channel.getByLabel('Chủ đề', { exact: true }).selectOption('gaming');
  await channel.getByLabel('Điều muốn chăm hơn', { exact: true }).selectOption('community');
  await channel.getByRole('button', { name: 'Giữ cách làm này', exact: true }).click();
  await expect
    .poll(async () => (await readGuestRun(page)).creator!.channels[0].policy.format)
    .toBe('live');
  r = await readGuestRun(page);
  expect(r.creator!.channels[0].audience).toBeGreaterThanOrEqual(1000);
  await channel.getByRole('button', { name: 'Gửi xét kiếm tiền', exact: true }).click();
  await expect
    .poll(async () => (await readGuestRun(page)).creator!.channels[0].monetization)
    .toBe('pending');
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  const applied = r.month;
  for (let i = 0; i < 30 && r.month < applied + 24; i++) r = await creatorDecision(page);
  r = await clear(page);
  const c = r.creator!.channels[0];
  expect(c.totals.platformIncome).toBeGreaterThan(0);
  expect(c.recent.some((m) => m.platformIncome === 0)).toBe(true);
  expect(c.recent.some((m) => m.profit < 0)).toBe(true);
  await expect(channel.getByTestId('channel-monetization')).toContainText('Được xét');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `docs/evidence/${prefix}-tiktok-live.png`, fullPage: true });
  const saved = await readGuestRun(page);
  expect(replay(saved.seed, saved.setup, saved.actions)).toEqual(saved);
  await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
  for (let i = 1; i <= 3; i++) {
    await page.getByRole('button', { name: `Lưu vào ô ${i}`, exact: true }).click();
    await expect(page.getByText('Đã lưu vào ô bạn chọn.')).toBeVisible();
  }
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất tệp lưu', exact: true }).click();
  const downloaded = await downloading,
    data = await readFile((await downloaded.path())!, 'utf8');
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
  await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
  await page.getByLabel('Chọn tệp game đã lưu').setInputFiles({
    name: 'creator-roundtrip.json',
    mimeType: 'application/json',
    buffer: Buffer.from(data),
  });
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await panel(page);
  await channel.getByRole('button', { name: 'Tính chuyện khép kênh', exact: true }).click();
  await channel.getByRole('button', { name: 'Xác nhận khép kênh', exact: true }).click();
  await expect
    .poll(async () => (await readGuestRun(page)).creator!.channels[0].status)
    .toBe('closed');
  const final = await readGuestRun(page);
  expect(replay(final.seed, final.setup, final.actions)).toEqual(final);
  const historical = channelYears(creatorAdult('creator-historical', 1975), 2);
  await importStudent(page, historical);
  await panel(page);
  await expect(page.locator('.channel-launch')).toHaveCount(0);
  await expect(page.locator('.creator-economy-panel')).not.toContainText('TikTok');
  return {
    status: 'VERIFIED PASS',
    viewport: page.viewportSize(),
    youtubeVideo: true,
    tiktokLive: true,
    gamingHardware: true,
    audience: c.audience,
    platformIncome: c.totals.platformIncome,
    productionCost: c.totals.cost,
    zeroPayoutMonth: true,
    lossMonth: true,
    pauseResume: true,
    slots: 3,
    reload: true,
    exportImport: true,
    canonical: true,
    closure: true,
    newLifeFromBirth: true,
    historical1995Gate: true,
    axeViolations: 0,
  };
}
