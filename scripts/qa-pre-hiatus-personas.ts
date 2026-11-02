import { chromium, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { activeDefinition, choiceReason, replay } from '../src/engine/engine';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
import { storyAction, decisionKey } from '../src/application/story-flow';
import {
  assertDecisionViewport,
  clickChoiceWithoutDocumentScroll,
  readGuestRun,
} from './decision-viewport.mjs';
const url = process.argv[2],
  label = process.argv[3] ?? 'local',
  outDir = process.argv[4];
if (!url) throw Error('Provide target URL');
const server = outDir
  ? spawn(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        new URL(url).port,
        '--strictPort',
        '--outDir',
        outDir,
      ],
      {
        windowsHide: true,
        stdio: 'ignore',
        env: { ...process.env, VITE_BASE_PATH: new URL(url).pathname },
      },
    )
  : null;
const browser = await chromium.launch({ channel: 'msedge' });
const reports = [];
try {
  if (server) {
    let ready = false;
    for (let i = 0; i < 100 && !ready; i++) {
      try {
        ready = (await fetch(url)).ok;
      } catch {
        /* Starting owned preview. */
      }
      if (!ready) await delay(100);
    }
    if (!ready) throw Error('Preview not ready');
  }
  for (const persona of [
    { id: 'poor-rural', wealth: '0', family: 'both', region: 'Một làng quê Bắc Bộ', mobile: true },
    {
      id: 'wealthy-urban',
      wealth: '4',
      family: 'both',
      region: 'Một con hẻm phương Nam',
      mobile: false,
    },
    {
      id: 'single-mother',
      wealth: '1',
      family: 'mother-only',
      region: 'Một xóm nhỏ ven biển',
      mobile: true,
    },
  ]) {
    const viewport = persona.mobile ? { width: 375, height: 812 } : { width: 1440, height: 900 };
    const context = await browser.newContext({
      viewport,
      isMobile: persona.mobile,
      hasTouch: persona.mobile,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage(),
        errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(url);
      await page.getByRole('button', { name: 'Bắt đầu một kiếp mới', exact: true }).click();
      await page.getByRole('button', { name: 'Tự chọn bối cảnh', exact: true }).click();
      await page.getByLabel('Tên nhân vật', { exact: true }).fill('Nguyễn An');
      await page.getByLabel('Năm sinh (1975–2026)').fill('2005');
      await page.getByRole('radio', { name: new RegExp(persona.region) }).check();
      await page.getByLabel('Cấu trúc gia đình').selectOption(persona.family);
      await page
        .getByLabel('Điều kiện kinh tế gia đình', { exact: true })
        .selectOption(persona.wealth);
      await page.getByText('Một hạt giống để gặp lại cuộc đời này').click();
      await page.getByLabel('Hạt giống (tùy chọn)').fill('pre-hiatus-' + persona.id);
      await page.getByRole('button', { name: 'Xem trước cuộc đời', exact: true }).click();
      await page.getByRole('button', { name: 'Bắt đầu với nhân vật này', exact: true }).click();
      await page.getByRole('button', { name: 'Bắt đầu câu chuyện', exact: true }).click();
      let r = await readGuestRun(page),
        previousAge = 0;
      const milestones = [],
        seen = new Set<number>();
      expect(r.setup.lifeRules).toBe('stable-v1');
      expect(r.finance.cash).toBe(0);
      if (persona.family === 'mother-only')
        expect(r.npcs.find((n) => n.role === 'father')?.presence).toBe('unknown');
      for (let i = 0; i < 512 && r.status !== 'ended'; i++) {
        const age = Math.floor(r.month / 12);
        expect(age - previousAge).toBeLessThanOrEqual(1);
        previousAge = age;
        await assertDecisionViewport(page);
        const e = activeDefinition(r)!;
        if ([0, 2, 6, 12, 18, 30, 45, 61, 82, 90].includes(age) && !seen.has(age)) {
          seen.add(age);
          milestones.push({
            age,
            event: e.id,
            title: await page.locator('#event-heading').innerText(),
            text: await page.locator('.story-text').innerText(),
            choices: e.choices.map((c) => ({ text: c.text, hint: c.hint })),
            cash: r.finance.cash,
            savings: r.finance.savings,
            employment: r.player.careers.at(-1)?.id ?? null,
          });
          await page.screenshot({
            path: `docs/evidence/pre-hiatus-${label}-${persona.id}-${age}.png`,
          });
        }
        const available = e.choices
          .map((c, index) => ({ c, index }))
          .filter(({ c }) => !choiceReason(r, c));
        expect(available.length).toBeGreaterThanOrEqual(4);
        const score = (c: (typeof available)[number]['c']) =>
          c.effects.reduce(
            (s, x) =>
              s +
              (x.kind === 'stat'
                ? x.amount *
                  (x.stat === (persona.id === 'wealthy-urban' ? 'knowledge' : 'health')
                    ? 3
                    : x.stat === 'stress'
                      ? -2
                      : 0.3)
                : 0),
            0,
          );
        const pick = [...available].sort((a, b) => score(b.c) - score(a.c))[0];
        const next = storyAction(
          r,
          { type: 'choose', eventId: e.id, choiceId: pick.c.id },
          decisionKey(r),
        );
        await clickChoiceWithoutDocumentScroll(page, pick.index);
        await expect.poll(async () => canonical(await readGuestRun(page))).toBe(canonical(next));
        r = next;
      }
      expect(r.status).toBe('ended');
      expect(canonical(replay(r.seed, r.setup, r.actions))).toBe(canonical(r));
      expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
      await expect(page.getByRole('heading', { name: /Một đời đã sống/ })).toBeVisible();
      await page.screenshot({ path: `docs/evidence/pre-hiatus-${label}-${persona.id}-memoir.png` });
      expect(errors).toEqual([]);
      reports.push({
        persona,
        viewport,
        seed: r.seed,
        age: r.month / 12,
        actions: r.actions.length,
        ending: r.ending,
        milestones,
        status: 'VERIFIED PASS',
        errors,
      });
      console.log(persona.id + ': VERIFIED PASS');
    } finally {
      await context.close();
    }
  }
  writeFileSync(
    `docs/evidence/pre-hiatus-${label}-personas.json`,
    JSON.stringify(
      {
        url,
        status: 'VERIFIED PASS',
        method:
          'Whole lives from visible creator through memoir, guided by health/learning preferences; screenshots and narrative excerpts for editorial review. No imported or hidden fast-forwarded run.',
        reports,
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  await browser.close();
  server?.kill();
}
