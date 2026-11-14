'use strict';
const assert=require('node:assert/strict');
const {createServer}=require('../server.cjs');
const {chromium}=require('/tmp/nt-mockup-tools/node_modules/playwright-core');
const replay=require('./fixtures/palisade-ansel-install.json');
(async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const errors=[];
 try{
  browser=await chromium.launch({headless:true,executablePath:'/Users/nicanadian/Library/Caches/ms-playwright/chromium-1193/chrome-mac/Chromium.app/Contents/MacOS/Chromium'});
  for(const width of [1280,390]){
   const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(save=>localStorage.setItem('netrunner-local-table-v1',JSON.stringify(save)),{...replay,choices:replay.choices.slice(0,replay.choices.findIndex(c=>c.version===545))});
   await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.click('#resume-button');
   await page.waitForFunction(()=>localTable.state?.version===545&&!localTable.busy);
   const target=page.locator('#decisions [data-command="install"][data-option="20"]');
   assert.match(await target.innerText(),/Palisade → R&D/);
   assert.match(await target.innerText(),/behind the Runner's current position/);
   assert.match(await target.innerText(),/will not be approached during this run/);
   await target.scrollIntoViewIfNeeded();assert(await target.isVisible());
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.equal(await page.evaluate(()=>localTable.state.version),545,'Showing the warning does not submit an action');
   console.log(`PASS exact Ansel install UI at ${width}px: R&D destination and current-run exclusion are visible before selecting Palisade`);
   await page.close();
  }
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
