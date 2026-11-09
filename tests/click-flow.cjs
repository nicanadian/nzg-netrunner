'use strict';
const assert=require('node:assert/strict');
const {makeGame,checkState}=require('./engine-smoke.cjs');
(async()=>{
 const {assistedChoice,quotedInstallFinish}=await import('../app/interaction.mjs');
 for(const side of ['corp','runner']){
  const data=require(`../eval/click-audit/${side}.json`),analysis=require(`../eval/click-audit/${side}-analysis.json`);
  const game=makeGame(),snapshots=new Map();
  try{
   game.api.boot(data.session.config);let s=await game.api.advance();snapshots.set(s.version,s);
   for(const c of data.session.choices){game.api.choose(c);s=await game.api.advance();checkState(game);snapshots.set(s.version,s);}
   assert.equal(s.terminal.winner,side);
   for(const n of analysis.boostOnlyPasses){
    const s=snapshots.get(data.audit.events[n-1].before.version);
    assert.equal(assistedChoice(s).command,'n',`Pass boost-only event ${n}`);
    assert.equal(assistedChoice(s,{hold:true}),null,'Hold priority restores the native window');
   }
   for(const n of (side==='corp'?[61,62,85,86,87,88]:[])){
    const s=snapshots.get(data.audit.events[n-1].before.version);
    assert.equal(s.assistance.kind,'optional-window');assert.equal(assistedChoice(s,{hold:true}),null);
   }
   for(const n of (side==='corp'?[33,66,80,103,104]:[])){
    const s=snapshots.get(data.audit.events[n-1].before.version);
    assert.equal(s.assistance.kind,'forced-effect',`Forced effect ${n}`);
    assert.equal(assistedChoice(s,{streamline:false}),null);
   }
   if(side==='corp'){
    const defence=snapshots.get(data.audit.events[64].before.version);
    assert.equal(defence.decision.commands.find(c=>c.command==='rez').options[0].secondary,false,'Manegarm remains prominent at its defensive timing');
    assert.equal(assistedChoice(defence),null);
    const order=snapshots.get(data.audit.events[37].before.version);
    assert.equal(order.assistance,null,'Luminal plus Precision Design retains effect ordering');
   }
   for(const e of analysis.events.filter(e=>e.category==='Extra install confirmation')){
    const s=snapshots.get(e.before.version),cost=s.decision.commands.find(c=>c.command==='n').options[0].cost;
    const tx={cardId:s.installation.card.id,credits:cost.credits,clicks:cost.clicks||0};
    assert.equal(quotedInstallFinish(s,tx).command,'n');
    assert.equal(quotedInstallFinish(s,{...tx,credits:cost.credits+1}),null,'Changed quote pauses');
    assert.equal(quotedInstallFinish(s,{...tx,replace:true}),null,'Replacement branch retains trash choices');
   }
   assert.equal(game.api.metrics().diagnostics.length,0);
  }finally{game.close();}
 }
 console.log('PASS click flow: all 24 audited boost passes, six routine priority stops, five forced effects, defensive rez, simultaneous ordering, install quote/replace guards, and both full replay outcomes.');
})().catch(e=>{console.error(e);process.exitCode=1});
