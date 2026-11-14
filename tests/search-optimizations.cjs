'use strict';
const assert=require('node:assert/strict'), vm=require('node:vm');
const {createGame}=require('../engine/runtime.cjs');
function fixture({fast=true,faceoff=true,searchOptimizations}={}) {
 const game=createGame({core:true,searchOptimizations});
 game.api.boot({side:'runner',faceoff,simulationFast:fast,seed:'cache-boundaries',cardPool:'core-v1',rulesVersion:'26.03-core-2',deckIds:{runner:'phoenix-core-v1',corp:'precision-design-core-v1'}});
 vm.runInContext(`var get=id=>AllCards(null).find(c=>c.setNumber===id);var card=get(30008);var ice=get(35075);`,game.context);
 return game;
}
for(const options of [{fast:false},{faceoff:false},{searchOptimizations:false}]) {
 const game=fixture(options);
 try { assert.equal(game.context.NRSimulationSearch.stats().cacheEnabled,false);assert.equal(game.context.NRSimulationSearch.stats().continuousEnabled,false); }
 finally {game.close();}
}
{
 const game=fixture(), c=game.context, within=c.NRSimulationSearch.withFrame;
 try {
  const outside=c.NRSimulationSearch.stats();c.AllCards(c.runner);assert.equal(c.NRSimulationSearch.stats().allCardMisses,outside.allCardMisses,'no cache outside a search step');
  within(()=>{
   const first=c.AllCards(c.runner),original=first.slice();first.reverse();first.pop();
   assert.deepEqual(c.AllCards(c.runner),original,'callers may change returned arrays');
   c.MoveCard(c.card,c.runner.stack);assert.equal(c.CheckInstalled(c.card),false);
   c.MoveCard(c.card,c.runner.rig.programs);assert.equal(c.CheckInstalled(c.card),true);
   assert.equal(c.CheckInstalled(c.card),true);
   c.card.notInstalled=true;assert.equal(c.CheckInstalled(c.card),false,'hosted-uninstalled flag is live');
   c.card.notInstalled=false;assert.equal(c.CheckInstalled(c.card),true);
   c.MoveCard(c.ice,c.corp.HQ.ice);c.ice.rezzed=true;
   assert(!c.ChoicesActiveTriggers('modifyStrength').some(o=>o.card===c.ice));
   c.ice.modifyStrength={Resolve(){return this.power||0;}};
   assert(c.ChoicesActiveTriggers('modifyStrength').some(o=>o.card===c.ice),'new callbacks are visible in a primed frame');
   c.ice.power=1;assert.equal(c.Strength(c.ice),2);c.ice.power=3;assert.equal(c.Strength(c.ice),4,'modifier values are never cached');
   c.ice.rezzed=false;assert(!c.ChoicesActiveTriggers('modifyStrength').some(o=>o.card===c.ice),'rez state remains live');
   c.ice.modifyStrength.availableWhenInactive=true;assert(c.ChoicesActiveTriggers('modifyStrength').some(o=>o.card===c.ice));
   delete c.ice.modifyStrength;assert(!c.ChoicesActiveTriggers('modifyStrength').some(o=>o.card===c.ice));
   const lingering={modifyStrength:{Resolve:()=>2}};c.AddLingeringEffect(lingering);assert.equal(c.Strength(c.ice),3);c.RemoveLingeringEffect(lingering);assert.equal(c.Strength(c.ice),1);
   const nested=c.AllCards(c.corp);within(()=>c.MoveCard(c.ice,c.corp.archives.cards));assert(!c.CheckInstalled(c.ice));assert(c.AllCards(c.corp).includes(c.ice));assert(nested.includes(c.ice));
  });
  assert.throws(()=>within(()=>{c.AllCards(c.runner);throw Error('fixture');}),/fixture/);
  const after=c.NRSimulationSearch.stats();c.AllCards(c.runner);assert.equal(c.NRSimulationSearch.stats().allCardHits,after.allCardHits,'frame expires on throw');
  assert(after.frames>0&&after.allCardHits>0&&after.installedHits>0&&after.invalidations>0);
 } finally {game.close();}
}
console.log('PASS search cache: Node/fast/faceoff gates, array ownership, per-step/exception expiry, movement/hosting, live rez/callback/counter changes, lingering effects and nested calculations.');
