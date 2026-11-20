/* Explicit public import boundary; local play never fetches decks. */
(function(){
'use strict';
function withCatalog(catalog,docs){
function endpoint(value){const u=new URL(value);if(u.protocol!=='https:'||!['netrunnerdb.com','www.netrunnerdb.com'].includes(u.hostname))throw Error('Use a public https://netrunnerdb.com/en/decklist/… URL.');const m=u.pathname.match(/^\/en\/decklist\/([0-9a-f-]+)(?:\/|$)/i);if(!m)throw Error('Use a published decklist URL, not a private deck URL.');return {url:`https://netrunnerdb.com/en/decklist/${m[1]}`,api:`https://netrunnerdb.com/api/2.0/public/decklist/${m[1]}`};}
function fromNRDB(payload,url){
 const raw=payload?.data;if(!Array.isArray(raw)||raw.length!==1||!raw[0].cards||typeof raw[0].cards!=='object'||Array.isArray(raw[0].cards))throw Error('Unexpected NetrunnerDB decklist response.');
 const list=raw[0],entries=Object.entries(list.cards),identities=entries.filter(([id])=>catalog.cards[docs.canonical(id)]?.type_code==='identity');
 if(identities.length!==1||identities[0][1]!==1)throw Error('Imported list needs one supported identity.');
 const identity=docs.canonical(identities[0][0]);
 const pool=catalog.pools?.includes('vantage-preview-v1')&&entries.some(([id])=>catalog.cards[docs.canonical(id)]?.pack_code==='vp')?'vantage-preview-v1':'core-v1';
 return docs.normalize({identity,pool,name:list.name,side:catalog.cards[identity].side_code,cards:entries.filter(([id])=>id!==identities[0][0]),source:{provider:'NetrunnerDB v2 public',url,externalId:String(list.uuid||list.id),author:String(list.user_name||''),updatedAt:String(list.date_update||''),fetchedAt:new Date().toISOString(),originalTitle:String(list.name||'')}});
}
async function importURL(value,fetcher=globalThis.fetch){const {url,api}=endpoint(value),response=await fetcher(api,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('NetrunnerDB returned '+response.status);const text=await response.text();if(text.length>2000000)throw Error('Decklist response is too large.');return fromNRDB(JSON.parse(text),url);}
return {endpoint,fromNRDB,importURL,withCatalog};
}
const api=withCatalog(typeof module!=='undefined'?require('./card-catalog.js'):globalThis.NRCardCatalog,typeof module!=='undefined'?require('./deck-document.js'):globalThis.NRDeckDocument);
globalThis.NRDeckImport=api;if(typeof module!=='undefined')module.exports=api;
})();
