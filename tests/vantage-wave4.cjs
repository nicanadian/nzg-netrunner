'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {createGame}=require('../engine/runtime.cjs'),{documents,profile,decks}=require('../engine/vantage.cjs');
const {choices,checkState,checkSnapshot}=require('./engine-smoke.cjs');
const runner=structuredClone(decks[0].document),corp=structuredClone(decks.find(d=>d.id==='hb-vantage-tempo-v1').document);
for(const [d,from,to]of [[runner,36013,36003],[runner,30028,36011],[runner,30027,36016],[corp,30042,36034],[corp,30075,36033],[corp,30039,36029],[corp,30073,36052]]){d.cards.find(c=>+c.id===from).count--;d.cards.push({id:String(to),count:1});}
for(const d of [runner,corp]){d.cards=d.cards.filter(c=>c.count);assert.equal(documents.validate(d).valid,true,JSON.stringify(documents.validate(d)));}
function fixture(code){const g=createGame({vantage:true});g.api.boot({side:'runner',control:'scripted',seed:'vantage-wave4',...profile,deckDocuments:{runner,corp}});vm.runInContext(`playerTurn=runner;corp.creditPool=20;corp.clickTracker=3;runner.creditPool=20;runner.clickTracker=4;ChangePhase(phases.runnerActionMain);
 var get=id=>AllCards(null).find(c=>c.setNumber===id);var hand=id=>{var c=get(id);MoveCard(c,c.player===runner?runner.grip:corp.HQ.cards);return c;};var rig=id=>{var c=get(id);MoveCard(c,runner.rig[c.cardType==='program'?'programs':c.cardType==='hardware'?'hardware':'resources']);c.faceUp=true;return c;};var ice=id=>{var c=get(id);MoveCard(c,corp.HQ.ice);c.rezzed=true;return c;};${code}`,g.context);return g;}
