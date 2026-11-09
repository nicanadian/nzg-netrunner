'use strict';
// Discover ordinary saved-game positions; never inject cards or counters.
const fs = require('node:fs');
const path = require('node:path');
const {makeGame, choices} = require('../tests/engine-smoke.cjs');
const ROOT = path.resolve(__dirname, '..');
function cards(state) { return state.corp.servers.flatMap(s => s.root).concat(Object.values(state.runner.rig).flat()); }
async function scan(file, targets) {
  const replay = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures', file)));
  const game = makeGame();
  const found = [];
  try {
    game.api.boot(replay.config);
    let state = await game.api.advance();
    for (let index = 0; index <= replay.choices.length; index++) {
      for (const target of targets) if (!target.found && target.matches(state)) {
        target.found = true;
        const output = `eval/counters/${target.id}-replay.json`;
        fs.writeFileSync(path.join(ROOT, output), JSON.stringify({...replay, choices:replay.choices.slice(0, index)}, null, 2)+'\n');
        found.push({id:target.id, title:target.title, replay:'/'+output, decisions:index, state});
      }
      if (index === replay.choices.length) break;
      game.api.choose(replay.choices[index]); state = await game.api.advance();
    }
  } finally { game.close(); }
  return found;
}
async function incomeGame() {
 for(let seed=1;seed<=15;seed++) {
  const game=makeGame(), config={side:'corp',seed:`counter-income-${seed}`}, trace=[];
  try {
   game.api.boot(config); let state=await game.api.advance();
   for(let step=0;step<100&&!state.terminal;step++) {
    const options=choices(state);
    if(options.some(o=>o.command==='trigger'&&o.card?.number===30037)) {
     const replay='/eval/counters/corp-income-replay.json';
     fs.writeFileSync(path.join(ROOT,replay),JSON.stringify({engine:'chiriboga-77c80b1-local-1',config,choices:trace},null,2)+'\n');
     return {id:'corp-income',title:'Corp: collect income from Nico Campaign',replay,decisions:trace.length,state};
    }
    const option=options.find(o=>o.command==='rez'&&o.card?.number===30037)
      ||options.find(o=>o.command==='install'&&o.card?.number===30037&&o.server==='New remote')
      ||options.find(o=>o.command==='play'&&o.card?.number===30075)
      ||options.find(o=>o.command==='gain')
      ||options.find(o=>o.command==='n')
      ||options.find(o=>o.command==='continue'&&!o.multi)
      ||options.find(o=>!o.multi);
    if(!option)break;
    const choice={version:state.version,command:option.command,index:option.index};
    trace.push(choice);game.api.choose(choice);state=await game.api.advance();
   }
  } finally {game.close();}
 }
 throw Error('Could not build a legal AI-game Nico income position');
}
(async () => {
 fs.mkdirSync(path.join(ROOT,'eval/counters'),{recursive:true});
 const corpTargets = [
  {id:'corp-income',title:'Corp: collect income from Nico Campaign',matches:s=>choices(s).some(o=>o.command==='trigger' && o.card?.number===30037)},
  {id:'corp-advance',title:'Corp: place advancement counters',matches:s=>choices(s).some(o=>o.command==='advance')},
 ];
 let scenarios=[];
 for(const file of ['tactics-chrome-replay.json','visual-chrome-corp-replay.json','corp-ui-replay.json']) {
   scenarios.push(...await scan(file,corpTargets));
   if(corpTargets.every(t=>t.found)) break;
 }
 if(!corpTargets[0].found)scenarios.push(await incomeGame());
 scenarios.push(...await scan('hosted-chrome-checkpoint.json',[
   {id:'runner-virus',title:'Runner: spend Botulus virus counters',matches:s=>s.run?.encountering && choices(s).some(o=>o.command==='trigger'&&o.card?.number===30004)},
 ]));
 if(scenarios.length!==3)throw Error('Expected all three counter practice saves, got '+scenarios.map(s=>s.id));
 fs.writeFileSync(path.join(ROOT,'eval/counters/scenarios.json'),JSON.stringify({note:'Ordinary seeded AI games, restored by legal decisions; no state injection.',scenarios},null,2)+'\n');
 console.log(scenarios.map(({state,...s})=>s));
})().catch(e=>{console.error(e);process.exitCode=1;});
