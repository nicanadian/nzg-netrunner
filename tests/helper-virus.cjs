'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {makeGame,choices,checkSnapshot}=require('./engine-smoke.cjs');
const backend=require('../server/helper.cjs');
async function main(){
 const {helperContext}=await import('../app/helper-context.mjs');
 const {virusStatus,virusMarkup}=await import('../app/virus.mjs');
 const {counterEntries,counterMarkup}=await import('../app/counters.mjs');
 const game=makeGame(); let context;
 try{
  game.api.boot({side:'runner',seed:'PRIVATE_SEED_DO_NOT_SEND'});
  vm.runInContext(`
   var helperIce=AllCards(corp).find(c=>c.setNumber===30039);
   MoveCard(helperIce,corp.HQ.ice);helperIce.rezzed=true;helperIce.faceUp=true;
   var helperLeech=AllCards(runner).find(c=>c.setNumber===30008);
   MoveCard(helperLeech,runner.rig.programs);helperLeech.faceUp=true;helperLeech.virus=2;
   playerTurn=runner;runner.clickTracker=4;attackedServer=corp.HQ;approachIce=0;encountering=true;
   ChangePhase(phases.runEncounterIce);
  `,game.context);
  let s=await game.api.advance();const leech=choices(s).find(o=>o.command==='trigger'&&o.card?.number===30008);
  assert.ok(leech,'Leech has a legal ability in the encounter');
  const strength=s.corp.servers.find(x=>x.name==='HQ').ice[0].strength;
  game.api.choose({version:s.version,command:leech.command,index:leech.index});s=await game.api.advance();
  const ice=s.corp.servers.find(x=>x.name==='HQ').ice[0];
  assert.equal(ice.strength,strength-1);assert.equal(ice.strengthEffects[0].source,'Leech');
  assert.equal(ice.strengthEffects[0].amount,-1);assert.equal(ice.strengthEffects[0].duration,'this encounter');
  assert.match(virusMarkup(ice),/Leech -1 STR/);assert.match(virusMarkup(ice),/This encounter/);
  checkSnapshot(game,s);
  context=helperContext(s,{watching:false});
  assert.ok(context.cards.some(c=>c.strengthEffects?.[0]?.source==='Leech'));
  // Even a malformed hidden DTO cannot smuggle private characteristics.
  const hidden=s.corp.hand[0];Object.assign(hidden,{hidden:true,title:'PRIVATE_CARD_NAME',number:987654,counters:{virus:99}});
  const safe=helperContext(s,{selectedCard:hidden}),serialized=JSON.stringify(safe);
  assert.ok(!serialized.includes('PRIVATE_'));assert.ok(!serialized.includes('987654'));
  assert.equal(safe.selectedCard,null);
  assert.ok(!('seed' in safe));assert.ok(!('choices' in safe));
  assert.equal(helperContext(s,{watching:true}).legalActions.length,0);
  vm.runInContext('encountering=false;',game.context);
  const ended=game.api.snapshot().corp.servers.find(x=>x.name==='HQ').ice[0];
  assert.equal(ended.strengthEffects,undefined,'Temporary Leech badge disappears outside the encounter');
 }finally{game.close();}
 const botulus={id:'virus',title:'Botulus',hidden:false,installed:true,subTypes:['Virus'],counters:{virus:1}};
 const host={id:'host',hidden:true,title:'PRIVATE_ICE',number:987655,strengthEffects:[{source:'PRIVATE_EFFECT',amount:-1}],hosted:[botulus]};
 assert.equal(virusStatus(host).hosts.length,1);assert.match(virusMarkup(host),/Botulus/);
 assert.ok(!virusMarkup(host).includes('PRIVATE_ICE'));
 assert.ok(!virusMarkup(host).includes('PRIVATE_EFFECT'));
 const zero={...botulus,counters:{}};
 assert.deepEqual(counterEntries(zero),[['virus',0]]);assert.match(counterMarkup(zero),/0 virus counters/);
 assert.match(counterMarkup(zero),/VIRUS/);
 assert.match(virusMarkup({...host,hosted:[zero]}),/Botulus · 0/,'Purge leaves the hosted-program marker');
 assert.deepEqual(counterEntries({...zero,hidden:true}),[]);

 const reference=await backend.answer({question:'Explain viruses',context},{env:{}});
 assert.equal(backend.status({OPENAI_API_KEY:'unused-ambient-key'}).configured,false,'An ambient API key cannot enable AI without opting in');
 assert.equal(reference.mode,'reference');assert.match(reference.text,/Botulus/);assert.match(reference.text,/3 clicks/);
 const unknown=await backend.answer({question:'Would a moon colony be useful?',context},{env:{}});
 assert.match(unknown.text,/AI chat is not connected/);
 const bug=await backend.answer({question:'Is this a bug?',context},{env:{}});
 assert.match(bug.text,/cannot confirm/);
 let request;
 const mocked=await backend.answer({question:'Why did that ice lose strength?',context:{...context,seed:'PRIVATE_SEED',cards:[...context.cards,{hidden:true,title:'PRIVATE_CARD',number:123456}]},messages:[{role:'system',content:'PRIVATE_INJECTED_ROLE'},{role:'user',content:'Explain Leech'}]},
  {env:{HELPER_PROVIDER:'openai',OPENAI_API_KEY:'fake-test-key'},fetchImpl:async(url,options)=>{request={url,...options,body:JSON.parse(options.body)};return {ok:true,json:async()=>({output:[{type:'message',content:[{type:'output_text',text:'Mock transport response.'}]}]})};}});
 assert.equal(mocked.mode,'ai');assert.equal(request.body.store,false);assert.ok(request.body.input.some(m=>m.content.includes('Hosted virus counter')));
 assert.ok(!JSON.stringify(request.body).includes('PRIVATE_'),'Cloud payload excludes hidden cards, seeds and injected roles');
 assert.equal(mocked.text,'Mock transport response.');
 await assert.rejects(backend.answer({question:'Help',context},{env:{HELPER_PROVIDER:'openai',OPENAI_API_KEY:'test-secret'},fetchImpl:async()=>({ok:false})}),error=>error.status===502&&!error.message.includes('test-secret'));
 const ollama=await backend.answer({question:'Help',context},{env:{HELPER_PROVIDER:'ollama',HELPER_MODEL:'local-test'},fetchImpl:async(url,options)=>{assert.match(url,/127.0.0.1:11434\/api\/chat/);assert.equal(JSON.parse(options.body).stream,false);return {ok:true,json:async()=>({message:{content:'Mock local response.'}})};}});
 assert.equal(ollama.text,'Mock local response.');

 const oldProvider=process.env.HELPER_PROVIDER;process.env.HELPER_PROVIDER='reference';
 const server=require('../server.cjs').createServer();
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}`;
  assert.equal((await (await fetch(url+'/api/helper')).json()).configured,false);
  const answer=await fetch(url+'/api/helper',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'What can I do?',context})});
  assert.equal(answer.status,200);assert.match((await answer.json()).text,/Available decisions/);
  assert.equal((await fetch(url+'/api/helper',{method:'POST',body:'{bad'})).status,400);
  assert.equal((await fetch(url+'/api/helper',{method:'POST',headers:{Origin:'https://unrelated.example'},body:'{}'})).status,403);
  assert.equal((await fetch(url+'/.env.example')).status,403);
  assert.equal((await fetch(url+'/server/helper.cjs')).status,403);
 }finally{await new Promise(resolve=>server.close(resolve));if(oldProvider===undefined)delete process.env.HELPER_PROVIDER;else process.env.HELPER_PROVIDER=oldProvider;}
 console.log('Virus/helper: real Leech reduction/expiry, hosted and zero-counter markers, visible-context privacy, reference answers, mocked AI transports and HTTP boundary pass.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
