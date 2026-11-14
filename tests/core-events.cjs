'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),{createGame}=require('../engine/runtime.cjs'),catalog=require('../engine/card-catalog.js').cards,core=require('../engine/core-decks.js'),{choices,checkState}=require('./engine-smoke.cjs');
function fixture({corp=30035,runner=35001}={}){
 const g=createGame({core:true});
 const deck=side=>Object.values(catalog).filter(c=>c.side_code===side&&c.type_code!=='identity').map(c=>Number(c.code));
 g.api.boot({side:'runner',control:'scripted',seed:'core-events',cardPool:'core-v1',rulesVersion:'26.03-core-2',deckIds:core.defaults,decks:{corp:{identity:corp,cards:deck('corp')},runner:{identity:runner,cards:deck('runner')}}});
 vm.runInContext(`playerTurn=runner;runner.clickTracker=4;runner.creditPool=20;corp.creditPool=20;corp.clickTracker=3;ChangePhase(phases.runnerActionMain);var get=id=>AllCards(null).find(c=>c.setNumber===id);var rig=id=>{var c=get(id);MoveCard(c,runner.rig[c.cardType==='program'?'programs':c.cardType==='hardware'?'hardware':'resources']);c.faceUp=true;return c;};`,g.context);
 return g;
}
async function pick(g,test){const s=await g.api.advance(),o=choices(s).find(test);assert(o,JSON.stringify({phase:s.phase,choices:choices(s).map(o=>[o.command,o.label,o.card?.number])}));g.api.choose({version:s.version,command:o.command,index:o.index});return g.api.advance();}
(async()=>{
 {const g=fixture();try{vm.runInContext(`var source=get(35049);MoveCard(source,corp.scoreArea);source.agenda=1;source.faceUp=true;rig(30008);source.responseOnCorpDiscardEnds.Resolve.call(source);`,g.context);await pick(g,o=>o.label==='Keep agenda counter');assert.equal(g.context.source.agenda,1);}finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`var source=get(35049);MoveCard(source,corp.scoreArea);source.agenda=1;source.faceUp=true;var ice=get(30074);MoveCard(ice,corp.HQ.ice);var leech=rig(30008);source.responseOnCorpDiscardEnds.Resolve.call(source);`,c);let s=await g.api.advance();assert(choices(s).some(o=>o.card?.number===30074),'non-advanceable installed Corp ice is eligible');assert(choices(s).some(o=>o.card?.number===30008),'installed Runner cards are eligible');await pick(g,o=>o.card?.number===30008);assert.equal(c.leech.advancement,2);assert.equal(c.source.agenda,0);assert.equal(c.corp.creditPool,20);assert.equal(c.source.responseOnCorpDiscardEnds.Enumerate.call(c.source).length,0);checkState(g);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`var knick=rig(35033);rig(30031);MakeRun(corp.HQ);`,c);await pick(g,o=>o.command==='trigger'&&o.card?.number===35033);await pick(g,o=>o.label==='Decline');assert.equal(c.knick.triggeredThisTurn,true);assert.equal(c.CheckRunning(),true);assert.equal(g.api.metrics().diagnostics.length,0);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`var event=get(35016);MoveCard(event,runner.resolvingCards);event.runningWithThis=true;attackedServer=corp.archives;approachIce=-1;ChangePhase(phases.runApproachServer);`,c);assert.equal(c.attackedServer,c.corp.HQ);assert.equal(c.approachIce,-1);assert.equal(c.event.runningWithThis,false);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`var drone=rig(35031);drone.automaticOnInstall.Resolve.call(drone,drone);attackedServer=corp.RnD;ChangePhase(phases.runBreachServer);`,c);await pick(g,o=>o.command==='trigger'&&o.card?.number===35031);await pick(g,o=>o.label==='Use counter');assert.equal(c.drone.power,1);assert.equal(c.drone.usingThisRun,true);checkState(g);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`var shred=get(35005);MoveCard(shred,runner.resolvingCards);shred.faceUp=true;shred.runningWithThis=true;shred.usedThisRun=false;var remote=NewServer('Remote 0',false);corp.remoteServers.push(remote);MoveCard(get(30071),remote.root);for(var card of [...corp.HQ.cards])MoveCard(card,corp.RnD.cards);attackedServer=remote;approachIce=-1;EndTheRun();`,c);await pick(g,o=>o.command==='trigger'&&o.card?.number===35005);assert.equal(c.shred.usedThisRun,true);assert.equal(c.attackedServer,c.remote,'first end-run prevented with insufficient HQ');assert.equal(g.api.metrics().diagnostics.length,0);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`var mitra=get(35056);MoveCard(mitra,corp.HQ.root);mitra.rezzed=true;MoveCard(get(30073),corp.HQ.ice);MoveCard(get(30074),corp.HQ.cards);attackedServer=corp.HQ;approachIce=0;ChangePhase(phases.runApproachIce);`,c);const s=await g.api.advance();assert(choices(s).some(o=>o.command==='trigger'&&o.card?.number===35056));assert.equal(s.phase.title,'Approach Ice');
 }finally{g.close();}}
 {
 const g=fixture({corp:35069});try{const c=g.context;vm.runInContext(`playerTurn=corp;ChangePhase(phases.corpActionMain);var fund=get(30075);MoveCard(fund,corp.HQ.cards);`,c);const hand=c.corp.HQ.cards.length;await pick(g,o=>o.command==='play'&&o.card?.number===30075);await pick(g,o=>o.command==='trigger'&&o.card?.number===35069);await pick(g,o=>o.command==='continue'&&/Draw/.test(o.label));assert.equal(c.corp.HQ.cards.length,hand);assert.equal(c.corp.creditPool,24);assert.equal(c.corp.identityCard.usedThisTurn,true);assert.equal(g.api.metrics().diagnostics.length,0);checkState(g);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`var green=get(35070);MoveCard(green,corp.scoreArea);Forfeit(green);`,c);assert.equal(c.corp.creditPool,24);assert(c.removedFromGame.includes(c.green));
 }finally{g.close();}}

 {
 const g=fixture({runner:35024});try{const c=g.context;vm.runInContext(`for(var card of [...runner.grip])MoveCard(card,runner.stack);for(var id of [30006,30030,30028,30029,30034,30033])MoveCard(get(id),runner.grip);ChangePhase(phases.runnerDiscardStart);`,c);
 await pick(g,o=>o.command==='discard'&&o.card?.number===30006);await pick(g,o=>o.command==='trigger'&&o.card?.number===35024);await pick(g,o=>o.card?.number===30006);let s=g.api.snapshot();if(s.installation)await pick(g,o=>o.command==='n');assert(c.runner.rig.programs.some(c=>c.setNumber===30006));assert.equal(c.runner.creditPool,17);assert.equal(c.runner.clickTracker,4);checkState(g);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`var caco=rig(35010);caco.power=2;runner.clickTracker=0;ChangePhase(phases.runnerDiscardStart);`,c);const s=await g.api.advance();assert.equal(s.phase.identifier,'Runner 1.4');await pick(g,o=>o.command==='trigger'&&o.card?.number===35010);await pick(g,o=>o.label==='Decline');assert.equal(c.caco.power,2);assert.equal(g.api.metrics().diagnostics.length,0);
 }finally{g.close();}}
 console.log('PASS Core revision 2 timing: run-begins/Knickknack, Maintenance Access redirect, Drone breach counter, Shred end-run prevention, Mitra approach window, Zwicky source-aware operation gain, Greenmail forfeit.');
})().catch(e=>{console.error(e);process.exitCode=1});
