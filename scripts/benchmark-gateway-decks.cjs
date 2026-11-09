'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {catalog}=require('../engine/deck-catalog.js'),data=require('../assets/card-data.json');
const dir=path.resolve('eval/deck-benchmark');fs.mkdirSync(dir,{recursive:true});
const references=require('../eval/deck-benchmark/references.json').decks;
const choose=(n,k)=>{if(k<0||k>n)return 0;let r=1;for(let i=1;i<=k;i++)r=r*(n-i+1)/i;return r;};
const economy=new Set([30002,30007,30014,30018,30020,30027,30030,30033,30037,30048,30056,30064,30071,30075]);
const draw=new Set([30002,30021,30034,30037,30041,30053,30056]);
const flat=d=>d.cards.flatMap(([n,q])=>Array(q).fill(n));
function profile(d){const cards=flat(d),N=cards.length,card=n=>data[n],count=f=>cards.filter(n=>f(card(n),n)).length,ice=count(c=>c.type_code==='ice'),econ=count((c,n)=>economy.has(n)),drawCount=count((c,n)=>draw.has(n));
 const influence=d.cards.reduce((s,[n,q])=>s+(card(n).faction_code===card(d.identity).faction_code?0:card(n).faction_cost||0)*q,0),points=d.cards.reduce((s,[n,q])=>s+(card(n).agenda_points||0)*q,0);
 assert.ok(N>=card(d.identity).minimum_deck_size);assert.ok(influence<=card(d.identity).influence_limit);assert.ok(d.cards.every(([n,q])=>q>0&&q<=Math.min(3,card(n).deck_limit||3)&&card(n).side_code===d.side));
 if(d.side==='corp')assert.ok(points>=18&&points<=19);
 const none=(K,n)=>choose(N-K,n)/choose(N,n),atMostOne=(K,n)=>(choose(N-K,n)+K*choose(N-K,n-1))/choose(N,n);
 const result={id:d.id,identity:d.identity,name:d.name,side:d.side,size:N,influence,agendaPoints:points,agendaCards:count(c=>c.type_code==='agenda'),ice,economyCards:econ,drawSelectionCards:drawCount,openingNoEconomy:none(econ,5),first10NoDrawSelection:none(drawCount,10),typeCounts:{},diffFromReference:[]};
 for(const n of cards)result.typeCounts[card(n).type_code]=(result.typeCounts[card(n).type_code]||0)+1;
 if(d.side==='corp'){
  const cheap=count(c=>c.type_code==='ice'&&c.cost<=3),stopping=count((c,n)=>[30055,30072,30074].includes(n));let good=0;
  for(let i=2;i<=5;i++)for(let e=1;e<=5-i;e++)good+=choose(ice,i)*choose(econ,e)*choose(N-ice-econ,5-i-e)/choose(N,5);
  Object.assign(result,{cheapIce:cheap,cheapStopIce:stopping,expensiveIce:count(c=>c.type_code==='ice'&&c.cost>=5),turn3AtMost1Ice:atMostOne(ice,8),turn3NoCheapIce:none(cheap,8),turn3NoCheapStopIce:none(stopping,8),openingTwoIceAndEconomy:good,openingThreePlusAgendas:1-[0,1,2].reduce((s,k)=>s+choose(result.agendaCards,k)*choose(N-result.agendaCards,5-k)/choose(N,5),0)});
 }else{
  const kinds=['Fracter','Decoder','Killer'],counts=Object.fromEntries(kinds.map(k=>[k,count(c=>(c.keywords||'').includes(k))]));let missing=0;
  for(let mask=1;mask<8;mask++){const keys=kinds.filter((_,i)=>mask&(1<<i)),union=count(c=>keys.some(k=>(c.keywords||'').includes(k)));missing+=(keys.length%2?1:-1)*none(union,10);}
  Object.assign(result,{breakers:counts,first10MissingPermanentBreakerType:missing,breakerTutorCopies:count((c,n)=>n===30011),oneShotAIBreakers:count((c,n)=>n===30032),multiaccessCopies:count((c,n)=>[30013,30024,30028].includes(n))});
 }
 return result;
}
async function worker(job){const {makeGame,checkState,checkSnapshot}=require('../tests/engine-smoke.cjs'),g=makeGame(),start=Date.now();try{
 const config={side:'runner',faceoff:true,seed:job.seed,rulesVersion:'26.03-local-2',deckIds:{runner:job.runner.localId||job.runner.id,corp:job.corp.localId||job.corp.id},decks:{runner:{identity:job.runner.identity,cards:flat(job.runner)},corp:{identity:job.corp.identity,cards:flat(job.corp)}}};g.api.boot(config);let s;
 for(let b=0;b<100;b++){s=await g.api.advance();checkState(g);checkSnapshot(g,s);if(s.terminal)break;}
 assert.ok(s.terminal,'No terminal after 30000 resolutions');assert.equal(g.errors.length,0,g.errors.join('\n'));
 return {id:job.id,seed:job.seed,runnerId:job.runner.id,corpId:job.corp.id,runnerFamily:job.runnerFamily,corpFamily:job.corpFamily,status:'completed',winner:s.terminal.winner,reason:s.terminal.reason,runnerPoints:s.runner.points,corpPoints:s.corp.points,turn:s.turn,steps:s.steps,ms:Date.now()-start};
 }catch(e){return {id:job.id,status:'error',message:e.message,ms:Date.now()-start};}finally{g.close();}}
