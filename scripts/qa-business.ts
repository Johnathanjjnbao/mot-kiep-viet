import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { activeDefinition, choiceReason, replay } from '../src/engine/engine';
import { healthyChoice } from './annual-fixture';
import {
  readGuestRun,
  assertDecisionViewport,
  clickChoiceWithoutDocumentScroll,
} from './decision-viewport.mjs';
import { canonical, parseSave } from '../src/persistence/saves';
import { storyAction, decisionKey } from '../src/application/story-flow';
import { businessReason } from '../src/engine/business';
import { formatMoney } from '../src/domain/currency';
export async function businessDecision(page: Page) {
  const before = await readGuestRun(page);
  const e = activeDefinition(before)!;
  if (!e) throw Error('Missing business journey scene');
  await assertDecisionViewport(page);
  const safe = e.choices.filter(
    (c) =>
      !choiceReason(before, c) &&
      !c.effects.some((x) => x.kind === 'enterprise' && ['pause', 'close'].includes(x.operation)),
  );
  const c = e.version === 10 ? safe[0] : healthyChoice(before);
  const expected = storyAction(
    before,
    { type: 'choose', eventId: e.id, choiceId: c.id },
    decisionKey(before),
  );
  await clickChoiceWithoutDocumentScroll(
    page,
    e.choices.findIndex((x) => x.id === c.id),
  );
  await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(expected));
  return expected;
}
async function shop(page: Page) {
  await page.getByRole('button', { name: 'Nghề nghiệp', exact: true }).click();
  const open = page.getByRole('button', { name: 'Cửa hàng của bạn', exact: true });
  if (await open.isVisible()) await open.click();
  await expect(page.locator('.enterprise-panel')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function clearBusinessStory(page: Page) {
  let r = await readGuestRun(page);
  for (let i = 0; i < 12 && r.activeEvent?.id.startsWith('biz-'); i++) {
    await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
    r = await businessDecision(page);
  }
  expect(businessReason(r)).toBeNull();
  await shop(page);
  return r;
}
export async function businessJourney(page: Page, url: string, prefix: string) {
  await page.goto(url);
  await expect(page.locator('.footer-version')).toContainText(
    JSON.parse(readFileSync('package.json', 'utf8')).version,
  );
  await page.getByRole('button', { name: 'Bắt đầu một kiếp mới', exact: true }).click();
  await page.getByRole('button', { name: 'Tự chọn bối cảnh', exact: true }).click();
  await page.getByRole('radio', { name: /1995/ }).check();
  await page.getByRole('radio', { name: /Một làng quê Bắc Bộ/ }).check();
  await page.getByLabel('Điều kiện kinh tế gia đình', { exact: true }).selectOption('4');
  await page.getByText('Một hạt giống để gặp lại cuộc đời này').click();
  await page.getByLabel('Hạt giống (tùy chọn)').fill('business-browser');
  await page.getByRole('button', { name: 'Xem trước cuộc đời', exact: true }).click();
  await page.getByRole('button', { name: 'Bắt đầu với nhân vật này', exact: true }).click();
  await page.getByRole('button', { name: 'Bắt đầu câu chuyện', exact: true }).click();
  let r = await readGuestRun(page);
  expect(r.setup.lifeRules).toBe('enterprise-v1');
  expect(r.setup.currency).toBe('vnd-v1');
  for (let i = 0; i < 60 && r.month < 216; i++) r = await businessDecision(page);
  expect(r.month).toBe(216);
  await shop(page);
  const launch = page.locator('.enterprise-launch');
  await launch.getByLabel('Vốn góp ban đầu', { exact: true }).fill('4000000');
  await launch.getByLabel('Mức hàng muốn dự trữ (0–200 món)', { exact: true }).fill('0');
  await launch.getByLabel('Quảng bá có phí mỗi tháng', { exact: true }).check();
  const beforeCash = r.finance.cash,
    beforeEvent = r.activeEvent;
  await launch.getByRole('button', { name: 'Góp vốn mở tiệm', exact: true }).dblclick();
  await expect.poll(async () => (await readGuestRun(page)).enterprise!.ventures.length).toBe(1);
  r = await readGuestRun(page);
  expect(r.finance.cash).toBe(beforeCash - 4000000);
  expect(r.activeEvent).toEqual(beforeEvent);
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  const start = r.month;
  for (let i = 0; i < 20 && r.month < start + 12; i++) r = await businessDecision(page);
  r = await clearBusinessStory(page);
  const b = r.enterprise!.ventures[0];
  expect(b.totals.operating).toBeGreaterThan(0);
  expect(b.totals.revenue - b.totals.cogs - b.totals.operating).toBeLessThan(0);
  expect(b.status).toBe('suspended');
  const card = page.locator('[data-enterprise="enterprise:0"]');
  await expect(card.getByTestId('business-total-profit')).toContainText('-');
  await card.getByLabel('Số tiền chuyển giữa bạn và tiệm', { exact: true }).fill('30000000');
  await card.getByRole('button', { name: 'Góp thêm vốn', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => (await readGuestRun(page)).enterprise!.ventures[0].totals.contributed)
    .toBe(34000000);
  await card.getByLabel('Định giá', { exact: true }).selectOption('balanced');
  await card.getByLabel('Mức hàng muốn dự trữ (0–200 món)', { exact: true }).fill('20');
  await card.getByLabel('Quảng bá có phí mỗi tháng', { exact: true }).uncheck();
  await card.getByRole('button', { name: 'Giữ chính sách này', exact: true }).click();
  await expect
    .poll(async () => (await readGuestRun(page)).enterprise!.ventures[0].policy.reorderTarget)
    .toBe(20);
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  r = await readGuestRun(page);
  const recovery = r.month;
  for (let i = 0; i < 25 && r.month < recovery + 12; i++) r = await businessDecision(page);
  r = await clearBusinessStory(page);
  expect(r.enterprise!.ventures[0].totals.revenue).toBeGreaterThan(0);
  expect(r.enterprise!.ventures[0].recent.some((m) => m.profit > 0)).toBe(true);
  await card.getByLabel('Số tiền chuyển giữa bạn và tiệm', { exact: true }).fill('1000000');
  const cash = r.finance.cash;
  await card.getByRole('button', { name: 'Rút về cá nhân', exact: true }).click();
  await expect.poll(async () => (await readGuestRun(page)).finance.cash).toBe(cash + 1000000);
  await card.getByText('Sổ 12 tháng gần nhất', { exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `docs/evidence/${prefix}-shop.png`, fullPage: true });
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
  const saved = await readGuestRun(page);
  expect(replay(saved.seed, saved.setup, saved.actions)).toEqual(saved);
  await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
  for (let slot = 1; slot <= 3; slot++) {
    await page.getByRole('button', { name: `Lưu vào ô ${slot}`, exact: true }).click();
    await expect(page.getByText('Đã lưu vào ô bạn chọn.')).toBeVisible();
  }
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất tệp lưu', exact: true }).click();
  const downloaded = await downloading;
  const data = await readFile((await downloaded.path())!, 'utf8');
  expect(parseSave(data).run).toEqual(saved);
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(saved));
  for (let slot = 1; slot <= 3; slot++) {
    await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
    await page
      .locator('.save-slot')
      .nth(slot - 1)
      .getByRole('button', { name: 'Tải lại', exact: true })
      .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(saved));
  }
  await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
  await page.getByLabel('Chọn tệp game đã lưu').setInputFiles({
    name: 'business-roundtrip.json',
    mimeType: 'application/json',
    buffer: Buffer.from(data),
  });
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(saved));
  await shop(page);
  await card.getByRole('button', { name: 'Tính chuyện khép tiệm', exact: true }).click();
  const refund =
    saved.enterprise!.ventures[0].cash +
    Math.floor((saved.enterprise!.ventures[0].stock * saved.enterprise!.ventures[0].unitCost) / 2);
  await card.getByRole('button', { name: 'Xác nhận khép tiệm', exact: true }).click();
  await expect
    .poll(async () => (await readGuestRun(page)).enterprise!.ventures[0].status)
    .toBe('closed');
  r = await readGuestRun(page);
  expect(r.finance.cash).toBe(saved.finance.cash + refund);
  expect(r.finance.assets.find((a) => a.id === 'enterprise:0')!.value).toBe(0);
  await launch.getByLabel('Vốn góp ban đầu', { exact: true }).fill('4000000');
  await launch.getByRole('button', { name: 'Góp vốn mở tiệm', exact: true }).click();
  await expect.poll(async () => (await readGuestRun(page)).enterprise!.ventures.length).toBe(2);
  r = await readGuestRun(page);
  expect(r.enterprise!.ventures[1].id).toBe('enterprise:1');
  expect(await page.locator('body').innerText()).not.toContain('đSM');
  await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
  r = await businessDecision(page);
  expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
  const ages = new Set(r.choices.map((c) => Math.floor(c.month / 12)));
  for (let age = 0; age < Math.floor(r.month / 12); age++) expect(ages.has(age)).toBe(true);
  return {
    status: 'VERIFIED PASS',
    viewport: page.viewportSize(),
    startFromBirth: true,
    loss: true,
    recovery: true,
    closure: true,
    slots: 3,
    exportImport: true,
    reload: true,
    canonical: true,
    axeViolations: 0,
    actions: r.actions.length,
    month: r.month,
    cash: formatMoney(r.finance.cash, r),
    ventures: r.enterprise!.ventures.length,
  };
}
