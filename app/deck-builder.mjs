import '../engine/card-catalog.js';
import '../engine/deck-document.js';
import '../engine/deck-import.js';
import '../engine/net-decks.js';
const api=globalThis.NRDeckDocument,{cards}=globalThis.NRCardCatalog;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='netrunner-deck-library-v1',DRAFT='netrunner-deck-draft-v1';
export function mountDeckBuilder({pool,bundled,onSelect}){
 if(pool==='core-v1'){
  const keys=new Set(bundled.map(d=>api.contentKey({...d,pool})));
  bundled=[...bundled,...globalThis.NRNetDecks.catalog.filter(d=>!keys.has(api.contentKey(d.document)))];
 }

 let library=[];try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(saved))library=saved;}catch{}
 let draft=null,editing=null,search='',type='',faction='',maxCost='',maxInfluence='',subtype='',view='library',notice='';
 const dialog=document.createElement('dialog');dialog.className='deck-builder';dialog.setAttribute('aria-label','Deck library and builder');document.body.append(dialog);
 function store(){localStorage.setItem(KEY,JSON.stringify(library));}
 function autosave(){try{localStorage.setItem(DRAFT,JSON.stringify({draft,editing}));}catch{}}
 function list(){return [...bundled,...library.filter(d=>!d.deleted&&d.deck.pool===pool).map(d=>asCatalog(d))];}
 function asCatalog(entry){const d=entry.deck,id=cards[d.identity];return {id:entry.id,local:true,name:d.name,side:d.side,identity:Number(d.identity),pool:d.pool,cards:d.cards.map(c=>[Number(c.id),c.count]),faction:id?.faction_code||'',style:'Your deck',description:'Saved locally · exact list embedded in each game',document:d};}
 function resolve(id){return list().find(d=>d.id===id);}
 function doc(deck){return deck.document||api.normalize({...deck,name:deck.title||deck.name,pool});}
 function open(){view='library';render();dialog.showModal();}
 function begin(d=null,id=null){draft=d?structuredClone(d):{schemaVersion:1,name:'New deck',side:'runner',identity:'30001',pool,cards:[]};editing=id;view='editor';search='';type='';faction='';maxCost='';maxInfluence='';subtype='';notice='';autosave();render();}
 const totals=v=>`${v.totals?.size||0} cards · ${v.totals?.influence||0}/${v.totals?.influenceLimit??'—'} influence${v.deck?.side==='corp'?` · ${v.totals.agenda}/${v.totals.agendaMin}–${v.totals.agendaMax} agenda points`:''}`;
 function render(){
  dialog.innerHTML=`<div class="builder-heading"><div><span class="eyebrow">${pool==='core-v1'?'GATEWAY + ELEVATION':'SYSTEM GATEWAY'}</span><h2>${view==='library'?'Deck library':'Build your deck'}</h2></div><button data-close aria-label="Close deck builder">Close</button></div><p role="status" class="builder-notice">${esc(notice)}</p>`;
  if(view==='library'){
   dialog.insertAdjacentHTML('beforeend',`<div class="builder-tools"><button data-new class="primary">New deck</button><button data-import>Import deck</button>${localStorage.getItem(DRAFT)?'<button data-draft>Resume draft</button>':''}<button data-backup>Back up library</button></div><div class="builder-library">${list().map(d=>{const v=api.validate(doc(d));return `<article><small>${d.local?'MY DECKS':'READY-MADE'}</small><h3>${esc(d.title||d.name)}</h3><p>${esc(cards[d.identity]?.title)}</p><p>${totals(v)}</p><p>${v.valid?(v.warnings.length?'Playable development list · rules/AI audit pending':'Gateway · legal deck'):'Draft · needs changes'}</p><button data-edit="${esc(d.id)}">${d.local?'Edit':'Clone and edit'}</button><button data-select="${esc(d.id)}" ${v.valid?'':'disabled'}>Use this ${esc(d.side)} deck</button>${d.source||d.document?.source?.url?`<a href="${safeURL(d.source||d.document.source.url)}" target="_blank" rel="noreferrer">View source</a>`:''}${d.local?`<button data-export="${esc(d.id)}">Export</button><button data-delete="${esc(d.id)}">Delete</button>`:''}</article>`;}).join('')}</div>${library.some(d=>d.deleted)?'<button data-restore>Restore last deleted deck</button>':''}`);
  }else if(view==='import'){
   dialog.insertAdjacentHTML('beforeend','<p>Paste a public NetrunnerDB decklist URL, deck JSON, a library backup, or a plain-text list including its identity. Imports are saved locally; unsupported cards remain visible for review.</p><label>Deck import<textarea id="builder-import" rows="10"></textarea></label><div class="builder-tools"><button data-read-import class="primary">Review import</button><button data-library>Back to library</button></div>');
  }else{
   const v=api.validate(draft),identities=Object.values(cards).filter(c=>c.type_code==='identity'&&c.side_code===draft.side&&Number.isFinite(c.minimum_deck_size)&&Number.isFinite(c.influence_limit)&&(pool==='core-v1'||c.pack_code==='sg'));
   dialog.insertAdjacentHTML('beforeend',`<div class="builder-tools"><label>Deck name<input id="builder-name" value="${esc(draft.name)}"></label><label>Side<select id="builder-side"><option value="runner" ${draft.side==='runner'?'selected':''}>Runner</option><option value="corp" ${draft.side==='corp'?'selected':''}>Corp</option></select></label><label>Identity<select id="builder-identity">${identities.map(c=>`<option value="${c.code}" ${c.code===draft.identity?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label></div><p class="builder-totals" aria-live="polite">${totals(v)}</p><div class="builder-tools"><button data-save class="primary">Save ${v.valid?'deck':'draft'}</button><button data-export-draft>Export deck</button><button data-library>Back to library</button></div><div class="builder-errors">${[...v.errors,...v.support].map(e=>`<p>${esc(e.message)}</p>`).join('')}${v.warnings.length?'<p>Elevation rules and native AI are still being audited. A definition is not a certification.</p>':''}</div><div class="builder-columns"><section><h3>Find cards</h3><div class="builder-tools"><label>Search cards<input id="builder-search" type="search" value="${esc(search)}"></label><label>Type<select id="builder-type"><option value="">All types</option>${['event','program','hardware','resource','agenda','asset','ice','operation','upgrade'].map(t=>`<option ${type===t?'selected':''}>${t}</option>`).join('')}</select></label><label>Faction<select id="builder-faction"><option value="">All factions</option>${[...new Set(Object.values(cards).filter(c=>c.side_code===draft.side).map(c=>c.faction_code))].map(f=>`<option ${faction===f?'selected':''}>${f}</option>`).join('')}</select></label></div><div class="builder-tools"><label>Subtype<input id="builder-subtype" value="${esc(subtype)}"></label><label>Maximum cost<input id="builder-cost" type="number" min="0" value="${esc(maxCost)}"></label><label>Maximum influence<input id="builder-influence" type="number" min="0" max="5" value="${esc(maxInfluence)}"></label></div><div id="builder-results"></div></section><section><h3>Deck contents</h3><div id="builder-contents"></div><div id="builder-curve"></div></section></div>`);
   renderCards();
  }
 }
 function safeURL(url){try{const u=new URL(typeof url==='object'?url.url:url);return /^https?:$/.test(u.protocol)?esc(u.href):'#';}catch{return '#';}}
 function cardRow(c,quantity,add){return `<article class="builder-card" data-builder-card="${c.code}"><div><strong>${esc(c.title)}</strong><small>${esc(c.type_code)} · ${esc(c.faction_code)} · cost ${c.cost??'—'} · influence ${c.faction_cost??'—'}</small><details><summary>Read full card text</summary><p>${esc(c.stripped_text||c.text)}</p></details></div><div>${add?`<button data-add="${c.code}" aria-label="Add ${esc(c.title)}">+</button>`:`<button data-remove="${c.code}" aria-label="Remove ${esc(c.title)}">−</button><b>${quantity}</b><button data-add="${c.code}" aria-label="Add ${esc(c.title)}">+</button>`}</div></article>`;}
 function renderCards(){
  const entries=Object.values(cards).filter(c=>c.side_code===draft.side&&c.type_code!=='identity'&&(pool==='core-v1'||c.pack_code==='sg')&&(maxCost===''||Number.isFinite(c.cost)&&c.cost<=Number(maxCost))&&(maxInfluence===''||Number.isFinite(c.faction_cost)&&c.faction_cost<=Number(maxInfluence))&&(!subtype||(c.keywords||'').toLowerCase().includes(subtype.toLowerCase()))&&(!type||c.type_code===type)&&(!faction||c.faction_code===faction)&&`${c.title} ${c.keywords||''} ${c.stripped_text||''}`.toLowerCase().includes(search.toLowerCase()));
  dialog.querySelector('#builder-results').innerHTML=entries.map(c=>cardRow(c,0,true)).join('');
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
  if(e.target.id==='builder-side'){draft.side=e.target.value;draft.identity=draft.side==='runner'?'30001':'30035';autosave();render();}
  if(e.target.id==='builder-identity'){draft.identity=e.target.value;autosave();render();}
 });
 dialog.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  try{
   if(b.hasAttribute('data-close'))dialog.close();
   if(b.hasAttribute('data-new'))begin();
   if(b.hasAttribute('data-library')){view='library';render();}
   if(b.hasAttribute('data-import')){view='import';notice='';render();}
   if(b.hasAttribute('data-draft')){const saved=JSON.parse(localStorage.getItem(DRAFT));begin(api.normalize(saved.draft),saved.editing);}
   if(b.dataset.edit){const d=resolve(b.dataset.edit);begin(doc(d),d.local?d.id:null);}
   if(b.dataset.select){const d=resolve(b.dataset.select);onSelect(d);dialog.close();}
   if(b.dataset.add||b.dataset.remove){const id=b.dataset.add||b.dataset.remove,c=draft.cards.find(c=>c.id===id);
    const position=dialog.scrollTop,scope=b.closest('#builder-results')?'builder-results':'builder-contents',listPositions=['builder-results','builder-contents'].map(key=>[key,dialog.querySelector('#'+key).scrollTop]);
    const expanded=[...dialog.querySelectorAll('details[open]')].map(d=>[d.closest('[data-builder-card]').dataset.builderCard,d.closest('#builder-results')?'builder-results':'builder-contents']);
if(b.dataset.add){if(c)c.count++;else draft.cards.push({id,count:1});}else if(c)c.count--;draft.cards=draft.cards.filter(c=>c.count>0);autosave();render();
    for(const [card,key]of expanded){const row=[...dialog.querySelectorAll('#'+key+' [data-builder-card]')].find(r=>r.dataset.builderCard===card);if(row)row.querySelector('details').open=true;}
    const action=b.dataset.add?'add':'remove',focus=[...dialog.querySelectorAll('#'+scope+' button')].find(button=>button.dataset[action]===id);focus?.focus({preventScroll:true});
    for(const [key,top]of listPositions)dialog.querySelector('#'+key).scrollTop=top;dialog.scrollTop=position;
   }
   if(b.hasAttribute('data-save')){const deck=api.normalize(draft),revision=await api.revision(deck),entry={id:editing||'local-'+crypto.randomUUID(),deck,revision,savedAt:new Date().toISOString()};const index=library.findIndex(d=>d.id===editing);if(index>=0){entry.previous=library[index].deck;library[index]=entry;}else library.push(entry);store();editing=entry.id;notice='Saved locally. Existing games keep their original deck snapshot.';view='library';render();}
   if(b.dataset.delete){const entry=library.find(d=>d.id===b.dataset.delete);entry.deleted=Date.now();store();notice='Deck deleted. You can restore it below.';render();}
   if(b.hasAttribute('data-restore')){const entry=library.filter(d=>d.deleted).sort((a,b)=>b.deleted-a.deleted)[0];delete entry.deleted;store();render();}
   if(b.dataset.export)download('netrunner-deck.json',doc(resolve(b.dataset.export)));
   if(b.hasAttribute('data-export-draft'))download('netrunner-deck.json',api.normalize(draft));
   if(b.hasAttribute('data-backup'))download('netrunner-library.json',{schemaVersion:1,kind:'netrunner-deck-library',decks:library});
   if(b.hasAttribute('data-read-import')){
    const text=dialog.querySelector('#builder-import').value.trim();let imported;
    if(text.startsWith('https://')){b.disabled=true;notice='Fetching public list…';imported=await globalThis.NRDeckImport.importURL(text);if(pool==='gateway-v1'&&[imported.identity,...imported.cards.map(c=>c.id)].every(id=>cards[id]?.pack_code==='sg'))imported.pool=pool;}
    else if(text.startsWith('{')){const raw=JSON.parse(text);if(raw.kind==='netrunner-deck-library'){if(!Array.isArray(raw.decks)||raw.decks.length>1000)throw Error('Invalid library backup.');const restored=raw.decks.map(d=>({id:'local-'+crypto.randomUUID(),deck:api.normalize(d.deck),savedAt:new Date().toISOString()}));library.push(...restored);store();view='library';notice=`Imported ${restored.length} local decks.`;render();return;}imported=api.normalize(raw);}
    else imported=api.parseText(text,{pool});
    if(imported.pool!==pool)throw Error('This deck uses another pool. Open the matching game profile before importing.');
    begin(imported);
   }
  }catch(error){notice=error.message;const box=dialog.querySelector('[role=status]');if(box)box.textContent=notice;b.disabled=false;}
 });
 return {open,list,resolve,document:doc};
}
