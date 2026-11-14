'use strict';
// Controlled ablation. The pre-change runtime is captured with freezeRuntime
// before editing; each timed game gets a fresh worker and the same exact decks.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os');
const {fingerprint,freezeRuntime}=require('../engine/simulation/batch.cjs');
const docs=require('../engine/deck-document.js'),gateway=require('../engine/deck-catalog.js'),net=require('../engine/net-decks.js');
const baseline=path.resolve(process.argv[2]||'tmp/search-optimization-review/baseline/runtime');
const out=path.resolve(process.argv[3]||'tmp/search-optimization-review/ablation');
const rounds=Number(process.argv[4]||2);
if(!Number.isSafeInteger(rounds)||rounds<1||rounds>10)throw Error('Use 1–10 rounds.');
const baselineHash=require(path.join(baseline,'engine/simulation/batch.cjs')).fingerprint(baseline),currentHash=fingerprint();
if(fs.existsSync(path.join(out,'report.json')))throw Error('A report already exists here; choose a new output directory.');
fs.mkdirSync(out,{recursive:true});
const currentRuntime=freezeRuntime(out,currentHash);
const normalize=d=>docs.normalize({...d,pool:d.pool||'gateway-v1'}),official=id=>net.catalog.find(d=>d.identity===id).document;
const cases=[
 ...[0,1,2].map(i=>({label:'Gateway '+i,seed:'benchmark-1:'+i,runner:normalize(gateway.catalog[0]),corp:normalize(gateway.catalog[3])})),
 ...[{label:'Core Phoenix',runner:35001,corp:30035},{label:'Core Topan',runner:35002,corp:30035},{label:'Core Synapse',runner:35001,corp:35058}].map(c=>({label:c.label,seed:'identity-qualification:0',runner:official(c.runner),corp:official(c.corp)})),
];
const variants=[{label:'baseline',root:baseline,searchOptimizations:false},{label:'cache-only',root:currentRuntime,searchOptimizations:{cache:true,continuous:false}},{label:'continuous-only',root:currentRuntime,searchOptimizations:{cache:false,continuous:true}},{label:'combined',root:currentRuntime,searchOptimizations:{cache:true,continuous:true}}];
const traceHash=trace=>crypto.createHash('sha256').update(JSON.stringify(trace)).digest('hex');
const report={schemaVersion:1,createdAt:new Date().toISOString(),baselineHash,currentHash,rounds,workers:1,machine:{cpu:os.cpus()[0].model,logicalCPUs:os.cpus().length,node:process.version,platform:process.platform},notice:'Sequential cold-worker games; rotated mode order, same complete decisions required. This is a small fixed corpus, not a 1,000-game throughput claim.',cases,results:[]};
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
(async()=>{
 const expected=new Map();
 for(let round=0;round<rounds;round++)for(let i=0;i<cases.length;i++){
  const item=cases[i],offset=(round+i)%variants.length,order=variants.slice(offset).concat(variants.slice(0,offset));
  for(const variant of order){
   const run=require(path.join(variant.root,'engine/simulation/isolated.cjs')).runIsolated;
   const result=await run({id:item.label,seed:item.seed,runner:item.runner,corp:item.corp,mode:'fast',searchOptimizations:variant.searchOptimizations,limits:{wallMs:120000,decisions:100000}});
   if(result.status!=='completed')throw Error(item.label+' '+variant.label+': '+result.status+' '+result.error);
   const signature={status:result.status,terminal:result.terminal,turn:result.turn,decisions:result.decisions,points:result.points,traceHash:traceHash(result.trace)};
   const prior=expected.get(item.label);if(prior&&JSON.stringify(signature)!==JSON.stringify(prior))throw Error('Decision/result parity failed: '+item.label+' '+variant.label);expected.set(item.label,signature);
   report.results.push({round,case:item.label,variant:variant.label,elapsedMs:result.elapsedMs,...signature,searchStats:result.searchStats});save();
   console.log(`round ${round+1} ${item.label} ${variant.label}: ${result.elapsedMs} ms; ${result.decisions} choices match`);
  }
 }
 report.totals=Object.fromEntries(variants.map(v=>{const rows=report.results.filter(r=>r.variant===v.label);return [v.label,{games:rows.length,totalMatchMs:rows.reduce((n,r)=>n+r.elapsedMs,0)}];}));
 report.completedAt=new Date().toISOString();save();console.log(JSON.stringify(report.totals,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
