'use strict';
const assert=require('node:assert/strict');
const {makeGame,choices}=require('./engine-smoke.cjs');
const replay=require('./fixtures/palisade-ansel-install.json');
(async()=>{
 const {corpIceRezHint}=await import('../app/encounter.mjs');
 const g=makeGame();
 try{
  g.api.boot(replay.config);let s=await g.api.advance(),installedHistory,installState;
  for(const c of replay.choices){
   if(c.version===545){
    installState=s;
    const option=choices(s).find(o=>o.command===c.command&&o.index===c.index);
    assert.equal(option.card.title,'Palisade');assert.equal(option.server,'R&D');assert.equal(option.label,'Palisade → R&D');assert.equal(s.phase.source,'Ansel 1.0');
    assert.match(option.detail,/will not be approached during this run/);
    assert(!choices(s).filter(o=>o.command==='install'&&o.card?.number===30072&&o.server!=='R&D').some(o=>o.detail?.includes('will not be approached')),'Do not show current-server warning for another server');
   }
   g.api.choose(c);s=await g.api.advance();
   if(c.version===546){
    const server=s.corp.servers.find(x=>x.name==='R&D'),palisade=server.ice.at(-1);
    assert.equal(palisade.id,'c25');assert.equal(palisade.title,'Palisade');assert.equal(palisade.rezzed,false);
    assert(server.ice.indexOf(palisade)>s.run.ice,'Palisade is installed outside the Runner');
    assert.match(corpIceRezHint(palisade,s),/installed outside.*will not be approached/);
    installedHistory=s.historyCount;
   }
  }
  assert(installState);assert.equal(s.version,606);assert.equal(s.run,null);assert.equal(s.playerTurn,'corp');
  const after=s.history.slice(-(s.historyCount-installedHistory));
  assert(after.some(e=>e.text==='Run ends'));
  assert(!after.some(e=>/Run initiated/.test(e.text)),'The export contains no new run after this installation');
  assert(!after.some(e=>/Encountering Palisade/.test(e.text)));
  assert.equal(s.corp.servers.find(x=>x.name==='R&D').ice.at(-1).rezzed,false);
  console.log('PASS exact Palisade replay: install via Ansel on the already-active second R&D run, outermost behind Runner; run ends and export stops at Corp turn before any subsequent run.');
 }finally{g.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
