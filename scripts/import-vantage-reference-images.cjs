'use strict';
// Low-resolution independent references identify native PDF faces; they are
// never upscaled or used as delivered full-card artwork.
const fs=require('node:fs'),crypto=require('node:crypto'),{cards}=require('../engine/vantage-catalog.js');
const ids=[...Object.keys(cards),'36036-0','36036-1','36036-2'],directory='tmp/vantage-assets/references';
fs.mkdirSync(directory,{recursive:true});
(async()=>{
 const images=[];
 for(let i=0;i<ids.length;i+=4)images.push(...await Promise.all(ids.slice(i,i+4).map(async id=>{
  const url=`https://card-images.netrunnerdb.com/v2/large/${id}.jpg`,file=`${directory}/${id}.jpg`;
  if(!fs.existsSync(file)){const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`${id}: HTTP ${r.status}`);fs.writeFileSync(file,Buffer.from(await r.arrayBuffer()));}
  return {code:id,url,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};
 })));
 fs.writeFileSync('tmp/vantage-assets/references.json',JSON.stringify({images},null,2)+'\n');console.log(`Cached ${images.length} independent card-face references.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
