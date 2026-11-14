'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const api=require('../engine/deck-document.js'),gateway=require('../engine/deck-catalog.js'),core=require('../engine/core-decks.js');
const base={...gateway.catalog[0],pool:'gateway-v1'};
(async()=>{
 for(const d of [...gateway.catalog,...core.catalog]){const result=api.validate({...d,pool:d.pool||'gateway-v1'});assert(result.valid,JSON.stringify(result));}
 const normalized=api.normalize(base);assert.equal(await api.revision(base),await api.revision({...base,name:'renamed',cards:[...base.cards].reverse()}));
 const split={...base,cards:base.cards.flatMap(([id,n])=>[[id,1],[id,n-1]]).filter(([,n])=>n)};assert.equal(api.contentKey(base),api.contentKey(split));
 for(const count of [0,-1,NaN,Infinity,1.2,'3',1001])assert.equal(api.validate({...base,cards:[[30002,count]]}).errors[0].code,'schema');
 assert(api.validate({...base,cards:[[30002,4]]}).errors.some(e=>e.code==='copies'));
 assert(api.validate({...base,cards:[[30035,1],[35003,1]]}).errors.some(e=>e.code==='pool'));
 assert(api.validate({...base,identity:30076}).errors.some(e=>e.code==='teaching-identity'));
 const corp=core.catalog[1];for(const size of [40,44,45,49,50,54]){const d={...corp,cards:[[30067,3],[30069,3],[30075,size-6]]};assert.equal(api.validate(d).totals.agendaMin,2*Math.floor(size/5)+2);}
 assert(api.validate({...corp,cards:[[99999,3]]}).support.some(e=>e.code==='missing-definition'));assert.equal(api.validate({...corp,cards:[[35059,3]]}).aiCertified,false);
 const parsed=api.parseText('René “Loup” Arcemont: Party Animal\n3 Sure Gamble\n2 Cleaver',{pool:'gateway-v1'});assert.equal(parsed.cards.length,2);assert.throws(()=>api.parseText('3 Nonsense',{identity:30001}),/Unrecognized/);
 assert.equal(api.parseText('Ryō “Phoenix” Ōno: Out of the Ashes\nHardware (3)\n3x Maglectric Rapid (748 Mod)').cards[0].id,'35019');
 const context=vm.createContext({TextEncoder,crypto});for(const file of ['card-catalog.js','deck-document.js'])vm.runInContext(fs.readFileSync('engine/'+file,'utf8'),context);assert.equal(JSON.stringify(context.NRDeckDocument.validate(base)),JSON.stringify(api.validate(base)));
 const runtime=require('../engine/runtime.cjs');const g=runtime.createGame();try{assert.throws(()=>g.api.boot({rulesVersion:'26.03-local-2',deckDocuments:{runner:normalized,corp:{...normalized,side:'corp'}}}),/wrong side|other side|identity/);}finally{g.close();}
 console.log('PASS shared deck documents: canonical hashes, quantities, construction boundaries, support gaps, browser/Node parity, engine rejection.');
})().catch(e=>{console.error(e);process.exitCode=1});
