import { expect } from '@playwright/test';

export async function decisionMeasurement(page) {
  return page.evaluate(() => {
    const rect = (node) => {
      const r = node.getBoundingClientRect();
      return {
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        right: r.right,
        height: r.height,
        width: r.width,
      };
    };
    const hud = document.querySelector('.character-hud');
    const first = document.querySelector('[data-testid="event-choice"]');
    const list = document.querySelector('.decision-list');
    const narrative = document.querySelector('.story-narrative');
    const visible = (node) => {
      const r = rect(node),
        style = getComputedStyle(node);
      const x = r.left + r.width / 2,
        y = r.top + r.height / 2;
      const hit = document.elementFromPoint(x, y);
      return {
        ...r,
        readable: style.display !== 'none' && style.visibility !== 'hidden' && r.height > 0,
        unobscured: Boolean(hit && (node.contains(hit) || hit.contains(node))),
      };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentScroll: scrollY,
      hud: visible(hud),
      avatar: visible(
        [...hud.querySelectorAll('.living-avatar')].find(
          (n) => n.getBoundingClientRect().width > 0,
        ),
      ),
      narrative: visible(narrative),
      firstChoice: visible(first),
      list: rect(list),
      stats: [...hud.querySelectorAll('[data-stat]')].map((node) => ({
        key: node.dataset.stat,
        ...visible(node),
        label: visible(node.querySelector('dt')),
        value: visible(node.querySelector('dd')),
        text: node.textContent.trim(),
      })),
      overflow: document.documentElement.scrollWidth > innerWidth,
      choiceCount: list.querySelectorAll('button').length,
      narrativeLength: narrative.querySelector('.story-text').textContent.length,
      longestChoice: Math.max(
        ...[...list.querySelectorAll('button')].map((b) => b.textContent.trim().length),
      ),
      focused: document.activeElement?.id,
    };
  });
}

export async function assertDecisionViewport(page) {
  // All measurements happen BEFORE locator.click or any input/scroll operation.
  const m = await decisionMeasurement(page);
  // A too-wide mobile layout can silently zoom out and enlarge innerWidth/Height.
  expect(m.viewport).toEqual(page.viewportSize());
  expect(m.overflow).toBe(false);
  for (const [name, r] of [
    ['HUD', m.hud],
    ['avatar', m.avatar],
    ['narrative', m.narrative],
    ['first choice', m.firstChoice],
    ...m.stats.map((s) => [s.key, s]),
  ]) {
    expect(r.readable, name + ' readable').toBe(true);
    expect(r.top, name + ' top').toBeGreaterThanOrEqual(-1);
    expect(r.bottom, name + ' bottom').toBeLessThanOrEqual(m.viewport.height + 1);
    expect(r.left, name + ' left').toBeGreaterThanOrEqual(-1);
    expect(r.right, name + ' right').toBeLessThanOrEqual(m.viewport.width + 1);
    expect(r.unobscured, name + ' hit test').toBe(true);
  }
  expect(m.stats.length).toBe(6);
  for (const stat of m.stats) {
    expect(stat.label.right, stat.key + ' label must not overlap the value').toBeLessThanOrEqual(
      stat.value.left + 1,
    );
    expect(stat.value.right, stat.key + ' value remains inside its cell').toBeLessThanOrEqual(
      stat.right + 1,
    );
    expect(stat.label.unobscured, stat.key + ' label unobscured').toBe(true);
    expect(stat.value.unobscured, stat.key + ' value unobscured').toBe(true);
  }
  expect(m.focused).toBe('event-heading');
  expect(m.firstChoice.top).toBeGreaterThanOrEqual(m.list.top - 1);
  expect(m.firstChoice.bottom).toBeLessThanOrEqual(m.list.bottom + 1);
  expect(m.choiceCount).toBeGreaterThanOrEqual(4);
  expect(m.choiceCount).toBeLessThanOrEqual(6);
  return m;
}

export async function clickChoiceWithoutDocumentScroll(page, index, touch = false) {
  const scroll = await page.evaluate(() => scrollY);
  // Only move the allowed choices region to reach middle/last options.
  await page.locator('.decision-list').evaluate((list, i) => {
    const button = list.querySelectorAll('button')[i];
    const r = button.getBoundingClientRect(),
      box = list.getBoundingClientRect();
    if (r.bottom > box.bottom) list.scrollTop += r.bottom - box.bottom + 3;
    else if (r.top < box.top) list.scrollTop -= box.top - r.top + 3;
  }, index);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  const r = await page.getByTestId('event-choice').nth(index).boundingBox();
  expect(r.y).toBeGreaterThanOrEqual(0);
  if (r.y + r.height > page.viewportSize().height + 1) {
    const diagnostic = await page.locator('.decision-list').evaluate((list) => ({
      top: list.getBoundingClientRect().top,
      bottom: list.getBoundingClientRect().bottom,
      scrollTop: list.scrollTop,
      scrollHeight: list.scrollHeight,
      clientHeight: list.clientHeight,
      docScroll: scrollY,
    }));
    throw new Error(
      'Selected choice outside viewport: ' + JSON.stringify({ index, r, diagnostic }),
    );
  }
  const x = r.x + r.width / 2,
    y = r.y + r.height / 2;
  const hit = await page
    .getByTestId('event-choice')
    .nth(index)
    .evaluate((button) => {
      const r = button.getBoundingClientRect();
      const target = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return Boolean(target && button.contains(target));
    });
  expect(hit, 'selected option is not clipped or covered').toBe(true);
  if (touch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

export async function readGuestRun(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open('mot-kiep-viet', 1);
        request.onerror = reject;
        request.onsuccess = () => {
          const db = request.result,
            item = db.transaction('saves').objectStore('saves').get('autosave');
          item.onerror = reject;
          item.onsuccess = () => {
            resolve(JSON.parse(item.result).run);
            db.close();
          };
        };
      }),
  );
}