async function pick(g,test){const s=await g.api.advance(),o=choices(s).find(test);assert(o,JSON.stringify({phase:s.phase,choices:choices(s).map(o=>[o.command,o.label,o.card?.number])}));g.api.choose({version:s.version,command:o.command,index:o.index});return g.api.advance();}
async function finish(g,goal,turns=false){for(let i=0;i<100;i++){const s=await g.api.advance();if(goal(s))return s;const l=choices(s),o=l.find(o=>o.command==='continue')||l.find(o=>o.command==='n')||(turns&&(l.find(o=>o.command==='discard')||l.find(o=>o.command==='gain')));assert(o,JSON.stringify({phase:s.phase,choices:l.map(o=>[o.command,o.label])}));g.api.choose({version:s.version,command:o.command,index:o.index});}throw Error('Effect did not finish '+JSON.stringify({phase:g.api.snapshot().phase,choices:choices(g.api.snapshot()).map(o=>[o.command,o.label]),history:g.api.snapshot().history.slice(-8)}));}
async function scenario(code,run){const g=fixture(code);try{await run(g,g.context);checkState(g);checkSnapshot(g,g.api.snapshot());assert.deepEqual(g.errors,[]);assert.equal(g.api.metrics().diagnostics.length,0);}finally{g.close();}}
(async()=>{
 await scenario('var tailor=rig(36003),corsair=rig(36004),wall=ice(36029);wall.strength=1;attackedServer=corp.HQ;approachIce=0;encountering=true;ChangePhase(phases.runEncounterIce);',async(g,c)=>{
  assert.equal(c.Strength(c.wall),0);const credits=c.runner.creditPool;await pick(g,o=>o.card?.number===36004&&/Break 1 barrier/.test(o.label));await finish(g,()=>c.wall.subroutines[0].broken);assert.equal(c.runner.creditPool,credits,'Pay one to break and gain one from Tailor');
  await pick(g,o=>o.card?.number===36004&&/Break 1 barrier/.test(o.label));await finish(g,()=>c.wall.subroutines[1].broken);assert.equal(c.runner.creditPool,credits-1,'Second qualifying break this turn earns nothing');
  vm.runInContext('wall.strengthCannotBeLowered=true;',c);assert.equal(c.Strength(c.wall),1,'Cannot-lower strength restriction respected');
 });
 await scenario('var tailor=hand(36003),corsair=rig(36004),wall=ice(36029);wall.strength=0;attackedServer=corp.HQ;approachIce=0;encountering=true;Break(wall.subroutines[0]);wall.subroutines[0].broken=false;rig(36003);ChangePhase(phases.runEncounterIce);',async(g,c)=>{
  const before=c.runner.creditPool;await pick(g,o=>o.card?.number===36004&&/Break 1 barrier/.test(o.label));await finish(g,()=>c.wall.subroutines[0].broken);assert.equal(c.runner.creditPool,before-1,'An earlier qualifying break counts even before Tailor entered play');
 });
 for(const rezzed of [false,true])for(const remove of [false,true])await scenario(`var under=rig(36016),wall=ice(36052);runner.tags=1;wall.rezzed=false;if(${rezzed})Rez(wall,true);`,async(g,c)=>{
  await finish(g,()=>c.currentPhase.identifier==='Runner 1.3');const grip=c.runner.grip.length;await finish(g,s=>c.under.cardLocation===c.runner.heap||choices(s).some(o=>o.label==='Draw 2 cards'||o.command==='trigger'&&o.card?.number===36016),true);if(choices(g.api.snapshot()).some(o=>o.command==='trigger'&&o.card?.number===36016))await pick(g,o=>o.command==='trigger'&&o.card?.number===36016);
  if(rezzed)await pick(g,o=>o.label===(remove?'Remove 1 tag':'Draw 2 cards'));
  await finish(g,()=>rezzed?c.runner.tags===(remove?0:1)&&c.runner.grip.length===grip+(remove?0:2):c.under.cardLocation===c.runner.heap);
  assert.equal(c.under.cardLocation===c.runner.heap,!rezzed);
 });
 await scenario('var operation=hand(36011);for(var c of InstalledCards(runner))MoveCard(c,runner.heap);',async(g)=>{assert(!choices(await g.api.advance()).some(o=>o.card?.number===36011),'Sell Out unavailable without a resource');});
 await scenario('var operation=hand(36011),resource=rig(36016);runner.identityCard.automaticOnPlay={Resolve(card){if(card.setNumber===36011)runner.sellOutPaidBeforePlay=resource.cardLocation===runner.heap;}};',async(g,c)=>{
  const grip=c.runner.grip.length;const quote=choices(await g.api.advance()).find(o=>o.command==='play'&&o.card?.number===36011);assert.match(quote.cost.note,/Trash 1 installed resource/);await pick(g,o=>o.command==='play'&&o.card?.number===36011);await finish(g,s=>s.phase.title==='Sell Out');assert.equal(c.runner.creditPool,19);assert.equal(c.runner.clickTracker,3);
  await pick(g,o=>o.command==='trash'&&o.card?.number===36016);await finish(g,()=>c.currentPhase.identifier==='Runner 1.3');assert.equal(c.runner.sellOutPaidBeforePlay,true);assert.equal(c.runner.creditPool,23);assert.equal(c.runner.grip.length,grip+1);assert(c.runner.heap.includes(c.resource));
 });
 await scenario('var op=hand(36033),first=ice(36029),second=ice(30038);playerTurn=corp;corp.clickTracker=1;ChangePhase(phases.corpActionMain);',async(g)=>{assert(!choices(await g.api.advance()).some(o=>o.card?.number===36033),'Double operation needs two clicks');});
 await scenario('var op=hand(36033),first=ice(36029),second=ice(30038);playerTurn=corp;ChangePhase(phases.corpActionMain);',async(g,c)=>{
  const option=choices(await g.api.advance()).find(o=>o.card?.number===36033);assert.equal(option.cost.clicks,2);await pick(g,o=>o.command==='play'&&o.card?.number===36033);await finish(g,()=>!c.first.rezzed&&!c.second.rezzed&&c.currentPhase.identifier==='Corp 2.2');assert.equal(c.corp.clickTracker,1);assert.equal(c.corp.creditPool,30,'Printed Reverb 4 plus Ansel 6, regardless of rez discounts');assert.equal(c.first.rezzed,false);assert.equal(c.second.rezzed,false);
 });
 await scenario('var op=hand(36033);ice(36029);playerTurn=corp;ChangePhase(phases.corpActionMain);',async(g)=>{assert(!choices(await g.api.advance()).some(o=>o.card?.number===36033),'Two distinct rezzed ice required');});
 for(const type of ['agenda','asset','ice'])await scenario(`var op=hand(36034),target=get(${type==='agenda'?30067:type==='asset'?30037:30038});MoveCard(target,corp.archives.cards);playerTurn=corp;ChangePhase(phases.corpActionMain);`,async(g,c)=>{
  await pick(g,o=>o.command==='play'&&o.card?.number===36034);await pick(g,o=>o.command==='continue'&&o.card?.id===c.target.localId&&o.server==='New remote');await finish(g,()=>c.CheckInstalled(c.target)&&c.currentPhase.identifier==='Corp 2.2');assert.equal(c.corp.clickTracker,1);assert.equal(c.corp.creditPool,19);assert.equal(!!c.target.rezzed,false);
 });
 await scenario('var op=hand(36034);for(var card of corp.archives.cards.slice())MoveCard(card,corp.HQ.cards);var upgrade=get(30040);MoveCard(upgrade,corp.archives.cards);playerTurn=corp;ChangePhase(phases.corpActionMain);',async(g)=>{assert(!choices(await g.api.advance()).some(o=>o.card?.number===36034),'Upgrade is not a Retirement Plan target');});
 console.log('PASS Vantage wave 4: Tungsten Tailor global strength/first break/history, Underdome rez history/expiry/options, Sell Out additional resource cost before play, realloc distinct targets/printed refunds/Double clicks, Retirement Plan Archives types/install/costs.');
})().catch(error=>{console.error(error);process.exitCode=1;});
