'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {makeGame,checkState,checkSnapshot}=require('./engine-smoke.cjs');
const {catalog}=require('../engine/deck-catalog.js');
async function main(){
 const results=[];
 const current=process.argv.includes('--current-rules');
 for(const runner of catalog.filter(d=>d.side==='runner'))for(const corp of catalog.filter(d=>d.side==='corp')){
  const g=makeGame(),start=Date.now(),seed=`gateway-matchup-${runner.id}-${corp.id}`;
  try{
   g.api.boot({side:'runner',faceoff:true,seed,deckIds:{runner:runner.id,corp:corp.id},...(current?{rulesVersion:'26.03-local-2'}:{})});
   let s;
   for(let batch=0;batch<100;batch++){
    s=await g.api.advance();checkState(g);checkSnapshot(g,s);
    if(s.terminal)break;
    assert.ok(Date.now()-start<180000,'Match exceeded three minutes');
   }
   assert.ok(s.terminal,`${runner.id} / ${corp.id} did not finish`);assert.equal(g.errors.length,0,g.errors.join('\n'));
   const result={runner:runner.id,corp:corp.id,seed,winner:s.terminal.winner,reason:s.terminal.reason,turn:s.turn,steps:s.steps,ms:Date.now()-start};
   results.push(result);console.log('PASS',JSON.stringify(result));
  }finally{g.close();}
 }
 fs.writeFileSync(current?'eval/recorded-games/current-rule-matchups.json':'eval/character-matchups.json',JSON.stringify({kind:'Automated native-AI smoke matches; not a balance benchmark',rulesVersion:current?'26.03-local-2':'legacy',results},null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
