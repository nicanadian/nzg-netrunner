// Inject into an owned browser tab. Clicks rendered controls only: no engine
// state mutation, worker messages, replay injection, or native AI decisions.
window.installUIPlaytest = () => {
 const visible=e=>e&&e.getClientRects().length&&!e.disabled;
 window.uiTest ||= {clicks:[],errors:[]};
 window.uiStep = () => {
  const s=window.localTable?.state;
  if(s?.terminal)return {stop:'terminal',terminal:s.terminal};
  const click=(b,why)=>{if(!visible(b))return {wait:true};const entry={turn:s?.turn,phase:s?.phase?.identifier,text:b.innerText.trim(),why};uiTest.clicks.push(entry);b.click();return entry;};
  const q=sel=>[...document.querySelectorAll(sel)].filter(visible);
  const dialog=q('dialog[open]')[0];
  if(dialog){
   if(dialog.id==='inspect-dialog'){
    const action=q('#inspect-dialog [data-inspect-command]')[0];
    return click(action||q('#inspect-dialog [data-close]')[0],'inspected card action');
   }
   return {stop:'dialog',id:dialog.id,text:dialog.innerText};
  }
  const skip=q('[data-opponent-skip]')[0];if(skip)return click(skip,'skip recorded animation');
  if(localTable.busy)return {wait:true};
  const buttons=q('#decisions button,#run-footer button').filter(b=>!b.hasAttribute('data-back')&&!b.hasAttribute('data-inspect-tool'));
  const by=cmd=>buttons.find(b=>b.dataset.command===cmd);
  const text=re=>buttons.find(b=>re.test(b.innerText));
  if(!buttons.length)return {wait:true};
  if(s?.phase.identifier.includes('Mulligan'))return click(text(/Keep this hand/),'keep opening hand');
  const plan=buttons.find(b=>b.hasAttribute('data-plan-review')||b.hasAttribute('data-plan-step'));if(plan)return click(plan,'review or continue quoted break');
  const multiPending=document.querySelector('#decisions [data-multi-confirm]');
  if(multiPending?.disabled){const choice=buttons.find(b=>b.getAttribute('aria-pressed')==='false');if(choice)return click(choice,'choose another distinct card');}
  const multi=buttons.find(b=>b.hasAttribute('data-multi-confirm'));if(multi)return click(multi,'confirm selected cards');
  if(by('score'))return click(by('score'),'score agenda');
  if(by('steal'))return click(by('steal'),'steal agenda');
  const opts=buttons.filter(b=>b.hasAttribute('data-option'));
  if(opts.length&&opts.every(b=>b.dataset.command==='run'||b.dataset.cancel))return click(opts.find(b=>/^R&D/.test(b.innerText))||opts[0],'choose run target');
  const main=s?.phase.identifier===(s?.side==='runner'?'Runner 1.3':'Corp 2.2');
  if(main){
   const own=s[s.side],hand=q('#hand [data-card]');
   const econ=hand.find(b=>/Sure Gamble|Hedge Fund|Creative Commission|Wildcat Strike|Predictive Planogram/.test(b.getAttribute('aria-label'))&&b.classList.contains('legal'));
   if(econ)return click(econ,'inspect economy card');
   const rig=s.runner.rig.programs.concat(s.runner.rig.hardware,s.runner.rig.resources).map(c=>c.title);
   if(s.side==='runner'){
    const card=hand.find(b=>/Cleaver|Unity|Echelon|Conduit|Mayfly|DZMZ Optimizer|Telework Contract|Pantograph/.test(b.getAttribute('aria-label'))&&b.classList.contains('legal')&&!rig.some(n=>b.getAttribute('aria-label').startsWith(n)));
    if(card)return click(card,'inspect useful rig card');
    if(own.hand.length<3&&by('draw'))return click(by('draw'),'recover grip before running');
    if(own.credits<5&&by('gain'))return click(by('gain'),'build credits');
    if(by('run')&&own.clicks>=2)return click(by('run'),'test another run');
    if(by('draw')&&own.hand.length<5)return click(by('draw'),'draw options');
   }else{
    if(by('advance')&&s.corp.servers.some(server=>server.root.some(c=>c.type==='agenda')))return click(by('advance'),'advance installed agenda');
    const card=hand.find(b=>s.corp.hand.some(c=>c.id===b.dataset.card&&c.type==='agenda')&&b.classList.contains('legal'));
    if(card)return click(card,'inspect installable Corp card');
    if(by('draw')&&own.hand.length<3&&own.clicks>=2)return click(by('draw'),'draw Corp options');
    if(by('install')&&own.clicks>=2)return click(by('install'),'choose Corp installation');
   }
   if(by('gain'))return click(by('gain'),'basic economy');
  }
  if(s?.phase.identifier==='Corp 2.2'&&by('rez'))return click(by('rez'),'rez available card');
  const breakOption=text(/^Break subroutine/);if(breakOption)return click(breakOption,'break selected subroutine');
  const trigger=text(/Botulus.*Break|Place 1 virus counter|Take 3 credit/);if(trigger)return click(trigger,'use visible card ability');
  if(by('rez'))return click(by('rez'),'rez approached ice');
  if(by('advance')){const agendas=s.corp.servers.flatMap(server=>server.root).filter(c=>c.type==='agenda');return click(buttons.find(b=>agendas.some(c=>b.innerText.includes(c.title)))||by('advance'),'choose advancement');}
  const confirm=text(/Pay|Install .*|Confirm|Break all|Continue break/);if(confirm)return click(confirm,'confirm quoted action');
  if(by('continue'))return click(by('continue'),'resolve offered effect');
  if(by('n'))return click(by('n'),'continue timing or finish card access');
  if(by('access'))return click(by('access'),'access next card');
  const valid=buttons.filter(b=>!b.hasAttribute('data-cancel')&&!b.hasAttribute('data-secondary-ability'));
  if(valid.length)return click(valid[0],'first remaining rendered choice');
  return {stop:'unhandled',buttons:buttons.map(b=>b.outerHTML)};
 };
 window.uiBatch=async(count=40)=>{
  const actions=[];let idle=0;
  for(let i=0;i<count;i++){
   const result=uiStep();if(result.stop)return {result,actions};
   if(result.wait){if(++idle>120)return {result:{stop:'no progress',ui:document.querySelector('#decisions').innerText},actions};i--;}
   else{idle=0;actions.push(result);}
   await new Promise(r=>setTimeout(r,result.wait?100:350));
  }
  return {actions,turn:localTable.state?.turn,phase:localTable.state?.phase,terminal:localTable.state?.terminal};
 };
 return {ready:true};
};
installUIPlaytest();
