import {deckDelta,dependencyAdvice} from './guide-flow.mjs';
import '../engine/card-catalog.js';
import '../engine/deck-document.js';
import '../engine/deck-import.js';
import '../engine/net-decks.js';
import {deckHealth,rulesTextHTML} from './playtest-polish.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='netrunner-deck-library-v1';
const factionName=code=>({'anarch':'Anarch','criminal':'Criminal','shaper':'Shaper','haas-bioroid':'Haas-Bioroid','jinteki':'Jinteki','nbn':'NBN','weyland-consortium':'Weyland','neutral-runner':'Neutral','neutral-corp':'Neutral'}[code]||code);
export function deckCardInfluence(card,identity){
 if(!identity||card.side_code!==identity.side_code)return {cost:null,kind:'unavailable',reason:'Card belongs to the other side'};
 if(card.faction_code===identity.faction_code)return {cost:0,kind:'own',reason:`Matches your ${factionName(identity.faction_code)} identity`};
 if(card.type_code==='agenda'&&!card.faction_code.startsWith('neutral'))return {cost:null,kind:'unavailable',reason:'Agendas must match your faction or be neutral'};
 if(!Number.isFinite(card.faction_cost))return {cost:null,kind:'unavailable',reason:'This card cannot be imported'};
 return {cost:card.faction_cost,kind:card.faction_code.startsWith('neutral')?'neutral':'import',reason:card.faction_code.startsWith('neutral')?'Neutral card':`${factionName(card.faction_code)} import`};
}

