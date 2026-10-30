import { test, expect } from '@playwright/test';
import { readGuestRun } from '../../scripts/decision-viewport.mjs';
test('one identity grows from birth to old age and remains in the memoir on reload', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Bắt đầu một kiếp mới' }).click();
  await page.getByRole('button', { name: 'Tự chọn bối cảnh' }).click();
  await page.getByText('Một hạt giống để gặp lại cuộc đời này').click();
  await page.getByLabel('Hạt giống (tùy chọn)').fill('avatar-browser');
  await page.getByRole('button', { name: 'Xem trước cuộc đời' }).click();
  await page.getByRole('button', { name: 'Bắt đầu với nhân vật này' }).click();
  const image = page.locator('.living-avatar:visible').first();
  await expect(image).toHaveAttribute('data-stage', '0');
  const identity = await image.getAttribute('data-avatar');
  await page.getByRole('button', { name: 'Bắt đầu câu chuyện' }).click();
  const stages = new Set<string>();
  for (let i = 0; i < 90; i++) {
    const current = page.locator('.living-avatar:visible').first();
    expect(await current.getAttribute('data-avatar')).toBe(identity);
    stages.add((await current.getAttribute('data-stage'))!);
    if (await page.getByRole('heading', { name: /Một đời đã sống/ }).isVisible()) break;
    await page.getByTestId('event-choice').first().click();
  }
  expect([...stages].sort()).toEqual(['1', '2', '3', '4', '5']);
  await expect.poll(async () => (await readGuestRun(page)).status).toBe('ended');
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  await expect(page.locator('.living-avatar:visible').first()).toHaveAttribute(
    'data-avatar',
    identity!,
  );
});
