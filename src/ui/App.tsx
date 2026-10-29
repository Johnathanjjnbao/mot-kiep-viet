import { useState } from 'react';
import { activeDefinition, advance, choose, choiceReason, createRun } from '../engine/engine';
export function App(){
  const [run,setRun]=useState(()=>createRun('vertical-slice'));
  const event=activeDefinition(run);
  return <main><h1>Một Kiếp Việt</h1><p>{run.player.name} · {Math.floor(run.month/12)} tuổi · {run.world.year}</p>{run.status==='ended'?<h2>Một kiếp khép lại</h2>:event?<><h2>{event.title}</h2><p>{event.text}</p>{event.choices.map(c=><button key={c.id} disabled={Boolean(choiceReason(run,c))} onClick={()=>setRun(choose(run,event.id,c.id))}>{c.text}</button>)}</>:<><p>{run.lastOutcome??run.journal[0].text}</p><button onClick={()=>setRun(advance(run))}>Viết tiếp cuộc đời</button></>}</main>;
}
