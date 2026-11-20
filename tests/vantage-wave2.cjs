'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {createGame}=require('../engine/runtime.cjs'),{documents,profile,decks}=require('../engine/vantage.cjs'),gateway=require('../engine/deck-catalog.js');
const {choices,checkState,checkSnapshot}=require('./engine-smoke.cjs');
const corp=structuredClone(decks.find(d=>d.document.side==='corp').document);
for(const [from,to]of [[36029,36050],[30071,36038],[30062,36041],[30073,36059]]){corp.cards.find(c=>Number(c.id)===from).count--;corp.cards.push({id:String(to),count:1});}
const tao=structuredClone(decks.find(d=>d.document.side==='runner').document);
for(const [from,to]of [[30028,36012],[30024,36020]]){const row=tao.cards.find(c=>Number(c.id)===from);row.id=String(to);}
const zahya=gateway.resolve({runner:'zahya-v1'}).runner;
const vic=documents.normalize({...zahya,pool:profile.cardPool,identity:'36009',cards:[...zahya.cards,[36012,3],[36013,2]]});
function fixture(code='',identity='tao'){
 const runner=identity==='vic'?vic:tao;
 for(const doc of [runner,corp])assert.equal(documents.validate(doc).valid,true,JSON.stringify(documents.validate(doc)));
 const game=createGame({vantage:true});game.api.boot({side:'runner',control:'scripted',seed:'vantage-wave2',...profile,deckDocuments:{runner,corp}});
 vm.runInContext(`playerTurn=runner;runner.creditPool=20;runner.clickTracker=4;corp.creditPool=20;corp.clickTracker=3;ChangePhase(phases.runnerActionMain);
 var get=id=>AllCards(null).find(card=>card.setNumber===id);
 var hand=id=>{const card=get(id);MoveCard(card,card.player===runner?runner.grip:corp.HQ.cards);return card;};
 var rig=id=>{const card=get(id);MoveCard(card,runner.rig[card.cardType==='program'?'programs':card.cardType==='hardware'?'hardware':'resources']);card.faceUp=true;return card;};
 var ice=(id,server=corp.HQ,rezzed=true)=>{const card=get(id);MoveCard(card,server.ice);card.rezzed=rezzed;return card;};${code}`,game.context);
 return game;
}
async function pick(game,test){const s=await game.api.advance(),option=choices(s).find(test);assert(option,JSON.stringify({phase:s.phase,options:choices(s).map(o=>[o.command,o.label,o.card?.number])}));game.api.choose({version:s.version,command:option.command,index:option.index});return game.api.advance();}
async function finish(game,goal,allowGain=false){for(let i=0;i<45;i++){const s=await game.api.advance();if(goal(s))return s;const options=choices(s),o=options.find(o=>o.command==='continue')||options.find(o=>o.command==='n')||(allowGain?options.find(o=>o.command==='discard')||options.find(o=>o.command==='gain'):null);assert(o,JSON.stringify({phase:s.phase,options:options.map(o=>[o.command,o.label,o.card?.number])}));game.api.choose({version:s.version,command:o.command,index:o.index});}throw Error('Effect did not finish');}
async function scenario(code,run,identity){const game=fixture(code,identity);try{await run(game,game.context);checkState(game);checkSnapshot(game,game.api.snapshot());assert.deepEqual(game.errors,[]);assert.equal(game.api.metrics().diagnostics.length,0);}finally{game.close();}}
(async()=>{
 for(const tags of [0,2])await scenario(`runner.tags=${tags};runner.creditPool=1;`,async(g,c)=>{
  const before=c.runner.grip.length;
  let s=await g.api.advance();const option=choices(s).find(o=>o.card?.number===36009);assert.equal(option.cost.credits,1);assert.equal(option.cost.clicks,1);
  await pick(g,o=>o.command==='trigger'&&o.card?.number===36009);
  await finish(g,()=>c.currentPhase.identifier==='Runner 1.3');
  assert.equal(c.runner.grip.length,before+1);assert.equal(c.runner.tags,Math.max(0,tags-1));assert.equal(c.runner.creditPool,0);assert.equal(c.runner.clickTracker,3);
  assert(!choices(g.api.snapshot()).some(o=>o.card?.number===36009));
  await finish(g,s=>s.turn>=3&&s.playerTurn==='runner'&&s.phase.identifier==='Runner 1.3',true);
  assert.equal(c.runner.identityCard.usedThisTurn,false);
 },'vic');
 await scenario('runner.creditPool=0;',async(g)=>{assert(!choices(await g.api.advance()).some(o=>o.card?.number===36009));},'vic');

 await scenario('var consoleCard=hand(36020),hardware=hand(36013);',async(g,c)=>{
  await pick(g,o=>o.command==='install'&&o.card?.number===36020);await finish(g,()=>c.CheckInstalled(c.consoleCard)&&c.currentPhase.identifier==='Runner 1.3');
  assert.equal(c.MemoryUnits(),5);assert.equal(c.runner.creditPool,16);
  await pick(g,o=>o.command==='run'&&o.server==='HQ');await pick(g,o=>o.command==='trigger'&&o.card?.number===36020);
  await pick(g,o=>o.command==='continue'&&o.card?.number===36013);
  await finish(g,()=>c.consoleCard.credits===2);assert(c.runner.heap.includes(c.hardware),'Chosen hardware is trashed from grip');assert.equal(c.runner.creditPool,16);assert.equal(c.consoleCard.canUseCredits(),true);
 });
 await scenario('var consoleCard=rig(36020),hardware=hand(36013);',async(g,c)=>{
  await pick(g,o=>o.command==='run'&&o.server==='HQ');await pick(g,o=>o.command==='trigger'&&o.card?.number===36020);await pick(g,o=>o.command==='continue'&&o.label==='Keep hardware');
  assert(c.runner.grip.includes(c.hardware),'Declining keeps hardware in grip');assert.equal(c.consoleCard.credits,0);
 });
 // The public credit-source dialog offers both eligible stealth funds and
 // excludes pool, bad-publicity and non-stealth hosted credits.
 await scenario('var corsair=rig(36004),touchstone=rig(36021),consoleCard=rig(36020),barrier=ice(36029);touchstone.credits=1;consoleCard.credits=2;runner.temporaryCredits=3;attackedServer=corp.HQ;approachIce=0;encountering=true;ChangePhase(phases.runEncounterIce);',async(g,c)=>{
  await pick(g,o=>o.card?.number===36004&&/−3/.test(o.label));const pay=choices(g.api.snapshot());assert.deepEqual(Array.from(pay,o=>o.payment.source).sort(),['Methuselah','Touchstone']);
  await pick(g,o=>o.command==='pay'&&o.payment.source==='Methuselah');assert.equal(c.consoleCard.credits,1);assert.equal(c.touchstone.credits,1);assert.equal(c.runner.temporaryCredits,3);assert.equal(c.runner.creditPool,20);
 });

 for(let count=0;count<=4;count++)await scenario(`var event=hand(36012);for(const id of [30072,30073,36029,36050].slice(0,${count}))ice(id,corp.HQ,false);runner.creditPool=${Math.max(0,3-count)};`,async(g,c)=>{
  const cost=Math.max(0,3-count);assert.equal(c.PlayCost(c.event),cost);
  const option=choices(await g.api.advance()).find(o=>o.command==='play'&&o.card?.number===36012);assert.equal(option.cost.credits,cost);
  await pick(g,o=>o.command==='play'&&o.card?.number===36012);await finish(g,()=>!!c.attackedServer);
  assert.equal(c.attackedServer,c.corp.HQ);assert.equal(c.runner.creditPool,0);assert.equal(c.runner.clickTracker,3);
  await finish(g,s=>s.history.some(e=>e.text==='Run successful'));
  assert.equal(c.ModifyingTriggers('modifyBreachAccess',null,0),2);
 });

 // Access Esca directly from R&D, including when tagged and at zero credits.
 for(const tags of [0,1])await scenario(`var asset=get(36038);MoveCard(asset,corp.RnD.cards);runner.tags=${tags};runner.creditPool=0;`,async(g,c)=>{
  const before=c.runner.grip.length;
  await pick(g,o=>o.command==='run'&&o.server==='R&D');await finish(g,s=>choices(s).some(o=>o.command==='access'));
  await pick(g,o=>o.command==='access');
  await finish(g,s=>choices(s).some(o=>o.command==='trigger'&&o.card?.number===36038));
  assert.equal(c.PlayerCanLook(c.corp,c.asset),true,'Esca is public while accessed in R&D');
  await pick(g,o=>o.command==='trigger'&&o.card?.number===36038);
  await finish(g,()=>c.runner.grip.length===before-tags);
  assert.equal(c.runner.creditPool,0);assert.equal(c.runner.grip.length,before-tags);
 });

 // Flywheel gives a credit before either optional draw choice.
 for(const draw of [true,false])await scenario('var flywheel=ice(36059);attackedServer=corp.HQ;approachIce=0;encountering=true;subroutine=0;ChangePhase(phases.runSubroutines);',async(g,c)=>{
  const hand=c.corp.HQ.cards.length;
  await pick(g,o=>o.command==='trigger'&&o.card?.number===36059);assert.equal(c.corp.creditPool,21);
  await pick(g,o=>o.command==='continue'&&o.label===(draw?'Draw 1 card':'Do not draw'));await finish(g,()=>c.currentPhase.identifier==='Run Subroutines');
  assert.equal(c.corp.HQ.cards.length,hand+(draw?1:0));
 });

 for(const central of [true,false])await scenario(`var server=corp.HQ;if(!${central}){server=NewServer('Remote 0',false);corp.remoteServers.push(server);}var grubber=ice(36050,server,false);attackedServer=server;approachIce=0;ChangePhase(phases.runApproachIce);`,async(g,c)=>{
  await finish(g,s=>choices(s).some(o=>o.command==='rez'&&o.card?.number===36050));
  await pick(g,o=>o.command==='rez'&&o.card?.number===36050);
  if(central)await pick(g,o=>o.command==='trigger'&&o.card?.number===36050);
  await finish(g,()=>c.grubber.rezzed&&(!central||c.corp.badPublicity===1));assert.equal(c.corp.badPublicity,central?1:0);
 });

 // Each Lionsmane subroutine resolves through the public firing/choice API.
 for(const branch of ['damage','pay','suffer','jack'])await scenario(`var lion=ice(36041);attackedServer=corp.HQ;approachIce=0;encountering=true;subroutine=0;lion.subroutines[0].broken=${branch!=='damage'};lion.subroutines[1].broken=${branch==='jack'};ChangePhase(phases.runSubroutines);`,async(g,c)=>{
  const before=c.runner.grip.length;await pick(g,o=>o.command==='trigger'&&o.card?.number===36041);
  if(branch==='pay')await pick(g,o=>o.command==='continue'&&o.label==='Pay 3 credits');
  if(branch==='suffer')await pick(g,o=>o.command==='continue'&&o.label==='Suffer 2 net damage');
  if(branch==='jack')await pick(g,o=>o.command==='continue'&&o.label==='Jack out');
  await finish(g,()=>branch==='jack'?!c.attackedServer:branch==='pay'?c.runner.creditPool===17:c.runner.grip.length===before-2);
  assert.equal(c.runner.grip.length,before-(branch==='damage'||branch==='suffer'?2:0));
 });
 console.log('PASS Vantage wave 2: Vic costs/tags/once-per-turn, Methuselah install/run funding/decline, multiple stealth sources, Tailgate discounts/HQ bonus, Esca access visibility/damage, Flywheel draw alternatives, Grubber rez location, Lionsmane payment/damage/jack-out.');
})().catch(e=>{console.error(e);process.exitCode=1;});
