'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {makeGame}=require('./engine-smoke.cjs');
const extraScripts=require('../engine/runtime.cjs').CORE_SCRIPTS;
(async()=>{for(const name of ['runner','corp','core2-runner']){
 const replay=JSON.parse(fs.readFileSync(`docs/playtesting/elevation/chrome-${name}-replay.json`));
 const g=makeGame({extraScripts});try{
  g.api.boot(replay.config);let s=await g.api.advance();
  for(const choice of replay.choices){assert.equal(s.version,choice.version,`${name} version ${choice.version}`);g.api.choose(choice);s=await g.api.advance();}
  assert.equal(s.terminal?.winner,'corp');assert.equal(s.corp.points,7);assert.equal(s.runner.points,name==='corp'?2:0);assert.equal(Math.ceil(s.turn/2),name==='core2-runner'?10:12);
  assert.equal(s.diagnostics?.length||0,0);
  console.log(`PASS real Chrome ${name} replay: ${replay.choices.length} recorded native choices, Corp 7–${s.runner.points}, turn ${Math.ceil(s.turn/2)}, reconstructed terminal.`);
 }finally{g.close();}
}
for(const file of ['chrome-custom-deck-replay.json','chrome-nebula-flip-replay.json','chrome-muslihat-private-replay.json']){
const custom=JSON.parse(fs.readFileSync('docs/playtesting/elevation/'+file));
const g=makeGame({extraScripts});try{g.api.boot(custom.config);let s=await g.api.advance();for(const choice of custom.choices){g.api.choose(choice);s=await g.api.advance();}assert.equal(s.phase.identifier,custom.liveCheckpoint.state.phase.identifier);assert.equal(s.version,custom.liveCheckpoint.state.version);assert.equal(s.corp.credits,custom.liveCheckpoint.state.corp.credits);assert.equal(s.corp.hand.length,custom.liveCheckpoint.state.corp.hand.length);if(file.includes('muslihat')){assert.equal(s.privateView.cards[0].number,30030);assert.equal(s.privateView.cards[0].faceUp,false);assert.equal(s.privateView.cards[0].hidden,false);}if(file.includes('nebula')){assert.equal(s.corp.identity.identityFace,'back');assert.equal(s.corp.identity.artNumber,'35057-0');}console.log('PASS actual Chrome '+file+': embedded deck documents reconstruct the saved decision without a library lookup.');}finally{g.close();}
}
})().catch(e=>{console.error(e);process.exitCode=1});
