'use strict';
const assert=require('node:assert/strict');
const {createServer}=require('../server.cjs');
const {chromium}=require('/tmp/nt-mockup-tools/node_modules/playwright-core');
const replay=require('./fixtures/nico-optional-rez-end-turn.json');
(async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const errors=[];
 try{
  browser=await chromium.launch({headless:true,executablePath:'/Users/nicanadian/Library/Caches/ms-playwright/chromium-1193/chrome-mac/Chromium.app/Contents/MacOS/Chromium'});
  for(const fromCard of [false,true]){
   const page=await browser.newPage({viewport:{width:fromCard?390:1280,height:844},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(save=>{
    localStorage.setItem('netrunner-local-table-v1',JSON.stringify(save));
    localStorage.setItem('netrunner-streamline-timing','false');
   },replay);
   await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.click('#resume-button');
   await page.waitForFunction(()=>localTable.state?.version===426&&!localTable.busy);
   assert.match(await page.locator('#decisions').innerText(),/Rezzing cards is optional/);
   assert(await page.getByRole('button',{name:'End action phase',exact:true}).isVisible());
   if(fromCard){
    await page.locator('#table [data-card="c10"]').click();
    const close=page.getByRole('button',{name:'Leave Nico Campaign unrezzed · close card',exact:true});
    assert(await close.isVisible());await close.click();
    assert.equal(await page.evaluate(()=>localTable.state.version),426,'Closing the card submits no choice');
    await page.locator('#table [data-card="c10"]').click();
    await page.getByRole('button',{name:'End action phase · leave Nico Campaign unrezzed',exact:true}).click();
   }else await page.getByRole('button',{name:'End action phase',exact:true}).click();
   await page.waitForFunction(()=>localTable.state?.version===429&&!localTable.busy);
   assert(await page.getByRole('button',{name:'Continue without rezzing',exact:true}).isVisible());
   await page.getByRole('button',{name:'Continue without rezzing',exact:true}).click();
   await page.waitForFunction(()=>localTable.state?.turn===18&&!localTable.busy);
   const result=await page.evaluate(()=>({turn:localTable.state.playerTurn,credits:localTable.state.corp.credits,
    nico:localTable.state.corp.servers.flatMap(s=>s.root).find(c=>c.id==='c10')}));
   assert.equal(result.turn,'runner');assert.equal(result.credits,5);assert.equal(result.nico.rezzed,false);
   const added=await page.evaluate(count=>localTable.session.choices.slice(count),replay.choices.length);
   assert.deepEqual(added.map(c=>c.command),['n','n'],'Ending the Corp turn must not submit a rez');
   console.log(`PASS Nico optional rez: ${fromCard?'mobile card view (including close without action)':'desktop decision panel'} ends Corp turn, keeps 5 credits and Nico unrezzed; full-control response skip is explicit`);
   await page.close();
  }
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
