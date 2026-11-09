const $=s=>document.querySelector(s);
const [fixture, results]=await Promise.all(['/eval/reference-game.json','/eval/artifacts/browser-results.json'].map(url=>fetch(url).then(r=>r.json())));
function update(){
 const step=$('#position').value,width=Number($('#resolution').value);
 const before=results.rows.find(r=>r.version==='before'&&r.step===step&&r.viewport.width===width);
 const after=results.rows.find(r=>r.version==='after'&&r.step===step&&r.viewport.width===width);
 $('#before').src='/eval/artifacts/'+before.image;$('#after').src='/eval/artifacts/'+after.image;
 const cp=fixture.checkpoints.find(c=>c.id===step);
 $('#position-note').textContent=cp.notes;
 $('#video-position').href=fixture.source.url+'&t='+cp.videoTime;
 $('#live-position').href='/?reference=example&step='+step;
 const yes=v=>v?'Pass':'Needs correction';
 const checks=[['Roots behind defensive ice',r=>yes(r.servers.every(s=>s.rootsBehindIce))],['Inner → outer ice order',r=>yes(r.servers.every(s=>s.innerToOuterOrder))],['Identity represents HQ',r=>yes(r.hqIdentity)],['Cards outside visible board',r=>r.clippedBoardCards.length],['Extra Corp / Runner board scroll',r=>r.boardScroll.map(s=>s.vertical+'px').join(' / ')],['Installed Runner card width',r=>r.rigCardWidths[0]+'px'],['Card names in hand + rig',r=>r.readableNames],['Hidden-card identity leaks',r=>r.hiddenNumberLeaks],['All visible card images loaded',r=>yes(r.images.every(i=>i.loaded))]];
 $('#metrics').replaceChildren(...checks.map(([label,get])=>{const row=document.createElement('tr');for(const text of [label,get(before),get(after)]){const cell=document.createElement('td');cell.textContent=text;row.append(cell)}return row}));
}
$('#position').onchange=update;$('#resolution').onchange=update;
$('#wipe').oninput=()=>{const value=$('#wipe').value;$('#before-clip').style.clipPath=`inset(0 ${100-value}% 0 0)`;$('#split').style.left=value+'%'};
for(const text of fixture.adaptations){const p=document.createElement('p');p.textContent=text;$('#adaptations').append(p)}update();
