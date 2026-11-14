/* Timing additions for Core rules revision 2. Revision 1 replays retain their
 * previous decision windows; Gateway games never enable these additions. */
(function(){
'use strict';
const enabled=()=>globalThis.NRCoreRulesVersion==='26.03-core-2';
const topan=cardSet[35002],oldTopan=topan.automaticOnInstall.Resolve;
topan.automaticOnInstall.Resolve=function(card){if(!enabled())return oldTopan.call(this,card);if(card!==this.topanInstallingCard)return;this.topanPendingDamage=card;this.topanInstallingCard=null;this.topanAbilityActive=false;this.modifyInstallCost.availableWhenInactive=false;};
topan.responseOnInstall={Enumerate(card){return enabled()&&this.topanPendingDamage===card?[{}]:[];},Resolve(){this.topanPendingDamage=null;Damage('meat',1,true);},text:'Suffer 1 meat damage after installing'};
const sericulture=cardSet[35049].responseOnCorpDiscardEnds,oldSericultureEnumerate=sericulture.Enumerate,oldSericultureResolve=sericulture.Resolve;
sericulture.Enumerate=function(...args){return enabled()?(CheckCounters(this,'agenda',1)&&InstalledCards(null).length?[{}]:[]):oldSericultureEnumerate.apply(this,args);};
sericulture.Resolve=function(...args){if(!enabled())return oldSericultureResolve.apply(this,args);const source=this,options=ChoicesInstalledCards(null,()=>true);options.push({card:null,label:'Keep agenda counter',button:'Keep agenda counter'});DecisionPhase(corp,options,function(p){if(p.card){RemoveCounters(source,'agenda',1);PlaceAdvancement(p.card,2);}},source.title,'Place 2 advancement counters on an installed card',source);};
const madani=cardSet[35028].abilities[1],oldMadani=madani.Resolve;
madani.Resolve=function(params){if(!enabled())return oldMadani.call(this,params);const source=this,card=params.card;source.usedThisTurn=true;const install=destination=>{card.notInstalled=false;Install(card,destination?.host,false,null,true,undefined,source,()=>{card.notInstalled=true;source.usedThisTurn=false;});};if(params.installChoices?.length>1)DecisionPhase(runner,params.installChoices,install,source.title,'Choose install destination',source,'install');else install(params.installChoices?.[0]);};
const idiosyncresis=cardSet[35061].responseOnCorpTurnBegins,oldIdio=idiosyncresis.Enumerate;
idiosyncresis.Enumerate=function(...args){return enabled()?[{}]:oldIdio.apply(this,args);};
const proprionegation=cardSet[35048].abilities[0],oldProprionegation=proprionegation.Enumerate;
proprionegation.Enumerate=function(...args){if(enabled()&&!corp.AI&&attackedServer===corp.archives&&CheckCounters(this,'agenda',1))return [{}];return oldProprionegation.apply(this,args);};
const oldProprionegationResolve=proprionegation.Resolve;
proprionegation.Resolve=function(...args){if(!enabled())return oldProprionegationResolve.apply(this,args);RemoveCounters(this,'agenda',1);const move=()=>{encountering=false;movement=false;subroutine=-1;attackedServer=corp.archives;approachIce=corp.archives.ice.length-1;ChangePhase(approachIce>=0?phases.runApproachIce:phases.runDecideContinue);};if(encountering)TriggeredResponsePhase(playerTurn,'responseOnEncounterEnds',[],move,'End of Encounter');else move();};
const npot=cardSet[35064].runnerAbilities[0],oldNPot=npot.Resolve;
npot.Resolve=function(params){if(!enabled())return oldNPot.call(this,params);SpendCredits(runner,3,'using',this,()=>Break(params.subroutine),this);};
const phat=cardSet[35051],oldPhat=phat._sharedResolve;
phat._sharedResolve=function(){if(!enabled())return oldPhat.call(this);if(this.triggeredThisTurn)return;this.triggeredThisTurn=true;const source=this,options=[];for(let amount=Math.min(2,Counters(source,'power'));amount>=0;amount--)options.push({amount,label:'Remove '+amount+' counters: '+(amount+1)+' net damage',button:'Remove '+amount+' counters: '+(amount+1)+' net damage'});DecisionPhase(corp,options,function(p){if(p.amount)RemoveCounters(source,'power',p.amount);Damage('net',p.amount+1,true);},source.title,'Choose how many power counters to remove',source);};
for(const name of ['responseOnScored','responseOnStolen']){const trigger=cardSet[35080][name],resolve=trigger.Resolve;trigger.automatic=false;trigger.Enumerate=function(){if(!enabled())return [{}];if(!this.rezzed)return [];return (name==='responseOnScored'?this._agendaScoredFromMyServer:attackedServer===GetServer(this))?[{}]:[];};trigger.Resolve=function(...args){return resolve.apply(this,args);};}
const bangun=cardSet[35068],oldBangun=bangun.automaticOnAccess.Resolve;
bangun.automaticOnAccess.Resolve=function(...args){if(!enabled())return oldBangun.apply(this,args);};
bangun.responseOnAccess={Enumerate(){return enabled()&&accessingCard?.cardType==='agenda'&&accessingCard.faceUp&&CheckInstalled(accessingCard)?[{}]:[];},Resolve(){Damage('meat',2,true,()=>AddTags(1));},text:'Do 2 meat damage, then give 1 tag'};
const trend=cardSet[35037].automaticOnWouldTrash,oldTrend=trend.Resolve;
trend.Resolve=function(cards){if(enabled()&&(activePlayer!==runner||!cards.some(card=>card.player===corp&&CheckInstalled(card))))return;return oldTrend.call(this,cards);};
const run=MakeRun;
MakeRun=function(server){
 if(!enabled())return run.apply(this,arguments);
 attackedServer=server;approachIce=-1;encountering=false;movement=false;Log('Run initiated attacking '+server.serverName);GainCredits(runner,corp.badPublicity,'bad publicity');AutomaticTriggers('automaticOnRunBegins',[server]);
 TriggeredResponsePhase(playerTurn,'responseOnRunBegins',[server],function(){
  const next={player:runner,title:'Run: Approach',identifier:'Core Run Approach',Init(){approachIce=attackedServer.ice.length-1;movement=false;if(approachIce>=0)ChangePhase(phases.runApproachIce);else ChangePhase(phases.runDecideContinue);}};
  ChangePhase(CreatePhaseFromTemplate(phaseTemplates.standardResponse,runner,'Run: Initiation','Run 1.5',next));
 },'Run Begins');
};
const approach=phases.runApproachIce.Init;
phases.runApproachIce.Init=function(){approach.call(this);if(enabled()&&attackedServer&&approachIce>=0){const ice=attackedServer.ice[approachIce];AutomaticTriggers('automaticOnApproachIce',[ice]);TriggeredResponsePhase(playerTurn,'responseOnApproachIce',[ice],function(){},'Approach Ice');}};
const serverApproach=phases.runApproachServer.Init;
phases.runApproachServer.Init=function(){if(enabled())AutomaticTriggers('automaticOnWouldApproachServer',[attackedServer]);serverApproach.call(this);};
const breach=phases.runBreachServer.Init;
phases.runBreachServer.Init=function(){breach.call(this);if(enabled())TriggeredResponsePhase(playerTurn,'responseOnBreach',[attackedServer],function(){},'Breach');};
const endRun=EndTheRun;
EndTheRun=function(canBePrevented=true){if(!enabled())return endRun.apply(this,arguments);intended.endRun=true;const finish=()=>{if(intended.endRun){intended.endRun=false;RunUnsuccessful();}};if(canBePrevented&&attackedServer)OpportunityForAvoidPrevent(runner,'responsePreventableEndRun',[],finish,'About to End Run');else finish();};
const runnerEnd=CreatePhaseFromTemplate(phaseTemplates.globalTriggers,runner,"Runner's Action Phase Ends",'Runner 1.4',phases.runnerDiscardStart);
runnerEnd.triggerCallbackName='responseOnRunnerActionPhaseEnds';
const change=ChangePhase;
ChangePhase=function(next,...rest){if(enabled()&&next===phases.runnerDiscardStart&&['Runner 1.3','Runner 1.3*'].includes(currentPhase?.identifier))next=runnerEnd;return change.call(this,next,...rest);};
let discarded=[];
const discardInit=phases.runnerDiscardStart.Init,discard=phases.runnerDiscardStart.Resolve.discard,finishDiscard=phases.runnerDiscardStart.Resolve.n;
phases.runnerDiscardStart.Init=function(){if(enabled())discarded=[];if(discardInit)discardInit.call(this);};
phases.runnerDiscardStart.Resolve.discard=function(params){if(enabled())discarded.push(params.card);return discard.call(this,params);};
phases.runnerDiscardStart.Resolve.n=function(){if(!enabled()||!discarded.length||MaxHandSize(runner)<0)return finishDiscard.call(this);const cards=discarded.splice(0),phase=this;TriggeredResponsePhase(runner,'responseOnDiscardToMaxHandSize',[cards],()=>finishDiscard.call(phase),'Discarded to Hand Size');};
const charm=cardSet[35003].responseOnRunEnds.Resolve;
cardSet[35003].responseOnRunEnds.Resolve=function(...args){const result=charm.apply(this,args);if(enabled())this.runningWithThis=false;return result;};
cardSet[35010].responseOnCorpTurnBegins={Resolve(){if(enabled())this.placedCounterThisTurn=false;},automatic:true};
const magdalene=cardSet[35024].responseOnDiscardToMaxHandSize.Resolve;
cardSet[35024].responseOnDiscardToMaxHandSize.Resolve=function(params){
 if(!enabled())return magdalene.call(this,params);
 if(params.skip)return;const card=params.card,options=params.installChoices||ChoicesCardInstall(card);
 if(options.length>1)DecisionPhase(runner,options,p=>Install(card,p.host),'Magdalene','Choose install destination',this,'install');
 else if(options.length)Install(card,options[0].host);
};
const runFinished=phases.runEnds.Resolve.n;
phases.runEnds.Resolve.n=function(...args){const before=attackedServer,cards=runner.resolvingCards.slice(),result=runFinished.apply(this,args);if(enabled()&&before&&!attackedServer)for(const card of cards)if(card.automaticOnRunEnds?.Resolve)card.automaticOnRunEnds.Resolve.call(card);return result;};
const begins=phases.corpActionStart.Init;
phases.corpActionStart.Init=function(){if(begins)begins.call(this);if(enabled())TriggeredResponsePhase(corp,'responseOnCorpActionPhaseBegins',[],function(){},"Corp Action Phase Begins");};
// Resolve-source tracking lets older Gateway operations supply their source to
// newer credit-gain callbacks without changing the pinned card definitions.
const instance=InstanceCard;
InstanceCard=function(...args){const card=instance.apply(this,args);if(['operation','event'].includes(card.cardType)&&card.Resolve){const resolve=card.Resolve;card.Resolve=function(...params){const old=globalThis.NRCoreEffectSource;globalThis.NRCoreEffectSource=this;try{return resolve.apply(this,params);}finally{globalThis.NRCoreEffectSource=old;}};}return card;};
const zwicky=cardSet[35069].responseOnGainCreditsFromCard,enumerateZwicky=zwicky.Enumerate,resolveZwicky=zwicky.Resolve;
zwicky.Enumerate=function(...args){if(!enabled())return enumerateZwicky.apply(this,args);return this.coreCreditPending?[{id:0,label:'Draw 1 card',button:'Draw 1 card'},{id:1,label:'Decline draw',button:'Decline draw'}]:[];};
zwicky.Resolve=function(params){if(enabled())this.coreCreditPending=false;return resolveZwicky.call(this,params);};
const gain=GainCredits;
GainCredits=function(player,num,temporary='',sourceCard=null){const result=gain.apply(this,arguments);if(!enabled()||player!==corp||num<=0||temporary)return result;sourceCard ||= globalThis.NRCoreEffectSource;const identity=corp.identityCard;if(identity?.setNumber===35069&&!identity.usedThisTurn&&sourceCard&&['agenda','operation'].includes(sourceCard.cardType)){identity.usedThisTurn=true;identity.coreCreditPending=true;TriggeredResponsePhase(corp,'responseOnGainCreditsFromCard',[num,sourceCard],function(){},'Gained Credits');}return result;};
const forfeit=Forfeit;
Forfeit=function(card,after=null,context=null){const green=enabled()&&card.setNumber===35070&&card.cardLocation===corp.scoreArea,result=forfeit.call(this,card);if(!enabled())return result;if(green&&after)NRCoreSequence(card,corp,()=>card.responseOnForfeit.Resolve.call(card),()=>after.call(context));else{if(green)card.responseOnForfeit.Resolve.call(card);if(after)after.call(context);}return result;};
})();
