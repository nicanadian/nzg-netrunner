'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {createGame}=require('../engine/runtime.cjs');
const core=require('../engine/core-decks.js'),gateway=require('../engine/deck-catalog.js');
const {choices,checkState}=require('./engine-smoke.cjs');
function fixture(identity=35057){const g=createGame({core:true});g.api.boot({side:'corp',control:'scripted',seed:'nbn-local',cardPool:'core-v1',rulesVersion:'26.03-core-1',deckIds:core.defaults,decks:{corp:{identity,cards:[35059,35060,35065,35066,30075,30075,30075,30069,30069,30069,30071,30071,30053,30056,30058]}}});vm.runInContext(`playerTurn=corp;corp.clickTracker=3;corp.creditPool=20;ChangePhase(phases.corpActionMain);`,g.context);return g;}
function evaluate(g,code){return vm.runInContext(code,g.context);}
async function choose(g,predicate){let s=await g.api.advance();const o=choices(s).find(predicate);assert(o,JSON.stringify({phase:s.phase,options:choices(s).map(o=>[o.command,o.label,o.card?.number])}));g.api.choose({version:s.version,command:o.command,index:o.index});return g.api.advance();}
(async()=>{
 {
  const g=fixture();try{const c=g.context,id=c.corp.identityCard;
   const idleCredits=c.corp.creditPool;id.responseOnCorpActionPhaseEnds.Resolve.call(id);assert.equal(c.corp.creditPool,idleCredits);assert.equal(id.flipped,false);
   evaluate(g,`var op=AllCards(corp).find(c=>c.setNumber===30075);corp.identityCard.automaticOnPlay.Resolve.call(corp.identityCard,op);`);assert.equal(id.operationThisTurn,true);assert.equal(id.flipped,false);
   const credits=c.corp.creditPool;id.responseOnCorpActionPhaseEnds.Resolve.call(id);assert.equal(c.corp.creditPool,credits+1);assert.equal(id.flipped,true);
   id.responseOnCorpTurnBegins.Resolve.call(id);const clicks=c.corp.clickTracker;id.automaticOnPlay.Resolve.call(id,c.op);id.automaticOnPlay.Resolve.call(id,c.op);assert.equal(c.corp.clickTracker,clicks+1,'first operation only');
   evaluate(g,'attackedServer=corp.archives');id.responseOnRunSuccessful.Resolve.call(id);assert.equal(id.flipped,true);evaluate(g,'attackedServer=corp.HQ');id.responseOnRunSuccessful.Resolve.call(id);assert.equal(id.flipped,false);
  }finally{g.close();}
 }
 {
  const g=fixture(35058);try{const c=g.context,id=c.corp.identityCard;evaluate(g,'runner.tags=2');id.abilities[0].Resolve.call(id);assert.equal(c.runner.tags,1);assert.equal(c.corp.creditPool,22);assert.equal(c.corp.clickTracker,2);assert(id.coreTagPending);
   c.NRCoreFlushTags();await choose(g,o=>o.command==='trigger');await choose(g,o=>/Decline free install/.test(o.label));assert(!id.coreTagPending);c.RemoveTags(1);assert.equal(id.coreTagPending,false,'only first removal qualifies even if declined');
   id.responseOnRunnerTurnBegins.Resolve.call(id);c.RemoveTags(0);assert(!id.coreTagPending);evaluate(g,'runner.tags=1');c.RemoveTags(1);assert(id.coreTagPending,'reset on either turn');
  }finally{g.close();}
 }
 {
  const g=fixture();try{const c=g.context;evaluate(g,`var agenda=AllCards(corp).find(c=>c.setNumber===35059);MoveCard(agenda,corp.scoreArea);agenda.advancement=5;intended.score=agenda;agenda.responseOnScored.Resolve.call(agenda);intended.score=null;`);assert.equal(c.agenda.agenda,4);
   c.agenda.responseOnCorpDiscardEnds.Resolve.call(c.agenda);await choose(g,o=>/Keep agenda counter/.test(o.label));assert.equal(c.agenda.agenda,4);
  }finally{g.close();}
 }
 {
  const g=fixture();try{const c=g.context;evaluate(g,`var agenda=AllCards(corp).find(c=>c.setNumber===35060);MoveCard(agenda,runner.scoreArea);intended.steal=agenda;agenda.responseOnStolen.Resolve.call(agenda);intended.steal=null;`);assert.equal(c.agenda.agenda,1);assert(c.ActiveCards(c.corp).includes(c.agenda));assert.equal(c.agenda.abilities[0].Enumerate.call(c.agenda).length,1);
   const before=c.corp.HQ.cards.length;c.agenda.abilities[0].Resolve.call(c.agenda);let s=await g.api.advance();assert.equal(c.corp.HQ.cards.length,before+4);assert.equal(c.agenda.agenda,0);await choose(g,o=>/Finish shuffling/.test(o.label));assert.equal(c.corp.clickTracker,2);checkState(g);
  }finally{g.close();}
 }
 for(const remove of [0,1,2]){
  const g=fixture();try{const c=g.context;evaluate(g,`runner.tags=2;runner.creditPool=7;var op=AllCards(corp).find(c=>c.setNumber===35065);`);c.op.Resolve.call(c.op);await choose(g,o=>o.label===`Remove ${remove} tags`);assert.equal(c.runner.tags,2-remove);const loss=Math.min(7,5*remove);assert.equal(c.runner.creditPool,7-loss);assert.equal(c.corp.creditPool,20+loss);
  }finally{g.close();}
 }
 {
  const g=fixture();try{const c=g.context;evaluate(g,`runner.tags=3;var agenda=AllCards(corp).find(c=>c.setNumber===35059);MoveCard(agenda,runner.scoreArea);agenda.agenda=4;var op=AllCards(corp).find(c=>c.setNumber===35066);MoveCard(op,corp.HQ.cards);Play(op,function(finish){SpendCredits(corp,PlayCost(op),'playing',op,finish);});`);
   const quote=choices(g.api.snapshot()).find(o=>o.card?.number===35059);assert.equal(quote.cost.credits,2);assert.match(quote.cost.note,/Remove 2 tags/);
   await choose(g,o=>o.card?.number===35059);assert.equal(c.runner.tags,1,'X tags paid before the operation resolves');assert.equal(c.corp.creditPool,18);assert(!c.runner.scoreArea.includes(c.agenda)||c.currentPhase.title==='IP Enforcement');
   await choose(g,o=>o.command==='install'&&o.server==='New remote');
   await g.api.advance();assert.equal(c.CheckInstalled(c.agenda),true);assert.equal(c.agenda.advancement,1);assert.equal(c.agenda.agenda,0);assert.equal(c.runner.scoreArea.length,0);checkState(g);
  }finally{g.close();}
 }
 console.log('PASS six local NBN ports: identity faces/first-per-turn, Synapse removal/decline/reset, Dividends, stolen agenda paid ability, Bigger Picture capped drain, IP X credit/tag costs and reclaimed installation. Full protocol/AI audit remains pending.');
})().catch(e=>{console.error(e);process.exitCode=1});
