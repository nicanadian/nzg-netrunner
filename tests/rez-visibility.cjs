'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {makeGame,choices,checkSnapshot}=require('./engine-smoke.cjs');
const replay=require('./fixtures/ping-rez-affordability.json');
(async()=>{
 const {opponentBeat}=await import('../app/opponent.mjs');
 const {corpIceRezHint}=await import('../app/encounter.mjs');
 const {assistedChoice}=await import('../app/interaction.mjs');
 const {helperContext}=await import('../app/helper-context.mjs');
 let g=makeGame(),tithe;const windows=new Map(),beats=[];
 try{
  g.api.boot(replay.config);let s=await g.api.advance();
  const record=s=>{
   if(s.turn===28&&s.phase.identifier==='Run 2.1'&&s.active==='corp'){
    windows.set(s.version,JSON.parse(JSON.stringify(s)));
    if(s.run.card.title==='Tithe')tithe=s;
   }
  };
  for(const c of replay.choices){record(s);g.api.choose(c);s=await g.api.advance(300,(before,after)=>{
   record(after);const beat=opponentBeat(before,after);if(beat?.kind==='unrezzed-ice'&&after.turn===28)beats.push(beat);
  });}
  assert.equal(s.terminal.winner,'runner');assert.equal(s.runner.points,9);
  assert.deepEqual([...windows.values()].map(s=>[s.run.card.title,s.run.rezStatus.cost,s.run.rezStatus.available]),[
   ['Ping',2,1],['Palisade',3,1],['Tithe',1,1],['Whitespace',2,1],['Whitespace',2,1],
  ]);
  const ping=[...windows.values()][0];
  assert.equal(ping.decision.commands.some(c=>c.command==='rez'),false);
  assert.equal(tithe.decision.commands.find(c=>c.command==='rez').options[0].secondary,false);
  assert.equal(assistedChoice(tithe),null,'Affordable defensive rez stops assistance');
  assert.equal(beats.length,4,'All four unaffordable ice passes are explained');
  assert.match(beats[0].detail,/2 credits required; 1 eligible credit available/);
  const context=helperContext(ping,{watching:true,playback:beats[0]});
  assert.equal(context.run.rezStatus.available,1);assert.match(context.playback.detail,/2 credits required/);
  assert.match(corpIceRezHint(ping.run.card,ping),/Cannot rez Ping/);
  assert.match(corpIceRezHint({...ping.run.card,installed:false},ping),/rez cost is paid separately/);
  const passedPing=tithe.corp.servers.find(s=>s.name==='Remote 2').ice.find(c=>c.title==='Ping');
  assert.match(corpIceRezHint(passedPing,tithe),/already passed Ping/);
  // Recreate that same board with one extra credit and approach outermost Ping.
  // This explicit counterfactual tests affordability and the primary rez stop.
  assert.equal(g.api.metrics().diagnostics.length,0);g.close();g=makeGame();
  g.api.boot(replay.config);s=await g.api.advance();
  for(const c of replay.choices.slice(0,replay.choices.findIndex(c=>c.version===770))){g.api.choose(c);s=await g.api.advance();}
  g.api.choose(replay.choices.find(c=>c.version===770));
  vm.runInContext(`corp.creditPool=2;playerTurn=runner;runner.clickTracker=4;attackedServer=corp.remoteServers.find(s=>s.serverName==='Remote 2');approachIce=attackedServer.ice.length-1;encountering=false;movement=false;ChangePhase(phases.runApproachIce);`,g.context);
  s=await g.api.advance();checkSnapshot(g,s);
  const rez=choices(s).find(o=>o.command==='rez'&&o.card.title==='Ping');
  assert.ok(rez);assert.equal(rez.cost.credits,2);assert.equal(rez.secondary,false);assert.equal(assistedChoice(s),null);
  assert.equal(s.run.rezStatus.offered,true);
  const report={seed:replay.config.seed,turn:14,windows:[...windows.values()].map(s=>({version:s.version,ice:s.run.card.title,cost:s.run.rezStatus.cost,available:s.run.rezStatus.available,rezOffered:s.run.rezStatus.offered})),ending:'Runner wins with 9 agenda points',counterfactual:'With 2 credits, Ping is offered as a primary rez action and assistance does not pass.'};
  fs.mkdirSync('eval/rez-visibility',{recursive:true});fs.writeFileSync('eval/rez-visibility/replay-analysis.json',JSON.stringify(report,null,2)+'\n');
  assert.equal(g.api.metrics().diagnostics.length,0);
  console.log('PASS uploaded ending: Ping 2/1, Palisade 3/1, Tithe 1/1, both Whitespace 2/1; four explained unaffordable passes, passed-card inspection, and affordable Ping stops for rez.');
 }finally{g.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
