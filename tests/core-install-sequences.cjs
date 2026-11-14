'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),{createGame}=require('../engine/runtime.cjs'),core=require('../engine/core-decks.js'),{choices,checkState}=require('./engine-smoke.cjs');
function fixture(){const g=createGame({core:true});g.api.boot({side:'runner',control:'scripted',seed:'sequential-installs',cardPool:'core-v1',rulesVersion:'26.03-core-1',deckIds:core.defaults,decks:{runner:{identity:35001,cards:[35006,35025,30030,35015,30023,30024,30031,30034,30006,30028,30029,30004]}}});vm.runInContext(`playerTurn=runner;runner.clickTracker=4;runner.creditPool=10;ChangePhase(phases.runnerActionMain);var bling=AllCards(runner).find(c=>c.setNumber===35006);var illumination=AllCards(runner).find(c=>c.setNumber===35025);`,g.context);return g;}
async function pick(g,predicate){let s=await g.api.advance(),o=choices(s).find(predicate);assert(o,JSON.stringify({phase:s.phase,options:choices(s).map(o=>[o.command,o.label,o.card?.number])}));g.api.choose({version:s.version,command:o.command,index:o.index});return g.api.advance();}
(async()=>{
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`MoveCard(AllCards(runner).find(c=>c.setNumber===30034),runner.grip);MoveCard(illumination,runner.resolvingCards);illumination.runningWithThis=true;illumination.responseOnRunSuccessful.Resolve.call(illumination);`,c);
 const initial=c.runner.creditPool;await pick(g,o=>o.command==='install'&&o.card?.number===30034);let s=g.api.snapshot();if(s.installation)await pick(g,o=>o.command==='n');assert(c.runner.rig.resources.some(c=>c.setNumber===30034));assert.equal(c.runner.creditPool,initial-2,'3-credit resource costs 2');assert.equal(c.illumination.installsRemaining,2);assert.equal(c.runner.clickTracker,4);
 await pick(g,o=>o.label==='Finish installing');const resource=c.runner.rig.resources.find(c=>c.setNumber===30034);assert.equal(c.InstallCost(resource),3,'discount ends');checkState(g);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`MoveCard(bling,runner.rig.hardware);bling.faceUp=true;bling.hostedCards=[];var gamble=AllCards(runner).find(c=>c.setNumber===30030);MoveCard(gamble,bling.hostedCards);gamble.notInstalled=true;gamble.faceUp=true;`,c);
 let s=await g.api.advance();assert(choices(s).some(o=>o.command==='play'&&o.card?.number===30030));assert.equal(c.CheckInstalled(c.gamble),false);
 await pick(g,o=>o.command==='play'&&o.card?.number===30030);assert.equal(c.runner.creditPool,14,'pay 5 then gain 9');assert.equal(c.runner.clickTracker,3);assert(c.runner.heap.includes(c.gamble));checkState(g);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`MoveCard(bling,runner.rig.hardware);bling.faceUp=true;bling.hostedCards=[];var card=AllCards(runner).find(c=>c.setNumber===30030);MoveCard(card,bling.hostedCards);card.notInstalled=true;card.faceUp=true;bling.responseOnRunnerDiscardEnds.Resolve.call(bling);`,c);await g.api.advance();assert(c.runner.heap.includes(c.card));assert.equal(c.bling.hostedCards.length,0);assert.equal(c.CheckInstalled(c.card),false);checkState(g);
 }finally{g.close();}}

 for(const self of [false,true]){
 const g=fixture();try{const c=g.context;vm.runInContext(`MoveCard(bling,runner.grip);if(!${self}){MoveCard(bling,runner.rig.hardware);bling.faceUp=true;bling.hostedCards=[];}var free=${self} ? bling : AllCards(runner).find(c=>c.setNumber===30031);MoveCard(free,runner.grip);Install(free,null,true);`,c);
 let state=await g.api.advance();if(state.installation)await pick(g,o=>o.command==='n');
 await pick(g,o=>o.command==='trigger'&&o.card?.number===35006);await pick(g,o=>o.label==='Host');
 assert.equal(c.bling.hostedCards.length,1);const held=c.bling.hostedCards[0];assert.equal(c.CheckInstalled(held),false);assert(!c.InstalledCards().includes(held));assert.equal(held.faceUp,true);checkState(g);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`MoveCard(bling,runner.rig.hardware);bling.faceUp=true;bling.hostedCards=[];var held=AllCards(runner).find(c=>c.setNumber===30006);MoveCard(held,bling.hostedCards);held.notInstalled=true;held.faceUp=true;`,c);
 let s=await g.api.advance(),o=choices(s).find(o=>o.command==='install'&&o.card?.number===30006);assert(o);g.api.choose({version:s.version,command:o.command,index:o.index});s=g.api.snapshot();g.api.choose({version:s.version,command:'trash',cancel:true});await g.api.advance();assert(c.bling.hostedCards.includes(c.held));assert.equal(c.CheckInstalled(c.held),false);assert.equal(c.runner.creditPool,10);assert.equal(c.runner.clickTracker,4);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`MoveCard(bling,runner.rig.hardware);bling.faceUp=true;bling.hostedCards=[];var held=AllCards(runner).find(c=>c.setNumber===35015);MoveCard(held,bling.hostedCards);held.notInstalled=true;held.faceUp=true;`,c);
 await pick(g,o=>o.command==='play'&&o.card?.number===35015);assert.equal(c.runner.clickTracker,2,'hosted Double event pays two clicks');assert.equal(c.runner.creditPool,9,'hosted event pays printed cost');
 }finally{g.close();}}
 console.log('PASS Illumination/Bling: sequential discounted install/payment, no click/discount leakage, hosted event uses native paid play and cleanup, mandatory hosted-card trash.');
})().catch(e=>{console.error(e);process.exitCode=1});
