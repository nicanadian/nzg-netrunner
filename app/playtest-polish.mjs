// Presentation and bounded UI plans consume only viewer-authorized snapshots.
export function rulesTextHTML(text){
 return String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  .replace(/\[credit\]/g,'¢').replace(/\[click\]|\bclick\b/gi,'<span class="rules-click" role="img" aria-label="click" title="Click">⏱</span>');
}
export function optionLabel(option,state){
 if(!option.card&&!option.subroutine&&option.label==='Continue'){
  const title=state.phase.title;
  if(/may rez.*ignoring all costs/i.test(title))return 'Decline free rez';
  if(/may add.*Archives.*HQ/i.test(title))return 'Leave Archives unchanged';
  if(/may install/i.test(title)||/^Ansel [12]\.0$/.test(state.phase.source||'')&&state.phase.identifier==='Run Subroutines')return 'Do not install a card';
  if(/^You may /i.test(title))return 'Skip this optional effect';
 }
 return option.label;
}
export function installationGroups(options){
 const groups=new Map(),byCard=new Map();
 for(const option of options){
  if(!option.card||option.card.hidden)return null;
  if(!byCard.has(option.card.id))byCard.set(option.card.id,[]);
  byCard.get(option.card.id).push(option);
 }
 for(const list of byCard.values()){
  const {id,...card}=list[0].card;
  const destinations=list.map(o=>JSON.stringify([o.label,o.server,o.hostId,o.hostLabel,o.cost,o.detail,o.installQuote])).sort();
  const key=JSON.stringify([card,destinations]);
  if(!groups.has(key))groups.set(key,{card:list[0].card,copies:new Set(),options:[]});
  const group=groups.get(key);group.copies.add(id);group.options.push(...list);
 }
 return [...groups.values()];
}
export function clickBreakBatch(state){
 if(state?.terminal||state?.side!=='runner'||state.active!=='runner'||!state.run?.encountering)return null;
 const ice=state.run.card;if(ice?.hidden||!ice?.subTypes?.includes('Bioroid'))return null;
 const group=state.decision?.commands.find(c=>c.command==='continue'&&c.options.some(o=>o.subroutine&&o.sourceId===ice.id&&o.targetId===ice.id));
 const options=group?.options.filter(o=>o.subroutine&&o.sourceId===ice.id&&o.targetId===ice.id);
 if(!options?.length)return null;
 const clicks=ice.number===36028?2:1,capacity=ice.number===36028?2:1;
 // A fresh, unpaid selection only. Ansel 2.0's included second break is free
 // and must not create another paid plan or overstate the cost.
 if(options.some(o=>o.cost?.clicks!==clicks)||/without paying|another subroutine/i.test(state.phase.title))return null;
 const targets=options.map(o=>o.subroutine),cost=Math.ceil(targets.length/capacity)*clicks;
 if(targets.length!==ice.subroutines.filter(s=>!s.broken).length)return null;
 return cost<=state.runner.clicks?{iceId:ice.id,cardId:ice.id,cardName:ice.title,targets,iceText:ice.subroutines.map(s=>s.text),clicks,capacity,ceiling:cost,initialClicks:state.runner.clicks}:null;
}
export function clickBreakPlan(state,plan){
 if(state.terminal||state.run?.card?.id!==plan.iceId)return {status:'invalid'};
 if(!state.run.encountering)return {status:plan.targets.every(n=>state.run.card.subroutines[n-1]?.broken)?'complete':'invalid'};
 if(!state.decision||state.active!=='runner')return {status:'waiting'};
 if(JSON.stringify(state.run.card.subroutines.map(s=>s.text))!==JSON.stringify(plan.iceText))return {status:'paused',reason:'The subroutine list changed. Review this encounter before breaking more.'};
 const options=state.decision.commands.flatMap(c=>c.options.map(o=>({...o,command:c.command})));
 const remaining=plan.targets.filter(n=>!state.run.card.subroutines[n-1]?.broken);
 const finish=options.find(o=>o.command==='continue'&&o.sourceId===plan.iceId&&!o.card&&!o.subroutine&&/Finish breaking/i.test(o.label));
 if(!remaining.length)return finish?{status:'finish',next:finish}:{status:'complete'};
 const target=options.find(o=>o.subroutine===remaining[0]&&o.sourceId===plan.iceId&&o.targetId===plan.iceId);
 if(target){
  const instruction=state.decision.commands.find(c=>c.command===target.command)?.instruction||state.phase.title;
  const included=plan.capacity===2&&/without paying/i.test(instruction),cost=target.cost?.clicks||0,spent=plan.initialClicks-state.runner.clicks;
  if(!included&&(cost!==plan.clicks||spent+cost>plan.ceiling))return {status:'paused',reason:'The quoted click cost changed. No further break is queued.'};
  return {status:'target',next:target};
 }
 const ability=options.find(o=>o.command==='trigger'&&o.card?.id===plan.iceId&&o.cost?.clicks===plan.clicks&&/break/i.test(o.detail||o.label));
 const spent=plan.initialClicks-state.runner.clicks;
 if(ability&&spent+plan.clicks<=plan.ceiling&&state.runner.clicks>=plan.clicks)return {status:'ready',next:ability};
 return {status:'paused',reason:'The offered break or click cost changed. Resolve the current decision or stop the queued breaks.'};
}
export function deckHealth(deck,cards){
 if(deck.side!=='runner')return [];
 const entries=deck.cards.map(c=>cards[c.id??c[0]]);
 const missing=['Fracter','Decoder','Killer'].filter(type=>!entries.some(c=>c?.keywords?.split(' - ').includes(type)));
 const hints=missing.length?['Missing breaker coverage: '+missing.join(', ')+'.']:[];
 if(entries.some(c=>c?.code==='36015')&&!entries.some(c=>c?.keywords?.split(' - ').includes('Stealth')))hints.push('Baker needs a stealth credit source for its redirect.');
 return hints;
}
