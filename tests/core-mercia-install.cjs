'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {makeGame,choices}=require('./engine-smoke.cjs');
const extraScripts=require('../engine/runtime.cjs').CORE_SCRIPTS;
(async()=>{
 const game=makeGame({extraScripts});
 try{
  game.api.boot({side:'corp',control:'scripted',seed:'mercia-discount',cardPool:'core-v1',rulesVersion:'26.03-core-1',deckIds:{runner:'phoenix-core-v1',corp:'precision-design-core-v1'}});
  vm.runInContext(`var m=AllCards(corp).find(c=>c.setNumber===35045);MoveCard(m,corp.HQ.root);m.rezzed=true;var outer=AllCards(corp).find(c=>c.setNumber===35075);MoveCard(outer,corp.RnD.ice);var installing=AllCards(corp).find(c=>c.setNumber===35079);MoveCard(installing,corp.HQ.cards);corp.creditPool=2;corp.clickTracker=0;playerTurn=corp;ChangePhase(phases.corpActionPhaseEnds);`,game.context);
  let s=await game.api.advance();
  async function pick(test){const o=choices(s).find(test);assert(o,JSON.stringify(s.phase));game.api.choose({version:s.version,command:o.command,index:o.index});s=await game.api.advance();}
  await pick(o=>o.command==='trigger'&&o.card?.number===35045);
  await pick(o=>o.card?.number===35079&&o.server==='R&D');
  assert(s.installation,'Native installation confirmation is retained');
  const finish=choices(s).find(o=>o.command==='n');assert.equal(finish.cost.credits,0,'One existing ice minus Mercia discount');
  await pick(o=>o.command==='n');
  assert.equal(game.context.corp.creditPool,2,'Actual payment matches zero-credit quote');
  assert.equal(game.context.corp.clickTracker,0,'Effect install does not spend an action click');
  assert(game.context.corp.RnD.ice.includes(game.context.installing));
  assert(game.context.corp.RnD.root.includes(game.context.m),'Mercia follows the installed ice');
  assert.equal(game.context.m.merciaInstallingIce,null,'Discount ends after installation');
  assert.equal(vm.runInContext('InstallCost(outer,corp.HQ)',game.context),0,'Unrelated installation is unchanged');
  console.log('PASS Mercia native ice install: discounted quote/payment, no click, relocation and discount expiry.');
 }finally{game.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
