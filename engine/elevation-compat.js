/* Local compatibility corrections for the isolated Elevation worker path. */
(function(){
  // Elevation can host cards without installing them (Détente, Bahram). The
  // Gateway core assumes every hosted card is installed; honor the explicit flag.
  const checkInstalled=CheckInstalled,installedCards=InstalledCards;
  CheckInstalled=function(card){return !!card && !card.notInstalled && checkInstalled(card);};
  InstalledCards=function(player=null){return installedCards(player).filter(card=>!card.notInstalled);};

  cardSet[35076].influence=3; // Printed Syailendra influence (candidate incorrectly used 2).
  const original=CorpAI.prototype._bestInstallOption;
  CorpAI.prototype._bestInstallOption=function(options,...args){
    // Expansion card effects may offer an explicit decline alongside installs.
    // The original ranker assumes every option has a card.
    const installs=options.filter(o=>o.card);
    const selected=installs.length?original.call(this,installs,...args):-1;
    return selected>=0?options.indexOf(installs[selected]):options.findIndex(o=>!o.card);
  };

  // Track an actually fired subroutine instead of assuming every unbroken
  // subroutine will resolve merely because the encounter reached that phase.
  delete cardSet[35001].automaticOnAnyChange;
  const resetPhoenix=function(){this.usedThisTurn=false;};
  cardSet[35001].responseOnRunnerTurnBegins={Resolve:resetPhoenix,automatic:true};
  cardSet[35001].responseOnCorpTurnBegins={Resolve:resetPhoenix,automatic:true};
  const trigger=Trigger;
  Trigger=function(card,ability,params,verb){
    const fired=verb==='Firing' && card?.subroutines?.includes(ability) && attackedServer;
    const result=trigger.apply(this,arguments);
    if(fired && runner.identityCard?.setNumber===35001)runner.identityCard.subroutineResolvedThisRun=true;
    return result;
  };

  // The Gateway phase graph predates this distinct trigger point. Preserve its
  // own optional-response/discard phases and insert only the Core Sets event.
  const actionEnd=CreatePhaseFromTemplate(phaseTemplates.globalTriggers,corp,"Corporation's Action Phase Ends",'Corp 2.3',phases.corpDiscardStart);
  actionEnd.triggerCallbackName='responseOnCorpActionPhaseEnds';
  phases.corpActionPhaseEnds=actionEnd;
  const changePhase=ChangePhase;
  ChangePhase=function(next,...args){
    if(next===phases.corpDiscardStart && ['Corp 2.2','Corp 2.2*'].includes(currentPhase?.identifier))next=actionEnd;
    return changePhase.call(this,next,...args);
  };
  if(typeof ServerName==='undefined')globalThis.ServerName=server=>server?.serverName || 'New remote';
  // Gateway's InstallCost returns the existing ice count directly and predates
  // Corp ice install modifiers. Apply Mercia's marked transaction discount to
  // both the confirmation quote and the actual native payment.
  const installCost=InstallCost;
  InstallCost=function(card,destination,ignoreAllCosts,position){
    const base=installCost.apply(this,arguments);
    if(ignoreAllCosts || card?.player!==corp || card.cardType!=='ice')return base;
    const mercia=InstalledCards(corp).find(c=>c.setNumber===35045 && CheckHasAbilities(c) && c.merciaInstallingIce===card);
    return mercia ? Math.max(0,base-1) : base;
  };
  cardSet[35079].responseOnRez.text='Purge virus counters';
  // Humanoid Resources must finish each native install transaction before it
  // starts the next install. The candidate helper overwrote the pending phase.
  const afterInstall=function(card,server,source,next){
    const origin=currentPhase;let committed=false;
    const continuation={player:corp,title:'Humanoid Resources',identifier:'Core HR Continue',
      Enumerate:{continue:()=>[{}]},Resolve:{continue(){ChangePhase(origin,true);next(committed);}}};
    ChangePhase(continuation);
    Install(card,server,false,null,true,undefined,source,undefined,()=>{committed=true;});
  };
  humanoidResourcesInstall=function(source,count){
    if(count>=2){humanoidResourcesPlayOp(source);return;}
    const options=ChoicesHandInstall(corp).concat([{card:null,label:'Skip remaining installs',button:'Skip remaining installs'}]);
    DecisionPhase(corp,options,function(params){
      if(!params.card){humanoidResourcesPlayOp(source);return;}
      afterInstall(params.card,params.server,source,installed=>humanoidResourcesInstall(source,count+(installed?1:0)));
    },'Humanoid Resources',`Install from HQ (${count}/2 installed)`,source,'install');
  };
  humanoidResourcesPlayOp=function(source){
    const options=corp.HQ.cards.filter(card=>card.cardType==='operation' && CheckPlay(card) && CheckClicks(corp,CheckSubType(card,'Double')?1:0) &&
      CheckCredits(corp,PlayCost(card)==='X'?0:PlayCost(card),'playing',card) &&
      (typeof card.Enumerate!=='function'||card.Enumerate.call(card).length)).map(card=>({card,label:card.title}));
    options.push({card:null,label:'Skip operation',button:'Skip operation'});
    DecisionPhase(corp,options,function(params){
      if(!params.card)return;
      const card=params.card;
      const phase=Play(card,function(resolve){if(CheckSubType(card,'Double'))SpendClicks(corp,1);SpendCredits(corp,PlayCost(card),'playing',card,resolve,source);},source);
      phase.corePlayActionClicks=CheckSubType(card,'Double')?1:0;
    },'Humanoid Resources','Play 1 operation from HQ (optional)',source);
  };
  cardSet[35039].abilities[0].Resolve=function(){
    const source=this;
    SpendClicks(corp,3);
    Trash(source,false,function(){
      GainCredits(corp,4,'',source);
      Draw(corp,3,()=>humanoidResourcesInstall(source,0),source);
    },source);
  };
  cardSet[35039].AIWouldTrigger=function(){return CheckActionClicks(corp,3)&&corp.RnD.cards.length>=3&&Credits(corp)<5;};

})();
