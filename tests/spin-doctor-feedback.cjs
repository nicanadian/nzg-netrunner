'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {makeGame,choices,checkState,checkSnapshot}=require('./engine-smoke.cjs');
const backend=require('../server/helper.cjs');
const plain=value=>JSON.parse(JSON.stringify(value));
function position({hiddenArchive=false}={}){
 const game=makeGame();game.api.boot({side:'runner',seed:'spin-defensive-response'});
 // A legal movement window after passing the remote's ice. The Corp AI makes
 // every rez/draw/removal/shuffle choice itself through the regular engine.
 vm.runInContext(`
  var spin=AllCards(corp).find(c=>c.setNumber===30053);
  var spinServer=NewServer('Remote 0',false);corp.remoteServers.push(spinServer);
  MoveCard(spin,spinServer.root);spin.faceUp=false;spin.rezzed=false;spin.knownToRunner=false;
  var ice=AllCards(corp).find(c=>c.title==='Tithe');MoveCard(ice,spinServer.ice);ice.rezzed=true;
  for(var num of [30037,30071]){
   var archive=AllCards(corp).find(c=>c.setNumber===num);MoveCard(archive,corp.archives.cards);
   archive.faceUp=${!hiddenArchive};archive.knownToRunner=false;
  }
  playerTurn=runner;runner.clickTracker=2;corp.creditPool=10;
  attackedServer=spinServer;approachIce=0;encountering=false;movement=true;
  ChangePhase(phases.runDecideContinue);
 `,game.context);
 const state=game.api.snapshot(),option=choices(state).find(o=>o.command==='n');
 return {game,state,choice:{version:state.version,command:option.command,index:option.index}};
}
async function main(){
 const {activityModel,activityExplanation}=await import('../app/activity.mjs');
 const {opponentBeat}=await import('../app/opponent.mjs');
 const {helperContext}=await import('../app/helper-context.mjs');
 const f=position(),messages=[];
 let final;
 try{
  assert.ok(!JSON.stringify(f.state).includes('Spin Doctor'),'The installed card starts concealed');
  f.game.context.importScripts=()=>{};
  f.game.context.postMessage=message=>messages.push(plain(message));
  vm.runInContext(fs.readFileSync('engine/worker.js','utf8'),f.game.context);
  await f.game.context.onmessage({data:{type:'choose',choice:f.choice}});
  assert.equal(messages[0].type,'resources');assert.equal(messages.at(-1).type,'state');
  final=messages.at(-1).state;checkState(f.game);checkSnapshot(f.game,final);
  const events=final.history.filter(e=>(e.actor || e.side)==='corp' && e.side==='runner');
  const rez=events.find(e=>e.effect?.kind==='rez'),draw=events.find(e=>e.draw?.source==='Spin Doctor');
  const ability=events.find(e=>e.effect?.kind==='ability'),removed=events.find(e=>e.effect?.kind==='remove');
  const shuffled=events.filter(e=>e.effect?.kind==='shuffle');
  assert.ok(rez && draw && ability && removed);assert.equal(shuffled.length,2);
  assert.ok(events.indexOf(rez)<events.indexOf(draw) && events.indexOf(draw)<events.indexOf(ability));
  assert.match(activityExplanation(rez),/On rez: draw 2 cards/);
  assert.match(activityExplanation(draw),/Spin Doctor/);
  assert.match(activityExplanation(ability),/Remove Spin Doctor.*up to 2/);
  assert.match(activityExplanation(removed),/Remote 0 has no cards left to access/);
  assert.ok(shuffled.every(e=>activityExplanation(e).includes('Spin Doctor')));
  assert.equal(final.corp.hand.length,f.state.corp.hand.length+2);
  assert.equal(final.runner.clicks,f.state.runner.clicks);assert.equal(final.corp.clicks,f.state.corp.clicks);
  assert.ok(final.history.some(e=>e.text==='Run successful'));assert.ok(!final.history.some(e=>/ accessed$/.test(e.text)));
  const recap=activityModel(final);assert.equal(recap.responses,true);assert.match(recap.title,/Corp responses · your turn/);
  assert.ok(recap.entries.includes(rez));assert.ok(recap.entries.some(e=>e.text==='Run ends'),'Response recap retains the run outcome');
  const beats=messages.filter(m=>m.type==='opponent-step').map(m=>opponentBeat(m.before,m.state)).filter(Boolean);
  assert.ok(beats.some(b=>b.kind==='rez' && b.caption==='Corp rezzes Spin Doctor'));
  assert.ok(beats.some(b=>b.kind==='draw' && b.detail.includes('Spin Doctor')));
  assert.ok(beats.some(b=>b.caption==='Corp uses Spin Doctor' && b.detail.includes('no cards left to access')));
  assert.equal(beats.filter(b=>b.caption==='Corp shuffles cards with Spin Doctor').length,2);
  assert.ok(beats.every(b=>b.opponent==='corp' && b.state.playerTurn==='runner'));
  assert.ok(beats.filter(b=>b.card?.number===30053).every(b=>b.targets.server==='Remote 0'));
  const context=helperContext(final),card=context.cards.find(c=>c.number===30053);
  assert.equal(card.location,'Publicly revealed in recent activity');assert.equal(card.installed,false);
  let payload;
  await backend.answer({question:'What happened on that run?',context},{env:{HELPER_PROVIDER:'openai',OPENAI_API_KEY:'mock'},fetchImpl:async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({output:[{type:'message',content:[{type:'output_text',text:'Mock answer'}]}]})};}});
  const packet=JSON.parse(payload.input[0].content.split('\n').slice(1).join('\n'));
  assert.ok(packet.printedCardText.some(c=>c.number===30053 && /draw 2 cards/.test(c.text)),'The helper gets printed Spin Doctor text after removal');
  assert.ok(packet.visiblePosition.recentEvents.some(e=>e.actor==='corp' && e.side==='runner' && e.effect?.rootEmpty));
 }finally{f.game.close();}
 const direct=position();
 try{direct.game.api.choose(direct.choice);assert.deepEqual(plain(await direct.game.api.advance()),final,'Observation preserves state, decisions, RNG and timing');}finally{direct.game.close();}
 const hidden=position({hiddenArchive:true});
 try{
  hidden.game.api.choose(hidden.choice);const state=await hidden.game.api.advance();checkSnapshot(hidden.game,state);
  const shuffles=state.history.filter(e=>e.effect?.kind==='shuffle');assert.equal(shuffles.length,2);
  assert.ok(shuffles.every(e=>/^hidden card shuffled/.test(e.text)),'Facedown Archives cards stay unnamed');
  assert.ok(shuffles.every(e=>e.effect.card.number===30053),'Metadata identifies the revealed ability source, never the hidden target');
 }finally{hidden.game.close();}
 console.log('Spin Doctor feedback: real Corp AI responses, rez/draw/removal/shuffle playback, empty-root recap, helper card text, hidden Archives privacy and unchanged decisions pass.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
