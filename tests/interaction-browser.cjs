'use strict';
// Real app + worker checks. Every gameplay input is a DOM click; state is read-only.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {createServer}=require('../server.cjs');
const {chromium}=require('/tmp/nt-mockup-tools/node_modules/playwright-core');
const executablePath='/Users/nicanadian/Library/Caches/ms-playwright/chromium-1193/chrome-mac/Chromium.app/Contents/MacOS/Chromium';
const fixtures=Object.fromEntries(['runner','corp'].map(side=>[side,require(`../eval/click-audit/${side}.json`)]));
(async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,executablePath}),errors=[];
 fs.mkdirSync('eval/click-flow',{recursive:true});
 const idle=async page=>{await page.waitForFunction(()=>localTable.state && !localTable.busy && (localTable.state.decision||localTable.state.terminal));await page.waitForTimeout(120);if(await page.evaluate(()=>localTable.busy))await idle(page);};
 const state=page=>page.evaluate(()=>localTable.state);
 const act=async(page,selector)=>{await page.locator(selector).first().click();await idle(page);};
 async function open(side,version,width=1280,full=false){
  const data=fixtures[side],prefix=data.session.choices.findIndex(c=>c.version===version);assert.ok(prefix>=0);
  const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({session,full})=>{localStorage.setItem('netrunner-local-table-v1',JSON.stringify(session));if(full){localStorage.setItem('netrunner-skip-boost-windows','false');localStorage.setItem('netrunner-streamline-timing','false');}}, {session:{...data.session,choices:data.session.choices.slice(0,prefix)},full});
  await page.goto(base);await page.click('#resume-button');await idle(page);return page;
 }
 try{
  // Two normal installs: one quoted click, no second sidebar confirmation.
  const normal=await open('runner',31);
  await normal.click('#hand [data-card="c61"]');await act(normal,'[data-inspect-command="install"]');
  assert.equal((await state(normal)).runner.credits,4);assert.equal((await state(normal)).runner.clicks,3);
  await normal.click('#hand [data-card="c58"]');await act(normal,'[data-inspect-command="install"]');
  assert.equal((await state(normal)).runner.credits,1);assert.equal((await state(normal)).runner.clicks,2);
  assert.equal(await normal.locator('dialog[open]').count(),0);assert.equal((await state(normal)).installation,null);
  // Replacement stays in the install modal, with an escape route from other inspectors.
  const install=await open('runner',34,390);
  await install.click('#hand [data-card="c58"]');await act(install,'[data-install-options]');
  assert.equal(await install.locator('#install-dialog').evaluate(d=>d.open),true);
  assert.match(await install.locator('#install-content').innerText(),/3 credits/);
  await install.click('#install-dialog [data-close]');await install.click('#hand [data-card="c54"]');
  assert.match(await install.locator('.pending-install-notice').innerText(),/Finish installing Cleaver/);
  await install.click('[data-finish-install]');assert.equal(await install.locator('#install-dialog').evaluate(d=>d.open),true);
  await install.screenshot({path:'eval/click-flow/mobile-install-options.png',fullPage:true});
  await install.setViewportSize({width:320,height:844});
  assert.equal(await install.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await install.locator('#install-dialog').evaluate(d=>{const r=d.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}),true);
  const before=(await state(install)).runner;await act(install,'#install-dialog [data-cancel]');
  assert.equal((await state(install)).runner.credits,before.credits);assert.equal((await state(install)).runner.clicks,before.clicks);
  await install.click('#hand [data-card="c58"]');await act(install,'[data-install-options]');
  await act(install,'#install-dialog [data-command="trash"]');
  assert.equal((await state(install)).runner.rig.programs.some(c=>c.title==='Fermenter'),false);
  assert.equal((await state(install)).runner.rig.programs.some(c=>c.title==='Cleaver'),true);
  // Explicit host replacement removes Botulus while retaining native install costs.
  const replace=await open('corp',452);
  await replace.click('#hand [data-card="c33"]');await act(replace,'[data-install-options="1"]');
  await act(replace,'#install-dialog [data-command="trash"]');
  const serverAfter=(await state(replace)).corp.servers.find(s=>s.name==='Remote 0');
  assert.equal(serverAfter.ice[0].title,'Whitespace');assert.equal(serverAfter.ice.some(c=>c.hosted.length),false);
  assert.equal((await state(replace)).corp.credits,10);
  // A single full-break action spends only the displayed three-credit quote.
  const breaker=await open('runner',184);
  assert.match(await breaker.locator('[data-plan-review="c58"]').innerText(),/Break all · 3 credits/);
  const funds=(await state(breaker)).runner.credits;await act(breaker,'[data-plan-review="c58"]');
  await breaker.waitForFunction(()=>!localTable.busy&&localTable.state.phase.identifier==='Run 4.3');
  const broken=await state(breaker);assert.equal(broken.runner.credits,funds-3);assert.ok(broken.run.card.subroutines.every(s=>s.broken));
  assert.match(await breaker.locator('#action-receipt').innerText(),/All subroutines broken.*Spent 3 credits/s);
  assert.equal(await breaker.locator('[data-opponent-pause]').filter({hasText:'Resume'}).count(),0);
  await breaker.screenshot({path:'eval/click-flow/break-complete.png',fullPage:true});
  // Manual boost and partial-break cancellation remain available without a plan.
  const manual=await open('runner',184);
  await manual.locator('.more-abilities summary').first().click();
  await manual.locator('[data-ability-kind="boost"][data-source-id="c58"]').focus();await manual.keyboard.press('Enter');await idle(manual);
  const paid=(await state(manual)).runner.credits;assert.equal(paid,7);
  await act(manual,'[data-ability-kind="break"][data-source-id="c58"]');
  await act(manual,'[data-cancel="continue"]');assert.equal((await state(manual)).runner.credits,paid);
  assert.equal((await state(manual)).run.card.subroutines[0].broken,false);await manual.close();
  // The 24 audited dead stops disappear by default; Hold priority restores them.
  const streamlined=await open('runner',142);assert.equal((await state(streamlined)).phase.identifier,'Runner 1.3');
  assert.equal((await state(streamlined)).runner.credits,4);
  const held=await open('runner',142,1280,true);await held.check('#hold-priority');
  await held.click('#menu-button');await held.check('#skip-boost-windows');await held.check('#streamline-timing');await held.click('#menu-dialog [data-close]');
  await held.waitForTimeout(150);assert.equal((await state(held)).version,142,'Preference changes do not resolve an existing decision');
  await act(held,'#decisions [data-command="n"]');assert.equal((await state(held)).phase.identifier,'Corp 1.1');
  // Spin Doctor draws automatically, then shows a receipt instead of an acknowledgement.
  const spin=await open('corp',408);
  await spin.click('#table [data-card="c38"]');await act(spin,'[data-inspect-command="rez"]');
  assert.equal((await state(spin)).phase.identifier,'Corp 2.2');
  assert.match(await spin.locator('#action-receipt').innerText(),/Automatically resolved/);
  const optional=await open('corp',76);
  assert.equal((await state(optional)).phase.source,'Send a Message');
  const decline=(await state(optional)).decision.commands.find(c=>c.command==='continue').options.find(o=>!o.card);
  assert.ok(decline,'Opening the optional target chooser retains the decline action');
  await act(optional,`[data-command="continue"][data-option="${decline.index}"]`);await optional.close();
  // Access inspection remains available after the sole-card selection is automated.
  const access=await open('runner',203);assert.equal((await state(access)).access.title,'Send a Message');
  await access.click('[data-inspect-tool="c8"]');assert.match(await access.locator('#inspect-content').innerText(),/When this agenda is scored or stolen/);
  // One-action plans still pause for credit-source decisions, before each debit.
  const funded=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});funded.on('pageerror',e=>errors.push(e.message));
  await funded.route('**/engine/worker.js',route=>{
   const setup=`function put(n,zone){const c=AllCards(n<30035?runner:corp).find(c=>c.setNumber===n);MoveCard(c,zone);c.faceUp=true;return c;}const br=put(30006,runner.rig.programs),ice=put(30072,corp.RnD.ice),clock=put(30029,runner.resolvingCards);ice.rezzed=true;ice.strength=4;clock.credits=5;runner.creditPool=3;runner.clickTracker=3;playerTurn=runner;attackedServer=corp.RnD;approachIce=0;encountering=true;ChangePhase(phases.runEncounterIce);`;
   return route.fulfill({contentType:'text/javascript',body:fs.readFileSync('engine/worker.js','utf8').replace('NR.boot(data.config);','NR.boot(data.config);'+setup)});
  });
  await funded.goto(base);await funded.click('#start-button');await idle(funded);
  await act(funded,'[data-plan-review]:not(:disabled)');
  assert.equal((await state(funded)).phase.identifier,'Pay credits');assert.equal((await state(funded)).runner.credits,3);
  await act(funded,'.credit-source:last-of-type button');
  await funded.waitForFunction(()=>!localTable.busy&&localTable.state.phase.guide?.remaining===1);
  assert.equal((await state(funded)).runner.credits,3);await act(funded,'.credit-source:last-of-type button');
  await funded.waitForFunction(()=>!localTable.busy&&localTable.state.phase.identifier==='Run 4.3');
  assert.equal((await state(funded)).runner.credits,3);assert.equal((await state(funded)).runner.resolving.find(c=>c.number===30029).counters.credits,2);
  assert.equal(await funded.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await funded.screenshot({path:'eval/click-flow/funded-break.png',fullPage:true});await funded.close();
  assert.deepEqual(errors,[]);
  for(const page of [normal,install,replace,breaker,streamlined,held,spin,access])await page.close();
  console.log('PASS real UI: quoted single-commit installs, modal recovery/cancel/replacement, Botulus host removal, one-action full break, boost-window assistance and hold priority, automatic Spin Doctor receipt, mobile layout and full accessed-card inspection.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
