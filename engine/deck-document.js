/* Shared browser/worker/Node deck contract. Counts are never silently repaired. */
(function(){
'use strict';
const catalog=typeof module!=='undefined'?require('./card-catalog.js'):globalThis.NRCardCatalog;
const {cards,aliases,coverage}=catalog;
const issue=(code,message,card=null)=>({code,message,...(card?{card}:{} )});
const canonical=id=>aliases[String(id)]||String(id);
function normalize(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Deck must be an object.');
 if(input.schemaVersion!==undefined&&input.schemaVersion!==1)throw Error('Unsupported deck schema version.');
 if(!Array.isArray(input.cards)||input.cards.length>1000)throw Error('Deck cards must be an array of at most 1000 entries.');
 const totals=new Map();
 for(const entry of input.cards){
  const id=canonical(Array.isArray(entry)?entry[0]:entry?.id),count=Array.isArray(entry)?entry[1]:entry?.count;
  if(!Number.isSafeInteger(count)||count<=0||count>1000)throw Error(`Invalid quantity for ${id}: use an integer from 1 to 1000.`);
  totals.set(id,(totals.get(id)||0)+count);
 }
 const identity=canonical(input.identity),side=input.side||cards[identity]?.side_code;
 if(!['runner','corp'].includes(side))throw Error('Choose Runner or Corp.');
 const pool=input.pool||'core-v1';
 if(!['gateway-v1','core-v1'].includes(pool))throw Error('Unsupported card pool.');
 const result={schemaVersion:1,name:String(input.name||input.title||'Untitled deck').slice(0,200),side,identity,pool,cards:[...totals].sort((a,b)=>a[0].localeCompare(b[0])).map(([id,count])=>({id,count}))};
 if(input.source){if(typeof input.source==='string')result.source={url:input.source};else if(typeof input.source==='object'&&!Array.isArray(input.source))result.source=JSON.parse(JSON.stringify(input.source));}
 return result;
}
function contentKey(input){const d=normalize(input);return JSON.stringify({schemaVersion:1,pool:d.pool,side:d.side,identity:d.identity,cards:d.cards});}
async function revision(input){const bytes=new TextEncoder().encode(contentKey(input));const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');}
function validate(input,{requireDefinitions=true}={}){
 const errors=[],support=[],warnings=[];let deck;
 try{deck=normalize(input);}catch(e){return {valid:false,legal:false,implemented:false,errors:[issue('schema',e.message)],support:[],warnings:[],totals:null};}
 const identity=cards[deck.identity];let size=0,influence=0,agenda=0;
 const inPool=c=>c.pack_code==='sg'||deck.pool==='core-v1'&&c.pack_code==='elev';
 if(!identity||identity.type_code!=='identity')errors.push(issue('identity','Choose a known identity.',deck.identity));
 else{
  if(identity.side_code!==deck.side)errors.push(issue('identity-side','Identity is on the wrong side.',deck.identity));
  if(!inPool(identity))errors.push(issue('pool','Identity is outside this pool.',deck.identity));
  if(!Number.isFinite(identity.minimum_deck_size)||!Number.isFinite(identity.influence_limit))errors.push(issue('teaching-identity','Teaching identities cannot be used for normal deck construction.',deck.identity));
 }
 for(const {id,count}of deck.cards){
  size+=count;const c=cards[id];
  if(!c){errors.push(issue('unknown',`Unknown card ${id}.`,id));continue;}
  if(c.type_code==='identity')errors.push(issue('identity-in-deck',`${c.title} is an identity, not a draw-deck card.`,id));
  if(c.side_code!==deck.side)errors.push(issue('side',`${c.title} belongs to the other side.`,id));
  if(!inPool(c))errors.push(issue('pool',`${c.title} is outside this pool.`,id));
  if(count>(c.deck_limit??3))errors.push(issue('copies',`${c.title}: at most ${c.deck_limit??3} copies.`,id));
  if(identity&&c.faction_code!==identity.faction_code){
   if(c.type_code==='agenda'&&!c.faction_code.startsWith('neutral'))errors.push(issue('agenda-faction',`${c.title}: agendas must match your identity's faction or be neutral.`,id));
   if(!Number.isFinite(c.faction_cost))errors.push(issue('influence-unavailable',`${c.title} cannot be included out of faction.`,id));
   else influence+=c.faction_cost*count;
  }
  agenda+=(c.agenda_points||0)*count;
 }
 for(const id of [deck.identity,...deck.cards.map(c=>c.id)]){
  if(!cards[id]||!coverage[id]?.definition)support.push(issue('missing-definition',`${cards[id]?.title||id} has no engine implementation yet.`,id));
  else if(cards[id]?.pack_code==='elev')warnings.push(issue('audit-pending',`${cards[id].title}: card-by-card rules/AI audit is incomplete.`,id));
 }
 if(identity&&size<identity.minimum_deck_size)errors.push(issue('minimum-size',`Needs at least ${identity.minimum_deck_size} cards; currently ${size}.`));
 if(identity&&influence>identity.influence_limit)errors.push(issue('influence',`Uses ${influence}/${identity.influence_limit} influence.`));
 const agendaMin=2*Math.floor(size/5)+2;
 if(deck.side==='corp'&&(agenda<agendaMin||agenda>agendaMin+1))errors.push(issue('agenda-total',`${size} cards requires ${agendaMin}–${agendaMin+1} agenda points; currently ${agenda}.`));
 const legal=errors.length===0,implemented=support.length===0;
 return {valid:legal&&(!requireDefinitions||implemented),legal,implemented,aiCertified:implemented&&[deck.identity,...deck.cards.map(c=>c.id)].every(id=>coverage[id]?.ai==='certified'),errors,support,warnings,deck,totals:{size,influence,influenceLimit:identity?.influence_limit,minimumSize:identity?.minimum_deck_size,agenda,agendaMin,agendaMax:agendaMin+1}};
}
function expand(input){const result=validate(input);if(!result.valid)throw Error([...result.errors,...result.support].map(e=>e.message).join('\n'));return {identity:Number(result.deck.identity),cards:result.deck.cards.flatMap(({id,count})=>Array(count).fill(Number(id)))};}
function parseText(text,{identity,pool='core-v1',side,name='Imported deck'}={}){
 const entries=[],unresolved=[];let found=identity;
 const byTitle=new Map();for(const c of Object.values(cards)){for(const title of [c.title,c.stripped_title])byTitle.set(title.normalize('NFKC').toLowerCase(),c.code);}
 for(const raw of String(text).split(/\r?\n/)){
  const line=raw.trim();if(!line||line.startsWith('#'))continue;
  if(/^(events?|operations?|hardware|programs?|resources?|agendas?|assets?|ice|upgrades?)\s*(\(\d+\)|:\s*\d+)?$/i.test(line))continue;
  const m=line.match(/^(\d+)\s*x?\s+(.+)$/i),title=(m?m[2]:line).normalize('NFKC').toLowerCase();
  const id=byTitle.get(title)||byTitle.get(title.replace(/\s+\([^)]*\)$/,''))||(/^[0-9]+$/.test(title)&&cards[canonical(title)]?canonical(title):null);
  if(!id){unresolved.push(raw);continue;}
  if(cards[id].type_code==='identity'){if(found&&canonical(found)!==id)unresolved.push('Multiple identities: '+raw);else found=id;}
  else if(m)entries.push({id,count:Number(m[1])});else unresolved.push(raw);
 }
 if(unresolved.length)throw Error('Unrecognized lines:\n'+unresolved.join('\n'));
 return normalize({name,identity:found,side,pool,cards:entries});
}
const api={normalize,validate,expand,revision,contentKey,canonical,parseText};globalThis.NRDeckDocument=api;if(typeof module!=='undefined')module.exports=api;
})();
