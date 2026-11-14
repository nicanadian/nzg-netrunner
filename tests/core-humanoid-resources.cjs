'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {makeGame,choices}=require('./engine-smoke.cjs');
const extraScripts=require('../engine/runtime.cjs').CORE_SCRIPTS;
(async()=>{
 for(const installCount of [0,1,2]){
  const g=makeGame({extraScripts});
  try{
   g.api.boot({side:'corp',control:'scripted',seed:'hr-chain',cardPool:'core-v1',rulesVersion:'26.03-core-1',deckIds:{runner:'phoenix-core-v1',corp:'precision-design-core-v1'}});
   vm.runInContext(`var hr=AllCards(corp).find(c=>c.setNumber===35039);MoveCard(hr,corp.HQ.root);hr.rezzed=true;var first=AllCards(corp).find(c=>c.setNumber===30071);MoveCard(first,corp.HQ.cards);var second=AllCards(corp).find(c=>c.setNumber===30053);MoveCard(second,corp.HQ.cards);corp.creditPool=2;corp.clickTracker=3;playerTurn=corp;ChangePhase(phases.corpActionMain);`,g.context);
   let s=await g.api.advance();
   const act=async predicate=>{const o=choices(s).find(predicate);assert(o,`${s.phase.title}: ${choices(s).map(x=>x.label).join('; ')}`);g.api.choose({version:s.version,command:o.command,index:o.index});s=await g.api.advance();};
   await act(o=>o.command==='trigger'&&o.card?.number===35039);
   assert.equal(s.corp.clicks,0);assert.equal(s.corp.credits,6);assert(s.corp.discard.some(c=>c.number===35039));
   for(const number of [30071,30053].slice(0,installCount)){
    await act(o=>o.command==='install'&&o.card?.number===number&&o.server==='New remote');
    if(s.installation){assert.equal(s.installation.card.number,number);await act(o=>o.command==='n');}
    assert(s.corp.servers.some(server=>server.root.some(c=>c.number===number)),'The card actually finishes installing before the next choice');
   }
   if(installCount<2)await act(o=>o.command==='install'&&!o.card);
   await act(o=>!o.card&&/Skip operation/.test(o.label));
   assert.equal(s.corp.credits,6);assert.equal(s.corp.clicks,0);
   assert.equal(g.api.metrics().diagnostics.length,0);assert.deepEqual(g.errors,[]);
  }finally{g.close();}
 }
 console.log('PASS Humanoid Resources: pay/trash cost, gain/draw, 0/1/2 optional installs with native payment/confirmation boundaries, decline operation, no extra clicks or phantom installations.');
})().catch(e=>{console.error(e);process.exitCode=1});
