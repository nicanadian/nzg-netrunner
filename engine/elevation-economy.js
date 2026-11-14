/* Core economy checkpoints missing from the Gateway-only phase graph. */
(function(){
'use strict';
// Petty Cash needs only the zero/at-least-one distinction. A post-action
// enumeration occurs after the action's nested effects finish; click costs alone
// do not establish that an action has finished (notably Humanoid Resources).
const start=phases.corpActionStart.Init,post=phases.corpPostAction.PreEnumerate;
phases.corpActionStart.Init=function(){corp.actionsCompletedThisTurn=0;if(start)start.call(this);};
phases.corpPostAction.PreEnumerate=function(){corp.actionsCompletedThisTurn=1;if(post)post.call(this);};
const petty=cardSet[35081];petty.abilities=[petty.archivesClickAbility];
const triggerables=ChoicesTriggerableAbilities;
ChoicesTriggerableAbilities=function(player,limitTo=''){
 const result=triggerables(player,limitTo);
 if(player===corp)for(const card of corp.archives.cards)if(card.setNumber===35081)for(const option of ChoicesAbility(card,limitTo))result.push({card,ability:option.ability,label:'Play Petty Cash from Archives'});
 return result;
};
// Draw creates a response phase. Finish that draw before Anthill's empty-asset
// trash so neither transaction overwrites the other.
cardSet[35072].responseOnCorpTurnBegins.Resolve=function(){const source=this;TakeCredits(corp,source,4);Draw(corp,1,function(){if(!CheckCounters(source,'credits',1))Trash(source,true);},source);};
})();
