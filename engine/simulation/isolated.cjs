'use strict';
const {Worker}=require('node:worker_threads'),path=require('node:path');
// Replay uses the same parent-enforced wall limit as benchmarks, including
// while a synchronous native policy search is running.
async function runIsolated(job){
 const worker=new Worker(path.join(__dirname,'worker.cjs'));
 try{return await new Promise(resolve=>{
  let trace=[],lastState=null,settled=false;
  const done=value=>{if(settled)return;settled=true;clearTimeout(timer);resolve(value);};
  const timer=setTimeout(()=>done({jobId:job.id,seed:job.seed,status:'timeout',trace,lastState,error:'Parent wall-time limit exceeded.'}),job.limits.wallMs);
  worker.on('message',result=>{if(result.checkpoint){trace.push(...result.checkpoint.trace);lastState=result.checkpoint.state;}else done(result);});
  worker.once('error',e=>done({jobId:job.id,seed:job.seed,status:'error',error:e.stack,trace,lastState}));
  worker.once('exit',code=>done({jobId:job.id,seed:job.seed,status:'error',error:'Worker exited '+code,trace,lastState}));
  worker.postMessage(job);
 });}finally{await worker.terminate();}
}
module.exports={runIsolated};
