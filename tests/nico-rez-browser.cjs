'use strict';
// Native replay plus an alternate branch, against a disposable local server.
const assert=require('node:assert/strict');
const {createServer}=require('../server.cjs');
const {chromium}=require('/tmp/nt-mockup-tools/node_modules/playwright-core');
const replay=require('./fixtures/nico-rez-shortage.json');
(async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const errors=[];
 try{
  browser=await chromium.launch({headless:true,executablePath:'/Users/nicanadian/Library/Caches/ms-playwright/chromium-1193/chrome-mac/Chromium.app/Contents/MacOS/Chromium'});
  for(const funded of [false,true]){
   const page=await browser.newPage({viewport:{width:funded?390:1280,height:844},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
   const choices=funded?replay.choices.slice(0,-2):replay.choices;
   await page.addInitScript(save=>localStorage.setItem('netrunner-local-table-v1',JSON.stringify(save)),{...replay,choices});
   await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.click('#resume-button');
   await page.waitForFunction(()=>localTable.state && !localTable.busy);
   if(funded)for(let credit=1;credit<=2;credit++){
    await page.locator('#decisions [data-command="gain"]').click();
    await page.waitForFunction(amount=>localTable.state.corp.credits===amount&&!localTable.busy,credit);
   }
   await page.locator('#table [data-card="c11"]').click();
   const dialog=page.locator('#inspect-dialog');await dialog.waitFor();
   if(!funded){
    const disabled=dialog.getByRole('button',{name:'Rez Nico Campaign · 2 credits',exact:true});
    assert(await disabled.isVisible());assert(await disabled.isDisabled());
    assert.match(await dialog.innerText(),/Cannot rez Nico Campaign: 2 credits required; 0 eligible credits available/);
   }else{
    const rez=dialog.locator('[data-inspect-command="rez"]');assert(await rez.isVisible());await rez.click();
    await page.waitForFunction(()=>localTable.state.corp.servers.flatMap(s=>s.root).find(c=>c.id==='c11')?.rezzed && !localTable.busy);
    assert.equal(await page.evaluate(()=>localTable.state.corp.credits),0);
   }
   console.log(`PASS Nico browser: ${funded?'two gained credits enable card-inspector rez (mobile)':'original replay shows disabled rez and exact shortage (desktop)'}`);
   await page.close();
  }
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
