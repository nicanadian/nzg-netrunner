'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const {createGame}=require('../engine/runtime.cjs'),baseDocuments=require('../engine/deck-document.js');
const {catalog,documents,profile,decks}=require('../engine/vantage.cjs');
const {choices,checkState,checkSnapshot}=require('./engine-smoke.cjs');
const deckDocuments=Object.fromEntries(['runner','corp'].map(side=>[side,decks.find(d=>d.document.side===side).document]));
const plain=value=>JSON.parse(JSON.stringify(value));
const config={side:'runner',control:'scripted',seed:'vantage-first-batch',...profile,deckDocuments};
function setup(code=''){
 const g=createGame({vantage:true});g.api.boot(config);
 vm.runInContext(`
  playerTurn=runner;runner.creditPool=20;runner.clickTracker=4;corp.creditPool=20;corp.clickTracker=3;
  ChangePhase(phases.runnerActionMain);
  var get=id=>AllCards(null).find(card=>card.setNumber===id);
  var hand=id=>{var card=get(id);MoveCard(card,card.player===runner?runner.grip:corp.HQ.cards);return card;};
  var rig=id=>{var card=get(id);MoveCard(card,runner.rig[card.cardType==='program'?'programs':card.cardType==='hardware'?'hardware':'resources']);card.faceUp=true;return card;};
  var ice=(id,server=corp.HQ,rezzed=true)=>{var card=get(id);MoveCard(card,server.ice);card.rezzed=rezzed;return card;};
  ${code}
 `,g.context);return g;
}
async function pick(g,test){
 const s=await g.api.advance(),option=choices(s).find(test);
 assert(option,JSON.stringify({phase:s.phase,choices:choices(s).map(o=>[o.command,o.label,o.card?.number])}));
 g.api.choose({version:s.version,command:option.command,index:option.index});return g.api.advance();
}
async function finish(g,goal){
 for(let i=0;i<20;i++){
  const s=await g.api.advance();if(goal(s))return s;
  const options=choices(s),option=options.find(o=>o.command==='continue')||options.find(o=>o.command==='n');
  assert(option,JSON.stringify({phase:s.phase,options}));g.api.choose({version:s.version,command:option.command,index:option.index});
 }
 throw Error('Effect failed to finish');
}
async function scenario(code,verify){const g=setup(code);try{await verify(g,g.context);checkState(g);checkSnapshot(g,g.api.snapshot());assert.equal(g.api.metrics().diagnostics.length,0);assert.deepEqual(g.errors,[]);}finally{g.close();}}
(async()=>{
 const source=require('../docs/research/vantage-point/source.json'),raw=fs.readFileSync('docs/research/vantage-point/cards.json');
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),source.sha256);
 const inventory=require('../docs/plans/vantage-card-tests.json');assert.equal(inventory.cards.length,66);
 assert.equal(new Set(inventory.cards.map(c=>c.id)).size,66);
 assert.equal(Object.keys(require('../engine/vantage-catalog.js').cards).length,66);
 for(const id of [36004,36013,36021,36024,36029,36052,36063])assert.equal(require('../engine/vantage-catalog.js').coverage[id].definition,true,'The original seven preview cards remain available');
 const registry=createGame({vantage:true});try{assert.deepEqual(plain(registry.context.NRVantagePreview).rulesVersion,profile.rulesVersion);for(const [id,status]of Object.entries(require('../engine/vantage-catalog.js').coverage))assert.equal(!!registry.context.cardSet[id],status.definition);}finally{registry.close();}
 assert.equal(Object.keys(require('../engine/card-catalog.js').cards).length,159,'Preview import does not mutate the base catalog');
 for(const d of decks){const result=documents.validate(d.document);assert.equal(result.valid,true,JSON.stringify(result));assert.equal(result.aiCertified,false);assert(result.totals.size>=result.totals.minimumSize);if(['tao-vantage-pilot-v1','weyland-vantage-pilot-v1'].includes(d.id))assert.equal(result.totals.size,40);assert.equal(baseDocuments.validate(d.document).valid,false);}
 assert.equal(documents.validate({...deckDocuments.runner,pool:'core-v1'}).valid,false,'Vantage cards cannot enter Core Sets');
 const unsupported={...deckDocuments.runner,cards:[...deckDocuments.runner.cards,{id:'99999',count:1}]};
 assert.equal(documents.validate(unsupported).valid,false);
 const withheld=baseDocuments.withCatalog({...catalog,coverage:{...catalog.coverage,'36001':{definition:false}}});
 assert(withheld.validate({...deckDocuments.runner,cards:[...deckDocuments.runner.cards,{id:'36001',count:1}]}).support.some(s=>s.code==='missing-definition'&&s.card==='36001'));
 const old=createGame({core:true});try{assert.throws(()=>old.api.boot(config),/Unsupported/);}finally{old.close();}
 const wrong=createGame({vantage:true});try{assert.throws(()=>wrong.api.boot({side:'runner',rulesVersion:'26.03-core-2',cardPool:'core-v1'}),/fresh Gateway\/Core/);}finally{wrong.close();}
 const blocked=createGame({vantage:true});try{assert.throws(()=>blocked.api.boot({...config,deckDocuments:{...deckDocuments,runner:unsupported}}),/Unknown card|unknown card|unsupported/i);}finally{blocked.close();}

 // Install both copies through legal choices: one tag only, with +1 MU each.
 await scenario('var borrowed=hand(36013);var borrowed2=AllCards(runner).find(card=>card.setNumber===36013&&card!==borrowed);MoveCard(borrowed2,runner.grip);',async(g,c)=>{
  const initial=c.MemoryUnits();await pick(g,o=>o.command==='install'&&o.card?.number===36013);
  await finish(g,()=>c.CheckInstalled(c.borrowed)&&c.runner.tags===1&&c.currentPhase.identifier==='Runner 1.3');
  assert.equal(c.MemoryUnits(),initial+1);assert.equal(c.runner.creditPool,20);assert.equal(c.runner.clickTracker,3);
  await pick(g,o=>o.command==='install'&&o.card?.id!==c.borrowed.localId&&o.card?.number===36013);
  await finish(g,()=>c.CheckInstalled(c.borrowed2)&&c.currentPhase.identifier==='Runner 1.3');assert.equal(c.runner.tags,1);assert.equal(c.MemoryUnits(),initial+2);
 });

 // Vulture Fund pays its seven-credit play cost and finishes both instructions.
 await scenario('playerTurn=corp;hand(36063);ChangePhase(phases.corpActionMain);',async(g,c)=>{
  await pick(g,o=>o.command==='play'&&o.card?.number===36063);
  await finish(g,()=>c.corp.badPublicity===1&&c.currentPhase.identifier==='Corp 2.2');
  assert.equal(c.corp.creditPool,27);assert.equal(c.corp.clickTracker,2);
 });

 // Modern bad-publicity fund is separate from the pool, refills per run,
 // ignores mid-run changes, and empties before run-end responses.
 await scenario('corp.badPublicity=2;runner.creditPool=3;',async(g,c)=>{
  await pick(g,o=>o.command==='run'&&o.server==='HQ');assert.equal(c.runner.temporaryCredits,2);assert.equal(c.Credits(c.runner),3);
  c.LoseCredits(c.runner,9);assert.equal(c.runner.creditPool,0);assert.equal(c.runner.temporaryCredits,2);
  c.corp.badPublicity=4;assert.equal(c.runner.temporaryCredits,2);
  vm.runInContext('ChangePhase(phases.runEnds);',c);assert.equal(c.runner.temporaryCredits,0);
  vm.runInContext('attackedServer=null;MakeRun(corp.RnD);',c);assert.equal(c.runner.temporaryCredits,4);
 });

 // Reverb counts other unrezzed ice across all servers, not rezzed ice or itself.
 await scenario('var reverb=ice(36029,corp.HQ,false);ice(30072,corp.RnD,false);ice(30073,corp.archives,true);',async(g,c)=>{
  assert.equal(c.RezCost(c.reverb),3);
  vm.runInContext('var remote=NewServer("Remote 0",false);corp.remoteServers.push(remote);ice(30062,remote,false);',c);assert.equal(c.RezCost(c.reverb),2);
  vm.runInContext('for(var card of AllCards(corp).filter(c=>c.cardType==="ice"))if(!CheckInstalled(card))ice(card.setNumber,corp.RnD,false);',c);assert.equal(c.RezCost(c.reverb),0);
 });
 await scenario('var reverb=ice(36029,corp.HQ,false);ice(30072,corp.RnD,false);ice(30073,corp.archives,false);corp.creditPool=2;',async(g,c)=>{
  await pick(g,o=>o.command==='run'&&o.server==='HQ');
  await finish(g,s=>choices(s).some(o=>o.command==='rez'&&o.card?.number===36029));
  const quote=choices(g.api.snapshot()).find(o=>o.command==='rez'&&o.card?.number===36029);assert.equal(quote.cost.credits,2);
  await pick(g,o=>o.command==='rez'&&o.card?.number===36029);assert.equal(c.reverb.rezzed,true);assert.equal(c.corp.creditPool,0);
 });

 // Touchstone counts actual event plays, including one before it was installed.
 for(const installedFirst of [true,false])await scenario(`var touchstone=${installedFirst?'rig':'hand'}(36021);hand(30030);hand(30020);`,async(g,c)=>{
  await pick(g,o=>o.command==='play'&&o.card?.number===30030);
  await finish(g,()=>c.currentPhase.identifier==='Runner 1.3');
  assert.equal(c.touchstone.credits,installedFirst?1:0);
  if(!installedFirst){await pick(g,o=>o.command==='install'&&o.card?.number===36021);await finish(g,()=>c.CheckInstalled(c.touchstone)&&c.currentPhase.identifier==='Runner 1.3');}
  await pick(g,o=>o.command==='play'&&o.card?.number===30020);
  await finish(g,()=>c.runner.heap.some(card=>card.setNumber===30020));assert.equal(c.touchstone.credits,installedFirst?1:0);
  assert.equal(c.touchstone.canUseCredits.call(c.touchstone),false,'Hosted credits are unavailable outside a run');
 });

 // Stowaway is installed on its host through the public install transaction,
 // then resolves only for a successful run against that host's current server.
 for(const server of ['HQ','R&D'])await scenario('var stowaway=hand(36024),host=ice(30072,corp.HQ,false);',async(g,c)=>{
  await pick(g,o=>o.command==='install'&&o.card?.number===36024);
  await finish(g,()=>c.CheckInstalled(c.stowaway)&&c.currentPhase.identifier==='Runner 1.3');
  assert.equal(c.stowaway.host,c.host);assert.equal(c.InstalledMemoryCost(),1);
  await pick(g,o=>o.command==='run'&&o.server===server);
  await finish(g,s=>s.history.some(entry=>entry.text==='Run successful'));
  assert.equal(c.runner.creditPool,server==='HQ'?22:20);
 });

 // Paywall loses a pool credit on encounter. Its unless-payment can use the
 // bad-publicity fund even when the Runner has no pool credits remaining.
 for(const funded of [true,false])await scenario(`var wall=ice(36052);runner.creditPool=1;corp.badPublicity=${funded?1:0};`,async(g,c)=>{
  await pick(g,o=>o.command==='run'&&o.server==='HQ');
  await finish(g,()=>c.currentPhase.identifier==='Run Subroutines');
  assert.equal(c.runner.creditPool,0);assert.equal(c.runner.temporaryCredits,funded?1:0);
  await pick(g,o=>o.command==='trigger'&&o.card?.number===36052);
  const options=choices(g.api.snapshot());assert.equal(options.some(o=>o.label==='Pay 1 credit'),funded);
  if(funded)await pick(g,o=>o.command==='continue'&&o.label==='Pay 1 credit');
  else assert(!options.some(o=>o.label==='End the run'),'No confirmation when the only legal outcome is ending the run');
  if(funded){assert.equal(c.runner.temporaryCredits,0);assert.equal(c.attackedServer,c.corp.HQ);}
  else await finish(g,()=>!c.attackedServer);
 });

 // Revision 1 keeps its original choice trace for saved games.
 {const g=createGame({vantage:true});try{g.api.boot({...config,rulesVersion:'26.03-vantage-1'});vm.runInContext('playerTurn=runner;var wall=AllCards(corp).find(c=>c.setNumber===36052);MoveCard(wall,corp.HQ.ice);wall.rezzed=true;runner.creditPool=0;attackedServer=corp.HQ;approachIce=0;encountering=true;subroutine=0;ChangePhase(phases.runSubroutines);',g.context);await pick(g,o=>o.command==='trigger'&&o.card?.number===36052);assert(choices(g.api.snapshot()).some(o=>o.label==='End the run'));await pick(g,o=>o.label==='End the run');await finish(g,()=>!g.context.attackedServer);}finally{g.close();}}

 // Public Corsair trigger: pool, bad-publicity and non-stealth hosted credits
 // cannot pay its reduction; a Touchstone credit can. Ordinary breaks can use pool.
 const encounter='var corsair=rig(36004),touchstone=rig(36021),overclock=hand(30029),barrier=ice(36029);MoveCard(overclock,runner.resolvingCards);overclock.credits=5;attackedServer=corp.HQ;approachIce=0;encountering=true;runner.temporaryCredits=3;';
 await scenario(encounter+'ChangePhase(phases.runEncounterIce);',async(g,c)=>{
  let s=await g.api.advance();assert(!choices(s).some(o=>o.card?.number===36004&&/−3/.test(o.label)),'No stealth money means no reduction, despite other funds');
  assert.throws(()=>c.NRVantageSpendStealth(1,c.corsair,()=>{}),/Insufficient/);assert.equal(c.runner.creditPool,20);assert.equal(c.runner.temporaryCredits,3);
 });
 await scenario(encounter+'touchstone.credits=1;ChangePhase(phases.runEncounterIce);',async(g,c)=>{
  let s=await g.api.advance();
  const option=choices(s).find(o=>o.card?.number===36004&&/−3/.test(o.label));assert(option,JSON.stringify(choices(s)));assert.match(option.cost.note,/stealth/);
  await pick(g,o=>o.card?.number===36004&&/−3/.test(o.label));
  await finish(g,()=>c.touchstone.credits===0);
  assert.equal(c.runner.creditPool,20);assert.equal(c.runner.temporaryCredits,3);assert.equal(c.overclock.credits,5);assert.equal(c.Strength(c.barrier),0);
  await pick(g,o=>o.card?.number===36004&&/Break 1 barrier/.test(o.label));
  await pick(g,o=>o.command==='continue'&&/subroutine 1/.test(o.label));
  await pick(g,o=>o.command==='pay'&&o.payment?.source==='credit pool');
  await finish(g,()=>c.barrier.subroutines.some(sub=>sub.broken));
  assert.equal(c.runner.creditPool,19);
  // Remove the source: the paid strength reduction persists until encounter end.
  vm.runInContext('MoveCard(corsair,runner.heap);',c);assert.equal(c.Strength(c.barrier),0);
  await pick(g,o=>o.command==='n');
  await pick(g,o=>o.command==='trigger'&&o.card?.number===36029);
  await finish(g,()=>c.lingeringEffects.length===0);assert.equal(c.Strength(c.barrier),2);
 });
 console.log('PASS Vantage foundation: pinned inventory, isolated profiles/catalogs, unsupported-card rejection, legal pilot lists, Borrowed Goods install/tags/MU, Vulture Fund cost/effects, modern bad-publicity fund, Reverb discounts, Corsair stealth-only payment and encounter expiry.');
})().catch(e=>{console.error(e);process.exitCode=1;});
