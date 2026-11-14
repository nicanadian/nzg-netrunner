'use strict';
const {parentPort}=require('node:worker_threads');
const {play}=require('./match.cjs');
parentPort.on('message',async job=>{
 try{parentPort.postMessage(await play(job,checkpoint=>parentPort.postMessage({checkpoint,jobId:job.id})));}catch(e){parentPort.postMessage({jobId:job.id,seed:job.seed,status:'error',error:e.stack,trace:[]});}
});
