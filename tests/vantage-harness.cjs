'use strict';
const vm=require('node:vm'),assert=require('node:assert/strict');
const {createGame}=require('../engine/runtime.cjs'),{decks,profile}=require('../engine/vantage.cjs');
const {choices,checkState,checkSnapshot}=require('./engine-smoke.cjs');
function fixture(code='',options={}){const g=createGame({vantage:true});g.api.boot({side:'runner',control:'scripted',seed:'vantage-complete',...profile,deckDocuments:{runner:decks[0].document,corp:decks[1].document},...options});vm.runInContext(`
playerTurn=runner;runner.creditPool=40;runner.clickTracker=4;corp.creditPool=40;corp.clickTracker=3;ChangePhase(phases.runnerActionMain);
var card=(id,zone)=>{var c=InstanceCard(id);c.renderer=runner.identityCard.renderer;c.cardLocation=null;MoveCard(c,zone||(c.player===runner?runner.grip:corp.HQ.cards));return c;};
var rig=id=>{var c=card(id);MoveCard(c,runner.rig[c.cardType==='hardware'?'hardware':c.cardType==='resource'?'resources':'programs']);c.faceUp=true;return c;};
var ice=(id,server=corp.HQ,rezzed=true)=>{var c=card(id,server.ice);c.rezzed=rezzed;return c;};
var root=(id,server=corp.HQ,rezzed=true)=>{var c=card(id,server.root);c.rezzed=rezzed;return c;};
var remote=()=>{var s=NewServer('Remote '+corp.remoteServers.length,false);corp.remoteServers.push(s);return s;};
var encounter=(c,sub=0)=>{playerTurn=runner;attackedServer=GetServer(c);approachIce=attackedServer.ice.indexOf(c);encountering=true;subroutine=sub;c.subroutines.forEach((s,i)=>s.broken=i<sub);ChangePhase(phases.runSubroutines);};
${code}`,g.context);return g;}
function summary(s){return JSON.stringify({phase:s.phase,options:choices(s).map(o=>[o.command,o.label,o.card?.number]),terminal:s.terminal});}
async function pick(g,test){const s=await g.api.advance(),o=choices(s).find(test);assert(o,summary(s));g.api.choose({version:s.version,command:o.command,index:o.index});return g.api.advance();}
async function until(g,goal,{max=150,policy}={}){for(let i=0;i<max;i++){const s=await g.api.advance();if(goal(s,g.context))return s;assert(!s.terminal,summary(s));const l=choices(s),o=policy?.(l,s)||l.find(o=>o.command==='continue')||l.find(o=>o.command==='n');assert(o,summary(s));g.api.choose({version:s.version,command:o.command,index:o.index});}throw Error('No progress: '+summary(g.api.snapshot()));}
async function scenario(name,code,run,options){let g;try{g=fixture(code,options);await run(g,g.context);checkState(g);checkSnapshot(g,g.api.snapshot());assert.deepEqual(g.errors,[],name);assert.equal(g.api.metrics().diagnostics.length,0,name);console.log('PASS '+name);}catch(error){console.error('FAILED SCENARIO: '+name);throw error;}finally{g?.close();}}
module.exports={fixture,pick,until,scenario,choices,assert,vm};
