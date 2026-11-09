'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {makeGame,choices,checkState,checkSnapshot}=require('./engine-smoke.cjs');
const {complete}=require('../scripts/complete-recorded-decks.cjs');
const CURRENT='26.03-local-1';
async function badPublicity(current){
 const g=makeGame();try{
  const config=complete('lt-starter').config;if(!current)delete config.rulesVersion;
  g.api.boot(config);
  vm.runInContext(`
   var w=AllCards(corp).find(c=>c.setNumber===30074);MoveCard(w,corp.HQ.ice);w.rezzed=true;
   var d=AllCards(corp).find(c=>c.setNumber===30046);MoveCard(d,corp.HQ.ice,0);
   var n=AllCards(corp).find(c=>c.setNumber===30037),r=NewServer('Probe remote',false);corp.remoteServers.push(r);MoveCard(n,r.root);
   playerTurn=runner;runner.clickTracker=3;runner.creditPool=9;corp.creditPool=20;corp.badPublicity=5;
   MakeRun(corp.HQ);
  `,g.context);
  const firstPhase=g.context.currentPhase.identifier;
  assert.equal(firstPhase,current?'Run 1.5':'Run 2.1');
  let s=await g.api.advance();
  const act=async cmd=>{const o=choices(s).find(o=>o.command===cmd);assert.ok(o,`${cmd} ${s.phase.title}`);g.api.choose({version:s.version,command:cmd,index:o.index});s=await g.api.advance();checkState(g);checkSnapshot(g,s);};
  if(current){assert.equal(s.phase.identifier,'Run 1.5');assert.ok(choices(s).some(o=>o.command==='rez'&&o.card?.number===30037));assert.ok(!choices(s).some(o=>o.command==='rez'&&o.card?.number===30046));}
  for(let i=0;i<30&&s.phase.title!=='Run: Subroutines';i++)await act('n');
  assert.equal(s.phase.title,'Run: Subroutines');
  await act('trigger');
  const afterLoss={pool:s.runner.credits,fund:s.runner.temporaryCredits};
  assert.deepEqual(afterLoss,current?{pool:6,fund:5}:{pool:9,fund:2});
  await act('trigger');
  const ended=!g.context.attackedServer;
  assert.equal(ended,current,'Current rules check pool only; legacy counts the remaining fund');
  if(current)assert.equal(s.runner.temporaryCredits,0);
  return {profile:current?CURRENT:'legacy',firstPhase,afterWhitespaceLoss:afterLoss,whitespaceEndedRun:ended};
 }finally{g.close();}
}
async function seamless(){
 const g=makeGame();try{
  g.api.boot(complete('lt-starter').config);
  vm.runInContext(`
   playerTurn=corp;corp.clickTracker=3;ChangePhase(phases.corpActionMain);
   var launch=AllCards(corp).find(c=>c.setNumber===30040);MoveCard(launch,corp.HQ.cards);
   var oldIce=AllCards(corp).find(c=>c.setNumber===30072);MoveCard(oldIce,corp.HQ.ice);
   var oldProgram=AllCards(runner).find(c=>c.setNumber===30032);MoveCard(oldProgram,runner.rig.programs);oldProgram.faceUp=true;
   var remote=NewServer('New target',false);corp.remoteServers.push(remote);
   var newTrap=AllCards(corp).find(c=>c.setNumber===30045);MoveCard(newTrap,remote.root);
   launch.cardsInstalledThisTurn=[newTrap];
  `,g.context);
  let s=g.api.snapshot();
  assert.ok(!choices(s).some(o=>o.command==='advance'&&o.card?.number===30072),'Basic advance still excludes Palisade');
  const play=choices(s).find(o=>o.command==='play'&&o.card?.id===g.context.launch.localId);assert.ok(play);
  g.api.choose({version:s.version,command:'play',index:play.index});s=await g.api.advance();
  const targets=choices(s).filter(o=>o.command==='continue'&&o.card);
  assert.ok(targets.some(o=>o.card.id===g.context.oldIce.localId));
  assert.ok(targets.some(o=>o.card.id===g.context.oldProgram.localId));
  assert.ok(!targets.some(o=>o.card.id===g.context.newTrap.localId));
  const target=targets.find(o=>o.card.id===g.context.oldIce.localId);
  g.api.choose({version:s.version,command:'continue',index:target.index});s=await g.api.advance();
  assert.equal(g.context.oldIce.advancement,2);assert.equal(s.corp.credits,4);checkState(g);
  return {oldNonAdvanceableIceEligible:true,oldRunnerProgramEligible:true,newUrticaEligible:false,placedCountersOnPalisade:2};
 }finally{g.close();}
}
async function fundingChoiceProbe(){
 // Branch from the end-to-end legal prefix, without injecting board state.
 const data=require('../eval/recorded-games/lt-starter-full-replay.json');
 const index=data.observations.find(o=>o.kind==='post-red-team-correction-budget').traceIndex;
 const g=makeGame();try{
  g.api.boot(data.config);g.context.auditRandomTape=data.randomTape;
  vm.runInContext(`var auditRandomIndex=0;Math.random=()=>auditRandomTape[auditRandomIndex++];`,g.context);
  let s=await g.api.advance();for(const x of data.trace.slice(0,index+1)){g.api.choose(x.choice);s=await g.api.advance();}
  assert.equal(s.runner.credits,5);
  assert.ok(!s.runner.rig.resources.some(c=>c.number===30018));
  const install=choices(s).find(o=>o.command==='install'&&o.card?.number===30032);assert.ok(install);
  g.api.choose({version:s.version,command:'install',index:install.index});s=await g.api.advance();
  for(let i=0;i<5&&s.runner.credits===5;i++){const next=choices(s).find(o=>o.command==='n');assert.ok(next);g.api.choose({version:s.version,command:'n',index:next.index});s=await g.api.advance();}
  assert.equal(s.runner.credits,4);
  assert.ok(!choices(s).some(o=>o.command==='play'&&o.card?.number===30030));
  return {creditsAfterCorrectedRun:5,creditsIfMayflyInstalledFirst:4,sureGambleThenUnavailable:true,normalization:'Play Sure Gamble before installing Mayfly'};
 }finally{g.close();}
}
async function hqVisibility(){
 const data=require('../eval/recorded-games/lt-starter-full-replay.json');
 const index=data.trace.findIndex(x=>x.turn==='R1'&&x.label==='Access 30040');assert.ok(index>0);
 const g=makeGame();try{
  g.api.boot(data.config);g.context.auditRandomTape=data.randomTape;
  vm.runInContext(`var auditRandomIndex=0;Math.random=()=>auditRandomTape[auditRandomIndex++];`,g.context);
  let s=await g.api.advance();for(const x of data.trace.slice(0,index+1)){g.api.choose(x.choice);s=await g.api.advance();}
  const previous=g.context.corp.HQ.cards.find(c=>c.setNumber===30039);assert.ok(previous);
  assert.equal(s.access.number,30040);assert.equal(g.context.PlayerCanLook(g.context.runner,previous),true);
  assert.equal(s.corp.hand.find(c=>c.id===previous.localId).hidden,false);
  const visited=new Set(g.context.accessedCards.cards);
  assert.ok(s.corp.hand.filter(c=>!visited.has(g.context.corp.HQ.cards.find(r=>r.localId===c.id))).every(c=>c.hidden));
  // Confirm the pinned upstream function itself gives the old wrong result.
  const text=fs.readFileSync(path.resolve(__dirname,'../vendor/chiriboga/utility.js'),'utf8');
  const native=text.slice(text.indexOf('function PlayerCanLook('),text.indexOf('/**',text.indexOf('function PlayerCanLook(')));
  g.context.previousAuditCard=previous;
  assert.equal(vm.runInContext(`(${native})(runner,previousAuditCard)`,g.context),false);
  for(let i=0;i<30&&g.context.attackedServer;i++){
   const o=choices(s).find(o=>o.command==='n');assert.ok(o);g.api.choose({version:s.version,command:'n',index:o.index});s=await g.api.advance();
  }
  assert.equal(g.context.PlayerCanLook(g.context.runner,previous),false,'HQ card ceases live visibility at breach end');
  return {legacyNativeRetainedPriorAccess:false,currentRetainsPriorAccess:true,unseenHQRemainsHidden:true,hiddenAgainAfterBreach:true};
 }finally{g.close();}
}
function guidedBoostRestriction(){
 const g=makeGame();try{
  g.api.boot(complete('lt-starter').config);
  vm.runInContext(`
   var m=AllCards(runner).find(c=>c.setNumber===30032);MoveCard(m,runner.rig.programs);m.faceUp=true;
   var i=AllCards(corp).find(c=>c.setNumber===30073);MoveCard(i,corp.HQ.ice);i.rezzed=true;
   runner.creditPool=10;playerTurn=runner;runner.clickTracker=3;
   attackedServer=corp.HQ;approachIce=0;encountering=true;ChangePhase(phases.runEncounterIce);
  `,g.context);
  const s=g.api.snapshot();
  return {kind:'known guided-choice restriction, not a full legal-action enumerator',
   mayflyStrength:s.runner.rig.programs.find(c=>c.number===30032).strength,
   iceStrength:s.run.card.strength,
   boostOfferedAtMatchingStrength:choices(s).some(o=>o.command==='trigger'&&o.card?.number===30032&&/strength/.test(o.detail||''))};
 }finally{g.close();}
}
async function main(){
 const result={checkedOn:'2026-11-06',rulesVersion:CURRENT,scope:'Additional targeted rule probes; injected setups are distinct from the three boot-to-terminal full-game replays.',
  badPublicity:[await badPublicity(false),await badPublicity(true)],seamless:await seamless(),starterBudgetBranch:await fundingChoiceProbe(),hqVisibility:await hqVisibility(),guidedBoostRestriction:guidedBoostRestriction()};
 if(process.argv.includes('--write'))fs.writeFileSync(path.resolve(__dirname,'../eval/recorded-games/rules-audit-validation.json'),JSON.stringify(result,null,2)+'\n');
 console.log('PASS recorded rules audit: current initiation/rez window, separate bad-publicity fund and Whitespace threshold, broad Seamless targets with new-card exclusion, source-budget branch');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={main};
