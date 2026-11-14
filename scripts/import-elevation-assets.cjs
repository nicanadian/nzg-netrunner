'use strict';
// Fetch all Elevation card faces, with source hashes.
// Then run build-elevation-assets.py with Pillow 13.0.0.
const fs=require('fs'),crypto=require('crypto');const data=require('../engine/card-catalog.js').cards;
const ids=Object.values(data).filter(c=>c.pack_code==='elev').map(c=>c.code).concat(['35023-0','35057-0']);fs.mkdirSync('tmp/elevation-audit/images',{recursive:true});
(async()=>{let results=[];for(let i=0;i<ids.length;i+=4){results.push(...await Promise.all(ids.slice(i,i+4).map(async id=>{const url=`https://card-images.netrunnerdb.com/v2/large/${id}.jpg`;const r=await fetch(url);if(!r.ok)throw Error(`${id}: ${r.status}`);const raw=Buffer.from(await r.arrayBuffer());fs.writeFileSync(`tmp/elevation-audit/images/${id}.jpg`,raw);return {code:String(id),title:(data[id]||data[id.split('-')[0]]).title+(id.includes('-')?' (back face)':''),source:url,sourceSha256:crypto.createHash('sha256').update(raw).digest('hex')};})));}
fs.writeFileSync('tmp/elevation-audit/image-sources.json',JSON.stringify({set:'Elevation',scope:'All 82 Elevation front faces and both flipping-identity back faces',retrievedAt:new Date().toISOString(),metadataSource:'https://netrunnerdb.com/api/2.0/public/cards',images:results},null,2)+'\n');console.log('Downloaded '+results.length+' required Elevation images.');})().catch(e=>{console.error(e);process.exitCode=1});
