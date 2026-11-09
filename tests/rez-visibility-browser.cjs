'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('/tmp/nt-mockup-tools/node_modules/playwright-core');
const {createServer}=require('../server.cjs');
const replay=require('./fixtures/ping-rez-affordability.json');
(async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:'/Users/nicanadian/Library/Caches/ms-playwright/chromium-1193/chrome-mac/Chromium.app/Contents/MacOS/Chromium'}),errors=[];
 const base=`http://127.0.0.1:${server.address().port}`;
 async function open(version,counterfactual=false){
  const page=await browser.newPage({viewport:{width:1280,height:844},reducedMotion:'reduce'});page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  if(counterfactual)await page.route('**/engine/worker.js',route=>{
   const setup=`if(choice.version===770){corp.creditPool=2;playerTurn=runner;runner.clickTracker=4;attackedServer=corp.remoteServers.find(s=>s.serverName==='Remote 2');approachIce=attackedServer.ice.length-1;encountering=false;movement=false;ChangePhase(phases.runApproachIce);}`;
   return route.fulfill({contentType:'text/javascript',body:fs.readFileSync('engine/worker.js','utf8').replace('NR.choose(choice);','NR.choose(choice);'+setup)});
  });
  const prefix=replay.choices.findIndex(c=>c.version===version);assert.ok(prefix>=0);
  await page.addInitScript(saved=>localStorage.setItem('netrunner-local-table-v1',JSON.stringify(saved)),{...replay,choices:replay.choices.slice(0,prefix)});
  await page.goto(base);await page.click('#resume-button');await page.waitForFunction(()=>localTable.state?.decision&&!localTable.busy);return page;
 }
 try{
  fs.mkdirSync('eval/rez-visibility',{recursive:true});
  const page=await open(770);
  await page.evaluate(()=>{window.rezPlayback=[];new MutationObserver(()=>{const p=document.querySelector('#opponent-playback');if(!p.hidden){const caption=p.querySelector('h2')?.innerText,detail=p.querySelector('p')?.innerText;if(!rezPlayback.some(e=>e.caption===caption&&e.detail===detail))rezPlayback.push({caption,detail});}}).observe(document.querySelector('#opponent-playback'),{subtree:true,childList:true,characterData:true});});
  await page.click('#decisions [data-command="advance"][data-group]');
  if(await page.evaluate(()=>localTable.state.version===770&&!localTable.busy))await page.click('#decisions [data-command="advance"][data-option="0"]');
  await page.waitForFunction(()=>!localTable.busy&&localTable.state?.version===800,{},{timeout:45000});
  const notices=await page.evaluate(()=>rezPlayback);
  assert.ok(notices.some(e=>e.caption==='Runner passes Ping unrezzed'&&/2 credits required; 1 eligible credit available/.test(e.detail)));
  assert.ok(notices.some(e=>e.caption==='Runner passes Palisade unrezzed'&&/3 credits required/.test(e.detail)));
  assert.equal(await page.locator('#decisions [data-command="rez"][data-option="0"]').isVisible(),true);
  assert.equal(await page.locator('#decisions [data-command="rez"][data-option="0"]').evaluate(e=>!!e.closest('details')),false);
  const ping=await page.evaluate(()=>localTable.state.corp.servers.find(s=>s.name==='Remote 2').ice.find(c=>c.title==='Ping').id);
  await page.click(`#table [data-card="${ping}"]`);assert.match(await page.locator('.rez-availability').innerText(),/already passed Ping/);
  await page.screenshot({path:'eval/rez-visibility/passed-ping-inspector.png',fullPage:true});await page.click('#inspect-dialog [data-close]');
  await page.click('#run-footer [data-command="n"]');await page.waitForFunction(()=>localTable.state?.terminal&&!localTable.busy,{},{timeout:45000});
  assert.equal(await page.evaluate(()=>localTable.state.runner.points),9);
  fs.writeFileSync('eval/rez-visibility/browser-playback.json',JSON.stringify(await page.evaluate(()=>rezPlayback),null,2)+'\n');
  await page.close();
  // Same board, explicitly funded with 2 credits: Ping is a real primary stop.
  const affordable=await open(800,true);
  assert.equal(await affordable.evaluate(()=>localTable.state.run.card.title),'Ping');
  const action=affordable.locator('#decisions [data-command="rez"]').filter({visible:true});
  assert.match(await action.innerText(),/Rez Ping/);assert.equal(await action.evaluate(e=>!!e.closest('details')),false);
  await affordable.waitForTimeout(250);assert.equal(await affordable.evaluate(()=>localTable.state.run.card.title),'Ping');
  await affordable.mouse.move(20,30);await affordable.screenshot({path:'eval/rez-visibility/affordable-ping.png',fullPage:true});
  await action.click();await affordable.waitForFunction(()=>!localTable.busy&&localTable.state.corp.servers.some(s=>s.ice.some(c=>c.title==='Ping'&&c.rezzed)),{},{timeout:30000});
  await affordable.waitForFunction(()=>!localTable.busy&&localTable.state.runner.tags===1,{},{timeout:30000});
  assert.equal(await affordable.evaluate(()=>localTable.state.corp.credits),0);assert.equal(await affordable.evaluate(()=>localTable.state.runner.tags),1);
  await affordable.close();assert.deepEqual(errors,[]);
  console.log('PASS real worker/UI: Ping and Palisade unaffordability explained before Tithe pause; passed-Ping inspector explains timing; with 2 credits Ping stops, rezzes, charges 2 and gives the tag.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
