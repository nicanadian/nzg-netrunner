'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),{createGame}=require('../engine/runtime.cjs');const core=require('../engine/core-decks.js'),{choices,checkState}=require('./engine-smoke.cjs');
function setup(){const g=createGame({core:true});g.api.boot({side:'runner',control:'scripted',seed:'detente-native',cardPool:'core-v1',rulesVersion:'26.03-core-1',deckIds:core.defaults,decks:{corp:{identity:30035,cards:[35060,30069,30069,30069,30075,30075,30075,30071,30071,30071]}}});vm.runInContext(`var detente=AllCards(runner).find(c=>c.setNumber===35018);MoveCard(detente,runner.rig.hardware);detente.hostedCards=[];var agendas=AllCards(corp).filter(c=>c.cardType==='agenda').slice(0,3);for(var card of agendas){MoveCard(card,detente.hostedCards);card.host=detente;card.notInstalled=true;card.faceUp=true;}playerTurn=runner;runner.clickTracker=4;ChangePhase(phases.runnerActionMain);`,g.context);return g;}
async function pick(g,test){const s=await g.api.advance(),o=choices(s).find(test);assert(o,JSON.stringify({phase:s.phase,choices:choices(s).map(o=>[o.command,o.label])}));g.api.choose({version:s.version,command:o.command,index:o.index});return g.api.advance();}
(async()=>{
 {
 const g=setup();try{const c=g.context,options=c.detente.abilities[0].Enumerate.call(c.detente);assert.equal(options.length,3);const selected=options[2].cards;c.detente.abilities[0].Resolve.call(c.detente,options[2]);assert.equal(c.detente.hostedCards.length,1);assert.equal(c.runner.clickTracker,3);for(const card of selected)assert(c.corp.HQ.cards.includes(card));await pick(g,o=>o.label==='Decline access');assert.equal(c.accessingCard,null);checkState(g);
 }finally{g.close();}}
 {
 const g=setup();try{const c=g.context;vm.runInContext(`var target=agendas.find(c=>c.setNumber===35060);if(!target){target=AllCards(corp).find(c=>c.setNumber===35060);}MoveCard(target,corp.HQ.cards);target.notInstalled=false;detente.resolveDetenteAccess(target);`,g.context);let s=await g.api.advance();assert.equal(s.access.number,35060);assert.equal(s.run,null,'access must not invent a run');await pick(g,o=>o.command==='steal');assert(c.runner.scoreArea.includes(c.target));assert.equal(c.target.agenda,1,'native stolen response fires');await pick(g,o=>o.command==='n');assert.equal(c.accessingCard,null);checkState(g);
 }finally{g.close();}}
 {
 const g=setup();try{const c=g.context,held=c.detente.hostedCards.slice();c.MoveCard(c.detente,c.runner.grip);c.NRCoreFlushHosted();await g.api.advance();assert(held.every(card=>c.corp.archives.cards.includes(card)));assert.equal(c.detente.hostedCards.length,0);checkState(g);
 }finally{g.close();}}
 console.log('PASS Détente: choose any two hostees, exact click/return cost, optional decline, native out-of-run access/steal/stolen abilities, host-to-grip cleanup (CR 1.13.13).');
})().catch(e=>{console.error(e);process.exitCode=1});
