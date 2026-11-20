'use strict';
// Rebuild from the pinned official snapshot. No runtime network dependency.
const fs=require('node:fs'),crypto=require('node:crypto');
const source=require('../docs/research/vantage-point/source.json'),raw=fs.readFileSync('docs/research/vantage-point/cards.json');
if(crypto.createHash('sha256').update(raw).digest('hex')!==source.sha256)throw Error('Vantage metadata source checksum changed.');
const list=JSON.parse(raw),plan=require('../docs/plans/vantage-card-tests.json');
const definitionIds=['engine/vantage-rules.js','engine/vantage-complete.js'].flatMap(file=>[...fs.readFileSync(file,'utf8').matchAll(/^define\((36\d{3}),/gm)].map(m=>m[1]));
const definitions=new Set(definitionIds);if(definitions.size!==definitionIds.length)throw Error('Duplicate Vantage card definition.');
if(list.length!==66||new Set(list.map(c=>c.code)).size!==66||list.some((c,i)=>Number(c.code)!==36001+i||c.pack_code!=='vp'))throw Error('Expected the complete 66-card Vantage Point set.');
if(plan.cards.length!==66||plan.cards.some((c,i)=>c.id!==list[i].code))throw Error('Card test inventory does not match official metadata.');
const cards=Object.fromEntries(list.map(c=>[c.code,c]));
const coverage=Object.fromEntries(plan.cards.map(c=>[c.id,{definition:definitions.has(c.id),rules:c.evidence.some(p=>p.startsWith('tests/vantage-'))?'partial':'not-audited',ui:'not-audited',ai:'not-audited'}]));
const data={schemaVersion:1,source,cards,coverage};
fs.writeFileSync('engine/vantage-catalog.js','/* Generated from pinned official metadata; card inclusion is not rules or AI certification. */\n(function(){const data='+JSON.stringify(data)+';globalThis.NRVantageCatalog=data;if(typeof module!=="undefined")module.exports=data;})();\n');
console.log(`Vantage metadata: ${list.length} cards; ${definitions.size} definitions; no fully certified cards.`);
