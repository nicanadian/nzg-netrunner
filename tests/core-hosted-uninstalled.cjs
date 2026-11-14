'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {createGame}=require('../engine/runtime.cjs');
const game=createGame({core:true});
try{
 game.api.boot({side:'runner',control:'scripted',cardPool:'core-v1',rulesVersion:'26.03-core-1',deckIds:{runner:'phoenix-core-v1',corp:'precision-design-core-v1'}});
 vm.runInContext(`var detente=AllCards(runner).find(c=>c.setNumber===35018);MoveCard(detente,runner.rig.hardware);var hosted=AllCards(corp).find(c=>c.cardType==='ice');MoveCard(hosted,corp.HQ.cards);[...corp.HQ.cards].forEach(c=>{if(c!==hosted)MoveCard(c,corp.RnD.cards);});detente.responseOnRunSuccessful.Resolve.call(detente);currentPhase.Resolve.continue({id:0});`,game.context);
 const c=game.context;assert.equal(c.hosted.host,c.detente);assert.equal(c.CheckInstalled(c.hosted),false);assert(!c.InstalledCards().includes(c.hosted));assert.doesNotThrow(()=>c.GetTitle(c.hosted));assert.equal(c.hosted.faceUp,true);
 // Ordinary installed hostees (e.g. Botulus) must still count as installed.
 c.hosted.notInstalled=false;assert.equal(c.CheckInstalled(c.hosted),true);assert(c.InstalledCards().includes(c.hosted));
 console.log('PASS Détente: random hosted HQ ice stays faceup/uninstalled and inspectable; normal hosted installation unaffected.');
}finally{game.close();}
