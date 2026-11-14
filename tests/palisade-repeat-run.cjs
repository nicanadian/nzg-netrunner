'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {makeGame,choices}=require('./engine-smoke.cjs');
(async()=>{
 const {assistedChoice}=await import('../app/interaction.mjs');
 const {iceRezWarning}=await import('../app/rez-warning.mjs');
 const g=makeGame();
 try{
  g.api.boot({side:'corp',control:'scripted',seed:'palisade-repeat-run',rulesVersion:'26.03-local-2'});
  // Construct a first-run Ansel encounter; subsequent install, jack-out, run,
  // priority passes and rez all use the actual offered native choices.
  vm.runInContext(`
   var inner=AllCards(corp).find(c=>c.setNumber===30038);
   var wall=AllCards(corp).find(c=>c.setNumber===30072);
   MoveCard(inner,corp.RnD.ice);inner.rezzed=true;
   MoveCard(wall,corp.HQ.cards);corp.creditPool=10;
   playerTurn=runner;runner.clickTracker=4;runner.creditPool=20;
   attackedServer=corp.RnD;approachIce=0;encountering=true;movement=false;
   ChangePhase(phases.runSubroutines);subroutine=1;
  `,g.context);
  let s=await g.api.advance();
  const act=async predicate=>{const o=choices(s).find(predicate);assert(o,`${s.phase.identifier}: missing choice ${choices(s).map(o=>o.label).join('; ')}`);g.api.choose({version:s.version,command:o.command,index:o.index});s=await g.api.advance();};
  await act(o=>o.command==='trigger');
  await act(o=>o.command==='continue' && /HQ/.test(o.label));
  await act(o=>o.command==='install' && o.card?.number===30072 && o.server==='R&D');
  await act(o=>o.command==='n');
  assert.equal(s.corp.servers.find(x=>x.name==='R&D').ice.at(-1).title,'Palisade');
  for(let i=0;!choices(s).some(o=>o.command==='jack') && i<30;i++)await act(o=>o.command==='n'||o.command==='trigger');
  await act(o=>o.command==='jack');
  for(let i=0;!choices(s).some(o=>o.command==='run') && i<30;i++)await act(o=>o.command==='n');
  assert.equal(s.run,null,'The first run has ended');
  await act(o=>o.command==='run' && o.server==='R&D');
  for(let i=0;!(s.side==='corp' && s.phase.identifier==='Run 2.1') && i<30;i++)await act(o=>o.command==='n');
  assert.equal(s.run.card.title,'Palisade');assert.equal(s.run.rezStatus.cost,3);assert(s.corp.credits>=3);
  const rez=choices(s).find(o=>o.command==='rez' && o.card?.number===30072);
  assert(rez,'The second run must offer the newly installed Palisade for rez');assert.equal(rez.secondary,false);
  assert.equal(assistedChoice(s),null,'Assistance cannot pass the defensive rez');
  assert.equal(assistedChoice({...s,assistance:{kind:'optional-window',command:'n',index:0}}),null,'Frontend also rejects a stale pass hint');
  assert(iceRezWarning(s)?.rez,'Declining this opportunity requires an explicit warning');
  const credits=s.corp.credits;await act(o=>o.command==='rez'&&o.card?.number===30072);
  assert.equal(s.corp.credits,credits-3);assert(s.corp.servers.find(x=>x.name==='R&D').ice.at(-1).rezzed);
  console.log('PASS two native runs: install Palisade via Ansel, jack out, run R&D again, stop for primary 3-credit rez; assistance cannot skip it.');
 }finally{g.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
