'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {makeGame,choices,checkState,checkSnapshot}=require('../tests/engine-smoke.cjs');
const {complete}=require('./complete-recorded-decks.cjs');
const clean=x=>JSON.parse(JSON.stringify(x));
const actionId=side=>side==='corp'?'Corp 2.2':'Runner 1.3';
const NORMALIZATIONS={
 'neon-starter':[
  'Choose one possible C1 installation order; the final installed trio is established.',
  'Fill R4’s unrecorded fourth click with a synthetic, unprotected Archives run; no pool, hand or counter change.',
  'Trash the used Mayfly at R5 run end rather than at the delayed physical reminder.',
  'Use the explicitly announced six-point teaching target. Winning steal reaches seven anyway.'
 ],
 'lt-starter':[
  'Red Team empties after R2 fourth payout. Replace the impossible R3 fifth use with a basic R&D run.',
  'Removing the illegal extra payout lowers subsequent Runner pool checkpoints by three. Play Sure Gamble before Mayfly on R3 to keep the sequence affordable.',
  'Omit the undone Seamless attempt as a committed action; retain its replacement basic advancement. New Urtica is ineligible, but older installed cards remain legal targets.',
  'Use eligible Overclock funds once, with no source-UI debit/refund. Final Runner pool is two rather than the video’s five.'
 ],
 'lt-booster':[
  'Perform only the final accepted Cleaver installation and required Mayfly memory trash; exclude source undo/manual moves.',
  'Rez inner Diviner only when it is approached, after passing outer Palisade; the source log rezzes both before the Palisade encounter.',
  'Stop immediately at the winning Send a Message score; omit the source’s post-win free Karunā rez.'
 ]
};
const HIDDEN={
 'neon-starter':['Choose Diviner as concealed HQ ice.','Choose a second Urtica as the never-accessed late remote card.'],
 'lt-starter':['Corp-view C1 frames constrain the first six-card multiset and Nico draw; remaining order is chosen. Inner HQ ice is thereby identified as Brân.','Choose Whitespace as outer R&D ice and Tithe as outer HQ ice.'],
 'lt-booster':['Choose Karunā, Whitespace and Funhouse as unrezzed R&D ice.','Choose Manegarm as the unrezzed C15 Server 1 upgrade.']
};
async function execute(id,{rulesVersion}={}){
 const input=complete(id),g=makeGame(),trace=[],checkpoints=[],observations=[];
 if(rulesVersion)input.config.rulesVersion=rulesVersion;
 let state,currentTurn,runPlan,pendingAccess;
 const fail=msg=>new Error(`${id}/${currentTurn?.id}: ${msg}\n${state?.phase.title} / ${state?.active} / turn ${state?.turn}\n${choices(state).map(o=>`${o.command} #${o.index} ${o.label} ${o.detail||''} [${o.card?.number||''}]`).join('\n')}`);
 const act=async(cmd,p=()=>true,label=cmd)=>{
  const o=choices(state).find(o=>o.command===cmd&&p(o,g.context.phaseOptions[cmd]?.[o.index]));
  if(!o)throw fail(`Missing ${label}`);
  const choice={version:state.version,command:cmd,index:o.index};
  trace.push({turn:currentTurn?.id||'setup',label,before:{phase:state.phase.identifier,active:state.active},choice});
  g.api.choose(choice);state=await g.api.advance();checkState(g);checkSnapshot(g,state);
  // A reproducible payer policy, not a restriction on the human action set.
  // Pick expiring credits before the pool, matching the reviewed ledgers.
  while(state.phase.identifier==='Pay credits'){
   const options=choices(state);
   const source=options.find(o=>/from bad publicity$/.test(o.label)) || options.find(o=>o.card) || options[0];
   const amounts=options.filter(o=>o.card?.id===source.card?.id&&o.label.replace(/^Pay \d+ credits? /,'')===source.label.replace(/^Pay \d+ credits? /,''));
   await act('pay',o=>o.index===amounts.at(-1).index,'Choose payment source');
  }
  return state;
 };
 const by=n=>o=>o.card?.number===n;
 const isAction=()=>state.active===currentTurn.side&&state.phase.identifier===actionId(currentTurn.side)&&g.context.playerTurn===g.context[currentTurn.side]&&choices(state).some(o=>o.command==='gain'||o.command==='score');
 const defaultStep=async()=>{
  const opts=choices(state),title=state.phase.title;
  if(title==='Superconducting Hub'&&opts.some(o=>/Draw 2/.test(o.label)))return act('continue',o=>/Draw 2/.test(o.label),'Take Hub draw');
  if(title==='Wildcat Strike')return act('continue',o=>/4 cards/.test(o.label),'Corp chooses draw four');
  const auto=opts.find(o=>g.context.currentPhase.triggerCallbackName&&o.command==='trigger'&&[30008,30014,30018,30028,30029,30032,30033,30037,30042,30045,30067,30068,30070].includes(o.card?.number));
  if(auto)return act('trigger',o=>o.index===auto.index,'Resolve '+auto.label);
  if(opts.some(o=>o.command==='n'))return act('n',()=>true,'Pass '+title);
  const continuation=opts.find(o=>o.command==='continue'&&/^Continue/.test(o.label));
  if(continuation)return act('continue',o=>o.index===continuation.index);
  if(title==='Run: Subroutines'&&state.active==='corp')return act('trigger',()=>true,'Fire next unbroken subroutine');
  throw fail('No default continuation');
 };
 const until=async(predicate,max=150)=>{for(let i=0;i<max&&!predicate();i++)await defaultStep();if(!predicate())throw fail('Checkpoint timeout');};
 const main=async()=>until(isAction);
 const cardInRaw=(n,server)=>(o,p)=>p.card?.setNumber===n&&(!server||g.context.GetServer(p.card)?.serverName===server);
 const slotId=(side,slot)=>`c${side==='corp'?input.ledger.decks.corp.size+2-slot:input.ledger.decks.corp.size+input.ledger.decks.runner.size+3-slot}`;
 const breakAbility=async(n,indices)=>{
  while(indices.some(i=>!g.context.attackedServer.ice[g.context.approachIce].subroutines[i].broken)){
   await act('trigger',o=>o.card?.number===n&&/Break/.test(o.detail||o.label),'Use breaker '+n);
   for(let j=0;j<4;j++){
    const ice=g.context.attackedServer?.ice[g.context.approachIce];
    if(!ice)break;
    const target=choices(state).find(o=>o.command==='continue'&&indices.some(i=>!ice.subroutines[i].broken&&g.context.phaseOptions.continue[o.index].subroutine===ice.subroutines[i]));
    if(target)await act('continue',o=>o.index===target.index,'Select subroutine');
    else if(/Break/.test(state.phase.title)&&choices(state).some(o=>o.command==='continue'&&/^Continue/.test(o.label)))await act('continue',o=>/^Continue/.test(o.label),'Finish break selection');
    else break;
   }
  }
 };
 const doRun=async a=>{
  runPlan=a;pendingAccess=null;
  g.context.researchHQWanted=a.s==='HQ'?a.access.map(x=>x.n).filter(Boolean):[];
  g.context.researchDamageWanted=[...(a.damage||[])];
  await main();
  if(a.event){await act('play',by(a.event));await act('continue',o=>o.server===a.s,'Choose event target '+a.s);}
  else if(a.resource){await act('trigger',by(a.resource));await act('continue',o=>o.server===a.s,'Red Team target '+a.s);}
  else await act('run',o=>o.server===a.s,'Basic run '+a.s);
  let queue=[...a.access],handled=new Set(),accesses=[];
  for(let step=0;step<250&&!state.terminal;step++){
   if(!g.context.attackedServer){await until(()=>isAction()||g.context.playerTurn!==g.context[currentTurn.side]||state.terminal);break;}
   const rawIce=g.context.attackedServer.ice[g.context.approachIce],index=g.context.approachIce;
   const spec=a.ice[g.context.attackedServer.ice.length-1-index];
   if(rawIce&&spec&&rawIce.setNumber!==spec.ice)throw fail(`Ice order ${rawIce.setNumber} != ${spec.ice}`);
   if(spec?.rez&&choices(state).some(o=>o.command==='rez'&&g.context.phaseOptions.rez[o.index].card===rawIce)){
    const rezzableIce=(g.context.phaseOptions.rez||[]).filter(p=>p.card.cardType==='ice');
    assert.ok(rezzableIce.every(p=>p.card===rawIce),'Only approached ice can normally be rezzed');
    observations.push({turn:currentTurn.id,kind:'ice-rez-permission',approached:rawIce.setNumber,offeredIce:rezzableIce.map(p=>p.card.setNumber)});
    await act('rez',(o,p)=>p.card===rawIce,'Rez encountered ice');continue;
   }
   const gateStageReady=a.gateStage==='after-ice'?handled.size>=a.ice.length&&!state.run?.encountering:a.gateStage==='approach'?state.phase.identifier==='Run 2.1':true;
   if(a.gate&&gateStageReady&&choices(state).some(o=>o.command==='rez'&&o.card?.number===a.gate)){
    await act('rez',by(a.gate),'Rez run gate');continue;
   }
   if(state.phase.title==='Manegarm Skunkworks'){
    await act('continue',o=>/Pay 5/.test(o.label),'Pay Manegarm');continue;
   }
   if(state.run?.encountering&&state.active==='runner'&&rawIce&&!handled.has(rawIce)){
    handled.add(rawIce);
    if(spec?.leech)for(let i=0;i<spec.leech;i++)await act('trigger',by(30008),'Spend Leech counter');
    if(spec?.clickBreak!==undefined){
     await act('trigger',(o,p)=>p.card===rawIce,'Use bioroid click ability');
     await act('continue',(o,p)=>p.subroutine===rawIce.subroutines[spec.clickBreak],'Break install-ice subroutine with click');
    }
    if(spec?.breaker){
     for(let i=0;i<(spec.boost||0);i++)await act('trigger',o=>o.card?.number===spec.breaker&&/strength/.test(o.detail||o.label),'Boost breaker');
     const inds=spec.subs==='all'?rawIce.subroutines.map((_,i)=>i):spec.subs;
     await breakAbility(spec.breaker,inds);
    }
    continue;
   }
   const free=choices(state).find(o=>o.command==='trigger'&&o.card?.number===30069);
   if(free){await act('trigger',(o,p)=>p.card?.setNumber===30069,'Send a Message free rez');continue;}
   if(state.phase.title==='Send a Message'||(a.freeRez&&choices(state).some(o=>o.command==='continue'&&o.card?.number===a.freeRez))){
    await act('continue',a.freeRez?by(a.freeRez):o=>/^Continue/.test(o.label),'Choose free rez');continue;
   }
   const access=choices(state).filter(o=>o.command==='access');
   if(access.length){
    pendingAccess=queue.shift()||{n:null,mode:'leave'};
    const wanted=pendingAccess.n;
    if(a.s==='HQ'&&wanted){const at=g.context.researchHQWanted.indexOf(wanted);if(at>=0)g.context.researchHQWanted.splice(at,1);}
    await act('access',(o,p)=>wanted===null||p.card?.setNumber===wanted,'Access '+(wanted||'unspecified non-agenda'));
    const actual=g.context.accessingCard?.setNumber;
    if(wanted!==null&&actual!==undefined)assert.equal(actual,wanted);
    accesses.push(actual||wanted);
    if(a.s==='HQ'&&!state.terminal){
     const visited=g.context.accessedCards.cards.filter(c=>c.cardLocation===g.context.corp.HQ.cards);
     const earlier=visited.filter(c=>c!==g.context.accessingCard);
     if(earlier.length){
      assert.ok(earlier.every(c=>g.context.PlayerCanLook(g.context.runner,c)),'Previously accessed HQ cards stay visible during breach');
      if(state.side==='runner')assert.ok(earlier.every(c=>state.corp.hand.find(x=>x.id===c.localId)?.hidden===false),'DTO retains access visibility');
      observations.push({turn:currentTurn.id,kind:'hq-breach-visibility',earlierAccesses:earlier.map(c=>c.setNumber),retained:true});
     }
    }
    continue;
   }
   if(state.phase.identifier==='Run Accessing'&&pendingAccess){
    const mode=pendingAccess.mode;
    if(choices(state).some(o=>o.command==='steal')){
     if(mode!=='steal')throw fail('Unplanned agenda access');
     await act('steal');
    }else if(mode==='trash')await act('trash');
    else await act('n',()=>true,'Leave accessed card');
    pendingAccess=null;continue;
   }
   await defaultStep();
  }
  if(g.context.attackedServer&&!state.terminal)throw fail('Run did not end');
  assert.equal(queue.length,0,`${id}/${currentTurn.id}: missing planned accesses`);
  observations.push({turn:currentTurn.id,kind:'run',server:a.s,accesses});
  g.context.researchHQWanted=[];g.context.researchDamageWanted=[];runPlan=null;
 };
 try{
  g.api.boot(input.config);
  // Generate a valid random-number tape satisfying observed HQ accesses and
  // random damage. A second run replays the tape with native Shuffle untouched.
  vm.runInContext(`
   var researchTape=[],researchQueue=[],researchHQWanted=[],researchDamageWanted=[];
   var researchBaseRandom=Math.random;
   Math.random=function(){var v=researchQueue.length?researchQueue.shift():researchBaseRandom();researchTape.push(v);return v;};
   var researchNativeShuffle=Shuffle;
   Shuffle=function(array){
    var wanted=[],head=false;
    if(array===corp.HQ.cards&&researchHQWanted.length)wanted=researchHQWanted;
    else if(array!==runner.grip&&researchDamageWanted.length&&array.length===runner.grip.length&&array.every(c=>runner.grip.includes(c))){wanted=researchDamageWanted;head=true;}
    if(wanted.length){
     var remain=array.slice(),selected=[];
     for(var n of wanted){var ix=remain.findIndex(c=>c.setNumber===n);if(ix<0)throw Error('Random constraint missing card '+n);selected.push(remain.splice(ix,1)[0]);}
     var target=head?selected.concat(remain):remain.concat(selected.reverse()),copy=array.slice();
     for(var i=copy.length-1;i>=0;i--){var j=copy.indexOf(target[i]);researchQueue.push((j+0.5)/(i+1));var c=copy[i];copy[i]=copy[j];copy[j]=c;}
     if(head)researchDamageWanted=[];
    }
    return researchNativeShuffle(array);
   };
  `,g.context);
  state=await g.api.advance();
  for(const t of input.plan){
   currentTurn=t;
   if(t.preRez){
    await until(()=>choices(state).some(o=>o.command==='rez'&&o.card?.number===t.preRez));
    await act('rez',by(t.preRez),'Rez before turn begins');
   }
   await main();
   for(const a of t.actions){
    if(state.terminal)throw fail('Terminal before planned action '+a.op);
    await main();
    if(a.synthetic){observations.push({turn:t.id,kind:'source-normalization',reason:a.synthetic,clicksBefore:state.runner.clicks});}
    if(a.probeSeamlessNew){const card=g.context.corp.HQ.cards.find(c=>c.setNumber===30040),targets=card.Enumerate.call(card);assert.ok(targets.length);assert.ok(!targets.some(p=>p.card.setNumber===30045),'New Urtica is ineligible');assert.ok(targets.some(p=>p.card.setNumber===30072),'Old Palisade is a legal counter-placement target');observations.push({turn:t.id,kind:'seamless-target-permissions',cardInHand:true,newUrticaExcluded:true,oldPalisadeIncluded:true});}
    if(a.op==='run'){await doRun(a);if(id==='lt-starter'&&t.id==='R3'){observations.push({turn:t.id,kind:'post-red-team-correction-budget',credits:state.runner.credits,sureGambleOffered:choices(state).some(o=>o.command==='play'&&o.card?.number===30030),traceIndex:trace.length-1});}continue;}
    if(a.op==='install'){
     await act('install',(o,p)=>p.card?.setNumber===a.n&&(!a.s||o.server===a.s),'Install '+a.n);
     if(state.phase.title==='Trash Before Install'){
      if(a.trashProgram){assert.ok(!choices(state).some(o=>o.command==='n'),'Cannot complete over-memory install before trashing');observations.push({turn:t.id,kind:'memory-install-protected',memory:state.runner.memory,used:state.runner.memoryUsed});await act('trash',by(a.trashProgram),'Trash Mayfly for memory');}
      else if(t.side==='corp'&&!choices(state).some(o=>o.command==='n'))await act('trash',()=>true,'Trash replaced asset');
      if(choices(state).some(o=>o.command==='n'))await act('n',()=>true,'Finish optional install trashing');
     }
    }else if(a.op==='play'){
     await act('play',by(a.n));
     if(a.target)await act('continue',by(a.target),'Choose operation target');
    }else if(a.op==='use')await act('trigger',by(a.n),'Use '+a.n);
    else if(a.op==='advance'||a.op==='score')await act(a.op,by(a.n));
    else if(a.op==='trash-resource')await act('trash',by(a.n),'Trash tagged resource');
    else if(a.op==='remove-tag')await act('remove');
    else await act(a.op);
   }
   if(!state.terminal){
    for(let i=0;i<150&&g.context.playerTurn===g.context[t.side];i++){
     const disc=choices(state).filter(o=>o.command==='discard');
     if(disc.length){
      const wanted=t.discardSlots.map(s=>slotId(t.side,s));
      const option=disc.find(o=>wanted.includes(o.card?.id));
      if(!option)throw fail('No planned discard '+wanted.join(','));
      await act('discard',o=>o.index===option.index,'Hand-limit discard');
     }else await defaultStep();
    }
   }
   const expected=input.ledger.turns.find(x=>x.id===t.id),actual=state[t.side].credits;
   let reconstructed=input.ledger.initialState[t.side+'Credits'];
   for(const lt of input.ledger.turns){for(const ev of lt.events)reconstructed+=ev.delta[t.side+'Credits']||0;if(lt.id===t.id)break;}
   if(id==='lt-starter'&&t.id==='R2'){assert.ok(!g.context.runner.rig.resources.some(c=>c.setNumber===30018),'Red Team trashes after fourth payout');observations.push({turn:t.id,kind:'red-team-empty-trashed'});}
   const adjustment=id==='lt-starter'&&t.side==='runner'&&Number(t.id.slice(1))>=3?-3:0;
   assert.equal(actual,reconstructed+adjustment,`${id}/${t.id} credits vs ledger${adjustment?' after removing illegal extra payout':''}`);
   if(expected.observedEndHandSize!==undefined)assert.equal(g.context.PlayerHand(g.context[t.side]).length,expected.observedEndHandSize,`${id}/${t.id} hand size`);
   checkpoints.push({turn:t.id,traceIndex:trace.length-1,credits:actual,sourceCredits:expected.observedEndCredits??null,normalizationDelta:adjustment,
    corpPoints:state.corp.points,runnerPoints:state.runner.points,corpHand:g.context.corp.HQ.cards.length,runnerHand:g.context.runner.grip.length,terminal:clean(state.terminal)});
  }
  assert.equal(state.terminal?.winner,input.ledger.result.winner);
  assert.equal(state.corp.points,input.ledger.result.corpPoints);assert.equal(state.runner.points,input.ledger.result.runnerPoints);
  assert.equal(g.errors.length,0,g.errors.join('\n'));
  const output={id,scope:'End-to-end legal reconstruction from a booted opening; synthetic deck completion and constrained random outcomes are explicit. Not the original unique hidden shuffle.',config:input.config,
   normalizations:NORMALIZATIONS[id],hiddenAssignments:HIDDEN[id],deckCompletion:input.slots,randomTape:clean(g.context.researchTape),trace,checkpoints,observations,final:clean(state)};
  // Independently replay without the symbolic planner or guided Shuffle. This
  // proves all input choices are actually legal under a single RNG tape.
  const replay=makeGame();try{
   replay.api.boot(input.config);replay.context.recordedTape=output.randomTape;
   vm.runInContext(`var recordedTapeIndex=0;Math.random=function(){if(recordedTapeIndex>=recordedTape.length)throw Error('Random tape exhausted');return recordedTape[recordedTapeIndex++];};`,replay.context);
   let s=await replay.api.advance();
   for(const [index,x] of trace.entries()){
    assert.equal(s.version,x.choice.version);assert.ok(choices(s).some(o=>o.command===x.choice.command&&o.index===x.choice.index));
    replay.api.choose(x.choice);s=await replay.api.advance();checkState(replay);checkSnapshot(replay,s);
    for(const cp of checkpoints.filter(cp=>cp.traceIndex===index)){
     const side=cp.turn.startsWith('C')?'corp':'runner';
     assert.equal(s[side].credits,cp.credits);assert.equal(s.corp.points,cp.corpPoints);assert.equal(s.runner.points,cp.runnerPoints);
     assert.equal(s.corp.hand.length,cp.corpHand);assert.equal(s.runner.hand.length,cp.runnerHand);
    }
   }
   assert.deepEqual(clean(s),output.final,'Native-Shuffle replay must reproduce final state');
   assert.equal(replay.context.recordedTapeIndex,output.randomTape.length);
  }finally{replay.close();}
  return clean(output);
 }catch(error){fs.writeFileSync(path.join(require('node:os').tmpdir(),'netrunner-recorded-game-failure.json'),JSON.stringify({id,turn:currentTurn?.id,trace,state:state&&clean(state),config:input.config},null,2));throw error;}
 finally{g.close();}
}
async function main(){
 for(const id of process.argv.slice(2).filter(x=>!x.startsWith('--')).length?process.argv.slice(2).filter(x=>!x.startsWith('--')):['neon-starter','lt-starter','lt-booster']){
  const fullPaid=process.argv.includes('--full-paid-choices');
  const out=await execute(id,fullPaid?{rulesVersion:'26.03-local-2'}:{});
  const file=path.resolve(__dirname,`../eval/recorded-games/${id}-${fullPaid?'paid-choices-':''}full-replay.json`);
  if(process.argv.includes('--check'))assert.deepEqual(out,JSON.parse(fs.readFileSync(file,'utf8')),'Full reconstruction must match reviewed artifact');
  if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(out,null,2)+'\n');
  console.log(`PASS ${id}: ${out.checkpoints.length} side-turns, ${out.trace.length} legal decisions, native-Shuffle independent replay, ${out.final.terminal.winner} wins ${out.final.corp.points}–${out.final.runner.points}`);
 }
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={execute,main};
