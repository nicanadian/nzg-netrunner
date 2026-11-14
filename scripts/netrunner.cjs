#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const docs=require('../engine/deck-document.js'),gateway=require('../engine/deck-catalog.js'),core=require('../engine/core-decks.js'),net=require('../engine/net-decks.js');
const {runBatch}=require('../engine/simulation/batch.cjs');
const {runIsolated}=require('../engine/simulation/isolated.cjs');
function loadDeck(value,pool){const d=[...gateway.catalog,...core.catalog,...net.catalog].find(d=>d.id===value);if(d)return docs.normalize(d.document?{...d.document,pool:pool||d.document.pool}:{...d,pool:pool||d.pool||'gateway-v1'});return docs.normalize({...JSON.parse(fs.readFileSync(value,'utf8')),...(pool?{pool}:{})});}
async function main(){
 const [command,...args]=process.argv.slice(2),opts={};let file;
 const allowed=new Set(['runner','corp','games','workers','seed','out','wall-ms','decisions','trace-every','mode','pool']);
 for(let i=0;i<args.length;i++){if(args[i].startsWith('--')){const key=args[i].slice(2);if(!allowed.has(key))throw Error('Unknown option --'+key);if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Missing value for --'+key);opts[key]=args[++i];}else if(file)throw Error('Unexpected argument '+args[i]);else file=args[i];}
 if(command==='validate'){const result=docs.validate(loadDeck(file));console.log(JSON.stringify({...result,revision:result.deck?await docs.revision(result.deck):null},null,2));if(!result.valid)process.exitCode=1;return;}
 if(command==='bench'&&file){
  const raw=JSON.parse(fs.readFileSync(file,'utf8')),base=path.dirname(path.resolve(file));
  if(raw.schemaVersion!==1)throw Error('Matrix schemaVersion must be 1.');
  const resolve=entry=>{const value=typeof entry==='string'?entry:entry.deck;const deck=typeof value==='object'?docs.normalize({...value,...(opts.pool?{pool:opts.pool}:{})}):loadDeck([...gateway.catalog,...core.catalog,...net.catalog].some(d=>d.id===value)?value:path.resolve(base,value),opts.pool);return {label:typeof entry==='object'?entry.label:undefined,deck};};
  const {runMatrix}=require('../engine/simulation/matrix.cjs');
  const result=await runMatrix({...raw,runners:raw.runners?.map(resolve),corps:raw.corps?.map(resolve),gamesPerMatchup:Number(opts.games||raw.gamesPerMatchup||100),workers:Number(opts.workers||raw.workers||1),seed:opts.seed||raw.seed,wallMs:Number(opts['wall-ms']||raw.wallMs||60000),decisions:Number(opts.decisions||raw.decisions||100000),traceEvery:Number(opts['trace-every']||raw.traceEvery||100),mode:opts.mode||raw.mode||'fast'},{out:opts.out||'tmp/matrix',onProgress:p=>process.stderr.write(`${p.runner} / ${p.corp}: ${p.finished}/${p.games} ${p.result.status}\n`)});
  console.log(JSON.stringify(result,null,2));if(result.matchups.some(m=>Object.keys(m.statuses).some(s=>s!=='completed')))process.exitCode=1;return;
 }
 if(command==='simulate'||command==='bench'){
  const runner=loadDeck(opts.runner||'loup-v1',opts.pool),corp=loadDeck(opts.corp||'precision-design-v2',opts.pool);
  const result=await runBatch({runner,corp,games:Number(opts.games||(command==='simulate'?1:100)),workers:Number(opts.workers||1),seed:opts.seed||'benchmark-1',out:opts.out||'tmp/simulation',wallMs:Number(opts['wall-ms']||60000),decisions:Number(opts.decisions||100000),traceEvery:Number(opts['trace-every']||(command==='simulate'?1:100)),mode:opts.mode||'fast',onProgress:({finished,games,result})=>process.stderr.write(`${finished}/${games} ${result.status} ${result.seed}\n`)});
  console.log(JSON.stringify(result,null,2));if(Object.keys(result.statuses).some(s=>s!=='completed'))process.exitCode=1;return;
 }
 if(command==='replay'){
  const result=JSON.parse(fs.readFileSync(file)),out=path.resolve(path.dirname(file),'../manifest.json'),manifest=JSON.parse(fs.readFileSync(out));
  const bundle=path.resolve(path.dirname(file),'../runtime');
  const runtimeRoot=fs.existsSync(bundle)?bundle:path.resolve(__dirname,'..');
  const {fingerprint}=require(path.join(runtimeRoot,'engine/simulation/batch.cjs'));
  if(manifest.engineHash!==fingerprint(runtimeRoot))throw Error('Engine revision changed; replay requires its original runtime snapshot.');
  const runner=require(path.join(runtimeRoot,'engine/simulation/isolated.cjs')).runIsolated;
  const actual=await runner({id:result.jobId,seed:result.seed,runner:manifest.runner,corp:manifest.corp,limits:{...manifest.limits,wallMs:Number(opts['wall-ms']||manifest.limits.wallMs)},mode:manifest.mode,rulesVersion:manifest.rulesVersion});
  if(result.status==='timeout'){
   const compared=Math.min(result.trace?.length||0,actual.trace?.length||0);
   if(JSON.stringify(result.trace?.slice(0,compared))!==JSON.stringify(actual.trace?.slice(0,compared)))throw Error('Replay decision prefix mismatch.');
   console.log(JSON.stringify({originalStatus:'timeout',replayStatus:actual.status,comparedDecisions:compared,matchingDecisionPrefix:true,terminal:actual.terminal||null,elapsedMs:actual.elapsedMs||null},null,2));return;
  }
  const fields=['status','terminal','points','turn','decisions'];for(const key of fields)if(JSON.stringify(actual[key])!==JSON.stringify(result[key]))throw Error('Replay mismatch: '+key);
  if(result.status!=='timeout'&&result.trace&&JSON.stringify(result.trace)!==JSON.stringify(actual.trace))throw Error('Replay decision trace mismatch');
  console.log('PASS deterministic replay '+result.jobId);return;
 }
 console.log('Usage:\n  npm run engine -- validate <deck.json|catalog-id>\n  npm run engine -- simulate --runner <deck> --corp <deck> --out <directory>\n  npm run engine -- bench --games 1000 --workers 4 --seed experiment --out <directory>\n  npm run engine -- replay <directory>/jobs/<id>.json\nCore decks: phoenix-core-v1 / precision-design-core-v1. No network, browser, or server required.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
