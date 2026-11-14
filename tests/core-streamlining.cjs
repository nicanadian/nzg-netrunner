'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {makeGame,choices}=require('./engine-smoke.cjs');
const extraScripts=require('../engine/runtime.cjs').CORE_SCRIPTS;
const config={side:'corp',control:'scripted',seed:'core-streamline',cardPool:'core-v1',rulesVersion:'26.03-core-1',deckIds:{runner:'phoenix-core-v1',corp:'precision-design-core-v1'}};
(async()=>{
 const g=makeGame({extraScripts});try{
  g.api.boot(config);
  vm.runInContext(`var fly=AllCards(corp).find(c=>c.setNumber===35079);MoveCard(fly,corp.RnD.ice);fly.rezzed=false;var virus=AllCards(runner).find(c=>c.setNumber===30007);MoveCard(virus,runner.rig.programs);virus.virus=4;corp.creditPool=5;playerTurn=runner;attackedServer=corp.RnD;approachIce=0;encountering=false;ChangePhase(phases.runApproachIce);`,g.context);
  let s=await g.api.advance();let rez=choices(s).find(o=>o.command==='rez'&&o.card.number===35079);assert(rez);g.api.choose({version:s.version,command:rez.command,index:rez.index});s=await g.api.advance();
  assert.equal(s.assistance?.kind,'forced-effect');assert.equal(s.assistance.command,'trigger');assert(choices(s).some(o=>/Purge virus counters/.test(o.label)));
  g.api.choose({version:s.version,command:s.assistance.command,index:s.assistance.index});s=await g.api.advance();assert.equal(g.context.virus.virus,0,'Purge resolves through the same native choice');
 }finally{g.close();}
 async function checkScenario(setup,check){const r=makeGame({extraScripts});try{r.api.boot({...config,side:'runner'});vm.runInContext(setup,r.context);check(await r.api.advance());}finally{r.close();}}
 await checkScenario(`playerTurn=runner;var lie=AllCards(runner).find(c=>c.setNumber===35015);runner.tags=0;ChangePhase(phases.runnerActionMain);lie.Resolve({});`,s=>{assert.equal(s.assistance?.kind,'forced-effect');assert.equal(choices(s)[0].label,'Draw 4 cards');});
 await checkScenario(`playerTurn=runner;var lie=AllCards(runner).find(c=>c.setNumber===35015);runner.tags=2;ChangePhase(phases.runnerActionMain);lie.Resolve({});`,s=>assert.equal(s.assistance,null,'Real tag/draw choice is retained'));
 const scrounge=`playerTurn=runner;var sc=AllCards(runner).find(c=>c.setNumber===35004);sc.AddToStackPhase.player=runner;sc.AddToStackPhase.next=phases.runnerActionMain;ChangePhase(sc.AddToStackPhase);`;
 await checkScenario(scrounge,s=>assert.equal(s.assistance?.command,'add'));
 await checkScenario(scrounge+`var heapProgram=AllCards(runner).find(c=>c.setNumber===30007);MoveCard(heapProgram,runner.heap);`,s=>assert.equal(s.assistance,null,'Optional eligible heap program is never skipped'));
 const movementSetup=`var spin=AllCards(corp).find(c=>c.setNumber===30053);MoveCard(spin,corp.RnD.root);spin.rezzed=true;var ice=AllCards(corp).find(c=>c.setNumber===35079);MoveCard(ice,corp.HQ.ice);ice.rezzed=true;playerTurn=runner;attackedServer=corp.HQ;approachIce=0;movement=true;ChangePhase(phases.runDecideContinue);`;
 await checkScenario(movementSetup+'activePlayer=corp;',s=>{assert.equal(s.assistance?.kind,'optional-window');assert(choices(s).find(o=>o.command==='trigger').secondary);});
 await checkScenario(movementSetup,s=>{assert(choices(s).some(o=>o.command==='jack'));assert.equal(s.assistance,null,'Runner still chooses whether to jack out');});
 const doubleSetup=`runner.grip.slice().forEach(c=>MoveCard(c,runner.stack));var lie=AllCards(runner).find(c=>c.setNumber===35015),sc=AllCards(runner).find(c=>c.setNumber===35004),heap=AllCards(runner).find(c=>c.setNumber===30007);MoveCard(lie,runner.grip);MoveCard(sc,runner.grip);MoveCard(heap,runner.heap);runner.creditPool=10;runner.clickTracker=4;playerTurn=runner;ChangePhase(phases.runnerActionMain);`;
 await checkScenario(doubleSetup,s=>{const play=s.decision.commands.find(c=>c.command==='play');assert.equal(play.cost.clicks,2);assert.equal(play.cost.credits,1);});
 await checkScenario(doubleSetup+`MoveCard(AllCards(runner).find(c=>c.setNumber===30028),runner.grip);`,s=>{const play=s.decision.commands.find(c=>c.command==='play');assert(!play.cost.clicks,'Mixed click costs are not advertised as a one-click action');});
 console.log('PASS Core streamlining: native mandatory Flyswatter purge, sole Lie Low draw and empty Scrounge return; meaningful alternatives retained.');
})().catch(e=>{console.error(e);process.exitCode=1});
