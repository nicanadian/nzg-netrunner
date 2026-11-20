const $=s=>document.querySelector(s);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function visibleRunners(data,pool,includeTests){return data.decks.filter(d=>d.pool===pool&&d.side==='runner'&&(includeTests||d.purpose==='play'));}
export function opponentRows(data,pool,runner,includeTests){const corps=new Map(data.decks.filter(d=>d.pool===pool&&d.side==='corp'&&(includeTests||d.purpose==='play')).map(d=>[d.id,d]));return data.pairs.filter(p=>p.pool===pool&&p.runner===runner&&corps.has(p.corp)).map(p=>({...p,deck:corps.get(p.corp)}));}
export function resultLabel(pair){if(!pair.completed)return 'No completed games';const rate=pair.runnerWins/pair.completed;return rate>=.4&&rate<=.6?'Close in this sample':rate<.4?'Harder for Runner':'Harder for Corp';}
export function lobbyUrl(pool){return pool==='vantage-preview-v1'?'/?vantage-preview=1':pool==='core-v1'?'/?core-preview=1':'/';}
export async function mountGuide(){
 try{
  const response=await fetch('/app/pairing-guide-data.json');if(!response.ok)throw Error('Unavailable guide');const data=await response.json();
  const pools=new Set(data.decks.map(d=>d.pool)),query=new URLSearchParams(location.search).get('pool');let pool=pools.has(query)?query:'vantage-preview-v1',runner='';
  const pair=(r,c)=>data.pairs.find(p=>p.runner===r&&p.corp===c),deck=id=>data.decks.find(d=>d.id===id);
  $('#learning-pairings').innerHTML=[['Familiar identities','loup-vantage-tailor-v1','jinteki-vantage-pilot-v1','Loup adds a small new-card package while both characters remain familiar.'],['Learn stealth credits','tao-vantage-pilot-v1','hb-vantage-tempo-v1','Practice Touchstone and Corsair while keeping familiar identities.'],['Try a new Runner','vic-play-v1','weyland-vantage-tools-v2','Learn Vic’s tag management with a complete, familiar breaker rig.']].map(([heading,r,c,detail])=>{const p=pair(r,c);return `<article><h3>${esc(heading)}</h3><p>${esc(deck(r).name)}<br>vs ${esc(deck(c).name)}</p><p class="pairing-record">Runner ${p.runnerWins}/${p.completed} · ${Math.round(p.runnerWins/p.completed*100)}% wins</p><p>${esc(detail)}</p></article>`;}).join('');
  const input=$('#guide-pool'),select=$('#guide-runner'),tests=$('#guide-tests');input.value=pool;
  function render(){const rows=visibleRunners(data,pool,tests.checked);if(!rows.some(d=>d.id===runner))runner=rows.find(d=>d.id==='loup-vantage-tailor-v1')?.id||rows[0].id;select.innerHTML=rows.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}${d.purpose==='interaction'?' · TEST PILOT':''}</option>`).join('');select.value=runner;
   const pairs=opponentRows(data,pool,runner,tests.checked),sizes=[...new Set(pairs.map(p=>p.completed))].sort((a,b)=>a-b);$('#guide-evidence').textContent=`${sizes.join(' or ')} games per pairing · ${pairs.length} opponents${sizes.includes(6)?' · Six-game results are preliminary.':''}`;
   $('#guide-results').innerHTML=pairs.map(p=>{const percent=Math.round(p.runnerWins/p.completed*100);return `<article class="matchup-row"><div><strong>${esc(p.deck.name)}</strong><small>${esc(p.deck.identity)}${p.deck.purpose==='interaction'?' · interaction test pilot':''}</small></div><div><span class="matchup-rate">${percent}% Runner wins</span><div class="matchup-bar" role="img" aria-label="Runner won ${p.runnerWins} of ${p.completed} games; ${percent} percent"><span style="width:${percent}%"></span></div><small>Runner ${p.runnerWins} · Corp ${p.corpWins} · ${p.completed} games</small></div><div class="matchup-band">${esc(resultLabel(p))}${p.completed<30?'<small>Preliminary sample</small>':''}</div></article>`;}).join('');
  }
  input.addEventListener('change',()=>{pool=input.value;runner='';render();});select.addEventListener('change',()=>{runner=select.value;render();});tests.addEventListener('change',render);
  $('#back-to-lobby').href=lobbyUrl(pool);render();
 }catch(error){$('#guide-error').hidden=false;$('#learning-pairings').textContent='Pairing suggestions are temporarily unavailable.';for(const id of ['#guide-pool','#guide-runner','#guide-tests'])$(id).disabled=true;}
}
if(typeof document!=='undefined')mountGuide();
