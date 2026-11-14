// Only viewer-authorized current approach information; never infer hidden cards.
export function iceRezWarning(state) {
  const ice=state?.run?.card;
  if(state?.terminal || state?.side!=='corp' || state.active!=='corp' || state.phase?.identifier!=='Run 2.1' ||
     state.access || state.viewed || !ice || ice.hidden || ice.rezzed || ice.type!=='ice')return null;
  const pass=state.decision?.commands.find(c=>c.command==='n' && c.options.length===1 && !c.options[0].card && !c.options[0].multi);
  if(!pass)return null;
  const rez=state.decision.commands.find(c=>c.command==='rez')?.options.find(o=>o.card?.id===ice.id);
  const quote=state.run.rezStatus;
  return {card:ice,version:state.version,command:'n',index:pass.options[0].index,
    label:`Let the Runner pass ${ice.title} unrezzed…`,
    detail:`${ice.title} is inactive. Without rezzing it, the Runner will pass it without an encounter. Its subroutines will not fire.`,
    availability:rez ? 'Rez it now to make the Runner encounter it, or explicitly allow the pass.'
      : quote && quote.available<quote.cost ? `Cannot rez: ${quote.cost} credits required; ${quote.available} eligible credits available.`
      : 'Rez is not currently available. You can review your other abilities before allowing the pass.',
    rez:rez ? {command:'rez',index:rez.index,cost:rez.cost?.credits ?? quote?.cost} : null};
}
