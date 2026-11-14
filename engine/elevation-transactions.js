/* Sequential installs and hosted-as-grip permissions, using native transactions. */
(function(){
'use strict';
function installThen(card,destination,source,next){
 const origin=currentPhase;let committed=false;
 const continuation={player:card.player,title:source.title,identifier:'Core Install Continue',Enumerate:{continue:()=>[{}]},Resolve:{continue(){ChangePhase(origin,true);next(committed);}}};
 ChangePhase(continuation);
 Install(card,destination,false,null,true,undefined,source,undefined,()=>{committed=true;});
}
const illumination=cardSet[35025];
illumination.responseOnRunSuccessful={Enumerate(){return this.runningWithThis?[{}]:[];},Resolve(){this.installsRemaining=3;this._illuminationInstallLoop();},text:'Install up to 3 cards, paying 1 credit less for each'};
illumination._illuminationInstallLoop=function(){
 if(this.installsRemaining<=0){this.illuminationInstalling=null;this.modifyInstallCost.availableWhenInactive=false;return;}
 this.modifyInstallCost.availableWhenInactive=true;this.illuminationChoosing=true;
 let options;try{options=ChoicesHandInstall(runner);}finally{this.illuminationChoosing=false;}
 const source=this;options.push({skip:true,label:'Finish installing',button:'Finish installing'});
 DecisionPhase(runner,options,function(params){if(params.skip){source.installsRemaining=0;source.illuminationInstalling=null;source.modifyInstallCost.availableWhenInactive=false;return;}
  source.illuminationInstalling=params.card;
  installThen(params.card,params.host,source,installed=>{if(installed)source.installsRemaining--;source.illuminationInstalling=null;source._illuminationInstallLoop();});
 },'Illumination',`Install a card for 1 credit less (${this.installsRemaining} remaining)`,source,'install');
};
illumination.modifyInstallCost.Resolve=function(card){return card.player===runner&&(this.illuminationInstalling===card||(this.illuminationChoosing||currentPhase.title==='Illumination')&&runner.grip.includes(card))?-1:0;};

const paid=new WeakMap();
globalThis.NRCoreInstallPaid=function(card,amount){paid.set(card,amount);card.notInstalled=false;};
const bling=cardSet[35006];delete bling.abilities;
bling.responseOnInstall.Enumerate=function(card){return card.player===runner&&paid.get(card)===0&&runner.stack.length?[{}]:[];};
bling.responseOnRunnerDiscardEnds={Enumerate(){return this.hostedCards?.length?[{}]:[];},Resolve(){const held=this.hostedCards.slice();for(const card of held)card.notInstalled=false;if(held.length)Trash(held,false);},text:'Trash all cards hosted on Bling'};
function held(){return InstalledCards(runner).filter(c=>c.setNumber===35006&&CheckHasAbilities(c)).flatMap(c=>c.hostedCards||[]);}
const handInstall=ChoicesHandInstall;
ChoicesHandInstall=function(player,ignoreCost=false,check){const result=handInstall(player,ignoreCost,check);return player===runner?result.concat(ChoicesArrayInstall(held(),ignoreCost,check)):result;};
const handPlay=phases.runnerActionMain.Enumerate.play;
phases.runnerActionMain.Enumerate.play=function(){return handPlay.call(this).concat(held().filter(card=>FullCheckPlay(card)).map(card=>({card,label:'Play '+card.title+' from Bling'})));};
const moved=MoveCardTriggers;
MoveCardTriggers=function(card,from,to){const wasOnBling=card.host?.setNumber===35006,result=moved.apply(this,arguments);if(card.host?.setNumber===35006)card.notInstalled=true;else if(wasOnBling&&to!==runner.installingCards)card.notInstalled=false;return result;};
})();
