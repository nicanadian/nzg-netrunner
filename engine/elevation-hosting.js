/* Core hosted-card lifecycles and Détente's native access transaction. */
(function(){
'use strict';
const detente=cardSet[35018];
delete detente.automaticOnTrash; // No printed return-to-HQ exception: CR 1.13.13.
detente.responseOnCorpTurnBegins={Resolve(){this.usedThisTurn=false;},automatic:true};
function pairs(card,player){if(!CheckActionClicks(player,1))return [];const result=[],held=card.hostedCards||[];for(let i=0;i<held.length;i++)for(let j=i+1;j<held.length;j++)result.push({cards:[held[i],held[j]],label:`Return ${held[i].title} and ${held[j].title} to HQ`});return result;}
detente.abilities[0].Enumerate=function(){return pairs(this,runner);};
detente.abilities[1].Enumerate=function(){return pairs(this,corp);};
detente.abilities[0].Resolve=function(params){this.resolveDetente(runner,params.cards);};
detente.abilities[1].Resolve=function(params){this.resolveDetente(corp,params.cards);};
detente.resolveDetente=function(player,selected){
 if(!selected||selected.length!==2||selected[0]===selected[1]||selected.some(c=>c.cardLocation!==this.hostedCards))throw Error('Choose two cards hosted on Détente.');
 SpendClicks(player,1);for(const card of selected){card.notInstalled=false;card.faceUp=false;MoveCard(card,corp.HQ.cards);}
 DecisionPhase(runner,[{access:true,label:'Access 1 random HQ card',button:'Access HQ card'},{access:false,label:'Decline access',button:'Decline access'}],function(params){
  if(!params.access||!corp.HQ.cards.length)return;
  this.resolveDetenteAccess(corp.HQ.cards[Math.floor(Math.random()*corp.HQ.cards.length)]);
 },'Détente','You may access 1 random card in HQ',this);
};
detente.resolveDetenteAccess=function(card){
 if(!corp.HQ.cards.includes(card))return;
 const origin=currentPhase;
 accessingCard=card;
 const access={...phases.runAccessingCard,title:'Détente: Access',identifier:'Core Access',
  Init(){
   card.renderer.canView=viewingPlayer===runner;
   if(viewingPlayer===runner)card.renderer.ToggleZoom();
   AutomaticTriggers('automaticOnAccess',[card]);
   TriggeredResponsePhase(playerTurn,'responseOnAccess',[],function(){},'Accessed');
  },
  Resolve:{...phases.runAccessingCard.Resolve,n(){ResolveAccess();card.renderer.canView=false;ChangePhase(origin,true);}}
 };
 ChangePhase(access);
};
// Returning a host to hand/stack is distinct from trashing it. Queue the hosted
// cards for the following resolver checkpoint; native Trash already handles its
// own recursive hostees, which are filtered out by the time this queue drains.
const moveTriggers=MoveCardTriggers,pending=[];
MoveCardTriggers=function(card,from,to){
 if([35018,35006].includes(card.setNumber)&&[runner.grip,runner.stack,runner.heap,removedFromGame,null].includes(to)&&from!==to&&card.hostedCards?.length)pending.push({host:card,cards:card.hostedCards.slice()});
 return moveTriggers.apply(this,arguments);
};
globalThis.NRCoreFlushHosted=function(){const trash=[];for(const item of pending.splice(0))for(const card of item.cards)if(card.cardLocation===item.host.hostedCards&&!trash.includes(card)){card.notInstalled=false;trash.push(card);}if(trash.length)Trash(trash,false);};
})();
