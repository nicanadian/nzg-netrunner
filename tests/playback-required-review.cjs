'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('app/table.js','utf8');
function scenario(queue,{current=null,final=true,replay=false}={}){
 const context=vm.createContext({opponentQueue:queue,opponentCurrent:current,opponentFinal:final,opponentReplaying:replay,opponentSkipped:false,opponentPaused:false,finished:0,stopped:0,rendered:0,
 nextOpponentBeat(){context.opponentCurrent=context.opponentQueue.shift();context.opponentPaused=!!context.opponentCurrent?.requiresRezReview;},finishOpponentPlayback(){context.finished++;},stopOpponentPlayback(){context.stopped++;},render(){context.rendered++;}});
 vm.runInContext(source.slice(source.indexOf('function skipOpponentPlayback()'),source.indexOf('function finishOpponentPlayback()')),context);
 context.skipOpponentPlayback();return context;
}
const ordinary={kind:'credit'},first={kind:'unrezzed-ice',requiresRezReview:true,id:1},second={...first,id:2};
let c=scenario([ordinary,first,ordinary,second,ordinary]);assert.equal(c.finished,0);assert.equal(c.opponentCurrent.id,1);assert(c.opponentPaused);assert.equal(c.opponentQueue.length,1);assert.equal(c.opponentQueue[0].id,2);assert(c.opponentSkipped);
c.skipOpponentPlayback();assert.equal(c.opponentCurrent.id,1,'A required review cannot be skipped while current');assert.equal(c.finished,0);
c=scenario([ordinary],{current:first});assert.equal(c.finished,0);assert.equal(c.opponentCurrent,first);
c=scenario([ordinary]);assert.equal(c.finished,1,'Ordinary complete playback remains skippable');
c=scenario([first],{replay:true});assert.equal(c.finished,1,'Closing an archive replay never traps the player in an already-seen warning');
c=scenario([ordinary],{final:false});assert.equal(c.stopped,1);assert.equal(c.rendered,1);assert(c.opponentSkipped);
console.log('PASS skip animation preserves queued mandatory rez reviews in order, guards active review, and retains ordinary skip and archive-close behavior.');
