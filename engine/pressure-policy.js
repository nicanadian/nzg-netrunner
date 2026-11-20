/* Versioned, conservative pressure overrides. Missing policy keeps native AI.
 * All alternatives come from the current legal option lists. Runner targets
 * use public server state and the native run calculator, never Corp hand/deck. */
(function () {
  const supported = ['native-v1','pressure-v1'];
  let policy='native-v1', lastProbe=-1, lastDig=-1, attacked=new Map(), totals, recent=[], reasons={};
  const fresh=()=>({actions:0,gain:0,draw:0,install:0,play:0,run:0,advance:0,score:0,overrides:0,idleWithAgenda:0,scoreOffered:0,scoreTaken:0,runs:0,probesConsidered:0,probesRejected:0});
  function configure(value) {
    policy=value||'native-v1';if(!supported.includes(policy))throw Error('Unsupported AI policy: '+policy);
    lastProbe=-1;lastDig=-1;reasons={};attacked=new Map();totals={runner:fresh(),corp:fresh()};recent=[];
  }
  function noteRun(server,turn) {totals.runner.runs++;attacked.set(server,(attacked.get(server)||0)+1);if(playerTurn===runner)lastProbe=turn;}
  async function select(ai, options, baseline, turn) {
    const phase=currentPhase.identifier, idle=['gain','draw','n'].includes(baseline.command);
    let selected=baseline, reason='native';
    const choose=(command,index,why)=>{selected={command,index};reason=why;ai.preferred=null;};
    if(policy==='pressure-v1' && idle && phase==='Corp 2.2') {
      if(options.score?.length)choose('score',0,'score-ready-agenda');
      else {
        const advance=options.advance?.findIndex(o=>o.card.cardType==='agenda' && Counters(o.card,'advancement')<AdvancementRequirement(o.card));
        if(advance>=0)choose('advance',advance,'advance-installed-agenda');
        else {
          const installs=options.install||[];
          const emptyRemote=server=>server && corp.remoteServers.includes(server) && !server.root.some(c=>['agenda','asset'].includes(c.cardType));
          const stopsRun=card=>card.subroutines?.some(s=>/end the run/i.test(s.text));
          // Stage a multi-turn score as well as an immediate score. Keep enough
          // credits to activate the stopping ice and advance the agenda.
          const agenda=installs.findIndex(o=>o.card.cardType==='agenda' && emptyRemote(o.server) &&
            o.server.ice.some(c=>stopsRun(c) && (c.rezzed?0:RezCost(c))+Math.min(3,AdvancementRequirement(o.card))<=corp.creditPool));
          if(agenda>=0)choose('install',agenda,'use-defended-scoring-window');
          else {
            const heldAgenda=corp.HQ.cards.find(c=>c.cardType==='agenda');
            const lane=heldAgenda && installs.findIndex(o=>o.card.cardType==='ice' && stopsRun(o.card) &&
              (emptyRemote(o.server) && o.server.ice.length===0 || o.server===null && !corp.remoteServers.some(s=>emptyRemote(s)&&s.ice.length)) &&
              InstallCost(o.card,o.server,false,o.server?null:0)+RezCost(o.card)+Math.min(3,AdvancementRequirement(heldAgenda))<=corp.creditPool);
            if(lane>=0 && lane!==false)choose('install',lane,'build-defended-scoring-lane');
            else if(heldAgenda && baseline.command==='gain' && corp.creditPool>=8 && corp.HQ.cards.length<MaxHandSize(corp) &&
              corp.RnD.cards.length>5 && lastDig!==turn && options.draw?.length){choose('draw',0,'seek-scoring-support');lastDig=turn;}
            else {
            const ice=installs.map((o,index)=>({o,index})).filter(({o})=>o.card.cardType==='ice' && [corp.HQ,corp.RnD].includes(o.server) &&
              o.server.ice.length<2 && !o.server.ice.some(c=>!c.rezzed) &&
              InstallCost(o.card,o.server)+RezCost(o.card)+2<=corp.creditPool)
              .sort((a,b)=>(attacked.get(b.o.server)||0)-(attacked.get(a.o.server)||0) || a.o.server.ice.length-b.o.server.ice.length || RezCost(a.o.card)-RezCost(b.o.card));
            if(ice.length)choose('install',ice[0].index,'reinforce-affordable-central');
            }
          }
        }
      }
    }
    if(policy==='pressure-v1' && idle && phase==='Runner 1.3' && options.run?.length &&
      turn>=5 && lastProbe!==turn && runner.creditPool>=4 && runner.clickTracker>=2 && runner.grip.length>=3 && runner.tags===0) {
      const targets=options.run.map((o,index)=>({o,index,threat:corp.remoteServers.includes(o.server)&&o.server.root.some(c=>Counters(c,'advancement')>0)}))
        .filter(({o,threat})=>threat || o.server===corp.RnD || o.server===corp.HQ && corp.HQ.cards.length>0)
        .sort((a,b)=>Number(b.threat)-Number(a.threat) || a.o.server.ice.length-b.o.server.ice.length);
      for(const {o,index,threat} of targets) {
        totals.runner.probesConsidered++;
        const path=await ai._commonRunCalculationChecksAsync(o.server,null,null,false);
        if(!path?.length){totals.runner.probesRejected++;continue;}
        const end=path[path.length-1], effect=ai.rc.TotalEffect(end), cost=end.runner_credits_spent+end.runner_credits_lost;
        if(cost>Math.min(threat?6:3,runner.creditPool-2) || ai.rc.TotalDamage(effect)>0 || effect.tag || effect.misc_serious || effect.misc_moderate){totals.runner.probesRejected++;continue;}
        ai.cachedBestPath=path;ai.cachedComplete=true;ai.cachedPathServer=o.server;
        choose('run',index,threat?'contest-advanced-remote':'affordable-central-probe');break;
      }
    }
    if(activePlayer===corp && options.score?.length){totals.corp.scoreOffered++;if(selected.command==='score')totals.corp.scoreTaken++;}
    if(selected.command==='score')totals.corp.score++;
    if(['Corp 2.2','Runner 1.3'].includes(phase)) {
      const side=activePlayer===corp?'corp':'runner', row=totals[side];row.actions++;
      if(Object.hasOwn(row,selected.command)&&selected.command!=='score')row[selected.command]++;
      if(side==='corp') {
        if(['gain','draw'].includes(selected.command) && corp.HQ.cards.some(c=>c.cardType==='agenda'))row.idleWithAgenda++;
      }
      if(reason!=='native'){row.overrides++;reasons[reason]=(reasons[reason]||0)+1;}
      recent.push({turn,side,baseline:baseline.command,command:selected.command,reason,credits:activePlayer.creditPool,
        offered:Object.fromEntries(Object.entries(options).map(([cmd,list])=>[cmd,list.length]))});
      if(recent.length>80)recent.shift();
    }
    return selected;
  }
  globalThis.NRPressurePolicy={configure,select,noteRun,audit:()=>({policy,reasons:{...reasons},totals:JSON.parse(JSON.stringify(totals)),recent:recent.map(r=>({...r}))})};
})();