export function mountDeckBuilder({pool,bundled,onSelect,onChange}){
 const api=globalThis.NRDeckDocument,{cards,coverage}=globalThis.NRCardCatalog;
 const DRAFT=pool==='gateway-v1'?'netrunner-deck-draft-v1':`netrunner-deck-draft-${pool}`;
 // Older builds shared Gateway's draft slot with Elevation. Preserve a
 // matching legacy draft without exposing it in the wrong game profile.
 if(!localStorage.getItem('netrunner-deck-draft-core-v1')){
  try{const saved=localStorage.getItem('netrunner-deck-draft-v1');if(JSON.parse(saved)?.draft?.pool==='core-v1')localStorage.setItem('netrunner-deck-draft-core-v1',saved);}catch{}
 }
 function savedDraft(){try{const saved=JSON.parse(localStorage.getItem(DRAFT));return saved?.draft?.pool===pool?saved:null;}catch{return null;}}
 const inPool=card=>card.pack_code==='sg'||pool!=='gateway-v1'&&card.pack_code==='elev'||pool==='vantage-preview-v1'&&card.pack_code==='vp';
 const poolLabel=pool==='vantage-preview-v1'?'GATEWAY + ELEVATION + VANTAGE POINT':pool==='core-v1'?'GATEWAY + ELEVATION':'SYSTEM GATEWAY';
 if(pool==='core-v1'){
  const keys=new Set(bundled.map(d=>api.contentKey({...d,pool})));
  bundled=[...bundled,...globalThis.NRNetDecks.catalog.filter(d=>!keys.has(api.contentKey(d.document)))];
 }

 let library=[];try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(saved))library=saved;}catch{}
 let draft=null,editing=null,original=null,baseline=null,search='',type='',faction='',maxCost='',maxInfluence='',subtype='',view='library',notice='',pane='contents',pendingCharacter=null;
 const dialog=document.createElement('dialog');dialog.className='deck-builder';dialog.setAttribute('aria-label','Deck library and builder');document.body.append(dialog);
 const preview=document.createElement('dialog');preview.className='builder-card-preview';preview.setAttribute('aria-label','Full card');document.body.append(preview);
 preview.addEventListener('click',e=>{if(e.target.closest('[data-preview-close]')){e.stopPropagation();preview.close();}});
 dialog.addEventListener('close',()=>{if(preview.open)preview.close();});

 function store(){localStorage.setItem(KEY,JSON.stringify(library));onChange?.();}
 function autosave(){try{localStorage.setItem(DRAFT,JSON.stringify({draft,editing,baseline}));}catch{}}
 function list(){return [...bundled,...library.filter(d=>!d.deleted&&d.deck.pool===pool).map(d=>asCatalog(d))];}
 function asCatalog(entry){const d=entry.deck,id=cards[d.identity];return {id:entry.id,local:true,name:d.name,side:d.side,identity:Number(d.identity),pool:d.pool,cards:d.cards.map(c=>[Number(c.id),c.count]),faction:id?.faction_code||'',style:'Your deck',description:'Saved locally · exact list embedded in each game',document:d};}
 function resolve(id){return list().find(d=>d.id===id);}
 function doc(deck){return deck.document||api.normalize({...deck,name:deck.title||deck.name,pool});}
 function open(){pendingCharacter=null;view='library';render();dialog.showModal();}
 function tune(id,{basics=false}={}){const d=resolve(id);if(!d)throw Error('Deck not found.');begin(doc(d),d.local?d.id:null);if(!d.local){baseline={id:d.id,name:d.loadoutName||d.title||d.style||d.name,deck:structuredClone(doc(d))};draft.name=(d.loadoutName||d.style||d.name)+' · custom';autosave();render();}if(basics)dialog.querySelector('details.builder-help')?.setAttribute('open','');if(!dialog.open)dialog.showModal();}
 function begin(d=null,id=null){if(d&&d.pool!==pool)throw Error('This deck uses another pool. Open the matching game profile before editing.');pendingCharacter=null;original=d?structuredClone(d):null;baseline=id?library.find(e=>e.id===id)?.baseline||null:d?{name:d.name,deck:structuredClone(d)}:null;draft=d?structuredClone(d):{schemaVersion:1,name:'New deck',side:'runner',identity:'30001',pool,cards:[]};editing=id;view='editor';pane='contents';search='';type='';faction='';maxCost='';maxInfluence='';subtype='';notice='';autosave();render();}
 function starterFor(side,identity){return bundled.find(d=>d.side===side&&String(d.identity)===String(identity)&&api.validate(doc(d)).valid);}
 function changeCharacter(side,identity){
  if(!draft.cards.length){draft.side=side;draft.identity=String(identity);autosave();render();return;}
  notice='';pendingCharacter={side,identity:String(identity)};render();
  dialog.querySelector('[data-character-starter]')?.focus?.();
 }
 function loadCharacterStarter(){
  const next=pendingCharacter,starter=starterFor(next.side,next.identity);
  if(!starter)throw Error('No ready-made deck is available for this character.');
  begin(doc(starter));baseline={id:starter.id,name:starter.loadoutName||starter.title||starter.style||starter.name,deck:structuredClone(doc(starter))};draft.name=(starter.loadoutName||starter.style||starter.name)+' · custom';
  notice='Loaded '+cards[draft.identity].title+'’s ready-made deck. Your saved decks are unchanged.';
  autosave();render();dialog.querySelector('#builder-identity')?.focus?.({preventScroll:true});
 }
 function renderCharacterChange(){
  const next=pendingCharacter,identity=cards[next.identity],starter=starterFor(next.side,next.identity);
  const kept=api.validate({...draft,side:next.side,identity:next.identity}),starting=starter&&api.validate(doc(starter));
  const sameSide=draft.side===next.side;
  dialog.insertAdjacentHTML('beforeend',`<section class="builder-character-change"><h3>${next.identity===draft.identity?'Start over with':'Switch to'} ${esc(identity.title)}?</h3><p>Current character: ${esc(cards[draft.identity]?.title)}. Changing the identity alone keeps every card in the working list.</p>${starter?`<div class="builder-switch-option"><h4>Start with this character’s deck</h4><p>${totals(starting)} · Ready to play</p><p>This replaces the current working list. Saved decks are unchanged.</p><button class="primary" data-character-starter>Load ${esc(factionName(identity.faction_code))} deck</button></div>`:''}${sameSide?`<div class="builder-switch-option"><h4>Keep my cards and change identity</h4><p>${totals(kept)}</p><p class="${kept.valid?'':'builder-errors'}">${kept.valid?'This list is legal with the new character.':esc([...kept.errors,...kept.support].map(e=>e.message).join(' '))}</p><button data-character-keep>Keep cards · change identity</button></div>`:'<p>Runner and Corp cards cannot share a deck. Load a matching deck to switch sides.</p>'}<button data-character-cancel>Cancel · keep editing ${esc(cards[draft.identity]?.title)}</button></section>`);
 }
 const totals=v=>`${v.totals?.size||0} cards · ${v.totals?.influence||0}/${v.totals?.influenceLimit??'—'} influence${v.deck?.side==='corp'?` · ${v.totals.agenda}/${v.totals.agendaMin}–${v.totals.agendaMax} agenda points`:''}`;
 function render(){
  const disclosures=[...dialog.querySelectorAll('details[open]')].map(el=>el.className);
  dialog.innerHTML=`<div class="builder-heading"><div><span class="eyebrow">${poolLabel}</span><h2>${view==='library'?'Deck library':view==='import'?'Import a deck':'Tune your deck'}</h2></div><button data-close aria-label="Close deck builder">Close</button></div><p role="status" class="builder-notice">${esc(notice)}</p>`;
  if(pendingCharacter){renderCharacterChange();return;}
  if(view==='library'){
   dialog.insertAdjacentHTML('beforeend',`<div class="builder-tools"><button data-new class="primary">New deck</button><button data-import>Import deck</button>${savedDraft()?'<button data-draft>Resume draft</button>':''}<button data-backup>Back up library</button></div><div class="builder-library">${list().map(d=>{const v=api.validate(doc(d));return `<article><small>${d.local?'MY DECKS':d.purpose==='interaction'?'INTERACTION TEST PILOT':d.purpose==='play'?'RECOMMENDED FOR PLAY':'READY-MADE'}</small><h3>${esc(d.loadoutName||d.title||(d.local?d.name:d.style)||d.name)}</h3><p>${esc(cards[d.identity]?.title)}</p><p>${totals(v)}</p><p>${v.valid?(v.warnings.length?'Playable development list · rules/AI audit pending':'Gateway · legal deck'):'Draft · needs changes'}</p><div class="builder-library-actions"><button data-edit="${esc(d.id)}">${d.local?'Edit':'Clone and edit'}</button><button data-select="${esc(d.id)}" ${v.valid?'':'disabled'}>Use this ${esc(d.side)} deck</button>${d.source||d.document?.source?.url?`<a href="${safeURL(d.source||d.document.source.url)}" target="_blank" rel="noreferrer">View source</a>`:''}${d.local?`<button data-export="${esc(d.id)}">Export</button><button data-delete="${esc(d.id)}">Delete</button>`:''}</div></article>`;}).join('')}</div>${library.some(d=>d.deleted)?'<button data-restore>Restore last deleted deck</button>':''}`);
  }else if(view==='import'){
   dialog.insertAdjacentHTML('beforeend','<p>Paste a public NetrunnerDB decklist URL, deck JSON, a library backup, or a plain-text list including its identity. Imports are saved locally; unsupported cards remain visible for review.</p><label>Deck import<textarea id="builder-import" rows="10"></textarea></label><div class="builder-tools"><button data-read-import class="primary">Review import</button><button data-library>Back to library</button></div>');
  }else{
   const v=api.validate(draft),changes=deckChanges(),identities=Object.values(cards).filter(c=>c.type_code==='identity'&&c.side_code===draft.side&&Number.isFinite(c.minimum_deck_size)&&Number.isFinite(c.influence_limit)&&inPool(c)&&coverage[c.code]?.definition);
   dialog.insertAdjacentHTML('beforeend',`<div class="builder-tools builder-deck-fields"><label>Deck name<input id="builder-name" value="${esc(draft.name)}"></label><label>Side<select id="builder-side"><option value="runner" ${draft.side==='runner'?'selected':''}>Runner</option><option value="corp" ${draft.side==='corp'?'selected':''}>Corp</option></select></label><label>Character<select id="builder-identity" aria-label="Character" aria-describedby="builder-identity-faction">${identities.map(c=>`<option value="${c.code}" ${c.code===draft.identity?'selected':''}>${esc(c.title)}</option>`).join('')}</select><small id="builder-identity-faction" class="builder-identity-faction" role="status" aria-live="polite">Faction: ${esc(factionName(cards[draft.identity]?.faction_code))}</small></label></div><details class="builder-help"><summary>Deckbuilding basics</summary><p>Swap cards one-for-one with − and +. Keep the minimum deck size and stay within your influence limit${draft.side==='corp'?' and agenda-point range':''}. Cards matching your ${esc(factionName(cards[draft.identity]?.faction_code))} faction use 0 influence; other cards use their printed influence per copy. Usually at most 3 copies of a card (check its own limit). Unique means only one active copy, not a one-copy deck limit. Corp agendas must be in-faction or neutral; required points are 2 × floor(deck size ÷ 5) + 2, or one more. A 44-card deck needs 18–19 points; 45 needs 20–21. <a href="/app/pairing-guide.html?pool=${pool}#building" target="_blank" rel="noopener">Worked examples and experiment notes ↗</a> <strong>Save &amp; use this deck</strong> returns to setup with your deck selected.</p></details><div class="builder-checkout"><p class="builder-totals" aria-live="polite">${totals(v)}<small>${v.valid?'Ready to play':'Needs changes before you can play'}</small></p><div class="builder-tools"><button data-save-use class="primary" ${v.valid?'':'disabled'}>Save &amp; use this deck</button><button data-save>Save ${v.valid?'to library':'draft'}</button><button data-library>Back to library</button></div></div>${changes?`<p class="builder-changes">${esc(changes)}</p>`:''}${baseline?`<section class="builder-baseline"><strong>Based on ${esc(baseline.name)}</strong><p>Compared with baseline: ${esc(deckDelta(baseline.deck,draft,cards)||'Same identity and card counts.')}</p>${api.contentKey(baseline.deck)!==api.contentKey(draft)?'<p>Custom revision · its matchup results have not been benchmarked.</p>':''}</section>`:'<p class="builder-health">Original baseline not recorded for this list. Changes below compare this editing session.</p>'}${dependencyAdvice(draft,cards).map(h=>`<p class="builder-health">Deck advice · ${esc(h)} Legal construction and functional support are separate checks.</p>`).join('')}${pool==='vantage-preview-v1'?deckHealth(draft,cards).map(h=>`<p class="builder-health">${esc(h)}</p>`).join(''):''}<div class="builder-errors">${[...v.errors,...v.support].map(e=>`<p>${esc(e.message)}</p>`).join('')}${v.errors.some(e=>['influence','side','agenda-faction'].includes(e.code))&&starterFor(draft.side,draft.identity)?'<button data-current-starter>Start from this character’s ready-made deck</button>':''}${v.warnings.length?'<p>Expansion card rules and native AI are still being audited. A definition is not a certification.</p>':''}</div><div class="builder-mobile-views" role="group" aria-label="Deck card list"><button data-builder-pane="contents" aria-pressed="${pane==='contents'}">Your deck</button><button data-builder-pane="results" aria-pressed="${pane==='results'}">Add replacements</button></div><div class="builder-columns" data-pane="${pane}"><section class="builder-current"><h3>Your deck</h3><div id="builder-contents"></div><div id="builder-curve"></div><button data-export-draft>Export deck JSON</button></section><section class="builder-find"><h3>Add replacements</h3><div class="builder-tools builder-search"><label>Search cards<input id="builder-search" type="search" value="${esc(search)}"></label><label>Type<select id="builder-type"><option value="">All types</option>${['event','program','hardware','resource','agenda','asset','ice','operation','upgrade'].map(t=>`<option ${type===t?'selected':''}>${t}</option>`).join('')}</select></label><label>Faction<select id="builder-faction"><option value="">All factions</option>${[...new Set(Object.values(cards).filter(c=>c.side_code===draft.side).map(c=>c.faction_code))].map(f=>`<option value="${esc(f)}" ${faction===f?'selected':''}>${esc(factionName(f))}</option>`).join('')}</select></label></div><details class="builder-advanced"><summary>More filters</summary><div class="builder-tools"><label>Subtype<input id="builder-subtype" value="${esc(subtype)}"></label><label>Maximum cost<input id="builder-cost" type="number" min="0" value="${esc(maxCost)}"></label><label>Max influence per copy (your deck)<input id="builder-influence" type="number" min="0" max="5" value="${esc(maxInfluence)}"></label></div></details><div id="builder-results"></div></section></div>`);
   renderCards();
  }
  for(const key of ['builder-help','builder-advanced'])if(disclosures.includes(key))dialog.querySelector('details.'+key)?.setAttribute('open','');
 }
 function deckChanges(){
  if(!original)return '';
  const before=new Map(original.cards.map(c=>[c.id,c.count])),after=new Map(draft.cards.map(c=>[c.id,c.count]));
  const changes=[...new Set([...before.keys(),...after.keys()])].map(id=>{const delta=(after.get(id)||0)-(before.get(id)||0);return delta?`${delta>0?'+':''}${delta} ${cards[id]?.title||id}`:'';}).filter(Boolean);
  if(original.identity!==draft.identity)changes.unshift('Identity changed');
  return changes.length?'Changes: '+changes.join(' · '):'No card changes yet.';
 }
 function safeURL(url){try{const u=new URL(typeof url==='object'?url.url:url);return /^https?:$/.test(u.protocol)?esc(u.href):'#';}catch{return '#';}}
 function readCard(id){
  const c=cards[id];if(!c)return;
  const influence=deckCardInfluence(c,cards[draft.identity]);
  preview.setAttribute('aria-label',c.title+' · full card');
  preview.innerHTML=`<div class="builder-preview-heading"><h2>${esc(c.title)}</h2><button data-preview-close autofocus>Back to deck</button></div><div class="builder-preview-layout"><img class="builder-full-art" src="/assets/cards-display/${c.code}-743.webp" width="743" height="1033" alt="${esc(c.title)} card artwork"><div><p>${esc(factionName(c.faction_code))} · ${esc(c.type_code)}${c.keywords?' · '+esc(c.keywords):''}</p><p class="builder-influence ${influence.kind}"><strong>${influence.cost===null?'Cannot use with this identity':influence.cost+' influence per copy'}</strong><small>${esc(influence.reason)}${draft.cards.find(entry=>entry.id===c.code)?.count&&influence.cost!==null?` · ${draft.cards.find(entry=>entry.id===c.code).count} × ${influence.cost} = ${draft.cards.find(entry=>entry.id===c.code).count*influence.cost} influence in deck`:""}</small></p><h3>Card text</h3><p class="builder-full-text">${rulesTextHTML(c.stripped_text||c.text)}</p><a href="/assets/cards-display/${c.code}-743.webp" target="_blank" rel="noopener">Open full-size image ↗</a></div></div>`;
  preview.showModal();
 }
 function cardRow(c,quantity,add){
  const influence=deckCardInfluence(c,cards[draft.identity]);
  const membership=add?`<span class="builder-membership ${quantity?'in-deck':'not-in-deck'}">${quantity?`${quantity} in deck`:'Not in deck'}</span>`:'';
  const reason=influence.kind==='own'?'in faction':influence.kind==='neutral'?'neutral':influence.kind==='import'?'import':influence.reason;
  const contribution=quantity&&influence.cost!==null?`${quantity*influence.cost} total in deck` : reason;
  const quantityControls=`<div class="builder-quantity" role="group" aria-label="${esc(c.title)} quantity">${!add||quantity?`<button data-remove="${c.code}" aria-label="Remove ${esc(c.title)}">−</button><b aria-label="${quantity} copies in deck">${quantity}</b>`:''}<button data-add="${c.code}" aria-label="Add ${esc(c.title)}" ${quantity>=(c.deck_limit??3)?`disabled title="Maximum ${c.deck_limit??3} copies in a deck"`:""}>+</button></div>`;
  return `<article class="builder-card ${add&&quantity?'in-deck-result':''}" data-builder-card="${c.code}"><button class="builder-thumbnail" data-builder-preview="${c.code}" aria-label="Read ${esc(c.title)} full card"><img src="/assets/cards-display/${c.code}-300.webp" width="300" height="416" loading="lazy" alt=""></button><div class="builder-card-copy"><div class="builder-card-heading"><div class="builder-card-title"><strong>${esc(c.title)}</strong>${membership}</div>${quantityControls}</div><p class="builder-card-meta">${esc(c.type_code)} · ${esc(factionName(c.faction_code))} · ${c.cost??'—'} ${c.cost===1?'credit':'credits'}</p><div class="builder-card-bottom"><p class="builder-influence ${influence.kind}"><strong>${influence.cost===null?'Cannot include':influence.cost+' influence per copy'}</strong><span> · ${esc(contribution)}</span></p><button class="builder-read" data-builder-preview="${c.code}">Read card</button></div></div></article>`;
 }

 function renderCards(){
  const entries=Object.values(cards).filter(c=>c.side_code===draft.side&&c.type_code!=='identity'&&inPool(c)&&coverage[c.code]?.definition&&(maxCost===''||Number.isFinite(c.cost)&&c.cost<=Number(maxCost))&&(maxInfluence===''||deckCardInfluence(c,cards[draft.identity]).cost!==null&&deckCardInfluence(c,cards[draft.identity]).cost<=Number(maxInfluence))&&(!subtype||(c.keywords||'').toLowerCase().includes(subtype.toLowerCase()))&&(!type||c.type_code===type)&&(!faction||c.faction_code===faction)&&`${c.title} ${c.keywords||''} ${c.stripped_text||''}`.toLowerCase().includes(search.toLowerCase()));
  dialog.querySelector('#builder-results').innerHTML=entries.map(c=>cardRow(c,draft.cards.find(entry=>entry.id===c.code)?.count||0,true)).join('')||'<div class="builder-empty"><p>No matching cards.</p><button data-clear-filters>Clear filters</button></div>';
  dialog.querySelector('#builder-contents').innerHTML=draft.cards.map(({id,count})=>cards[id]?cardRow(cards[id],count,false):`<p>Unknown card ${esc(id)} × ${count} <button data-remove="${esc(id)}">Remove</button></p>`).join('')||'<p>No cards yet. Add cards from the list.</p>';
  const curve={};for(const {id,count}of draft.cards){const cost=cards[id]?.cost??'X / —';curve[cost]=(curve[cost]||0)+count;}dialog.querySelector('#builder-curve').innerHTML='<h3>Cost curve</h3><p>'+Object.entries(curve).map(([cost,n])=>`${esc(cost)}: ${n}`).join(' · ')+'</p>';
 }
 function download(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 dialog.addEventListener('input',e=>{
  if(e.target.id==='builder-search'){search=e.target.value;renderCards();}
  if(e.target.id==='builder-cost'){maxCost=e.target.value;renderCards();}
  if(e.target.id==='builder-influence'){maxInfluence=e.target.value;renderCards();}
  if(e.target.id==='builder-subtype'){subtype=e.target.value;renderCards();}
  if(e.target.id==='builder-name'){draft.name=e.target.value;autosave();}
 });
 dialog.addEventListener('change',e=>{
  if(e.target.id==='builder-type'){type=e.target.value;renderCards();}
  if(e.target.id==='builder-faction'){faction=e.target.value;renderCards();}
  if(e.target.id==='builder-side')changeCharacter(e.target.value,e.target.value==='runner'?'30001':'30035');
  if(e.target.id==='builder-identity')changeCharacter(draft.side,e.target.value);
 });
 dialog.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  try{
   if(b.hasAttribute('data-character-starter')){loadCharacterStarter();return;}
   if(b.hasAttribute('data-character-keep')){draft.side=pendingCharacter.side;draft.identity=pendingCharacter.identity;pendingCharacter=null;autosave();render();dialog.querySelector('#builder-identity')?.focus?.({preventScroll:true});return;}
   if(b.hasAttribute('data-character-cancel')){pendingCharacter=null;render();dialog.querySelector('#builder-identity')?.focus?.({preventScroll:true});return;}
   if(b.hasAttribute('data-current-starter')){changeCharacter(draft.side,draft.identity);return;}
   if(b.dataset.builderPreview){e.stopPropagation();readCard(b.dataset.builderPreview);return;}
   if(b.dataset.builderPane){pane=b.dataset.builderPane;const top=dialog.scrollTop;render();dialog.scrollTop=top;dialog.querySelector(`[data-builder-pane="${pane}"]`)?.focus?.({preventScroll:true});return;}
   if(b.hasAttribute('data-clear-filters')){search=type=faction=maxCost=maxInfluence=subtype='';render();dialog.querySelector('#builder-search')?.focus?.();return;}
   if(b.hasAttribute('data-close'))dialog.close();
   if(b.hasAttribute('data-new'))begin();
   if(b.hasAttribute('data-library')){view='library';render();}
   if(b.hasAttribute('data-import')){view='import';notice='';render();}
   if(b.hasAttribute('data-draft')){const saved=savedDraft();if(!saved)throw Error('No draft is available for these card sets.');begin(api.normalize(saved.draft),saved.editing);baseline=saved.baseline||null;localStorage.setItem(DRAFT,JSON.stringify(saved));render();}
   if(b.dataset.edit)tune(b.dataset.edit);
   if(b.dataset.select){const d=resolve(b.dataset.select);if(!api.validate(doc(d)).valid)throw Error('Finish the deck changes before using it.');onSelect(d);dialog.close();}
   if(b.dataset.add||b.dataset.remove){const id=b.dataset.add||b.dataset.remove,c=draft.cards.find(c=>c.id===id);
    if(b.dataset.add&&(!cards[id]||!inPool(cards[id])||!coverage[id]?.definition))throw Error('This card is not available for play in these card sets.');
    if(b.dataset.add&&(c?.count||0)>=(cards[id]?.deck_limit??3)){notice=`${cards[id]?.title||id}: maximum ${cards[id]?.deck_limit??3} copies in a deck.`;const box=dialog.querySelector('[role=status]');if(box)box.textContent=notice;return;}
    const position=dialog.scrollTop,scope=b.closest('#builder-results')?'builder-results':'builder-contents',listPositions=['builder-results','builder-contents'].map(key=>[key,dialog.querySelector('#'+key).scrollTop]);
    if(b.dataset.add){if(c)c.count++;else draft.cards.push({id,count:1});}else if(c)c.count--;draft.cards=draft.cards.filter(c=>c.count>0);autosave();render();
    const action=b.dataset.add?'add':'remove',buttons=[...dialog.querySelectorAll('#'+scope+' button')],focus=buttons.find(button=>button.dataset[action]===id)||buttons.find(button=>button.dataset.add===id)||buttons.find(button=>button.dataset.add);focus?.focus({preventScroll:true});
    for(const [key,top]of listPositions)dialog.querySelector('#'+key).scrollTop=top;dialog.scrollTop=position;
   }
   if(b.hasAttribute('data-save')||b.hasAttribute('data-save-use')){
    const use=b.hasAttribute('data-save-use'),deck=api.normalize(draft);
    if(use&&!api.validate(deck).valid)throw Error('Finish the deck changes before using it.');
    b.disabled=true;
    const revision=await api.revision(deck),entry={id:editing||'local-'+crypto.randomUUID(),deck,revision,...(baseline?{baseline}:{}),savedAt:new Date().toISOString()};
    const index=library.findIndex(d=>d.id===editing);
    if(index>=0){entry.previous=library[index].deck;library[index]=entry;}else library.push(entry);
    store();editing=entry.id;localStorage.removeItem(DRAFT);
    if(use){onSelect(asCatalog(entry));dialog.close();}
    else{notice='Saved to My decks. Choose “Use this deck” to select it for a game.';view='library';render();}
   }
   if(b.dataset.delete){const entry=library.find(d=>d.id===b.dataset.delete);entry.deleted=Date.now();store();notice='Deck deleted. You can restore it below.';render();}
   if(b.hasAttribute('data-restore')){const entry=library.filter(d=>d.deleted).sort((a,b)=>b.deleted-a.deleted)[0];delete entry.deleted;store();render();}
   if(b.dataset.export)download('netrunner-deck.json',doc(resolve(b.dataset.export)));
   if(b.hasAttribute('data-export-draft'))download('netrunner-deck.json',api.normalize(draft));
   if(b.hasAttribute('data-backup'))download('netrunner-library.json',{schemaVersion:1,kind:'netrunner-deck-library',decks:library});
   if(b.hasAttribute('data-read-import')){
    const text=dialog.querySelector('#builder-import').value.trim();let imported;
    if(text.startsWith('https://')){b.disabled=true;notice='Fetching public list…';imported=await globalThis.NRDeckImport.importURL(text);if(pool==='vantage-preview-v1'||pool==='gateway-v1'&&[imported.identity,...imported.cards.map(c=>c.id)].every(id=>cards[id]?.pack_code==='sg'))imported.pool=pool;}
    else if(text.startsWith('{')){const raw=JSON.parse(text);if(raw.kind==='netrunner-deck-library'){if(!Array.isArray(raw.decks)||raw.decks.length>1000)throw Error('Invalid library backup.');const restored=raw.decks.map(d=>{const deck=api.normalize(d.deck);let kept=null;try{if(d.baseline){const base=api.normalize(d.baseline.deck);if(base.pool===deck.pool&&base.side===deck.side)kept={name:String(d.baseline.name||base.name).slice(0,200),id:String(d.baseline.id||'').slice(0,200),deck:base};}}catch{}return {id:'local-'+crypto.randomUUID(),deck,...(kept?{baseline:kept}:{}),savedAt:new Date().toISOString()};});library.push(...restored);store();view='library';notice=`Imported ${restored.length} local decks.`;render();return;}imported=api.normalize(raw);}
    else imported=api.parseText(text,{pool});
    if(imported.pool!==pool)throw Error('This deck uses another pool. Open the matching game profile before importing.');
    begin(imported);
   }
  }catch(error){notice=error.message;const box=dialog.querySelector('[role=status]');if(box)box.textContent=notice;b.disabled=false;}
 });
 return {open,tune,list,resolve,document:doc};
}
