'use strict';const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),{createGame}=require('../engine/runtime.cjs'),net=require('../engine/net-decks.js');
(async()=>{
 const g=createGame({core:true});try{
  const runner=net.catalog.find(d=>d.identity===35023).document,corp=net.catalog.find(d=>d.identity===30035).document;
  g.api.boot({side:'runner',control:'scripted',cardPool:'core-v1',rulesVersion:'26.03-core-1',deckDocuments:{runner,corp}});
  vm.runInContext(`playerTurn=runner;runner.clickTracker=4;runner.startingMU=0;ChangePhase(phases.runnerActionMain);var dewi=runner.identityCard;`,g.context);
  const c=g.context,identity=c.dewi,credits=c.runner.creditPool;identity.responseOnRunSuccessful.Resolve.call(identity,{id:1});assert.equal(identity.flipped,false);
  assert(identity.responseOnRunSuccessful.Enumerate.call(identity).some(o=>o.id===0));identity.responseOnRunSuccessful.Resolve.call(identity,{id:0});assert.equal(identity.flipped,true);assert.equal(c.runner.creditPool,credits+1);let state=await g.api.advance();assert.equal(state.runner.identity.identityFace,'back');assert.equal(state.runner.identity.artNumber,'35023-0');assert(fs.existsSync('assets/cards-display/35023-0-743.webp'));
  c.runner.startingMU=4;assert(identity.responseOnRunSuccessful.Enumerate.call(identity).some(o=>o.id===0));const before=c.runner.grip.length;identity.responseOnRunSuccessful.Resolve.call(identity,{id:0});await g.api.advance();assert.equal(identity.flipped,false);assert.equal(c.runner.grip.length,before+1);assert.equal(g.api.metrics().diagnostics.length,0);
 }finally{g.close();}
 for(const id of ['35023-0','35057-0'])assert(fs.existsSync(`assets/cards-display/${id}-743.webp`));
 console.log('PASS identity faces: Dewi decline/full-MU flip credit/back art/free-MU flip draw; both back-face assets present, no renderer dependency.');
})().catch(e=>{console.error(e);process.exitCode=1});
