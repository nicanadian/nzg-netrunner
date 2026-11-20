'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {createGame}=require('../engine/runtime.cjs'),{documents,profile,decks}=require('../engine/vantage.cjs');
const {choices,checkState,checkSnapshot}=require('./engine-smoke.cjs');
const corp=documents.normalize({...require('../engine/deck-catalog.js').resolve({corp:'precision-design-v1'}).corp,pool:profile.cardPool});
for(const [from,to]of [[30038,36030],[30039,36031],[30042,36032],[30048,36042]]){corp.cards.find(c=>+c.id===from).count--;corp.cards.push({id:String(to),count:1});}
assert.equal(documents.validate(corp).valid,true);
function fixture(code){const g=createGame({vantage:true});g.api.boot({side:'corp',control:'scripted',seed:'vantage-wave3',...profile,deckDocuments:{runner:decks[0].document,corp}});
 vm.runInContext(`playerTurn=corp;corp.creditPool=20;corp.clickTracker=3;runner.creditPool=20;runner.clickTracker=4;ChangePhase(phases.corpActionMain);
 var get=id=>AllCards(null).find(c=>c.setNumber===id);var hand=id=>{var card=get(id);MoveCard(card,card.player===corp?corp.HQ.cards:runner.grip);return card;};var ice=id=>{var card=get(id);MoveCard(card,corp.HQ.ice);card.rezzed=true;return card;};${code}`,g.context);return g;}
