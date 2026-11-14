'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {makeGame,choices}=require('./engine-smoke.cjs');
const extraScripts=require('../engine/runtime.cjs').CORE_SCRIPTS;
const config={side:'runner',control:'scripted',seed:'core-timing',cardPool:'core-v1',rulesVersion:'26.03-core-1',deckIds:{runner:'phoenix-core-v1',corp:'precision-design-core-v1'}};
(async()=>{
 const phoenix=makeGame({extraScripts});
 try{
  phoenix.api.boot(config);
  vm.runInContext(`var testIce=AllCards(corp).find(c=>c.setNumber===35075);MoveCard(testIce,corp.HQ.ice);testIce.rezzed=true;attackedServer=corp.HQ;approachIce=0;playerTurn=runner;encountering=true;ChangePhase(phases.runSubroutines);subroutine=0;`,phoenix.context);
  let s=await phoenix.api.advance();assert.equal(phoenix.context.runner.identityCard.subroutineResolvedThisRun,false,'Merely reaching unbroken subroutines does not qualify Phoenix');
  const fire=choices(s).find(o=>o.command==='trigger');assert(fire);phoenix.api.choose({version:s.version,command:fire.command,index:fire.index});s=await phoenix.api.advance();
  assert.equal(phoenix.context.runner.identityCard.subroutineResolvedThisRun,true,'Actual fired subroutine qualifies Phoenix');
  vm.runInContext('runner.identityCard.usedThisTurn=true;runner.identityCard.responseOnCorpTurnBegins.Resolve.call(runner.identityCard);',phoenix.context);
  assert.equal(phoenix.context.runner.identityCard.usedThisTurn,false,'Once per turn resets on either player turn');
  vm.runInContext('runner.identityCard.automaticOnRunBegins.Resolve.call(runner.identityCard,corp.HQ);',phoenix.context);
  assert.equal(phoenix.context.runner.identityCard.subroutineResolvedThisRun,false,'New run does not inherit the previous subroutine');
 }finally{phoenix.close();}
 const mercia=makeGame({extraScripts});
 try{
  mercia.api.boot(config);
  vm.runInContext(`var testMercia=AllCards(corp).find(c=>c.setNumber===35045);MoveCard(testMercia,corp.HQ.root);testMercia.rezzed=true;var optionalAsset=AllCards(corp).find(c=>c.setNumber===35039);MoveCard(optionalAsset,corp.HQ.root);optionalAsset.rezzed=false;var testInstall=AllCards(corp).find(c=>c.setNumber===35075);MoveCard(testInstall,corp.HQ.cards);corp.creditPool=10;corp.clickTracker=0;playerTurn=corp;ChangePhase(phases.corpActionMain);`,mercia.context);
  let s=await mercia.api.advance();const end=choices(s).find(o=>o.command==='n');assert(end);mercia.api.choose({version:s.version,command:'n',index:end.index});s=await mercia.api.advance();
  assert.equal(s.phase.identifier,'Corp 2.3');
  const option=choices(s).find(o=>o.command==='trigger'&&o.card?.number===35045);assert(option,'Mercia is offered before discarding');
  mercia.api.choose({version:s.version,command:option.command,index:option.index});s=await mercia.api.advance();
  const decline=choices(s).find(o=>/Decline/.test(o.label));assert(decline,'Mercia remains optional');
  mercia.api.choose({version:s.version,command:decline.command,index:decline.index});s=await mercia.api.advance();
  assert(!choices(s).some(o=>o.command==='trigger'&&o.card?.number===35045),'Declining does not offer the same end-phase effect again');
 }finally{mercia.close();}
 console.log('PASS Core timing: Phoenix tracks actual subroutine firing, run reset and either-player turn reset; Mercia has a distinct optional action-phase-end window.');
})().catch(e=>{console.error(e);process.exitCode=1});
