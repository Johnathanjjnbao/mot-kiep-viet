import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { assertDecisionViewport, readGuestRun } from '../../scripts/decision-viewport.mjs';
import {
  createRun as legacyRun,
  advance as legacyAdvance,
} from '../../src/legacy/v1/engine/engine';
import { snapshot as legacySnapshot } from '../../src/legacy/v1/persistence/saves';
async function start(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Bắt đầu một kiếp mới' }).click();
  await page.getByRole('button', { name: 'Tự chọn bối cảnh' }).click();
  await page.getByRole('radio', { name: /1995/ }).check();
  await page.getByRole('radio', { name: /Một làng quê Bắc Bộ/ }).check();
  await page.getByText('Một hạt giống để gặp lại cuộc đời này').click();
  await page.getByLabel('Hạt giống (tùy chọn)').fill('browser-life');
  await page.getByRole('button', { name: 'Xem trước cuộc đời' }).click();
  await page.getByRole('button', { name: 'Bắt đầu với nhân vật này' }).click();
  await expect(page.getByRole('heading', { name: /Chào đời/ })).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu câu chuyện' }).click();
}
async function step(page: Page) {
  const options = page.getByTestId('event-choice').filter({ visible: true });
  if (await options.count()) {
    const enabled = page.locator('[data-testid="event-choice"]:not(:disabled)');
    await enabled.first().click();
  } else await page.getByTestId('advance-life').click();
}
test('starts, decides, saves, reloads, imports, reaches an ending, and begins another life', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page);
  await page.locator('[data-testid="event-choice"]:not(:disabled)').first().click();
  await expect(page.getByTestId('advance-life')).toHaveCount(0);
  await expect(page.getByTestId('event-choice').first()).toBeVisible();
  for (let i = 0; i < 7; i++) await step(page);
  const year = await page.locator('.year-stamp strong').textContent();
  const event = await page.locator('.story-card h2').textContent();
  await expect(page.getByText('Đã tự lưu trên máy')).toBeVisible();
  await page.getByRole('button', { name: 'Lưu và tải game' }).click();
  await page.getByRole('button', { name: 'Lưu vào ô 1', exact: true }).click();
  await expect(page.getByText('Đã lưu vào ô bạn chọn.')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất tệp lưu' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  await expect(page.locator('.year-stamp strong')).toHaveText(year!);
  await expect(page.locator('.story-card h2')).toHaveText(event!);
  await step(page);
  await page.getByRole('button', { name: 'Lưu và tải game' }).click();
  await page.getByLabel('Chọn tệp game đã lưu').setInputFiles(path!);
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.story-card h2')).toHaveText(event!);
  // Continue entirely through the visible player interface; no hidden fast-forward.
  for (let i = 0; i < 90; i++) {
    if (await page.getByRole('heading', { name: /Một đời đã sống/ }).isVisible()) break;
    await step(page);
  }
  await expect(page.getByRole('heading', { name: /Một đời đã sống/ })).toBeVisible();
  const cardPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải thẻ kỷ niệm' }).click();
  expect((await cardPromise).suggestedFilename()).toMatch(/\.svg$/);
  await page.getByRole('button', { name: 'Đọc lại nhật ký' }).click();
  await expect(page.getByRole('heading', { name: 'Nhật ký một đời' })).toBeVisible();
  expect(await page.locator('.journal li').count()).toBeGreaterThan(25);
  await page.getByRole('button', { name: 'Trở về cuộc đời' }).click();
  await page.getByRole('button', { name: 'Lịch sử cuộc đời', exact: true }).click();
  await expect(page.locator('.history-grid article')).toHaveCount(1);
  const archiveDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất toàn bộ lịch sử' }).click();
  const archivePath = await (await archiveDownload).path();
  await page.getByLabel('Chọn tệp lịch sử').setInputFiles(archivePath!);
  await expect(page.getByRole('status')).toHaveText('Đã giữ lại lịch sử.');
  await expect(page.locator('.history-grid article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Đọc cuộc đời này' }).click();
  await page.getByRole('button', { name: 'Sống một kiếp khác' }).click();
  await page.getByRole('button', { name: 'Gieo một cuộc đời' }).click();
  await expect(page.getByRole('heading', { name: /Chào đời/ })).toBeVisible();
  await page.getByRole('button', { name: 'Lịch sử cuộc đời', exact: true }).click();
  await expect(page.locator('.history-grid article')).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: 'Lịch sử cuộc đời', exact: true }).click();
  await expect(page.locator('.history-grid article')).toHaveCount(1);
  expect(errors).toEqual([]);
});
test('responsive pages, keyboard dialogs, settings, and accessibility', async ({
  page,
}, testInfo) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /Nếu được sống/ })).toBeVisible();
  await page.screenshot({
    path: `docs/evidence/home-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await page.getByLabel('Chữ lớn hơn').check();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Cài đặt', exact: true })).toBeFocused();
  await start(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: `docs/evidence/game-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Tài chính', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Đủ sống hôm nay/ })).toBeVisible();
  expect(await page.getByRole('button', { name: 'Gửi 50 đSM' }).isDisabled()).toBe(true);
  await page.getByRole('button', { name: 'Người thân', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mẹ · Thu' })).toBeVisible();
  await page.setViewportSize({ width: 812, height: 375 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('adult career, savings, household costs, and invalid import feedback work through the UI', async ({
  page,
}) => {
  await start(page);
  for (
    let i = 0;
    i < 30 && (await page.locator('.year-stamp strong').textContent()) !== '2013';
    i++
  )
    await step(page);
  await page.getByRole('button', { name: /Đi làm và để ngỏ việc học/ }).click();
  await page.getByRole('button', { name: 'Nghề nghiệp', exact: true }).click();
  await page.getByRole('button', { name: 'Ứng tuyển', exact: true }).first().click();
  await expect
    .poll(async () => (await readGuestRun(page)).employment!.applications.length)
    .toBeGreaterThan(0);
  await expect(page.getByTestId('job-result')).toContainText('Hồ sơ gần nhất');
  await page.getByRole('button', { name: 'Tài chính', exact: true }).click();
  await page.getByRole('button', { name: 'Gửi 50 đSM', exact: true }).click();
  await expect(page.locator('.finance-overview')).toContainText('50 đSM');
  await page.getByRole('button', { name: 'Rút tối đa 50 đSM' }).click();
  await page.getByRole('button', { name: 'Vay 50 đSM', exact: true }).click();
  await page.getByRole('button', { name: 'Trả tối đa 50 đSM' }).click();
  await page.getByRole('button', { name: 'Ra ở trọ', exact: true }).click();
  await expect(page.locator('.housing-card')).toContainText('Một căn phòng trọ');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Lưu và tải game' }).click();
  await page.getByLabel('Chọn tệp game đã lưu').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{invalid'),
  });
  await expect(page.getByRole('status')).toContainText('không phải JSON hợp lệ');
  await expect(page.getByRole('dialog')).toBeVisible();
});
test('all five family forms validate, preview, edit and persist on reload', async ({ page }) => {
  for (const family of ['both', 'father-only', 'mother-only', 'with-father', 'with-mother']) {
    await page.goto('./');
    await page.getByRole('button', { name: 'Bắt đầu một kiếp mới' }).click();
    await page.getByRole('button', { name: 'Tự chọn bối cảnh' }).click();
    await page.getByLabel('Tên nhân vật', { exact: true }).fill('Đỗ Ánh Tuyết');
    await page.getByLabel('Năm sinh (1975–2026)').fill('2026');
    await page.getByLabel('Địa danh cụ thể').fill('Xóm Gió, quê mình');
    await page.getByLabel('Cấu trúc gia đình').selectOption(family);
    if (family !== 'father-only') {
      const mother = page.getByTestId('traits-mother');
      await mother.locator('summary').click();
      await mother.getByRole('checkbox', { name: 'Quan tâm việc học', exact: true }).check();
    }
    await page.getByRole('button', { name: 'Xem trước cuộc đời' }).click();
    await expect(page.getByRole('heading', { name: 'Xem lại khởi đầu' })).toBeVisible();
    await page.getByRole('button', { name: 'Sửa trước khi bắt đầu' }).click();
    await expect(page.getByLabel('Tên nhân vật', { exact: true })).toHaveValue('Đỗ Ánh Tuyết');
    await page.getByRole('button', { name: 'Xem trước cuộc đời' }).click();
    await page.getByRole('button', { name: 'Bắt đầu với nhân vật này' }).click();
    await expect(page.locator('.birth-location')).toContainText('Xóm Gió, quê mình');
    await page.getByRole('button', { name: 'Bắt đầu câu chuyện' }).click();
    expect(await page.getByTestId('event-choice').count()).toBeGreaterThanOrEqual(4);
    await expect(page.getByText('Đã tự lưu trên máy')).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: /Tiếp tục cuộc đời của Đỗ Ánh Tuyết/ }).click();
    await expect(page.locator('.character-head')).toContainText('2026');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
test('imports a v0.1 save as a readable checkpoint without showing incompatible choices', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Lưu và tải game' }).click();
  const old = legacyAdvance(legacyRun('old-browser'));
  await page.getByLabel('Chọn tệp game đã lưu').setInputFiles({
    name: 'old-save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacySnapshot(old))),
  });
  await expect(page.getByRole('heading', { name: 'Cuộc đời từ bản v0.1' })).toBeVisible();
  await expect(page.getByTestId('event-choice')).toHaveCount(0);
  await expect(
    page.getByText(old.player.name + ' · ' + old.player.birthYear + '–' + old.world.year),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Lưu và tải game' }).click();
  await page.getByRole('button', { name: 'Lưu vào ô 1', exact: true }).click();
  await expect(page.getByText('Đã lưu vào ô bạn chọn.')).toBeVisible();
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  await expect(page.getByRole('heading', { name: 'Cuộc đời từ bản v0.1' })).toBeVisible();
});

test('production shell preserves guest progress through an offline reload', async ({
  page,
  context,
}) => {
  test.skip(
    process.env.E2E_PRODUCTION !== '1',
    'Offline shell uses the production service worker.',
  );
  await start(page);
  await step(page);
  await step(page);
  await expect(page.getByText('Đã tự lưu trên máy')).toBeVisible();
  const title = await page.locator('.story-card h2').textContent(),
    year = await page.locator('.year-stamp strong').textContent();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  await expect(page.locator('.story-card h2')).toHaveText(title!);
  await expect(page.locator('.year-stamp strong')).toHaveText(year!);
  await context.setOffline(false);
});

async function storedRun(page: Page) {
  return page.evaluate(
    () =>
      new Promise<import('../../src/domain/model').GameRun>((resolve, reject) => {
        const request = indexedDB.open('mot-kiep-viet', 1);
        request.onerror = reject;
        request.onsuccess = () => {
          const db = request.result;
          const item = db.transaction('saves').objectStore('saves').get('autosave');
          item.onerror = reject;
          item.onsuccess = () => {
            resolve(JSON.parse(item.result).run);
            db.close();
          };
        };
      }),
  );
}

test('one-tap decisions reject double clicks, keep focus and viewport, and restore autosave', async ({
  page,
}, testInfo) => {
  await start(page);
  await expect(page.getByText('Đã tự lưu trên máy')).toBeVisible();
  const before = await storedRun(page);
  await page.getByTestId('event-choice').first().dblclick();
  await expect(page.locator('#event-heading')).toBeFocused();
  await expect(page.getByText('Đã tự lưu trên máy')).toBeVisible();
  const after = await storedRun(page);
  expect(after.choices.length).toBe(before.choices.length + 1);
  expect(after.actions.filter((a) => a.type === 'choose').length).toBe(1);
  expect(after.activeEvent).toBeTruthy();
  await expect(page.getByTestId('advance-life')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Xác nhận$/ })).toHaveCount(0);
  await expect(page.locator('.recent-outcome')).toContainText(after.choices.at(-1)!.outcome);
  for (let i = 0; i < 5; i++) {
    const previous = await storedRun(page);
    await page.getByTestId('event-choice').first().click();
    await expect(page.locator('#event-heading')).toBeFocused();
    await expect(page.getByText('Đã tự lưu trên máy')).toBeVisible();
    expect((await storedRun(page)).choices.length).toBe(previous.choices.length + 1);
    await assertDecisionViewport(page);
  }
  const saved = await storedRun(page);
  const title = await page.locator('#event-heading').textContent();
  await page.reload();
  await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
  await expect(page.locator('#event-heading')).toHaveText(title!);
  await expect(page.getByText('Đã tự lưu trên máy')).toBeVisible();
  expect(await storedRun(page)).toEqual(saved);
  if (testInfo.project.name === 'mobile-edge') {
    const first = await page.getByTestId('event-choice').first().boundingBox();
    await page.touchscreen.tap(first!.x + first!.width / 2, first!.y + first!.height / 2);
    const second = await page.getByTestId('event-choice').first().boundingBox();
    await page.touchscreen.tap(second!.x + second!.width / 2, second!.y + second!.height / 2);
    await expect(page.getByText('Đã tự lưu trên máy')).toBeVisible();
    expect((await storedRun(page)).choices.length).toBe(saved.choices.length + 1);
    await expect(page.locator('#event-heading')).toBeFocused();
  }
});

test('continuous choices support keyboard, large text and reduced motion without layout overflow', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await page.getByLabel('Chữ lớn hơn').check();
  await page.keyboard.press('Escape');
  await start(page);
  for (const key of ['Enter', 'Space', 'Enter']) {
    await expect(page.getByText('Đã tự lưu trên máy')).toBeVisible();
    const before = await storedRun(page);
    await page.getByTestId('event-choice').first().focus();
    await page.keyboard.press(key);
    await expect(page.locator('#event-heading')).toBeFocused();
    await expect(page.getByText('Đã tự lưu trên máy')).toBeVisible();
    expect((await storedRun(page)).choices.length).toBe(before.choices.length + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByTestId('event-choice').first()).toBeInViewport();
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
