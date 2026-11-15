'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const docs=require('../engine/deck-document.js'),gateway=require('../engine/deck-catalog.js'),core=require('../engine/core-decks.js'),net=require('../engine/net-decks.js'),data=require('../assets/card-data.json');
const {createGame}=require('../engine/runtime.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
(async()=>{
 const {gatewayVariants}=await import('../app/ready-made-decks.mjs');
 const snapshots=[...require('../eval/deck-experiments/experiment-1/economy.json').runners.slice(1),...require('../eval/deck-experiments/experiment-2/ablation.json').corps];
 for(let i=0;i<gatewayVariants.length;i++){
  const d=gatewayVariants[i];assert(docs.validate(d.document).valid);if(i<3)assert.equal(docs.contentKey(d.document),docs.contentKey(snapshots[i].deck),'Previously published variants retain their exact tested card lists');assert(Object.isFrozen(d.document));
 }
 const source=fs.readFileSync('app/table.js','utf8');
 function ui(list,defaults,preview=false){
  const elements=new Map(),$=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',value:'',textContent:''});return elements.get(id);};
  const context=vm.createContext({$: $,DATA:data,esc:String,selectedDeckIds:{...defaults},role:'runner',NR_CORE_PREVIEW:preview,NRCoreDecks:core,NRDeckDocument:docs,deckBuilder:{list:()=>list,document:d=>d.document||docs.normalize({...d,pool:preview?'core-v1':'gateway-v1'})}});
  context.resolveDecks=ids=>Object.fromEntries(['runner','corp'].map(side=>[side,list.find(d=>d.id===ids[side])]));
  vm.runInContext(source.slice(source.indexOf('function deckStats('),source.indexOf('\nfunction viewDecks()')),context);
  return {context,$};
 }
 const list=[...gateway.catalog,...gatewayVariants],{context:c,$}=ui(list,gateway.defaults);
 c.renderCharacterPicker();assert.equal(($('#your-deck').innerHTML.match(/<optgroup/g)||[]).length,3);assert.equal(($('#opponent-deck').innerHTML.match(/<optgroup/g)||[]).length,4);
 c.selectedDeckIds.corp='local-deleted';c.renderCharacterPicker();assert.equal(c.selectedDeckIds.corp,gateway.defaults.corp,'Stale opponent selections are repaired before resolving the matchup');
 assert.equal(list.length,15);
 assert.equal(new Set(list.map(d=>docs.contentKey(d.document||docs.normalize({...d,pool:'gateway-v1'})))).size,15,'Alternatives are distinct lists, not renamed duplicates');
 for(const identity of new Set(list.map(d=>d.identity)))assert(list.filter(d=>d.identity===identity).length>=2,'Every Gateway identity has an alternative');
 c.selectedDeckIds.runner='tao-mayfly-v1';c.renderCharacterPicker();assert.equal($('#your-deck').value,'tao-mayfly-v1');assert.match($('#your-character-summary').innerHTML,/Mayfly backup/);assert.match($('#your-character-summary').innerHTML,/Tāo Salonga/);
 assert.match($('#your-deck').innerHTML,/loup-burst-v1/,'All characters’ decks are available from one picker');
 c.role='corp';c.renderCharacterPicker();assert.equal($('#opponent-deck').value,'tao-mayfly-v1','Role swap preserves the other side’s chosen variant');
 c.selectedDeckIds.corp='restoring-humanity-planogram-v1';c.renderCharacterPicker();assert.equal($('#your-deck').value,'restoring-humanity-planogram-v1');
 const custom={...gatewayVariants[0],id:'local-test',name:'My custom Tao',loadoutName:null,local:true};list.push(custom);c.selectedDeckIds.runner=custom.id;c.renderCharacterPicker();assert.equal($('#opponent-deck').value,custom.id);assert.match($('#opponent-deck').innerHTML,/My custom Tao/);
 const keys=new Set(core.catalog.map(d=>docs.contentKey({...d,pool:'core-v1'})));const coreLists=[...core.catalog,...net.catalog.filter(d=>!keys.has(docs.contentKey(d.document)))];assert.equal(coreLists.length,21);
 const coreUI=ui(coreLists,core.defaults,true);coreUI.context.renderCharacterPicker();assert.equal((coreUI.$('#your-deck').innerHTML.match(/<optgroup/g)||[]).length,9);assert.equal((coreUI.$('#opponent-deck').innerHTML.match(/<optgroup/g)||[]).length,12);
 // New variants use embedded documents, so current immutable catalog IDs and
 // any future library edits cannot alter a saved game's actual deck contents.
 for(const d of gatewayVariants){
  const opposite=d.side==='runner'?'corp':'runner';const stock=gateway.catalog.find(x=>x.id===gateway.defaults[opposite]);
  const documents={[d.side]:d.document,[opposite]:docs.normalize({...stock,pool:'gateway-v1'})};
  const config={side:d.side,seed:'loadout-'+d.id,rulesVersion:'26.03-local-2',deckDocuments:documents};
  vm.runInContext(source.slice(source.indexOf('function validateReplay('),source.indexOf('function rememberActionFocus(')),c);
  assert.deepEqual(plain(c.replayConfig(config)),plain(config),'Actual UI save/restore boundary retains exact variant deck documents');
  const a=createGame(),b=createGame();try{
   a.api.boot(config);let state=await a.api.advance();assert.match(state.phase.identifier,/Mulligan/);
   const keep=state.decision.commands.flatMap(g=>g.options.map(o=>({...o,command:g.command}))).find(o=>o.command==='n');assert(keep,'Keep hand is offered');
   const choice={version:state.version,command:keep.command,index:keep.index};a.api.choose(choice);state=await a.api.advance();
   b.api.boot(JSON.parse(JSON.stringify(config)));await b.api.advance();b.api.choose(choice);const restored=await b.api.advance();assert.deepEqual(plain(restored),plain(state),'Embedded deck variant replays to exactly the same state');
   const actual=a.context.AllCards(a.context[d.side]).filter(card=>card.cardType!=='identity');
   for(const entry of d.document.cards)assert.equal(actual.filter(card=>card.setNumber===Number(entry.id)).length,entry.count,'Actual game contains the tested quantities');
   assert.equal(a.errors.length,0);
  }finally{a.close();b.close();}
 }
 console.log('PASS unified deck/character picker, 15 distinct Gateway lists with alternatives for every identity, immutable shipped variants, custom selection, role changes, Core lists, real openings and exact replay.');
})().catch(e=>{console.error(e);process.exitCode=1;});
