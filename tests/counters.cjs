'use strict';
const assert = require('node:assert/strict');
const {makeGame, choices, checkSnapshot, checkState} = require('./engine-smoke.cjs');
const fixture = require('../eval/reference-game.json');

async function main() {
 const {counterEntries,counterMarkup,clickMarkup,resourceChanges} = await import('../app/counters.mjs');
 // A malicious/stale object must not render private counters on a hidden card.
 const concealed = {id:'concealed',hidden:true,advancement:2,counters:{credits:9,virus:3,power:4}};
 assert.deepEqual(counterEntries(concealed),[['advancement',2]]);
 assert.ok(!counterMarkup(concealed).includes('data-counter="credits"'));
 assert.match(counterMarkup(concealed),/2 advancement counters/);
 const huge = counterMarkup({id:'rich',counters:{credits:100}});
 assert.match(huge,/data-count="100"/);
 assert.equal((huge.match(/class="coin-layer"/g)||[]).length,9,'Large totals must not create unbounded DOM');
 assert.ok(!counterMarkup(concealed,[{cardId:'concealed',key:'virus',value:0,delta:-3}]).includes('data-counter="virus"'));
 const spent = clickMarkup({side:'runner',clicks:2},{clicks:4});
 assert.equal((spent.match(/just-spent/g)||[]).length,2,'Bioroid/two-click costs flip two markers');
 assert.equal((spent.match(/class="click-pip/g)||[]).length,4);
 assert.ok(!clickMarkup({side:'runner',clicks:2},{clicks:2}).includes('just-spent'),'Passing a timing window does not replay a spend');
 assert.equal((clickMarkup({side:'runner',clicks:4},{clicks:0},false).match(/just-refreshed/g)||[]).length,4);

 const game=makeGame(); let income=0,advancement=0;
 try {
  game.api.boot(fixture.initialConfig); let before=await game.api.advance();
  assert.deepEqual(resourceChanges(null,before),[],'Restore starts without fabricated income');
  for(const entry of fixture.trace) {
   game.api.choose(entry.choice);
   const after=entry.advance===false ? game.api.snapshot() : await game.api.advance();
   checkSnapshot(game,after);
   const changes=resourceChanges(before,after);
   if(entry.label==='Take Nico Campaign income') {
    const card=changes.find(c=>c.key==='credits'&&c.cardId);
    assert.ok(card,'Nico payout is visible on its card');
    assert.equal(card.delta,-3); assert.equal(card.value,6);
    assert.ok(changes.some(c=>c.side==='corp'&&!c.cardId&&c.key==='credits'&&c.delta===3)); income++;
   }
   if(entry.label==='Advance Superconducting Hub') {
    assert.ok(changes.some(c=>c.key==='advancement'&&c.delta===1)); advancement++;
   }
   before=after;
  }
  assert.equal(income,1);assert.equal(advancement,1);
 } finally {game.close();}
 // Changing visibility is not creating or spending a hidden resource.
 const base=structuredClone(fixture.checkpoints.find(c=>c.id==='layered-servers').state);
 const next=structuredClone(base);next.version++;
 const card=next.corp.servers.flatMap(s=>s.root).find(c=>c.number===30037);
 const old=base.corp.servers.flatMap(s=>s.root).find(c=>c.id===card.id);
 old.hidden=true;delete old.counters;delete old.title;
 assert.equal(resourceChanges(base,next).find(c=>c.cardId===card.id)?.delta,null);
 assert.deepEqual(resourceChanges(next,base),[],'Undo/backward checkpoints do not look like new gains');
 const zero=structuredClone(next);zero.version++;
 zero.corp.servers.flatMap(s=>s.root).find(c=>c.id===card.id).counters.credits=0;
 const updates=resourceChanges(next,zero);
 assert.match(counterMarkup({...card,counters:{credits:0}},updates),/data-count="0"/,'Last spent counter remains visible for feedback');
 // Do not retain the old name when a card becomes concealed.
 const hidden=structuredClone(next);hidden.version++;
 Object.assign(hidden.corp.servers.flatMap(s=>s.root).find(c=>c.id===card.id),{hidden:true,counters:{credits:0}});
 assert.ok(!resourceChanges(next,hidden).some(c=>c.cardId===card.id));
 // Worker presentation snapshots must not alter decision versions or outcomes.
 for (const name of ['corp-income','runner-virus']) {
  const replay=require(`../eval/counters/${name}-replay.json`);
  const normal=makeGame(), presented=makeGame();
  try {
   normal.api.boot(replay.config);presented.api.boot(replay.config);
   await normal.api.advance();await presented.api.advance();
   for(const choice of replay.choices) {
    normal.api.choose(choice);presented.api.choose(choice);
    presented.api.snapshot();
    const expected=await normal.api.advance(),actual=await presented.api.advance();
    assert.deepEqual(JSON.parse(JSON.stringify(actual)),JSON.parse(JSON.stringify(expected)),'Presentation snapshot preserves legal replay');
   }
   if(name==='corp-income') {
    const state=presented.api.snapshot();
    const income=choices(state).find(o=>o.command==='trigger'&&o.card?.number===30037);
    presented.api.choose({version:state.version,command:income.command,index:income.index});
    // The trigger itself can open a forced resolution window.
    presented.api.snapshot();
    const paid=await presented.api.advance();
    assert.equal(paid.corp.credits,8);
    assert.equal(paid.corp.servers.flatMap(s=>s.root).find(c=>c.number===30037).counters.credits,6);
    const purge=choices(paid).find(o=>o.command==='purge');
    presented.api.choose({version:paid.version,command:purge.command,index:purge.index});
    const spent=presented.api.snapshot();
    assert.equal(spent.corp.clicks,0,'Purge payment is observable before turn refresh');
    assert.ok(resourceChanges(paid,spent).some(c=>c.key==='clicks'&&c.side==='corp'&&c.delta===-3));
   }
  } finally {normal.close();presented.close();}
 }
 let retained=0, clickIncome=0;
 for (const [file, prefix] of [['corp-income-playtest-final',5],['corp-advance-playtest-final',4],['runner-fresh-session',0],['runner-botulus-session',19],['newcomer-fresh-replay',0]]) {
  const replay=require(`../eval/counters/${file}.json`), game=makeGame();
  try {
   game.api.boot(replay.config);let state=await game.api.advance();
   for(const choice of replay.choices) {
    const option=choices(state).find(o=>o.command===choice.command&&o.index===choice.index);
    if(choice.command==='trigger'&&option?.card?.number===30071) {
     assert.equal(option.cost.clicks,1,'Regolith quotes its click before activation');clickIncome++;
    }
    game.api.choose(choice);state=await game.api.advance();checkState(game);checkSnapshot(game,state);
   }
   retained+=replay.choices.length-prefix;
  } finally {game.close();}
 }
 assert.equal(retained,76,'Five exports preserve 76 new Chrome decisions');
 assert.ok(clickIncome>=2,'Replays exercise the quoted Regolith cost');
 const presentation=require('../eval/counters/browser-results.json');
 assert.equal(presentation.rows.length,8);
 for(const row of presentation.rows) {
  assert.equal(row.pageOverflow,false);assert.equal(row.statusOverflow,false);
  assert.equal(row.hiddenLeaks,0);assert.equal(row.imagesLoaded,true);
  assert.equal(row.handInsideViewport,true);
  assert.equal(row.verticallyClippedCards.length,0);
  assert.ok(row.boardScroll.every(value=>value===0));
  if(row.viewport.width>760)assert.equal(row.clippedBoardCards.length,0);
  assert.equal(row.clickMarkers[0].ready+row.clickMarkers[0].spent,3);
  assert.equal(row.clickMarkers[1].ready+row.clickMarkers[1].spent,4);
 }
 console.log('Chrome counter replays: 76 new retained decisions across 3 independent AI players; 8 current presentation captures pass.');
 console.log('Counters: real Nico 9→6 / pool +3, legal advancement, privacy, visibility, zero, restore and click lifecycle pass.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