async function main(){
 if(process.argv[2]==='--worker'){const job=JSON.parse(fs.readFileSync(process.argv[3]));fs.writeFileSync(process.argv[4],JSON.stringify(await worker(job),null,2)+'\n');return;}
 const current=JSON.parse(JSON.stringify(catalog));fs.writeFileSync(path.join(dir,'current-lists.json'),JSON.stringify(current,null,2)+'\n');
 const profiles=[...current.map(d=>({...profile(d),family:'current'})),...references.map(d=>({...profile(d),family:'reference'}))];
 for(const p of profiles.filter(p=>p.family==='current')){const a=current.find(d=>d.id===p.id),b=references.find(d=>d.identity===a.identity),am=new Map(a.cards),bm=new Map(b.cards);p.referenceId=b.id;p.diffFromReference=[...new Set([...am.keys(),...bm.keys()])].map(n=>({number:n,title:data[n].title,current:am.get(n)||0,reference:bm.get(n)||0})).filter(x=>x.current!==x.reference);}
 fs.writeFileSync(path.join(dir,'profiles.json'),JSON.stringify({rulesVersion:'26.03-local-2',metrics:'Exact hypergeometric probabilities, no mulligan/extra draw/access/card effects. Corp turn3 = initial5 + mandatory3. Runner first10 = ten cards seen, not a turn count. Economy/draw roles are explicit broad labels, conditional cards not guaranteed payouts. CheapStop includes conditional Whitespace; Tithe excluded. Permanent breaker metric excludes tutors/Mayfly and is not inability-to-run probability.',economyNumbers:[...economy],drawSelectionNumbers:[...draw],profiles},null,2)+'\n');
 const jobs=[];for(const runner of current.filter(d=>d.side==='runner'))for(const corp of current.filter(d=>d.side==='corp'))for(let seed=0;seed<2;seed++)for(const rf of ['current','reference'])for(const cf of ['current','reference'])jobs.push({id:jobs.length,seed:`gateway-benchmark-${runner.identity}-${corp.identity}-${seed}`,runnerFamily:rf,corpFamily:cf,runner:rf==='current'?runner:references.find(d=>d.identity===runner.identity),corp:cf==='current'?corp:references.find(d=>d.identity===corp.identity)});
 fs.writeFileSync(path.join(dir,'jobs.json'),JSON.stringify(jobs,null,2)+'\n');fs.mkdirSync(path.join(dir,'jobs'),{recursive:true});let cursor=0,done=0;const results=[];
 async function run(){while(cursor<jobs.length){const j=jobs[cursor++],input=path.join(dir,'jobs',j.id+'.input.json'),output=path.join(dir,'jobs',j.id+'.result.json');fs.writeFileSync(input,JSON.stringify(j));
 fs.rmSync(output,{force:true});
 await new Promise(resolve=>{const child=spawn(process.execPath,[__filename,'--worker',input,output],{stdio:'ignore'});const timer=setTimeout(()=>child.kill('SIGKILL'),60000);child.once('exit',(code,signal)=>{clearTimeout(timer);const result=fs.existsSync(output)?JSON.parse(fs.readFileSync(output)):{id:j.id,status:signal==='SIGKILL'?'timeout':'error',message:signal||String(code)};results.push(result);done++;console.log(`${done}/${jobs.length} ${j.runner.id} vs ${j.corp.id} ${result.status} ${result.winner||''} ${result.reason||result.message||''}`);fs.writeFileSync(path.join(dir,'matches.json'),JSON.stringify({scope:'Native AI sensitivity benchmark; not human balance ratings. Two seeds per identity pair per lineup combination. Timeouts/errors retained; not counted as losses.',rulesVersion:'26.03-local-2',planned:jobs.length,completed:done,results:results.sort((a,b)=>a.id-b.id)},null,2)+'\n');resolve();});});}}
 await Promise.all([run(),run()]);
 // Recheck budget-limited cases alone, preserving their initial outcome.
 for(const failed of results.filter(r=>r.status==='timeout')){
  const j=jobs[failed.id],input=path.join(dir,'jobs',j.id+'.input.json'),output=path.join(dir,'jobs',j.id+'.retry.json');fs.rmSync(output,{force:true});
  await new Promise(resolve=>{const child=spawn(process.execPath,[__filename,'--worker',input,output],{stdio:'ignore'});const timer=setTimeout(()=>child.kill('SIGKILL'),120000);child.once('exit',()=>{clearTimeout(timer);if(fs.existsSync(output)){const r=JSON.parse(fs.readFileSync(output));results[results.findIndex(x=>x.id===failed.id)]={...r,initialAttempt:failed};console.log('RETRY',j.id,r.status,r.winner||'');}resolve();});});
 }
 fs.writeFileSync(path.join(dir,'matches.json'),JSON.stringify({scope:'Native AI sensitivity benchmark; not human balance ratings. Two seeds per identity pair per lineup combination. Timeouts/errors retained; not counted as losses.',retryPolicy:'Initial 60-second timeouts retried alone with 120-second budgets; initial outcomes retained.',rulesVersion:'26.03-local-2',planned:jobs.length,completed:done,results:results.sort((a,b)=>a.id-b.id)},null,2)+'\n');
 console.log('Benchmark complete.');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={profile};
