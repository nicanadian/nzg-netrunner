'use strict';
// Browser boundary regressions without launching another Chrome process.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {profile,catalog,documents,decks}=require('../engine/vantage.cjs');
const {createGame}=require('../engine/runtime.cjs');
const source=fs.readFileSync('app/table.js','utf8');
const context=vm.createContext({ENGINE:'local-table-1',NR_VANTAGE_PREVIEW:true,NR_CORE_PREVIEW:true,NRVantagePreview:profile,NRCoreDecks:require('../engine/core-decks.js'),NRDeckDocument:documents,resolveDecks(){throw Error('Exact documents must not depend on mutable library ids');}});
vm.runInContext(source.slice(source.indexOf('function validateReplay('),source.indexOf('function start(')),context);
for(const rulesVersion of profile.supportedRules){
 const replay={engine:profile.engines[rulesVersion],config:{side:'runner',seed:'ui-contract',cardPool:profile.cardPool,rulesVersion,deckDocuments:Object.fromEntries(['runner','corp'].map(side=>[side,decks.find(d=>d.document.side===side).document]))},choices:[]};
 assert.equal(context.validateReplay(replay).engine,replay.engine);
 assert.throws(()=>context.validateReplay({...replay,engine:'local-vantage-preview-999'}),/compatible/);
 assert.throws(()=>context.validateReplay({...replay,engine:rulesVersion.endsWith('-1')?profile.engine:profile.engines['26.03-vantage-1']}),/do not match/);
 assert.throws(()=>context.validateReplay({...replay,config:{...replay.config,deckDocuments:undefined}}),/both saved deck/);
}
context.NR_VANTAGE_PREVIEW=false;assert.throws(()=>context.replayConfig({cardPool:profile.cardPool,rulesVersion:profile.rulesVersion}),/Choose the Vantage/);
(async()=>{
 const g=createGame({vantage:true});try{
  g.api.boot({side:'runner',control:'scripted',seed:'corsair-advisory',...profile,deckDocuments:Object.fromEntries(['runner','corp'].map(side=>[side,decks.find(d=>d.document.side===side).document]))});
  vm.runInContext('var corsair=AllCards(runner).find(c=>c.setNumber===36004),touchstone=AllCards(runner).find(c=>c.setNumber===36021),wall=AllCards(corp).find(c=>c.setNumber===36029);MoveCard(corsair,runner.rig.programs);MoveCard(touchstone,runner.rig.hardware);MoveCard(wall,corp.HQ.ice);corsair.faceUp=true;touchstone.faceUp=true;wall.rezzed=true;runner.creditPool=20;touchstone.credits=1;attackedServer=corp.HQ;approachIce=0;encountering=true;playerTurn=runner;ChangePhase(phases.runEncounterIce);',g.context);
  const s=await g.api.advance(),tool=s.run.tools.find(t=>t.card.number===36004);assert.equal(tool.kind,'stealth-breaker');assert.equal(tool.stealthCredits,1);assert.equal(tool.requiredStealth,1);assert.equal(tool.gap,2);
  const {encounterTool}=await import('../app/encounter.mjs'),rendered=encounterTool(tool);assert.match(JSON.stringify(rendered),/stealth/i);assert.match(JSON.stringify(rendered),/1/);
 }finally{g.close();}
 // The real builder binds the explicit catalog when mounted, so unsupported
 // cards remain absent even after the module was imported on a base page.
 require('../engine/card-catalog.js');const {mountDeckBuilder}=await import('../app/deck-builder.mjs');
 class Dialog{constructor(){this.nodes=new Map();this.events={};this.innerHTML='';}setAttribute(){}insertAdjacentHTML(_,s){this.innerHTML+=s;}querySelector(k){if(!this.nodes.has(k))this.nodes.set(k,{innerHTML:'',textContent:'',scrollTop:0});return this.nodes.get(k);}querySelectorAll(){return [];}addEventListener(t,f){this.events[t]=f;}showModal(){this.open=true;}close(){this.open=false;}}
 const storage=new Map([['netrunner-deck-draft-v1','base draft preserved']]),dialogs=[];global.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};global.document={createElement(){const d=new Dialog();dialogs.push(d);return d;},body:{append(){}}};global.NRCardCatalog=catalog;global.NRDeckDocument=documents;
 const bundled=decks.map(e=>({...e,...e.document,identity:Number(e.document.identity),cards:e.document.cards.map(c=>[+c.id,c.count])}));const b=mountDeckBuilder({pool:profile.cardPool,bundled});b.tune(decks[0].id);
 const d=dialogs[0],results=d.querySelector('#builder-results').innerHTML;assert.match(results,/data-add="36004"/);assert.match(results,/data-add="36001"/);assert(storage.has('netrunner-deck-draft-vantage-preview-v1'));assert.equal(storage.get('netrunner-deck-draft-v1'),'base draft preserved');
 const before=storage.get('netrunner-deck-draft-vantage-preview-v1'),button={dataset:{add:'99999'},hasAttribute:k=>k==='data-add',closest:()=>null};await d.events.click({target:{closest:()=>button},stopPropagation(){}});assert.equal(storage.get('netrunner-deck-draft-vantage-preview-v1'),before,'Stale unsupported add cannot change a draft');
 console.log('PASS Vantage browser contracts: v1/v2 replay routing, exact saved documents, mismatched engines blocked, Corsair stealth advisory, catalog binding, unsupported selection blocked, isolated draft persistence.');
})().catch(error=>{console.error(error);process.exitCode=1;});
