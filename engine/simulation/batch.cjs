'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os');
const {Worker}=require('node:worker_threads');
const documents=require('../deck-document.js');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
function fingerprint(root=path.resolve(__dirname,'../..')){
 const files=[];
 for(const dir of ['engine','vendor/chiriboga','vendor/chiriboga-elevation']){
  function visit(p){for(const e of fs.readdirSync(path.join(root,p),{withFileTypes:true})){const n=path.join(p,e.name);if(e.isDirectory())visit(n);else if(/\.(js|cjs)$/.test(n))files.push(n);}}visit(dir);
 }
 const h=crypto.createHash('sha256');for(const file of files.sort())h.update(file+'\0').update(fs.readFileSync(path.join(root,file)));return h.digest('hex');
}
function freezeRuntime(out,expected){
 const target=path.join(out,'runtime');
 if(!fs.existsSync(target)){
  const temp=target+'.tmp-'+crypto.randomUUID();fs.mkdirSync(temp,{recursive:true});
  const root=path.resolve(__dirname,'../..');
  for(const dir of ['engine','vendor/chiriboga','vendor/chiriboga-elevation'])fs.cpSync(path.join(root,dir),path.join(temp,dir),{recursive:true,filter:p=>fs.statSync(p).isDirectory()||/\.(js|cjs)$/.test(p)||/LICENSE|ORIGIN/.test(path.basename(p))});
  if(fingerprint(temp)!==expected)throw Error('Engine changed while creating its experiment snapshot; retry with stable source.');
  fs.mkdirSync(path.join(temp,'scripts'),{recursive:true});
  fs.copyFileSync(path.resolve(__dirname,'../../scripts/netrunner.cjs'),path.join(temp,'scripts/netrunner.cjs'));
  for(const name of ['LICENSE','NOTICE.md'])fs.copyFileSync(path.resolve(__dirname,'../..',name),path.join(temp,name));
  fs.renameSync(temp,target);
 }
 if(fingerprint(target)!==expected)throw Error('Experiment runtime snapshot is corrupt or belongs to another engine.');
 return target;
}
function lockDirectory(out){
 const file=path.join(out,'.batch-lock'),owner={pid:process.pid,token:crypto.randomUUID()};
 function acquire(){try{const fd=fs.openSync(file,'wx');fs.writeFileSync(fd,JSON.stringify(owner));fs.closeSync(fd);}catch(error){
  if(error.code!=='EEXIST')throw error;
  let previous;try{previous=JSON.parse(fs.readFileSync(file,'utf8'));}catch{throw Error('Unrecognized experiment lock file: '+file);}
  if(!Number.isInteger(previous.pid)||previous.pid<1)throw Error('Invalid experiment lock owner.');
  try{process.kill(previous.pid,0);}catch(probe){if(probe.code==='ESRCH'){fs.unlinkSync(file);return acquire();}throw probe;}
  throw Error('Another batch process is using this experiment directory.');
 }}
 acquire();return ()=>{if(fs.existsSync(file)&&JSON.parse(fs.readFileSync(file,'utf8')).token===owner.token)fs.unlinkSync(file);};
}
function atomic(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n');fs.renameSync(tmp,file);}
function summarize(results){
 const complete=results.filter(r=>r.status==='completed'),wins={corp:0,runner:0};for(const r of complete)wins[r.terminal.winner]++;
 const n=complete.length,p=n?wins.runner/n:0,z=1.96,den=1+z*z/(n||1),center=(p+z*z/(2*(n||1)))/den,half=z*Math.sqrt(p*(1-p)/(n||1)+z*z/(4*(n||1)**2))/den;
 const times=results.map(r=>r.elapsedMs||0).sort((a,b)=>a-b);
 return {jobs:results.length,statuses:results.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{}),wins,runnerWinRate:n?p:null,runnerWilson95:n?[Math.max(0,center-half),Math.min(1,center+half)]:null,p50Ms:times[Math.floor(times.length*.5)]||0,p95Ms:times[Math.min(times.length-1,Math.floor(times.length*.95))]||0,policyNotice:'Legacy native policies; hidden-information behavior and Elevation AI coverage are not certified. Results describe these policies.'};
}
async function runBatch({runner,corp,games=1,workers=1,seed='1',out,wallMs=60000,decisions=100000,mode='fast',traceEvery=100,onProgress=()=>{}}){
 for(const [side,deck]of Object.entries({runner,corp})){const v=documents.validate(deck);if(!v.valid||deck.side!==side)throw Error(`${side}: ${[...v.errors,...v.support].map(e=>e.message).join('; ')||'wrong side'}`);}
 if(runner.pool!==corp.pool)throw Error('Deck pools must match.');
 if(!Number.isInteger(games)||games<1||games>1000000)throw Error('Games must be an integer from 1 to 1000000.');
 if(!Number.isInteger(workers)||workers<1||workers>64)throw Error('Workers must be an integer from 1 to 64.');
 for(const [label,n]of Object.entries({wallMs,decisions,traceEvery}))if(!Number.isSafeInteger(n)||n<1)throw Error(`${label} must be a positive integer.`);
 if(!['fast','reference'].includes(mode))throw Error('Mode must be fast or reference.');
 const spec={schemaVersion:1,rulesVersion:runner.pool==='core-v1'?'26.03-core-2':'26.03-local-2',engineHash:fingerprint(),policy:'chiriboga-native-unaudited-v1',runner:documents.normalize(runner),corp:documents.normalize(corp),runnerHash:await documents.revision(runner),corpHash:await documents.revision(corp),games,seed:String(seed),limits:{wallMs,decisions},mode,traceEvery};
 const experimentHash=hash(spec);out=path.resolve(out);
 const sourceRoot=path.resolve(__dirname,'../..');
 if(out===sourceRoot||['engine','vendor'].some(dir=>out===path.join(sourceRoot,dir)||out.startsWith(path.join(sourceRoot,dir)+path.sep)))throw Error('Results must not overwrite engine source directories.');
 fs.mkdirSync(out,{recursive:true});
 const unlock=lockDirectory(out);try{
 const manifestFile=path.join(out,'manifest.json');
 if(fs.existsSync(manifestFile)){if(JSON.parse(fs.readFileSync(manifestFile)).experimentHash!==experimentHash)throw Error('Output directory belongs to a different experiment or engine revision. Use a new directory.');}
 else atomic(manifestFile,{...spec,experimentHash,createdAt:new Date().toISOString(),machine:{platform:process.platform,arch:process.arch,node:process.version,cpu:os.cpus()[0]?.model},workers});
 const runtimeRoot=freezeRuntime(out,spec.engineHash);
 const results=[],queue=[];let finished=0;
 for(let i=0;i<games;i++){
  const id=hash(experimentHash+':'+i).slice(0,24),file=path.join(out,'jobs',id+'.json');
  const job={id,index:i,seed:`${seed}:${i}`,runner:spec.runner,corp:spec.corp,limits:spec.limits,mode,rulesVersion:spec.rulesVersion};
  if(fs.existsSync(file)){const result=JSON.parse(fs.readFileSync(file));if(result.jobId!==id||result.seed!==job.seed)throw Error('Corrupt resumed job '+id);results.push(result);finished++;}else queue.push(job);
 }
 await Promise.all(Array.from({length:Math.min(workers,queue.length)},async()=>{
  let worker;
  const spawn=()=>new Worker(path.join(runtimeRoot,'engine/simulation/worker.cjs'));
  try{while(queue.length){
   const job=queue.shift();worker ||= spawn();
   const result=await new Promise(resolve=>{
    let settled=false,partialTrace=[],lastState=null;
    const done=value=>{if(settled)return;settled=true;clearTimeout(timer);worker.removeListener('message',message);worker.removeListener('error',error);worker.removeListener('exit',exit);resolve(value);};
    const failure=(status,message)=>done({schemaVersion:1,jobId:job.id,seed:job.seed,status,error:message,elapsedMs:wallMs,trace:partialTrace,lastState});
    const message=r=>{if(r.checkpoint){partialTrace.push(...r.checkpoint.trace);lastState=r.checkpoint.state;}else done(r);},error=e=>failure('error',e.stack),exit=code=>failure('error',`Worker exited ${code}`);
    const timer=setTimeout(()=>{failure('timeout','Parent wall-time limit exceeded; reproduce using the saved manifest and seed.');worker.terminate();worker=null;},wallMs);
    worker.on('message',message);worker.once('error',error);worker.once('exit',exit);worker.postMessage(job);
   });
   result.index=job.index;result.engineHash=spec.engineHash;result.deckHashes={runner:spec.runnerHash,corp:spec.corpHash};
   // Every job has exact seed/decks in its manifest. Retain all failed traces and a deterministic sample of successes.
   if(result.status==='completed'&&job.index%traceEvery!==0)delete result.trace;
   atomic(path.join(out,'jobs',job.id+'.json'),result);results.push(result);finished++;onProgress({finished,games,result});
   if(result.status==='error'&&worker){await worker.terminate();worker=null;}
  }}finally{if(worker)await worker.terminate();}
 }));
 results.sort((a,b)=>a.index-b.index);
 const summary={...summarize(results),experimentHash};atomic(path.join(out,'summary.json'),summary);
 fs.writeFileSync(path.join(out,'results.jsonl'),results.map(r=>JSON.stringify(r)).join('\n')+'\n');
 fs.writeFileSync(path.join(out,'results.csv'),'jobId,seed,status,winner,corpPoints,runnerPoints,turn,decisions,elapsedMs\n'+results.map(r=>[r.jobId,r.seed,r.status,r.terminal?.winner||'',r.points?.corp??'',r.points?.runner??'',r.turn??'',r.decisions??'',r.elapsedMs??''].map(value=>/[\",\r\n]/.test(String(value))?'\"'+String(value).replaceAll('\"','\"\"')+'\"':String(value)).join(',')).join('\n')+'\n');
 return summary;
 }finally{unlock();}
}
module.exports={runBatch,fingerprint,summarize,freezeRuntime,lockDirectory,atomic};
