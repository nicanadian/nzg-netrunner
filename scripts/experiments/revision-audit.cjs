'use strict';
// Read-only observers; every replay must reproduce the full native decision trace.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {readPair}=require('./deck-study.cjs');
const root=path.resolve(process.argv[2]||'tmp/deck-experiment-2/confirmation');
const count=Number(process.argv[3]||6);
const {createGame}=require(path.join(root,'runtime/engine/runtime.cjs'));
const {validateState}=require(path.join(root,'runtime/engine/state-check.cjs'));
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function replay(manifest,job){
 const game=createGame(),ctx=game.context,log=[],trace=[],rezPasses=[],turns=[],actions=[],damage=[],clearinghouseChoices=[];
 let lastTurn=-1;
 const native=ctx.Log;
 const nativeDamage=ctx.Damage;
 ctx.Damage=function(type,amount){
  const context=ctx.currentPhase?.context;
  damage.push({turn:game.api.summary().turn,type,amount,gripBefore:ctx.runner.grip.length,phase:ctx.currentPhase?.title,context:context?.title||null,
   advancement:context?.setNumber===30061?ctx.Counters(context,'advancement'):null});
  return nativeDamage.apply(this,arguments);
 };
 ctx.Log=function(message){
  const state=game.api.summary();
  log.push({turn:state.turn,text:String(message)});
  if(message==='Corp did not rez ice'){
   const ice=ctx.attackedServer?.ice[ctx.approachIce];
   if(ice)rezPasses.push({turn:state.turn,ice:ice.title,credits:ctx.AvailableCredits(ctx.corp,'rezzing',ice),rezCost:ctx.RezCost(ice),rezzed:ice.rezzed});
  }
  return native.apply(this,arguments);
 };
 try{
  game.api.boot({side:'runner',faceoff:true,simulationFast:true,seed:job.seed,rulesVersion:manifest.rulesVersion,deckDocuments:{runner:manifest.runner,corp:manifest.corp}});
  let state;
  while(game.api.metrics().steps<manifest.limits.decisions){
   state=await game.api.advance(Math.min(300,manifest.limits.decisions-game.api.metrics().steps),null,true,choice=>{
    trace.push(choice);
    const turn=game.api.summary().turn;
    if(ctx.currentPhase?.context?.setNumber===30061){
     const option=ctx.phaseOptions[choice.command][choice.index];
     clearinghouseChoices.push({turn,command:choice.command,choice:option.id,label:option.label||null,advancement:ctx.Counters(ctx.currentPhase.context,'advancement'),gripBefore:ctx.runner.grip.length});
    }
    if(turn!==lastTurn){turns.push({turn,corpCredits:ctx.corp.creditPool,runnerCredits:ctx.runner.creditPool,corpPoints:ctx.AgendaPoints(ctx.corp),runnerPoints:ctx.AgendaPoints(ctx.runner)});lastTurn=turn;}
    if(['rez','score','install','play'].includes(choice.command)){
     const option=ctx.phaseOptions[choice.command][choice.index];
     actions.push({turn,side:choice.side,command:choice.command,card:option.card?.title||option.title||null});
    }
   });
   validateState(game);
   if(state.terminal)break;
   if(!game.api.needsAdvance())throw Error('Unexpected human decision');
  }
  assert.equal(digest(trace),digest(job.trace),'Native decision trace changed under observers');
  assert.deepEqual(JSON.parse(JSON.stringify(state.terminal)),job.terminal);
  assert.deepEqual(game.errors,[]);assert.deepEqual(Array.from(game.api.metrics().diagnostics),[]);
 const result={index:job.index,seed:job.seed,terminal:state.terminal,turn:state.turn,traceMatches:true,traceHash:digest(trace),rezPasses,turns,actions,damage,clearinghouseChoices,log};
  return result;
 }finally{game.close();}
}
(async()=>{
 const matrix=JSON.parse(fs.readFileSync(path.join(root,'matrix.json'))),cells=[];
 for(let r=0;r<matrix.runners.length;r++)for(let c=0;c<matrix.corps.length;c++){
  const directory=`matchup-${r}-${c}`,{manifest,jobs}=readPair(root,directory),games=[];
  for(const job of jobs.slice(0,count)){if(job.status!=='completed')throw Error('Selected seed did not complete; keep it and investigate separately');games.push(await replay(manifest,job));}
  cells.push({runner:matrix.runners[r].label,corp:matrix.corps[c].label,directory,games});
  console.log(`${directory}: ${games.length} native traces matched`);
  fs.writeFileSync(path.join(root,'audit.json'),JSON.stringify({selection:`First ${count} seed indices in each cell`,complete:cells.length===matrix.runners.length*matrix.corps.length,cells},null,2)+'\n');
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
