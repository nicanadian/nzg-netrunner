'use strict';
const plain=value=>JSON.parse(JSON.stringify(value));
const assert=require('node:assert/strict'),{play}=require('../engine/simulation/match.cjs'),{decks}=require('../engine/vantage.cjs');
(async()=>{for(const [runner,corp]of [['loup-full-vp-v1','hb-full-vp-v1'],['vic-full-vp-v1','melies-full-vp-v1'],['hiram-full-vp-v1','editorial-full-vp-v1'],['vic-full-vp-v1','weyland-full-vp-v1']]){
 const job={id:runner+':'+corp,seed:'vantage-full-parity:0',runner:decks.find(d=>d.id===runner).document,corp:decks.find(d=>d.id===corp).document,limits:{decisions:12000,wallMs:60000}},fast=await play(job),reference=await play({...job,mode:'reference'});
 assert.equal(fast.status,'completed',fast.error);assert.equal(reference.status,'completed',reference.error);for(const key of ['trace','terminal','turn','decisions','points'])assert.deepEqual(plain(fast[key]),plain(reference[key]),runner+'/'+corp+' '+key);console.log('PASS full Vantage optimized/reference parity: '+runner+' / '+corp+' ('+fast.decisions+' native decisions).');
}})().catch(e=>{console.error(e);process.exitCode=1;});
