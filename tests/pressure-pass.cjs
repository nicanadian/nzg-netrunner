'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {createGame}=require('../engine/runtime.cjs');
const {fixture}=require('./vantage-harness.cjs');
(async()=>{
 const {breakerPlan,breakerFundingQuote,approvedPaymentChoice}=await import('../app/interaction.mjs');
 const {runDrawerModel}=await import('../app/run-drawer.mjs');
 // The actual retest position: Lethe fired on an earlier run, then was derezzed.
 const raw=require('../docs/playtesting/critics/retest/experienced-game-replay.json');
 const session=raw.session||raw.evidence?.session||raw;
 const replay=createGame({vantage:true});
 try{
  replay.api.boot(session.config);let s=await replay.api.advance(),i=0;
  for(;s.version<629&&i<session.choices.length;i++){replay.api.choose(session.choices[i]);s=await replay.api.advance();}
  assert.equal(s.version,629);assert.equal(s.run.card.title,'Lethe');assert.equal(s.run.card.rezzed,false);
  assert.equal(s.run.iceOutcome,'passed-unrezzed');assert(s.run.card.subroutines.every(x=>!x.fired));
  assert.equal(runDrawerModel(s).remaining,0);
  if(process.env.CAPTURE_PRESSURE_FIXTURES)fs.writeFileSync('docs/playtesting/critics/pressure-pass/inactive-ice-replay.json',JSON.stringify({...session,choices:session.choices.slice(0,i),conceded:false},null,2)+'\n');
 }finally{replay.close();}
 const g=fixture(`var breaker=rig(30032),wall=ice(30072);wall.strength=6;
 var clock=card(30029,runner.resolvingCards);clock.credits=5;
 runner.creditPool=3;runner.temporaryCredits=1;attackedServer=corp.HQ;approachIce=0;encountering=true;ChangePhase(phases.runEncounterIce);`);
 try{
  let s=await g.api.advance(),tool=s.run.tools.find(t=>t.card.number===30032),funding=breakerFundingQuote(tool);
  assert.equal(funding.total,6);assert.deepEqual(Array.from(funding.sources.filter(s=>s.budget),s=>[s.label,s.budget]),[['bad publicity',1],['Overclock',5]]);
  const plan={cardId:tool.card.id,iceStrength:s.run.card.strength,iceText:s.run.card.subroutines.map(s=>s.text).join('|'),funding,paused:false};
  const initial=s;let steps=0,payments=0;
  for(;steps<40;steps++){
   const model=breakerPlan(s,plan.cardId);if(model.status==='complete'||model.status==='invalid')break;
   const payment=approvedPaymentChoice(s,plan);assert(!payment?.reason,payment?.reason);
   const next=payment?.next||model.next;assert(next,JSON.stringify({model,phase:s.phase}));
   const previous=s.historyCount;g.api.choose({version:s.version,command:next.command,index:next.index});s=await g.api.advance();
   for(const entry of s.historyCount>previous?s.history.slice(-(s.historyCount-previous)):[]){const m=entry.text.match(/^Runner spent (\d+) credits? from (.+)$/);const source=m&&funding.sources.find(p=>p.label===m[2]);if(source)source.used+=Number(m[1]);}
   if(next.command==='pay')payments++;
  }
  assert(steps<40);assert.equal(g.context.wall.subroutines.every(s=>s.broken),true);assert.equal(g.context.runner.creditPool,3);assert.equal(g.context.runner.temporaryCredits,0);assert.equal(g.context.clock.credits,0);assert(payments>0,'Native payment choices were exercised');
  const changed={...initial,run:{...initial.run,card:{...initial.run.card,strength:99}}};assert.match(approvedPaymentChoice(changed,plan).reason,/ice changed/);
  const budget=breakerFundingQuote(initial.run.tools.find(t=>t.card.id===plan.cardId));
  const p2={...plan,funding:budget};
  assert.equal(approvedPaymentChoice(initial,{...p2,paused:true}),null);
  const shifted=structuredClone(initial);shifted.run.tools.find(t=>t.card.id===plan.cardId).funding.sources[0].available++;
  assert.match(approvedPaymentChoice(shifted,p2).reason,/source changed/);
  const foreign={...initial,phase:{...initial.phase,guide:{kind:'credit-payment',sourceId:'other',doing:'using',remaining:1}}};
  assert.match(approvedPaymentChoice(foreign,p2).reason,/different cost/);
  assert.equal(breakerFundingQuote({...tool,funding:{sources:[{sourceId:'stealth',label:'Touchstone',available:20,expiring:false}]}}),null,'Persistent stealth credits are never silently allocated');
  assert.equal(breakerFundingQuote({...tool,funding:{...tool.funding,manualReason:'Defense response'}}),null);
 }finally{g.close();}
 const defense=fixture(`var breaker=rig(30032),wall=ice(30072),grid=root(36065);var clock=card(30029,runner.resolvingCards);clock.credits=5;attackedServer=corp.HQ;approachIce=0;encountering=true;ChangePhase(phases.runEncounterIce);`);
 try{const s=await defense.api.advance(),tool=s.run.tools.find(t=>t.card.number===30032);assert.match(tool.funding.manualReason,/defense/);assert.equal(breakerFundingQuote(tool),null,'Known Shackleton outside-pool response requires manual allocation');}finally{defense.close();}
 // Only offered legal actions can be substituted; private cards are never a Runner targeting input.
 const ai=fixture(`var a=card(30067),wall=ice(30072,corp.RnD,true);playerTurn=corp;corp.clickTracker=3;corp.creditPool=9;ChangePhase(phases.corpActionMain);`,{aiPolicy:'pressure-v1'});
 try{const options={gain:[{}],advance:[{card:ai.context.a}],install:[]};const selected=await ai.context.NRPressurePolicy.select({preferred:null},options,{command:'gain',index:0},7);assert.equal(selected.command,'advance');assert.equal(selected.index,0);assert.equal(ai.api.aiAudit().totals.corp.overrides,1);
  vm.runInContext('var defense=card(30072);',ai.context);
  const lane=await ai.context.NRPressurePolicy.select({preferred:null},{gain:[{}],install:[{card:ai.context.defense,server:null}]},{command:'gain',index:0},7);
  assert.equal(lane.command,'install','A new remote has zero ice-install cost and stages a scoring lane');}finally{ai.close();}
 const legacy=fixture('',{aiPolicy:'native-v1'});try{const actual=await legacy.context.NRPressurePolicy.select({preferred:null},{gain:[{}],run:[{server:legacy.context.corp.RnD}]},{command:'gain',index:0},9);assert.equal(actual.command,'gain');}finally{legacy.close();}
 console.log('PASS pressure pass: recorded stale Lethe regression, exact expiring-source approval, native payment/boost/break loop, pool preserved, changed-source/ice/cost/response guards, manual stealth, legal AI overrides and legacy policy.');
})().catch(e=>{console.error(e);process.exitCode=1;});
