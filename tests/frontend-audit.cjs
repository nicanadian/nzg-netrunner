'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {makeGame,choices,checkSnapshot}=require('./engine-smoke.cjs');
const plain=value=>JSON.parse(JSON.stringify(value));
async function upstreamChoiceParity(){
 const shape=options=>Object.fromEntries(Object.entries(options).filter(([,items])=>items.length).map(([cmd,items])=>[cmd,items.map(o=>({
  card:o.card?.localId || null,host:o.host?.localId || null,server:o.server?.serverName || null,id:o.id ?? null,
  cards:o.cards?.map(c=>c?.localId || null),subroutine:o.subroutine?.text,
  ability:typeof o.ability==='number' ? o.ability : o.ability?.text
 }))]));
 const cases=[['tests/fixtures/corp-draw-feedback-replay.json',0],['tests/fixtures/corp-draw-feedback-replay.json',4],['tests/fixtures/corp-draw-feedback-replay.json',54],
  ['eval/counters/runner-virus-replay.json',null],['eval/counters/corp-advance-replay.json',null],['tests/fixtures/spin-doctor-rez-replay.json',null]];
 for(const [file,prefix]of cases){
  const replay=require('../'+file),game=makeGame();
  try{
   game.api.boot(replay.config);await game.api.advance();
   for(const choice of replay.choices.slice(0,prefix===null ? undefined : prefix)){game.api.choose(choice);await game.api.advance();}
   const adapted=shape(game.context.phaseOptions);
   // Discard this realm afterward: upstream enumeration also contains UI
   // conveniences such as skip-discard flags and isn't a read-only query.
   vm.runInContext('EnumeratePhase();',game.context);
   assert.deepEqual(shape(game.context.phaseOptions),adapted,`${file}: native and adapted legal targets/order agree`);
  }finally{game.close();}
 }
}
async function workerRestoration(){
 const replay=require('./fixtures/corp-draw-feedback-replay.json'),messages=[],worker=makeGame(),direct=makeGame();
 try{
  const prefix=replay.choices.slice(0,6);
  direct.api.boot(replay.config);let expected=await direct.api.advance();
  for(const choice of prefix){direct.api.choose(choice);expected=await direct.api.advance();}
  worker.context.importScripts=()=>{};worker.context.postMessage=message=>messages.push(plain(message));
  vm.runInContext(fs.readFileSync('engine/worker.js','utf8'),worker.context);
  // Make every batch just one real engine resolution. This exercises the
  // batch boundary without fabricating hundreds of cards or changing rules.
  const advance=worker.api.advance;worker.api.advance=(_,observe)=>advance(1,observe);
  await worker.context.onmessage({data:{type:'start',config:replay.config,replay:prefix}});
  assert.equal(messages.at(-1).type,'state');assert.deepEqual(messages.at(-1).state,plain(expected));
  assert.ok(!messages.some(m=>m.type==='opponent-step'),'Restore stays quiet across batches');
  messages.length=0;
  await worker.context.onmessage({data:{type:'choose',choice:replay.choices[6]}});
  direct.api.choose(replay.choices[6]);expected=await direct.api.advance();
  assert.equal(messages[0].type,'resources');assert.equal(messages.at(-1).type,'state');
  assert.deepEqual(messages.at(-1).state,plain(expected),'Live progression also drains to an authoritative human decision');
 }finally{worker.close();direct.close();}
 const stale=makeGame(),failure=[];
 try{
  stale.context.importScripts=()=>{};stale.context.postMessage=m=>failure.push(plain(m));
  vm.runInContext(fs.readFileSync('engine/worker.js','utf8'),stale.context);
  const prefix=replay.choices.slice(0,3),invalid={...replay.choices[3],version:-1};
  await stale.context.onmessage({data:{type:'start',config:replay.config,replay:[...prefix,invalid]}});
  assert.equal(failure.at(-1).type,'error');assert.deepEqual(failure.at(-1).recovery,{choices:3,total:4});
 }finally{stale.close();}
 const observationFailure=makeGame(),errors=[];
 try{
  observationFailure.api.boot(replay.config);await observationFailure.api.advance();
  observationFailure.context.importScripts=()=>{};observationFailure.context.postMessage=m=>errors.push(plain(m));
  vm.runInContext(fs.readFileSync('engine/worker.js','utf8'),observationFailure.context);
  observationFailure.api.snapshot=()=>{throw Error('Observation failed after resolution');};
  await observationFailure.context.onmessage({data:{type:'choose',choice:replay.choices[0]}});
  assert.equal(errors.at(-1).type,'error');assert.equal(errors.at(-1).accepted,true,'Acceptance survives a failed post-choice observation');
 }finally{observationFailure.close();}
 const luminal=require('./fixtures/luminal-extra-clicks-replay.json'),legacy=makeGame(),legacyMessages=[];
 try{
  legacy.context.importScripts=()=>{};legacy.context.postMessage=m=>legacyMessages.push(plain(m));
  vm.runInContext(fs.readFileSync('engine/worker.js','utf8'),legacy.context);
  await legacy.context.onmessage({data:{type:'start',config:luminal.config,replay:[...luminal.choices,{version:364,command:'install',index:1}]}});
  assert.deepEqual(legacyMessages.at(-1).recovery,{choices:35,total:36},'The actual pre-fix Luminal continuation identifies the recoverable prefix');
 }finally{legacy.close();}
 const recovered=makeGame(),recoveredMessages=[];
 try{
  recovered.context.importScripts=()=>{};recovered.context.postMessage=m=>recoveredMessages.push(plain(m));
  vm.runInContext(fs.readFileSync('engine/worker.js','utf8'),recovered.context);
  await recovered.context.onmessage({data:{type:'start',config:luminal.config,replay:luminal.choices}});
  assert.equal(recoveredMessages.at(-1).type,'state');
  assert.equal(recoveredMessages.at(-1).state.corp.clicks,0);assert.equal(recoveredMessages.at(-1).state.runner.clicks,4);
 }finally{recovered.close();}
}
function frontendAcknowledgements(){
 const source=fs.readFileSync('app/table.js','utf8'),elements=new Map(),saved=[],exports=[],listeners={};let context;
 const element=()=>({hidden:false,disabled:false,innerHTML:'',textContent:'',scrollTop:0,classList:{add(){},remove(){},toggle(){}},focus(){}});
 const $=selector=>{if(!elements.has(selector))elements.set(selector,element());return elements.get(selector);};
 const sandbox={$,structuredClone,URLSearchParams,location:{search:''},console:{error(){}},
  document:{activeElement:null,addEventListener:(name,fn)=>{listeners[name]=fn;}},
  clearTimeout(){},setTimeout(){return 1;},matchMedia:()=>({matches:true}),
  Worker:class{constructor(){this.sent=[];}terminate(){this.terminated=true;}postMessage(message){this.sent.push(message);}},
  gameHelper:null,worker:null,watchdog:null,presentationTimer:null,focusIntent:null,previousState:null,
  counterChanges:[],lastResourceChange:null,actionResourceChange:null,actionPresentedAt:0,pendingActionLabel:null,
  activityView:'opponent',cardsById:new Map(),previousCards:new Map(),state:null,busy:false,pending:false,
  selectedCommand:null,multiSelected:[],opponentCurrent:null,opponentQueue:[],opponentTimer:null,opponentFinal:null,opponentSkipped:false,
  ENGINE:'audit',replayRecovery:null,
  renderActionReceipt(){},stopOpponentPlayback(){},hideHover(){},render(){},renderDecisions(){},renderPlayback(){},watch(){},toast(){},closeDialogs(){},rememberActionFocus(){},
  receiptLabel:()=> 'Gain 1 credit',resourceChanges:()=>[],save:()=>saved.push(plain(context.session))};
 context=vm.createContext(sandbox);
 const functions=source.slice(source.indexOf('function start('),source.indexOf('function actionRefs('));
 vm.runInContext(functions,context);
 // This isolated handler harness also needs the real receipt/budget helper
 // invoked by a post-choice resource acknowledgement.
 vm.runInContext(source.slice(source.indexOf('function accountPlanSpending('),source.indexOf('function completeBreakerPlan(')),context);
 // Use the actual delegated click handler for the recovery action.
 vm.runInContext(source.slice(source.indexOf('document.addEventListener("click",'),source.indexOf('document.addEventListener("pointerdown",')),context);
 $('#export-button').onclick=()=>exports.push(plain(context.session));
 const first={version:2,command:'n',index:0};
 const ready=()=>{context.start({side:'corp',seed:'audit'},[first]);context.state={version:10,decision:{commands:[{command:'gain',label:'Gain 1 credit',options:[{index:0}]}]}};context.busy=false;context.choose('gain',0);};
 ready();$('#run-footer').innerHTML='<button>Pass priority</button>';
 context.worker.onmessage({data:{type:'resources',state:{version:11,decision:null}}});
 context.worker.onmessage({data:{type:'error',message:'AI failed after accepting the action'}});
 assert.equal(context.session.choices.length,2,'An acknowledged action survives a later AI error');
 assert.equal(saved.at(-1).choices.length,2);assert.equal(context.state.decision,null);
 assert.equal($('#run-footer').innerHTML,'','An engine error clears pinned run actions');
 const sent=context.worker.sent.length;context.choose('gain',0);assert.equal(context.worker.sent.length,sent,'An errored position cannot submit stale board actions');
 ready();context.worker.onmessage({data:{type:'error',message:'Choice rejected'}});
 assert.equal(context.session.choices.length,1,'A rejected unacknowledged action is rolled back once');
 ready();context.worker.onmessage({data:{type:'error',accepted:true,message:'Observation failed after acceptance'}});
 assert.equal(context.session.choices.length,2,'Acceptance in an error response also preserves the choice');
 const original=[first,{version:10,command:'gain',index:0},{version:15,command:'draw',index:0}];
 context.start({side:'corp',seed:'audit'},original);
 context.worker.onmessage({data:{type:'error',message:'Stale replay',recovery:{choices:2,total:3}}});
 assert.match($('#decisions').innerHTML,/2 of 3/);assert.match($('#decisions').innerHTML,/Export original/);
 assert.deepEqual(plain(context.session.choices),original,'Showing recovery does not truncate the save');
 listeners.click({target:{closest:()=>({hasAttribute:name=>name==='data-recover-replay'})}});
 assert.deepEqual(exports.at(-1).choices,original,'Recovery exports the complete original first');
 assert.deepEqual(plain(context.worker.sent[0].replay),original.slice(0,2));
}
async function viewingWindows(){
 const {phaseHeading}=await import('../app/presentation.mjs'),{helperContext}=await import('../app/helper-context.mjs');
 for(const kind of ['reveal','expose']){
  const game=makeGame();
  try{
   game.api.boot({side:'runner',seed:'audit-viewing-'+kind});
   vm.runInContext(kind==='reveal' ? `
    var auditViewed=corp.RnD.cards[corp.RnD.cards.length-1];
    Reveal(auditViewed,function(){},null);
   ` : `
    var auditViewed=AllCards(corp).find(c=>c.cardType==='ice');
    MoveCard(auditViewed,corp.HQ.ice);auditViewed.faceUp=false;auditViewed.rezzed=false;
    Expose(auditViewed);
   `,game.context);
   let state=await game.api.advance();checkSnapshot(game,state);
   assert.equal(state.viewed.kind,kind);assert.equal(state.viewed.card.id,game.context.auditViewed.localId);
   assert.equal(state.viewed.card.hidden,false);
   assert.match(phaseHeading(state),kind==='reveal' ? /Revealed card/ : /Exposed card/);
   assert.ok(helperContext(state).cards.some(c=>c.id===state.viewed.card.id && /Currently (revealed|exposed)/.test(c.location)));
   const paused=await game.api.advance();assert.equal(paused.steps,state.steps,'A mandatory view waits for the human');
   const next=choices(state).find(o=>o.command==='continue');assert.ok(next);
   game.api.choose({version:state.version,command:next.command,index:next.index});
   state=game.api.snapshot();assert.equal(state.viewed,undefined,'The viewing reference expires on Continue');
   assert.equal(game.context.auditViewed.faceUp,false);
   const packet=JSON.stringify(helperContext(state));
   if(kind==='reveal')assert.ok(!packet.includes('"id":"'+game.context.auditViewed.localId+'"'),'A face-down deck card is not retained as current visible information');
  }finally{game.close();}
 }
}
function handlerReceivers(){
 const game=makeGame();
 try{
  game.api.boot({side:'corp',seed:'audit-resolve-receiver'});
  vm.runInContext(`
   var auditIce=AllCards(corp).find(c=>c.cardType==='ice');MoveCard(auditIce,corp.HQ.ice);auditIce.rezzed=true;
   auditIce.subroutines=[{text:'Pass this ice',Resolve:function(){ChangePhase(phases.runPassesIce);}}];
   playerTurn=runner;attackedServer=corp.HQ;approachIce=0;encountering=true;subroutine=0;
   ChangePhase(phases.runSubroutines);
  `,game.context);
  let state=game.api.snapshot();const fire=choices(state).find(o=>o.command==='trigger');
  game.api.choose({version:state.version,command:fire.command,index:fire.index});
  assert.equal(game.context.currentPhase,game.context.phases.runEncounterEnd,'The original this.n() cleanup runs after a phase-changing subroutine');
  assert.equal(game.context.phases.runEncounterEnd.next,game.context.phases.runPassesIce);
  vm.runInContext(`
   ChangePhase({player:corp,identifier:'Audit cancel',title:'Audit cancel',
    Enumerate:{continue:function(){return [{}];}},Resolve:{continue:function(){}},
    Cancel:{continue:function(){this.cancelled=true;}}});
  `,game.context);
  // The realm was changed by a fixture, so use a fresh decision rather than
  // reading the cached observation from the previous window.
  const oldPhase=game.context.currentPhase;
  // No snapshot was taken after the preceding choose, so its cache is clear.
  state=game.api.snapshot();
  game.api.choose({version:state.version,command:'continue',index:0,cancel:true});
  assert.equal(oldPhase.Cancel.cancelled,true);assert.equal(oldPhase.cancelled,undefined);
 }finally{game.close();}
}
async function terminalBoundaries(){
 for(const kind of ['deck-out','flatline']){
  const game=makeGame();
  try{
   game.api.boot({side:kind==='deck-out' ? 'corp' : 'runner',seed:'audit-terminal-'+kind});
   if(kind==='deck-out'){
    vm.runInContext(`while(corp.RnD.cards.length)MoveCard(corp.RnD.cards[0],corp.archives.cards);playerTurn=corp;corp.clickTracker=3;ChangePhase(phases.corpActionMain);`,game.context);
    const state=game.api.snapshot(),draw=choices(state).find(o=>o.command==='draw');
    game.api.choose({version:state.version,command:draw.command,index:draw.index});
   }else vm.runInContext(`while(runner.grip.length)MoveCard(runner.grip[0],runner.heap);Damage('net',1,false);`,game.context);
   const state=game.api.snapshot();assert.equal(state.terminal.winner,kind==='deck-out' ? 'runner' : 'corp');assert.equal(state.decision,null);
   assert.equal(game.api.needsAdvance(),false);assert.deepEqual(plain(await game.api.advance()),plain(state));
   assert.throws(()=>game.api.choose({version:state.version,command:'gain',index:0}),/already passed/);
   assert.deepEqual(plain(game.api.snapshot()),plain(state),'No post-terminal action can change the game');
  }finally{game.close();}
 }
}
async function main(){await upstreamChoiceParity();handlerReceivers();await terminalBoundaries();await workerRestoration();frontendAcknowledgements();await viewingWindows();console.log('Frontend audit: native receivers and six enumeration checkpoints, deck-out/flatline guards, batched replay/live equivalence, acknowledged-action recovery, safe stale-prefix recovery, reveal/expose privacy pass.');}
main().catch(error=>{console.error(error);process.exitCode=1;});
