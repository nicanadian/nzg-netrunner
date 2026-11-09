'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {createServer}=require('../server.cjs');
const {chromium}=require('/tmp/nt-mockup-tools/node_modules/playwright-core');
(async()=>{const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;const browser=await chromium.launch({headless:true,executablePath:'/Users/nicanadian/Library/Caches/ms-playwright/chromium-1193/chrome-mac/Chromium.app/Contents/MacOS/Chromium'});try{
 for(const zone of ['HQ','RnD'])for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});page.setDefaultTimeout(6000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/engine/worker.js',async route=>{let source=fs.readFileSync('engine/worker.js','utf8');source=source.replace('NR.boot(data.config);',`NR.boot(data.config);const accessTestCard=AllCards(corp).find(c=>c.setNumber===30075);MoveCard(accessTestCard,corp.${zone}.cards);playerTurn=runner;attackedServer=corp.${zone};approachIce=-1;encountering=false;movement=false;accessedCards={root:[],cards:[]};accessingCard=accessTestCard;ChangePhase(phases.runAccessingCard);`);await route.fulfill({contentType:'text/javascript',body:source})});
  await page.goto(base);await page.click('#start-button');await page.waitForFunction(()=>localTable.state?.access&&!localTable.busy);
  const before=await page.evaluate(()=>({version:localTable.state.version,steps:localTable.state.steps,choices:localTable.session.choices.length,card:localTable.state.access}));assert.equal(before.card.hidden,false);assert.equal(before.card.number,30075);
  if(width<901)await page.click('[data-run-pane="ice"]');
  await page.locator('.run-card-summary').click();await page.waitForFunction(()=>document.getElementById('inspect-dialog').open);
  assert.match(await page.locator('#inspect-content h2').innerText(),/Hedge Fund/);assert.equal(await page.locator('.inspect-image').getAttribute('src'),'/assets/cards-display/30075-743.webp');assert.match(await page.locator('.inspect-copy').innerText(),/Gain 9/);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#inspect-dialog').evaluate(d=>d.open),false);
  assert.deepEqual(await page.evaluate(()=>({version:localTable.state.version,steps:localTable.state.steps,choices:localTable.session.choices.length})),{version:before.version,steps:before.steps,choices:before.choices});
  const otherHQ=await page.evaluate(()=>localTable.state.corp.hand.filter(c=>c.id!==localTable.state.access.id));assert.ok(otherHQ.every(c=>c.hidden&&c.number===undefined),'Other HQ cards stay concealed');assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS accessed-card inspector: HQ and R&D, desktop and mobile, full title/text/art, no game choices or resource changes, other HQ cards remain hidden.');
}finally{await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exit(1)});
