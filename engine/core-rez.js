/* Core revision 2 additional rez costs and printed-subroutine restrictions. */
(function(){
'use strict';const enabled=()=>globalThis.NRCoreRulesVersion==='26.03-core-2';
const forfeitable=()=>globalThis.NRForfeitableAgendas?NRForfeitableAgendas():corp.scoreArea;
const full=FullCheckRez;
FullCheckRez=function(card,types=['upgrade','asset','ice']){
 if(!enabled())return full.apply(this,arguments);
 if(card.additionalRezCostForfeitOrTrashThree&&forfeitable().length===0&&corp.HQ.cards.length<3)return false;
 if(card.optionalForfeitRezReduction&&forfeitable().length&&CheckRez(card,types)&&CheckCredits(corp,Math.max(0,RezCost(card)-card.optionalForfeitRezReduction),'rezzing',card))return true;
 return full.apply(this,arguments);
};
const rez=Rez;
Rez=function(card,ignoreAllCosts=false,onRezResolve=null,context=null,allowCancel=true){
 if(!enabled()||ignoreAllCosts||!card.optionalForfeitRezReduction&&!card.additionalRezCostForfeitOrTrashThree)return rez.apply(this,arguments);
 const previous=currentPhase,active=activePlayer,price=RezCost(card);
 const cancel=allowCancel?()=>{ChangePhase(previous,true);activePlayer=active;Cancel();}:undefined;
 const finish=cost=>SpendCredits(corp,cost,'rezzing',card,()=>rez(card,true,onRezResolve,context),context);
 const options=forfeitable().map(agenda=>({card:agenda,action:'forfeit',label:'Forfeit '+agenda.title}));
 if(card.optionalForfeitRezReduction){if(CheckCredits(corp,price,'rezzing',card))options.push({action:'pay',label:'Pay full rez cost',button:'Pay '+price+' credits'});}
 else if(corp.HQ.cards.length>=3)options.push({action:'trash',label:'Reveal and trash 3 cards from HQ',button:'Choose 3 cards from HQ'});
 if(!options.length){if(cancel)cancel();return;}
 DecisionPhase(corp,options,function(p){
  if(p.action==='pay')return finish(price);
  if(p.action==='forfeit')return Forfeit(p.card,()=>finish(Math.max(0,price-(card.optionalForfeitRezReduction||0))));
  const options=ChoicesArrayCards(corp.HQ.cards),confirm={label:'Reveal and trash 3 cards',button:'Reveal and trash 3 cards',cards:Array(3).fill(null),multiSelectDynamicButtonEnabler:n=>n===3,multiSelectDynamicButtonText:n=>'Reveal and trash '+n+'/3 cards'};options.push(confirm);for(const option of options)option.cards=Array(3).fill(null);
  if(corp.AI){confirm.cards=corp.HQ.cards.slice(0,3);corp.AI.preferred={title:'Rezzing '+card.title,option:confirm};}
  DecisionPhase(corp,options,function(selection){const chosen=selection.cards.filter(Boolean);if(chosen.length!==3)throw Error('Plutus requires exactly 3 cards');let index=0;const revealNext=()=>{if(index<chosen.length)Reveal(chosen[index++],revealNext,card);else{for(const card of chosen)card.faceUp=true;Trash(chosen,false,()=>finish(price),card);}};revealNext();},'Rezzing '+card.title,'Reveal and trash exactly 3 HQ cards',card,'trash',cancel);
 },'Rezzing '+card.title,'Choose the additional rez cost',card,'forfeit',cancel);
};
const instance=InstanceCard;
InstanceCard=function(...args){const card=instance.apply(this,args);if(card.setNumber===35080&&!enabled())for(const name of ['responseOnScored','responseOnStolen']){card[name].automatic=true;delete card[name].Enumerate;}for(const ability of card.abilities||[]){const enumerate=ability.Enumerate;if(enumerate)ability.Enumerate=function(...params){const choices=enumerate.apply(this,params);if(!enabled()||!CheckEncounter()||GetApproachEncounterIce()?.setNumber!==35054||CheckSubType(this,'Fracter'))return choices;const printed=GetApproachEncounterIce().subroutines[0];return choices.filter(p=>p.subroutine!==printed&&!(p.subroutines||[]).includes(printed));};}return card;};
const matches=BreakerMatchesIce;
BreakerMatchesIce=function(breaker,ice){if(enabled()&&ice.setNumber===35054&&!CheckSubType(breaker,'Fracter'))return false;return matches.apply(this,arguments);};
})();
