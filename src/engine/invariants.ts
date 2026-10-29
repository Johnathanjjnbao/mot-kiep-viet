import type { GameRun } from '../domain/model';
import { ageOf, currentCareer, worldFor } from '../content/world';
import { activeDefinition, eligible, partnerOf } from './engine';
export function assertRun(run: GameRun) {
  const fail=(text:string):never=>{throw new Error(`Invariant: ${text}`);};
  if(!Number.isInteger(run.month)||run.month<0||run.month>984) fail('month');
  if(run.world.year!==run.player.birthYear+ageOf(run)||JSON.stringify(run.world)!==JSON.stringify(worldFor(run.world.year))) fail('world/year');
  if(run.status==='ended' && (!run.ending||run.activeEvent||currentCareer(run))) fail('ending');
  if(!run.player.alive && (run.status!=='ended'||run.ending!=='death')) fail('life status');
  Object.values(run.player.stats).forEach(n=>{if(!Number.isFinite(n)||n<0||n>100) fail('stat limits');});
  const ids=new Set(run.npcs.map(n=>n.id)); if(ids.size!==run.npcs.length) fail('NPC identity');
  for(const r of run.relationships) if(!ids.has(r.npcId)||r.strength<0||r.strength>100) fail('relationship');
  if(run.relationships.filter(r=>r.type==='partner'&&run.npcs.find(n=>n.id===r.npcId)?.alive).length>1) fail('partner exclusivity');
  if(partnerOf(run)&&ageOf(run)<18) fail('partner age');
  if(run.npcs.some(n=>n.role==='child'&&n.birthYear-run.player.birthYear<18)) fail('parent age');
  const careers=run.player.careers;
  if(careers.filter(c=>c.endMonth===null).length>1) fail('active career');
  careers.forEach((c,i)=>{if(c.startMonth>run.month||c.endMonth!==null&&(c.endMonth<c.startMonth||c.endMonth>run.month)||i>0&&(careers[i-1].endMonth===null||careers[i-1].endMonth!>c.startMonth)) fail('career history');});
  const sums={cash:0,savings:0,debt:0,assets:0}, transactionIds=new Set<string>();
  for(const t of run.finance.transactions) {
    if(transactionIds.has(t.id)||t.month>run.month) fail('duplicate/future transaction'); transactionIds.add(t.id);
    for(const k of Object.keys(sums) as (keyof typeof sums)[]) { if(!Number.isSafeInteger(t[k])) fail('transaction amount'); sums[k]+=t[k]; }
  }
  if(sums.cash!==run.finance.cash||sums.savings!==run.finance.savings||sums.debt!==run.finance.liability.principal||sums.assets!==run.finance.assets.reduce((n,a)=>n+a.value,0)) fail('ledger reconciliation');
  if(run.finance.cash<0||run.finance.savings<0||run.finance.liability.principal<0||run.finance.settledThrough!==run.month) fail('balances/settlement');
  const scheduledIds=new Set(run.scheduled.map(s=>s.id)); if(scheduledIds.size!==run.scheduled.length) fail('scheduled duplicate');
  if(run.scheduled.some(s=>s.executed&&s.dueMonth>run.month||!s.executed&&s.dueMonth<=run.month&&run.status!=='ended')) fail('scheduled lifecycle');
  const active=activeDefinition(run); if(run.activeEvent&&(!active||!eligible(run,active.condition))) fail('event eligibility');
  for(let i=1;i<run.journal.length;i++) if(run.journal[i].month<run.journal[i-1].month) fail('journal order');
}
