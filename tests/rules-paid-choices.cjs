'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {makeGame, choices, checkState, checkSnapshot} = require('./engine-smoke.cjs');
const {complete} = require('../scripts/complete-recorded-decks.cjs');
const CURRENT = '26.03-local-2';
const breakers = [30005,30006,30015,30016,30025,30026,30032];
function setup(number, mode = 'outside', profile = CURRENT) {
  const g = makeGame(), config = complete('lt-starter').config;
  config.rulesVersion = profile;
  config.decks.runner.cards.push(...breakers,30007,30008,30029);
  g.api.boot(config);
  g.context.probeNumber = number;
  vm.runInContext(`
    var program=AllCards(runner).find(c=>c.setNumber===probeNumber);
    MoveCard(program,runner.rig.programs);program.faceUp=true;
    playerTurn=runner;runner.clickTracker=4;runner.creditPool=20;
    var ice=AllCards(corp).find(c=>c.setNumber===30073);
    MoveCard(ice,corp.HQ.ice);ice.rezzed=true;
    ChangePhase(phases.runnerActionMain);
  `, g.context);
  if (mode === 'outside' && number !== 30007) vm.runInContext('ChangePhase(phases.runnerPostAction);',g.context);
  if (mode !== 'outside') vm.runInContext(`
    attackedServer=corp.HQ;approachIce=0;encountering=true;
    ice.strength=Strength(program);ice.subTypes=['Code Gate'];
    ChangePhase(phases.runEncounterIce);
  `, g.context);
  if (mode === 'over') vm.runInContext('ice.strength=0;',g.context);
  if (mode === 'broken') vm.runInContext('ice.subroutines.forEach(s=>s.broken=true);',g.context);
  if (mode === 'ai-lock') vm.runInContext('ice.cannotBreakUsingAIPrograms=true;',g.context);
  return g;
}
async function act(g, predicate) {
  const s=g.api.snapshot(), option=choices(s).find(predicate);
  assert.ok(option, `${s.phase.title}: missing choice\n${choices(s).map(o=>o.label).join('\n')}`);
  g.api.choose({version:s.version,command:option.command,index:option.index});
  const next=await g.api.advance();checkState(g);checkSnapshot(g,next);return next;
}
const boost=n=>o=>o.command==='trigger'&&o.card?.number===n&&/strength/.test(o.detail||'');
async function boosts() {
  let count=0;
  for (const number of breakers) for (const mode of ['outside','matching','over','broken','ai-lock']) {
    const g=setup(number,mode);
    try {
      const s=g.api.snapshot(), option=choices(s).find(boost(number));
      assert.ok(option,`${number}/${mode} boost should be legal`);
      const before=g.context.Strength(g.context.program), cost=option.cost.credits;
      const next=await act(g,boost(number));
      assert.equal(next.runner.credits,20-cost);
      if (mode==='outside') {
        assert.equal(g.context.program.strengthBoost,0);
        assert.equal(g.context.Strength(g.context.program),before);
        assert.ok(next.history.some(e=>/expires outside an encounter/.test(e.text)));
      } else {
        assert.ok(g.context.Strength(g.context.program)>before);
        g.context.program.responseOnEncounterEnds.Resolve.call(g.context.program);
        assert.equal(g.context.program.strengthBoost,0);
      }
      count++;
    } finally {g.close();}
  }
  for(const mode of ['matching','outside','broken']) {
    const g=setup(30032,mode,'26.03-local-1');
    try {assert.ok(!choices(g.api.snapshot()).some(boost(30032)));} finally {g.close();}
  }
  const poor=setup(30005);
  try {vm.runInContext('runner.creditPool=2;',poor.context);assert.ok(!choices(poor.api.snapshot()).some(boost(30005)));}finally{poor.close();}
  return count;
}
async function payment() {
  const g=setup(30005,'matching');
  try {
    vm.runInContext(`
      var overclock=AllCards(runner).find(c=>c.setNumber===30029);
      MoveCard(overclock,runner.resolvingCards);overclock.faceUp=true;overclock.credits=5;
      runner.temporaryCredits=2;
    `,g.context);
    let s=await act(g,boost(30005));
    assert.equal(s.phase.guide.remaining,3);assert.equal(g.context.program.strengthBoost,0);
    assert.equal(s.runner.credits,20);assert.equal(s.runner.temporaryCredits,2);assert.equal(g.context.overclock.credits,5);
    assert.ok(choices(s).every(o=>o.command==='pay'&&/Pay [123] credit/.test(o.label)));
    const stale={version:s.version,command:'pay',index:0};
    s=await act(g,o=>o.label==='Pay 1 credit from credit pool');
    assert.equal(s.phase.guide.remaining,2);assert.equal(g.context.program.strengthBoost,0);
    assert.throws(()=>g.api.choose(stale),/already passed/);
    assert.ok(!choices(s).some(o=>/^Pay 3/.test(o.label)));
    s=await act(g,o=>o.label==='Pay 1 credit from Overclock');
    assert.equal(s.phase.guide.remaining,1);assert.equal(g.context.program.strengthBoost,0);
    s=await act(g,o=>o.label==='Pay 1 credit from bad publicity');
    assert.notEqual(s.phase.identifier,'Pay credits');assert.equal(g.context.program.strengthBoost,1);
    assert.equal(s.runner.credits,19);assert.equal(s.runner.temporaryCredits,1);assert.equal(g.context.overclock.credits,4);
    assert.equal(s.history.filter(e=>/spent 1 credit from (credit pool|Overclock|bad publicity)/.test(e.text)).length,3);
  } finally {g.close();}
  // Ineligible hosted credits cannot be used; sole-source payments need no prompt.
  const h=setup(30005,'matching');
  try {
    vm.runInContext(`
      var overclock=AllCards(runner).find(c=>c.setNumber===30029);
      MoveCard(overclock,runner.resolvingCards);overclock.credits=5;
      overclock.canUseCredits=(doing,card)=>doing==='installing';
    `,h.context);
    const s=await act(h,boost(30005));
    assert.equal(s.runner.credits,17);assert.equal(h.context.overclock.credits,5);
    assert.notEqual(s.phase.identifier,'Pay credits');
  } finally {h.close();}
  // A fund outside a run is not an eligible source even if present in a probe.
  const outside=setup(30032);
  try {
    vm.runInContext('runner.temporaryCredits=5;',outside.context);
    const s=await act(outside,boost(30032));
    assert.equal(s.runner.credits,19);assert.equal(s.runner.temporaryCredits,5);
  }finally{outside.close();}
}
async function otherLegalChoices() {
  const g=setup(30005,'broken');
  try {
    await act(g,o=>o.command==='trigger'&&o.card?.number===30005&&/Break/.test(o.detail||''));
    const s=await act(g,o=>o.label==='Break 0 subroutines');assert.equal(s.runner.credits,19);
    assert.ok(g.context.ice.subroutines.every(s=>s.broken));
  }finally{g.close();}
  const h=setup(30006,'matching');
  try {assert.ok(!choices(h.api.snapshot()).some(o=>o.command==='trigger'&&o.card?.number===30006&&/Break/.test(o.detail||'')),'Mismatched interface remains illegal');}finally{h.close();}
  const f=setup(30007);
  try {
    await act(f,o=>o.command==='trigger'&&o.card?.number===30007);
    assert.ok(f.context.runner.heap.includes(f.context.program));
    assert.equal(f.context.runner.creditPool,20);assert.equal(f.context.runner.clickTracker,3);
  }finally{f.close();}
  const l=setup(30008,'broken');
  try {
    vm.runInContext('program.virus=1;',l.context);
    const s=l.api.snapshot(),o=choices(s).find(o=>o.command==='trigger'&&o.card?.number===30008);assert.ok(o);
    l.api.choose({version:s.version,command:o.command,index:o.index});
    const d=l.api.snapshot();l.api.choose({version:d.version,command:'continue',index:0});
    assert.equal(l.context.program.virus,0);assert.equal(l.context.program.strengthReduce,-1);
    await l.api.advance();assert.equal(l.context.program.strengthReduce,0);
  }finally{l.close();}
}
async function overadvance() {
  for(const profile of [CURRENT,'26.03-local-1']) {
    const g=makeGame(),config=complete('lt-starter').config;config.rulesVersion=profile;g.api.boot(config);
    try {
      vm.runInContext(`
        var agenda=AllCards(corp).find(c=>c.cardType==='agenda');
        MoveCard(agenda,corp.HQ.root);agenda.advancement=AdvancementRequirement(agenda);
        playerTurn=corp;corp.clickTracker=3;corp.creditPool=10;ChangePhase(phases.corpActionMain);
      `,g.context);
      const option=choices(g.api.snapshot()).find(o=>o.command==='advance'&&o.card?.id===g.context.agenda.localId);
      assert.equal(!!option,profile===CURRENT);
      if(option) {
        const before=g.context.agenda.advancement;
        await act(g,o=>o.command==='advance'&&o.card?.id===g.context.agenda.localId);
        assert.equal(g.context.agenda.advancement,before+1);assert.equal(g.context.corp.creditPool,9);
      }
    }finally{g.close();}
  }
}
async function main() {
  const count=await boosts();await payment();await otherLegalChoices();await overadvance();
  console.log(`PASS ${CURRENT}: ${count} legal boost cases, expiry, source allocation before effect, eligibility, stale-input guard, zero breaks/counters, overadvancement, legacy choices`);
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={main};
