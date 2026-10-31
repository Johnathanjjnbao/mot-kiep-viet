import { chromium, expect } from '@playwright/test';
import { assertDecisionViewport } from './decision-viewport.mjs';
export async function browserCloudQA(users, check) {
  const browser = await chromium.launch({ channel: process.env.CI ? 'chromium' : 'msedge' });
  const contexts = [];
  const pageErrors = [],
    brokenAssets = [];
  try {
    const one = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
      two = await browser.newContext({
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      });
    contexts.push(one, two);
    for (const context of contexts)
      context.on('page', (page) => {
        page.on('pageerror', () => pageErrors.push('Uncaught application error'));
        page.on('response', (response) => {
          const path = new URL(response.url()).pathname;
          if (response.status() >= 400 && /\/mot-kiep-viet\/assets\//.test(path))
            brokenAssets.push(path);
        });
      });
    const p = await one.newPage(),
      q = await two.newPage(),
      [a, b] = users;
    const target = process.env.MKV_QA_URL ?? 'http://127.0.0.1:4173/mot-kiep-viet/';
    const open = async (page) => {
      await page.locator('.account-trigger').click();
    };
    const close = async (page) => {
      await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    };
    const login = async (page, user) => {
      await open(page);
      await page.getByLabel('Email tài khoản').fill(user.email);
      await page.getByLabel('Mật khẩu', { exact: true }).fill(user.password);
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Đăng nhập', exact: true })
        .click();
      await expect(page.locator('.account-trigger')).toHaveAttribute(
        'aria-label',
        'Tài khoản của tôi',
      );
      await page.getByRole('button', { name: 'Bắt đầu một kiếp mới' }).waitFor();
      await open(page);
      await expect(page.getByText(user.email, { exact: true })).toBeVisible();
      await close(page);
    };
    const start = async (page, name) => {
      await page.getByRole('button', { name: 'Bắt đầu một kiếp mới' }).click();
      await page.getByRole('button', { name: 'Tự chọn bối cảnh' }).click();
      await page.getByLabel('Tên nhân vật', { exact: true }).fill(name);
      await page.getByRole('button', { name: 'Xem trước cuộc đời' }).click();
      await page.getByRole('button', { name: 'Bắt đầu với nhân vật này' }).click();
      await page.getByRole('button', { name: 'Bắt đầu câu chuyện' }).click();
      await expect(page.getByText('Đã tự lưu trên máy')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await assertDecisionViewport(page);
    };
    const row = async () => {
      const r = await a.client.from('cloud_saves').select('*').eq('slot', 'autosave');
      if (r.error) throw Error('Cannot inspect user-scoped QA save');
      return r.data[0];
    };
    const step = async (page) => {
      const choices = page.getByTestId('event-choice');
      if (await choices.count()) await choices.first().click();
      else await page.getByTestId('advance-life').click();
    };
    await check('browser guest starts and retains local save', async () => {
      await p.goto(target);
      await start(p, 'Đời Khách Kiểm Thử');
    });
    await check('browser invalid credentials and real provisioned login', async () => {
      await open(p);
      await p.getByLabel('Email tài khoản').fill(a.email);
      await p.getByLabel('Mật khẩu', { exact: true }).fill('invalid-qa-only-password');
      await p.getByRole('dialog').getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await expect(p.getByText(/Không đăng nhập được/)).toBeVisible();
      await close(p);
      await login(p, a);
    });
    await check(
      'complex social marriage and per-NPC memories load through authenticated UI',
      async () => {
        await p.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
        await p.getByRole('button', { name: 'Người thân', exact: true }).click();
        await expect(p.locator('[data-social-person="friend"]')).toContainText('Đã kết hôn');
        const own = await row();
        expect(own.snapshot.run.social.primaryId).toBe('friend');
        expect(own.snapshot.run.social.people[0].memories.length).toBeGreaterThan(5);
        await p.getByRole('button', { name: 'Trang đầu', exact: true }).click();
      },
    );
    await check(
      'child development, career and immutable parent references load on an independent mobile session',
      async () => {
        const context = await browser.newContext({
          viewport: { width: 375, height: 812 },
          isMobile: true,
          hasTouch: true,
        });
        try {
          const page = await context.newPage();
          await page.goto(target);
          await login(page, a);
          await page.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
          await page.getByRole('button', { name: 'Người thân', exact: true }).click();
          const own = await row();
          expect(own.snapshot.run.family.children.length).toBeGreaterThan(0);
          const child = own.snapshot.run.family.children[0];
          await expect(page.locator('[data-family-child]').first()).toContainText(child.occupation);
          expect(child.parents).toEqual(['player:' + own.snapshot.run.id, 'friend']);
          await expect(page.locator('[data-family-child]').first()).toContainText(
            'Cha mẹ được ghi nhận',
          );
        } finally {
          await context.close();
        }
      },
    );
    await check('guest migration is explicit and preserves guest data', async () => {
      const before = await row();
      expect(before.snapshot.run.player.name).not.toBe('Đời Khách Kiểm Thử');
      await open(p);
      await p.getByRole('button', { name: 'Chuyển dữ liệu từ thiết bị này vào tài khoản' }).click();
      await expect(p.getByRole('button', { name: 'Xác nhận sao chép' })).toBeDisabled();
      await p.getByRole('checkbox', { name: /Tôi đồng ý sao chép/ }).check();
      await p.getByRole('button', { name: 'Xác nhận sao chép' }).click();
      await expect(p.getByText(/Dữ liệu khách vẫn còn nguyên/)).toBeVisible();
      await close(p);
      const name = await p.evaluate(
        () =>
          new Promise((resolve, reject) => {
            const db = indexedDB.open('mot-kiep-viet', 1);
            db.onsuccess = () => {
              const request = db.result.transaction('saves').objectStore('saves').get('autosave');
              request.onsuccess = () => {
                resolve(JSON.parse(request.result).run.player.name);
                db.result.close();
              };
              request.onerror = reject;
            };
            db.onerror = reject;
          }),
      );
      expect(name).toBe('Đời Khách Kiểm Thử');
    });
    await check('logout and account switching do not inherit private progress', async () => {
      await open(p);
      await p.getByRole('button', { name: 'Đăng xuất trên thiết bị này' }).click();
      await expect(
        p.getByRole('button', { name: /Tiếp tục cuộc đời của Đời Khách Kiểm Thử/ }),
      ).toBeVisible();
      await login(p, b);
      await expect(p.getByRole('button', { name: /Tiếp tục cuộc đời của/ })).toHaveCount(0);
      await open(p);
      await p.getByRole('button', { name: 'Đăng xuất trên thiết bị này' }).click();
      await login(p, a);
    });
    await check('device A saves and independent mobile browser B resumes', async () => {
      await start(p, 'Đời Đám Mây Kiểm Thử');
      await step(p);
      await step(p);
      await open(p);
      await expect(p.getByText('Đã đồng bộ', { exact: true })).toBeVisible({ timeout: 25000 });
      await close(p);
      await expect
        .poll(async () => (await row())?.snapshot.run.player.name, { timeout: 20000 })
        .toBe('Đời Đám Mây Kiểm Thử');
      await q.goto(target);
      await login(q, a);
      await q.getByRole('button', { name: /Tiếp tục cuộc đời của Đời Đám Mây Kiểm Thử/ }).click();
      await expect(q.locator('.character-head')).toContainText('Đời Đám Mây Kiểm Thử');
      await expect(q.getByText('Đã tự lưu trên máy')).toBeVisible();
      await assertDecisionViewport(q);
    });
    await check(
      'wardrobe purchase and equipment synchronize to an independent mobile browser',
      async () => {
        await p.getByRole('button', { name: 'Tủ đồ', exact: true }).click();
        const card = p.locator('[data-clothing="indigo-tee"]');
        await card.getByRole('button', { name: /Mua/ }).click();
        await card.getByRole('button', { name: 'Mặc', exact: true }).click();
        await expect
          .poll(async () => (await row())?.snapshot.run.wardrobe?.equipped.top, { timeout: 25000 })
          .toBe('indigo-tee');
        await p.getByRole('button', { name: 'Câu chuyện', exact: true }).click();
        await q.reload();
        await q.getByRole('button', { name: /Tiếp tục cuộc đời của Đời Đám Mây Kiểm Thử/ }).click();
        await expect(q.locator('.character-hud .living-avatar:visible')).toHaveAttribute(
          'data-wearing',
          /indigo-tee/,
        );
        const saved = await row();
        expect(saved.snapshot.run.wardrobe.owned.filter((id) => id === 'indigo-tee')).toHaveLength(
          1,
        );
        expect(
          saved.snapshot.run.finance.transactions.filter((t) => t.id === 'wardrobe:buy:indigo-tee'),
        ).toHaveLength(1);
      },
    );
    await check('all three manual slots save and load through authenticated UI', async () => {
      const title = await p.locator('.story-card h2').textContent();
      await p.getByRole('button', { name: 'Lưu và tải game' }).click();
      for (const n of [1, 2, 3]) {
        await p.getByRole('button', { name: 'Lưu vào ô ' + n, exact: true }).click();
        await expect(p.getByText('Đã lưu vào ô bạn chọn.')).toBeVisible();
      }
      await p.getByRole('button', { name: 'Tải lại', exact: true }).nth(2).click();
      await expect(p.locator('.story-card h2')).toHaveText(title);
      await open(p);
      await expect(p.getByText('Đã đồng bộ', { exact: true })).toBeVisible({ timeout: 25000 });
      await close(p);
      const rows = await a.client.from('cloud_saves').select('slot');
      if (rows.error) throw Error('Cannot verify own manual slots');
      expect(rows.data.map((r) => r.slot).sort()).toEqual([
        'autosave',
        'slot-1',
        'slot-2',
        'slot-3',
      ]);
    });
    let offlineTitle, offlineYear;
    await check('offline progress survives a full application reload', async () => {
      await q.evaluate(() => navigator.serviceWorker.ready);
      await expect
        .poll(() => q.evaluate(() => Boolean(navigator.serviceWorker.controller)), {
          timeout: 15000,
        })
        .toBe(true);
      await two.setOffline(true);
      await step(q);
      await step(q);
      await expect(q.getByText('Đã tự lưu trên máy')).toBeVisible();
      offlineTitle = await q.locator('.story-card h2').textContent();
      offlineYear = await q.locator('.year-stamp strong').textContent();
      await q.reload();
      await q.getByRole('button', { name: /Tiếp tục cuộc đời của Đời Đám Mây Kiểm Thử/ }).click();
      await expect(q.locator('.story-card h2')).toHaveText(offlineTitle);
      await expect(q.locator('.year-stamp strong')).toHaveText(offlineYear);
    });
    await check('offline queue synchronizes after reconnect', async () => {
      await two.setOffline(false);
      await expect
        .poll(async () => (await row())?.snapshot.run.world.year, { timeout: 25000 })
        .toBe(Number(offlineYear));
    });
    await check(
      'two-browser conflict preserves both branches and accepts explicit choice',
      async () => {
        await step(p);
        await step(p);
        await open(p);
        await expect(p.getByText('Có xung đột cần bạn chọn', { exact: true })).toBeVisible({
          timeout: 20000,
        });
        await p.getByRole('button', { name: 'Xem hai nhánh' }).click();
        await p.getByRole('button', { name: 'Tiếp tục bản trên đám mây' }).first().click();
        await expect(p.locator('.year-stamp strong')).toHaveText(offlineYear);
        await open(p);
        await p.getByText('Bản sao khôi phục', { exact: true }).click();
        await p.getByRole('button', { name: 'Đọc các nhánh đã giữ' }).click();
        await expect
          .poll(() => p.getByRole('button', { name: 'Xuất nhánh này' }).count())
          .toBeGreaterThanOrEqual(1);
        await close(p);
      },
    );
    await check('two tabs sharing IndexedDB preserve stale local branches', async () => {
      const other = await one.newPage();
      try {
        await other.goto(target);
        await other.getByRole('button', { name: /Tiếp tục cuộc đời của/ }).click();
        await expect(other.getByText('Đã tự lưu trên máy')).toBeVisible();
        await step(p);
        await open(p);
        await expect(p.getByText('Đã đồng bộ', { exact: true })).toBeVisible({ timeout: 25000 });
        await close(p);
        const saved = await row();
        await other.getByTestId('event-choice').nth(1).click();
        await expect(other.getByText(/Một tab khác vừa lưu tiến độ/)).toBeVisible();
        expect((await row()).snapshot.run).toEqual(saved.snapshot.run);
        await open(other);
        await other.getByText('Bản sao khôi phục', { exact: true }).click();
        await other.getByRole('button', { name: 'Đọc các nhánh đã giữ' }).click();
        await expect
          .poll(() => other.getByRole('button', { name: 'Xuất nhánh này' }).count())
          .toBeGreaterThanOrEqual(2);
      } finally {
        await other.close();
      }
    });
    await check('a UI-completed life archives across browsers', async () => {
      for (let i = 0; i < 90; i++) {
        if (await p.getByRole('heading', { name: /Một đời đã sống/ }).isVisible()) break;
        await step(p);
      }
      await expect(p.getByRole('heading', { name: /Một đời đã sống/ })).toBeVisible();
      await expect
        .poll(
          async () => {
            const r = await a.client.from('completed_lives').select('life_id');
            if (r.error) throw Error('history unavailable');
            return r.data.length;
          },
          // Allow two 30-second background retry cycles after the rapid full-life run.
          { timeout: 90000 },
        )
        .toBeGreaterThanOrEqual(2);
      await q.reload();
      await q.getByRole('button', { name: 'Lịch sử cuộc đời', exact: true }).click();
      await expect(q.locator('.history-grid article')).toHaveCount(2, { timeout: 15000 });
      expect(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
    await check('authenticated pages have no uncaught errors or broken public assets', async () => {
      expect(pageErrors).toEqual([]);
      expect(brokenAssets).toEqual([]);
    });
  } catch (e) {
    const msg = users
      .reduce((text, user) => text.replaceAll(user.password, '[redacted]'), String(e.message))
      .replace(/(access_token|token|refresh_token|code)=[^&\\s]+/gi, 'credential=[redacted]');
    console.log('Browser QA diagnostic: ' + msg.slice(0, 800));
    for (let i = 0; i < contexts.length; i++) {
      const page = contexts[i].pages()[0];
      if (page)
        await page
          .screenshot({ path: '.local/cloud-browser-failure-' + i + '.png' })
          .catch(() => {});
    }
    throw e;
  } finally {
    for (const context of contexts) await context.close();
    await browser.close();
  }
}
