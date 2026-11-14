'use strict';
// Foundation checks, not a certificate that every expansion card is correct.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {makeGame,checkState,checkSnapshot}=require('./engine-smoke.cjs');
const core=require('../engine/core-decks.js');const gateway=require('../engine/deck-catalog.js');
const data=require('../assets/card-data.json');
const extraScripts=require('../engine/runtime.cjs').CORE_SCRIPTS;
(async()=>{
 assert.equal(gateway.catalog.length,7,'Gateway catalog stays separate');
 for(const deck of core.catalog){
  const identity=data[deck.identity],size=deck.cards.reduce((sum,[,n])=>sum+n,0);
  assert(size>=identity.minimum_deck_size);
  const influence=deck.cards.reduce((sum,[id,n])=>sum+(data[id].faction_code===identity.faction_code?0:data[id].faction_cost||0)*n,0);
  assert(influence<=identity.influence_limit);assert(deck.cards.every(([id,n])=>data[id]&&n<=data[id].deck_limit));
  if(deck.side==='corp'){const points=deck.cards.reduce((sum,[id,n])=>sum+(data[id].agenda_points||0)*n,0);const min=2*Math.floor(size/5)+2;assert(points>=min&&points<=min+1);}
 }
 const config={side:'runner',faceoff:true,seed:'core-profile-1',cardPool:'core-v1',rulesVersion:'26.03-core-1',deckIds:core.defaults};
 for(const patch of [{rulesVersion:'26.03-local-2'},{cardPool:'unknown'},{deckIds:{...core.defaults,corp:'precision-design-v2'}}]){
  const g=makeGame({extraScripts});try{assert.throws(()=>g.api.boot({...config,...patch}),/Core Sets|card pool/);}finally{g.close();}
 }
 const g=makeGame({extraScripts});
 try{
  const skip={card:null,label:'Decline'};
  // The native AI ranker must accept an effect with no actual install targets.
  const ai=require('node:vm').runInContext('new CorpAI()',g.context);assert.equal(ai._bestInstallOption([skip],false),0);
  g.api.boot(config);let s;
  for(let i=0;i<20;i++){s=await g.api.advance(300);checkState(g);checkSnapshot(g,s);if(s.terminal)break;}
  assert(s.terminal,'First Core Sets AI smoke match must finish');assert.equal(g.api.metrics().diagnostics.length,0);assert.deepEqual(g.errors,[]);
  console.log(`PASS Core Sets foundation: official 45/44-card lists, influence/agendas, isolated profile, decline-safe AI, terminal smoke match (${s.steps} native decisions). Card-by-card rules audit remains required.`);
 }finally{g.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
