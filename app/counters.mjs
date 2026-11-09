// Presentation derives only from the same public observations as the table.
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const COUNTERS = {
  credits: {symbol:'¢', short:'CR', label:'hosted credit', plural:'hosted credits'},
  advancement: {symbol:'◆', short:'ADV', label:'advancement counter', plural:'advancement counters'},
  virus: {symbol:'☣', short:'VIRUS', label:'virus counter', plural:'virus counters'},
  power: {symbol:'ϟ', short:'PWR', label:'power counter', plural:'power counters'},
  agenda: {symbol:'★', short:'AGN', label:'agenda counter', plural:'agenda counters'},
};
export function counterEntries(card) {
  // Advancement is public even on concealed Corp cards. Other counters aren't.
  const entries = card.hidden ? {} : {...card.counters};
  if (card.advancement) entries.advancement = card.advancement;
  if (!card.hidden && card.installed && card.subTypes?.includes('Virus')) entries.virus = entries.virus || 0;
  return Object.entries(entries).filter(([key, value]) => COUNTERS[key] && (value > 0 || key === 'virus' && card.installed && !card.hidden && card.subTypes?.includes('Virus')));
}
export function counterLabel(key, count) {
  return `${count} ${COUNTERS[key][count === 1 ? 'label' : 'plural']}`;
}
export function counterMarkup(card, changes = []) {
  const entries = counterEntries(card);
  const updates = changes.filter(change => change.cardId === card.id && COUNTERS[change.key] && (!card.hidden || change.key === 'advancement'));
  for (const update of updates) {
    if (update.value === 0 && !entries.some(([key]) => key === update.key)) entries.push([update.key, 0]);
  }
  if (!entries.length) return '';
  return `<span class="counter-tray">${entries.map(([key, count]) => {
    const type = COUNTERS[key], change = updates.find(update => update.key === key);
    const label = counterLabel(key, count);
    const stack = key === 'credits' ? Array.from({length:Math.min(count, 9)}, (_, i) => `<i class="coin-layer" style="--coin:${i}"></i>`).join('') : '';
    return `<span class="card-counter ${key} ${change && !change.quiet ? 'counter-changed' : ''}" data-counter="${key}" data-count="${count}" title="${escape(label)}${key === 'credits' ? ' on this card; separate from the credit pool' : ''}" aria-label="${escape(label)}"><span class="counter-art" aria-hidden="true">${stack}<span class="token-face"><span class="counter-symbol">${type.symbol}</span><b>${count}</b></span><small>${type.short}</small></span>${change?.delta && !change.quiet ? `<span class="counter-delta ${change.delta < 0 ? 'spent' : 'gain'}" aria-hidden="true">${change.delta > 0 ? '+' : '−'}${Math.abs(change.delta)}</span>` : ''}</span>`;
  }).join('')}</span>`;
}
export function clickMarkup(player, previous, sameTurn = true) {
  const total = Math.max(player.side === 'corp' ? 3 : 4, player.clicks, sameTurn ? previous?.clicks || 0 : 0);
  const before = sameTurn && previous ? previous.clicks : null;
  return `<div class="clicks" role="img" aria-label="${player.clicks} ${player.clicks === 1 ? 'click' : 'clicks'} remaining out of ${total}">${Array.from({length:total}, (_, index) => {
    const ready = index < player.clicks;
    const spent = before !== null && index < before && !ready;
    const refreshed = previous && ready && (!sameTurn || index >= previous.clicks);
    return `<span class="click-pip ${ready ? 'filled' : 'used'} ${spent ? 'just-spent' : ''} ${refreshed ? 'just-refreshed' : ''}" aria-hidden="true"><span class="click-front">↻</span><span class="click-back">—</span></span>`;
  }).join('')}</div>`;
}
function boardCards(state) {
  const cards = new Map();
  function visit(card, location) {
    if (!card) return;
    cards.set(card.id, {card, location});
    for (const child of card.hosted || []) visit(child, `${location} · hosted`);
  }
  for (const server of state.corp.servers) {
    server.root.forEach(card => visit(card, `${server.name} root`));
    server.ice.forEach((card, i) => visit(card, `${server.name} ice ${server.ice.length - i}`));
  }
  for (const [type, group] of Object.entries(state.runner.rig)) group.forEach(card => visit(card, type));
  return cards;
}
export function resourceChanges(previous, next) {
  if (!previous || !next || previous.side !== next.side || next.version <= previous.version) return [];
  const changes = [];
  for (const side of ['corp', 'runner']) {
    const player = next[side], before = previous[side];
    if (player.hand.length!==before.hand.length) changes.push({side,key:'hand',value:player.hand.length,delta:player.hand.length-before.hand.length,label:`${side==='runner'?'Runner grip':'Corp HQ'} · cards`});
    for (const [key, label] of Object.entries({credits:'credits',clicks:'clicks',points:'agenda points',tags:'tags',badPublicity:'bad publicity',coreDamage:'core damage',temporaryCredits:'run credits'})) {
      const value = player[key], old = before[key];
      if (typeof value !== 'number' || typeof old !== 'number' || value === old) continue;
      changes.push({side, key, value, delta:value-old, label:`${side === 'corp' ? 'Corp' : 'Runner'} · ${label}`, reset:key === 'clicks' && (next.turn !== previous.turn || previous.phase.identifier.includes('Mulligan')) && value > old});
    }
  }
  const oldCards = boardCards(previous), newCards = boardCards(next);
  for (const [id, {card, location}] of newCards) {
    const previous=oldCards.get(id),old = previous?.card;
    if (previous && previous.location!==location) changes.push({side:card.side,cardId:id,key:'moved',value:null,delta:null,
      label:card.hidden?'Facedown ice':card.title,detail:`${previous.location} → ${location}`});
    if (old?.rezzed && !card.rezzed) changes.push({side:card.side,cardId:id,key:'derezzed',value:null,delta:null,label:card.hidden?'Facedown ice':card.title,detail:'Now unrezzed'});
    const currentCounters = Object.fromEntries(counterEntries(card));
    const oldCounters = old ? Object.fromEntries(counterEntries(old)) : {};
    for (const key of new Set([...Object.keys(currentCounters), ...Object.keys(oldCounters)])) {
      // Losing permission to inspect a card is not a counter being spent.
      if (card.hidden && key !== 'advancement') continue;
      const value = currentCounters[key] || 0, oldValue = oldCounters[key] || 0;
      if (value === oldValue) continue;
      const revealed = !old || (old.hidden && key !== 'advancement');
      changes.push({side:card.side, cardId:id, key, value, delta:revealed ? null : value-oldValue, label:`${card.hidden ? 'Facedown card' : card.title} · ${location}`, detail:counterLabel(key, value)});
    }
  }
  for (const [id, {card, location}] of oldCards) {
    if (!newCards.has(id) && !card.hidden && counterEntries(card).length) {
      const scored = [...next.corp.score, ...next.runner.score].some(scored => scored.id === id);
      changes.push({side:card.side, cardId:id, key:scored ? 'scored' : 'left-play', value:null, delta:null, label:`${card.title} · ${location}`, detail:scored ? 'Moved to score area' : 'Left play'});
    }
  }
  return changes;
}
