import { test, expect } from '@playwright/test';
import { readGuestRun } from '../../scripts/decision-viewport.mjs';
test('region defaults follow selection while edited birthplace/environment survive preview and birth', async ({
  page,
  baseURL,
}) => {
  await page.goto(baseURL!);
  await page.getByRole('button', { name: 'Bắt đầu một kiếp mới', exact: true }).click();
  await page.getByRole('button', { name: 'Tự chọn bối cảnh', exact: true }).click();
  await page.getByRole('radio', { name: /Một con hẻm phương Nam/ }).check();
  await expect(page.getByLabel('Địa danh cụ thể')).toHaveValue('Một con hẻm phương Nam');
  await expect(page.getByLabel('Môi trường sống')).toHaveValue('urban');
  await page.getByRole('radio', { name: /Một xóm nhỏ ven biển/ }).check();
  await expect(page.getByLabel('Địa danh cụ thể')).toHaveValue('Một xóm nhỏ ven biển');
  await expect(page.getByLabel('Môi trường sống')).toHaveValue('rural');
  await page.getByLabel('Địa danh cụ thể').fill('Xóm Mới, quê mình');
  await page.getByLabel('Môi trường sống').selectOption('urban');
  await page.getByRole('radio', { name: /Một làng quê Bắc Bộ/ }).check();
  await expect(page.getByLabel('Địa danh cụ thể')).toHaveValue('Xóm Mới, quê mình');
  await expect(page.getByLabel('Môi trường sống')).toHaveValue('urban');
  await page.getByRole('button', { name: 'Xem trước cuộc đời', exact: true }).click();
  await page.getByRole('button', { name: 'Sửa trước khi bắt đầu', exact: true }).click();
  await expect(page.getByLabel('Địa danh cụ thể')).toHaveValue('Xóm Mới, quê mình');
  await expect(page.getByLabel('Môi trường sống')).toHaveValue('urban');
  await page.getByRole('button', { name: 'Xem trước cuộc đời', exact: true }).click();
  await page.getByRole('button', { name: 'Bắt đầu với nhân vật này', exact: true }).click();
  await expect(page.locator('.birth-location')).toContainText('Xóm Mới, quê mình');
  await page.getByRole('button', { name: 'Bắt đầu câu chuyện', exact: true }).click();
  await expect
    .poll(async () => {
      const r = await readGuestRun(page);
      return {
        region: r.setup.region,
        birthplace: r.setup.birthplace,
        environment: r.setup.environment,
      };
    })
    .toEqual({ region: 'northern-village', birthplace: 'Xóm Mới, quê mình', environment: 'urban' });
});
