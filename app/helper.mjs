const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountHelper({getContext,onOpen,onCard}) {
  const $ = s => document.querySelector(s), panel = $('#game-helper'), messages = $('#helper-messages');
  let conversation = [], sending = false, selected = null, gameKey = null, request = null, config = null;
  const add = (role,text,{mode,sources=[],turn}={}) => {
    const article=document.createElement('article'); article.className=`helper-message ${role}`;
    article.innerHTML=`<small>${role==='user' ? 'YOU' : mode==='ai' ? 'AI GAME HELPER' : 'BUILT-IN GUIDE'}${turn ? ` · TURN ${turn}` : ''}</small><div>${escape(text).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')}</div>${sources.length ? `<footer>${sources.filter(s=>/^https:\/\/(rules\.|nullsignal\.)/.test(s.url)).map(s=>`<a href="${escape(s.url)}" target="_blank" rel="noopener">${escape(s.title)} ↗</a>`).join('')}</footer>` : ''}`;
    messages.append(article); messages.scrollTop=messages.scrollHeight;
  };
  const setSelected = card => {
    selected=card && !card.hidden ? card : null;
    $('#helper-card-context').hidden=!selected;
    $('#helper-card-label').textContent=selected ? `Discussing ${selected.title}` : '';
  };
  async function open(card) {
    if (card) setSelected(card);
    panel.hidden=false; document.body.classList.add('helper-open'); $('#helper-button').setAttribute('aria-expanded','true');
    onOpen?.(); $('#helper-question').focus();
    if (!config?.configured) {
      try { const res=await fetch('/api/helper'); if(!res.ok)throw Error(); config=await res.json();
        $('#helper-connection').textContent=config.configured ? config.provider==='codex' ? 'Codex connected · uses your subscription' : 'AI configured · visible game context' : config.message || 'Built-in guide · AI chat not connected';
        $('#helper-setup-note').hidden=config.configured;
      } catch { $('#helper-connection').textContent='Helper server unavailable'; }
    }
  }
  function close() { panel.hidden=true; document.body.classList.remove('helper-open'); $('#helper-button').setAttribute('aria-expanded','false'); $('#helper-button').focus(); }
  $('#helper-button').onclick=()=>panel.hidden ? open() : close(); $('#helper-close').onclick=close;
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
  $('#helper-clear-card').onclick=()=>setSelected(null);
  $('#helper-card-label').onclick=()=>selected && onCard?.(selected);
  $('#helper-question').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('#helper-form').requestSubmit();}};
  $('#helper-form').onsubmit=async e=>{
    e.preventDefault(); if(sending)return;
    const input=$('#helper-question'), question=input.value.trim(); if(!question)return;
    const context=getContext(selected); sending=true; $('#helper-send').disabled=true; $('#helper-error').hidden=true;
    $('#helper-thinking').hidden=false; add('user',question,{turn:context.game?.turn}); input.value='';
    const controller=new AbortController(); request=controller;
    try {
      const res=await fetch('/api/helper',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({question,context,messages:conversation.slice(-10)})});
      const result=await res.json(); if(!res.ok)throw Error(result.error || 'The helper could not answer.');
      if(request!==controller)return;
      add('assistant',result.text,{mode:result.mode,sources:result.sources,turn:context.game?.turn});
      conversation.push({role:'user',content:question},{role:'assistant',content:result.text});
    } catch(error) {
      if(request!==controller)return;
      $('#helper-error').textContent=error.name==='AbortError' ? 'Question cancelled. Your game is unchanged.' : error.message;
      $('#helper-error').hidden=false; input.value=question;
    } finally {
      if(request===controller){sending=false;request=null;$('#helper-send').disabled=false;$('#helper-thinking').hidden=true;}
    }
  };
  document.querySelectorAll('[data-helper-question]').forEach(button=>button.onclick=()=>{$('#helper-question').value=button.dataset.helperQuestion;$('#helper-form').requestSubmit();});
  $('#helper-copy').onclick=async()=>{try{await navigator.clipboard.writeText(JSON.stringify(getContext(selected),null,2));$('#helper-copy').textContent='Copied visible situation ✓';}catch{$('#helper-error').textContent='Copy is unavailable in this browser.';$('#helper-error').hidden=false;}};
  return {open,isOpen:()=>!panel.hidden,setSelected,newGame(key){if(key===gameKey)return;gameKey=key;request?.abort();request=null;sending=false;conversation=[];setSelected(null);messages.innerHTML='';$('#helper-send').disabled=false;$('#helper-thinking').hidden=true;$('#helper-error').hidden=true;$('#helper-copy').textContent='Copy visible situation';}};
}
