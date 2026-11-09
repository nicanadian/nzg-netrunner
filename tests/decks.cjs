'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const decks=require('../engine/deck-catalog.js'),data=require('../assets/card-data.json');
const {makeGame,choices,checkState,checkSnapshot}=require('./engine-smoke.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
function catalog(){
 assert.equal(decks.catalog.length,7);assert.equal(new Set(decks.catalog.map(d=>d.id)).size,7);
 const original=require('../eval/deck-benchmark/current-lists.json');
 const lists=new Map([...decks.catalog,...original.map(d=>decks.resolve({[d.side]:d.id})[d.side]),decks.resolve({corp:'built-to-last-v1'}).corp].map(d=>[d.id,d]));
 for(const deck of lists.values()){
  const identity=data[deck.identity];assert.equal(identity.type_code,'identity');
  const numbers=new Set();let count=0,influence=0,points=0;
  for(const [number,copies] of deck.cards){
   assert.ok(!numbers.has(number));numbers.add(number);const card=data[number];assert.ok(card);
   assert.equal(card.side_code,deck.side);assert.ok(copies>0&&copies<4);assert.ok(copies<=(card.deck_limit||3));
   count+=copies;influence+=(card.faction_code===identity.faction_code?0:card.faction_cost||0)*copies;
   points+=(card.agenda_points||0)*copies;
   if(card.type_code==='agenda')assert.ok(card.faction_code===identity.faction_code||card.faction_code==='neutral-corp','No out-of-faction agendas');
   assert.ok(fs.existsSync(`assets/cards-display/${number}-600.webp`));
  }
  assert.equal(count,['precision-design-v2','restoring-humanity-v2','reality-plus-v2'].includes(deck.id)?44:40);assert.ok(count>=identity.minimum_deck_size);assert.ok(influence<=identity.influence_limit);
  if(deck.side==='corp')assert.ok(points>=18&&points<=19);
  assert.ok(fs.existsSync(`assets/cards-display/${deck.identity}-600.webp`));
 }
 for(const d of original)assert.deepEqual(decks.resolve({[d.side]:d.id})[d.side].cards,d.cards,'Previously shipped deck IDs remain unchanged');
 assert.equal(decks.defaults.corp,'precision-design-v2');
 assert.equal(decks.resolve().corp.id,'precision-design-v1');
 assert.equal(decks.resolve({runner:'loup-v1'}).corp.id,'precision-design-v1');
 assert.throws(()=>decks.resolve({runner:'reality-plus-v1'}),/Unknown/);
 assert.throws(()=>decks.resolve({runner:'removed-deck'}),/Unknown/);
 assert.throws(()=>decks.resolve([]),/Invalid/);
}
function frontend(){
 const source=fs.readFileSync('app/table.js','utf8'),elements=new Map();
 const $=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',value:'',hidden:true,classList:{remove(){}},showModal(){this.open=true;}});return elements.get(s);};
 const context=vm.createContext({DECKS:decks,DATA:data,$,esc:s=>String(s),selectedDeckIds:{...decks.defaults},role:'runner',session:null,closeDialogs(){},opponentCurrent:null,ENGINE:'chiriboga-77c80b1-local-1'});
 vm.runInContext(source.slice(source.indexOf('function deckStats('),source.indexOf('document.addEventListener("click",')),context);
 vm.runInContext(source.slice(source.indexOf('function validateReplay('),source.indexOf('function rememberActionFocus(')),context);
 for(const side of ['runner','corp']){
  context.role=side;context.renderCharacterPicker();
  assert.equal(($('#your-character').innerHTML.match(/<option /g)||[]).length,side==='runner'?3:4);
  assert.equal(($('#opponent-character').innerHTML.match(/<option /g)||[]).length,side==='runner'?4:3);
 }
 context.selectedDeckIds={runner:'tao-v1',corp:'built-to-last-v2'};context.renderCharacterPicker();context.viewDecks();
 assert.match($('#your-character').innerHTML+$('#opponent-character').innerHTML,/built-to-last-v2/);
 assert.ok(!($('#your-character').innerHTML+$('#opponent-character').innerHTML).includes('built-to-last-v1'));
 assert.match($('#deck-content').innerHTML,/Tāo Salonga/);assert.match($('#deck-content').innerHTML,/Built to Last/);
 const replay={engine:context.ENGINE,config:{side:'runner',seed:'catalog',deckIds:context.selectedDeckIds,decks:{runner:{identity:999}}},choices:[]};
 const restored=plain(context.validateReplay(replay));assert.deepEqual(restored.config,{side:'runner',seed:'catalog',deckIds:context.selectedDeckIds});
 const legacy=plain(context.validateReplay({...replay,config:{side:'corp',seed:'old'}}));assert.deepEqual(legacy.config,{side:'corp',seed:'old'});
 const current=plain(context.validateReplay({...replay,config:{...replay.config,rulesVersion:'26.03-local-1'}}));assert.equal(current.config.rulesVersion,'26.03-local-1');
 const paid=plain(context.validateReplay({...replay,config:{...replay.config,rulesVersion:'26.03-local-2'}}));assert.equal(paid.config.rulesVersion,'26.03-local-2');
 assert.throws(()=>context.validateReplay({...replay,config:{...replay.config,rulesVersion:'unknown'}}),/Unsupported/);
 assert.throws(()=>context.validateReplay({...replay,config:{...replay.config,deckIds:{corp:'missing-v1'}}}),/Unknown/);
 $('#game').hidden=false;context.session={config:{deckIds:{runner:'zahya-v1',corp:'reality-plus-v1'}}};context.viewDecks();
 assert.match($('#deck-content').innerHTML,/Zahya/);assert.match($('#deck-content').innerHTML,/Reality Plus/);
}
async function openingAndReplay(){
 for(const deck of decks.catalog){
  const g=makeGame();try{
   const config={side:deck.side,seed:'deck-opening-'+deck.id,deckIds:{...decks.defaults,[deck.side]:deck.id}};
   g.api.boot(config);let s=await g.api.advance();checkState(g);checkSnapshot(g,s);
   assert.equal(s[deck.side].identity.number,deck.identity);assert.equal(s[deck.side].hand.length,5);
   const mulligan=choices(s).find(o=>o.command==='m');assert.ok(mulligan);g.api.choose({version:s.version,command:'m',index:mulligan.index});
   s=await g.api.advance();checkSnapshot(g,s);assert.equal(s[deck.side].identity.number,deck.identity);
  }finally{g.close();}
 }
 const config={side:'corp',seed:'character-replay',deckIds:{runner:'zahya-v2',corp:'reality-plus-v2'}},a=makeGame(),b=makeGame();
 try{
  a.api.boot(config);let s=await a.api.advance(),trace=[];
  for(let i=0;i<6;i++){
   const options=choices(s),option=options.find(o=>o.command==='n')||options.find(o=>o.command==='gain')||options[0];
   const c={version:s.version,command:option.command,index:option.index};trace.push(c);a.api.choose(c);s=await a.api.advance();
  }
  b.context.importScripts=()=>{};const messages=[];b.context.postMessage=m=>messages.push(plain(m));
  vm.runInContext(fs.readFileSync('engine/worker.js','utf8'),b.context);
  await b.context.onmessage({data:{type:'start',config,replay:trace}});
  assert.equal(messages.at(-1).type,'state');assert.deepEqual(messages.at(-1).state,plain(s),'Worker replay restores both selected characters exactly');
 }finally{a.close();b.close();}
}
async function versionedWeyland(){
 const old=decks.resolve({corp:'built-to-last-v1'}).corp,current=decks.resolve({corp:'built-to-last-v2'}).corp;
 const ice=d=>d.cards.filter(([n])=>data[n].type_code==='ice').reduce((sum,[,q])=>sum+q,0);
 assert.equal(ice(old),12);assert.equal(ice(current),16);
 assert.equal(current.cards.filter(([n])=>data[n].type_code==='ice'&&data[n].cost<=3).reduce((sum,[,q])=>sum+q,0),12);
 assert.equal(new Map(current.cards).get(30055),3);assert.equal(new Map(current.cards).get(30073),3);
 assert.equal(new Map(current.cards).get(30063),2);assert.equal(new Map(current.cards).get(30064),1);
 // An actual pre-revision UI export must still reach its original third-turn position.
 const replay=require('../eval/weyland-reliability/chrome-opening-replay.json'),g=makeGame();
 try{
  g.api.boot(replay.config);let s=await g.api.advance();
  for(const c of replay.choices){g.api.choose(c);s=await g.api.advance();checkSnapshot(g,s);}
  assert.equal(s.turn,5);assert.equal(s.phase.identifier,'Corp 2.2');assert.equal(s.corp.credits,13);
 }finally{g.close();}
}
async function revisedLists(){
 const expected=require('../eval/deck-revisions/candidates.json');
 for(const d of expected)assert.deepEqual(decks.resolve({[d.side]:d.id})[d.side].cards,d.cards);
 for(const file of ['eval/run-drawer-panel/loup/full-game-replay.json','eval/run-drawer-panel/jinteki/final-replay.json','eval/run-drawer-panel/tao/full-game.json']){
  const r=require('../'+file),g=makeGame();
  try{g.api.boot(r.config);let s=await g.api.advance();for(const c of r.choices){g.api.choose(c);s=await g.api.advance();checkSnapshot(g,s);}assert.equal(s.terminal?.winner,'runner',file+' retains original terminal outcome');}finally{g.close();}
 }
}
async function identityEffects(){
 // Native effect handlers and choice phases, without changing vendor scripts.
 const cases=[
  {side:'runner',id:'zahya-v1',setup:`runner.identityCard.cardsAccessedThisRun=2;runner.identityCard.usedThisTurn=false;Trigger(runner.identityCard,runner.identityCard.responseOnRunEnds,{});`,label:/Gain 2/,gain:2},
  {side:'corp',id:'restoring-humanity-v1',setup:`var archived=AllCards(corp).find(c=>c.cardType!=='identity');MoveCard(archived,corp.archives.cards);archived.faceUp=false;TriggeredResponsePhase(corp,'responseOnCorpDiscardEnds',[],()=>ChangePhase(phases.corpActionMain),'Discard ends');`,gain:1},
  {side:'corp',id:'reality-plus-v1',setup:`AddTags(1);`,label:/Gain 2/,gain:2},
 ];
 for(const c of cases){const g=makeGame();try{
  g.api.boot({side:c.side,seed:'identity-'+c.id,deckIds:{[c.side]:c.id}});
  vm.runInContext(`corp.AI=null;runner.AI=null;playerTurn=${c.side};ChangePhase(phases.${c.side==='corp'?'corpActionMain':'runnerActionMain'});`,g.context);
  const before=g.context[c.side].creditPool;vm.runInContext(c.setup,g.context);
  let s=await g.api.advance();
  for(let n=0;n<8&&g.context[c.side].creditPool===before;n++){
   const option=choices(s).find(o=>c.label?.test(o.label))||choices(s).find(o=>o.card?.number===g.context[c.side].identityCard.setNumber)||choices(s)[0];
   assert.ok(option);g.api.choose({version:s.version,command:option.command,index:option.index});s=await g.api.advance();
  }
  assert.equal(g.context[c.side].creditPool-before,c.gain,c.id+' identity pays its native reward');
 }finally{g.close();}}
 const g=makeGame();try{
  g.api.boot({side:'corp',seed:'built-to-last-effect',deckIds:{corp:'built-to-last-v1'}});
  vm.runInContext(`playerTurn=corp;corp.clickTracker=3;ChangePhase(phases.corpActionMain);var advanced=AllCards(corp).find(c=>c.setNumber===30070);var remote=NewServer('Remote 0',false);corp.remoteServers.push(remote);MoveCard(advanced,remote.root);`,g.context);
  let s=g.api.snapshot(),before=s.corp.credits;const advance=choices(s).find(o=>o.command==='advance');assert.ok(advance);
  g.api.choose({version:s.version,command:'advance',index:advance.index});s=await g.api.advance();assert.equal(s.corp.credits,before+1,'First advancement spends 1 and gains 2');
 }finally{g.close();}
 const tao=makeGame();try{
  tao.api.boot({side:'runner',seed:'tao-deck-effect',deckIds:{runner:'tao-v1'}});
  vm.runInContext(`
   var firstIce=AllCards(corp).find(c=>c.setNumber===30072),secondIce=AllCards(corp).find(c=>c.setNumber===30073);
   MoveCard(firstIce,corp.HQ.ice);MoveCard(secondIce,corp.RnD.ice);
   DecisionPhase(runner,runner.identityCard.SharedEnumerate(),function(params){this.SharedResolve(params.cards);},'Tāo Salonga','Swap two pieces of ice',runner.identityCard);
  `,tao.context);
  const s=tao.api.snapshot(),targets=choices(s).filter(o=>o.card);assert.equal(targets.length,2);
  assert.ok(targets.every(o=>o.card.hidden));tao.api.choose({version:s.version,command:targets[0].command,index:targets[0].index,cards:targets.map(o=>o.card.id)});
  assert.equal(tao.context.corp.HQ.ice[0],tao.context.secondIce);assert.equal(tao.context.corp.RnD.ice[0],tao.context.firstIce);
 }finally{tao.close();}
}
async function main(){catalog();frontend();await openingAndReplay();await versionedWeyland();await revisedLists();await identityEffects();console.log('Character decks: seven legal lists/assets, side-aware lobby/deck view, safe replay config, all openings/mulligans, selected worker restore and native identity rewards pass.');}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={main};
