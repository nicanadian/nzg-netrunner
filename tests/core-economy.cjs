'use strict';const assert=require('node:assert/strict'),vm=require('node:vm'),{createGame}=require('../engine/runtime.cjs'),core=require('../engine/core-decks.js'),{choices,checkState}=require('./engine-smoke.cjs');
function fixture(){const g=createGame({core:true});g.api.boot({side:'corp',control:'scripted',seed:'core-economy',cardPool:'core-v1',rulesVersion:'26.03-core-1',deckIds:core.defaults,decks:{corp:{identity:30035,cards:[35040,35043,35062,35072,35081,35081,35067,35039,30075,30075,30075,30071,30071,30071]}}});vm.runInContext(`playerTurn=corp;corp.clickTracker=3;corp.creditPool=10;corp.actionsCompletedThisTurn=0;ChangePhase(phases.corpActionMain);`,g.context);return g;}
async function pick(g,test){const s=await g.api.advance(),o=choices(s).find(test);assert(o,JSON.stringify({phase:s.phase,choices:choices(s).map(o=>[o.command,o.label,o.card?.number])}));g.api.choose({version:s.version,command:o.command,index:o.index});return g.api.advance();}
(async()=>{
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`var petty=AllCards(corp).find(c=>c.setNumber===35081);MoveCard(petty,corp.HQ.cards);`,c);await pick(g,o=>o.command==='gain');assert.equal(c.corp.actionsCompletedThisTurn,1);assert.equal(c.petty.Enumerate.call(c.petty).length,0);const choicesNow=choices(g.api.snapshot());assert(!choicesNow.some(o=>o.command==='play'&&o.card?.number===35081));
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`var petty=AllCards(corp).find(c=>c.setNumber===35081);MoveCard(petty,corp.archives.cards);`,c);await pick(g,o=>o.command==='trigger'&&o.card?.number===35081);assert.equal(c.corp.creditPool,12);assert.equal(c.corp.clickTracker,3);assert(c.removedFromGame.includes(c.petty));assert.equal(c.corp.actionsCompletedThisTurn,1);checkState(g);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`var op=AllCards(corp).find(c=>c.setNumber===35043);MoveCard(op,corp.HQ.cards);`,c);await pick(g,o=>o.command==='play'&&o.card?.number===35043);assert.equal(c.corp.clickTracker,4,'pay one action click then gain two');assert.equal(c.corp.creditPool,6,'pay the printed four-credit cost');checkState(g);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`var otto=AllCards(corp).find(c=>c.setNumber===35040);MoveCard(otto,corp.HQ.root);otto.rezzed=true;otto.automaticOnRez.Resolve.call(otto,otto);`,c);assert.equal(c.otto.credits,6);const before=c.corp.creditPool;c.otto.responseOnCorpTurnBegins.Resolve.call(c.otto);await g.api.advance();assert.equal(c.otto.credits,4);assert.equal(c.corp.creditPool,before+2);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`var anthill=AllCards(corp).find(c=>c.setNumber===35072);MoveCard(anthill,corp.HQ.root);anthill.rezzed=true;anthill.automaticOnRez.Resolve.call(anthill,anthill);anthill.credits=4;`,c);assert.equal(c.anthill.credits,4);const hand=c.corp.HQ.cards.length,credits=c.corp.creditPool;c.anthill.responseOnCorpTurnBegins.Resolve.call(c.anthill);await g.api.advance();assert.equal(c.corp.HQ.cards.length,hand+1);assert.equal(c.corp.creditPool,credits+4);assert(c.corp.archives.cards.includes(c.anthill));checkState(g);
 }finally{g.close();}}
 {
 const g=fixture();try{const c=g.context;vm.runInContext(`var plaza=AllCards(corp).find(c=>c.setNumber===35062);MoveCard(plaza,corp.HQ.root);plaza.rezzed=true;`,c);const before=c.corp.creditPool;c.plaza.responseOnCorpTurnBegins.Resolve.call(c.plaza);assert.equal(c.corp.creditPool,before+1);
 }finally{g.close();}}
 console.log('PASS economy: Petty Cash first-completed-action restriction and paid Archives/RFG action; Nanomanagement action math; Otto load/income; Anthill draw-before-empty-trash; Plaza income.');
})().catch(e=>{console.error(e);process.exitCode=1});
