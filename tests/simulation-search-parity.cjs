'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {runIsolated}=require('../engine/simulation/isolated.cjs');
const corpus=require('./fixtures/search-optimization-corpus.json');
(async()=>{
 const queue=corpus.cases.slice();let decisions=0;
 await Promise.all(Array.from({length:2},async()=>{while(queue.length){
  const item=queue.shift(),result=await runIsolated({id:item.label,runner:item.runner,corp:item.corp,seed:item.seed,mode:'fast',limits:{wallMs:60000,decisions:100000}});
  for(const key of ['status','terminal','points','turn','decisions'])assert.deepEqual(result[key],item.expected[key],item.label+' '+key+': '+(result.error||''));
  const hash=crypto.createHash('sha256').update(JSON.stringify(result.trace)).digest('hex');
  assert.equal(hash,item.expected.traceHash,item.label+' complete native choices');
  assert.equal(result.searchStats.cacheEnabled,true);assert.equal(result.searchStats.continuousEnabled,true);
  decisions+=result.trace.length;
 }}));
 console.log(`PASS optimized search: ${corpus.cases.length} complete games, ${decisions} decisions match frozen pre-optimization traces, outcomes and turns.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
