const credits = n => `${n} ${n === 1 ? 'credit' : 'credits'}`;
// Only public, engine-quoted data enters this presentation model. It never
// predicts hidden ice, enumerates hypothetical actions, or executes a sequence.
export function encounterTool(tool) {
  const {card} = tool;
  if (card.hidden) return null;
  if (tool.enabled === false) return {status:'Abilities inactive',tone:'unavailable',detail:'An active effect prevents this program from using its abilities.'};
  if (tool.kind === 'breaker') {
    const against = tool.type === 'Any' ? 'any ice type' : tool.type.toLowerCase();
    const payment = `${credits(tool.breakCost)}: break ${tool.breakCount === 1 ? '1' : 'up to ' + tool.breakCount} subroutine${tool.breakCount === 1 ? '' : 's'}`;
    if (!tool.matches) return {status:'Cannot break this ice',tone:'unavailable',detail:`Breaks ${against} · STR ${card.strength}. ${tool.type === 'Any' ? 'This ice prevents AI breakers.' : 'The ice type does not match.'}`};
    if (!tool.unbroken) return {status:'All subroutines broken',tone:'complete',detail:`STR ${card.strength} · ${payment}.`};
    const total = tool.boostTotal + tool.breakTotal;
    return {
      status:tool.gap ? `Needs +${tool.gap} strength` : tool.availableCredits < tool.breakCost ? 'Not enough credits to break' : 'Strength matches · can break',
      tone:tool.gap || tool.availableCredits < tool.breakCost ? 'setup' : 'ready',
      detail:`STR ${card.strength} · ${payment}. ${tool.gap ? `${credits(tool.boostTotal)} to match strength. ` : ''}${credits(total)} to break all remaining with this program alone${total > tool.availableCredits ? `; only ${credits(tool.availableCredits)} available to it` : ''}.${card.number === 30032 ? ' Using its break ability trashes Mayfly at run end.' : ''}`,
    };
  }
  const count = `${tool.counters} virus counter${tool.counters === 1 ? '' : 's'}`;
  if (tool.kind === 'hosted-virus') return {status:!tool.matches ? 'Hosted on different ice' : !tool.counters ? 'No virus counters to spend' : 'Breaks without matching type or strength',tone:tool.matches && tool.counters ? 'ready' : 'unavailable',detail:`${count} · Spend 1 to break 1 subroutine on its host ice.`};
  if (tool.canLower === false) return {status:'This ice cannot lose strength',tone:'unavailable',detail:`${count} · The ice prevents strength reduction.`};
  return {status:tool.counters ? 'Can lower ice strength' : 'No virus counters to spend',tone:tool.counters ? 'ready' : 'unavailable',detail:`${count} · Spend 1 for −1 ice strength this encounter. This does not break a subroutine.`};
}
export function relatedCards(option) {
  return [...new Set([option.card?.id,option.sourceId,option.hostId,option.targetId].filter(Boolean))];
}

export function corpIceRezHint(card,state) {
  if(state?.side!=='corp'||card.hidden||card.side!=='corp'||card.type!=='ice'||card.rezzed)return '';
  if(!card.installed)return 'Installing ice pays only its server installation cost. Its rez cost is paid separately when the Runner approaches it.';
  const server=state.corp.servers.find(s=>s.ice.some(c=>c.id===card.id));
  if(state.run?.server===server?.name){
    const index=server.ice.findIndex(c=>c.id===card.id);
    if(index>state.run.ice || index===state.run.ice && /^Run 4\./.test(state.phase.identifier))
      return `The Runner has already passed ${card.title} during this run. Ice can only be rezzed when it is approached.`;
    const rez=state.run.rezStatus;
    if(rez?.cardId===card.id && rez.available<rez.cost)
      return `Cannot rez ${card.title}: ${rez.cost} credits required; ${rez.available} eligible credit${rez.available===1?'':'s'} available.`;
    if(rez?.cardId===card.id && rez.offered)return '';
  }
  return 'Ice can only be rezzed when the Runner approaches it. The rez action appears when you have priority and can pay its cost.';
}
