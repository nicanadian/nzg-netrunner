'use strict';
const assert=require('node:assert/strict');
const {makeGame,choices}=require('./engine-smoke.cjs');
const replay=require('./fixtures/nico-rez-shortage.json');
(async()=>{
 const {corpAssetRezHint}=await import('../app/encounter.mjs');
 async function restore(list){const g=makeGame();g.api.boot(replay.config);let s=await g.api.advance();for(const c of list){g.api.choose(c);s=await g.api.advance();}return {g,s};}
 const find=s=>s.corp.servers.flatMap(server=>server.root).find(c=>c.id==='c11');
 const exact=await restore(replay.choices);
 try{
  const nico=find(exact.s);assert.equal(exact.s.corp.credits,0);assert.equal(nico.title,'Nico Campaign');
  assert.deepEqual(JSON.parse(JSON.stringify(nico.rezStatus)),{cost:2,available:0,offered:false,window:true});
  assert.match(corpAssetRezHint(nico,exact.s),/2 credits required; 0 eligible credits available/);
  assert(!choices(exact.s).some(o=>o.command==='rez'&&o.card?.id===nico.id));
  assert.equal(corpAssetRezHint(nico,{...exact.s,side:'runner'}),'');
  assert.equal(corpAssetRezHint({...nico,hidden:true},exact.s),'');
 }finally{exact.g.close();}
 // Alternate branch before the final gain/advance: take two credits, then rez.
 const branch=await restore(replay.choices.slice(0,-2));
 try{
  let {g,s}=branch;
  for(let i=0;i<2;i++){const gain=choices(s).find(o=>o.command==='gain');g.api.choose({version:s.version,command:gain.command,index:gain.index});s=await g.api.advance();}
  const nico=find(s),rez=choices(s).find(o=>o.command==='rez'&&o.card?.id===nico.id);
  assert.equal(nico.rezStatus.available,2);assert.equal(nico.rezStatus.offered,true);assert.equal(corpAssetRezHint(nico,s),'');assert.equal(rez.cost.credits,2);
  const clicks=s.corp.clicks;g.api.choose({version:s.version,command:rez.command,index:rez.index});s=await g.api.advance();
  assert.equal(find(s).rezzed,true);assert.equal(s.corp.credits,0);assert.equal(s.corp.clicks,clicks);assert.equal(find(s).counters.credits,9);
 }finally{branch.g.close();}
 console.log('PASS Nico replay: 0 credits explains missing rez; two real credit actions unlock the native 2-credit rez and load 9 hosted credits.');
})().catch(e=>{console.error(e);process.exitCode=1});
