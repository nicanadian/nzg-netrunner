'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {makeGame,choices,checkState,checkSnapshot}=require('./engine-smoke.cjs');
function position({credits=3,ice=30072,breaker=30032,overclock=0}={}){
 const g=makeGame();g.api.boot({side:'runner',seed:'interaction-regression',rulesVersion:'26.03-local-2'});
 vm.runInContext(`function put(n,zone){var c=AllCards(n<30035?runner:corp).find(c=>c.setNumber===n);if(!c){c=InstanceCard(n);c.renderer=runner.identityCard.renderer;zone.push(c);c.cardLocation=zone;}else MoveCard(c,zone);c.faceUp=true;return c;}var testBreaker=put(${breaker},runner.rig.programs),testIce=put(${ice},corp.RnD.ice);testIce.rezzed=true;runner.creditPool=${credits};runner.clickTracker=3;attackedServer=corp.RnD;approachIce=0;encountering=true;playerTurn=runner;ChangePhase(phases.runEncounterIce);${overclock?`var testClock=put(30029,runner.resolvingCards);testClock.credits=${overclock};`:''}`,g.context);return g;
}
(async()=>{
 const {breakerPlan,secondaryAbility,cancellationLabel,quietPass,paidAbilityFinish}=await import('../app/interaction.mjs');
 const {continuationModel}=await import('../app/presentation.mjs');
 const plainWindow={side:'runner',playerTurn:'runner',runner:{clicks:2},phase:{title:'Post Action',identifier:'Runner 1.3*'},decision:{commands:[{command:'n',label:'Continue',options:[{index:4}]}]}};assert.equal(continuationModel(plainWindow).label,'Continue to next action');assert.equal(continuationModel(plainWindow).index,4);assert.equal(continuationModel({...plainWindow,terminal:{winner:'runner'}}),null);assert.equal(continuationModel({...plainWindow,decision:{commands:[{command:'continue',options:[{index:0,card:{id:'target'}}]}]}}),null);assert.equal(continuationModel({...plainWindow,decision:{commands:[...plainWindow.decision.commands,{command:'steal',options:[{index:0}]}]}}),null);
 const {responseLabel}=await import('../app/presentation.mjs');
 for(const overclock of [0,5]){
  const g=position({overclock});try{
   let s=await g.api.advance(),card=s.run.tools.find(t=>t.card.number===30032).card.id;
   const act=async o=>{g.api.choose({version:s.version,command:o.command,index:o.index});s=await g.api.advance();checkState(g);checkSnapshot(g,s)};
   let plan=breakerPlan(s,card);assert.equal(plan.status,'ready');assert.equal(plan.total,2);assert.equal(plan.next.abilityKind,'boost');assert.equal(secondaryAbility(plan.next,s),true);
   const base=s;const version=s.version,before=s.runner.credits;assert.equal(breakerPlan(s,card).total,2);assert.equal(s.version,version);assert.equal(s.runner.credits,before,'Review is read-only');
   await act(plan.next);
   // Payments pause BEFORE boost resolution when more than one source exists.
   if(overclock){assert.equal(s.phase.identifier,'Pay credits');assert.equal(breakerPlan(s,card).status,'payment');const pay=choices(s).find(o=>o.payment?.source==='Overclock'&&o.payment.amount===1);assert.equal(pay.payment.available,5);await act(pay);}
   plan=breakerPlan(s,card);assert.equal(plan.status,'ready');assert.equal(plan.next.abilityKind,'break');
   await act(plan.next);plan=breakerPlan(s,card);assert.equal(plan.status,'target');assert.equal(plan.cost,1);
   // Cancel target selection without spending and preserve the breaker source.
   assert.match(cancellationLabel(s),/Mayfly/);const cancel=s.decision.commands.find(c=>c.cancel);const funds=s.runner.credits;g.api.choose({version:s.version,command:cancel.command,cancel:true,index:0});s=await g.api.advance();assert.equal(s.runner.credits,funds);
   await act(breakerPlan(s,card).next);await act(breakerPlan(s,card).next);
   if(s.phase.identifier==='Pay credits')await act(choices(s).find(o=>o.payment?.source==='Overclock'&&o.payment.amount===1));
   assert.equal(g.context.testIce.subroutines.every(x=>x.broken),true);if(s.run?.encountering)assert.equal(breakerPlan(s,card).status,'complete');else assert.equal(breakerPlan(s,card).status,'invalid');
   const waiting={...base,decision:null,active:'corp'};assert.equal(breakerPlan(waiting,card).status,'waiting');assert.match(responseLabel(waiting,true),/Corp/);
   assert.equal(breakerPlan({...s,terminal:{winner:'corp'}},card).status,'invalid');assert.equal(breakerPlan({...s,run:null},card).status,'invalid');
  }finally{g.close()}
 }
 const multi=position({breaker:30006});try{let s=await multi.api.advance();const id=s.run.tools[0].card.id;for(let i=0;i<2;i++){const step=breakerPlan(s,id);multi.api.choose({version:s.version,command:step.next.command,index:step.next.index});s=await multi.api.advance()}
 assert.ok(paidAbilityFinish(s));const funds=s.runner.credits,finish=paidAbilityFinish(s);multi.api.choose({version:s.version,...finish});s=await multi.api.advance();assert.equal(s.runner.credits,funds);assert.equal(paidAbilityFinish(s),null,'Ordinary response windows cannot be mistaken for an ability finish');
 }finally{multi.close()}
 const short=position({credits:0});try{const s=short.api.snapshot(),card=s.run.tools[0].card.id;assert.match(breakerPlan(s,card).reason,/0 eligible/)}finally{short.close()}
 const mismatch=position({ice:30038,breaker:30006});try{const s=await mismatch.api.advance();assert.equal(breakerPlan(s,s.run.tools[0].card.id).status,'invalid')}finally{mismatch.close()}
 const quiet=position({breaker:30015});try{vm.runInContext('attackedServer=null;encountering=false;ChangePhase(phases.runnerPostAction);',quiet.context);let s=await quiet.api.advance();assert.equal(s.quietWindow,true);assert.ok(quietPass(s));assert.equal(quietPass({...s,quietWindow:false}),null);
  vm.runInContext("attackedServer=corp.RnD;approachIce=0;encountering=false;ChangePhase(phases.runApproachIce);",quiet.context);s=quiet.api.snapshot();assert.equal(s.quietWindow,true,'Boost-only approach windows use the native pass rather than another user click');
  vm.runInContext('encountering=true;ChangePhase(phases.runEncounterIce);',quiet.context);s=quiet.api.snapshot();assert.equal(s.quietWindow,false,'Encounter responses always remain interactive');
  vm.runInContext('attackedServer=null;encountering=false;ChangePhase(phases.runnerStartResponse);',quiet.context);s=quiet.api.snapshot();assert.equal(s.quietWindow,true,'A turn-start window with only an expiring boost is eligible; real start effects remain choices');
  vm.runInContext('var telework=put(30027,runner.rig.resources);telework.usedThisTurn=true;',quiet.context);s=quiet.api.snapshot();assert.match(s.runner.rig.resources.find(c=>c.number===30027).availability,/Used this turn/);
 }finally{quiet.close()}
 console.log('Interaction: current-version plan choices, native source payments, cancel without debit, post-response steps, zero credits/type reasons, terminal/waiting guards and conservative opt-in pass eligibility pass.');
})().catch(e=>{console.error(e);process.exitCode=1});
