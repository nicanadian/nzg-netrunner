import {iceRezWarning} from './rez-warning.mjs';
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
// Approval covers an exact budget for this encounter. Persistent hosted and
// stealth credits stay manual. Every payment still selects a native option.
export function breakerFundingQuote(tool, total=tool.boostTotal+tool.breakTotal) {
  if(!tool?.funding || tool.funding.manualReason)return null;
  const all=tool.funding.sources;
  if(new Set(all.map(s=>s.label)).size!==all.length)return null;
  let remaining=total;
  const sources=all.filter(s=>s.expiring || s.sourceId==='creditPool')
    .sort((a,b)=>Number(b.expiring)-Number(a.expiring)).map(s=>{
      const budget=Math.min(remaining,s.available);remaining-=budget;return {...s,budget,used:0};
    });
  return remaining?null:{sources,eligible:all.map(s=>s.sourceId).sort().join('|'),total};
}
export function approvedPaymentChoice(state, plan) {
  const funding=plan?.funding, tool=state.run?.tools?.find(t=>t.card.id===plan.cardId);
  if(!funding || !tool || plan.paused)return null;
  if(state.run.card.strength!==plan.iceStrength || state.run.card.subroutines.map(s=>s.text).join('|')!==plan.iceText)
    return {reason:'The ice changed. Review the encounter before approving another payment.'};
  if(tool.funding?.manualReason)return {reason:tool.funding.manualReason};
  for(const source of funding.sources){
    const available=tool.funding?.sources.find(s=>s.sourceId===source.sourceId)?.available || 0;
    if(available!==source.available-source.used)return {reason:'A credit source changed. Review the remaining payment manually.'};
  }
  if(tool.funding?.sources.some(s=>!funding.eligible.split('|').includes(s.sourceId)))return {reason:'A new credit source appeared. Review the remaining payment manually.'};
  if(state.phase.guide?.kind!=='credit-payment')return null;
  if(state.phase.guide.sourceId!==plan.cardId || state.phase.guide.doing!=='using')return {reason:'A different cost needs your attention. Choose its sources manually.'};
  const options=state.decision?.commands.find(c=>c.command==='pay')?.options || [];
  for(const source of funding.sources){
    const amount=Math.min(source.budget-source.used,state.phase.guide.remaining);
    if(amount<=0)continue;
    const next=options.find(o=>o.payment?.sourceId===source.sourceId && o.payment.amount===amount);
    return next?{next:{...next,command:'pay'}}:{reason:'The approved source is unavailable. Finish this payment manually.'};
  }
  return {reason:'This payment exceeds the approved source budget. Choose sources manually.'};
}
export function secondaryAbility(option, state) {
  if(option.abilityKind==='ice-reduction'){
    const tool=state.run?.tools?.find(t=>t.card.id===option.card?.id);
    return !!tool&&(!tool.unbroken||!tool.gap);
  }
  return option.secondary || option.abilityKind==='boost' || !!state.run?.encountering && option.abilityKind==='break' && state.run.tools?.find(t=>t.card.id===option.card?.id)?.unbroken===0;
}
export function assistedChoice(state, {skipBoostWindows=true, streamline=true, hold=false}={}) {
  if (!state?.decision || state.terminal || state.active!==state.side) return null;
  if (iceRezWarning(state)) return null;
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
  if (iceRezWarning(state)) return null;
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
