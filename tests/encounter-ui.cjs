'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {makeGame,choices,checkSnapshot}=require('./engine-smoke.cjs');
function encounter(breaker,ice,credits=30){
 const g=makeGame();g.api.boot({side:'runner',seed:`encounter-ui-${breaker}-${ice}`});
 vm.runInContext(`
  function uiCard(n,zone){
   var c=AllCards(n<30035?runner:corp).find(c=>c.setNumber===n);
   if(c) MoveCard(c,zone);
   else {c=InstanceCard(n);c.renderer=runner.identityCard.renderer;zone.push(c);c.cardLocation=zone;}
   c.faceUp=true;return c;
  }
  var uiBreaker=uiCard(${breaker},runner.rig.programs);
  var uiIce=uiCard(${ice},corp.HQ.ice);uiIce.rezzed=true;uiIce.strength=7;
  playerTurn=runner;runner.clickTracker=3;runner.creditPool=${credits};
  attackedServer=corp.HQ;approachIce=0;encountering=true;ChangePhase(phases.runEncounterIce);
 `,g.context);return g;
}
async function main(){
 const {encounterTool,relatedCards}=await import('../app/encounter.mjs');
 // Quotes are checked against actual upstream payments, including both dynamic
 // breakers and the second, already-paid break of Buzzsaw/Cleaver.
 for(const [number,ice,boostCost,boostAmount,breakCost] of [
  [30005,30074,3,1,1],[30006,30039,2,1,1],[30015,30038,2,3,1],
  [30016,30039,1,1,2],[30025,30038,3,2,1],[30026,30074,1,1,1],[30032,30038,1,1,1],
 ]){
  const g=encounter(number,ice);
  try{
   let s=await g.api.advance();
   const act=async option=>{assert.ok(option,`Missing action for ${number}`);g.api.choose({version:s.version,command:option.command,index:option.index});s=await g.api.advance();checkSnapshot(g,s);};
   let tool=s.run.tools.find(t=>t.card.number===number);
   assert.equal(tool.boostCost,boostCost);assert.equal(tool.boostAmount,boostAmount);assert.equal(tool.breakCost,breakCost);
   assert.match(encounterTool(tool).status,/Needs/);
   const initial=s.runner.credits;
   while(tool.gap){
    const boost=choices(s).find(o=>o.command==='trigger'&&o.card?.number===number&&o.detail.startsWith('+'));
    assert.equal(boost.cost.credits,boostCost);if(number===30025)assert.equal(boost.detail,'+2 strength.');
    const before=s.runner.credits;await act(boost);assert.equal(before-s.runner.credits,boostCost);
    tool=s.run.tools.find(t=>t.card.number===number);
   }
   assert.equal(initial-s.runner.credits,Math.ceil((7-(number===30025?1:number===30015?2:[30005,30006].includes(number)?3:1))/boostAmount)*boostCost);
   const begin=choices(s).find(o=>o.command==='trigger'&&o.card?.number===number&&/Break/.test(o.detail));
   assert.equal(begin.cost.credits,breakCost);if(number===30025)assert.match(begin.detail,/sentry/);
   const before=s.runner.credits;await act(begin);
   assert.equal(s.runner.credits,before,'Opening target selection does not pay');
   const pending=choices(s).filter(o=>o.subroutine);
   if(number===30025)assert.match(s.phase.title,/sentry/,'Target selection uses the corrected label too');
   assert.ok(pending.length);assert.ok(pending.every(o=>o.cost.credits===breakCost));
   assert.ok(pending.every(o=>o.sourceId===g.context.uiBreaker.localId));
   assert.deepEqual(relatedCards(pending[0]),[g.context.uiBreaker.localId,g.context.uiIce.localId]);
   const cancel=s.decision.commands.find(c=>c.cancel);assert.ok(cancel);
   g.api.choose({version:s.version,command:cancel.command,index:0,cancel:true});s=await g.api.advance();
   assert.equal(s.runner.credits,before,'Cancel preserves resources');
   await act(choices(s).find(o=>o.command==='trigger'&&o.card?.number===number&&/Break/.test(o.detail)));
   await act(choices(s).find(o=>o.subroutine));
   assert.equal(before-s.runner.credits,breakCost);
   if([30005,30006].includes(number)){
    const second=choices(s).find(o=>o.subroutine);assert.ok(second);
    assert.equal(second.cost.credits,0);assert.match(second.cost.note,/already paid/);
    await act(second);assert.equal(before-s.runner.credits,breakCost,'Second break costs no extra credit');
   }
  }finally{g.close();}
 }
 const discounted=encounter(30016,30039);
 try{vm.runInContext('uiBreaker.madeSuccessfulRunThisTurn=true;',discounted.context);const s=await discounted.api.advance();assert.equal(s.run.tools[0].breakCost,1);}finally{discounted.close();}
 const unity=encounter(30026,30074);
 try{vm.runInContext('uiCard(30006,runner.rig.programs);',unity.context);const s=await unity.api.advance();assert.equal(s.run.tools.find(t=>t.card.number===30026).boostAmount,2);}finally{unity.close();}
 const mismatch=encounter(30006,30038,1);
 try{
  let s=await mismatch.api.advance(),tool=s.run.tools[0];assert.equal(tool.matches,false);assert.match(encounterTool(tool).status,/Cannot break/);
  assert.ok(!choices(s).some(o=>o.command==='trigger'&&o.card?.number===30006));
  vm.runInContext('uiIce.rezzed=false;uiIce.faceUp=false;uiIce.knownToRunner=false;encountering=false;',mismatch.context);
  s=mismatch.api.snapshot();assert.equal(s.run.tools.length,0,'No advisory reveals concealed ice');
 }finally{mismatch.close();}
 const short=encounter(30015,30038,1);
 try{const s=await short.api.advance();assert.match(encounterTool(s.run.tools[0]).detail,/only 1 credit available/);assert.ok(!choices(s).some(o=>o.card?.number===30015));}finally{short.close();}
 const virus=makeGame(),replay=require('../eval/counters/runner-virus-replay.json');
 try{
  virus.api.boot(replay.config);let s=await virus.api.advance();for(const choice of replay.choices){virus.api.choose(choice);s=await virus.api.advance();}
  const bot=choices(s).find(o=>o.command==='trigger'&&o.card?.number===30004);assert.equal(bot.cost.virus,1);
  const leech=choices(s).find(o=>o.command==='trigger'&&o.card?.number===30008);assert.equal(leech.cost.virus,1);
  virus.api.choose({version:s.version,command:bot.command,index:bot.index});s=await virus.api.advance();
  assert.ok(choices(s).filter(o=>o.subroutine).every(o=>o.cost.virus===1));
 }finally{virus.close();}
 assert.equal(encounterTool({card:{hidden:true}}),null);
 assert.match(encounterTool({card:{},enabled:false}).status,/inactive/);
 assert.match(encounterTool({card:{},kind:'strength-virus',counters:0}).status,/No virus/);
 assert.match(encounterTool({card:{},kind:'hosted-virus',counters:2,matches:false}).status,/different ice/);
 console.log('Encounter UI: all seven breaker quotes match native payments; dynamic costs, free second breaks, cancel, source links, mismatch, insufficient funds, virus costs and concealed-ice privacy pass.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
