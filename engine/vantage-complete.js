/* Remaining Vantage Point rules. Loaded only in the isolated Vantage realm. */
(function(){
'use strict';
const {define,unlessPay,metadata}=NRVantageRules;
globalThis.NRVantageTrackHostLifecycle=()=>globalThis.NRVantageRulesVersion==='26.03-vantage-3';
const active=(id,player=corp)=>ActiveCards(player).filter(c=>c.setNumber===id&&CheckHasAbilities(c));
const seq=(source,effect,next)=>NRCoreSequence(source,source.player,effect,next);
function decide(player,source,options,instruction,resolve,preferred=0){if(!options.length)return;const p=DecisionPhase(player,options,resolve,source.title,instruction,source);if(player.AI)player.AI.preferred={title:source.title,option:options[Math.min(preferred,options.length-1)]};return p;}
const decline=(label='Decline')=>({skip:true,label,button:label});
const look=(phase,player,cards,label)=>{if(phase)phase.corePrivateView={player,cards:cards.slice(),label};return phase;};
const reveal=(card,source,next)=>Reveal(card,next,source,undefined,true);
function removeBad(n){const count=Math.min(n,corp.badPublicity);corp.badPublicity-=count;Log(count+' bad publicity removed');}
function expireAtRunEnd(effect){effect.responseOnRunEnds={automatic:true,Resolve(){const i=lingeringEffects.indexOf(this);if(i>=0)lingeringEffects.splice(i,1);}};lingeringEffects.push(effect);return effect;}
function forbid(source,test){expireAtRunEnd({title:source.title,player:corp,modifyCannot:{availableWhenInactive:true,Resolve(action,card){return action==='steal'&&test(card)||action==='trash'&&activePlayer===runner&&card?.player===corp&&test(card);}}});}
function swapIce(a,b){if(runner.AI)runner.AI.cachedBestPath=null;const sa=GetServer(a),sb=GetServer(b),ia=sa.ice.indexOf(a),ib=sb.ice.indexOf(b);sa.ice[ia]=b;sb.ice[ib]=a;a.cardLocation=sb.ice;b.cardLocation=sa.ice;Log(a.title+' and '+b.title+' swapped');}
// A private ordering window never exposes deck cards in ordinary option DTOs.
function order(source,cards,next=()=>{}){const remaining=cards.filter(c=>c.cardLocation===corp.RnD.cards),chosen=[];function step(){if(remaining.length<=1){chosen.push(...remaining);for(const c of chosen.slice().reverse())MoveCard(c,corp.RnD.cards);next();return;}look(decide(corp,source,remaining.map(card=>({card,label:'Next from top: '+card.title})), 'Arrange R&D from top to bottom',p=>{chosen.push(p.card);remaining.splice(remaining.indexOf(p.card),1);step();}),corp,remaining,'Arrange top cards of R&D');}step();}
let turn=0,agendaThisTurn=false,doubleThisTurn=false,scoredOldThisTurn=false;
const installedTurn=new WeakMap(),scoredTurn=new WeakMap(),agendaServer=new WeakMap();
for(const phase of [phases.runnerTurnBegin,phases.corpTurnBegin]){const init=phase.Init;phase.Init=function(...args){turn++;agendaThisTurn=false;doubleThisTurn=false;scoredOldThisTurn=false;return init?.apply(this,args);};}
const automatic=AutomaticTriggers;
AutomaticTriggers=function(name,args,...rest){if(name==='automaticOnInstall'&&args?.[0]){installedTurn.set(args[0],turn);if(args[0].setNumber===36056)args[0].faceUp=true;}if(name==='automaticOnPlay'&&args?.[0]?.player===corp&&CheckSubType(args[0],'Double'))doubleThisTurn=true;return automatic.call(this,name,args,...rest);};
const move=MoveCardTriggers;
MoveCardTriggers=function(card,from,to){
 const server=card.player===corp?GetServer(card):null;
 if(card.setNumber===36057&&CheckInstalled(card)&&[corp.HQ.cards,corp.RnD.cards,corp.archives.cards,corp.scoreArea,runner.scoreArea,removedFromGame,null].includes(to)&&CheckInstalled(card)&&from!==to&&[corp.HQ.cards,corp.RnD.cards,corp.archives.cards,removedFromGame,null].includes(to)&&card.badPublicity>0){const count=card.badPublicity;card.badPublicity=0;corp.badPublicity+=count;Log('Luana Campos returns '+count+' hosted bad publicity');}
 if(card.cardType==='agenda'&&!card.vantageAddedAsAgenda&&[corp.scoreArea,runner.scoreArea].includes(to)&&from!==to){agendaServer.set(card,server);if(to===corp.scoreArea){scoredTurn.set(card,turn);if(installedTurn.get(card)!==turn)scoredOldThisTurn=true;}if(!agendaThisTurn)for(const room of active(36045))AddCounters(room,'power',1);agendaThisTurn=true;}
 return move.apply(this,arguments);
};
const accessCheck=CheckSteal,steal=Steal;
const finishAccess=phases.runAccessingCard.Enumerate.n;phases.runAccessingCard.Enumerate.n=function(){if(accessingCard?.cardType==='agenda'&&(accessingCard.setNumber===36026||stealTax()>0))return [{}];return finishAccess.call(this);};
globalThis.NRVantageStealCost=()=>({credits:stealTax(),clicks:accessingCard?.setNumber===36026?1:0});
const stealTax=()=>3*active(36048).length;
CheckSteal=function(){return accessCheck.apply(this,arguments)&&(!accessingCard||accessingCard.setNumber!==36026||CheckClicks(runner,1))&&CheckCredits(runner,stealTax(),'stealing',accessingCard);};
Steal=function(){const card=accessingCard,cost=stealTax();if(!CheckSteal())throw Error('Cannot pay agenda stealing costs');const finish=()=>{if(card.setNumber===36026)SpendClicks(runner,1);steal();};if(cost)SpendCredits(runner,cost,'stealing',card,finish,card);else finish();};
// Native access requires taking a steal whenever legal; an unaffordable
// additional cost instead permits finishing the access without stealing.
define(36026,{responseOnScored:{Resolve(){if(intended.score===this)GainClicks(corp,1);},automatic:true}});
define(36037,{
 responseOnScored:{Resolve(){if(intended.score===this)AddCounters(this,'agenda',3);},automatic:true},
 abilities:[{text:'Hosted agenda counter: Move 1 rezzed upgrade to another root.',localCost:{agenda:1},Enumerate(){if(!CheckCounters(this,'agenda',1))return [];return InstalledCards(corp).filter(c=>c.cardType==='upgrade'&&c.rezzed).flatMap(card=>[corp.HQ,corp.RnD,corp.archives,...corp.remoteServers].filter(server=>server!==GetServer(card)&&(!card.vantageCentralOnly||server.cards)&&(!card.vantageHQorRD||[corp.HQ,corp.RnD].includes(server))&&(!CheckSubType(card,'Region')||!server.root.some(c=>CheckSubType(c,'Region')))).map(server=>({card,server,label:`Move ${card.title} to ${server.serverName}`})));},Resolve(p){RemoveCounters(this,'agenda',1);MoveCard(p.card,p.server.root);}}]
});
define(36047,{
 responseOnScored:{Enumerate(){return intended.score===this?[{}]:[];},Resolve(){BadPublicity(1);}},
 responseOnStolen:{Enumerate(){return intended.steal===this?[{}]:[];},Resolve(){BadPublicity(1);},availableWhenInactive:true},
 responseOnCorpActionPhaseEnds:{Enumerate(){return scoredTurn.get(this)===turn?[{}]:[];},Resolve(){RemoveTags(runner.tags);AddTags(3);}}
});
define(36048,{responseOnScored:{Resolve(){LoseCredits(runner,3);},automatic:true}});
define(36049,{
 automaticOnRez:{Resolve(card){if(card===this)AddCounters(this,'power',3);}},
 responseOnCorpTurnBegins:{Resolve(){RemoveTags(1);removeBad(1);},automatic:true},
 responseOnCorpDiscardEnds:{Resolve(){const source=this;seq(source,()=>AddTags(1),()=>seq(source,()=>BadPublicity(1),()=>{RemoveCounters(source,'power',1);if(!Counters(source,'power'))Trash(source,true);}));}}
});
define(36053,{Enumerate(){return ChoicesInstalledCards(corp,CheckAdvance);},Resolve(p){const count=corp.remoteServers.filter(s=>s.root.length&&s.ice.length).length;if(count)PlaceAdvancement(p.card,count);}});
define(36054,{Resolve(){const source=this;decide(runner,source,[{mode:'bad',label:'Remove 2 bad publicity',button:'Remove 2 bad publicity'},{mode:'card',label:'Corp chooses an installed Runner card to shuffle',button:'Shuffle an installed card'}],'Choose Scapegoat’s effect',p=>{if(p.mode==='bad'){removeBad(2);return;}decide(corp,source,ChoicesInstalledCards(runner),'Choose a Runner card to shuffle',q=>ShuffleInto([q.card],runner.stack));});}});
define(36055,{
 modifyRezCost:{Resolve(card){return card===this&&agendaThisTurn?-6:0;},availableWhenInactive:true},
 abilities:[{text:'Trash: Place 1 advancement counter in this server’s root.',Enumerate(){return CheckTrash(this)?GetServer(this).root.filter(CheckAdvance).map(card=>({card,label:'Advance '+card.title})):[];},Resolve(p){const source=this;Trash(source,false,()=>PlaceAdvancement(p.card,1));}}]
});
define(36056,{
 installFaceUp:true,advancedThisTurn:false,damageThisTurn:false,
 responseOnRunnerTurnBegins:{Resolve(){this.advancedThisTurn=false;this.damageThisTurn=false;},automatic:true,availableWhenInactive:true},responseOnCorpTurnBegins:{Resolve(){this.advancedThisTurn=false;this.damageThisTurn=false;},automatic:true,availableWhenInactive:true},
 automaticOnAdvance:{Resolve(card){if(card===this&&!this.advancedThisTurn){this.advancedThisTurn=true;GainCredits(corp,3);}}},
 responseOnRunSuccessful:{Enumerate(){return !this.damageThisTurn&&attackedServer!==GetServer(this)&&CheckCounters(this,'advancement',1)?[{}]:[];},Resolve(){const source=this;decide(corp,source,[{use:true,label:'Remove 1 advancement: Do 1 meat damage',button:'Do 1 meat damage'},decline('Keep advancement')],'Use Sacrifice Zone Expansion?',p=>{if(p.use){source.damageThisTurn=true;RemoveCounters(source,'advancement',1);Damage('meat',1,true);}});}}
});
const checkActive=CheckActive,activeCards=ActiveCards;
CheckActive=function(card){return card?.setNumber===36056&&CheckInstalled(card)||checkActive(card);};
ActiveCards=function(player){const cards=activeCards(player);if(player==null||player===corp)for(const c of InstalledCards(corp))if(c.setNumber===36056&&!cards.includes(c))cards.push(c);return cards;};
define(36057,{badPublicity:0,responseOnCorpTurnBegins:{Enumerate(){return corp.badPublicity>0?[{}]:[];},Resolve(){const source=this;decide(corp,source,[{host:true,label:'Host 1 bad publicity: Gain 3 credits and draw 1 card',button:'Host bad publicity'},decline('Keep bad publicity')],'Use Luana Campos?',p=>{if(p.host){corp.badPublicity--;source.badPublicity++;seq(source,()=>GainCredits(corp,3),()=>Draw(corp,1));}});}}});
define(36061,{Enumerate(){return scoredOldThisTurn?[{}]:[];},Resolve(){this.agendaPoints=2;this.cardType='agenda';this.vantageAddedAsAgenda=true;MoveCard(this,corp.scoreArea);Log('Myōshu added to Corp score area as a 2-point agenda');}});
// Runner run history is global: installing a card mid-turn does not erase it.
let successfulCentrals=new Set(),encounteredThisTurn=false,outerPassedThisTurn=false,subroutineThisRun=false;
for(const phase of [phases.runnerTurnBegin,phases.corpTurnBegin]){const init=phase.Init;phase.Init=function(...args){successfulCentrals.clear();encounteredThisTurn=false;outerPassedThisTurn=false;return init?.apply(this,args);};}
const trigger=Trigger;
Trigger=function(card,ability,...args){if(attackedServer&&card.cardType==='ice'&&card.subroutines.includes(ability))subroutineThisRun=true;return trigger.call(this,card,ability,...args);};
const run=MakeRun;
MakeRun=function(...args){subroutineThisRun=false;return run.apply(this,args);};
const auto=AutomaticTriggers;
AutomaticTriggers=function(name,args,...rest){if(name==='automaticOnRunSuccessful')successfulCentrals.add(attackedServer);return auto.call(this,name,args,...rest);};
define(36001,{
 Enumerate(){return [corp.HQ,corp.RnD,corp.archives].every(s=>successfulCentrals.has(s))?[{}]:[];},
 Resolve(){const source=this,cards=InstalledCards(corp).filter(CheckTrash),options=[];if(cards.length===1)options.push({targets:cards,label:'Trash '+GetTitle(cards[0])});for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++)options.push({targets:[cards[i],cards[j]],label:'Trash '+GetTitle(cards[i])+' and '+GetTitle(cards[j])});const after=()=>decide(corp,source,ChoicesInstalledCards(runner,CheckTrash),'Trash 1 installed Runner card',p=>Trash(p.card,true));if(!options.length){after();return;}decide(runner,source,options,'Trash 2 installed Corp cards',p=>seq(source,()=>Trash(p.targets,true),after));}
});
define(36002,{
 Enumerate(){return [corp.HQ,corp.RnD].map(server=>({server,label:'Run '+server.serverName}));},Resolve(p){this.runningWithThis=true;this.successful=false;MakeRun(p.server);},
 responseOnRunSuccessful:{Resolve(){if(this.runningWithThis)this.successful=true;},automatic:true},
 responseOnRunEnds:{Enumerate(){return this.runningWithThis?[{}]:[];},Resolve(){this.runningWithThis=false;const source=this;if(source.successful&&subroutineThisRun)seq(source,()=>BadPublicity(1),()=>RemoveFromGame(source));else RemoveFromGame(source);}}
});
define(36010,{
 Enumerate(){return [corp.HQ,corp.RnD,corp.archives,...corp.remoteServers].filter(s=>s.ice.length).map(server=>({server,label:'Run '+server.serverName}));},Resolve(p){this.runningWithThis=true;this.successful=false;this.runServer=p.server;MakeRun(p.server);},
 responseOnRunSuccessful:{Resolve(){if(this.runningWithThis)this.successful=true;},automatic:true},
 responseOnRunEnds:{Enumerate(){return this.runningWithThis?[{}]:[];},Resolve(){const source=this;source.runningWithThis=false;if(!source.successful){RemoveFromGame(source);return;}const options=source.runServer.ice.filter(c=>c.rezzed).map(card=>({card,label:'Derez '+card.title})).concat({card:null,label:'Take 1 bad publicity',button:'Take bad publicity'});decide(corp,source,options,'Derez protecting ice or take bad publicity',p=>{if(p.card){Derez(p.card);RemoveFromGame(source);}else seq(source,()=>BadPublicity(1),()=>RemoveFromGame(source));});}}
});
define(36005,{
 power:0,automaticOnInstall:{Resolve(card){if(card===this)AddCounters(this,'power',3);}},
 abilities:[{text:'Access: Hosted power counter and printed cost from stealth: Trash accessed card.',Enumerate(){if(!CheckAccessing()||!CheckCounters(this,'power',1)||!CheckTrash(accessingCard))return [];const cost=NRCardCatalog.cards[String(accessingCard.setNumber)]?.cost;return Number.isFinite(cost)&&NRVantageCanPayStealth(cost,this)?[{card:accessingCard,price:cost}]:[];},Resolve(p){RemoveCounters(this,'power',1);NRVantageSpendStealth(p.price,this,()=>TrashAccessedCard(true));}}]
});
define(36006,{
 canHost(card){return card.cardType==='resource'&&card.unique&&['Companion','Connection'].some(t=>CheckSubType(card,t));},
 modifyMaxHandSize:{Resolve(player){return player===runner&&this.hostedCards?.some(c=>CheckSubType(c,'Companion'))&&this.hostedCards.some(c=>CheckSubType(c,'Connection'))?2:0;}}
});
const installQuote=InstallCost,hostChoices=ChoicesCardInstall;
InstallCost=function(card,destination,...args){return Math.max(0,installQuote.call(this,card,destination,...args)-(destination?.setNumber===36006&&destination.canHost(card)?1:0));};
ChoicesCardInstall=function(card,...args){const choices=hostChoices.call(this,card,...args);if(card.player===runner&&CheckInstall(card))for(const host of active(36006,runner))if(host.canHost(card)&&CheckCredits(runner,InstallCost(card,host),'installing',card)&&!choices.some(p=>p.host===host))choices.push({card,host,label:'Install '+card.title+' on '+host.title});return choices;};
let archivesTurned=0;
const breachInit=phases.runBreachServer.Init;
phases.runBreachServer.Init=function(...args){archivesTurned=0;if(attackedServer===corp.archives){const hidden=corp.archives.cards.filter(c=>!c.faceUp);archivesTurned=hidden.length;for(const c of hidden)c.faceUp=true;}return breachInit.apply(this,args);};
define(36007,{responseOnBreach:{Enumerate(){return archivesTurned>=2?[{}]:[];},Resolve(){Draw(runner,2);}}});
// Resolve first-encounter mutation before the native encounter notification.
const encounterInit=phases.runEncounterIce.Init;
phases.runEncounterIce.Init=function(...args){const ice=GetApproachEncounterIce();if(ice&&!encounteredThisTurn){encounteredThisTurn=true;for(const source of active(36008,runner)){const sub={text:'Do 1 net damage. The Runner draws 1 card.',vantageStick:true,Resolve(){seq(source,()=>Damage('net',1,true),()=>Draw(runner,1));}};ice.subroutines.unshift(sub);expireAtRunEnd({title:source.title,player:runner,responseOnEncounterEnds:{automatic:true,Resolve(){const index=ice.subroutines.indexOf(sub);if(index>=0)ice.subroutines.splice(index,1);const i=lingeringEffects.indexOf(this);if(i>=0)lingeringEffects.splice(i,1);}}});}}return encounterInit?.apply(this,args);};
define(36008,{});
define(36014,{
 memoryUnits:1,extraAccess:0,activeForOpponent:true,
 automaticOnRunBegins:{Resolve(){this.extraAccess=0;}},
 responseOnBreach:{Enumerate(){return [corp.HQ,corp.RnD].includes(attackedServer)?[{}]:[];},Resolve(){const source=this;decide(runner,source,[{tag:true,label:'Take 1 tag: Access 1 additional card',button:'Take tag and access +1'},decline('Keep normal access')],'Use Rotary?',p=>{if(p.tag)seq(source,()=>AddTags(1),()=>{source.extraAccess=1;});});}},
 modifyBreachAccess:{Resolve(){return this.extraAccess;}},automaticOnRunEnds:{Resolve(){this.extraAccess=0;}},
 abilities:[{opponentOnly:true,text:'Click, 2 credits: Trash Rotary if Runner is tagged.',localCost:{clicks:1,credits:2},Enumerate(){return CheckActionClicks(corp,1)&&runner.tags>0&&CheckCredits(corp,2,'using',this)&&CheckTrash(this)?[{}]:[];},Resolve(){const source=this;SpendClicks(corp,1);SpendCredits(corp,2,'using',source,()=>Trash(source,false));}}]
});
define(36015,{
 usedThisTurn:false,runningWithThis:false,responseOnRunnerTurnBegins:{Resolve(){this.usedThisTurn=false;},automatic:true},responseOnCorpTurnBegins:{Resolve(){this.usedThisTurn=false;},automatic:true},
 abilities:[{text:'Once per turn: Click: Run Archives.',localCost:{clicks:1},Enumerate(){return !this.usedThisTurn&&CheckActionClicks(runner,1)?[{}]:[];},Resolve(){this.usedThisTurn=true;this.runningWithThis=true;SpendClicks(runner,1);MakeRun(corp.archives);}}],
 automaticOnRunEnds:{Resolve(){this.runningWithThis=false;}}
});
const approachServer=phases.runApproachServer.Init;
phases.runApproachServer.Init=function(...args){const source=active(36015,runner).find(c=>c.runningWithThis);if(source&&attackedServer===corp.archives&&NRVantageCanPayStealth(1,source)){source.runningWithThis=false;decide(runner,source,[corp.HQ,corp.RnD].map(server=>({server,label:'Pay 1 stealth credit: Approach '+server.serverName})).concat(decline('Approach Archives')),'Redirect Baker’s run?',p=>{if(p.skip){approachServer.apply(this,args);return;}NRVantageSpendStealth(1,source,()=>{attackedServer=p.server;approachIce=-1;Log('Baker redirected the run to '+p.server.serverName);approachServer.apply(this,args);});});return;}return approachServer.apply(this,args);};
const serverApproachInit=phases.runApproachServer.Init;
phases.runApproachServer.Init=function(...args){const source=active(36015,runner).find(c=>c.runningWithThis);if(source&&attackedServer===corp.archives&&NRVantageCanPayStealth(1,source)){source.runningWithThis=false;const origin=this;decide(runner,source,[{server:corp.HQ,label:'Redirect to HQ',button:'Redirect to HQ'},{server:corp.RnD,label:'Redirect to R&D',button:'Redirect to R&D'},decline('Continue to Archives')],'Pay 1 stealth credit to redirect Baker?',p=>{if(p.skip){serverApproachInit.apply(origin,args);return;}NRVantageSpendStealth(1,source,()=>{attackedServer=p.server;approachIce=-1;ChangePhase(phases.runApproachServer);});});return;}return serverApproachInit.apply(this,args);};
define(36017,{
 responseOnInstall:{Enumerate(card){return card?.player===runner&&card.cardType==='hardware'?[{}]:[];},Resolve(){hiramLook(this);}},
 responseOnTrash:{Enumerate(cards){const count=(cards||[]).filter(c=>c.player===runner&&c.cardType==='hardware').length;return count?[{count}]:[];},Resolve(p){hiramLook(this,p.count);}}
});
function hiramLook(source,count=1){const top=corp.RnD.cards.at(-1);if(top)look(decide(runner,source,[{label:'Finish looking',button:'Finish looking'}],'Look at R&D’s top card',()=>{if(count>1)hiramLook(source,count-1);}),runner,[top],'Top card of R&D');}
define(36018,{
 credits:0,runningWithThis:false,canUseCredits(){return this.runningWithThis;},
 Enumerate(){return [corp.HQ,corp.RnD].map(server=>({server,label:'Run '+server.serverName}));},Resolve(p){this.runningWithThis=true;this.successful=false;this.secondRun=false;PlaceCredits(this,4);MakeRun(p.server);},
 responseOnRunSuccessful:{Resolve(){if(this.runningWithThis)this.successful=true;},automatic:true},
 responseOnRunEnds:{Enumerate(){return this.runningWithThis?[{}]:[];},Resolve(){const source=this;if(!source.secondRun&&source.successful&&corp.remoteServers.length){source.secondRun=true;source.successful=false;decide(runner,source,corp.remoteServers.map(server=>({server,label:'Run '+server.serverName})).concat(decline('Finish Aircheck')),'You may run a remote server',p=>{if(p.skip){source.runningWithThis=false;return;}MakeRun(p.server);});}else source.runningWithThis=false;}}
});
globalThis.NRVantagePoolLocked=()=>active(36018,runner).some(c=>c.runningWithThis);
define(36019,{
 Enumerate(){return [{}];},Resolve(){const source=this,programs=runner.stack.filter(c=>c.cardType==='program'&&!CheckSubType(c,'Virus')&&ChoicesCardInstall(c,true).length);look(decide(runner,source,programs.map(card=>({card,label:'Install '+card.title})).concat(decline('Find no program')),'Search for a non-virus program',p=>{Shuffle(runner.stack);source.returnProgram=null;if(p.card){source.returnProgram=p.card;decide(runner,source,ChoicesCardInstall(p.card,true),'Choose where to install the found program',destination=>seq(source,()=>Install(p.card,destination.host,true,null,true,undefined,source,undefined,()=>{p.card.vantageBetaInstalled=true;},false),()=>source.beginBetaRun()));}else source.beginBetaRun();}),runner,programs,'Search stack');},
 beginBetaRun(){this.runningWithThis=true;decide(runner,this,[corp.HQ,corp.RnD,corp.archives,...corp.remoteServers].map(server=>({server,label:'Run '+server.serverName})),'Run any server',p=>MakeRun(p.server));},
 responseOnRunEnds:{Enumerate(){return this.runningWithThis?[{}]:[];},Resolve(){this.runningWithThis=false;const card=this.returnProgram;if(card?.vantageBetaInstalled&&CheckInstalled(card))MoveCard(card,runner.stack);this.returnProgram=null;}}
});
define(36022,{
 responseOnInstall:{Enumerate(card){return card===this&&runner.grip.length?[{}]:[];},Resolve(){hostShare(this);}},responseOnRunnerTurnBegins:{Enumerate(){return runner.grip.length&&(this.hostedCards?.length||0)<4?[{}]:[];},Resolve(){hostShare(this);}},
 abilities:[{text:'Trash: Shuffle all hosted cards into the stack.',Enumerate(){return CheckTrash(this)?[{}]:[];},Resolve(){const source=this,held=(source.hostedCards||[]).slice();source.vantageReturning=[];for(const c of held)MoveCard(c,source.vantageReturning);Trash(source,false,()=>{for(const c of held)c.notInstalled=false;ShuffleInto(held,runner.stack);source.vantageReturning=[];});}}]
});
function hostShare(source){if((source.hostedCards?.length||0)>=4)return;decide(runner,source,ChoicesArrayCards(runner.grip).concat(decline('Do not host a card')),'Host a grip card facedown to draw 1',p=>{if(p.skip)return;source.hostedCards ||= [];MoveCard(p.card,source.hostedCards);p.card.faceUp=false;p.card.notInstalled=true;Draw(runner,1);});}
const visibility=PlayerCanLook,moving=MoveCardTriggers;
PlayerCanLook=function(player,card){if(card.host?.setNumber===36022&&!card.faceUp)return player===runner;return visibility.apply(this,arguments);};
MoveCardTriggers=function(card,from,to){const beta=card.vantageBetaInstalled,held=card.host?.setNumber===36022,result=moving.apply(this,arguments);if(held&&card.host?.setNumber!==36022)card.notInstalled=false;if(beta&&[runner.grip,runner.stack,runner.heap,removedFromGame,null].includes(to))card.vantageBetaInstalled=false;return result;};
let sipaPass=false;const passInit=phases.runPassesIce.Init;phases.runPassesIce.Init=function(...args){const ice=GetApproachEncounterIce();sipaPass=!outerPassedThisTurn&&!!ice&&approachIce===attackedServer.ice.length-1&&ice.subroutines.length>0&&ice.subroutines.every(s=>s.broken);if(sipaPass)outerPassedThisTurn=true;return passInit?.apply(this,args);};
define(36023,{
 responseOnPassesIce:{Enumerate(){const ice=GetApproachEncounterIce();return sipaPass&&ice?[{}]:[];},Resolve(){sipaPass=false;const ice=GetApproachEncounterIce();decide(runner,this,ChoicesInstalledCards(corp,c=>c.cardType==='ice'&&c!==ice).concat(decline('Do not swap ice')),'Swap the fully broken outermost ice?',p=>{if(!p.skip)swapIce(ice,p.card);});}}
});
define(36025,{
 responseOnScored:{Enumerate(){return intended.score&&installedTurn.get(intended.score)!==turn?[{}]:[];},Resolve(){const source=this;seq(source,()=>Trash(source,true),()=>seq(source,()=>GainCredits(runner,4),()=>Draw(runner,1)));}}
});
const scoring=Score,forfeit=Forfeit;
Score=function(card,...args){const words=active(36025,runner);if(installedTurn.get(card)===turn)for(const resource of words){resource.agendaPoints=-1;resource.cardType='agenda';resource.vantageAddedAsAgenda=true;resource.vantageCannotForfeit=true;MoveCard(resource,corp.scoreArea);Log('Word on the Street added to Corp score area: −1 agenda point');}return scoring.call(this,card,...args);};
Forfeit=function(card,...args){if(card.vantageCannotForfeit)throw Error('Word on the Street cannot be forfeited');return forfeit.call(this,card,...args);};
globalThis.NRForfeitableAgendas=()=>corp.scoreArea.filter(c=>!c.vantageCannotForfeit);
const rezCheck=FullCheckRez;FullCheckRez=function(card,...args){if(card.additionalRezCostForfeitAgenda&&!NRForfeitableAgendas().length)return false;return rezCheck.call(this,card,...args);};
let choosingForfeit=false;const choicesForfeit=ChoicesArrayCards,rezForfeit=Rez;
ChoicesArrayCards=function(cards,...args){return choicesForfeit.call(this,choosingForfeit&&cards===corp.scoreArea?NRForfeitableAgendas():cards,...args);};
Rez=function(card,ignore,...args){const before=choosingForfeit;choosingForfeit=!!card.additionalRezCostForfeitAgenda&&!ignore;try{return rezForfeit.call(this,card,ignore,...args);}finally{choosingForfeit=before;}};

define(36027,{});
const fullPlay=FullCheckPlay,spendClicks=SpendClicks;
const doubleDiscount=card=>card?.player===corp&&CheckSubType(card,'Double')&&!doubleThisTurn&&active(36027).length>0;
globalThis.NRVantagePlayClicks=(card,base)=>Math.max(0,base-(doubleDiscount(card)?1:0));
FullCheckPlay=function(card,...args){if(!doubleDiscount(card))return fullPlay.call(this,card,...args);const before=corp.clickTracker;corp.clickTracker++;try{return fullPlay.call(this,card,...args);}finally{corp.clickTracker=before;}};
let payingOperation=null;
const playForClicks=Play;Play=function(card,onPaid,context){return playForClicks(card,onPaid?function(finish){const before=payingOperation;payingOperation=card;try{return onPaid.call(context,finish);}finally{payingOperation=before;}}:onPaid,context);};
SpendClicks=function(player,count){const op=payingOperation;if(player===corp&&op?.cardType==='operation'&&count>0&&doubleDiscount(op))count--;return spendClicks(player,count);};
define(36035,{
 automaticOnRez:{Resolve(c){if(c===this)AddCounters(this,'power',1);}},
 responseOnScored:{Resolve(){if(agendaServer.get(intended.score)===GetServer(this))AddCounters(this,'power',1);},automatic:true},
 responseOnStolen:{Resolve(){if(agendaServer.get(intended.steal)===GetServer(this))AddCounters(this,'power',1);},automatic:true},
 abilities:[{text:'Hosted power counter: Reveal an HQ card; copies cannot be stolen or trashed this run.',localCost:{power:1},Enumerate(){return attackedServer&&CheckCounters(this,'power',1)?ChoicesArrayCards(corp.HQ.cards):[];},Resolve(p){const source=this;RemoveCounters(source,'power',1);reveal(p.card,source,()=>forbid(source,c=>c?.title===p.card.title));}}]
});
define(36045,{vantageCentralOnly:true,abilities:[{text:'Hosted power counter: End a run against another server.',localCost:{power:1},Enumerate(){return attackedServer&&GetServer(this)!==attackedServer&&CheckCounters(this,'power',1)?[{}]:[];},Resolve(){RemoveCounters(this,'power',1);EndTheRun();}}]});
define(36046,{
 responseOnVantageBadPublicity:{Enumerate(){return [{}];},Resolve(){const source=this,found=corp.RnD.cards.filter(c=>c.cardType!=='agenda'&&['Black Ops','Gray Ops','Liability'].some(type=>CheckSubType(c,type)));look(decide(corp,source,found.map(card=>({card,label:'Find '+card.title})).concat(decline('Decline search')),'Search R&D for operations or liabilities',p=>{if(p.skip)return;MoveCard(p.card,corp.HQ.cards);Shuffle(corp.RnD.cards);reveal(p.card,source,()=>{});}),corp,found,'Search R&D');}}
});
let badPubTurn=-1;
const badPublicity=BadPublicity;
BadPublicity=function(amount){const source=corp.identityCard,before=corp.badPublicity;if(source?.setNumber!==36046||badPubTurn===turn)return badPublicity.apply(this,arguments);seq(source,()=>badPublicity(amount),()=>{if(corp.badPublicity>before&&badPubTurn!==turn){badPubTurn=turn;TriggeredResponsePhase(corp,'responseOnVantageBadPublicity',[],()=>{},source.title);}});};
const choicesInstall=ChoicesCardInstall;
ChoicesCardInstall=function(card,...args){return choicesInstall.call(this,card,...args).filter(p=>(!card.vantageCentralOnly||p.server?.cards)&&(!card.vantageHQorRD||[corp.HQ,corp.RnD].includes(p.server)));};
const cardsActive=ActiveCards;
ActiveCards=function(player){const cards=cardsActive(player);if(player==null||player===corp)for(const card of corp.HQ.cards)if(card.setNumber===36060&&!cards.includes(card))cards.push(card);return cards;};
define(36036,{
 flipped:false,secretCopy:0,
 responseOnCorpDiscardEnds:{Enumerate(){return [{}];},Resolve(){const source=this;decide(corp,source,[corp.HQ,corp.RnD,corp.archives].map((server,copy)=>({copy,label:'Set secret copy for '+server.serverName,button:server.serverName})),'Secretly choose a Méliès U copy',p=>{source.secretCopy=p.copy;source.flipped=false;Log('Méliès U identity secretly set');});}},
 responseOnRunnerActionPhaseEnds:{Resolve(){if(!this.flipped)GainCredits(corp,1);},automatic:true},
 responseOnRunnerDiscardEnds:{Resolve(){if(this.flipped){this.flipped=false;Log('Méliès U flipped to its front');}},automatic:true},
 responseOnRunSuccessful:{Enumerate(){return [corp.HQ,corp.RnD,corp.archives].includes(attackedServer)?[{}]:[];},Resolve(){this.flipped=!this.flipped;Log('Méliès U flipped '+(this.flipped?'to side '+(this.secretCopy+1):'to its front'));if(!this.flipped||attackedServer!==[corp.HQ,corp.RnD,corp.archives][this.secretCopy])return;const source=this,top=corp.RnD.cards.at(-1);if(!top)return;look(decide(corp,source,[{trash:true,label:'Trash the top card',button:'Trash top card'},decline('Leave on top')],'Look at the top card of R&D',p=>{if(p.skip)return;seq(source,()=>Trash(top,true),()=>{if(top.cardLocation===corp.archives.cards)decide(corp,source,ChoicesArrayCards(corp.archives.cards),'Add an Archives card to HQ',q=>MoveCard(q.card,corp.HQ.cards));});}),corp,[top],'Top card of R&D');}}
});
define(36062,{
 Enumerate(){return ChoicesArrayInstall(corp.archives.cards,true,c=>c.cardType==='ice');},
 Resolve(p){const source=this,c=p.card,installPrice=p.server?.ice.length||0,rezDiscount=Math.max(0,10-installPrice);c.vantageInstallDiscount=10;c.vantageRezDiscount=rezDiscount;let committed=false;seq(source,()=>Install(c,p.server,false,null,true,undefined,source,undefined,()=>{committed=true;c.vantageRezDiscount=Math.max(0,10-(p.server?.ice.length||0));},false),()=>{c.vantageInstallDiscount=0;if(!committed||!CheckInstalled(c)){c.vantageRezDiscount=0;return;}seq(source,()=>{if(FullCheckRez(c))Rez(c,false,null,null,false);},()=>{c.vantageRezDiscount=0;if(c.rezzed&&!CheckSubType(c,'Liability'))BadPublicity(1);});});}
});
const installPrice=InstallCost,rezPrice=RezCost;
InstallCost=function(card,...args){return Math.max(0,installPrice.call(this,card,...args)-(card.vantageInstallDiscount||0));};
RezCost=function(card){return Math.max(0,rezPrice(card)-(card.vantageRezDiscount||0));};
let flagshipRun=null;
function rememberFlagships(){if(!attackedServer)return;const cards=active(36064).filter(c=>GetServer(c)===attackedServer);flagshipRun ||= {server:attackedServer,cards:new Set(),persistent:new Set()};if(flagshipRun.server!==attackedServer)flagshipRun={server:attackedServer,cards:new Set(),persistent:new Set()};flagshipRun.cards=new Set([...flagshipRun.persistent,...cards]);}
const movingFlagship=MoveCardTriggers;
MoveCardTriggers=function(card,from,to){if(card.setNumber===36064&&card.rezzed&&card===accessingCard&&activePlayer===runner&&to===corp.archives.cards&&GetServer(card)===attackedServer){rememberFlagships();flagshipRun.persistent.add(card);}return movingFlagship.apply(this,arguments);};
define(36064,{vantageHQorRD:true,modifyDeclareSuccess:{Resolve(){return attackedServer===GetServer(this)?1:0;}}});
const accessList=AccessCardList,makeRun=MakeRun;
MakeRun=function(...args){flagshipRun=null;return makeRun.apply(this,args);};
AccessCardList=function(){rememberFlagships();const list=accessList();if(flagshipRun?.server!==attackedServer||!flagshipRun.cards.size)return list;const accessed=[...accessedCards.root,...accessedCards.cards].filter(c=>!flagshipRun.cards.has(c));return accessed.length>=1?list.filter(c=>flagshipRun.cards.has(c)):list;};
define(36065,{
 usedThisTurn:false,responseOnRunnerTurnBegins:{Resolve(){this.usedThisTurn=false;},automatic:true},responseOnCorpTurnBegins:{Resolve(){this.usedThisTurn=false;},automatic:true}
});
globalThis.NRVantageAfterSpend=function(player,outside,next){if(player!==runner||!outside||!attackedServer){next();return;}const sources=active(36065).filter(c=>!c.usedThisTurn&&GetServer(c)===attackedServer);let i=0;function offer(){const source=sources[i++];if(!source){next();return;}decide(corp,source,[{damage:true,label:'Do 4 meat damage',button:'Do 4 meat damage'},decline('Do not use Shackleton Grid')],'Runner spent credits outside the pool',p=>{if(p.skip){offer();return;}source.usedThisTurn=true;seq(source,()=>Damage('meat',4,true),offer);});}offer();};
define(36028,{
 activeForOpponent:true,
 abilities:[{opponentOnly:true,text:'Lose 2 clicks: Break up to 2 subroutines.',localCost:{clicks:2},Enumerate(){return activePlayer===runner&&CheckClicks(runner,2)&&CheckEncounter()&&GetApproachEncounterIce()===this?ChoicesEncounteredSubroutines():[];},Resolve(p){LoseClicks(runner,2);Break(p.subroutine);const source=this,remaining=ChoicesEncounteredSubroutines();if(remaining.length)decide(runner,source,remaining.concat(decline('Finish breaking')),'Break another subroutine without paying more clicks',q=>{if(!q.skip)Break(q.subroutine);});}}],
 subroutines:[
 {text:'Trash 1 installed Runner card.',Resolve(){decide(corp,this,ChoicesInstalledCards(runner,CheckTrash),'Trash a Runner card',p=>Trash(p.card,true));}},
 {text:'Remove 1 card in the heap from the game.',Resolve(){decide(corp,this,ChoicesArrayCards(runner.heap),'Remove a heap card',p=>RemoveFromGame(p.card));}},
 {text:'You may install 1 card from HQ or Archives.',Resolve(){decide(corp,this,[...ChoicesHandInstall(corp),...ChoicesArrayInstall(corp.archives.cards)].concat(decline('Do not install')),'Install from HQ or Archives',p=>{if(!p.skip)Install(p.card,p.server);},0);}},
 {text:'End the run.',Resolve(){EndTheRun();}}],
 AIImplementIce(rc,result){result.sr=[[["misc_serious"]],[["misc_minor"]],[["misc_minor"]],[["endTheRun"]]];return result;}
});
define(36039,{
 abilities:[{text:'Click: Swap this ice with another installed ice.',localCost:{clicks:1},Enumerate(){return CheckActionClicks(corp,1)?ChoicesInstalledCards(corp,c=>c.cardType==='ice'&&c!==this):[];},Resolve(p){SpendClicks(corp,1);swapIce(this,p.card);}}],
 subroutines:[
 {text:'Look at the top card of R&D. You may add it to the bottom.',Resolve(){const top=corp.RnD.cards.at(-1);if(top)look(decide(corp,this,[{bottom:true,label:'Move to bottom',button:'Move to bottom'},{bottom:false,label:'Leave on top',button:'Leave on top'}],'Look at R&D’s top card',p=>{if(p.bottom)MoveCard(top,corp.RnD.cards,0);}),corp,[top],'Top card of R&D');}},
 {text:'All ice gets +1 strength for the remainder of this run.',Resolve(){expireAtRunEnd({title:this.title,player:corp,modifyStrength:{Resolve(c){return c.cardType==='ice'?1:0;}}});}}],
 AIImplementIce(rc,result){result.sr=[[["misc_minor"]],[["misc_minor"]]];return result;}
});
define(36040,{
 virus:0,responseOnEncounterEnds:{Enumerate(){return GetApproachEncounterIce()===this&&Counters(this,'virus')>=3?[{}]:[];},Resolve(){const source=this;seq(source,()=>Purge(),()=>Derez(source));}},
 subroutines:[{text:'Place 1 virus counter on this ice.',Resolve(){AddCounters(this,'virus',1);}},{text:'Arrange the top 4 cards of R&D.',Resolve(){order(this,corp.RnD.cards.slice(-4).reverse());}},{text:'End the run.',Resolve(){EndTheRun();}}],
 AIImplementIce(rc,result){result.sr=[[[]],[["misc_minor"]],[["endTheRun"]]];return result;}
});
define(36051,{
 subroutines:[
 {text:'You may add a card from Archives to the top or bottom of R&D.',Resolve(){const source=this;decide(corp,source,ChoicesArrayCards(corp.archives.cards).concat(decline('Do not add a card')),'Choose an Archives card',p=>{if(!p.skip)decide(corp,source,[{top:true,label:'Top of R&D',button:'Top of R&D'},{top:false,label:'Bottom of R&D',button:'Bottom of R&D'}],'Place '+p.card.title,q=>MoveCard(p.card,corp.RnD.cards,q.top?null:0));});}},
 {text:'Add 1 installed Runner card to the grip.',Resolve(){decide(corp,this,ChoicesInstalledCards(runner),'Return a Runner card to grip',p=>MoveCard(p.card,runner.grip));}}],
 AIImplementIce(rc,result){result.sr=[[["misc_minor"]],[["misc_serious"]]];return result;}
});
const broken=Break,bypass=Bypass;
Break=function(sub){const ice=GetApproachEncounterIce(),wasBroken=sub.broken,result=broken.apply(this,arguments);if(ice?.setNumber===36051&&!wasBroken&&ice.subroutines.every(s=>s.broken))AddTags(1);return result;};
Bypass=function(){const ice=GetApproachEncounterIce();if(ice?.setNumber===36051){const source=ice;seq(source,()=>AddTags(1),()=>bypass());}else return bypass.apply(this,arguments);};
define(36058,{
 abilities:[{text:'Trash: End the run against this server.',Enumerate(){return attackedServer&&GetServer(this)===attackedServer&&CheckTrash(this)?[{}]:[];},Resolve(){const source=this;Trash(source,false,()=>EndTheRun());}}],
 subroutines:[{text:'Trash 1 installed program unless the Runner pays 3 credits.',Resolve(){unlessPay(this,3,()=>decide(corp,this,ChoicesInstalledCards(runner,c=>c.cardType==='program'&&CheckTrash(c)),'Trash 1 program',p=>Trash(p.card,true)),'Trash a program');}},{text:'End the run unless the Runner pays 3 credits.',Resolve(){unlessPay(this,3,()=>EndTheRun(),'End the run');}}],
 AIImplementIce(rc,result){result.sr=[[["payCredits","payCredits","payCredits"],["misc_serious"]],[["payCredits","payCredits","payCredits"],["endTheRun"]]];return result;}
});
define(36060,{
 abilities:[{text:'Click, 1 credit, reveal and trash from HQ: Find a barrier and a sentry.',localCost:{clicks:1,credits:1},Enumerate(){return this.cardLocation===corp.HQ.cards&&CheckActionClicks(corp,1)&&CheckCredits(corp,1,'using',this)&&CheckTrash(this)?[{}]:[];},Resolve(){const source=this;SpendClicks(corp,1);SpendCredits(corp,1,'using',source,()=>reveal(source,source,()=>seq(source,()=>{source.faceUp=true;Trash(source,false);},()=>{const chosen=[];function find(type,next){const options=corp.RnD.cards.filter(c=>c.cardType==='ice'&&CheckSubType(c,type)&&!chosen.includes(c)).map(card=>({card,label:'Find '+card.title})).concat(decline('Find no '+type.toLowerCase()));look(decide(corp,source,options,'Search for up to 1 '+type,p=>{if(p.card)chosen.push(p.card);next();}),corp,options.filter(p=>p.card).map(p=>p.card),'Search R&D');}find('Barrier',()=>find('Sentry',()=>{for(const c of chosen)MoveCard(c,corp.HQ.cards);Shuffle(corp.RnD.cards);let i=0;const next=()=>{if(i<chosen.length)reveal(chosen[i++],source,next);};next();}));})));}}],
 subroutines:[{text:'Runner loses 2 credits.',Resolve(){LoseCredits(runner,2);}},{text:'End the run.',Resolve(){EndTheRun();}},{text:'End the run.',Resolve(){EndTheRun();}}],
 AIImplementIce(rc,result){result.sr=[[["loseCredits","loseCredits"]],[["endTheRun"]],[["endTheRun"]]];return result;}
});
// Tocsin is usable in HQ, so register it as an inactive paid ability.
cardSet[36060].abilities[0].availableWhenInactive=true;
define(36043,{Resolve(){const source=this,top=corp.RnD.cards.slice(-5).reverse();if(!top.length)return;look(decide(corp,source,top.map(card=>({card,label:'Trash '+card.title})),'Trash 1 of the top 5 cards',p=>seq(source,()=>Trash(p.card,false),()=>{const rest=top.filter(c=>c!==p.card&&c.cardLocation===corp.RnD.cards);if(!rest.length)return;look(decide(corp,source,rest.map(card=>({card,label:'Add '+card.title+' to HQ'})),'Add 1 card to HQ',q=>{MoveCard(q.card,corp.HQ.cards);order(source,rest.filter(c=>c!==q.card));}),corp,rest,'Remaining top cards');})),corp,top,'Top 5 cards of R&D');}});
define(36044,{
 Enumerate(){return runner.tags>0?ChoicesInstalledCards(corp,c=>c.cardType==='ice'&&!c.rezzed):[];},
 Resolve(p){const source=this;seq(source,()=>Rez(p.card,true,null,null,false),()=>decide(corp,source,p.card.subroutines.map((subroutine,index)=>({subroutine,label:'Resolve subroutine '+(index+1)+': '+subroutine.text})).concat(decline('Do not resolve a subroutine')),'You may resolve a subroutine',q=>{if(!q.skip)q.subroutine.Resolve.call(p.card);}));}
});
const play=Play;
Play=function(card,onPaid,context){if(card.setNumber!==36044)return play.apply(this,arguments);return play(card,function(finish){const additional=()=>{if(!runner.tags)throw Error('Unleash requires a tag');RemoveTags(1);finish();};if(onPaid)onPaid.call(context,additional);else additional();},context);};
define(36066,{
 responseOnScored:{Enumerate(){return intended.score===this?[{}]:[];},Resolve(){const source=this,found=[...corp.HQ.cards,...corp.RnD.cards,...corp.archives.cards].filter(c=>c.cardType==='agenda');look(decide(corp,source,found.map(card=>({card,label:'Find '+card.title})).concat(decline('Decline search')),'Search for an agenda',p=>{if(p.skip)return;const card=p.card;MoveCard(card,corp.resolvingCards);Shuffle(corp.RnD.cards);reveal(card,source,()=>decide(corp,source,[{hq:true,label:'Add to HQ',button:'Add to HQ'},{hq:false,label:'Add to bottom of R&D',button:'Bottom of R&D'}],'Place the found agenda',q=>MoveCard(card,q.hq?corp.HQ.cards:corp.RnD.cards,q.hq?undefined:0)));}),corp,found,'Search HQ, R&D or Archives');}}
});
const points=AgendaPoints;
AgendaPoints=function(player){return points(player)-(player===runner?runner.scoreArea.filter(c=>c.setNumber===36066).length:0);};
// Declining to search does not shuffle; searching with no legal result does.
globalThis.NRVantageComplete={active,seq,decide,decline,look,reveal,removeBad,expireAtRunEnd,forbid,swapIce,order,installedTurn,scoredTurn,agendaServer,get turn(){return turn;},get agendaThisTurn(){return agendaThisTurn;},get doubleThisTurn(){return doubleThisTurn;}};
})();
