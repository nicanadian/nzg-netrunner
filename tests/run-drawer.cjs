'use strict';
const assert = require('node:assert/strict');
const {makeGame, choices} = require('./engine-smoke.cjs');
const vm = require('node:vm');
async function restore(file) {
  const replay=require('../'+file), game=makeGame();
  game.api.boot(replay.config);let state=await game.api.advance();
  for(const choice of replay.choices){game.api.choose(choice);state=await game.api.advance();}
  return {game,state};
}
async function main() {
  const {runDrawerModel}=await import('../app/run-drawer.mjs');
  const {game,state}=await restore('eval/counters/runner-virus-replay.json');
  try {
    let s=state,m=runDrawerModel(s);
    assert.equal(m.stage,'Encounter');assert.equal(m.remaining,3);
    assert.equal(m.controls.length,1);assert.equal(m.controls[0].command,'n');
    assert.equal(m.controls[0].label,'Continue · resolve unbroken subroutines');assert.match(m.controls[0].detail,/both players pass/);
    assert.ok(!m.controls.some(c=>c.command==='jack'),'Cannot invent jack-out during encounter');
    for(const c of m.controls) assert.ok(choices(s).some(o=>o.command===c.command&&o.index===c.index));
    const botulus=choices(s).find(o=>o.command==='trigger'&&o.card?.number===30004);
    game.api.choose({version:s.version,command:botulus.command,index:botulus.index});s=await game.api.advance();
    m=runDrawerModel(s);assert.equal(m.controls.length,0);assert.equal(m.cancels[0].command,'continue');
    const before=JSON.stringify(s.runner);
    game.api.choose({version:s.version,command:m.cancels[0].command,index:0,cancel:true});s=await game.api.advance();
    assert.equal(JSON.stringify(s.runner),before,'Pinned cancel preserves resources and counters');
    const ability=choices(s).find(o=>o.command==='trigger'&&o.card?.number===30004);
    game.api.choose({version:s.version,command:ability.command,index:ability.index});s=await game.api.advance();
    const second=choices(s).find(o=>o.subroutine===2);
    game.api.choose({version:s.version,command:second.command,index:second.index});s=await game.api.advance();
    assert.equal(runDrawerModel(s).remaining,2);assert.equal(s.run.card.subroutines[1].broken,true);
    assert.equal(runDrawerModel(s,true).controls.length,0,'Recorded playback offers no live action');
    assert.equal(runDrawerModel({...s,terminal:{winner:'corp'}}),null);
    assert.equal(runDrawerModel({...s,run:null}),null);
    const movement={...s,phase:{identifier:'Run 4.3',title:'Run: Decide Continue'},run:{...s.run,encountering:false,movement:true},decision:{commands:[
      {command:'n',label:'Continue the run',options:[{index:2}]},{command:'jack',label:'Jack out',options:[{index:0}]},
    ]}};
    assert.deepEqual(runDrawerModel(movement).controls.map(c=>[c.command,c.index,c.label]),[['n',2,'Continue the run'],['jack',0,'Jack out']]);
    const hidden={...s,run:{...s.run,card:{id:'unknown',hidden:true}}};
    assert.equal(runDrawerModel(hidden).cardLabel,'Unrevealed card');assert.equal(runDrawerModel(hidden).remaining,0);
    const selected={...s,decision:{commands:[{command:'n',label:'Continue',options:[{index:0,card:{id:'target'}}]}]}};
    assert.equal(runDrawerModel(selected).controls.length,0,'A card target stays in the action area');
  } finally {game.close();}
  // Restore a real current-profile payment through legal recorded choices.
  const recorded=require('../eval/recorded-games/lt-starter-paid-choices-full-replay.json');
  const index=recorded.trace.findIndex(x=>x.before.phase==='Pay credits');assert.ok(index>0);
  const paid=makeGame();
  try {
    paid.api.boot(recorded.config);paid.context.tape=recorded.randomTape;
    vm.runInContext('var tapeIndex=0;Math.random=()=>tape[tapeIndex++];',paid.context);
    let s=await paid.api.advance();
    for(const {choice} of recorded.trace.slice(0,index)){paid.api.choose(choice);s=await paid.api.advance();}
    const model=runDrawerModel(s);
    assert.equal(s.phase.identifier,'Pay credits');assert.equal(model.controls.length,0);assert.equal(model.cancels.length,0);
    assert.match(model.waiting,/credits left to pay/);assert.ok(choices(s).every(o=>o.command==='pay'));
    const amount=s.phase.guide.remaining;
    const pay=choices(s).find(o=>o.label===`Pay ${amount} credits from Overclock`);assert.ok(pay);
    paid.api.choose({version:s.version,command:'pay',index:pay.index});s=await paid.api.advance();
    assert.notEqual(s.phase.identifier,'Pay credits');
  } finally {paid.close();}
  const restricted=await restore('eval/polish/restricted-access-replay.json');
  try {
    const m=runDrawerModel(restricted.state);
    assert.equal(m.stage,'Access');assert.equal(m.contextLabel,'Accessed card');
    assert.equal(m.controls[0].label,'Finish accessing');
    assert.ok(!m.controls.some(c=>c.command==='steal'));
  }finally{restricted.game.close();}
  console.log('Run drawer: native pass/jack boundaries, cancellation, virus break, payment, restricted access, playback, concealed cards and terminal cleanup pass.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
