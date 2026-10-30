import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { familyStart, familyBirth, growFamily } from '../../scripts/family-fixture';
import { toAge } from '../../scripts/social-fixture';
import { snapshot } from '../../src/persistence/saves';
import { readGuestRun } from '../../scripts/decision-viewport.mjs';
test('one tap records parenting once and the family panel preserves children and parents on reload', async ({
  page,
}) => {
  const run = toAge(familyStart(), 21);
  await page.goto('./');
  await page.getByRole('button', { name: 'Lưu và tải game' }).click();
  await page
    .getByLabel('Chọn tệp game đã lưu')
    .setInputFiles({
      name: 'family.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(snapshot(run))),
    });
  await expect(page.locator('.story-text')).not.toContainText('{child}');
  const count = run.actions.length;
  await page.getByTestId('event-choice').first().dblclick();
  await expect
    .poll(async () => (await readGuestRun(page)).family?.children[0].patterns.balanced)
    .toBe(1);
  expect((await readGuestRun(page)).family!.children).toHaveLength(1);
  expect((await readGuestRun(page)).actions.length).toBeLessThanOrEqual(count + 2);
  await page.getByRole('button', { name: 'Người thân', exact: true }).click();
  await expect(page.locator('[data-family-child]')).toHaveCount(1);
  await expect(page.locator('[data-family-child]')).toContainText('Cha mẹ được ghi nhận');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: `docs/evidence/family-${test.info().project.name}.png`,
    fullPage: true,
  });
  const saved = await readGuestRun(page);
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  expect((await readGuestRun(page)).family).toEqual(saved.family);
});
test('adult child career and accumulated parenting memories remain readable in the interface', async ({
  page,
}) => {
  const run = growFamily(familyBirth(), 44);
  await page.goto('./');
  await page.getByRole('button', { name: 'Lưu và tải game' }).click();
  await page
    .getByLabel('Chọn tệp game đã lưu')
    .setInputFiles({
      name: 'adult-child.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(snapshot(run))),
    });
  await page.getByRole('button', { name: 'Người thân', exact: true }).click();
  const card = page.locator('[data-family-child]').first();
  await expect(card).toContainText('Trưởng thành');
  await expect(card).toContainText(run.family!.children[0].occupation!);
  await card.locator('summary').click();
  await expect(card).toContainText('Tự chọn hướng');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
