'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('app/table.js','utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
const nodes=new Map(),storage=new Map();let started,terminated=0,focused,scrolled;
const context=vm.createContext({
  $:id=>{if(!nodes.has(id))nodes.set(id,{focus(){focused=id;},scrollIntoView(){scrolled=id;}});return nodes.get(id);},
  localStorage:{getItem:key=>storage.get(key)||null},SAVE:'test-save',
  deferredAutomatic:{},activePlan:{},installTransaction:{},automaticReceiptBefore:{},
  worker:{terminate(){terminated++;}},watchdog:null,presentationTimer:null,
  clearTimeout(){},stopOpponentPlayback(){},closeDialogs(){},hideHover(){},
  resumeSummary:saved=>saved?'Saved matchup':'',crypto,
  start:(...args)=>{started=args;},validateReplay:save=>save,
  state:{terminal:{winner:'corp'}},session:null,
});
vm.runInContext(source.slice(source.indexOf('function readSave()'),source.indexOf('function resumeSummary(')),context);
vm.runInContext(source.slice(source.indexOf('function lobby()'),source.indexOf('function showZone(')),context);
vm.runInContext(source.slice(source.indexOf('$("#resume-button").onclick ='),source.indexOf('$("#deck-button").onclick')),context);
vm.runInContext(source.match(/^\$\("#new-button"\)\.onclick = .*;$/m)[0],context);

for(const config of [
  {side:'corp',seed:'old-seed',rulesVersion:'26.03-local-2',deckIds:{runner:'tao-v1',corp:'built-to-last-v2'}},
  {side:'runner',seed:'old-core-seed',rulesVersion:'test-core-version',cardPool:'core-v1',deckDocuments:{runner:{identity:'30019',name:'My tuned deck',cards:[{id:'30024',count:2}]},corp:{identity:'30059',cards:[]}}},
]){
  const session={engine:'test',config,choices:[{command:'m',index:0,version:1}],conceded:true};
  const serialized=JSON.stringify(session);storage.set('test-save',serialized);context.session=structuredClone(session);started=null;
  // The real menu route stops playback and focuses deck setup without rewriting the save.
  nodes.get('#new-button').onclick();
  assert.equal(storage.get('test-save'),serialized);
  assert.equal(started,null);assert.equal(context.worker,null);
  assert.equal(nodes.get('#game').hidden,true);assert.equal(nodes.get('#lobby').hidden,false);
  assert.equal(nodes.get('#resume-button').hidden,false);assert.equal(nodes.get('#resume-help').hidden,false);
  assert.equal(focused,'#your-deck');assert.equal(scrolled,'#character-picker');
  // Changing setup choices must not substitute them into a resumed or rematched game.
  context.selectedDeckIds={runner:'zahya-v1',corp:'reality-plus-v1'};
  nodes.get('#resume-button').onclick();
  assert.deepEqual(plain(started),[config,session.choices,true]);
  context.rematch();
  assert.equal(started.length,1,'A rematch starts fresh without replaying decisions or conceding');
  const rematch=plain(started[0]);assert.notEqual(rematch.seed,config.seed);
  assert.deepEqual({...rematch,seed:config.seed},config,'Exact rules, card sets and custom deck documents survive a rematch');
  assert.deepEqual(plain(context.session),session,'Preparing a rematch leaves the previous session untouched');
}
assert.equal(terminated,1);
started=null;context.state={terminal:null};context.rematch();assert.equal(started,null,'A live game cannot be rematched through a stale action');
storage.clear();context.lobby();assert.equal(nodes.get('#resume-button').hidden,true);assert.equal(nodes.get('#resume-help').hidden,true);
for(const [core,vantage,label]of [[false,false,'SYSTEM GATEWAY'],[true,false,'SYSTEM GATEWAY + ELEVATION (PREVIEW)'],[true,true,'VANTAGE POINT (PREVIEW)']]){
  context.NR_CORE_PREVIEW=core;context.NR_VANTAGE_PREVIEW=vantage;context.lobby();
  assert.equal(nodes.get('#session-label').textContent,label,'Lobby header matches the selected card sets');
}
console.log('PASS deck setup preserves saved games; resume restores the original matchup; rematch retains exact decks/rules with a new seed and no old decisions.');

// The lobby uses the same inspector as the live table, before state exists.
async function checkLobbyInspection(){
  const counters=await import('../app/counters.mjs');
  const {virusStatus}=await import('../app/virus.mjs');
  const {corpAssetRezHint,corpIceRezHint}=await import('../app/encounter.mjs');
  const {rulesTextHTML}=await import('../app/playtest-polish.mjs');
  const DATA={...require('../assets/card-data.json'),...require('../engine/vantage-catalog.js').cards};
  const elements=new Map();let selected;
  const get=selector=>{
    if(!elements.has(selector))elements.set(selector,{
      innerHTML:'',attributes:{},open:false,
      insertAdjacentHTML(position,html){this.innerHTML+=html;},
      setAttribute(name,value){this.attributes[name]=value;},
      showModal(){this.open=true;},close(){this.open=false;},
    });
    return elements.get(selector);
  };
  const inspector=vm.createContext({
    ...counters,virusStatus,corpAssetRezHint,corpIceRezHint,rulesTextHTML,DATA,$:get,
    state:undefined,busy:false,installTransaction:null,opponentCurrent:null,
    hideHover(){},gameHelper:{setSelected(card){selected=card;}},esc:String,
  });
  vm.runInContext(source.slice(source.indexOf('function actionRefs('),source.indexOf('function cardHTML(')),inspector);
  vm.runInContext(source.slice(source.indexOf('function inspect(card)'),source.indexOf('function renderInstallation(')),inspector);
  // Execute the actual data-library click branch used by both the portrait
  // and the Read identity ability button (also the deck library rows).
  vm.runInContext('function openLibrary(el){'+source.slice(source.indexOf('  if (el.dataset.library)'),source.indexOf('  if (el.dataset.inspectTool)'))+'}',inspector);
  const identities=Object.entries(DATA).filter(([,card])=>card.type_code==='identity');
  for(const gameState of [undefined,{side:'corp',decision:null}]){
    inspector.state=gameState;
    for(const [number,card]of identities){
      get('#inspect-dialog').close();
      inspector.openLibrary({dataset:{library:number}});
      assert.equal(get('#inspect-dialog').open,true,`${card.title}: opens before a game and after returning to lobby`);
      assert.equal(get('#inspect-dialog').attributes['aria-label'],card.title+' card details');
      const ability=(card.stripped_text||card.text).split(/\[credit\]|\[click\]|\bclick\b/gi).filter(s=>s.trim());
      for(const phrase of ability)assert.ok(get('#inspect-content').innerHTML.includes(phrase.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')),`${card.title}: ability text is shown`);
      assert.ok(get('#inspect-content').innerHTML.includes(`/assets/cards-display/${number}-743.webp`));
      assert.equal(selected.number,Number(number));
    }
  }
  console.log(`PASS lobby identity inspection: ${identities.length} identities open with ability text and full-size art before a game and after returning to lobby.`);
}
checkLobbyInspection().catch(error=>{console.error(error);process.exitCode=1;});
