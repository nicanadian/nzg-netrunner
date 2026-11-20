/* Corrections found by the exhaustive bundled-deck audit. Pinned vendor stays unchanged. */
(function(){
'use strict';
const enabled=()=>globalThis.NRCoreRulesVersion==='26.03-core-2';
const clickBonus=new WeakMap(),reset=ResetClicks;
globalThis.AddTempBonusClicks=function(player,amount){clickBonus.set(player,(clickBonus.get(player)||0)+amount);Log(PlayerName(player)+' gets '+amount+' additional allotted click next turn');};
ResetClicks=function(player){reset.call(this,player);const amount=clickBonus.get(player)||0;if(amount){player.clickTracker+=amount;clickBonus.delete(player);}};
// A committed effect can constrain install destinations. Native strategic
// ranking may prefer an unavailable server, but must still choose legally.
const policyEnabled=()=>enabled()&&globalThis.NRAiPolicyVersion==='pressure-v1';
const best=CorpAI.prototype._bestInstallOption;
CorpAI.prototype._bestInstallOption=function(options,inhibit=true){const selected=best.apply(this,arguments);if(!policyEnabled()||selected>=0||inhibit||!options.length)return selected;const decline=options.findIndex(o=>!o.card);if(decline>=0)return decline;const wanted=options.findIndex(o=>o.card===this.preferred?.cardToInstall);return wanted>=0?wanted:0;};
// CR 6.2.4/6.2.7a: the vacated approached position remains until the Runner
// moves inward. Resolve nested trash/end-run prevention before resuming it.
let approached=null,vacated=null;
const change=ChangePhase,move=MoveCardByIndex,automatic=AutomaticTriggers,getIce=GetApproachEncounterIce;
AutomaticTriggers=function(name,...args){if(name==='automaticOnRunBegins'){approached=null;vacated=null;}return automatic.call(this,name,...args);};
MoveCardByIndex=function(index,from,to,...args){
 if(enabled()&&attackedServer&&from===attackedServer.ice&&from!==to&&index>=0&&index<from.length){
  if(index<approachIce)approachIce--;
  else if(index===approachIce&&from[index]===approached)vacated=attackedServer;
 }
 return move.call(this,index,from,to,...args);
};
ChangePhase=function(next,skipInit=false){
 if(enabled()&&next===phases.runApproachIce){
  if(skipInit&&vacated===attackedServer){encountering=false;subroutine=-1;return change.call(this,phases.runDecideContinue);}
  if(!skipInit){approached=attackedServer?.ice[approachIce]||null;vacated=null;}
 }else if(next===phases.runEncounterIce||next===phases.runDecideContinue)approached=null;
 return change.apply(this,arguments);
};
GetApproachEncounterIce=function(){return enabled()&&vacated&&vacated===attackedServer?null:getIce.apply(this,arguments);};
globalThis.NRCoreVacatedApproach=()=>enabled()&&vacated&&vacated===attackedServer;
})();
(function(){
'use strict';
const enabled=()=>globalThis.NRCoreRulesVersion==='26.03-core-2';
const scrounge=cardSet[35004],resolveScrounge=scrounge.Resolve;
const stackOptions=scrounge.AddToStackPhase.Enumerate.add;
scrounge.AddToStackPhase.Enumerate.add=function(){const options=stackOptions.apply(this,arguments);if(enabled()&&!options.some(o=>o.card===null))options.push({id:options.length,card:null,label:'Leave heap unchanged',button:'Leave heap unchanged'});return options;};
scrounge.Resolve=function(...args){
 if(enabled()&&!ChoicesArrayInstall(runner.heap,false,c=>c.cardType==='program').length){
  this.pendingAddToStack=false;this.AddToStackPhase.player=runner;this.AddToStackPhase.next=currentPhase;ChangePhase(this.AddToStackPhase);return;
 }
 return resolveScrounge.apply(this,args);
};
// Preserve the original automatic window in legacy replay profiles. New
// audited games sequence the tag response before the loss/gain instructions.
const instance=InstanceCard;
InstanceCard=function(...args){const card=instance.apply(this,args);if(enabled()&&globalThis.NRAiPolicyVersion==='pressure-v1'&&card.setNumber===35017){
 card.responseOnRunSuccessful={...card.responseOnRunSuccessful,automatic:false,Enumerate(){return this.runningWithThis?[{}]:[];},
 Resolve(){if(!this.runningWithThis)return;const source=this;NRCoreSequence(source,runner,()=>AddTags(1),()=>{const lost=LoseCredits(corp,Math.min(3,Credits(corp)));if(lost>0)GainCredits(runner,2*lost,'',source);});}};
}return card;};
const botulus=cardSet[30004],implement=botulus.AIImplementBreaker,matching=botulus.AIMatchingBreakerInstalled;
botulus.AIImplementBreaker=function(rc,result,point,server,strength,iceAI,...args){if(enabled()&&globalThis.NRAiPolicyVersion==='pressure-v1'&&iceAI.ice?.setNumber===35054)return result;return implement.call(this,rc,result,point,server,strength,iceAI,...args);};
botulus.AIMatchingBreakerInstalled=function(ice){if(enabled()&&globalThis.NRAiPolicyVersion==='pressure-v1'&&ice?.setNumber===35054)return null;return matching.apply(this,arguments);};
const runnerChoice=RunnerAI.prototype._internalChoiceDetermination;
RunnerAI.prototype._internalChoiceDetermination=async function(options,type){
 if(enabled()&&globalThis.NRAiPolicyVersion==='pressure-v1'&&type==='select'&&options.length&&typeof options[0]==='object'&&this.preferred?.command==='trigger'&&this.preferred.cardToTrigger&&!options.some(o=>o.card===this.preferred.cardToTrigger)){
  this.preferred=null;this.cachedBestPath=null;const breakIndex=options.findIndex(o=>/break/i.test(o.ability?.text||o.label||''));return breakIndex>=0?breakIndex:0;
 }
 return runnerChoice.apply(this,arguments);
};
})();
(function(){
'use strict';
const choice=RunnerAI.prototype._internalChoiceDetermination;
RunnerAI.prototype._internalChoiceDetermination=async function(options,type){
 if(globalThis.NRCoreRulesVersion==='26.03-core-2'&&globalThis.NRAiPolicyVersion==='pressure-v1'&&type==='select'&&currentPhase.identifier==='Run Subroutines'&&executingCommand==='continue'&&options.length&&options.every(o=>o&&typeof o==='object')){
  this._cachedOrBestRun(attackedServer,approachIce);
  const point=this.cachedBestPath?.find(p=>p.iceIdx===approachIce-1),alt=point?.alt?.find(a=>a.srIdx===subroutine-1);
  if(point&&!alt){this.cachedBestPath=null;const exit=options.findIndex(o=>/jack out|end the run/i.test(o.label||o.button||''));return exit>=0?exit:0;}
 }
 return choice.apply(this,arguments);
};
})();
(function(){
'use strict';
const choice=RunnerAI.prototype._internalChoiceDetermination;
RunnerAI.prototype._internalChoiceDetermination=async function(options,type){
 const source=currentPhase.context;
 if(globalThis.NRCoreRulesVersion==='26.03-core-2'&&globalThis.NRAiPolicyVersion==='pressure-v1'&&type==='select'&&executingCommand==='continue'&&currentPhase.identifier==='Run 3.1'&&options.some(o=>o.subroutine)){
  const done=options.findIndex(o=>!o.subroutine&&!o.card&&/continue|finish/i.test(o.label||o.button||''));
  if(done>=0){
   const planned=this.cachedBestPath?.find(p=>p.iceIdx===approachIce)?.sr_broken.find(s=>s.use===source);
   const target=planned&&GetApproachEncounterIce()?.subroutines[planned.idx];
   const index=target?options.findIndex(o=>o.subroutine===target):-1;
   if(index>=0){for(const node of this.cachedBestPath)if(node.iceIdx===approachIce)node.sr_broken=node.sr_broken.filter(s=>s!==planned&&!(s.use===source&&s.idx===planned.idx));return index;}
   return done;
  }
 }
 return choice.apply(this,arguments);
};
})();
(function(){
'use strict';
const enabled=()=>globalThis.NRCoreRulesVersion==='26.03-core-2'&&globalThis.NRAiPolicyVersion==='pressure-v1';
const rezzable=CorpAI.prototype._rezzableNonIceCards;
CorpAI.prototype._rezzableNonIceCards=function(){const result=rezzable.apply(this,arguments);return enabled()?result.filter(card=>FullCheckRez(card,['asset','upgrade'])):result;};
const choice=RunnerAI.prototype._internalChoiceDetermination;
RunnerAI.prototype._internalChoiceDetermination=async function(options,type){
 if(enabled()&&type==='select'&&executingCommand==='continue'&&currentPhase.identifier==='Run 3.1'&&options.length&&options.every(o=>o.subroutine)){
  const source=currentPhase.context,ice=GetApproachEncounterIce();
  const planned=this.cachedBestPath?.find(p=>p.iceIdx===approachIce)?.sr_broken.find(s=>s.use===source);
  const index=planned&&ice?options.findIndex(o=>o.subroutine===ice.subroutines[planned.idx]):-1;
  if(index>=0){for(const point of this.cachedBestPath)if(point.iceIdx===approachIce)point.sr_broken=point.sr_broken.filter(s=>!(s.use===source&&s.idx===planned.idx));return index;}
  // The path may be stale after another ability changes the encounter. Break
  // a currently offered threat, then calculate subsequent actions afresh.
  this.cachedBestPath=null;this.preferred=null;
  const rank=text=>/end the run/i.test(text)?100:/core damage/i.test(text)?90:/trash.*program|trash.*installed/i.test(text)?80:/damage/i.test(text)?60:20;
  return options.map((o,i)=>({i,rank:rank(o.subroutine.text)})).sort((a,b)=>b.rank-a.rank)[0].i;
 }
 return choice.apply(this,arguments);
};
})();
