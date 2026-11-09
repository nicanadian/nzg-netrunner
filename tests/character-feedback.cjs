'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {makeGame,choices,checkState,checkSnapshot}=require('./engine-smoke.cjs');
async function eventClickCosts(){
 for(const number of [30020,30021])for(const clicks of [4,2,1]){
  const g=makeGame();try{
   g.api.boot({side:'runner',seed:`character-event-${number}-${clicks}`,deckIds:{runner:'tao-v1'}});
   vm.runInContext(`
    corp.AI=null;runner.AI=null;playerTurn=runner;runner.clickTracker=${clicks};runner.creditPool=10;
    var testedEvent=AllCards(runner).find(c=>c.setNumber===${number});MoveCard(testedEvent,runner.grip);
    ChangePhase(phases.runnerActionMain);
   `,g.context);
   let s=g.api.snapshot();const handBefore=s.runner.hand.length;const play=choices(s).find(o=>o.command==='play'&&o.card?.number===number);
   assert.ok(play);const expected=clicks>1?2:1;
   assert.equal(play.cost.clicks,expected);assert.match(play.cost.note,clicks>1?/lose 1 remaining click/:/no extra click lost/);
   g.api.choose({version:s.version,command:play.command,index:play.index});s=await g.api.advance();checkState(g);checkSnapshot(g,s);
   assert.equal(g.context.runner.clickTracker,clicks-expected,'Preview equals actual action plus conditional loss');
   if(number===30021)assert.equal(g.context.runner.grip.length,handBefore-1+4,'VRcation draws four after leaving hand');
   else assert.equal(g.context.runner.creditPool,10-play.cost.credits+5,'Creative Commission pays five after its play cost');
  }finally{g.close();}
 }
}
async function advancementPreviews(){
 for(const [id,number,counters,pattern] of [
  ['restoring-humanity-v1',30045,2,/5 net damage.*works unrezzed/],
  ['built-to-last-v1',30061,0,/1 meat damage.*must be rezzed/],
  ['built-to-last-v1',30063,2,/Third counter.*\+5 strength/],
 ]){
  const g=makeGame();try{
   g.api.boot({side:'corp',seed:`character-advance-${number}`,deckIds:{corp:id}});
   vm.runInContext(`
    playerTurn=corp;corp.clickTracker=3;corp.creditPool=5;
    var testedCard=AllCards(corp).find(c=>c.setNumber===${number});var remote=NewServer('Remote 0',false);corp.remoteServers.push(remote);
    MoveCard(testedCard,${number===30063?'remote.ice':'remote.root'});testedCard.advancement=${counters};
    ChangePhase(phases.corpActionMain);
   `,g.context);
   let s=g.api.snapshot(),advance=choices(s).find(o=>o.command==='advance'&&o.card?.number===number);
   assert.ok(advance);assert.match(advance.cost.note,pattern);
   if(id==='built-to-last-v1'&&!counters)assert.match(advance.cost.note,/pay 1 credit, then gain 2/);
   g.api.choose({version:s.version,command:advance.command,index:advance.index});s=await g.api.advance();checkState(g);checkSnapshot(g,s);
   assert.equal(g.context.testedCard.advancement,counters+1);
   assert.equal(s.corp.credits,id==='built-to-last-v1'&&!counters?6:4);
  }finally{g.close();}
 }
}
async function restore(name,prefix){
 const r=require('../eval/characters/'+name+'.json'),g=makeGame();g.api.boot(r.config);let s=await g.api.advance();
 for(const choice of r.choices.slice(0,prefix)){g.api.choose(choice);s=await g.api.advance();checkState(g);checkSnapshot(g,s);}
 return {g,s,r};
}
async function panelRegressions(){
 const {opponentBeat}=await import('../app/opponent.mjs'),{activityExplanation,damageExplanation}=await import('../app/activity.mjs');
 const {resourceChanges}=await import('../app/counters.mjs'),{helperContext}=await import('../app/helper-context.mjs');
 const malapert=await restore('corp-malapert-search');
 try{
  let {g,s}=malapert;const search=choices(s).filter(o=>o.searchChoice);
  assert.ok(search.length>10);assert.ok(search.every(o=>!o.card.hidden&&o.card.type!=='agenda'&&o.label===o.card.title));
  const privateId=search[1].card.id;
  assert.equal(g.context.PlayerCanLook(g.context.corp,g.context.corp.RnD.cards.find(c=>c.localId===privateId)),false,'Search projection does not change native deck visibility');
  vm.runInContext('viewingPlayer=runner;',g.context);
  assert.ok(choices(g.api.snapshot()).filter(o=>o.card).every(o=>!o.searchChoice && (o.card.hidden || g.context.PlayerCanLook(g.context.runner,g.context.corp.RnD.cards.find(c=>c.localId===o.card.id)))),'Opposing view receives no newly exposed search cards');
  vm.runInContext('viewingPlayer=corp;',g.context);
  const target=search[0];g.api.choose({version:s.version,command:target.command,index:target.index});s=await g.api.advance();
  assert.ok(s.viewed?.card.id===target.card.id || s.corp.hand.some(c=>c.id===target.card.id),'Selected search card is revealed or in HQ');assert.ok(!JSON.stringify(s).includes(`"id":"${privateId}"`),'Unchosen search references expire immediately');
 }finally{malapert.g.close();}
 const mutual=makeGame();try{
  mutual.api.boot({side:'runner',seed:'mutual-visible-search',deckIds:{runner:'zahya-v1'}});
  vm.runInContext(`playerTurn=runner;runner.clickTracker=4;var favor=AllCards(runner).find(c=>c.setNumber===30011);MoveCard(favor,runner.grip);ChangePhase(phases.runnerActionMain);`,mutual.context);
  let s=mutual.api.snapshot(),play=choices(s).find(o=>o.command==='play'&&o.card?.number===30011);
  mutual.api.choose({version:s.version,command:play.command,index:play.index});s=await mutual.api.advance();
  const candidates=choices(s).filter(o=>o.searchChoice);assert.ok(candidates.length>0);assert.ok(candidates.every(o=>!o.card.hidden&&o.card.subTypes.includes('Icebreaker')));
  const payload=helperContext(s).legalActions.flatMap(c=>c.options.map(o=>o.label));
  assert.deepEqual(payload,[...payload].sort((a,b)=>a.localeCompare(b)),'Helper sees search choices sorted, not in deck order');
 }finally{mutual.close();}
 const anoetic=await restore('corp-anoetic-0');try{
  let {g,s}=anoetic;const pay=choices(s).find(o=>/Pay 2/.test(o.label));assert.match(pay.label,/end the run/);assert.equal(pay.cost.credits,2);
  const before=s.corp.credits;g.api.choose({version:s.version,command:pay.command,index:pay.index});s=await g.api.advance();
  for(const remaining of [2,1]){
   assert.equal(s.phase.guide.remaining,remaining);assert.equal(s.corp.credits,before-2);
   const target=choices(s).find(o=>o.card);assert.match(target.cost.note,/already paid/);assert.notEqual(target.sourceId,target.card.id,'Target remains linked to Anoetic source');
   g.api.choose({version:s.version,command:target.command,index:target.index});s=await g.api.advance();
  }
  assert.ok(s.history.some(e=>e.text==='Run ends'));
 }finally{anoetic.g.close();}
 const forced=await restore('runner-zahya-first-run',4);try{
  const {g,r}=forced;g.api.choose(r.choices[4]);const beats=[];
  await g.api.advance(300,(before,after)=>{const beat=opponentBeat(before,after);if(beat)beats.push(beat);});
  const review=beats.find(b=>b.kind==='encounter');assert.ok(review);assert.equal(review.pauseForReview,true);
  assert.equal(review.card.title,'Tithe');assert.ok(review.state.run.tools.some(t=>t.card.title==='Marjanah'&&!t.matches));
  assert.equal(review.state.run.card.subroutines.filter(s=>s.fired).length,0,'Review precedes fired subroutines');
  assert.ok(beats.indexOf(review)<beats.findIndex(b=>b.kind==='fire'));
 }finally{forced.g.close();}
 const fatal=await restore('newcomer-tao-jinteki-ui-replay');try{
  const damage=fatal.s.terminal.damage;assert.equal(damage.amount,5);assert.equal(damage.gripBefore,2);assert.equal(damage.card.number,30045);
  assert.match(damageExplanation(damage),/2 base \+ 3 advancement.*damage exceeds grip/);
  assert.ok(helperContext(fatal.s).recentEvents.some(e=>e.damage?.card?.number===30045));
 }finally{fatal.g.close();}
 const pantograph=await restore('runner-tao-v1-vm-game',55);try{
  const {s}=pantograph;assert.equal(s.phase.identifier,'Pantograph Install');assert.equal(s.phase.source,'Pantograph');
  const installs=choices(s).filter(o=>o.card);assert.ok(installs.length>0);
  assert.ok(installs.every(o=>Number.isFinite(o.cost?.credits)&&!o.cost.clicks&&/no click cost/.test(o.cost.note)));
  assert.ok(installs.every(o=>o.sourceId!==o.card.id),'All install candidates retain the Pantograph source');
  const hosted=installs.filter(o=>o.hostLabel);assert.ok(hosted.length>0);
  assert.ok(hosted.every(o=>/from outside/.test(o.hostLabel)&&!o.label.includes('protecting')&&!o.label.includes('ice ')),'Host labels use one explicit outside-first position');
 }finally{pantograph.g.close();}
 const swap=await restore('newcomer-tao-swap-prefix');try{
  let {g,s}=swap;const start=choices(s).find(o=>o.card?.number===30019);assert.ok(start);
  g.api.choose({version:s.version,command:start.command,index:start.index});s=await g.api.advance();
  const targets=choices(s).filter(o=>o.multi&&o.card),a=targets[0],b=targets.find(o=>o.location.split(' · ')[0]!==a.location.split(' · ')[0]);
  assert.ok(b);assert.ok(targets.every(o=>o.location.includes('from outside')));
  const before=s;g.api.choose({version:s.version,command:a.command,index:a.index,cards:[a.card.id,b.card.id]});s=await g.api.advance();
  const event=s.history.find(e=>e.effect?.kind==='swap');assert.ok(event);assert.match(event.text,/Tāo Salonga swaps.*from outside ↔/);
  assert.ok(!/hidden card|protecting/.test(event.text));assert.match(activityExplanation(event),/hosted cards move/);
  assert.equal(resourceChanges(before,s).filter(c=>c.key==='moved').length,2);
 }finally{swap.g.close();}
}
async function main(){await eventClickCosts();await advancementPreviews();await panelRegressions();console.log('Character feedback: native cost/impact quotes, private search visibility/expiry, paid Anoetic steps, pre-fire encounter review, fatal damage causes and hidden ice swaps pass.');}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={main};
