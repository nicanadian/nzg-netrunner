'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');const {makeGame,choices}=require('./engine-smoke.cjs');
(async()=>{
 const g=makeGame({extraScripts:['engine/core-decks.js','vendor/chiriboga-elevation/sets/elevation.js','engine/elevation-compat.js']});
 try{
  g.api.boot({side:'runner',control:'scripted',seed:'rising-tide',cardPool:'core-v1',rulesVersion:'26.03-core-1',deckIds:{runner:'phoenix-core-v1',corp:'precision-design-core-v1'}});
  vm.runInContext(`var tides=AllCards(runner).filter(c=>c.setNumber===35009);MoveCard(tides[0],runner.rig.programs);MoveCard(tides[1],runner.heap);tides[0].faceUp=true;var barrier=AllCards(corp).find(c=>c.setNumber===35075);MoveCard(barrier,corp.RnD.ice);barrier.rezzed=true;runner.creditPool=10;runner.clickTracker=4;playerTurn=runner;attackedServer=corp.RnD;approachIce=0;movement=false;encountering=true;ChangePhase(phases.runEncounterIce);`,g.context);
  let s=await g.api.advance();
  const tool=s.run.tools.find(t=>t.card.number===35009);assert(tool);assert.equal(tool.card.strength,2,'Heap fracter increases strength');assert.equal(tool.breakTotal,2,'Two barrier subroutines cost two credits');assert.equal(tool.matches,true);
  const ability=choices(s).find(o=>o.command==='trigger'&&o.card?.number===35009&&o.abilityKind==='break');assert(ability);assert.equal(ability.cost.credits,1);
  g.api.choose({version:s.version,command:ability.command,index:ability.index});s=await g.api.advance();
  const target=choices(s).find(o=>o.subroutine);assert(target);g.api.choose({version:s.version,command:target.command,index:target.index});s=await g.api.advance();
  assert.equal(s.runner.credits,9);assert.equal(s.run.card.subroutines.filter(x=>x.broken).length,1);
  console.log('PASS Rising Tide: fracter-in-heap strength, encounter tool/quote, native barrier target and exact one-credit break payment.');
 }finally{g.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
