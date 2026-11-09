// Semantic beats built entirely from the same public snapshots as the board.
import {activityExplanation} from './activity.mjs';
function cards(state) {
  const found = [];
  const visit = card => { if (!card) return; found.push(card); (card.hosted || []).forEach(visit); };
  for (const side of ['corp', 'runner']) {
    const p = state[side];
    [p.identity, ...p.hand, ...p.score, ...p.discard, ...p.resolving].forEach(visit);
  }
  for (const s of state.corp.servers) [...s.root, ...s.ice].forEach(visit);
  Object.values(state.runner.rig).flat().forEach(visit);
  return found;
}
export function opponentBeat(before, after) {
  const opponent = after.side === 'corp' ? 'runner' : 'corp';
  // A forced pass because ice is unaffordable is still an important visible
  // event for the Corp. Explain it before displaying the next approach.
  const passedIce=before.run?.card,rezQuote=before.run?.rezStatus;
  if (before.side==='corp' && after.side==='corp' && before.active==='corp' && before.phase.identifier==='Run 2.1' &&
      after.phase.identifier!=='Run 2.1' && passedIce && !passedIce.hidden && !passedIce.rezzed &&
      after.historyCount>before.historyCount && after.history.slice(-(after.historyCount-before.historyCount)).some(e=>e.text==='Corp did not rez ice')) {
    const unavailable=rezQuote && rezQuote.available<rezQuote.cost;
    return {kind:'unrezzed-ice',caption:`Runner passes ${passedIce.title} unrezzed`,
      detail:unavailable?`Could not rez ${passedIce.title}: ${rezQuote.cost} credits required; ${rezQuote.available} eligible credit${rezQuote.available===1?'':'s'} available.`:'No rez was made. The Runner passes this ice without encountering it.',
      card:passedIce,opponent,turn:after.turn,state:after,
      targets:{cards:[passedIce.id],server:before.run.server,zones:['corp-status']}};
  }
  // A forced Runner pass used to disappear between rez and damage. Keep this
  // public position as a review beat; it never adds an engine decision.
  if (before.side==='runner' && before.active==='runner' && before.phase.identifier==='Run 3.1' &&
      (after.phase.identifier!=='Run 3.1' || after.active!=='runner') && before.run?.encountering && !before.run.card?.hidden &&
      before.decision?.commands.length===1 && before.decision.commands[0].command==='n') {
    const ice=before.run.card;
    const unbroken=ice.subroutines.filter(s=>!s.broken);
    return {kind:'encounter',caption:unbroken.length?`No available response to ${ice.title}`:`All subroutines on ${ice.title} are broken`,
      detail:unbroken.length?`${unbroken.length} unbroken subroutine${unbroken.length===1?'':'s'} will resolve in order. Pause to review, or watch the result.`:'The encounter is complete. Moving past this ice.',
      card:ice,opponent:'corp',turn:before.turn,state:before,pauseForReview:unbroken.length>0,
      targets:{cards:[ice.id],server:before.run.server,zones:[]}};
  }
  const count = after.historyCount - before.historyCount;
  if (count <= 0) return null;
  const entries = after.history.slice(-count).filter(e => (e.actor || e.side) === opponent);
  if (!entries.length) return null;
  const text = entries.map(e => e.text);
  const name = opponent === 'runner' ? 'Runner' : 'Corp';
  const server = after.run?.server || before.run?.server;
  const event = pattern => text.find(t => pattern.test(t));
  let caption, kind, detail = '';
  const stolen = event(/ stolen$/), scored = event(/ scored$/), installed = event(/^(Runner|Corp) installed /);
  const played = event(/^Played "/), run = event(/^Run initiated attacking /);
  const broken = event(/^Subroutine .* broken$/), draw = event(/^(Corp|Runner) drew /);
  const accessed = text.filter(t => / accessed$/.test(t));
  const virus = event(/^\d+ virus counters? placed on /);
  const spin=entries.find(e=>e.effect?.card?.number===30053);
  const swap=entries.find(e=>e.effect?.kind==='swap'),derez=entries.find(e=>e.effect?.kind==='derez');
  const rez=event(/^(Corp|Runner) rezzed /);
  if (stolen) { kind = 'score'; caption = `Runner steals ${stolen.replace(/ stolen$/, '')}`; }
  else if (scored) { kind = 'score'; caption = `Corp scores ${scored.replace(/ scored$/, '')}`; }
  else if (run) { kind = 'run'; caption = `Runner runs ${run.replace(/^Run initiated attacking /, '')}`; }
  else if (installed) { kind = 'install'; caption = installed.replace(' installed ', ' installs '); }
  else if (played) { kind = 'play'; caption = `${name} plays ${played.replace(/^Played "|"$/g, '')}`; }
  else if (swap) {kind='swap';caption='Tāo swaps two pieces of ice';detail=swap.text;}
  else if (derez) {kind='ability';caption='Tranquilizer derezzes its host ice';detail=derez.text;}
  else if (rez) { kind = 'rez'; caption = rez.replace(' rezzed ', ' rezzes '); }
  else if (spin?.effect.kind==='ability') { kind = 'ability'; caption = 'Corp uses Spin Doctor'; }
  else if (spin?.effect.kind==='remove') { kind = 'ability'; caption = 'Spin Doctor leaves play'; }
  else if (spin?.effect.kind==='shuffle') { kind = 'ability'; caption = 'Corp shuffles cards with Spin Doctor'; detail=text.filter(t=>/ shuffled into R&D from Archives$|^R&D shuffled$/.test(t)).join(' · '); }
  else if (broken) { kind = 'break'; caption = 'Runner breaks a subroutine'; detail = broken.replace(/^Subroutine "|" broken$/g, ''); }
  else if (event(/^Firing /)) { kind = 'fire'; caption = 'Ice subroutine fires'; detail = event(/^Firing /).replace(/^Firing /, '').replace(/:$/, ''); }
  else if (accessed.length) { kind = 'access'; caption = `Runner accesses ${server || 'a card'}`; detail = accessed.length > 1 ? `${accessed.length} cards accessed` : accessed[0] === 'hidden card accessed' ? 'The accessed card stays private.' : accessed[0]; }
  else if (event(/^Run successful$/)) { kind = 'success'; caption = `Successful run on ${server || 'the server'}`; }
  else if (event(/^Run ends$/)) { kind = 'end'; caption = 'Run ends'; }
  else if (draw) { kind = 'draw'; caption = draw.replace(' drew ', ' draws '); }
  else if (event(/^Runner takes .* damage$/)) { kind = 'damage'; caption = event(/^Runner takes .* damage$/); }
  else if (event(/ trashed$/)) { kind = 'trash'; caption = event(/ trashed$/); }
  else if (event(/^(Corp|Runner) gained /)) { kind = 'credit'; caption = event(/^(Corp|Runner) gained /).replace(' gained ', ' gains '); }
  else if (virus) { kind = 'virus'; const match=virus.match(/^(\d+ virus counters?) placed on (.+)$/); caption=`${match[2]} gains ${match[1]}`; }
  else if (event(/^Using /)) { kind = 'ability'; caption = `${name} uses ${event(/^Using /).replace(/^Using /, '').replace(/:$/, '')}`; }
  else return null;
  const all = [...cards(after), ...cards(before),...entries.filter(e=>e.effect?.card).map(e=>({...e.effect.card,hidden:false,side:'corp'}))].filter(c => !c.hidden && c.title);
  const ids = [...new Set(all.filter(c => text.some(t => t.includes(c.title))).map(c => c.id))];
  if(swap)ids.push(...(swap.effect.targets || []).map(t=>t.id));
  if (kind === 'install') {
    const old = new Set(cards(before).filter(c => c.installed).map(c => c.id));
    for (const c of cards(after)) if (c.installed && !old.has(c.id)) ids.push(c.id);
  }
  if (['break', 'fire'].includes(kind) && (after.run?.card || before.run?.card)) ids.push((after.run?.card || before.run.card).id);
  const zones = [];
  if (kind === 'draw') zones.push(opponent === 'runner' ? 'runner-piles' : 'corp-deck');
  if (kind === 'play') zones.push(opponent === 'runner' ? 'runner-piles' : 'corp-discard');
  if (kind === 'damage') zones.push('runner-piles', 'runner-status');
  if (kind === 'credit') zones.push(caption.startsWith('Corp') ? 'corp-status' : 'runner-status');
  if (kind === 'trash') zones.push('runner-piles', 'corp-discard');
  if (kind === 'score') zones.push(caption.startsWith('Corp') ? 'corp-status' : 'runner-status');
  if(spin?.effect.kind==='shuffle')zones.push('corp-discard','corp-deck');
  if (!ids.length && !zones.length && !server) zones.push(`${opponent}-status`);
  const spent = before.turn === after.turn ? before[opponent].clicks - after[opponent].clicks : 0;
  const payment = spent > 0 ? `${spent} click${spent === 1 ? '' : 's'} spent` : '';
  const finances = ['play','install','ability'].includes(kind) ? text.filter(t => new RegExp(`^${name} (spent|gained) .* credits?$`).test(t))
    .map(t => t.replace(`${name} `, '')).slice(0, 2) : [];
  const card = ['play','install','ability','rez','score'].includes(kind) ? all.find(c => caption.includes(c.title)) : null;
  const explanations=[...new Set(entries.map(activityExplanation).filter(Boolean))];
  return {caption, kind, detail: [detail, payment, ...finances, ...explanations, virus && kind!=='virus' ? virus : ''].filter(Boolean).join(' · '), card,
    opponent, turn: entries.at(-1).turn, state: after,
    targets: {cards: [...new Set(ids)], server: spin?.effect.server || (['run','access','success','end','break','fire'].includes(kind) ? server : null), zones}};
}
