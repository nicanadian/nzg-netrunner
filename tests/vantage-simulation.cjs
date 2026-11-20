'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {play}=require('../engine/simulation/match.cjs'),{runBatch}=require('../engine/simulation/batch.cjs');
const {decks,profile}=require('../engine/vantage.cjs');
const {runMatrix}=require('../engine/simulation/matrix.cjs');
const plain=value=>JSON.parse(JSON.stringify(value));
(async()=>{
 const runner=decks.find(d=>d.document.side==='runner').document,corp=decks.find(d=>d.document.side==='corp').document;
 const job={id:'vantage-parity',seed:'vantage-foundation:0',runner,corp,limits:{decisions:10000,wallMs:30000}};
 const fast=await play(job),reference=await play({...job,mode:'reference'});
 assert.equal(fast.status,'completed',fast.error);assert.equal(reference.status,'completed',reference.error);
  for(const field of ['trace','terminal','points','turn','decisions'])assert.deepEqual(plain(fast[field]),plain(reference[field]),field+' must match between snapshot and summary modes');
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'netrunner-vantage-'));
 try{
  const summary=await runBatch({runner,corp,games:1,workers:1,seed:'vantage-foundation',wallMs:30000,decisions:10000,out});
  assert.equal(summary.statuses.completed,1,JSON.stringify(summary));
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json')));assert.equal(manifest.rulesVersion,profile.rulesVersion);
  const result=JSON.parse(fs.readFileSync(path.join(out,'jobs',fs.readdirSync(path.join(out,'jobs'))[0])));
  const frozen=require(path.join(out,'runtime/engine/simulation/match.cjs'));
  const replay=await frozen.play({...job,id:result.jobId,seed:result.seed});
  for(const field of ['trace','terminal','points','turn','decisions'])assert.deepEqual(plain(replay[field]),result[field],field+' must restore from the frozen experiment runtime');
  const bad={...runner,cards:[...runner.cards,{id:'99999',count:1}]};
  await assert.rejects(runBatch({runner:bad,corp,games:1,out:path.join(out,'unsupported')}),/Unknown card|unknown card|unsupported/i);
  const matrix=await runMatrix({schemaVersion:1,runners:[{deck:runner}],corps:[{deck:corp}],gamesPerMatchup:1,workers:1,seed:'vantage-foundation',wallMs:30000,decisions:10000},{out:path.join(out,'matrix')});
  assert.equal(matrix.matchups.length,1);assert.equal(matrix.matchups[0].statuses.completed,1);
 }finally{fs.rmSync(out,{recursive:true,force:true});}
 console.log('PASS Vantage experimental native-policy completion, full trace parity, worker batch/profile selection, frozen-runtime replay, and unsupported-deck rejection. AI competence remains unaudited.');
})().catch(error=>{console.error(error);process.exitCode=1;});
