'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {makeGame,choices,checkState,checkSnapshot}=require('./engine-smoke.cjs');
const replay=require('./fixtures/luminal-extra-clicks-replay.json');
const plain=value=>JSON.parse(JSON.stringify(value));
async function restore(observe){
 const game=makeGame();
 try{
  game.api.boot(replay.config);let state=await game.api.advance();
  for(const choice of replay.choices){game.api.choose(choice);state=await game.api.advance(300,observe);checkState(game);checkSnapshot(game,state);}
  return plain(state);
 }finally{game.close();}
}
async function main(){
 const {opponentBeat}=await import('../app/opponent.mjs');
 const beats=[],states=[];
 const fixed=await restore((before,after)=>{
  if(after.turn>=13){states.push(plain(after));const beat=opponentBeat(before,after);if(beat)beats.push(beat);}
 });
 const score=fixed.history.findIndex(e=>e.text==='Luminal Transubstantiation scored');
 assert.ok(score>=0,'The exported game reproduces Luminal scoring on Corp turn 7');
 const gained=fixed.history.findIndex((e,i)=>i>score && e.text==='Corp gained 3 clicks');
 assert.ok(gained>score);
 const rest=fixed.history.slice(gained+1).filter(e=>e.turn===13);
 assert.equal(rest.filter(e=>e.text==='Corp spent one click').length,3,'All three extra clicks must be spent in the same Corp turn');
 assert.equal(rest.filter(e=>e.text==='Using Regolith Mining License:').length,2);
 assert.ok(rest.some(e=>/^Corp installed /.test(e.text)));
 assert.equal(fixed.corp.clicks,0);assert.equal(fixed.runner.clicks,4);assert.equal(fixed.playerTurn,'runner');
 assert.equal(fixed.phase.identifier,'Runner 1.3');
 assert.ok(states.filter(s=>s.turn===13 && s.phase.identifier.startsWith('Corp 3.')).every(s=>s.corp.clicks===0),'Corp cannot enter discard with the Luminal clicks remaining');
 const bonus=beats.findIndex(b=>b.caption==='Corp gains 3 clicks');
 assert.ok(bonus>=0,'Playback shows the bonus clicks');
 assert.ok(beats.slice(bonus+1).filter(b=>b.turn===13).length>=3,'Playback includes the extra actions before handing back control');
 assert.deepEqual(await restore(),fixed,'Reloading the original replay recovers the corrected position deterministically');

 // Exercise the actual browser-worker restore and live final-choice paths.
 const worker=makeGame(),messages=[];
 try{
  worker.context.importScripts=()=>{};
  worker.context.postMessage=message=>messages.push(plain(message));
  vm.runInContext(fs.readFileSync('engine/worker.js','utf8'),worker.context);
  await worker.context.onmessage({data:{type:'start',config:replay.config,replay:replay.choices.slice(0,-1)}});
  assert.ok(!messages.some(m=>m.type==='opponent-step'),'Restoration remains quiet');
  messages.length=0;
  await worker.context.onmessage({data:{type:'choose',choice:replay.choices.at(-1)}});
  assert.equal(messages[0].type,'resources');assert.equal(messages.at(-1).type,'state');
  assert.deepEqual(messages.at(-1).state,fixed);
  const live=messages.filter(m=>m.type==='opponent-step').map(m=>opponentBeat(m.before,m.state)).filter(Boolean);
  assert.ok(live.some(b=>b.caption==='Corp gains 3 clicks'));
  assert.ok(live.some(b=>b.turn===13 && b.kind==='install' && b.state.corp.clicks===0));
 }finally{worker.close();}

 // Human Corp: score with zero clicks in a window that already selected
 // discard, then spend all three bonus clicks through ordinary legal choices.
 const game=makeGame();
 try{
  game.api.boot({side:'corp',seed:'luminal-human-clicks'});
  vm.runInContext(`
   var luminal=AllCards(corp).find(c=>c.setNumber===30036);
   var otherAgenda=AllCards(corp).find(c=>c.setNumber===30070);
   for(var agenda of [luminal,otherAgenda]){
    var server=NewServer('Remote '+corp.remoteServers.length,false);corp.remoteServers.push(server);
    MoveCard(agenda,server.root);agenda.advancement=3;
   }
   playerTurn=corp;corp.clickTracker=0;ChangePhase(phases.corpPostAction);
  `,game.context);
  let state=await game.api.advance();
  const scoreChoice=choices(state).find(o=>o.command==='score'&&o.card?.number===30036);
  assert.ok(scoreChoice);game.api.choose({version:state.version,command:scoreChoice.command,index:scoreChoice.index});
  state=await game.api.advance();
  const trigger=choices(state).find(o=>o.command==='trigger'&&o.card?.number===30036);
  assert.ok(trigger,'Human Corp explicitly resolves Luminal');
  game.api.choose({version:state.version,command:trigger.command,index:trigger.index});
  state=await game.api.advance();
  assert.equal(state.corp.clicks,3);assert.equal(state.playerTurn,'corp');
  assert.ok(!choices(state).some(o=>o.command==='score'),'Luminal still forbids scoring another agenda');
  for(let remaining=2;remaining>=0;remaining--){
   const gain=choices(state).find(o=>o.command==='gain');assert.ok(gain,'The extra click offers normal Corp actions');
   game.api.choose({version:state.version,command:gain.command,index:gain.index});
   assert.equal(game.api.snapshot().corp.clicks,remaining);
   if(remaining){state=await game.api.advance();assert.equal(state.playerTurn,'corp');assert.ok(!choices(state).some(o=>o.command==='score'));}
  }
  checkState(game);checkSnapshot(game,game.api.snapshot());
 }finally{game.close();}
 console.log('Luminal: exported turn restored, three AI actions and playback retained, human bonus clicks spendable, scoring restriction preserved.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
