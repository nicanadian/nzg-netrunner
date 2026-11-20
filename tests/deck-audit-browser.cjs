'use strict';
// Actual shared-browser games, captured through rendered controls. This test
// reconstructs their decisions in the offline engine; it launches no browser.
const assert=require('node:assert/strict');
const {createGame}=require('../engine/runtime.cjs');
(async()=>{
 for(const name of ['weyland-game','editorial-game','core-game']){
  const saved=require('../docs/research/deck-audit-2026-11-16/browser/'+name+'.json');
  const {config,choices}=saved.session;
  const g=createGame({core:config.cardPool==='core-v1',vantage:config.cardPool==='vantage-preview-v1'});
  try{
   g.api.boot(config);let state=await g.api.advance();
   for(const choice of choices){assert.equal(state.version,choice.version,name+' decision '+choice.version);g.api.choose(choice);state=await g.api.advance();}
   assert.deepEqual(JSON.parse(JSON.stringify(state.terminal)),saved.final.terminal);
   assert.equal(state.version,saved.final.version);assert.equal(state.corp.points,saved.final.points.corp);assert.equal(state.runner.points,saved.final.points.runner);
   assert.equal(state.diagnostics.length,0);assert.deepEqual(g.errors,[]);
   console.log('PASS deck audit browser replay: '+name+', '+choices.length+' native decisions.');
  }finally{g.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
