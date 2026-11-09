'use strict';
const assert=require('node:assert/strict');
const cards=require('../assets/card-data.json');
const {plans}=require('./recorded-game-plans.cjs');
function complete(id){
 const ledger=require(`../eval/recorded-games/${id}.json`), plan=plans[id], zones={}, assigned={corp:{},runner:{}}, slots={corp:[],runner:[]};
 for(const side of ['corp','runner']){
  slots[side]=Array.from({length:ledger.decks[side].size},(_,i)=>({slot:i+1,number:null,nonAgenda:false,reason:[]}));
  zones[side]={deck:[...slots[side]],hand:[],max:5};
 }
 const bind=(side,s,n,why)=>{
  assert.ok(s,`${id}: no ${side} slot for ${n} ${why}`);
  if(s.number!==null){assert.equal(s.number,n,`${id} slot ${side}/${s.slot} ${why}`);return s;}
  assert.ok(!s.nonAgenda||cards[n].type_code!=='agenda',`${id}: agenda in recorded non-agenda access ${why}`);
  assert.ok((assigned[side][n]||0)<ledger.decks[side].cards[n],`${id}: exhausted ${side} ${n} ${why}`);
  s.number=n;s.reason.push(why);assigned[side][n]=(assigned[side][n]||0)+1;return s;
 };
 const need=(side,n,why)=>{
  const hand=zones[side].hand;
  return hand.find(s=>s.number===n)||bind(side,hand.find(s=>s.number===null&&(!s.nonAgenda||cards[n].type_code!=='agenda')),n,why);
 };
 const draw=(side,n,why)=>{for(let i=0;i<n;i++){const s=zones[side].deck.shift();assert.ok(s,`${id}: deckout ${side} ${why}`);s.reason.push(why);zones[side].hand.push(s);}};
 const take=(side,n,why)=>{const s=need(side,n,why);zones[side].hand.splice(zones[side].hand.indexOf(s),1);return s;};
 if(id==='lt-starter'){
  // Corp-view frame 02:36 fixes the first six-card multiset; frame 03:50
  // fixes the extra C1 draw. Exact opening-vs-mandatory order remains chosen.
  [30072,30067,30069,30039,30040,30040,30037].forEach((n,i)=>bind('corp',slots.corp[i],n,'visible C1 hand / retrospective installs'));
 }
 draw('corp',5,'opening hand');draw('runner',5,'opening hand');
 let verbal=false,nico=false,nicoTicks=0;
 const result=[];
 for(const t of plan){
  const tag=`${id}/${t.id}`;
  if(t.preRez===30037){nico=true;nicoTicks=0;}
  if(t.side==='corp'){
   if(nico&&++nicoTicks===3){draw('corp',1,`${tag} empty Nico draw`);nico=false;}
   draw('corp',1,`${tag} mandatory draw`);
  }
  let firstDraw=true;
  for(const a of t.actions){
   const why=`${tag} ${a.op} ${a.n||a.event||a.s||''}`;
   if(a.probeSeamlessNew)need('corp',30040,why+' source attempted Seamless');
   if(a.op==='draw'){draw(t.side,t.side==='runner'&&verbal&&firstDraw?2:1,why);firstDraw=false;}
   if(a.op==='install'||a.op==='play'){
    take(t.side,a.n,why);
    if(a.n===30034)verbal=true;
    if(a.n===30021||a.n===30002)draw('runner',4,why+' draw 4');
   }
   if(a.op==='score'&&a.n===30070){draw('corp',2,why+' optional draw 2');zones.corp.max+=2;}
   if(a.op==='run'){
    if(a.event)take('runner',a.event,why+' event');
    if(a.damage?.length&&!a.fatal&&a.ice.some(i=>i.fire&&i.ice===30073))for(const n of a.damage)take('runner',n,why+' net damage');
    if(a.event===30028)draw('runner',1,why+' successful Jailbreak draw');
    const used=[];
    for(const access of a.access){
     let s;
     if(a.s==='HQ'){
      if(access.n===null){s=zones.corp.hand.find(x=>!used.includes(x));s.nonAgenda=true;}
      else{s=zones.corp.hand.find(x=>x.number===access.n&&!used.includes(x))||bind('corp',zones.corp.hand.find(x=>x.number===null&&!used.includes(x)),access.n,why+' access');}
      used.push(s);if(access.mode!=='leave')zones.corp.hand.splice(zones.corp.hand.indexOf(s),1);
     }else if(a.s==='R&D'){
      s=zones.corp.deck.find(x=>!used.includes(x));
      if(access.n!==null)bind('corp',s,access.n,why+' R&D access');else s.nonAgenda=true;
      used.push(s);if(access.mode!=='leave')zones.corp.deck.splice(zones.corp.deck.indexOf(s),1);
     }
     if(access.n===30037&&access.mode==='trash')nico=false;
    }
    if(a.damage?.length&&(a.fatal||!a.ice.some(i=>i.fire&&i.ice===30073)))for(const n of a.damage)take('runner',n,why+' Urtica damage');
   }
  }
  // Discard only known source cards or as-yet unidentified slots. The latter
  // are constrained to non-agendas to preserve later Archives observations.
  const z=zones[t.side];t.discardSlots=[];
  while(z.hand.length>z.max){
   const s=t.discard?need(t.side,t.discard,tag+' source discard'):z.hand.find(x=>x.number===null);
   assert.ok(s,`${tag}: no unspecified discard slot`);s.nonAgenda=true;
   t.discardSlots.push(s.slot);z.hand.splice(z.hand.indexOf(s),1);
  }
  result.push({turn:t.id,corpHand:zones.corp.hand.length,runnerHand:zones.runner.hand.length});
 }
 // Complete unobserved slots using remaining official quantities. Constrained
 // non-agendas first, so ordinary filler cannot consume their last candidates.
 for(const side of ['corp','runner']){
  const empty=slots[side].filter(s=>s.number===null).sort((a,b)=>Number(b.nonAgenda)-Number(a.nonAgenda));
  for(const s of empty){
   const n=Object.keys(ledger.decks[side].cards).find(n=>(assigned[side][n]||0)<ledger.decks[side].cards[n]&&(!s.nonAgenda||cards[n].type_code!=='agenda'));
   bind(side,s,Number(n),'synthetic hidden-state completion');
  }
 }
 return {id,ledger,plan,slots,abstractHands:result,config:{side:'corp',rulesVersion:'26.03-local-1',...(id==='neon-starter'?{agendaPointTarget:6}:{}),seed:`full-ledger-${id}`,control:'scripted',orderedDecks:true,decks:Object.fromEntries(['corp','runner'].map(side=>[side,{identity:ledger.decks[side].identity,cards:slots[side].map(s=>s.number).reverse()}]))}};
}
if(require.main===module)for(const id of Object.keys(plans)){const r=complete(id);console.log(id,r.abstractHands);}
module.exports={complete};
