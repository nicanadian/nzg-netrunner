'use strict';
// Captured by clicking the shared browser UI. No headless browser is launched.
const assert=require('node:assert/strict'),{createGame}=require('../engine/runtime.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
(async()=>{for(const name of ['runner-v1','corp-v2','hb-mobile-v2','stealth-mobile-v2','vic-mobile-v2','full-hiram-v2','full-melies-v3','full-editorial-v3','full-weyland-v3']){
 const saved=require('../docs/playtesting/vantage/'+name+'.json'),g=createGame({vantage:true});
 try{g.api.boot(saved.session.config);let s=await g.api.advance();for(const choice of saved.session.choices){assert.equal(s.version,choice.version,`${name} decision ${choice.version}`);g.api.choose(choice);s=await g.api.advance();}
 assert.deepEqual(plain(s.terminal),saved.state.terminal);assert.equal(s.version,saved.state.version);assert.equal(s.corp.points,saved.state.corp.points);assert.equal(s.runner.points,saved.state.runner.points);assert.equal(s.diagnostics?.length||0,0);assert.deepEqual(g.errors,[]);
 console.log(`PASS shared-browser ${name}: ${saved.session.choices.length} recorded native choices reconstruct the terminal, points and decision version.`);
 }finally{g.close();}
}})().catch(error=>{console.error(error);process.exitCode=1;});
