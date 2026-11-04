import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { assetsAdult, assetsFunded, assetAction, assetsStep } from './living-assets-fixture';
import { createRun, replay, activeDefinition, choiceReason } from '../src/engine/engine';
import { assetsGoldenRuns } from './assets-golden-fixture';
import { parseHistory } from '../src/persistence/history';
import { formatMoney } from '../src/domain/currency';
import { totalDebt } from '../src/engine/finance';
import { storyAction, decisionKey } from '../src/application/story-flow';
import { importStudent } from './qa-university';
import { readGuestRun, assertDecisionViewport } from './decision-viewport.mjs';
import { canonical, parseSave } from '../src/persistence/saves';
import type { LivingAssetAction } from '../src/domain/living-assets';
import { PART_SLOTS, type PcParts } from '../src/domain/living-assets';
import { PART_LABELS } from '../src/content/pc-parts';

export async function livingAssetsJourney(page: Page, url: string, prefix: string) {
  page.setDefaultTimeout(15000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  const open = async () => {
    await page.getByRole('button', { name: 'Tài chính', exact: true }).click();
    await page.getByRole('button', { name: 'Mở Đời sống và tài sản', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Đời sống và tài sản', exact: true }),
    ).toBeVisible();
  };
  const perform = async (
    button: ReturnType<Page['getByRole']>,
    command: Omit<LivingAssetAction, 'type' | 'expected'>,
  ) => {
    const before = await readGuestRun(page),
      expected = assetAction(before, command);
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Xác nhận quyết định', exact: true }).click();
    await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(expected));
    await expect(
      page.getByRole('heading', { name: 'Đời sống và tài sản', exact: true }),
    ).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    return expected;
  };
  const rich = assetsFunded(520_000_000);
  await importStudent(page, rich);
  await open();
  await page.getByLabel('Khu vực tìm chỗ ở').selectOption('quiet');
  const home = page.getByTestId('catalog-home-rural');
  await home.getByRole('button', { name: 'Mua và chuyển vào', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('502.522.500');
  await page.getByRole('button', { name: 'Giữ nguyên, quay lại', exact: true }).click();
  expect(canonical(await readGuestRun(page))).toBe(canonical(rich));
  const owned = await perform(
    home.getByRole('button', { name: 'Mua và chuyển vào', exact: true }),
    { operation: 'buy', item: 'home-rural', locality: 'quiet', payment: 'cash' },
  );
  await expect(page.getByTestId('owned-home-rural')).toBeVisible();
  await page.screenshot({ path: `docs/evidence/${prefix}-home.png`, fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  expect(canonical(await readGuestRun(page))).toBe(canonical(owned));
  await open();
  await importStudent(page, rich);
  await open();
  await page.getByRole('button', { name: 'Phương tiện', exact: true }).click();
  await perform(
    page
      .getByTestId('catalog-car-basic')
      .getByRole('button', { name: 'Mua ô tô nhỏ', exact: true }),
    { operation: 'buy', item: 'car-basic', payment: 'cash' },
  );
  await perform(page.getByRole('button', { name: 'Tập sử dụng ô tô', exact: true }), {
    operation: 'train',
    item: 'car',
  });
  await expect(page.getByTestId('owned-car-basic')).toContainText('Đủ điều kiện vận hành');
  await page.screenshot({ path: `docs/evidence/${prefix}-vehicle.png`, fullPage: true });
  await importStudent(page, rich);
  await open();
  await page.getByRole('button', { name: 'Thiết bị', exact: true }).click();
  await perform(
    page
      .getByTestId('catalog-phone-balanced')
      .getByRole('button', { name: 'Mua điện thoại thông minh cân bằng', exact: true }),
    { operation: 'buy', item: 'phone-balanced', payment: 'cash' },
  );
  const phone = (await readGuestRun(page)).livingAssets!.owned[0];
  await perform(page.getByTestId('owned-phone-balanced').getByRole('button', { name: /^Bán ·/ }), {
    operation: 'sell',
    assetId: phone.id,
  });
  await perform(
    page
      .getByTestId('catalog-phone-premium')
      .getByRole('button', { name: 'Mua điện thoại phân khúc cao', exact: true }),
    { operation: 'buy', item: 'phone-premium', payment: 'cash' },
  );
  await page.getByRole('button', { name: 'PC Builder', exact: true }).click();
  await page.getByLabel('Linh kiện RAM', { exact: true }).selectOption('daily-ram');
  await expect(page.getByRole('alert')).toContainText('RAM không đúng thế hệ');
  await expect(
    page.getByRole('button', { name: 'Ráp máy với cấu hình này', exact: true }),
  ).toBeDisabled();
  await page.getByLabel('Linh kiện RAM', { exact: true }).selectOption('balanced-ram');
  const parts = Object.fromEntries(
    await Promise.all(
      PART_SLOTS.map(async (slot) => [
        slot,
        await page.getByLabel('Linh kiện ' + PART_LABELS[slot], { exact: true }).inputValue(),
      ]),
    ),
  ) as PcParts;
  await perform(page.getByRole('button', { name: 'Ráp máy với cấu hình này', exact: true }), {
    operation: 'build',
    parts,
    payment: 'cash',
  });
  await expect(page.getByTestId('owned-pc-custom')).toBeVisible();
  const pcId = (await readGuestRun(page)).livingAssets!.owned.find((a) => a.category === 'pc')!.id;
  await page.getByText('Thay linh kiện trong máy', { exact: true }).click();
  for (const [slot, item] of [
    ['case', 'roomy-case'],
    ['psu', 'strong-psu'],
    ['gpu', 'balanced-gpu-pro'],
  ] as const) {
    await page.getByRole('combobox', { name: 'Vị trí cần thay', exact: true }).selectOption(slot);
    await page
      .getByRole('combobox', { name: 'Linh kiện thay thế', exact: true })
      .selectOption(item);
    await perform(page.getByRole('button', { name: 'Thay linh kiện đã chọn', exact: true }), {
      operation: 'upgrade',
      assetId: pcId,
      slot,
      item,
    });
  }
  await page.screenshot({ path: `docs/evidence/${prefix}-pc.png`, fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const saved = await readGuestRun(page);
  await page.getByRole('button', { name: 'Lưu và tải game', exact: true }).click();
  for (let slot = 1; slot <= 3; slot++)
    await page.getByRole('button', { name: `Lưu vào ô ${slot}`, exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất tệp lưu', exact: true }).click();
  const path = await (await download).path();
  expect(canonical(parseSave(await readFile(path!, 'utf8')).run)).toBe(canonical(saved));
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  expect(canonical(await readGuestRun(page))).toBe(canonical(saved));
  await importStudent(page, rich);
  await open();
  await page.getByLabel('Khu vực tìm chỗ ở').selectOption('quiet');
  await page.getByTestId('catalog-home-rural').getByRole('combobox').selectOption('loan');
  const financedHome = await perform(
    page
      .getByTestId('catalog-home-rural')
      .getByRole('button', { name: 'Mua và chuyển vào', exact: true }),
    { operation: 'buy', item: 'home-rural', locality: 'quiet', payment: 'loan' },
  );
  expect(financedHome.livingAssets!.loans[0].principal).toBe(348_075_000);
  await importStudent(page, rich);
  await open();
  await page.getByRole('button', { name: 'PC Builder', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Thanh toán máy tính', exact: true })
    .selectOption('loan');
  const financedPc = await perform(
    page.getByRole('button', { name: 'Ráp máy với cấu hình này', exact: true }),
    { operation: 'build', parts, payment: 'loan' },
  );
  expect(financedPc.livingAssets!.loans[0].principal).toBe(8_650_000);
  await importStudent(page, assetsAdult());
  await open();
  await perform(
    page
      .getByTestId('catalog-rent-room')
      .getByRole('button', { name: 'Thuê và chuyển tới', exact: true }),
    { operation: 'rent', item: 'rent-room', locality: 'connected' },
  );
  let early = createRun('assets-before-pc', {
    cohort: 1975,
    region: 'northern-village',
    wealth: 4,
    lifeRules: 'assets-v1',
    currency: 'vnd-v1',
  });
  while (early.month < 216 && early.status !== 'ended') early = assetsStep(early);
  expect(early.world.year).toBe(1993);
  await importStudent(page, early);
  await open();
  await page.getByRole('button', { name: 'PC Builder', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Chưa có máy tự ráp trong bối cảnh này', exact: true }),
  ).toBeVisible();
  expect(
    await page.getByRole('button', { name: 'Ráp máy với cấu hình này', exact: true }).count(),
  ).toBe(0);
  expect(errors).toEqual([]);
  return {
    status: 'VERIFIED PASS',
    rental: true,
    homeCash: true,
    cancelUnchanged: true,
    vehicleAndTraining: true,
    deviceReplacement: true,
    pcCompatibility: true,
    pcPurchase: true,
    pcUpgrade: true,
    mortgage: true,
    pcFinancing: true,
    earlyEraNoAnachronism: true,
    saveSlots: 3,
    exportImport: true,
    reload: true,
    keyboardFocus: true,
    axeViolations: 0,
    errors,
  };
}

export async function livingAssetsHistoryJourney(page: Page, url: string, prefix: string) {
  page.setDefaultTimeout(15000);
  await page.goto(url);
  const all = assetsGoldenRuns(),
    targets = [all['long-life'], all['outstanding-death']];
  for (const [index, ended] of targets.entries()) {
    const before = replay(ended.seed, ended.setup, ended.actions.slice(0, -1));
    await importStudent(page, before, 15000);
    await page.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
    const event = activeDefinition(before);
    const action = event
      ? {
          type: 'choose' as const,
          eventId: event.id,
          choiceId: event.choices.find((c) => !choiceReason(before, c))!.id,
        }
      : { type: 'advance' as const };
    const expected = storyAction(before, action, event ? decisionKey(before) : undefined);
    expect(expected.status).toBe('ended');
    if (event)
      await page
        .locator(`[data-choice-id="${action.type === 'choose' ? action.choiceId : ''}"]`)
        .click();
    else await page.getByTestId('advance-life').click();
    await expect
      .poll(async () => canonical(await readGuestRun(page)), { timeout: 20000 })
      .toBe(canonical(expected));
    await expect(page.locator('.summary-card .fine-print')).toContainText(
      'Còn nợ: ' + formatMoney(totalDebt(expected), expected),
    );
    await page.getByRole('button', { name: 'Lịch sử cuộc đời', exact: true }).click();
    await expect(page.locator('.history-grid article')).toHaveCount(index + 1, { timeout: 20000 });
    await page
      .locator('.history-grid article')
      .filter({ hasText: `${Math.floor(expected.month / 12)} tuổi` })
      .getByRole('button', { name: 'Đọc cuộc đời này', exact: true })
      .click();
    await expect(page.locator('.history-reading .summary-card .fine-print')).toContainText(
      'Còn nợ: ' + formatMoney(totalDebt(expected), expected),
    );
    await page
      .locator('.history-reading')
      .getByRole('button', { name: 'Đọc lại nhật ký', exact: true })
      .click();
    await expect(page.locator('.history-reading')).toContainText('Nhật ký');
    await page.screenshot({ path: `docs/evidence/${prefix}-history-${index}.png`, fullPage: true });
  }
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất toàn bộ lịch sử', exact: true }).click();
  const path = await (await download).path(),
    records = parseHistory(await readFile(path!, 'utf8'));
  expect(records).toHaveLength(2);
  for (const r of targets)
    expect(records.some((x) => canonical(x.save.run) === canonical(r))).toBe(true);
  await importStudent(page, assetsAdult(), 15000);
  await page.getByRole('button', { name: 'Lịch sử cuộc đời', exact: true }).click();
  await expect(page.locator('.history-grid article')).toHaveCount(2, { timeout: 20000 });
  return {
    status: 'VERIFIED PASS',
    naturalEndAges: targets.map((r) => r.month / 12),
    outstandingAssetLoan: all['outstanding-death'].livingAssets!.loans[0].principal,
    historyRecords: 2,
    exportCanonical: true,
    newAutosavePreservedHistory: true,
  };
}
export async function livingAssetsNewLifeJourney(
  page: Page,
  url: string,
  seed = 'assets-browser-default',
) {
  page.setDefaultTimeout(15000);
  await page.goto(url);
  await page.getByRole('button', { name: 'Bắt đầu một kiếp mới', exact: true }).click();
  await page.getByRole('button', { name: 'Tự chọn bối cảnh', exact: true }).click();
  await page.getByRole('radio', { name: /1995/ }).check();
  await page.getByRole('radio', { name: /Một làng quê Bắc Bộ/ }).check();
  await page.getByText('Một hạt giống để gặp lại cuộc đời này', { exact: true }).click();
  await page.getByLabel('Hạt giống (tùy chọn)', { exact: true }).fill(seed);
  await page.getByRole('button', { name: 'Xem trước cuộc đời', exact: true }).click();
  await page.getByRole('button', { name: 'Bắt đầu với nhân vật này', exact: true }).click();
  await page.getByRole('button', { name: 'Bắt đầu câu chuyện', exact: true }).click();
  await expect(page.getByTestId('event-choice').first()).toBeVisible();
  let r = await readGuestRun(page);
  expect(r.setup.lifeRules).toBe('assets-v1');
  expect(r.livingAssets!.owned).toHaveLength(0);
  for (let i = 0; i < 2; i++) {
    await assertDecisionViewport(page);
    const e = activeDefinition(r)!,
      c = e.choices.find((c) => !choiceReason(r, c))!;
    const next = storyAction(r, { type: 'choose', eventId: e.id, choiceId: c.id }, decisionKey(r));
    await page.getByTestId('event-choice').first().click();
    await expect
      .poll(async () => canonical(await readGuestRun(page)) === canonical(next))
      .toBe(true);
    r = next;
  }
  return {
    status: 'VERIFIED PASS',
    newDefault: 'assets-v1',
    birthToAge: r.month / 12,
    decisions: 2,
    minorOwnedAssets: r.livingAssets!.owned.length,
  };
}
