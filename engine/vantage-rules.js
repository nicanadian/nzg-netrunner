/* First Vantage preview batch. Local rules, derived from pinned NSG card text.
 * This file is loaded only by createGame({vantage:true}); no vendor edits. */
(function(){
'use strict';
if(!globalThis.NRVantagePreview)throw Error('Vantage rules require the isolated preview profile.');
const metadata=globalThis.NRVantageCatalog.cards;
const faction={'neutral-runner':'Neutral','neutral-corp':'Neutral','anarch':'Anarch','criminal':'Criminal','shaper':'Shaper','haas-bioroid':'Haas-Bioroid','jinteki':'Jinteki','nbn':'NBN','weyland-consortium':'Weyland'};
function define(id,rules){
 const c=metadata[id];
 cardSet[id]={title:c.title,player:c.side_code==='runner'?runner:corp,faction:faction[c.faction_code],influence:c.faction_cost,cardType:c.type_code,subTypes:c.keywords?.split(' - ')||[],unique:c.uniqueness||false,
  ...(['hardware','program','resource'].includes(c.type_code)?{installCost:c.cost}:['event','operation'].includes(c.type_code)?{playCost:c.cost}:{rezCost:c.cost}),
  ...(c.memory_cost!==undefined?{memoryCost:c.memory_cost}:{}),...(c.strength!==undefined?{strength:c.strength}:{}),
  ...(c.trash_cost!==undefined?{trashCost:c.trash_cost}:{}),...(c.agenda_points!==undefined?{agendaPoints:c.agenda_points,advancementRequirement:c.advancement_cost}:{}),
  ...(c.type_code==='identity'?{deckSize:c.minimum_deck_size,influenceLimit:c.influence_limit,link:c.base_link||0}:{}),...rules};
}
// The restriction is captured when SpendCredits enumerates sources. It does
// not remain active while the asynchronous payment phase awaits decisions.
const stealth=card=>CheckSubType(card,'Stealth');
function restricted(action){const previous=globalThis.NRVantageCreditRestriction;globalThis.NRVantageCreditRestriction=stealth;try{return action();}finally{globalThis.NRVantageCreditRestriction=previous;}}
globalThis.NRVantageCanPayStealth=(amount,card)=>restricted(()=>CheckCredits(runner,amount,'using',card));
globalThis.NRVantageStealthCredits=card=>restricted(()=>AvailableCredits(runner,'using',card));
globalThis.NRVantageSpendStealth=(amount,card,after)=>restricted(()=>SpendCredits(runner,amount,'using',card,after,card));

define(36004,{
 abilities:[{
  text:'1[credit]: Break 1 barrier subroutine.',
  Enumerate(){if(!CheckEncounter()||!CheckSubType(GetApproachEncounterIce(),'Barrier')||!CheckStrength(this)||!CheckCredits(runner,1,'using',this))return [];return ChoicesEncounteredSubroutines();},
  Resolve(params){SpendCredits(runner,1,'using',this,()=>Break(params.subroutine),this);}
 },{
  text:'1[credit]: The barrier you are encountering gets −3 strength this encounter. Spend credits only from stealth cards.',
  Enumerate(){return CheckEncounter()&&CheckSubType(GetApproachEncounterIce(),'Barrier')&&!GetApproachEncounterIce().strengthCannotBeLowered&&NRVantageCanPayStealth(1,this)?[{}]:[];},
  Resolve(){const ice=GetApproachEncounterIce(),source=this;NRVantageSpendStealth(1,this,()=>{
   const expire=function(){const index=lingeringEffects.indexOf(this);if(index>=0)lingeringEffects.splice(index,1);};
   lingeringEffects.push({title:source.title,player:runner,modifyStrength:{Resolve(card){return card===ice?-3:0;}},responseOnEncounterEnds:{Resolve:expire,automatic:true},responseOnRunEnds:{Resolve:expire,automatic:true}});
   Log('Corsair gives '+GetTitle(ice,true)+' −3 strength for this encounter');
  });}
 }]
});
define(36013,{memoryUnits:1,automaticOnInstall:{Resolve(card){if(card===this&&!CheckTags(1))AddTags(1);}}});

// Track the first event globally, even before Touchstone is installed. Reset
// before turn-begins abilities, not on the first event of an arbitrary turn.
let eventPlayed=false;
for(const phase of [phases.runnerTurnBegin,phases.corpTurnBegin]){
 const init=phase.Init;phase.Init=function(...args){eventPlayed=false;if(init)return init.apply(this,args);};
}
const automatic=AutomaticTriggers;
AutomaticTriggers=function(name,cards,...args){
 if(name==='automaticOnPlay'&&cards?.[0]?.player===runner&&cards[0].cardType==='event'){
  const first=!eventPlayed;eventPlayed=true;
  if(first)for(const card of ActiveCards(runner))if(card.setNumber===36021)PlaceCredits(card,1);
 }
 return automatic.call(this,name,cards,...args);
};
define(36021,{credits:0,canUseCredits(){return !!attackedServer;}});
define(36024,{
 installOnlyOn:card=>CheckCardType(card,['ice']),
 responseOnRunSuccessful:{Resolve(){if(this.host&&GetServer(this.host)===attackedServer)GainCredits(runner,2);},automatic:true}
});
define(36029,{
 modifyRezCost:{Resolve(card){return card===this&&CheckInstalled(this)?-InstalledCards(corp).filter(other=>other!==this&&other.cardType==='ice'&&!other.rezzed).length:0;},availableWhenInactive:true},
 AIImplementIce(rc,result){result.sr=[[["endTheRun"]],[["endTheRun"]]];return result;},
 subroutines:[{text:'End the run.',Resolve(){EndTheRun();}},{text:'End the run.',Resolve(){EndTheRun();}}]
});
define(36052,{
 automaticOnEncounter:{Resolve(ice){if(ice===this)LoseCredits(runner,1);}},
 AIImplementIce(rc,result){result.encounterEffects=[["loseCredits"]];result.sr=[[["payCredits"],["endTheRun"]]];return result;},
 subroutines:[{text:'End the run unless the Runner pays 1[credit].',Resolve(){
  if(globalThis.NRVantageRulesVersion!=='26.03-vantage-1'&&!CheckCredits(runner,1,'using',this)){EndTheRun();return;}
  const options=[{pay:false,label:'End the run',button:'End the run'}];
  if(CheckCredits(runner,1,'using',this))options.unshift({pay:true,label:'Pay 1 credit',button:'Pay 1 credit'});
  // Explicit baseline policy: pay when affordable. This is a legal fallback,
  // not a claim that the policy chooses strategically optimal runs/payments.
  if(runner.AI)runner.AI.preferred={title:'Paywall',option:options[0]};
  DecisionPhase(runner,options,params=>{if(params.pay)SpendCredits(runner,1,'using',this,()=>{},this);else EndTheRun();},'Paywall','Pay 1 credit or end the run',this,'continue');
 }}]
});
define(36063,{Resolve(){NRCoreSequence(this,corp,()=>GainCredits(corp,14),()=>BadPublicity(1));}});

// Second batch: a new identity, additional stealth funding and ordinary run/ice effects.
define(36009,{
 usedThisTurn:false,
 responseOnRunnerTurnBegins:{Resolve(){this.usedThisTurn=false;},automatic:true},
 responseOnCorpTurnBegins:{Resolve(){this.usedThisTurn=false;},automatic:true},
 abilities:[{text:'[click], 1[credit]: Draw 1 card and remove 1 tag. Once per turn.',localCost:{clicks:1,credits:1},
  Enumerate(){return !this.usedThisTurn&&CheckActionClicks(runner,1)&&CheckCredits(runner,1,'using',this)?[{}]:[];},
  Resolve(){this.usedThisTurn=true;SpendClicks(runner,1);SpendCredits(runner,1,'using',this,()=>{if(globalThis.NRVantageRulesVersion==='26.03-vantage-3')NRCoreSequence(this,runner,()=>Draw(runner,1),()=>RemoveTags(1));else Draw(runner,1,()=>RemoveTags(1));},this);}
 }]
});
define(36012,{
 modifyPlayCost:{Resolve(card){return card===this?-corp.HQ.ice.length:0;},availableWhenInactive:true},
 Enumerate(){return [{server:corp.HQ,label:'Run HQ'}];},
 Resolve(){this.runningWithThis=true;this.runWasSuccessful=false;MakeRun(corp.HQ);},
 responseOnRunSuccessful:{Resolve(){if(this.runningWithThis)this.runWasSuccessful=true;},automatic:true},
 modifyBreachAccess:{Resolve(){return this.runningWithThis&&this.runWasSuccessful&&attackedServer===corp.HQ?2:0;}},
 automaticOnRunEnds:{Resolve(){this.runningWithThis=false;this.runWasSuccessful=false;}},
 AIRunEventExtraPotential(server,potential){return server===corp.HQ&&potential>0?0.5:0;}
});
define(36020,{
 memoryUnits:1,credits:0,canUseCredits(){return !!attackedServer;},
 responseOnRunBegins:{
  Enumerate(){const targets=ChoicesArrayCards(runner.grip,card=>card.cardType==='hardware'&&CheckTrash(card));if(!targets.length)return [];const decline={skip:true,label:'Keep hardware',button:'Keep hardware'};return runner.AI?[decline]:targets.concat(decline);},
  Resolve(params){if(params.skip)return;const source=this;Trash(params.card,false,()=>{if(params.card.cardLocation===runner.heap)PlaceCredits(source,2);});},
  text:'You may trash a hardware from grip to place 2 credits on Methuselah'
 }
});
const canLook=PlayerCanLook;
PlayerCanLook=function(player,card){return card?.setNumber===36038&&card.cardLocation===corp.RnD.cards&&accessingCard===card||canLook.apply(this,arguments);};
define(36038,{
 responseOnAccess:{Enumerate(){return accessingCard===this?[{}]:[];},Resolve(){if(this.cardLocation===corp.RnD.cards)Log('Esca revealed from R&D');LoseCredits(runner,1);if(CheckTags(1))Damage('net',1,true);},text:'Lose 1 credit; if tagged, suffer 1 net damage',availableWhenInactive:true},
 RezUsability(){return false;}
});
function unlessPay(source,amount,effect,title){
 if(globalThis.NRVantageRulesVersion!=='26.03-vantage-1'&&!CheckCredits(runner,amount,'using',source)){effect();return;}
 const options=[{pay:false,label:title,button:title}];
 if(CheckCredits(runner,amount,'using',source))options.unshift({pay:true,label:`Pay ${amount} credits`,button:`Pay ${amount} credits`});
 if(runner.AI)runner.AI.preferred={title:source.title,option:options[0]};
 DecisionPhase(runner,options,params=>{if(params.pay)SpendCredits(runner,amount,'using',source,()=>{},source);else effect();},source.title,`Pay ${amount} credits or ${title.toLowerCase()}`,source,'continue');
}
define(36041,{
 subroutines:[
  {text:'Do 2 net damage.',Resolve(){Damage('net',2,true);}},
  {text:'Do 2 net damage unless the Runner pays 3[credit].',Resolve(){unlessPay(this,3,()=>Damage('net',2,true),'Suffer 2 net damage');}},
  {text:'Do 2 net damage unless the Runner jacks out.',Resolve(){const options=[{out:true,label:'Jack out',button:'Jack out'},{out:false,label:'Suffer 2 net damage',button:'Suffer 2 net damage'}];if(runner.AI)runner.AI.preferred={title:this.title,option:runner.grip.length>2?options[1]:options[0]};DecisionPhase(runner,options,params=>{if(params.out)JackOut();else Damage('net',2,true);},this.title,'Jack out or suffer 2 net damage',this,'continue');}}
 ],
 AIImplementIce(rc,result){result.sr=[[["netDamage","netDamage"]],[["payCredits","payCredits","payCredits"],["netDamage","netDamage"]],[["endTheRun"],["netDamage","netDamage"]]];return result;}
});
define(36050,{
 responseOnRez:{Enumerate(card){return card===this&&GetServer(this)?.cards?[{}]:[];},Resolve(){BadPublicity(1);},text:'Take 1 bad publicity'},
 subroutines:[0,1].map(()=>({text:'End the run unless the Runner pays 3[credit].',Resolve(){unlessPay(this,3,()=>EndTheRun(),'End the run');}})),
 AIImplementIce(rc,result){result.sr=[[["payCredits","payCredits","payCredits"],["endTheRun"]],[["payCredits","payCredits","payCredits"],["endTheRun"]]];return result;}
});
define(36059,{
 subroutines:[0,1].map(()=>({text:'Gain 1 credit. You may draw 1 card.',Resolve(){GainCredits(corp,1);const options=[{draw:true,label:'Draw 1 card',button:'Draw 1 card'},{draw:false,label:'Do not draw',button:'Do not draw'}];if(corp.AI)corp.AI.preferred={title:this.title,option:corp.RnD.cards.length?options[0]:options[1]};DecisionPhase(corp,options,params=>{if(params.draw)Draw(corp,1);},this.title,'You may draw 1 card',this,'continue');}})),
 AIImplementIce(rc,result){result.sr=[[["misc_minor"]],[["misc_minor"]]];return result;}
});

// Third batch: turn allotments, Archives recycling and pass-time restrictions.
let nextRunnerClickAdjustment=0;
const resetClicks=ResetClicks;
ResetClicks=function(player){resetClicks(player);if(player===runner){runner.clickTracker=Math.max(0,runner.clickTracker+nextRunnerClickAdjustment);nextRunnerClickAdjustment=0;}};
define(36032,{
 Resolve(){const options=[{gain:6,adjustment:-1,label:'Gain 6 credits; Runner gets −1 allotted click next turn',button:'Gain 6 credits · −1 Runner click'},{gain:10,adjustment:1,label:'Gain 10 credits; Runner gets +1 allotted click next turn',button:'Gain 10 credits · +1 Runner click'}];if(corp.AI)corp.AI.preferred={title:this.title,option:options[0]};DecisionPhase(corp,options,function(params){nextRunnerClickAdjustment+=params.adjustment;GainCredits(corp,params.gain);},this.title,'Choose income and next-turn click adjustment',this);}
});
define(36030,{
 subroutines:[
  {text:'You may draw 1 card.',Resolve(){const options=[{draw:true,label:'Draw 1 card',button:'Draw 1 card'},{draw:false,label:'Do not draw',button:'Do not draw'}];if(corp.AI)corp.AI.preferred={title:this.title,option:corp.RnD.cards.length?options[0]:options[1]};DecisionPhase(corp,options,p=>{if(p.draw)Draw(corp,1);},this.title,'You may draw 1 card',this);}},
  {text:'You may shuffle 1 card from HQ or Archives into R&D.',Resolve(){const options=[...ChoicesArrayCards(corp.HQ.cards),...ChoicesArrayCards(corp.archives.cards)].map(p=>({...p,label:`Shuffle ${p.card.title} from ${p.card.cardLocation===corp.HQ.cards?'HQ':'Archives'} into R&D`}));options.push({card:null,label:'Do not shuffle a card',button:'Do not shuffle a card'});if(corp.AI)corp.AI.preferred={title:this.title,option:options[options.length-1]};DecisionPhase(corp,options,p=>{if(p.card)ShuffleInto([p.card],corp.RnD.cards);},this.title,'You may shuffle 1 card into R&D',this);}},
  {text:'End the run.',Resolve(){EndTheRun();}}
 ],AIImplementIce(rc,result){result.sr=[[["misc_minor"]],[["misc_minor"]],[["endTheRun"]]];return result;}
});
define(36031,{
 responseOnPassesIce:{Resolve(){if(GetApproachEncounterIce()!==this||runner.clickTracker>0)return;const expire=function(){const index=lingeringEffects.indexOf(this);if(index>=0)lingeringEffects.splice(index,1);};
 lingeringEffects.push({title:this.title,player:corp,modifyCannot:{Resolve(action,card){return action==='steal'||action==='trash'&&activePlayer===runner&&card?.player===corp;},availableWhenInactive:true},responseOnRunEnds:{Resolve:expire,automatic:true}});Log('Vertigo: Runner cannot steal or trash Corp cards for the remainder of this run');},automatic:true},
 subroutines:[{text:'The Runner loses [click].',Resolve(){LoseClicks(runner,1);}}],
 AIImplementIce(rc,result){result.sr=[[["loseClicks"]]];return result;}
});
define(36042,{
 subroutines:[
  {text:'Do X net damage and give the Runner X tags. X is equal to the number of tags the Runner has.',Resolve(){const count=runner.tags;if(count>0)NRCoreSequence(this,corp,()=>Damage('net',count,true),()=>AddTags(count));}},
  {text:'Give the Runner 1 tag. Trash this ice.',Resolve(){const source=this;NRCoreSequence(source,corp,()=>AddTags(1),()=>Trash(source,true));}}
 ],AIImplementIce(rc,result){const count=runner.tags;result.sr=[[Array(count).fill('netDamage').concat(Array(count).fill('tag'))],[["tag"]]];return result;}
});

// Fourth batch: global turn history and real additional-cost transactions.
let zeroStrengthBroken=false,iceRezzedThisTurn=false;
for(const phase of [phases.runnerTurnBegin,phases.corpTurnBegin]){const init=phase.Init;phase.Init=function(...args){zeroStrengthBroken=false;iceRezzedThisTurn=false;return init?.apply(this,args);};}
const breakSubroutine=Break;
Break=function(subroutine){const ice=GetApproachEncounterIce(),first=!subroutine.broken&&ice&&Strength(ice)<=0&&!zeroStrengthBroken;const result=breakSubroutine.apply(this,arguments);if(first){zeroStrengthBroken=true;for(const card of ActiveCards(runner))if(card.setNumber===36003)GainCredits(runner,1);}return result;};
const automaticTriggers=AutomaticTriggers;
AutomaticTriggers=function(name,args,...rest){if(name==='automaticOnRez'&&args?.[0]?.cardType==='ice')iceRezzedThisTurn=true;return automaticTriggers.call(this,name,args,...rest);};
define(36003,{modifyStrength:{Resolve(card){return card?.cardType==='ice'?-1:0;}}});
define(36016,{
 responseOnRunnerActionPhaseEnds:{Enumerate(){return [{}];},Resolve(){if(!iceRezzedThisTurn){Trash(this,true);return;}const options=[{draw:true,label:'Draw 2 cards',button:'Draw 2 cards'},{draw:false,label:'Remove 1 tag',button:'Remove 1 tag'}];if(runner.AI)runner.AI.preferred={title:this.title,option:runner.tags?options[1]:options[0]};DecisionPhase(runner,options,p=>{if(p.draw)Draw(runner,2);else RemoveTags(1);},this.title,'Draw cards or remove a tag',this);}}
});
define(36011,{
 Enumerate(){return ChoicesInstalledCards(runner,card=>card.cardType==='resource'&&CheckTrash(card)).length?[{}]:[];},
 Resolve(){NRCoreSequence(this,runner,()=>GainCredits(runner,4),()=>Draw(runner,2));}
});
const playWithCosts=Play;
Play=function(card,onPlayResolve,context){if(card.setNumber!==36011)return playWithCosts.apply(this,arguments);return playWithCosts(card,function(finish){const payAdditional=()=>{const choices=ChoicesInstalledCards(runner,c=>c.cardType==='resource'&&CheckTrash(c));if(!choices.length)throw Error('Sell Out has no legal resource to trash as its additional cost.');DecisionPhase(runner,choices,p=>{NRCoreSequence(card,runner,()=>Trash(p.card,false),finish);},card.title,'Trash 1 installed resource as an additional cost',card,'trash');};if(onPlayResolve)onPlayResolve.call(context,payAdditional);else payAdditional();},context);};
define(36033,{
 Enumerate(){const cards=InstalledCards(corp).filter(c=>c.cardType==='ice'&&c.rezzed),options=[];for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++)options.push({first:cards[i],second:cards[j],label:`Derez ${cards[i].title} and ${cards[j].title}`});return options;},
 Resolve(p){const source=this,printed=card=>metadata[String(card.setNumber)]?.cost??NRCardCatalog.cards[String(card.setNumber)]?.cost??card.rezCost;NRCoreSequence(source,corp,()=>GainCredits(corp,printed(p.first)),()=>{Derez(p.first);NRCoreSequence(source,corp,()=>GainCredits(corp,printed(p.second)),()=>Derez(p.second));});}
});
define(36034,{
 Enumerate(){return ChoicesArrayInstall(corp.archives.cards).filter(p=>['agenda','asset','ice'].includes(p.card.cardType));},
 Resolve(p){Install(p.card,p.server);}
});
globalThis.NRVantageRules={define,unlessPay,metadata};
})();
