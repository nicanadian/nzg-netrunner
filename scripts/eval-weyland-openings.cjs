'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=require('../assets/card-data.json'),decks=require('../engine/deck-catalog.js');
const {makeGame}=require('../tests/engine-smoke.cjs');
const base=decks.resolve({corp:'built-to-last-v1'}).corp;
function variant(id,changes){const counts=new Map(base.cards);for(const[n,delta]of changes)counts.set(n,(counts.get(n)||0)+delta);return {...base,id,cards:[...counts].filter(([,n])=>n)};}
const variants=[base,
 variant('candidate-14',[[30063,-1],[30064,-1],[30066,-1],[30073,3]]),
 variant('candidate-15',[[30063,-1],[30064,-2],[30066,-1],[30073,3],[30055,1]]),
 variant('candidate-16',[[30063,-1],[30062,-1],[30064,-2],[30061,-1],[30065,-1],[30066,-1],[30073,3],[30055,3],[30053,1]])];
const utility=fs.readFileSync('vendor/chiriboga/utility.js','utf8');
// Read the exact native shuffle and RandomRange bodies, stopping at their next documentation block.
const native=name=>utility.slice(utility.indexOf('function '+name+'(')).split('/**')[0].trim();
const c=vm.createContext({});vm.runInContext(fs.readFileSync('vendor/chiriboga/seedrandom.min.js','utf8'),c);vm.runInContext(native('RandomRange')+'\n'+native('Shuffle'),c);
const runner=decks.expand(decks.resolve().runner).cards;
const ice=n=>data[n].type_code==='ice',cheap=n=>ice(n)&&data[n].cost<=3;
const stopper=n=>cheap(n)&&[30055,30072,30074].includes(n);
function trial(deck,seed,mulligan){c.deck=deck.slice();c.runnerDeck=runner.slice();c.seed=seed;vm.runInContext('Math.seedrandom(seed);Shuffle(deck);Shuffle(runnerDeck);',c);let h=c.deck.splice(-5).reverse();if(mulligan&&h.filter(ice).length<2){c.deck.push(...h);vm.runInContext('Shuffle(deck)',c);h=c.deck.splice(-5).reverse();}return {hand:h,seen:h.concat(c.deck.slice(-3).reverse())};}
const choose=(n,k)=>{if(k<0||k>n)return 0;let a=1;for(let i=1;i<=k;i++)a=a*(n-i+1)/i;return a;};
const poor=(N,K,n)=>[0,1].reduce((s,k)=>s+choose(K,k)*choose(N-K,n-k)/choose(N,n),0);
async function main(){const results=[];const count=20000;
 for(const v of variants){const deck=decks.expand(v).cards;assert.equal(deck.length,40);let influence=0;for(const[n,q]of v.cards){assert.ok(q>0&&q<=3);influence+=(data[n].faction_code!=='weyland-consortium'?data[n].faction_cost||0:0)*q;}assert.ok(influence<=15);
  let stats={noMulligan:{openingAtMost1Ice:0,turn3AtMost1Ice:0,turn3NoCheapIce:0,turn3NoCheapStoppingIce:0},mulliganBelow2Ice:{openingAtMost1Ice:0,turn3AtMost1Ice:0,turn3NoCheapIce:0,turn3NoCheapStoppingIce:0}};
  for(let i=0;i<count;i++)for(const[key,m]of [['noMulligan',false],['mulliganBelow2Ice',true]]){const t=trial(deck,'weyland-reliability-'+i,m),s=stats[key];s.openingAtMost1Ice+=t.hand.filter(ice).length<=1;s.turn3AtMost1Ice+=t.seen.filter(ice).length<=1;s.turn3NoCheapIce+=t.seen.filter(cheap).length===0;s.turn3NoCheapStoppingIce+=t.seen.filter(stopper).length===0;}
  const K=deck.filter(ice).length,C=deck.filter(cheap).length;
  results.push({id:v.id,cards:v.cards,ice:K,iceRez3OrLess:C,iceRez5OrMore:deck.filter(n=>ice(n)&&data[n].cost>=5).length,influence,exact:{openingAtMost1Ice:poor(40,K,5),turn3AtMost1Ice:poor(40,K,8),turn3NoCheapIce:choose(40-C,8)/choose(40,8),turn3NoCheapStoppingIce:choose(40-deck.filter(stopper).length,8)/choose(40,8)},sampleCount:count,stats:Object.fromEntries(Object.entries(stats).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).map(([x,n])=>[x,n/count]))]))});
 }
 // Check simulated initial shuffle against actual boot: not a custom RNG approximation.
 for(let i=0;i<100;i++){const seed='weyland-reliability-'+i,g=makeGame();try{g.api.boot({side:'corp',seed,deckIds:{corp:base.id,runner:'loup-v1'},rulesVersion:'26.03-local-2'});const s=await g.api.advance();assert.deepEqual(Array.from(s.corp.hand,x=>x.number),Array.from(trial(decks.expand(base).cards,seed,false).hand));}finally{g.close();}}
 for(const result of results){for(const key of ['openingAtMost1Ice','turn3AtMost1Ice','turn3NoCheapIce','turn3NoCheapStoppingIce'])assert.ok(Math.abs(result.exact[key]-result.stats.noMulligan[key])<0.015,result.id+' native shuffle distribution: '+key);}
 const report={kind:'Deck opening reliability; not full games or balance/win-rate evidence',assumptions:'Opening five plus three mandatory Corp draws, through start of Corp turn3; no extra draws, Runner accesses or card effects. Cheap means printed rez cost <=3, not guaranteed end-the-run. Cheap stopping ice means Ping/Palisade/Whitespace; Whitespace is conditional, and no ice guarantees stopping every Runner. Conditional mulligan when opening has fewer than two ice; opponents RNG/AI decisions omitted in mulligan model.',nativeOpeningParityChecks:100,results};fs.writeFileSync('eval/weyland-reliability/opening-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
