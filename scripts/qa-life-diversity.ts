import { expect, type Page } from '@playwright/test';
import { readGuestRun, assertDecisionViewport } from './decision-viewport.mjs';
export async function diversityJourney(page: Page, url: string) {
  await page.goto(url);
  async function start(seed?: string) {
    const previousSeed = seed ? undefined : (await readGuestRun(page)).seed;
    await page.getByRole('button', { name: 'Bắt đầu một kiếp mới' }).click();
    if (seed) {
      await page.getByRole('button', { name: 'Tự chọn bối cảnh' }).click();
      await page.getByText('Một hạt giống để gặp lại cuộc đời này').click();
      await page.getByLabel('Hạt giống (tùy chọn)').fill(seed);
      await page.getByRole('button', { name: 'Xem trước cuộc đời' }).click();
      await page.getByRole('button', { name: 'Bắt đầu với nhân vật này' }).click();
    } else await page.getByRole('button', { name: 'Gieo một cuộc đời' }).click();
    await page.getByRole('button', { name: 'Bắt đầu câu chuyện' }).click();
    await expect
      .poll(async () => (await readGuestRun(page))?.setup.lifeRules)
      .toMatch(/^(dynamic|education)-v1$/);
    if (seed) await expect.poll(async () => (await readGuestRun(page)).seed).toBe(seed);
    else await expect.poll(async () => (await readGuestRun(page)).seed).not.toBe(previousSeed);
  }
  const sequences = [];
  for (const seed of ['diversity-0', 'diversity-1', 'diversity-0']) {
    await start(seed);
    const sequence = [];
    for (let i = 0; i < 5; i++) {
      await assertDecisionViewport(page);
      sequence.push((await readGuestRun(page)).activeEvent!.id);
      await page.getByTestId('event-choice').first().click();
      await expect.poll(async () => (await readGuestRun(page)).choices.length).toBe(i + 1);
    }
    sequences.push(sequence);
    await page.getByTitle('Về trang đầu').click();
  }
  expect(sequences[0]).toEqual(sequences[2]);
  expect(sequences[0]).not.toEqual(sequences[1]);
  const seeds = [];
  for (let i = 0; i < 2; i++) {
    await start();
    seeds.push((await readGuestRun(page)).seed);
    await page.getByTitle('Về trang đầu').click();
  }
  expect(seeds[0]).not.toBe(seeds[1]);
  return {
    status: 'VERIFIED PASS',
    sequences,
    freshSeedsDistinct: true,
    viewport: page.viewportSize(),
  };
}
