'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {play}=require('../engine/simulation/match.cjs'),{runBatch}=require('../engine/simulation/batch.cjs');
const docs=require('../engine/deck-document.js'),gateway=require('../engine/deck-catalog.js'),core=require('../engine/core-decks.js');
const deck=d=>docs.normalize({...d,pool:d.pool||'gateway-v1'});
(async()=>{
 for(const pair of [[gateway.catalog[0],gateway.catalog[3]],core.catalog]){
  const job={id:'parity',seed:'benchmark-1:0',runner:deck(pair[0]),corp:deck(pair[1]),limits:{decisions:10000,wallMs:30000}};
  const fast=await play(job),reference=await play({...job,mode:'reference'});
  assert.equal(fast.status,'completed',fast.error);for(const field of ['trace','terminal','points','turn','decisions'])assert.equal(JSON.stringify(fast[field]),JSON.stringify(reference[field]),field);
 }
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'netrunner-sim-'));
 try{
  const options={runner:deck(gateway.catalog[0]),corp:deck(gateway.catalog[3]),out,games:2,workers:2,seed:'pool-test',wallMs:30000};
  const first=await runBatch(options);assert.equal(first.statuses.completed,2);
  const files=fs.readdirSync(path.join(out,'jobs')),before=files.map(f=>fs.statSync(path.join(out,'jobs',f)).mtimeMs);
  assert.deepEqual(await runBatch({...options,workers:1}),first);assert.deepEqual(files.map(f=>fs.statSync(path.join(out,'jobs',f)).mtimeMs),before);
  await assert.rejects(runBatch({...options,seed:'changed'}),/different experiment/);
  const limited=await runBatch({...options,out:path.join(out,'limited'),games:1,decisions:1});assert.equal(limited.statuses['decision-limit'],1);assert.equal(limited.wins.corp+limited.wins.runner,0);
  const timeout=await runBatch({...options,out:path.join(out,'timeout'),games:1,wallMs:1});assert.equal(timeout.statuses.timeout,1);
 }finally{fs.rmSync(out,{recursive:true,force:true});}
 console.log('PASS offline simulation: Gateway/Core full-vs-summary decision parity, worker pool, resume, manifest guard, decision/time limits, failures excluded from win totals.');
})().catch(e=>{console.error(e);process.exitCode=1});
