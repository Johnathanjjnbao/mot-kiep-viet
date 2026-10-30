import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {suitable,toAge,married} from '../../scripts/social-fixture';
import {snapshot} from '../../src/persistence/saves';
import {readGuestRun} from '../../scripts/decision-viewport.mjs';
test('three people have independent interest; one tap resolves targeted dialogue and preserves the pending story',async({page})=>{
  const run=toAge(suitable(),18), pending=run.activeEvent;
  await page.goto('./');await page.getByRole('button',{name:'Lưu và tải game'}).click();
  await page.getByLabel('Chọn tệp game đã lưu').setInputFiles({name:'social.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(snapshot(run)))});
  for(const p of run.social!.people){
    for(const templateId of ['soc-meet','soc-listen','soc-book','soc-boundary']){
      await page.getByRole('button',{name:'Người thân',exact:true}).click();
      const card=page.locator(`[data-social-person="${p.npcId}"]`);
      await card.locator('select').selectOption(templateId);await card.getByRole('button',{name:/Mở cuộc trò chuyện/}).click();
      await expect(page.locator('.story-text')).not.toContainText('{name}');
      const current=await readGuestRun(page);await page.getByTestId('event-choice').first().click();
      await expect.poll(async()=>(await readGuestRun(page)).actions.length).toBe(current.actions.length+1);
      expect((await readGuestRun(page)).activeEvent).toEqual(pending);
    }
  }
  await page.getByRole('button',{name:'Người thân',exact:true}).click();
  await expect(page.locator('[data-interest="crush"], [data-interest="admiration"]')).toHaveCount(3);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.screenshot({path:`docs/evidence/social-${test.info().project.name}.png`,fullPage:true});
  const saved=await readGuestRun(page);await page.reload();await page.getByRole('button',{name:/Tiếp tục cuộc đời của/}).click();expect(await readGuestRun(page)).toEqual(saved);
});
test('a marriage with household state and per-NPC memories survives UI import and reload',async({page})=>{
  const run=married();await page.goto('./');await page.getByRole('button',{name:'Lưu và tải game'}).click();await page.getByLabel('Chọn tệp game đã lưu').setInputFiles({name:'married.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(snapshot(run)))});
  await page.getByRole('button',{name:'Người thân',exact:true}).click();await expect(page.locator('[data-social-person="friend"]')).toContainText('Đã kết hôn');
  await page.reload();await page.getByRole('button',{name:/Tiếp tục cuộc đời của/}).click();expect((await readGuestRun(page)).social).toEqual(run.social);
});
