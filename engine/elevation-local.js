/* Local Elevation ports absent from the pinned candidate. Experimental until the
 * full protocol matrix is complete; official text in card-catalog.js is authority. */
(function(){
'use strict';
const reset=function(){this.operationThisTurn=false;this.tagRemovedThisTurn=false;};
function installChoices(source,ignoreCosts=false){return ChoicesHandInstall(corp,ignoreCosts);}
function tagged(){return runner.tags>0;}
cardSet[35057]={title:'Nebula Talent Management: Making Stars',imageFile:'35057.png',player:corp,faction:'NBN',cardType:'identity',deckSize:45,influenceLimit:15,flipped:false,operationThisTurn:false,
 responseOnCorpTurnBegins:{Resolve:reset,automatic:true},responseOnRunnerTurnBegins:{Resolve:reset,automatic:true},
 automaticOnPlay:{Resolve(card){if(card.player!==corp||card.cardType!=='operation')return;if(this.flipped&&!this.operationThisTurn)GainClicks(corp,1);this.operationThisTurn=true;}},
 responseOnCorpActionPhaseEnds:{Resolve(){if(this.flipped||!this.operationThisTurn)return;GainCredits(corp,1,'',this);this.flipped=true;Log('Nebula Talent Management flipped to its back face.');},automatic:true},
 responseOnRunSuccessful:{Resolve(){if(!this.flipped||![corp.HQ,corp.RnD].includes(attackedServer))return;this.flipped=false;Log('Nebula Talent Management flipped to its front face.');},automatic:true}
};
cardSet[35058]={title:'Synapse Global: Faster than Thought',imageFile:'35058.png',player:corp,faction:'NBN',cardType:'identity',deckSize:45,influenceLimit:15,tagRemovedThisTurn:false,
 responseOnCorpTurnBegins:{Resolve:reset,automatic:true},responseOnRunnerTurnBegins:{Resolve:reset,automatic:true},
 responseOnCoreTagRemoved:{Enumerate(){return installChoices(this,true).concat([{card:null,label:'Decline free install',button:'Decline free install'}]);},Resolve(params){if(!params.card)return;const source=this;Reveal(params.card,function(){Install(params.card,params.server,true);},source);},text:'Reveal and install a card from HQ, ignoring all costs'},
 abilities:[{text:'Remove 1 tag: Gain 2 credits',Enumerate(){return CheckActionClicks(corp,1)&&tagged()?[{}]:[];},Resolve(){SpendClicks(corp,1);RemoveTags(1);GainCredits(corp,2,'',this);}}]
};
// RemoveTags has no native conditional-response checkpoint. Queue the first
// actual removal and open its response after the enclosing resolver finishes.
const removeTags=RemoveTags;
RemoveTags=function(num){const before=runner.tags,result=removeTags.apply(this,arguments),identity=corp.identityCard;
 if(runner.tags<before&&identity?.setNumber===35058&&!identity.tagRemovedThisTurn&&CheckHasAbilities(identity)){identity.tagRemovedThisTurn=true;identity.coreTagPending=true;}
 return result;
};
globalThis.NRCoreFlushTags=function(){const identity=corp.identityCard;if(!identity?.coreTagPending)return;identity.coreTagPending=false;TriggeredResponsePhase(corp,'responseOnCoreTagRemoved',[],function(){},'Synapse Global');};
cardSet[35059]={title:'Embedded Reporting',imageFile:'35059.png',player:corp,faction:'NBN',cardType:'agenda',subTypes:['Initiative'],agendaPoints:2,advancementRequirement:3,
 responseOnScored:{Resolve(){if(intended.score===this)AddCounters(this,'agenda',2*Math.max(0,this.advancement-3));},automatic:true},
 responseOnCorpDiscardEnds:{Enumerate(){return CheckCounters(this,'agenda',1)?[{}]:[];},Resolve(){const source=this;const choices=corp.RnD.cards.filter(c=>c.cardType==='operation').map(card=>({card,label:'Find '+card.title}));choices.push({card:null,label:'Search without finding an operation',button:'Find no operation'},{decline:true,label:'Keep agenda counter',button:'Keep agenda counter'});
  DecisionPhase(corp,choices,function(params){if(params.decline)return;RemoveCounters(source,'agenda',1);if(!params.card){Shuffle(corp.RnD.cards);return;}const card=params.card;Reveal(card,function(){MoveCard(card,corp.resolvingCards);Shuffle(corp.RnD.cards);MoveCard(card,corp.RnD.cards);},source);},'Embedded Reporting','Spend 1 agenda counter to search R&D?',source);
 },text:'Search R&D for an operation'}
};
function nextBigCounter(){if(intended.score===this||intended.steal===this)AddCounters(this,'agenda',1);}
function shuffleHQ(source){
 DecisionPhase(corp,corp.HQ.cards.map(card=>({card,label:'Shuffle '+card.title+' into R&D'})).concat([{card:null,label:'Finish shuffling cards',button:'Finish shuffling cards'}]),function(params){if(!params.card){Shuffle(corp.RnD.cards);return;}MoveCard(params.card,corp.RnD.cards);shuffleHQ(source);},'Next Big Thing','Shuffle any number of cards from HQ into R&D',source);
}
cardSet[35060]={title:'Next Big Thing',imageFile:'35060.png',player:corp,faction:'NBN',cardType:'agenda',subTypes:['Initiative'],agendaPoints:3,advancementRequirement:5,
 responseOnScored:{Resolve:nextBigCounter,automatic:true,availableWhenInactive:true},responseOnStolen:{Resolve:nextBigCounter,automatic:true,availableWhenInactive:true},
 abilities:[{text:'Spend 1 agenda counter: Draw 4, then shuffle cards from HQ into R&D',Enumerate(){return CheckActionClicks(corp,1)&&CheckCounters(this,'agenda',1)&&(this.cardLocation===corp.scoreArea||this.cardLocation===runner.scoreArea)?[{}]:[];},Resolve(){SpendClicks(corp,1);RemoveCounters(this,'agenda',1);const source=this;Draw(corp,4,function(){shuffleHQ(source);},source);}}]
};
const activeCards=ActiveCards,checkActive=CheckActive;
ActiveCards=function(player){const result=activeCards(player);if(player===corp||player==null)for(const card of runner.scoreArea)if(card.setNumber===35060&&!result.includes(card))result.push(card);return result;};
CheckActive=function(card){return card?.setNumber===35060&&card.cardLocation===runner.scoreArea||checkActive(card);};
cardSet[35065]={title:'Bigger Picture',imageFile:'35065.png',player:corp,faction:'NBN',influence:2,cardType:'operation',subTypes:['Gray Ops'],playCost:0,
 Enumerate(){return tagged()?[{}]:[];},Resolve(){const source=this,choices=[{tags:null,label:'Give the Runner 1 tag',button:'Give 1 tag'}];for(let n=0;n<=runner.tags;n++)choices.push({tags:n,label:`Remove ${n} tags: Runner loses up to ${5*n} credits; gain credits lost`,button:`Remove ${n} tags`});
 DecisionPhase(corp,choices,function(params){if(params.tags===null){AddTags(1);return;}const n=Math.min(params.tags,runner.tags),lost=Math.min(runner.creditPool,n*5);RemoveTags(n);LoseCredits(runner,lost);GainCredits(corp,lost,'',source);},'Bigger Picture','Choose tag or credit effect',source);
 }
};
cardSet[35066]={title:'IP Enforcement',imageFile:'35066.png',player:corp,faction:'NBN',influence:5,cardType:'operation',subTypes:['Gray Ops'],playCost:'X',
 Enumerate(){const result=[];for(const card of runner.scoreArea){const printed=NRCardCatalog.cards[String(card.setNumber)]?.agenda_points??card.agendaPoints;if(card.cardType==='agenda'&&runner.tags>=printed&&CheckCredits(corp,printed,'playing',this))result.push({card,playCost:printed,label:`Reclaim ${card.title} (pay ${printed} credits and remove ${printed} tags)`});}return result;},
 Resolve(params){const card=params.card,cost=params.playCost;if(!runner.scoreArea.includes(card))throw Error('IP Enforcement target is no longer legal.');const source=this,options=ChoicesArrayInstall([card],true);
 DecisionPhase(corp,options,function(choice){const origin=currentPhase;ClearAllCounters(card);
 const next={player:corp,title:'IP Enforcement',identifier:'Core IP Continue',Enumerate:{continue:()=>[{}]},Resolve:{continue(){ChangePhase(origin,true);if(runner.tags>0)AddCounters(card,'advancement',1);}}};ChangePhase(next);Install(card,choice.server,false,null,true,undefined,source,undefined,undefined,false);},'IP Enforcement','Choose a remote server for the reclaimed agenda',source,'install');
 }
};
// Pay IP Enforcement's additional cost after credits/clicks are committed but
// before automaticOnPlay and the effect. X is temporarily numeric in native Play.
const play=Play;
Play=function(card,onPlayResolve,context){
 if(card.setNumber!==35066)return play.apply(this,arguments);
 return play(card,function(finish){const paid=function(){const x=Number(card.playCost);if(!Number.isInteger(x)||runner.tags<x)throw Error('Cannot pay IP Enforcement tag cost.');RemoveTags(x);finish();};if(typeof onPlayResolve==='function')onPlayResolve.call(context,paid);else paid();},context);
};
})();
