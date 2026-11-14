// Browser regression against the running development server: node tests/rez-warning-browser.cjs
const assert=require('node:assert/strict'),{chromium}=require('/tmp/nt-mockup-tools/node_modules/playwright-core');
const replay=require('./fixtures/ping-rez-affordability.json');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Users/nicanadian/Library/Caches/ms-playwright/chromium-1193/chrome-mac/Chromium.app/Contents/MacOS/Chromium'});const errors=[];
 try{for(const outcome of ['rez','pass']){
  const page=await browser.newPage({viewport:{width:1280,height:844},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(save=>localStorage.setItem('netrunner-local-table-v1',JSON.stringify(save)),{engine:replay.engine,config:replay.config,choices:replay.choices.slice(0,replay.choices.findIndex(c=>c.version===800))});
  await page.goto('http://localhost:5173/');await page.click('#resume-button');await page.waitForFunction(()=>localTable.state?.version===800&&!localTable.busy,{},{timeout:10000}).catch(async e=>{console.log(await page.evaluate(()=>({version:localTable.state?.version,phase:localTable.state?.phase,busy:localTable.busy,decisions:document.querySelector('#decisions').innerText})));console.log(errors);throw e;});
  assert.match(await page.locator('#run-status').innerText(),/REZ TITHE TO ACTIVATE IT/);
  await page.click('#run-footer [data-command="n"]');await page.locator('#rez-warning-dialog[open]').waitFor();
  assert.equal(await page.evaluate(()=>localTable.state.version),800);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'rez-warning-back');
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>localTable.state.version),800);
  await page.click('#run-footer [data-command="n"]');await page.click('#rez-warning-back');assert.equal(await page.evaluate(()=>localTable.state.version),800);
  await page.setViewportSize({width:390,height:844});await page.click('#run-footer [data-command="n"]');
  assert(await page.locator('#rez-warning-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth));
  await page.click(outcome==='rez'?'#rez-warning-rez':'#rez-warning-confirm');
  await page.waitForFunction(()=>localTable.state.version!==800);
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('netrunner-local-table-v1')));
  assert.equal(save.choices.at(-1).command,outcome==='rez'?'rez':'n');
  console.log(`PASS actual native Tithe approach: warning, no advance before confirmation, Escape/back, mobile, ${outcome}`);
  await page.close();
 }
 const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(save=>localStorage.setItem('netrunner-local-table-v1',JSON.stringify(save)),{engine:replay.engine,config:replay.config,choices:replay.choices.slice(0,replay.choices.findIndex(c=>c.version===770))});
 await page.goto('http://localhost:5173/');await page.click('#resume-button');await page.waitForFunction(()=>localTable.state?.version===770&&!localTable.busy);
 if(!await page.locator('[data-command="advance"][data-option="0"]').count())await page.locator('[data-command="advance"][data-group]').click();
 if(await page.locator('[data-command="advance"][data-option="0"]').count())await page.locator('[data-command="advance"][data-option="0"]').first().click();
 await page.locator('[data-rez-review-continue]').waitFor();
 assert.match(await page.locator('#opponent-playback').innerText(),/Could not rez Ping: 2 credits required; 1 eligible credit available/);
 await page.waitForTimeout(1800);
 assert.match(await page.locator('#opponent-playback').innerText(),/Runner passes Ping unrezzed/);
 assert.equal(await page.locator('#opponent-playback [data-opponent-skip]').count(),0);
 await page.click('[data-rez-review-continue]');
 console.log('PASS actual unaffordable Ping: mandatory visible shortage review, no timed advance or skip control');
 await page.close();assert.deepEqual(errors,[]);}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