async function pick(g,test){const s=await g.api.advance(),o=choices(s).find(test);assert(o,JSON.stringify({phase:s.phase,choices:choices(s).map(o=>[o.command,o.label,o.card?.number])}));g.api.choose({version:s.version,command:o.command,index:o.index});return g.api.advance();}
async function finish(g,goal,turns=false){for(let i=0;i<130;i++){const s=await g.api.advance();if(goal(s))return s;const list=choices(s),o=list.find(o=>o.command==='continue')||list.find(o=>o.command==='n')||(turns&&(list.find(o=>o.command==='discard')||list.find(o=>o.command==='gain')));assert(o,JSON.stringify({phase:s.phase,choices:list.map(o=>[o.command,o.label])}));g.api.choose({version:s.version,command:o.command,index:o.index});}throw Error('Effect did not finish');}
async function scenario(code,run){const g=fixture(code);try{await run(g,g.context);checkState(g);checkSnapshot(g,g.api.snapshot());assert.deepEqual(g.errors,[]);assert.equal(g.api.metrics().diagnostics.length,0);}finally{g.close();}}
(async()=>{
 for(const adjustment of [-1,1])await scenario('var operation=hand(36032);',async(g,c)=>{
  await pick(g,o=>o.command==='play'&&o.card?.number===36032);assert.equal(c.corp.creditPool,15);assert.equal(c.corp.clickTracker,2);
  await pick(g,o=>o.command==='continue'&&o.label.includes(adjustment===-1?'Gain 6':'Gain 10'));
  await finish(g,()=>c.currentPhase.identifier==='Corp 2.2');assert.equal(c.corp.creditPool,15+(adjustment===-1?6:10));
  await finish(g,s=>s.playerTurn==='runner'&&s.phase.identifier==='Runner 1.3',true);assert.equal(c.runner.clickTracker,4+adjustment);
  const turn=g.api.snapshot().turn;await finish(g,s=>s.turn>turn&&s.playerTurn==='runner'&&s.phase.identifier==='Runner 1.3',true);assert.equal(c.runner.clickTracker,4,'Adjustment expires after the next Runner turn');
 });
 for(const draw of [true,false])await scenario('var sleipnir=ice(36030);playerTurn=runner;attackedServer=corp.HQ;approachIce=0;encountering=true;subroutine=0;ChangePhase(phases.runSubroutines);',async(g,c)=>{
  const before=c.corp.HQ.cards.length;await pick(g,o=>o.command==='trigger'&&o.card?.number===36030);await pick(g,o=>o.label===(draw?'Draw 1 card':'Do not draw'));await finish(g,()=>c.currentPhase.identifier==='Run Subroutines');assert.equal(c.corp.HQ.cards.length,before+(draw?1:0));
 });
 for(const zone of ['HQ','Archives','decline'])await scenario(`var sleipnir=ice(36030),target=hand(30075);if('${zone}'==='Archives')MoveCard(target,corp.archives.cards);playerTurn=runner;attackedServer=corp.HQ;approachIce=0;encountering=true;subroutine=1;sleipnir.subroutines[0].broken=true;ChangePhase(phases.runSubroutines);`,async(g,c)=>{
  await pick(g,o=>o.command==='trigger'&&o.card?.number===36030);await pick(g,o=>zone==='decline'?o.label==='Do not shuffle a card':o.card?.id===c.target.localId);await finish(g,()=>c.currentPhase.identifier==='Run Subroutines');assert.equal(c.target.cardLocation===c.corp.RnD.cards,zone!=='decline');
 });
 await scenario('var sleipnir=ice(36030);playerTurn=runner;attackedServer=corp.HQ;approachIce=0;encountering=true;subroutine=2;sleipnir.subroutines[0].broken=true;sleipnir.subroutines[1].broken=true;ChangePhase(phases.runSubroutines);',async(g,c)=>{await pick(g,o=>o.command==='trigger'&&o.card?.number===36030);await finish(g,()=>!c.attackedServer);});
 for(const clicks of [0,1])await scenario(`var vertigo=ice(36031);playerTurn=runner;runner.clickTracker=${clicks};attackedServer=corp.HQ;approachIce=0;encountering=true;subroutine=0;ChangePhase(phases.runSubroutines);`,async(g,c)=>{
  await pick(g,o=>o.command==='trigger'&&o.card?.number===36031);assert.equal(c.runner.clickTracker,0,'Click loss floors at zero');
  await finish(g,()=>c.lingeringEffects.some(e=>e.title==='Vertigo'));
  vm.runInContext('activePlayer=runner;',c);assert.equal(c.CardEffectsForbid('steal',c.get(30067)),true);assert.equal(c.CheckTrash(c.get(30037)),false);assert.equal(c.CheckTrash(c.runner.grip[0]),true);
  vm.runInContext('activePlayer=corp;',c);assert.equal(c.CheckTrash(c.get(30037)),true,'Corp can still trash its own cards');
  vm.runInContext('MoveCard(vertigo,corp.archives.cards);',c);assert.equal(c.CardEffectsForbid('steal',c.get(30067)),true,'Pass restriction survives source removal');
  vm.runInContext('ChangePhase(phases.runEnds);',c);await finish(g,()=>!c.attackedServer);assert.equal(c.lingeringEffects.some(e=>e.title==='Vertigo'),false);
 });
 await scenario('var vertigo=ice(36031);playerTurn=runner;runner.clickTracker=2;attackedServer=corp.HQ;approachIce=0;encountering=true;subroutine=0;ChangePhase(phases.runSubroutines);',async(g,c)=>{
  await pick(g,o=>o.command==='trigger'&&o.card?.number===36031);await finish(g,()=>c.currentPhase.identifier==='Run 4.3');assert.equal(c.lingeringEffects.some(e=>e.title==='Vertigo'),false);c.LoseClicks(c.runner,1);assert.equal(c.CardEffectsForbid('steal',c.get(30067)),false,'Later click loss does not retroactively trigger Vertigo');
 });
 for(const tags of [0,2,6])await scenario(`var vicsek=ice(36042);playerTurn=runner;runner.tags=${tags};attackedServer=corp.HQ;approachIce=0;encountering=true;subroutine=0;ChangePhase(phases.runSubroutines);`,async(g,c)=>{
  const grip=c.runner.grip.length;await pick(g,o=>o.command==='trigger'&&o.card?.number===36042);await finish(g,s=>tags>grip?!!s.terminal:c.currentPhase.identifier==='Run Subroutines');
  assert.equal(c.runner.tags,tags>grip?tags:tags*2);assert.equal(c.runner.grip.length,Math.max(0,grip-tags));
 });
 await scenario('var vicsek=ice(36042);playerTurn=runner;runner.tags=0;attackedServer=corp.HQ;approachIce=0;encountering=true;subroutine=1;vicsek.subroutines[0].broken=true;ChangePhase(phases.runSubroutines);',async(g,c)=>{
  await pick(g,o=>o.command==='trigger'&&o.card?.number===36042);await finish(g,()=>c.vicsek.cardLocation===c.corp.archives.cards);assert.equal(c.runner.tags,1);assert.equal(c.corp.HQ.ice.length,0);
 });
 console.log('PASS Vantage wave 3: Caveat Emptor delayed click allotments/expiry, Sleipnir draw/shuffle/decline/ETR, Vertigo pass-time conditions and persistent restrictions, Vicsek zero/scaled/terminal damage and self-trash.');
})().catch(error=>{console.error(error);process.exitCode=1;});
