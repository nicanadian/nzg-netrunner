// Plans only select currently offered native choices. They never advance a
// window, pre-pay a future ability, or use a cached option/version.
export function breakerPlan(state, cardId) {
  if (state?.terminal || state?.side !== 'runner' || !state.run?.encountering || state.run.card?.hidden)
    return {status:'invalid', reason:'This encounter has ended. No further ability is queued.'};
  const tool=state.run.tools?.find(t=>t.card.id===cardId);
  if (!tool || !tool.enabled || tool.kind!=='breaker' || !tool.matches)
    return {status:'invalid',reason:'This program can no longer break the current ice.'};
  const commands=state.decision?.commands || [];
  if (!state.decision || state.active!==state.side)
    return {status:'waiting',tool,reason:'Waiting for the opponent’s response. Earlier payments remain spent.'};
  const options=commands.flatMap(c=>c.options.map(o=>({...o,command:c.command})));
  if (state.phase.guide?.kind==='credit-payment')
    return {status:'payment',tool,reason:`Choose credit sources · ${state.phase.guide.remaining} left to pay. The effect resolves when payment is complete.`};
  const targets=options.filter(o=>o.subroutine && o.sourceId===cardId && o.targetId===state.run.card.id);
  if (targets.length) {
    const next=targets[0];
    return {status:'target',tool,next,cost:next.cost?.credits || 0,label:next.label};
  }
  if (state.phase.identifier!=='Run 3.1') return {status:'paused',tool,reason:'Another decision needs your attention. Resolve it manually or stop this plan.'};
  const finish=options.length===1&&options[0].command==='continue'&&!options[0].card&&!options[0].multi&&options[0].sourceId===cardId?options[0]:null;
  if(finish)return {status:'finish',tool,next:finish,cost:0,label:'Finish the paid ability'};
  if (!tool.unbroken) return {status:'complete',tool,reason:'All subroutines are broken. Continue using the normal run controls.'};
  const kind=tool.gap>0?'boost':'break';
  const next=options.find(o=>o.command==='trigger' && o.card?.id===cardId && o.abilityKind===kind);
  const cost=kind==='boost'?tool.boostCost:tool.breakCost;
  if (!next) return {status:'unavailable',tool,cost,reason:tool.availableCredits<cost
    ? `Needs ${cost} credit${cost===1?'':'s'}; ${tool.availableCredits} eligible credits available.`
    : 'This ability is unavailable in the current window. Use the offered choices or stop the plan.'};
  return {status:'ready',tool,next,cost,label:kind==='boost'?`+${tool.boostAmount} strength`:'Select the next subroutine',total:tool.boostTotal+tool.breakTotal};
}
export function secondaryAbility(option, state) {
  return option.secondary || option.abilityKind==='boost' || !!state.run?.encountering && option.abilityKind==='break' && state.run.tools?.find(t=>t.card.id===option.card?.id)?.unbroken===0;
}
export function assistedChoice(state, {skipBoostWindows=true, streamline=true, hold=false}={}) {
  if (!state?.decision || state.terminal || state.active!==state.side) return null;
  if (skipBoostWindows && !hold && state.quietWindow) return quietPass(state);
  const choice=state.assistance;
  if (!streamline || !choice || hold && ['optional-window','cleared-encounter'].includes(choice.kind)) return null;
  const option=state.decision.commands.find(c=>c.command===choice.command)?.options.find(o=>o.index===choice.index);
  return option ? choice : null;
}
export function quotedInstallFinish(state, transaction) {
  if (!transaction || transaction.replace || state.installation?.card.id!==transaction.cardId) return null;
  const group=state.decision?.commands.find(c=>c.command==='n');
  const option=group?.options.length===1 && group.options[0];
  const cost=option?.cost || group?.cost;
  return option && cost?.credits===transaction.credits && (cost.clicks || 0)===transaction.clicks ? {command:'n',index:option.index} : null;
}
export function cancellationLabel(state) {
  return `Cancelled · ${state.phase.source || 'selection'}`;
}
export function quietPass(state) {
  if (!state?.quietWindow || state.terminal || state.active!==state.side) return null;
  const group=state.decision?.commands.find(c=>c.command==='n');
  return group?.options.length===1 ? {command:group.command,index:group.options[0].index} : null;
}

// Close only a paid multi-break ability with no remaining targets or costs.
// This is not a pass of a timing/response window.
export function paidAbilityFinish(state) {
  if(state?.terminal||state?.side!=='runner'||state.active!==state.side||!state.run?.encountering||state.phase.identifier!=='Run 3.1')return null;
  const commands=state.decision?.commands;
  if(commands?.length!==1||commands[0].command!=='continue'||commands[0].options.length!==1)return null;
  const option=commands[0].options[0];
  if(option.card||option.multi||option.subroutine||option.cost?.credits||option.cost?.clicks||option.cost?.virus)return null;
  const tool=state.run.tools?.find(t=>t.card.id===option.sourceId);
  return tool?.kind==='breaker'&&tool.breakCount===2 ? {command:'continue',index:option.index} : null;
}
