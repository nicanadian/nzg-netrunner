'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const {makeGame, choices, checkState, checkSnapshot} = require('../../tests/engine-smoke.cjs');
const {complete} = require('../complete-recorded-decks.cjs');

async function fixture(id, setup, run) {
  const g = makeGame(), trace = [];
  try {
    const config = complete('lt-starter').config;
    config.control = 'scripted'; config.rulesVersion = '26.03-local-2'; config.seed = `jinteki-${id}`;
    config.decks.corp.cards.push(30036,30037,30040,30042,30045,30053,30067,30071,30072,30074);
    config.decks.runner.cards.push(30006,30008,30029);
    g.api.boot(config);
    vm.runInContext(`
      while(corp.HQ.cards.length) MoveCard(corp.HQ.cards[0],corp.RnD.cards);
      while(runner.grip.length) MoveCard(runner.grip[0],runner.stack);
      var picked=[];
      function card(player,number,zone){
        var c=AllCards(player).find(c=>c.setNumber===number&&!picked.includes(c));
        if(!c)throw Error('Missing fixture card '+number);
        picked.push(c);MoveCard(c,zone);if(player===runner)c.faceUp=true;return c;
      }
      var remote=NewServer('Comparison remote',false);corp.remoteServers.push(remote);
      corp.creditPool=20;runner.creditPool=6;runner.clickTracker=4;corp.clickTracker=0;
      playerTurn=runner;
      ${setup}
    `, g.context);
    let s = g.api.snapshot();
    const fail = msg => new Error(`${id}: ${msg}\n${s.phase.title} (${s.active})\n${choices(s).map(o=>`${o.command} ${o.label} ${o.detail||''} #${o.card?.number}`).join('\n')}`);
    const act = async (command, predicate=()=>true) => {
      const o=choices(s).find(o=>o.command===command&&predicate(o));
      if(!o)throw fail(`Missing ${command}`);
      trace.push({phase:s.phase.identifier,command,label:o.label,number:o.card?.number});
      g.api.choose({version:s.version,command,index:o.index});
      s=await g.api.advance();checkState(g);checkSnapshot(g,s);return s;
    };
    const pass = async () => {
      if(choices(s).some(o=>o.command==='n'))return act('n');
      if(choices(s).some(o=>o.command==='continue'&&/^Continue/.test(o.label)))return act('continue',o=>/^Continue/.test(o.label));
      const trigger=choices(s).find(o=>o.command==='trigger'&&[30036,30042].includes(o.card?.number));
      if(trigger)return act('trigger',o=>o.index===trigger.index);
      throw fail('Cannot pass');
    };
    const until = async predicate => {
      for(let i=0;i<50&&!predicate(s);i++)await pass();
      if(!predicate(s))throw fail('Checkpoint not reached');
    };
    const value=await run({g,act,until,pass,state:()=>s,options:()=>choices(s)});
    assert.equal(g.errors.length,0,g.errors.join('\n'));
    return {value,trace};
  } finally {g.close();}
}
const isCard=n=>o=>o.card?.number===n;

async function main() {
  const results={}, traces={}, errors={};
  const run = async (id,setup,body) => {
    try {const r=await fixture(id,setup,body);results[id]=r.value;traces[id]=r.trace;console.log(`PASS local ${id}`);}
    catch(e){errors[id]=e.stack;console.error(e.stack);}
  };
  for(const branch of ['credits','clicks','end'])await run(`overclock-manegarm-${branch}`,`
    card(corp,30042,remote.root).rezzed=true;
    var overclock=card(runner,30029,runner.grip);
    ChangePhase(phases.runnerActionMain);
  `,async t=>{
    await t.act('play',isCard(30029));
    await t.act('continue',o=>o.server==='Comparison remote');
    await t.until(s=>t.options().some(o=>o.command==='continue'&&/Pay 5/.test(o.label)));
    await t.act('continue',o=>branch==='credits'?/Pay 5/.test(o.label):branch==='clicks'?/click/i.test(o.label):/End the run/i.test(o.label));
    if(branch==='credits'){
      for(let i=0;i<5&&t.state().phase.identifier==='Pay credits';i++)
        await t.act('pay',o=>/^Pay 1 credit from Overclock$/.test(o.label));
    }
    return {pool:t.state().runner.credits,clicks:t.state().runner.clicks,
      overclock:t.g.context.runner.resolvingCards.includes(t.g.context.overclock)?t.g.context.overclock.credits:0,
      runActive:!!t.g.context.attackedServer};
  });
  for(const initial of [9,10])await run(`whitespace-${initial}`,`
    var ice=card(corp,30074,corp.HQ.ice);ice.rezzed=true;
    runner.creditPool=${initial};corp.badPublicity=5;MakeRun(corp.HQ);
  `,async t=>{
    await t.until(s=>s.phase.title==='Run: Subroutines');
    await t.act('trigger');
    const afterLoss={pool:t.state().runner.credits,fund:t.state().runner.temporaryCredits};
    await t.act('trigger');
    return {afterLoss,runActive:!!t.g.context.attackedServer,fund:t.state().runner.temporaryCredits};
  });
  for(const iced of [true,false])await run(iced?'spin-iced':'spin-empty',`
    var spin=card(corp,30053,remote.root);
    card(corp,30037,corp.archives.cards).faceUp=true;
    card(corp,30071,corp.archives.cards).faceUp=true;
    ${iced?'card(corp,30072,remote.ice);':''}
    MakeRun(remote);
  `,async t=>{
    if(iced)await t.until(s=>s.phase.identifier==='Run 4.3');
    await t.until(()=>t.options().some(o=>o.command==='rez'&&o.card?.number===30053));
    const before=t.g.context.corp.HQ.cards.length;
    await t.act('rez',isCard(30053));
    if(t.options().some(o=>o.command==='trigger'&&o.card?.number===30053))await t.act('trigger',isCard(30053));
    await t.until(()=>t.options().some(o=>o.command==='trigger'&&o.card?.number===30053));
    await t.act('trigger',isCard(30053));
    await t.act('continue',isCard(30037));
    await t.act('continue',isCard(30071));
    await t.until(()=>!t.g.context.attackedServer);
    return {drawn:t.g.context.corp.HQ.cards.length-before,
      removed:t.g.context.removedFromGame.includes(t.g.context.spin),
      shuffled:t.g.context.corp.RnD.cards.filter(c=>[30037,30071].includes(c.setNumber)&&t.g.context.picked.includes(c)).length,
      runActive:!!t.g.context.attackedServer,successful:t.state().history.some(e=>e.text==='Run successful')};
  });
  await run('leech',`
    var ice=card(corp,30072,remote.ice);ice.rezzed=true;
    var leech=card(runner,30008,runner.rig.programs);leech.virus=2;
    card(runner,30006,runner.rig.programs);
    MakeRun(remote);
  `,async t=>{
    await t.until(s=>s.active==='runner'&&s.run?.encountering);
    const before=t.g.context.Strength(t.g.context.ice);
    await t.act('trigger',isCard(30008));
    const during=t.g.context.Strength(t.g.context.ice);
    await t.act('trigger',o=>o.card?.number===30006&&/Break/.test(o.detail||''));
    await t.act('continue',o=>/End the run/.test(o.label));
    await t.until(s=>s.phase.title==='Run: Movement');
    return {before,during,after:t.g.context.Strength(t.g.context.ice),counters:t.g.context.leech.virus};
  });
  await run('luminal',`
    var luminal=card(corp,30036,remote.root);luminal.advancement=4;
    var other=NewServer('Other remote',false);corp.remoteServers.push(other);
    card(corp,30067,other.root).advancement=4;
    playerTurn=corp;corp.clickTracker=0;ChangePhase(phases.corpPostAction);
  `,async t=>{
    await t.act('score',isCard(30036));
    await t.until(()=>t.options().some(o=>o.command==='trigger'&&o.card?.number===30036));
    await t.act('trigger',isCard(30036));
    const bonus=t.state().corp.clicks,pool=t.state().corp.credits;
    const otherScored=t.options().some(o=>o.command==='score'&&o.card?.number===30067);
    for(let i=0;i<3;i++){
      // Capture before advancing after the final click, to avoid crossing turns.
      const s=t.state(),o=t.options().find(o=>o.command==='gain');assert.ok(o);
      if(i<2)await t.act('gain');else t.g.api.choose({version:s.version,command:'gain',index:o.index});
    }
    const end=t.g.api.snapshot();
    return {bonus,otherScored,clicks:end.corp.clicks,creditsGained:end.corp.credits-pool};
  });
  for(const target of ['Palisade','Leech'])await run(`seamless-${target}`,`
    var palisade=card(corp,30072,corp.HQ.ice);
    var leech=card(runner,30008,runner.rig.programs);
    var urtica=card(corp,30045,remote.root);
    var launch=card(corp,30040,corp.HQ.cards);launch.cardsInstalledThisTurn=[urtica];
    playerTurn=corp;corp.clickTracker=2;ChangePhase(phases.corpActionMain);
  `,async t=>{
    await t.act('play',isCard(30040));
    assert.ok(!t.options().some(o=>o.command==='continue'&&o.card?.number===30045),'New Urtica must be excluded');
    await t.act('continue',isCard(target==='Palisade'?30072:30008));
    return {newCounters:t.g.context.urtica.advancement||0,
      targetCounters:(target==='Palisade'?t.g.context.palisade:t.g.context.leech).advancement||0};
  });
  const output={engine:'local-table',rulesVersion:'26.03-local-2',scenarios:results,traces,errors};
  const destination=process.argv[2]||path.join(__dirname,'../../eval/jinteki-comparison/local.json');
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(output,null,2)+'\n');
  if(Object.keys(errors).length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
