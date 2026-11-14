'use strict';
const assert=require('node:assert/strict');
const {makeGame}=require('./engine-smoke.cjs');
const replay=require('./fixtures/palisade-ansel-install.json');
(async()=>{
 const {replayExport}=await import('../app/replay-export.mjs');
 const g=makeGame();
 try{
  g.api.boot(replay.config);let state=await g.api.advance();for(const choice of replay.choices){g.api.choose(choice);state=await g.api.advance();}
  const exported=replayExport(replay,{state});
  assert.deepEqual(exported.choices,replay.choices);assert.deepEqual(exported.config,replay.config);
  assert.deepEqual(JSON.parse(JSON.stringify(exported.liveCheckpoint.state.history)),JSON.parse(JSON.stringify(state.history)));
  assert.equal(exported.liveCheckpoint.state.version,606);
  assert.equal(exported.liveCheckpoint.displayMode,'live-decision');
  assert.equal(replayExport(replay,{state,busy:true,playback:true}).liveCheckpoint.displayMode,'opponent-playback');
  assert.equal(replayExport(replay,{state,busy:true,pending:true}).liveCheckpoint.pendingChoice,true);
  const hidden=exported.liveCheckpoint.state.runner.hand.filter(c=>c.hidden);
  assert(hidden.length>0);assert(hidden.every(c=>!('title' in c)&&!('number' in c)&&!('rezStatus' in c)),'Capture retains the DTO hidden-card boundary');
  exported.liveCheckpoint.state.history.length=0;
  assert(state.history.length>0,'Export does not mutate the live game');
  console.log('PASS replay export retains actual visible checkpoint/log and playback mode, preserves original replay inputs, and does not add hidden card data.');
 }finally{g.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
