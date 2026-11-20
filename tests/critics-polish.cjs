'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {createGame}=require('../engine/runtime.cjs');
(async()=>{
 const {optionLabel,installationGroups,clickBreakBatch,clickBreakPlan,deckHealth,rulesTextHTML}=await import('../app/playtest-polish.mjs');
 const {documents,decks,catalog}=require('../engine/vantage.cjs');
 for(const deck of decks.filter(d=>d.purpose==='play')){
  assert(documents.validate(deck.document).valid,deck.id);
  assert.deepEqual(deckHealth(deck.document,catalog.cards),[],deck.id+' has a complete funded rig');
 }
 assert(deckHealth(decks.find(d=>d.id==='vic-full-vp-v1').document,catalog.cards).some(h=>h.includes('Decoder')));
 assert(deckHealth(decks.find(d=>d.id==='vic-full-vp-v1').document,catalog.cards).some(h=>h.includes('Baker')));
 const card={id:'a',number:30038,title:'Ansel 1.0',counters:{}};
 const options=[{index:0,card,server:'HQ'},{index:1,card,server:'R&D'},{index:2,card:{...card,id:'b'},server:'HQ'},{index:3,card:{...card,id:'b'},server:'R&D'}];
 const groups=installationGroups(options);assert.equal(groups.length,1);assert.equal(groups[0].copies.size,2);
 assert.deepEqual(groups[0].options.map(o=>o.index),[0,1,2,3],'All native choices remain intact');
 assert.equal(installationGroups([{card:{id:'secret',hidden:true}}]),null,'Hidden cards are never grouped by identity');
 assert.equal(installationGroups([...options,{index:4,card:{...card,id:'c',counters:{power:1}}}]).length,2,'Different public card state stays distinct');
 assert.equal(installationGroups([{card:{...card,id:'a'},cost:{credits:1}},{card:{...card,id:'b'},cost:{credits:2}}]).length,2,'Copies with different costs remain separate');
 assert.match(rulesTextHTML('click click click <script>'),/aria-label="click"/);assert(!rulesTextHTML('<script>').includes('<script>'));
 const {fixture}=require('./vantage-harness.cjs');
 const ansel=fixture('var ansel=ice(36028);playerTurn=runner;runner.clickTracker=4;attackedServer=corp.HQ;approachIce=0;encountering=true;ChangePhase(phases.runEncounterIce);');
 try{
  let current=await ansel.api.advance();let ability=current.decision.commands.flatMap(c=>c.options.map(o=>({...o,command:c.command}))).find(o=>o.card?.number===36028);
  ansel.api.choose({command:ability.command,index:ability.index,version:current.version});current=await ansel.api.advance();
  const plan=clickBreakBatch(current);assert.equal(plan.ceiling,4);let count=0;
  for(;count<12;count++){const model=clickBreakPlan(current,plan);if(model.status==='complete')break;assert(model.next,JSON.stringify({model,count,phase:current.phase,clicks:current.runner.clicks,options:current.decision.commands}));ansel.api.choose({command:model.next.command,index:model.next.index,version:current.version});current=await ansel.api.advance();}
  assert(count<12);assert.equal(ansel.context.runner.clickTracker,0);assert.equal(ansel.context.ansel.subroutines.filter(s=>s.broken).length,4);
 }finally{ansel.close();}
 let batchTested=false,freeRez=false,recovery=false,anselSkip=false,rootAccess=false,jailbreak=false;
 const captures={};
 for(const name of ['corp','runner','experienced']){
  const raw=require('../docs/playtesting/critics/'+(name==='corp'?'corp-review.json':name+'-game-replay.json'));
  const session=raw.session||raw.evidence.session,g=createGame({vantage:name==='experienced'});
  try{
   g.api.boot(session.config);let state=await g.api.advance();
   for(let i=0;i<session.choices.length;i++){
    const all=state.decision?.commands.flatMap(c=>c.options.map(o=>({...o,command:c.command})))||[];
    const save=key=>{if(!captures[key])captures[key]={...session,choices:session.choices.slice(0,i),conceded:false};};
    if(all.some(o=>optionLabel(o,state)==='Decline free rez')){freeRez=true;save('free-rez');}
    if(all.some(o=>optionLabel(o,state)==='Leave Archives unchanged'))recovery=true;
    if(all.some(o=>optionLabel(o,state)==='Do not install a card'))anselSkip=true;
    if(all.some(o=>o.command==='install'&&o.card?.side==='corp')&&all.filter(o=>o.command==='install').length>4)save('install');
    if(state.installation&&state.run)save('effect-install');
    if(state.run?.encountering&&state.run.tools?.some(t=>t.kind==='breaker'&&!t.matches))save('wrong-type');
    if(all.some(o=>o.command==='access'&&o.label.includes('HQ root'))){
      rootAccess=true;save('access');
      for(const o of all.filter(o=>o.command==='access'&&o.card?.hidden))assert(!o.label.includes('Flagship'),'Hidden title stays private');
    }
    if(all.some(o=>o.label.startsWith('Jailbreak · draw 1')))jailbreak=true;
    const batch=clickBreakBatch(state);
    if(!batchTested&&batch?.targets.length===3){
      save('bioroid');
      const fork=createGame();try{
        fork.api.boot(session.config);let current=await fork.api.advance();
        for(const c of session.choices.slice(0,i)){fork.api.choose(c);current=await fork.api.advance();}
        const approved=clickBreakBatch(current);assert(approved);
        let steps=0;
        for(;steps<12;steps++){
          const model=clickBreakPlan(current,approved);if(model.status==='complete')break;
          assert(['ready','target','finish'].includes(model.status),JSON.stringify({status:model.status,reason:model.reason,steps,approved,phase:current.phase,run:current.run?.card,terminal:current.terminal}));
          fork.api.choose({command:model.next.command,index:model.next.index,version:current.version});current=await fork.api.advance();
        }
        assert(steps<12);assert.equal(approved.initialClicks-current.runner.clicks,3);
        assert(approved.targets.every(n=>current.run.card.subroutines[n-1].broken));
        assert.equal(clickBreakPlan({...current,run:null},approved).status,'invalid');
        assert.equal(clickBreakPlan({...current,active:'corp',run:{...current.run,encountering:true}},approved).status,'waiting');
        batchTested=true;
      }finally{fork.close();}
    }
    g.api.choose(session.choices[i]);state=await g.api.advance();
   }
  }finally{g.close();}
 }
 assert(batchTested,'Actual three-subroutine Ansel encounter exercises the queued plan');
 assert(freeRez&&recovery&&anselSkip&&rootAccess&&jailbreak,'Recorded games cover explicit optional copy, root access and Jailbreak');
 if(process.env.CAPTURE_CRITIC_FIXTURES){fs.mkdirSync('docs/playtesting/critics/fixes',{recursive:true});for(const [key,replay]of Object.entries(captures))fs.writeFileSync('docs/playtesting/critics/fixes/'+key+'-replay.json',JSON.stringify(replay,null,2)+'\n');}
 console.log('PASS critic fixes: legal funded play decks, intact interaction pilots, private access labels, equivalent-copy grouping, optional effect wording, Jailbreak, and native 3-click/3-subroutine queued breaks.');
})().catch(error=>{console.error(error);process.exitCode=1;});
