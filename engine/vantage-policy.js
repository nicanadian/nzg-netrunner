/* Legal choice bridges for new Vantage windows. These are deliberately basic
 * policies; they do not assert strategic competence or alter human choices. */
(function(){
'use strict';
const vantage=card=>card?.setNumber>=36001&&card?.setNumber<=36066;
function explicit(ai,options){const p=ai.preferred;if(p?.title===currentPhase.title){const index=options.indexOf(p.option);if(index>=0){ai.preferred=null;return index;}}return -1;}
const rezzable=CorpAI.prototype._rezzableNonIceCards;
CorpAI.prototype._rezzableNonIceCards=function(){return rezzable.call(this).filter(card=>typeof card.RezUsability!=='function'||card.RezUsability.call(card));};
const corpChoice=CorpAI.prototype.Choice;
CorpAI.prototype.Choice=function(options,type){
 if(type==='select'&&executingCommand==='install'&&vantage(this.preferred?.cardToInstall)){
  const wanted=this.preferred.cardToInstall,legal=options.map((o,i)=>({o,i})).filter(p=>p.o.card===wanted);
  if(legal.length){const preferred=legal.find(p=>p.o.server===this.preferred.serverToInstallTo)||legal.find(p=>p.o.server===corp.RnD)||legal[0];this.preferred=null;return preferred.i;}
 }

 if(type==='select'&&options.length&&typeof options[0]==='object'&&(vantage(currentPhase.context)||vantage(globalThis.installingCard))){
  const preferred=explicit(this,options);if(preferred>=0)return preferred;
  // Playing an operation has committed its card already. Its native
  // cardToPlay preference is not an effect target or install destination.
  if(this.preferred?.command===executingCommand)this.preferred=null;
  if(executingCommand==='install'){const selected=this._bestInstallOption(options,false);return selected>=0?selected:0;}
  return 0;
 }
 return corpChoice.call(this,options,type);
};
const runnerChoice=RunnerAI.prototype._internalChoiceDetermination;
RunnerAI.prototype._internalChoiceDetermination=async function(options,type){
 if(type==='select'&&options.length&&typeof options[0]==='object'){
  const accessTrigger=currentPhase.identifier==='Run Accessing'&&options.some(o=>vantage(o.card)&&o.ability);
  if(vantage(currentPhase.context)||accessTrigger){const preferred=explicit(this,options);if(preferred>=0)return preferred;
   const target=this.preferred?.cardToTrigger;this.preferred=null;const match=options.findIndex(o=>o.card===target);return match>=0?match:0;
  }
 }
 return runnerChoice.call(this,options,type);
};
})();
