import { expect, type Page } from '@playwright/test';
import { createRun, advance, choose, choiceReason, activeDefinition } from '../src/legacy/v2/engine/engine';
import { snapshot } from '../src/legacy/v2/persistence/saves';
import { readGuestRun } from './decision-viewport.mjs';
export async function legacyV2Journey(page: Page, target: string) {
  const old = advance(createRun('old-v2-browser'));
  await page.goto(target);
  await page.getByRole('button',{name:'Lưu và tải game'}).click();
  await page.getByLabel('Chọn tệp game đã lưu').setInputFiles({name:'v2-save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(snapshot(old)))});
  await expect(page.getByTestId('event-choice').first()).toBeVisible();
  expect(await readGuestRun(page)).toEqual(old);
  const event = activeDefinition(old)!, option = event.choices.find(c=>!choiceReason(old,c))!;
  let expected = choose(old,event.id,option.id);
  while(expected.status==='playing'&&!expected.activeEvent) expected=advance(expected);
  await page.getByTestId('event-choice').first().click();
  await expect.poll(async()=> (await readGuestRun(page)).actions.length).toBe(expected.actions.length);
  expect(await readGuestRun(page)).toEqual(expected);
  await page.getByRole('button',{name:'Tủ đồ',exact:true}).click();
  await expect(page.getByText(/Cuộc đời này tiếp tục bằng bộ luật cũ/)).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:/Tiếp tục cuộc đời của/}).click();
  expect(await readGuestRun(page)).toEqual(expected);
  expect((await readGuestRun(page)).wardrobe).toBeUndefined();
  return {status:'VERIFIED PASS', engineVersion:expected.engineVersion, unchangedLegacyState:true};
}
