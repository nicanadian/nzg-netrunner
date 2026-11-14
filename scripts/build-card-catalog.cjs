'use strict';
// Optional argument: a cached NRDB /api/2.0/public/cards response. Without it,
// rebuild from bundled metadata while retaining the previously imported aliases.
const fs=require('node:fs'),previous=require('../engine/card-catalog.js');
const raw=process.argv[2]?JSON.parse(fs.readFileSync(process.argv[2],'utf8')):require('../assets/card-data.json');
const source=Array.isArray(raw.data)?raw.data:Object.values(raw),fields=['code','title','stripped_title','side_code','type_code','faction_code','faction_cost','minimum_deck_size','influence_limit','deck_limit','agenda_points','pack_code','cost','keywords','text','stripped_text'];
const cards=Object.fromEntries(source.filter(c=>['sg','elev'].includes(c.pack_code)).map(c=>[c.code,Object.fromEntries(fields.filter(k=>Object.hasOwn(c,k)).map(k=>[k,c[k]]))]));
const titles=new Map(Object.values(cards).map(c=>[c.stripped_title,c.code])),aliases={...previous.aliases};
for(const c of source)if(titles.has(c.stripped_title))aliases[c.code]=titles.get(c.stripped_title);
const definitions=fs.readFileSync('vendor/chiriboga-elevation/sets/elevation.js','utf8')+fs.readFileSync('engine/elevation-local.js','utf8');
const ids=new Set([...definitions.matchAll(/cardSet\[(350\d\d)\]\s*=/g)].map(m=>m[1]));
const audit=new Map(require('../docs/plans/elevation-82-card-tests.json').cards.map(c=>[c.id,c]));
const coverage=Object.fromEntries(Object.values(cards).map(c=>[c.code,{...(previous.coverage[c.code]||{rules:'not-audited',ui:'not-audited',ai:'not-audited'}),...(c.pack_code==='elev'?{rules:audit.get(c.code)?.rulesStatus.startsWith('partial')?'partial':'not-audited',ui:audit.get(c.code)?.evidence.some(p=>p.startsWith('docs/playtesting/'))?'partial':'not-audited'}:{}),definition:c.pack_code==='sg'||ids.has(c.code)}]));
const result={...previous,cards,aliases,coverage};
fs.writeFileSync('engine/card-catalog.js','/* Bundled card metadata. Generated from NRDB; no network needed at runtime. */\n(function(){const data='+JSON.stringify(result)+';globalThis.NRCardCatalog=data;if(typeof module!=="undefined")module.exports=data;})();\n');
console.log(`Bundled ${Object.keys(cards).length} cards, ${Object.keys(aliases).length} printing aliases.`);
