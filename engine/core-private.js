/* Core revision 2 private looks and searches. Visibility belongs to a decision
 * window, never to a permanent faceUp flag on an opponent's deck. */
(function(){
'use strict';const enabled=()=>globalThis.NRCoreRulesVersion==='26.03-core-2';
const windowFor=(phase,player,cards,label)=>{phase.corePrivateView={player,cards:cards.slice(),label};return phase;};
const all=AllCards;
AllCards=function(player){const result=all(player);if(!enabled())return result;const seen=new Set(result);function visit(card){for(const held of card.hostedCards||[]){if((player==null||held.player===player)&&!seen.has(held)){result.push(held);seen.add(held);}visit(held);}}for(const card of result.slice())visit(card);for(const p of [corp,runner])if(player==null||player===p)for(const card of p.identityCard?.setAsideCards||[])if(!seen.has(card)){result.push(card);seen.add(card);}return result;};
function aside(card){corp.identityCard.setAsideCards ||= [];MoveCard(card,corp.identityCard.setAsideCards);}
function search(source,operationOnly){
 DecisionPhase(corp,[{pay:true,label:'Spend 1 agenda counter to search R&D',button:'Spend counter and search'},{pay:false,label:'Keep agenda counter',button:'Keep agenda counter'}],function(params){
  if(!params.pay)return;RemoveCounters(source,'agenda',1);
  const found=corp.RnD.cards.filter(card=>!operationOnly||card.cardType==='operation');
  const options=found.map(card=>({card,label:card.title}));if(operationOnly||!found.length)options.push({card:null,label:'Find no card',button:'Find no card'});
  windowFor(DecisionPhase(corp,options,function(choice){
   if(!choice.card){Shuffle(corp.RnD.cards);return;}
   const card=choice.card;aside(card);Shuffle(corp.RnD.cards);
   Reveal(card,function(){
    if(operationOnly){MoveCard(card,corp.RnD.cards);return;}
    const options=[{install:false,label:'Add to HQ',button:'Add to HQ'}];if(['asset','agenda','upgrade','ice'].includes(card.cardType))options.unshift({install:true,label:'Install, ignoring all costs',button:'Install for free'});
    DecisionPhase(corp,options,function(result){if(!result.install){MoveCard(card,corp.HQ.cards);return;}
     DecisionPhase(corp,ChoicesArrayInstall([card],true),function(destination){Install(card,destination.server,true,null,true,undefined,source,()=>MoveCard(card,corp.HQ.cards));},source.title,'Choose where to install the found card',source,'install');
    },source.title,'Install the found card or add it to HQ',source);
   },source);
  },source.title,'Choose a card from R&D',source),corp,found,'Search R&D');
 },source.title,'Spend an agenda counter to search?',source);
}
for(const [id,operationOnly]of [[35059,true],[35071,false]]){const original=cardSet[id].responseOnCorpDiscardEnds.Resolve;cardSet[id].responseOnCorpDiscardEnds.Resolve=function(...args){return enabled()?search(this,operationOnly):original.apply(this,args);};}
const mus=cardSet[35013].responseOnRunnerTurnBegins,oldMusEnum=mus.Enumerate,oldMusResolve=mus.Resolve;
mus.Enumerate=function(...args){return enabled()?(runner.stack.length?[{}]:[]):oldMusEnum.apply(this,args);};
mus.Resolve=function(params){if(!enabled())return oldMusResolve.call(this,params);const card=runner.stack.at(-1);if(!card)return;const options=[{take:false,label:'Leave on top',button:'Leave on top'}];if(CheckSubType(card,'Icebreaker')||card.cardType==='event'&&CheckSubType(card,'Run'))options.unshift({take:true,label:'Reveal and add to grip',button:'Reveal and take'});const source=this;
 windowFor(DecisionPhase(runner,options,function(p){if(p.take)Reveal(card,()=>MoveCard(card,runner.grip),source);},source.title,'Look at the top card of your stack',source),runner,[card],'Top card of your stack');
};
function poetriInstall(source,card){const zone=card.cardLocation,index=zone.indexOf(card);windowFor(DecisionPhase(corp,ChoicesArrayInstall([card]),function(p){Install(card,p.server,false,null,true,undefined,source,()=>{if(zone===corp.RnD.cards)MoveCard(card,zone,index);});},source.title,'Choose where to install this card',source,'install'),corp,[card],'Selected card');}
const poetri=cardSet[35036].responseOnScored,oldPoetri=poetri.Resolve;
poetri.Resolve=function(params){if(!enabled())return oldPoetri.call(this,params);const source=this,top=corp.RnD.cards.slice(-3).reverse(),options=top.filter(card=>card.cardType!=='agenda'&&card.cardType!=='operation').map(card=>({card,label:'Install '+card.title}));options.push({skip:true,label:'Finish looking',button:'Finish looking'});
 windowFor(DecisionPhase(corp,options,function(p){if(p.card)poetriInstall(source,p.card);},source.title,'Look at the top 3 cards of R&D. You may install 1 non-agenda card.',source),corp,top,'Top cards of R&D');
};
const au=cardSet[35046].responseOnCorpTurnBegins,oldAU=au.Resolve;
au.Resolve=function(params){if(!enabled())return oldAU.call(this,params);if(params.id===1)return;const source=this,top=corp.RnD.cards.slice(-3).reverse();RemoveCounters(source,'power',2);
 windowFor(DecisionPhase(corp,top.map(card=>({card,label:'Trash '+card.title})),function(p){Trash(p.card,false,function(){for(const card of top)if(card!==p.card&&card.cardLocation===corp.RnD.cards)MoveCard(card,corp.HQ.cards);});},source.title,'Trash 1 card, then add the rest to HQ',source),corp,top,'Top cards of R&D');
};
const touchups=cardSet[35067],oldTouchups=touchups.Resolve;
touchups.Resolve=function(params){if(!enabled())return oldTouchups.call(this,params);const source=this;PlaceAdvancement(params.card,2);DecisionPhase(corp,['event','hardware','program','resource'].map(type=>({type,label:type,button:type})),function(p){const grip=runner.grip.slice(),matching=grip.filter(card=>card.cardType===p.type),options=matching.map(card=>({card,label:card.title}));const size=Math.min(2,matching.length);options.push({label:'Shuffle selected cards',button:'Shuffle selected cards',multiSelectDynamicButtonText:n=>'Shuffle '+n+' cards'});for(const option of options)option.cards=Array(size).fill(null);Log("Runner's grip revealed");windowFor(DecisionPhase(corp,options,function(selection){const selected=(selection.cards||[]).filter(Boolean);for(const card of selected){card.faceUp=false;MoveCard(card,runner.stack);}if(selected.length)Shuffle(runner.stack);},source.title,'Choose up to 2 '+p.type+' cards',source),corp,grip,'Revealed Runner grip');},source.title,'Choose a card type',source);};
})();
