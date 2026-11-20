// Shared-browser playtest driver. Reads only the public DTO and rendered UI;
// Actions use preview_act, or DOM button clicks when that tool repeatedly times
// out. Neither path calls NR.choose or sends worker messages.
(async function runUiLoop(tools,{tabId,maxClicks=8,maxMs=25000,pageClick=false}){
 const readExpression=`(()=>{
 const s=window.localTable?.state;
 const visible=b=>b.getClientRects().length&&!b.disabled;
 document.querySelectorAll('[data-vantage-probe]').forEach(b=>delete b.dataset.vantageProbe);
 const buttons=[...document.querySelectorAll('#decisions button,#run-footer button,#opponent-playback button,[data-server-action],#table [data-card],dialog[open] button')].filter(visible).map((b,i)=>{b.dataset.vantageProbe=String(i);return {selector:'[data-vantage-probe="'+i+'"]',text:b.textContent.trim(),data:{...b.dataset,command:b.dataset.command||b.dataset.inspectCommand}}});
 const card=c=>({id:c.id,number:c.number,type:c.type,title:c.title,hidden:c.hidden,advancement:c.advancement,counters:c.counters,canScore:c.canScore,advancementRequirement:c.advancementRequirement});
 const p=s?.[s.side];
 return {busy:window.localTable?.busy,version:s?.version,turn:s?.turn,side:s?.side,active:s?.active,phase:s?.phase,terminal:s?.terminal,buttons,
 player:p&&{credits:p.credits,clicks:p.clicks,tags:p.tags,memory:p.memory-p.memoryUsed,hand:p.hand.map(card),rig:p.rig&&Object.values(p.rig).flat().map(card)},
 corpDiscard:s?.corp.discard.map(card),servers:s?.corp.servers.map(v=>({name:v.name,ice:v.ice.map(card),root:v.root.map(card)})),
 run:s?.run&&{server:s.run.server,encountering:s.run.encountering,card:s.run.card,tools:s.run.tools},
 options:s?.decision?.commands.flatMap(c=>c.options.map(o=>({command:c.command,index:o.index,label:o.label,number:o.card?.number,type:o.card?.type,cardId:o.card?.id,sourceId:o.sourceId,abilityKind:o.abilityKind,server:o.server,hostLabel:o.hostLabel,cost:o.cost,payment:o.payment,multi:o.multi,subroutine:o.subroutine}))),
 gameover:!!document.querySelector('.gameover [data-rematch]'),toast:document.querySelector('#toast')?.textContent};})()`;
 function score(o,v){
  const p=v.player,action=/^(Runner 1\.3|Corp 2\.2)$/.test(v.phase?.identifier),mine=v.side;
  if(o.command==='score')return 1000;
  if(o.command==='steal')return 1000;
  if(/Méliès/.test(v.phase?.title||'')&&o.label==='R&D')return 950;
  if(o.command==='rez')return o.type==='ice'&&v.run?900:o.number===36065?880:o.type==='asset'?600:100;
  if(o.command==='pay')return 800+(o.payment?.source==='bad publicity'?30:o.payment?.source==='credit pool'?10:20)+(o.payment?.amount||0);
  if(o.subroutine)return 800-o.subroutine;
  if(!action){
   if(/Pay \d+ credit/.test(o.label))return 800;
   if(/Place 1 virus|Add 1 virus/i.test(o.label))return 850;
   if(o.command==='trigger'&&o.abilityKind==='ice-reduction')return 850;
   if(o.command==='trigger'&&o.abilityKind==='break')return 840;
   if(/Decline|Keep hardware|Do not draw|Leave on top/i.test(o.label))return 650;
   if(o.command==='access')return 700;
   if(o.command==='trigger')return 600;
   if(o.command==='n')return 500;
   if(o.command==='continue')return 450;
   if(o.command==='discard')return 400;
   if(o.command==='jack')return 10;
   return 200;
  }
  if(mine==='runner'){
   const installed=new Set(p.rig?.map(c=>c.number));
   if(o.command==='trigger'&&o.number===30027)return 900;
   if(o.command==='trigger'&&o.number===36009&&(p.tags||p.hand.length<4))return 890;
   if(o.command==='play'&&o.number===30030)return 880;
   if(o.command==='install'){
    if(installed.has(o.number)&&o.number!==36024)return 20;
    const priorities=[36021,36020,30024,36004,30005,30006,30016,30025,30015,30026,30027,36024,30022,30023];
    const index=priorities.indexOf(o.number);
    if(index>=0)return 750-index*10+(o.hostLabel?.includes('R&D')?10:0);
    if(o.number===36013&&p.memory<1)return 730;
    return 15;
   }
   if(o.command==='play'&&o.number===30021&&(p.clicks===1||p.hand.length<3))return 780;
   if(p.hand.length<3&&o.command==='draw')return 760;
   if(o.command==='play'&&[30028,36012,30029,36002,36010,36018,36019].includes(o.number))return 650+(o.server==='R&D'?30:0);
   if(o.command==='trigger'&&o.number===30024)return p.credits>=Math.max(3,2*(v.servers.find(s=>s.name==='R&D')?.ice.length||0)+1)?690:50;
   if(o.command==='trigger')return 100;
   if(o.command==='run'){if(o.server==='Archives'&&!v.corpDiscard?.some(c=>c.hidden||c.type==='agenda'))return 50;const server=v.servers.find(s=>s.name===o.server),needed=server?.ice.length?5*server.ice.length+1:0;return (p.credits>=needed?550:150)+(o.server==='R&D'?20:0);}
   if(o.command==='gain')return 500;
   if(o.command==='draw')return 400;
   return 0;
  }
  const agendas=v.servers?.filter(s=>s.root.some(c=>c.type==='agenda'))||[];
  if(o.command==='play'&&[30075,36063,30064].includes(o.number))return 950;
  if(o.command==='advance'&&o.type==='agenda')return 850;
  if(o.command==='install'&&o.number===36065&&o.server==='R&D'&&!v.servers.find(s=>s.name==='R&D').root.some(c=>c.number===36065))return 930;
  if(o.command==='install'&&[30037,30071,35040,35072,35039].includes(o.number)&&!v.servers.some(s=>s.root.some(c=>c.number===o.number)))return o.server==='New remote'?920:600;
  if(o.command==='install'&&o.type==='ice'&&agendas.some(s=>s.name===o.server&&!s.ice.length))return 900;
  if(o.command==='install'&&o.type==='agenda'&&!agendas.length)return o.server==='New remote'?800:650;
  if(o.command==='install'&&o.type==='ice'&&o.server==='R&D'&&!v.servers.find(s=>s.name==='R&D').ice.length)return 750;
  if(o.command==='install'&&o.type==='ice'&&o.server==='HQ'&&!v.servers.find(s=>s.name==='HQ').ice.length)return 740;
  if(o.command==='draw')return p.credits>=8&&!p.hand.some(c=>c.type==='agenda')&&p.hand.length<8?700:400;
  if(o.command==='gain')return 500;
  if(o.command==='trigger')return 300;
  if(o.command==='n')return 100;
  return 20;
 }
 const began=Date.now(),steps=[];let last,unchanged=0,previous='';
 while(steps.length<maxClicks&&Date.now()-began<maxMs){
  const result=await tools.mcp__t3_code__preview_evaluate({tabId,expression:readExpression});
  const value=result.structuredContent?.value||result.content?.filter(c=>c.type==='text').map(c=>{try{return JSON.parse(c.text).value;}catch{}}).find(Boolean);
  if(!value)return {reason:'read failed',result,steps};
  last=value;
  if(value.gameover)return {reason:'game complete',last,steps};
  const signature=JSON.stringify([value.version,value.buttons.map(b=>b.text)]);unchanged=signature===previous?unchanged+1:0;previous=signature;
  if(unchanged>12)return {reason:'UI did not advance',last,steps};
  let button=value.buttons.find(b=>'opponentSkip'in b.data);
  button ||= value.buttons.find(b=>'rezReviewContinue'in b.data);
  button ||= value.buttons.find(b=>'clickBreakAll'in b.data);
  button ||= value.buttons.find(b=>'planReview'in b.data&&!('manualFunding'in b.data));
  button ||= value.buttons.find(b=>'planStep'in b.data);
  if(!button&&value.busy){await new Promise(r=>setTimeout(r,150));continue;}
  if(!button){
   const ranked=[...(value.options||[])].sort((a,b)=>score(b,value)-score(a,value));
   for(const option of ranked){
    if(option.multi)continue;
    button=value.buttons.find(b=>b.data.command===option.command&&Number(b.data.option)===option.index&&!('group'in b.data));
    if(!button&&option.command==='rez')button=value.buttons.find(b=>b.data.card===option.cardId);
    if(!button&&option.command==='install')button=value.buttons.find(b=>b.data.installCard===option.cardId);
    if(!button&&option.command==='run')button=value.buttons.find(b=>b.data.serverAction===option.server);
    if(!button&&option.command==='pay')button=value.buttons.find(b=>b.data.paySource&&b.text.includes(option.payment.source));
    if(!button)button=value.buttons.find(b=>b.data.command===option.command&&'group'in b.data);
    if(button)break;
   }
  }
  if(!button)return {reason:'Needs manual UI choice',last,steps};
  const clicked=pageClick?await tools.mcp__t3_code__preview_evaluate({tabId,expression:`(()=>{const b=document.querySelector(${JSON.stringify(button.selector)});if(!b||b.disabled)return {clicked:false};b.scrollIntoView({block:'nearest'});b.click();return {clicked:true};})()`}):await tools.mcp__t3_code__preview_act({tabId,action:'click',selector:button.selector,timeoutMs:4000});
  if(clicked.isError){
    const after=await tools.mcp__t3_code__preview_evaluate({tabId,expression:`({version:window.localTable?.state?.version,targetPresent:!!document.querySelector(${JSON.stringify(button.selector)})})`});
    const observed=after.structuredContent?.value;
    if(!observed||observed.version===value.version&&observed.targetPresent)return {reason:'click failed',clicked,last,steps};
  }
  steps.push({version:value.version,turn:value.turn,phase:value.phase,text:button.text,data:button.data,interaction:pageClick?'DOM button click':'preview_act',...(clicked.isError?{toolTimedOutAfterUIAdvanced:true}:{})});
  await new Promise(r=>setTimeout(r,120));
 }
 return {reason:'iteration complete',last,steps};
})
