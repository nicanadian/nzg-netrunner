'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const {makeGame,choices,checkState,checkSnapshot}=require('./engine-smoke.cjs');
async function restore(file){const replay=require('../'+file),game=makeGame();game.api.boot(replay.config);let state=await game.api.advance();for(const choice of replay.choices){game.api.choose(choice);state=await game.api.advance();checkState(game);checkSnapshot(game,state);}return {game,state};}
async function main(){
 for(const file of ['engine/deck-catalog.js','app/table.js','app/counters.mjs','app/presentation.mjs','app/activity.mjs','app/opponent.mjs','app/virus.mjs','app/encounter.mjs','app/helper-context.mjs','app/helper.mjs']){
  const result=spawnSync(process.execPath,['--input-type=module','--check'],{input:fs.readFileSync(file,'utf8'),encoding:'utf8'});
  assert.equal(result.status,0,`${file}: ${result.stderr}`);
 }
 const {plural,displayText,phaseHeading,priorityLabel,receiptLabel,orderedCommands,restrictionText}=await import('../app/presentation.mjs');
 assert.equal(plural(1,'card'),'1 card');assert.equal(displayText('Remote 0 at position 0'),'Remote 1 · ice 1');
 const scoring=await restore('eval/counters/corp-advance-replay.json');
 try{
  let s=scoring.state;
  for(let i=0;i<3;i++){const next=choices(s).find(o=>o.command==='advance');scoring.game.api.choose({version:s.version,command:next.command,index:next.index});s=await scoring.game.api.advance();}
  const agenda=s.corp.servers.flatMap(s=>s.root).find(c=>c.number===30070);
  assert.equal(agenda.advancementRequirement,3);assert.equal(agenda.canScore,true);assert.equal(s.corp.clicks,0);
  const ordered=orderedCommands(s.decision.commands,s);
  assert.equal(ordered.commands[0].command,'score');assert.equal(ordered.primary,'score');
  assert.equal(s.decision.commands.find(c=>c.command==='n').label,'End action phase');
  const beforeScore=s;
  const score=choices(s).find(o=>o.command==='score');scoring.game.api.choose({version:s.version,command:score.command,index:score.index});s=await scoring.game.api.advance();
  const triggers=choices(s).filter(o=>o.command==='trigger');
  assert.ok(triggers.some(o=>o.label.includes('Superconducting Hub')&&o.label.includes('draw 2')));
  assert.ok(triggers.some(o=>o.label.includes('Precision Design')&&o.label.includes('Archives')));
  assert.equal(phaseHeading(s),'Resolve score effects');
  const {resourceChanges}=await import('../app/counters.mjs');
  assert.ok(resourceChanges(beforeScore,s).some(c=>c.detail==='Moved to score area'));
 } finally{scoring.game.close();}
 const run=await restore('eval/counters/runner-virus-replay.json');
 try{
  let s=run.state;
  const ability=choices(s).find(o=>o.command==='trigger'&&o.card?.number===30004);
  assert.ok(ability&&!ability.label.includes('position 0'));
  run.game.api.choose({version:s.version,command:ability.command,index:ability.index});s=await run.game.api.advance();
  const options=choices(s).filter(o=>o.subroutine);
  assert.equal(options.length,3);assert.deepEqual(Array.from(options,o=>o.subroutine),[1,2,3]);
  assert.ok(options.every(o=>/^Break subroutine [123]:/.test(o.label)));
  assert.equal(receiptLabel(s.decision.commands[0],options[1],s),'Break subroutine 2 · Botulus');
  run.game.api.choose({version:s.version,command:options[1].command,index:options[1].index});s=await run.game.api.advance();
  const bioroid=choices(s).find(o=>o.command==='trigger'&&o.card?.number===30039);
  assert.equal(bioroid.cost.clicks,1);assert.ok(!bioroid.label.includes('position'));
  run.game.api.choose({version:s.version,command:bioroid.command,index:bioroid.index});s=await run.game.api.advance();
  assert.ok(choices(s).filter(o=>o.subroutine).every(o=>o.cost.clicks===1));
  assert.equal(phaseHeading(s),'Choose a subroutine');
 } finally{run.game.close();}
 const restricted=await restore('eval/polish/restricted-access-replay.json');
 try{
  const s=restricted.state;
  const effect=s.run.restrictions.find(r=>r.source==='Ansel 1.0');
  assert.equal(effect.steal,true);assert.equal(effect.trash,true);
  assert.match(restrictionText(effect),/cannot steal agendas or trash Corp cards/);
  assert.ok(!choices(s).some(o=>['steal','trash'].includes(o.command)));
  assert.ok(s.corp.servers.flatMap(server=>server.ice).find(card=>card.number===30038).subroutines.some(sub=>sub.fired));
  assert.match(priorityLabel({...s,side:'corp',playerTurn:'runner'},false),/OPPONENT’S TURN.*YOUR DECISION/);
 } finally{restricted.game.close();}
 // Private agenda properties cannot leak even when public advancement is known.
 const privacy=makeGame();
 try{
  privacy.api.boot({side:'runner',seed:'polish-privacy'});
  vm.runInContext(`var privateAgenda=AllCards(corp).find(c=>c.cardType==='agenda'); var privateServer=NewServer('Remote 0',false);corp.remoteServers.push(privateServer);MoveCard(privateAgenda,privateServer.root);privateAgenda.advancement=2;privateAgenda.faceUp=false;privateAgenda.rezzed=false;privateAgenda.knownToRunner=false;`,privacy.context);
  const card=privacy.api.snapshot().corp.servers.find(s=>s.name==='Remote 0').root[0];
  assert.equal(card.hidden,true);assert.equal(card.advancement,2);
  assert.equal(card.advancementRequirement,undefined);assert.equal(card.canScore,undefined);
 }finally{privacy.close();}
 console.log('Polish: module parsing, source-labelled triggers, score priority/readiness, bioroid quotes, numbered breaks, fired outcomes and private restrictions pass.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
