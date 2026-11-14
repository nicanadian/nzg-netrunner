'use strict';
const fs=require('node:fs'),docs=require('../engine/deck-document.js'),importer=require('../engine/deck-import.js');
(async()=>{
 const html=fs.readFileSync('tmp/elevation-audit/sample-decks.html','utf8');
 const urls=[...new Set(html.match(/https:\/\/netrunnerdb\.com\/en\/decklist\/[^"\s<>]+/g))].filter(url=>url.includes('-nsg-core-'));
 if(urls.length!==21)throw Error('Expected the 21 official Core Sets sample decks; inspect the source before refreshing.');
 const result=[];for(let i=0;i<urls.length;i+=4)result.push(...await Promise.all(urls.slice(i,i+4).map(async url=>{
  const document=await importer.importURL(url),v=docs.validate(document);if(!v.valid)throw Error(document.name+': '+[...v.errors,...v.support].map(e=>e.message).join('; '));
  const revision=await docs.revision(document);return {id:`nrdb-${document.source.externalId}-${revision.slice(0,12)}`,name:document.name,title:document.name,side:document.side,identity:Number(document.identity),pool:'core-v1',faction:require('../engine/card-catalog.js').cards[document.identity].faction_code,style:'Official Core Sets sample',description:'Public NSG sample list · experimental engine/AI coverage',cards:document.cards.map(c=>[Number(c.id),c.count]),source:document.source.url,document,revision};
 })));
 const data={retrievedAt:new Date().toISOString(),source:'https://nullsignal.games/players/supported-formats/',notice:'Official lists; local rules and AI audit is incomplete.',catalog:result};
 fs.writeFileSync('engine/net-decks.js','/* Immutable bundled public deck snapshots; offline at play time. */\n(function(){const data='+JSON.stringify(data)+';const freeze=o=>{if(o&&typeof o==="object"&&!Object.isFrozen(o)){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};globalThis.NRNetDecks=freeze(data);if(typeof module!=="undefined")module.exports=globalThis.NRNetDecks;})();\n');
 console.log('Bundled '+result.length+' validated, attributed public Core deck snapshots.');
})().catch(e=>{console.error(e);process.exitCode=1});
