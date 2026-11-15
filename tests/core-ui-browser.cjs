'use strict';
// Initial UI regression checks; complete browser-use matches are tracked separately.
const assert=require('node:assert/strict');
const {createServer}=require('../server.cjs');
const {chromium}=require('playwright-core');
const core=require('../engine/core-decks.js');
(async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const errors=[];
 try{
  browser=await chromium.launch({headless:true,channel:'chrome'});
  for(const side of ['runner','corp']){
   const page=await browser.newPage({viewport:{width:side==='runner'?1280:390,height:844},reducedMotion:'reduce'});
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()}: ${r.url()}`);});
   await page.addInitScript(()=>localStorage.setItem('netrunner-local-table-v1','{"gateway":"preserved"}'));
   await page.goto(`http://127.0.0.1:${server.address().port}/?core-preview=1`);
   assert.match(await page.locator('#lobby').innerText(),/Development preview/);
   await page.locator(`[data-side="${side}"]`).click();
   assert.equal(await page.locator('#your-deck optgroup').count(),side==='runner'?9:12);
   await page.click('#deck-button');assert.match(await page.locator('#deck-content').innerText(),/Phoenix/);assert.match(await page.locator('#deck-content').innerText(),/Project Ingatan/);
   await page.locator('#deck-dialog [data-close]').click();await page.click('#start-button');
   await page.waitForFunction(()=>localTable.state?.phase.identifier.includes('Mulligan')&&!localTable.busy);
   assert(await page.getByRole('button',{name:'Keep this hand',exact:true}).isVisible());
   assert(await page.getByRole('button',{name:/mulligan/i}).isVisible());
   assert.equal(await page.evaluate(()=>localTable.session.config.cardPool),'core-v1');
   assert.equal(await page.evaluate(()=>localTable.session.engine),core.engine);
   assert.equal(await page.evaluate(()=>localStorage.getItem('netrunner-local-table-v1')),'{"gateway":"preserved"}');
   await page.click('#runner-identity [data-card]');assert.match(await page.locator('#inspect-dialog').innerText(),/first time each turn/i);await page.locator('#inspect-dialog [data-close]').click();
   await page.reload();await page.click('#resume-button');await page.waitForFunction(()=>localTable.state?.phase.identifier.includes('Mulligan')&&!localTable.busy);
   assert.equal(await page.evaluate(()=>localTable.session.config.rulesVersion),core.rulesVersion);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   console.log(`PASS Core preview ${side}: deck lists, card art/text, keep/mulligan, versioned worker, isolated save and reload/resume (${side==='corp'?'mobile':'desktop'})`);
   await page.close();
  }
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
