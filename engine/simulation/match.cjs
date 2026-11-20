'use strict';
const {createGame}=require('../runtime.cjs');
const {performance}=require('node:perf_hooks');
const {validateState}=require('../state-check.cjs');
const {forPool}=require('../deck-profiles.cjs');
async function play(job,onCheckpoint=null){
 const start=performance.now(),trace=[],profile=forPool(job.runner.pool);
 const game=createGame({...profile.runtime,searchOptimizations:job.searchOptimizations});let state,status='decision-limit',error;
 try{
  if(job.runner.pool!==job.corp.pool)throw Error('Deck pools must match.');
  game.api.boot({side:'runner',faceoff:true,aiPolicy:job.aiPolicy,simulationFast:job.mode!=='reference',seed:job.seed,rulesVersion:job.rulesVersion||profile.rulesVersion,...(job.runner.pool!=='gateway-v1'?{cardPool:job.runner.pool}:{}),deckDocuments:{runner:job.runner,corp:job.corp}});
  while(game.api.metrics().steps<job.limits.decisions){
   const remaining=job.limits.decisions-game.api.metrics().steps;
   state=await game.api.advance(Math.min(300,remaining),null,job.mode!=='reference',choice=>{trace.push(choice);if(onCheckpoint&&trace.length%100===0)onCheckpoint({trace:trace.slice(-100),state:game.api.summary()});});
   validateState(game);
   if(state.terminal){status='completed';break;}
   if(performance.now()-start>job.limits.wallMs){status='timeout';break;}
   if(!game.api.needsAdvance())throw Error('Native policy stopped at an unhandled human decision.');
  }
  const diagnostics=game.api.metrics().diagnostics;
  if(diagnostics.length||game.errors.length){status='error';error=[...diagnostics,...game.errors].join('\n');}
 }catch(e){status='error';error=e.stack||String(e);}
 finally{state=game.api.summary();game.close();}
 return {schemaVersion:1,jobId:job.id,seed:job.seed,status,...(error?{error}:{}),terminal:state.terminal,turn:state.turn,decisions:state.steps,points:{corp:state.corp.points,runner:state.runner.points},elapsedMs:Math.round(performance.now()-start),memoryBytes:process.memoryUsage().rss,workerHeapUsedBytes:process.memoryUsage().heapUsed,aiAudit:game.api.aiAudit(),searchStats:game.context.NRSimulationSearch.stats(),trace};
}
module.exports={play};
