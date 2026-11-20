(async()=>{
 const tick=()=>new Promise(r=>setTimeout(r,30));
 for(const d of document.querySelectorAll('dialog[open]'))d.close();await tick();
 const $=s=>document.querySelector(s), report={url:location.href,checks:[],errors:[]};
 window.__lobbyAudit=report;
 addEventListener('error',e=>report.errors.push(e.message));
 addEventListener('unhandledrejection',e=>report.errors.push(String(e.reason)));
 const check=(name,pass,detail)=>{report.checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});if(!pass)throw Error(name+': '+JSON.stringify(detail));};
 const click=s=>{const e=$(s);if(!e||e.disabled)throw Error('Missing/disabled '+s);e.scrollIntoView({block:'center'});e.click();};
 const set=(s,value,event='change')=>{const e=$(s);if(e.tagName==='SELECT'&&![...e.options].some(o=>o.value===value))throw Error('Invalid select option '+s+' '+value);e.value=value;e.dispatchEvent(new Event(event,{bubbles:true}));};
 window.__qaClick=click;window.__qaSet=set;window.__qaCheck=check;
 for(const side of ['runner','corp']){
  click('[data-side="'+side+'"]');
  check(side+' role labels',$('#your-character-label').textContent.includes(side==='corp'?'Corporation':'Runner'));
  for(const prefix of ['your','opponent']){
   const ids=[...$('#'+prefix+'-deck').options].map(o=>o.value);
   for(const id of ids){
    set('#'+prefix+'-deck',id);
    const identity=$('#'+prefix+'-character-summary .character-ability').dataset.library;
    for(const control of ['.character-ability','.character-portrait']){
     click('#'+prefix+'-character-summary '+control);
     const image=$('#inspect-content img');await image.decode();
     check(side+'/'+prefix+'/'+id+'/'+control,$('#inspect-dialog').open&&image.naturalWidth===743&&image.src.includes('/'+identity+'-743.webp'));
     check(id+' has ability text',!!$('#inspect-content .card-text').textContent.trim());
     click('#inspect-dialog [data-close]');
    }
    click(prefix==='your'?'#tune-your-deck':'#tune-opponent-deck');
    check(id+' opens legal matching editor',$('.deck-builder').open&&$('#builder-identity').value===identity&&!$('.deck-builder [data-save-use]').disabled,$('.builder-totals').textContent);
    check(id+' faction shown',$('#builder-identity-faction').textContent.startsWith('Faction: '));
    await tick();const card=$('#builder-contents .builder-read');click('#builder-contents [data-builder-preview="'+card.dataset.builderPreview+'"]');
    const art=$('.builder-card-preview img');await art.decode();
    check(id+' builder high-res preview',$('.builder-card-preview').open&&art.naturalWidth===743);
    click('[data-preview-close]');click('.deck-builder [data-close]');await tick();
   }
  }
 }
 click('#deck-button');
 check('View decks shows two lists',$('#deck-dialog').open&&document.querySelectorAll('#deck-content section').length===2);
 for(const id of [...new Set([...document.querySelectorAll('#deck-content [data-library]')].map(b=>b.dataset.library))]){
  click('#deck-content [data-library="'+id+'"]');check('Matchup library card '+id,$('#inspect-dialog').open);click('#inspect-dialog [data-close]');
 }
 click('#deck-dialog [data-close]');
 check('No horizontal page overflow',document.documentElement.scrollWidth<=innerWidth);
 return {url:report.url,checks:report.checks.length,failed:report.checks.filter(c=>!c.pass),errors:report.errors,header:$('#session-label').textContent};
})()
