'use strict';
// Find useful ordinary game decisions in retained Chrome playthroughs.
const fs=require('node:fs'),path=require('node:path');
const {makeGame}=require('../tests/engine-smoke.cjs');
(async()=>{
 const targets=[
  {id:'ansel-encounter',test:s=>s.side==='runner'&&s.run?.encountering&&s.run.card?.number===30038},
  {id:'restricted-access',test:s=>s.side==='runner'&&s.access&&s.run?.restrictions.some(r=>r.steal)},
 ];
 for(const filename of ['rules-chrome-replay.json','interaction-chrome-replay.json','runner-ui-replay.json','live-revision-runner-replay.json']) {
  const replay=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../tests/fixtures',filename)));
  const game=makeGame();
  try {
   game.api.boot(replay.config);let state=await game.api.advance();
   for(let i=0;i<=replay.choices.length;i++){
    for(const target of targets)if(!target.found&&target.test(state)){
     const file=path.resolve(__dirname,`../eval/polish/${target.id}-replay.json`);
     fs.writeFileSync(file,JSON.stringify({...replay,choices:replay.choices.slice(0,i)},null,2)+'\n');
     target.found=true;console.log(target.id,filename,i,state.phase.title,state.access?.title);
    }
    if(targets.every(t=>t.found)||i===replay.choices.length)break;
    game.api.choose(replay.choices[i]);state=await game.api.advance();
   }
  } finally{game.close();}
  if(targets.every(t=>t.found))break;
 }
 console.log(targets.map(({id,found})=>({id,found:!!found})));
})().catch(e=>{console.error(e);process.exitCode=1;});
