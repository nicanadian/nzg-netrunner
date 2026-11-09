// A deliberately small, allowlisted view. No seed, replay, deck order, private
// engine objects, or hidden-card characteristics may cross this boundary.
import {displayText} from './presentation.mjs';
export function helperContext(state, {selectedCard = null, watching = false, replay = false, resolving = false, playback = null} = {}) {
  if (!state) return {game: null, cards: [], legalActions: [], recentEvents: []};
  const cards = [], locations = [];
  const cardView = (card, location) => {
    if (!card) return;
    if (!card.hidden) cards.push({id:card.id, number:card.number, title:card.title, location,
      installed:!!card.installed, rezzed:!!card.rezzed, type:card.type, subTypes:card.subTypes,
      strength:card.strength, strengthEffects:card.strengthEffects, counters:card.counters || {},
      subroutines:card.subroutines,
      advancement:card.advancement || 0, advancementRequirement:card.advancementRequirement, canScore:!!card.canScore});
    for (const child of card.hosted || []) cardView(child, `Hosted on ${card.hidden ? 'facedown ice' : card.title} · ${location}`);
  };
  for (const side of ['corp','runner']) {
    const p = state[side];
    cardView(p.identity, `${side} identity`);
    // cardView excludes concealed cards. Opponent HQ cards explicitly visible
    // during a breach are valid context too (CR 7.3.1a).
    p.hand.forEach(c => cardView(c, `${side} hand`));
    p.score.forEach(c => cardView(c, `${side} score area`));
    p.discard.forEach(c => cardView(c, `${side} discard`));
    p.resolving.forEach(c => cardView(c, `${side} resolving`));
    locations.push({side,hand:p.hand.length,deck:p.deck,discard:p.discard.length});
  }
  for (const server of state.corp.servers) {
    server.ice.forEach((c, i) => cardView(c, `${server.name} · ice ${server.ice.length-i} from outside`));
    server.root.forEach(c => cardView(c, `${server.name} root`));
    locations.push({server:server.name,ice:server.ice.length,root:server.root.length});
  }
  for (const [zone, group] of Object.entries(state.runner.rig)) group.forEach(c => cardView(c, `Runner ${zone}`));
  if (state.access) cardView(state.access, 'Currently accessed');
  if (state.viewed?.card) cardView(state.viewed.card,state.viewed.kind==='expose' ? 'Currently exposed' : 'Currently revealed');
  if (selectedCard && !selectedCard.hidden && !cards.some(c => c.id === selectedCard.id)) cardView(selectedCard, 'Selected card reference');
  for(const event of state.history.slice(-32)){
    const card=event.effect?.card;
    if(card && !card.hidden && !cards.some(c=>c.id===card.id))cardView(card,'Publicly revealed in recent activity');
  }
  const resources = side => Object.fromEntries(['credits','clicks','points','tags','badPublicity','coreDamage','temporaryCredits','memory','memoryUsed','maxHand'].filter(k => typeof state[side][k] === 'number').map(k => [k,state[side][k]]));
  const result = {game:{side:state.side,turn:Math.ceil(state.turn/2),playerTurn:state.playerTurn,active:state.active,
    phase:state.phase,watching,replay,resolving,terminal:state.terminal,version:state.version,
    rulesVersion:state.rulesVersion || 'legacy',agendaPointTarget:state.agendaPointTarget || 7},
    resources:{corp:resources('corp'),runner:resources('runner')},locations,cards,
    selectedCard: selectedCard && !selectedCard.hidden ? {number:selectedCard.number,title:selectedCard.title} : null,
    run:state.run ? {server:state.run.server,encountering:state.run.encountering,movement:state.run.movement,restrictions:state.run.restrictions,
      ...(state.side==='corp' && state.run.rezStatus ? {rezStatus:state.run.rezStatus} : {})} : null,
    ...(watching && playback ? {playback:{caption:playback.caption,detail:playback.detail}} : {}),
    legalActions: watching || replay || resolving ? [] : (state.decision?.commands || []).map(c => ({command:c.command,label:c.label,cost:c.cost,instruction:c.instruction,options:(c.options.some(o=>o.searchChoice) ? [...c.options].sort((a,b)=>a.label.localeCompare(b.label)) : c.options).map(o=>({label:o.label,cost:o.cost,detail:o.detail}))})),
    recentEvents:state.history.slice(-32).map(e=>({turn:Math.ceil(e.turn/2),side:e.side,actor:e.actor || e.side,text:e.text,draw:e.draw,
      ...(e.damage ? {damage:e.damage} : {}),
      ...(e.effect && !e.effect.card?.hidden ? {effect:{kind:e.effect.kind,server:e.effect.server,rootEmpty:e.effect.rootEmpty,card:{id:e.effect.card?.id,number:e.effect.card?.number,title:e.effect.card?.title}}} : {})})),
    diagnostics:state.diagnostics?.length ? ['The engine reported an error; export the game replay for investigation.'] : []};
  return JSON.parse(JSON.stringify(result,(_,value)=>typeof value==='string' ? displayText(value) : value));
}
