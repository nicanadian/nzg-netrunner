// Only public log events enter this model. Never infer the identity of a draw,
// facedown install or unexposed access from other parts of the game state.
export function drawExplanation(entry) {
  if (entry.draw?.kind === 'mandatory') return 'Mandatory turn-start draw · no click cost';
  if (entry.draw?.kind === 'action') return 'Draw action · 1 click';
  if (entry.draw?.kind === 'effect') return entry.draw.source ? `Card effect · ${entry.draw.source}` : 'Card effect';
  return '';
}
export function activityExplanation(entry) {
  if (entry.damage) return damageExplanation(entry.damage);
  const effect=entry.effect;
  if (effect?.kind==='swap') return 'Ice swapped between the named positions; hosted cards move with their host';
  if (effect?.kind==='derez') return 'Tranquilizer reached 3 virus counters and derezzed its host ice';
  if(effect?.card?.number!==30053)return drawExplanation(entry);
  if(effect?.kind==='rez')return `${effect.server ? `${effect.server} · ` : ''}On rez: draw 2 cards · no click cost`;
  if(effect?.kind==='ability')return 'Remove Spin Doctor from the game → shuffle up to 2 cards from Archives into R&D · no click cost';
  if(effect?.kind==='remove' && effect.rootEmpty)return `${effect.server} has no cards left to access`;
  if(effect?.kind==='remove')return effect.server ? `Spin Doctor leaves ${effect.server}` : 'Spin Doctor leaves play';
  if(effect?.kind==='shuffle')return 'Spin Doctor ability · Archives → R&D';
  return drawExplanation(entry);
}
export function damageExplanation(damage) {
  const source=damage.card?.title || 'Card effect';
  const formula=damage.card?.number===30045 ? ` (2 base + ${damage.card.advancement} advancement)` : '';
  const fatal=damage.amount>damage.gripBefore;
  return `${source}: ${damage.amount} ${damage.type} damage${formula} · ${damage.gripBefore} cards in the Runner’s grip before damage${fatal ? ' · damage exceeds grip: flatline' : ' · random cards trashed from grip'}`;
}

export function activityModel(state, view = 'opponent') {
  const opponent = state.side === 'corp' ? 'runner' : 'corp';
  const name = opponent === 'runner' ? 'Runner' : 'Corp';
  const history = (state.history || []).filter(entry => entry.text.trim());
  const responses = state.playerTurn===state.side && history.some(e=>e.turn===state.turn && e.actor===opponent && e.side===state.side && !/ chose (to keep|to mulligan)$/.test(e.text));
  const turn = responses ? state.turn : history.findLast(entry => entry.side === opponent)?.turn;
  const recap = view === 'opponent' && turn !== undefined;
  const entries = recap ? history.filter(entry => entry.turn === turn && (responses || entry.side === opponent))
    : history.slice(-16).reverse();
  const live = recap && state.playerTurn === opponent && state.turn === turn && !state.terminal;
  const runs = entries.filter(e => /^Run initiated attacking /.test(e.text)).length;
  const installs = entries.filter(e => new RegExp(`^${name} installed `).test(e.text)).length;
  const stolen = entries.filter(e => / stolen$/.test(e.text)).length;
  const highlights = [runs && `${runs} run${runs === 1 ? '' : 's'}`, installs && `${installs} install${installs === 1 ? '' : 's'}`,
    stolen && `${stolen} agenda${stolen === 1 ? '' : 's'} stolen`].filter(Boolean);
  return {opponent, name, turn, recap, live, responses, entries, highlights,
    title: recap ? responses ? `${name} responses · your turn ${Math.ceil(turn / 2)}` : `${name} · turn ${Math.ceil(turn / 2)}${live ? ' · in progress' : ''}` : 'Latest activity',
    summary: recap ? [...highlights, `${entries.length} events · oldest first`].join(' · ') : 'Last 16 events · newest first'};
}
