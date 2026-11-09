'use strict';
// Reproduce the audited strategic choices through real UI controls, from fresh
// shuffles with the audited seeds. No gameplay evaluate/engine choose calls.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {createServer}=require('../server.cjs');
const {chromium}=require('/tmp/nt-mockup-tools/node_modules/playwright-core');
(async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:'/Users/nicanadian/Library/Caches/ms-playwright/chromium-1193/chrome-mac/Chromium.app/Contents/MacOS/Chromium'});
 fs.mkdirSync('eval/click-flow',{recursive:true});
 try{
  for(const side of ['runner','corp']){
   const baseline=require(`../eval/click-audit/${side}.json`),errors=[],trace=[];
   const page=await browser.newPage({viewport:{width:1280,height:844},reducedMotion:'reduce'});page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
   // Narration pacing alone is accelerated. Gameplay code, native worker,
   // resources, costs, assistance policies and every UI control are unchanged.
   await page.route('**/app/table.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('app/table.js','utf8').replace('const OPPONENT_PACE = 1400;','const OPPONENT_PACE = 20;')}));
   await page.addInitScript(session=>{
    localStorage.setItem('netrunner-local-table-v1',JSON.stringify({...session,choices:[]}));
    window.clickEvents=[];
    addEventListener('click',e=>{const b=e.target.closest('button,summary');if(b)clickEvents.push({n:clickEvents.length+1,label:b.innerText.replace(/\s+/g,' ').trim(),data:{...b.dataset},version:window.localTable?.state?.version,phase:window.localTable?.state?.phase.identifier});},true);
   },baseline.session);
   await page.goto(`http://127.0.0.1:${server.address().port}`);await page.click('#resume-button');
   const stable=async()=>{
    for(let i=0;i<1500;i++){
     const ready=await page.evaluate(()=>!!localTable.state&&!localTable.busy);
     if(ready){const v=await page.evaluate(()=>localTable.state.version);await page.waitForTimeout(35);if(await page.evaluate(v=>!localTable.busy&&localTable.state.version===v,v))return;}
     await page.waitForTimeout(20);
    }throw Error('UI did not settle');
   };
   for(let step=0;step<350;step++){
    await stable();const s=await page.evaluate(()=>localTable.state);if(s.terminal)break;
    const ci=baseline.session.choices.findIndex(c=>c.version===s.version);let c=baseline.session.choices[ci];
    // Assisted timing defers the original early Whitespace rez to its approach
    // window. This intentionally changes native pass order, not the defence.
    if(!c && side==='corp' && s.phase.identifier==='Run 2.1'){
     const rez=s.decision.commands.find(g=>g.command==='rez')?.options.find(o=>o.card?.title==='Whitespace'&&!o.secondary);
     if(rez)c={version:s.version,command:'rez',index:rez.index};
    }
    assert.ok(c,`${side}: no audited choice for version ${s.version}`);
    const group=s.decision.commands.find(g=>g.command===c.command),o=group?.options.find(o=>o.index===c.index);assert.ok(o,JSON.stringify(c));
    let control;
    if(c.command==='trigger'&&o.abilityKind&&!s.phase.source){const plan=page.locator(`[data-plan-review="${o.card.id}"]:not(:disabled)`);if(await plan.count())control=plan;}
    if(!control&&['install','play'].includes(c.command)&&o.card&&s[side].hand.some(h=>h.id===o.card.id)){
     await page.locator(`#hand [data-card="${o.card.id}"]`).click();
     const replace=c.command==='install'&&baseline.session.choices[ci+1]?.command==='trash';
     control=page.locator(replace?`#inspect-dialog [data-install-options="${c.index}"]`:`#inspect-dialog [data-inspect-command="${c.command}"][data-option="${c.index}"]`);
    }
    if(!control){
     const dialog=await page.locator('dialog[open]').count()?'dialog[open]':'#game';
     const direct=page.locator(`${dialog} [data-command="${c.command}"][data-option="${c.index}"]`);
     const exact=direct.filter({visible:true});
     if(await exact.count())control=exact.first();
     else if(await direct.count()){
      const details=direct.first().locator('xpath=ancestor::details[1]');
      if(await details.count()){if(!(await details.evaluate(d=>d.open)))await details.locator('summary').click();control=direct.first();}
     }
     if(!control){
      const grouped=page.locator(`#decisions [data-command="${c.command}"][data-group]`);
      assert.ok(await grouped.count(),`${side} v${s.version}: control not found ${c.command}`);
      if(group.options.length===1)control=grouped;
      else {await grouped.click();control=page.locator(`#decisions [data-command="${c.command}"][data-option="${c.index}"]`);}
     }
    }
    trace.push({version:s.version,command:c.command,index:c.index,label:await control.innerText()});
    await control.click();
   }
   await stable();const actual=await page.evaluate(()=>({session:localTable.session,state:localTable.state,events:clickEvents}));
   assert.equal(actual.state.terminal?.winner,side);
   assert.equal(actual.state.corp.points,baseline.final.corp.points);assert.equal(actual.state.runner.points,baseline.final.runner.points);
   assert.deepEqual(actual.state.diagnostics,[]);
   if(side==='runner')assert.deepEqual(actual.session.choices,baseline.session.choices,'Runner keeps the exact native trace');
   else {
    const decisions=list=>list.filter(c=>c.command!=='n').map(({version,...c})=>c);
    assert.deepEqual(decisions(actual.session.choices),decisions(baseline.session.choices),'Corp keeps every non-pass choice; only the defensive rez timing moves');
   }
   assert.deepEqual(errors,[]);
   const result={side,total:actual.events.length,trace,...actual,errors,narrationPaceMs:20,method:'Audited strategic choices reproduced through UI from fresh audited-seed shuffle; only narration delay accelerated.'};
   fs.writeFileSync(`eval/click-flow/${side}-browser.json`,JSON.stringify(result,null,2)+'\n');await page.screenshot({path:`eval/click-flow/${side}-result.png`,fullPage:true});
   console.log(`PASS ${side} full UI match: ${result.total} activations, ${actual.session.choices.length} recorded native choices, winner ${actual.state.terminal.winner}, points ${actual.state.corp.points}-${actual.state.runner.points}, no page errors.`);
   await page.close();
  }
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
