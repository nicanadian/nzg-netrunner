'use strict';
// Exercise the real builder's event handlers and persistence without launching a browser.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const decks=require('../engine/deck-catalog.js'),docs=require('../engine/deck-document.js');
class Dialog {
 constructor(){this.nodes=new Map();this.events={};this.open=false;this.innerHTML='';this.scrollTop=0;}
 setAttribute(){}
 insertAdjacentHTML(_,html){this.innerHTML+=html;}
 querySelector(key){if(!this.nodes.has(key))this.nodes.set(key,{innerHTML:'',textContent:'',scrollTop:0});return this.nodes.get(key);}
 querySelectorAll(){return [];}
 addEventListener(type,fn){this.events[type]=fn;}
 showModal(){this.open=true;}
 close(){this.open=false;}
 async click(attributes){const button={dataset:Object.fromEntries(Object.entries(attributes).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase()),v])),hasAttribute:k=>k in attributes,closest:()=>null,disabled:false};await this.events.click({target:{closest:()=>button},stopPropagation(){}});}
 input(id,value){this.events.input({target:{id,value}});}
}
(async()=>{
 const storage=new Map(),dialogs=[];
 global.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
 global.document={createElement(){const d=new Dialog();dialogs.push(d);return d;},body:{append(){}}};
 const {mountDeckBuilder,deckCardInfluence}=await import('../app/deck-builder.mjs');
 const {cards}=require('../engine/card-catalog.js');
 assert.equal(deckCardInfluence(cards['30006'],cards['30019']).cost,2);
 assert.equal(deckCardInfluence(cards['30006'],cards['30001']).cost,0);
 assert.equal(deckCardInfluence(cards['30024'],cards['30019']).cost,0,'Conduit’s printed four influence is free for Shaper');
 assert.equal(deckCardInfluence(cards['30030'],cards['30019']).cost,0);
 assert.equal(deckCardInfluence(cards['30044'],cards['30035']).cost,null,'Foreign faction agendas are unavailable rather than free imports');
 for(const identity of Object.values(cards).filter(c=>c.type_code==='identity'))for(const card of Object.values(cards).filter(c=>c.type_code!=='identity'&&c.side_code===identity.side_code)){
  const influence=deckCardInfluence(card,identity);if(influence.cost!==null){const v=docs.validate({identity:identity.code,pool:'core-v1',side:identity.side_code,cards:[{id:card.code,count:3}]});assert.equal(v.totals.influence,influence.cost*3,'Per-copy display agrees with the actual validator across all identities and cards');}
 }
 let selected,refresh=()=>{},refreshCount=0;const selectedDeckIds={...decks.defaults};
 const builder=mountDeckBuilder({pool:'gateway-v1',bundled:decks.catalog,onSelect:d=>{selected=d;selectedDeckIds[d.side]=d.id;},onChange:()=>{refreshCount++;refresh();}}),dialog=dialogs.find(d=>d.className==='deck-builder');
 const preview=dialogs.find(d=>d.className==='builder-card-preview');
 // Reproduce the reported 48/15 exactly, then verify no draft mutation until a choice.
 builder.tune('zahya-v2');const zahyaBefore=JSON.parse(storage.get('netrunner-deck-draft-v1'));
 dialog.events.change({target:{id:'builder-identity',value:'30019'}});
 assert.match(dialog.innerHTML,/48\/15 influence/);assert.match(dialog.innerHTML,/Load Shaper deck/);
 assert.deepEqual(JSON.parse(storage.get('netrunner-deck-draft-v1')),zahyaBefore,'Selecting a different character does not silently convert the existing list');
 await dialog.click({'data-character-cancel':''});assert.deepEqual(JSON.parse(storage.get('netrunner-deck-draft-v1')),zahyaBefore);
 dialog.events.change({target:{id:'builder-identity',value:'30019'}});await dialog.click({'data-character-starter':''});
 const taoStart=JSON.parse(storage.get('netrunner-deck-draft-v1'));assert.equal(taoStart.draft.identity,'30019');assert.equal(docs.validate(taoStart.draft).totals.influence,12);assert.equal(docs.contentKey(taoStart.draft),docs.contentKey({...decks.catalog.find(d=>d.id==='tao-v1'),pool:'gateway-v1'}));assert.equal(taoStart.editing,null);
 dialog.events.change({target:{id:'builder-side',value:'corp'}});assert(!dialog.innerHTML.includes('data-character-keep'),'A side switch never offers to keep wrong-side cards');await dialog.click({'data-character-starter':''});assert(docs.validate(JSON.parse(storage.get('netrunner-deck-draft-v1')).draft).valid);
 builder.tune('tao-v1');
 const contents=()=>dialog.querySelector('#builder-contents').innerHTML,results=()=>dialog.querySelector('#builder-results').innerHTML;
 const row=(html,id)=>html.split('data-builder-card="'+id+'"')[1]?.split('</article>')[0]||'';
 assert.match(row(contents(),'30006'),/2 influence per copy/);assert.match(row(contents(),'30006'),/6 total in deck/);
 assert.match(row(contents(),'30024'),/0 influence per copy/);assert.match(row(contents(),'30024'),/0 total in deck/);
 assert.match(contents(),/30006-300.webp/);
 const beforeCopyLimit=storage.get('netrunner-deck-draft-v1');await dialog.click({'data-add':'30006'});assert.equal(storage.get('netrunner-deck-draft-v1'),beforeCopyLimit,'Cannot add a fourth copy through stale actions');assert.match(row(results(),'30006'),/disabled title="Maximum 3 copies/);
 dialog.input('builder-influence','0');assert(!row(results(),'30006'));assert(row(results(),'30024'),'Free-faction cards stay in the zero-influence filter');
 dialog.events.change({target:{id:'builder-identity',value:'30001'}});await dialog.click({'data-character-keep':''});assert.match(row(contents(),'30006'),/0 influence per copy/);assert.match(row(contents(),'30024'),/4 influence per copy/);assert(row(results(),'30006'));assert(!row(results(),'30024'),'Filter follows the changed identity');
 const draftBefore=storage.get('netrunner-deck-draft-v1');await dialog.click({'data-builder-preview':'30024'});assert(preview.open);assert(dialog.open);assert.match(preview.innerHTML,/30024-743.webp/);assert.match(preview.innerHTML,/Card text/);assert.match(preview.innerHTML,/4 influence per copy/);assert.equal(storage.get('netrunner-deck-draft-v1'),draftBefore,'Reading a card does not change the draft');
 await preview.events.click({target:{closest:()=>true},stopPropagation(){}});assert(!preview.open);assert(dialog.open,'Closing the full card returns to the editor');
 builder.tune('loup-v1');assert(dialog.open);assert.match(dialog.innerHTML,/Save &amp; use this deck/);assert.match(dialog.innerHTML,/Trash &amp; viruses · custom/);assert.match(dialog.innerHTML,/Swap cards one-for-one/);
 dialog.input('builder-name','My first Loup');
 await dialog.click({'data-remove':'30030'});assert.match(dialog.innerHTML,/Needs changes before you can play/);assert.match(dialog.innerHTML,/data-save-use class="primary" disabled/);assert.match(dialog.innerHTML,/-1 Sure Gamble/);
 await dialog.click({'data-save-use':''});assert.equal(selected,undefined,'Cannot use an invalid deck even through its event handler');assert(dialog.open);
 await dialog.click({'data-add':'30020'});assert.match(dialog.innerHTML,/Ready to play/);assert.match(dialog.innerHTML,/\+1 Creative Commission/);
 await dialog.click({'data-save-use':''});assert(!dialog.open,'Save & use returns directly to setup');assert(selected.local);assert.equal(selected.name,'My first Loup');assert.equal(selectedDeckIds.runner,selected.id);assert.equal(docs.validate(selected.document).valid,true);assert.equal(selected.document.cards.find(c=>c.id==='30030').count,2);assert.equal(selected.document.cards.find(c=>c.id==='30020').count,1);
 const firstID=selected.id;
 const saved=JSON.parse(storage.get('netrunner-deck-library-v1'));assert.equal(saved.length,1);assert.equal(saved[0].id,firstID);assert.equal(storage.has('netrunner-deck-draft-v1'),false);
 assert.equal(decks.catalog.find(d=>d.id==='loup-v1').cards.find(([id])=>id===30030)[1],3,'Tuning does not alter ready-made decks');
 // Use the actual lobby's start handler: the selected list must reach the game config.
 const source=fs.readFileSync('app/table.js','utf8'),nodes=new Map();let config;
 const context=vm.createContext({$:id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);},role:'runner',crypto,localStorage,DATA:require('../assets/card-data.json'),esc:String,NRDeckDocument:docs,NR_CORE_PREVIEW:false,selectedDeckIds,deckBuilder:builder,resolveDecks:ids=>Object.fromEntries(['runner','corp'].map(side=>[side,builder.resolve(ids[side])])),start:value=>config=value});
 vm.runInContext(source.slice(source.indexOf('$("#start-button").onclick ='),source.indexOf("$('#build-deck-button').onclick")),context);nodes.get('#start-button').onclick();
 assert.deepEqual(JSON.parse(JSON.stringify(config.deckDocuments.runner)),selected.document,'Starting uses the tuned list rather than its baseline');assert.equal(config.side,'runner');assert.equal(config.deckIds,undefined);
 builder.tune(firstID);dialog.input('builder-name','Loup revised');await dialog.click({'data-save-use':''});assert.equal(selected.id,firstID);assert.equal(JSON.parse(storage.get('netrunner-deck-library-v1')).length,1,'Editing a saved deck does not create duplicates');
 builder.tune('built-to-last-v2');await dialog.click({'data-save-use':''});assert.equal(selected.side,'corp');assert.equal(selectedDeckIds.corp,selected.id,'Tuning the AI deck selects the correct side');assert.equal(selectedDeckIds.runner,firstID);
 vm.runInContext(source.slice(source.indexOf('function deckStats('),source.indexOf('\nfunction viewDecks()')),context);refresh=()=>context.renderCharacterPicker();
 builder.tune(firstID);await dialog.click({'data-remove':'30030'});await dialog.click({'data-save':''});assert.match(dialog.innerHTML,/Saved to My decks/);assert.equal(selectedDeckIds.runner,'loup-v1','Saving an invalid edit replaces its lobby selection with a playable deck');assert(refreshCount>0);assert.equal(JSON.parse(storage.get('netrunner-lobby-decks-gateway-v1')).runner,'loup-v1','Persisted selection stays playable');
 const second=mountDeckBuilder({pool:'gateway-v1',bundled:decks.catalog,onSelect(){}});assert.equal(second.resolve(firstID).name,'Loup revised');assert.equal(docs.validate(second.document(second.resolve(firstID))).valid,false,'Invalid drafts survive reload for further editing');
 const savedBeforeSwitch=JSON.parse(storage.get('netrunner-deck-library-v1'));
 builder.tune(firstID);dialog.events.change({target:{id:'builder-identity',value:'30019'}});await dialog.click({'data-character-starter':''});assert.deepEqual(JSON.parse(storage.get('netrunner-deck-library-v1')),savedBeforeSwitch,'Loading another character’s starter never overwrites a saved custom deck');
 await dialog.click({'data-new':''});dialog.events.change({target:{id:'builder-identity',value:'30019'}});assert.equal(JSON.parse(storage.get('netrunner-deck-draft-v1')).draft.cards.length,0,'Choosing an identity for a new empty deck does not inject a starter list');
 console.log('PASS reported 48/15 character-switch regression, starter/keep/cancel choices, side-safe decks, copy-limit guard, identity-aware influence/filters, live faction changes, thumbnails/full-resolution preview, direct tune, guided swaps, invalid-use guard, save-and-use selection, actual game-start snapshot, saved edits, AI-side selection and persistent drafts.');
})().catch(error=>{console.error(error);process.exitCode=1;});
