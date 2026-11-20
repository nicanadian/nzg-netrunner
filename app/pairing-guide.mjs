import {setupUrl,poolUrl} from './guide-flow.mjs';
const $=s=>document.querySelector(s);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const title=d=>d.displayName||d.name;
export function visibleRunners(data,pool,includeTests){return ownDecks(data,pool,'runner',includeTests);}
export function ownDecks(data,pool,side,includeTests){return data.decks.filter(d=>d.pool===pool&&d.side===side&&(includeTests||d.purpose==='play'));}
export function opponentRows(data,pool,runner,includeTests){return matchupRows(data,pool,'runner',runner,includeTests);}
export function matchupRows(data,pool,side,id,includeTests){const other=side==='runner'?'corp':'runner',opponents=new Map(ownDecks(data,pool,other,includeTests).map(d=>[d.id,d]));return data.pairs.filter(p=>p.pool===pool&&p[side]===id&&opponents.has(p[other])).map(p=>({...p,deck:opponents.get(p[other])}));}
export function resultLabel(pair,side='runner'){if(!pair.completed)return 'No completed games';const rate=(side==='runner'?pair.runnerWins:pair.corpWins)/pair.completed;return rate>=.4&&rate<=.6?'Close in this sample':rate<.4?`Harder for ${side==='runner'?'Runner':'Corp'}`:`Harder for ${side==='runner'?'Corp':'Runner'}`;}
export const lobbyUrl=poolUrl;
const coreNbn='nrdb-abc6721f-4680-40fe-b189-cdf19f416bd1-96f1749f8285';
export const learningPairs={
 'gateway-v1':[['Familiar pressure','loup-v1','built-to-last-v2'],['Tag and score','tao-v1','reality-plus-v2']],
 'core-v1':[['Learn Phoenix’s tools','phoenix-core-v1',coreNbn],['Practice bioroid defense','phoenix-core-v1','precision-design-core-v1']],
 'vantage-preview-v1':[['Familiar identities','loup-vantage-tailor-v1','jinteki-vantage-pilot-v1'],['Stealth credits','tao-vantage-pilot-v1','hb-vantage-tempo-v1'],['A new Runner','vic-play-v1','weyland-vantage-tools-v2']]};
