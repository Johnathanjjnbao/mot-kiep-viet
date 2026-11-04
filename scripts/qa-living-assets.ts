import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { assetsAdult, assetsFunded, assetAction } from './living-assets-fixture';
import { importStudent } from './qa-university';
import { readGuestRun } from './decision-viewport.mjs';
import { canonical, parseSave } from '../src/persistence/saves';
import type { LivingAssetAction } from '../src/domain/living-assets';
import { PART_SLOTS, type PcParts } from '../src/domain/living-assets';
import { PART_LABELS } from '../src/content/pc-parts';

export async function livingAssetsJourney(page: Page, url: string, prefix: string) {
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
  await importStudent(page, assetsAdult());
  await open();
  await perform(
    page
      .getByTestId('catalog-rent-room')
      .getByRole('button', { name: 'Thuê và chuyển tới', exact: true }),
    { operation: 'rent', item: 'rent-room', locality: 'connected' },
  );
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
    saveSlots: 3,
    exportImport: true,
    reload: true,
    keyboardFocus: true,
    axeViolations: 0,
    errors,
  };
}