const lessonAdvice={
 'loup-v1':'Carnivore spends two cards from your grip to trash an accessed card. Keep a damage buffer and enough memory for the breaker rig.',
 'loup-vantage-tailor-v1':'The Tungsten Tailor weakens every ice. Check the new strength before paying; you still need an appropriate breaker.',
 'vic-play-v1':'Tailgate rewards HQ pressure. Vic can spend a click and 1 credit to draw a card and remove a tag; budget for that action instead of ignoring tags.',
 'phoenix-core-v1':'Read Phoenix and the virus tools before the first run. Keep income and relevant breakers ready; an advanced remote may demand attention before another central run.',
 'weyland-vantage-tools-v2':'Vulture Fund takes bad publicity: each point supplies the Runner a temporary credit every run. One such credit can pay a one-credit breaker activation on every attempt. Reassess your defenses against the visible rig; a large credit pool is not a protected server.',
 'built-to-last-v2':'Bank rez money before exposing an agenda. Advance a protected scoring lane and reassess it when a new breaker appears.',
 'reality-plus-v2':'Watch your identity’s tag reward. Keep rez money and a scoring plan; Anoetic Void needs 2 credits and two expendable HQ cards when the run arrives.',
 'precision-design-core-v1':'Bioroid subroutines may be broken with clicks. Read the whole encounter and protect a scoring lane; another ice and an upgrade have different roles.',
 'hb-vantage-tempo-v1':'Caveat Emptor trades income against the Runner’s next-turn clicks. Reassess defenses and read Vertigo’s last-click consequence before a late run.',
 'jinteki-vantage-pilot-v1':'Advance with a plan for damage or scoring. For the Runner, keep a grip buffer and read damage choices before contesting an advanced remote.'
};
// Carry intentions forward, never results or decisions from an earlier revision.
export function copyBaselinePlan(current,baseline){
 const notes={...current},copied=[];
 for(const id of ['change','cost','plan'])if(!(typeof notes[id]==='string'&&notes[id].trim())&&typeof baseline?.[id]==='string'&&baseline[id].trim()){notes[id]=baseline[id].slice(0,3000);copied.push(id);}
 return {notes,copied};
}
export function openingHTML(pool,side,selected){
 const checklist=side==='corp'?[
  'Before keeping an opening hand, look for playable income and affordable ice. An expensive defensive card is not useful if you cannot pay to rez it.',
  'Choose a scoring lane: protect a remote, keep the ice’s rez cost available, then install and advance an agenda when you can defend it. Installing ice does not activate it; rez it at the approach prompt.',
  'Check the visible Runner rig before committing: does it have the right breaker, enough strength and enough credits? Reassess after a new breaker or a Tāo ice swap. Ice that stopped the last run may not stop the next.',
  'If using Anoetic Void, reserve 2 credits and two expendable cards in HQ as well as any ice rez money. Its printed rez cost is 0; paying for its run-ending ability is separate. Do not spend or install your last two HQ cards and still count on it.'
 ]:[
  'Before keeping an opening hand, look for playable income and a route to useful cards: draw, a relevant breaker, or a pressure tool. A hand full of expensive programs can stall; consider a mulligan when you cannot fund the opening.',
  'Build income before spending everything on the rig. For the first run, check the ice type and current strength, the matching breaker and the total cost to boost and break. Leave credits for stealing or trashing when needed.',
  'Keep cards in your grip as a damage buffer. Read all subroutines before choosing which to break; a later conditional effect can become dangerous after an earlier tag.',
  'Recheck advancing remotes each turn. Repeated central runs are not the goal if the Corp is about to score. If a memory prompt would trash your only useful breaker, cancel and reconsider the install.'
 ];
 const stealth=side==='runner'&&selected==='tao-vantage-pilot-v1'?'<p><strong>Stealth opening:</strong> fund income and install Touchstone before the first event you want to use to load it. Only the first event each turn adds a credit; build reserves across turns. Keep the matching breaker and its ordinary break cost funded too. Mulligan priorities are a usable economy and a workable setup, not a promise to draw every combo piece immediately.</p>':'';
 const phoenix=side==='runner'&&selected==='phoenix-core-v1'?'<details class="guide-tactics"><summary>Worked encounter · Phoenix versus Doomscroll</summary><p>Suppose you have <strong>0 tags</strong> and an appropriate sentry breaker with enough strength and credits. Doomscroll’s subroutines resolve in order: give 1 tag; do 1 net damage; do 2 net damage if you have at least 2 tags.</p><p>Break the tag and the unconditional 1 net damage. You can let the final conditional subroutine resolve: at 0 tags it does no damage. If that run becomes successful, this can satisfy Phoenix’s first-time-each-turn condition: gain 1 credit and the Corp trashes 1 card from HQ. You still have to get through the rest of the run.</p><p>Recheck tags and other effects every time. At 2 or more tags the last subroutine deals damage; an earlier unbroken tag can put you over that threshold. Do not accept damage just to trigger the identity.</p><p><a href="/assets/cards-display/35063-743.webp" target="_blank" rel="noopener">Read Doomscroll ↗</a> · <a href="/assets/cards-display/35001-743.webp" target="_blank" rel="noopener">Read Phoenix ↗</a></p></details>':'';
 return '<details class="guide-tactics"><summary>Opening and mulligan checklist · '+(side==='corp'?'Corp':'Runner')+'</summary><ul>'+checklist.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>'+stealth+'<p><strong>Adapt the experiment:</strong> if viruses are purged or a central becomes too expensive, rebuild or attack another server. Record why you changed course. Drawing the edited card, installing it and getting value from its ability are different observations; a win alone does not confirm the edit.</p></details>'+phoenix;
}
export async function mountGuide(){
 try{
  const response=await fetch('/app/pairing-guide-data.json');if(!response.ok)throw Error('Unavailable guide');const data=await response.json();const recipeResponse=await fetch('/app/guide-recipes.json');const recipes=recipeResponse.ok?await recipeResponse.json():[];
  const q=new URLSearchParams(location.search),entryPool=data.decks.some(d=>d.pool===q.get('pool'))?q.get('pool'):'vantage-preview-v1';let pool=entryPool,side=q.get('side')==='corp'?'corp':'runner',selected=q.get(side)||'';
  const input=$('#guide-pool'),select=$('#guide-runner'),tests=$('#guide-tests'),sideInput=$('#guide-side');input.value=pool;sideInput.value=side;
  const byId=id=>data.decks.find(d=>d.id===id),record=(r,c)=>data.pairs.find(p=>p.runner===r&&p.corp===c);
  let custom=null;try{custom=JSON.parse(localStorage.getItem('netrunner-deck-library-v1')||'[]').find(e=>e.id===selected&&!e.deleted&&e.deck?.pool===pool&&e.deck?.side===side)||null;}catch{}if(custom&&data.decks.some(d=>d.id===custom.baseline?.id&&d.pool===pool&&d.side===side))selected=custom.baseline.id;
  const original={pool:entryPool,side,runner:q.get('runner'),corp:q.get('corp')};$('#back-to-lobby').href=original.runner&&original.corp?setupUrl(original):poolUrl(entryPool);$('#back-to-lobby').textContent='← Return to original setup';
  if(q.get(side)?.startsWith('local-')){$('#guide-custom-context').hidden=false;$('#guide-custom-context').textContent='Your lobby has a saved custom deck selected. The records below describe bundled baselines, not that revision. Return to original setup keeps your saved selection.';}
  const noteIds=['change','cost','plan','result','next'];let noteKey='';
  const notesKey=id=>'netrunner-learning-notes-v1:'+pool+':'+side+':'+id;
  function readNotes(key){try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
  function customBaseline(){return custom&&data.decks.find(d=>d.id===custom.baseline?.id&&d.pool===pool&&d.side===side);}
  function loadNotes(){
   noteKey=notesKey(custom?.id||selected);const notes=readNotes(noteKey);
   for(const id of noteIds)$('#note-'+id).value=typeof notes[id]==='string'?notes[id].slice(0,3000):'';
   $('#guide-note-status').textContent='Notes for '+(custom?custom.deck.name+(customBaseline()?' (custom; baseline shown above)':' (custom; no linked baseline)'):title(byId(selected)))+'.';
   const baseline=customBaseline();$('#guide-note-copy').hidden=!baseline;
   $('#guide-note-copy-help').textContent=baseline?'From '+title(baseline)+'. Fills empty hypothesis, cost and opening fields only. Existing text, observations and next decisions stay as they are.':'';
  }
  function saveNotes(message){const notes=Object.fromEntries(noteIds.map(id=>[id,$('#note-'+id).value.slice(0,3000)]));try{localStorage.setItem(noteKey,JSON.stringify(notes));$('#guide-note-status').textContent=(typeof message==='string'?message+' ':'')+'Saved on this device for '+(custom?.deck.name||title(byId(selected)))+'.';}catch{$('#guide-note-status').textContent='Notes could not be saved on this device. Download them before leaving.';}return notes;}
  const link=(r,c,tune,text)=>`<a href="${esc(setupUrl({pool,side,runner:r,corp:c,tune}))}">${esc(text)}</a>`;
  function recipeHTML(recipe){if(!recipe)return '<p>Choose one small change. Use the construction checklist below; no worked edit is provided for this list yet.</p>';const t=recipe.after,b=recipe.before;return `<details class="guide-recipe"><summary>Try one edit · ${esc(recipe.goal)}</summary><p><strong>−1 ${esc(recipe.cut.title)} / +1 ${esc(recipe.add.title)}</strong></p><p>Before: ${b.size} cards, ${b.influence}/${b.influenceLimit} influence. After: ${t.size} cards, ${t.influence}/${t.influenceLimit} influence${recipe.side==='corp'?`, ${t.agenda} agenda points (required ${t.agendaMin}–${t.agendaMax})`:''}. This example is legal, not proven stronger.</p><p>${esc(recipe.tradeoff)}</p><p><strong>Observe:</strong> ${esc(recipe.observe)}</p>${[recipe.cut,recipe.add].map(c=>`<details><summary>Read ${esc(c.title)}</summary><p>${esc(c.text)}</p><a href="/assets/cards-display/${c.id}-743.webp" target="_blank" rel="noopener">Full-size card image ↗</a></details>`).join('')}</details>`;}
  function render(){
   const available=ownDecks(data,pool,side,tests.checked);if(!available.some(d=>d.id===selected))selected=available.find(d=>d.id==='loup-vantage-tailor-v1')?.id||available[0].id;
   $('#guide-deck-label').textContent='My '+(side==='runner'?'Runner':'Corp')+' deck';select.innerHTML=available.map(d=>`<option value="${esc(d.id)}">${esc(title(d))} · ${esc(d.identity.split(':')[0])}${d.purpose==='interaction'?' · TEST PILOT':''}</option>`).join('');select.value=selected;
   const pairs=matchupRows(data,pool,side,selected,tests.checked),sizes=[...new Set(pairs.map(p=>p.completed))].sort((a,b)=>a-b);
   $('#guide-evidence').textContent=`${sizes.join(' or ')} games per pairing · ${pairs.length} opponents${sizes.includes(6)?' · Six-game results are preliminary.':''}`;
   $('#guide-rate-direction').textContent=`Percentages show ${side==='runner'?'Runner':'Corp'} wins in AI tests. Lower means harder for your selected side. Raw counts stay visible.`;
   $('#guide-results').innerHTML=pairs.map(p=>{const percent=Math.round((side==='runner'?p.runnerWins:p.corpWins)/p.completed*100);return `<article class="matchup-row"><div><strong>${esc(title(p.deck))}</strong><small>${esc(p.deck.identity)}${p.deck.purpose==='interaction'?' · interaction test pilot':''}</small></div><div><span class="matchup-rate">${percent}% ${side==='runner'?'Runner':'Corp'} wins</span><div class="matchup-bar" role="img" aria-label="${percent}% ${side} wins in ${p.completed} games"><span style="width:${percent}%"></span></div><small>Runner ${p.runnerWins} · Corp ${p.corpWins} · ${p.completed} games</small></div><div class="matchup-band">${esc(resultLabel(p,side))}${p.completed<30?'<small>Preliminary sample</small>':''}<div class="guide-actions">${link(p.runner,p.corp,null,'Use this pairing')}${link(p.runner,p.corp,side,'Tune my deck')}</div></div></article>`;}).join('');
   $('#learning-title').textContent=pool==='gateway-v1'?'First Gateway experiments':pool==='core-v1'?'Learning with Gateway + Elevation':'First Vantage games after Gateway';
   $('#guide-opening').innerHTML=openingHTML(pool,side,selected);
   $('#learning-intro').textContent='Pick one goal for your '+(side==='runner'?'Runner':'Corp')+' deck. These examples are chosen for their lesson; read each actual test record and sample size.';
   $('#learning-pairings').innerHTML=learningPairs[pool].map(([goal,r,c])=>{const p=record(r,c),own=side==='runner'?r:c,recipe=recipes.find(x=>x.id===own);return `<article><h3>${esc(goal)}</h3><p>${esc(title(byId(r)))}<br>vs ${esc(title(byId(c)))}</p><p class="pairing-record">Runner ${p.runnerWins}/${p.completed} · Corp ${p.corpWins}/${p.completed}</p><p>Before play: prepare income and the right breaker or rez budget. Read damage subroutines and reassess advancing remotes.</p>${own==='tao-vantage-pilot-v1'?'<p><strong>Keep the dependency:</strong> install Touchstone before the relevant event. Only the first event each turn loads it; another event that turn does not load it again. Touchstone is unique: do not plan on multiple active copies. Event → Touchstone credit → Corsair reduction. Against Palisade protecting a remote (strength 4 before other modifiers), pay two stealth credits for two reductions (4 → 1 → 0), then a separate ordinary credit can pay the break. On a central, unmodified Palisade is strength 2 and needs one reduction. Check its current displayed strength. Empty stealth reserves cannot fund the reduction. <a href="/assets/cards-display/36021-743.webp" target="_blank" rel="noopener">Read Touchstone ↗</a> · <a href="/assets/cards-display/36004-743.webp" target="_blank" rel="noopener">Read Corsair ↗</a></p>':''}${lessonAdvice[own]?`<p>${esc(lessonAdvice[own])}</p>`:''}${recipeHTML(recipe)}<div class="guide-actions">${link(r,c,null,'Use this pairing')}${link(r,c,side,'Open starting deck to edit')}</div></article>`;}).join('');
   const chosen=pairs[0];$('#guide-basics-link').href=setupUrl({pool,side,runner:chosen.runner,corp:chosen.corp,tune:'basics'});loadNotes();
  }
  input.addEventListener('change',()=>{pool=input.value;custom=null;selected='';render();});select.addEventListener('change',()=>{selected=select.value;custom=null;render();});tests.addEventListener('change',render);sideInput.addEventListener('change',()=>{side=sideInput.value;custom=null;selected='';render();});
  $('#guide-note-form').addEventListener('submit',e=>e.preventDefault());for(const id of noteIds)$('#note-'+id).addEventListener('input',saveNotes);
  $('#guide-note-copy-button').addEventListener('click',()=>{
   const baseline=customBaseline();if(!baseline)return;
   const current=Object.fromEntries(noteIds.map(id=>[id,$('#note-'+id).value])),source=readNotes(notesKey(baseline.id)),{notes,copied}=copyBaselinePlan(current,source);
   if(!copied.length){$('#guide-note-status').textContent='Nothing copied: the baseline has no saved plan for an empty field. Existing custom notes are unchanged.';return;}
   for(const id of copied)$('#note-'+id).value=notes[id];
   saveNotes('Copied '+copied.length+' empty plan '+(copied.length===1?'field':'fields')+' from '+title(baseline)+'. Existing text and results were preserved.');
  });
  $('#guide-note-export').addEventListener('click',()=>{const notes=saveNotes(),url=URL.createObjectURL(new Blob([JSON.stringify({pool,side,baseline:custom?customBaseline()||null:byId(selected),customDeck:custom?.deck||null,notes},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='netrunner-learning-notes.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),0);});render();
 }catch(error){$('#guide-error').hidden=false;$('#learning-pairings').textContent='Pairing suggestions are temporarily unavailable.';for(const id of ['#guide-pool','#guide-runner','#guide-tests','#guide-side'])$(id).disabled=true;}
}
if(typeof document!=='undefined')mountGuide();
