'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { makeGame, choices, checkState, checkSnapshot } = require('../tests/engine-smoke.cjs');

const OUTPUT = path.resolve(__dirname, '../eval/reference-game.json');
const SOURCE = { title: 'Null Signal Games example game', url: 'https://www.youtube.com/watch?v=xtI0-j0utLo', kind: 'adapted teaching sequence', transcriptReviewed: '2026-11-05' };

function orderedDeck(base, top, replacements = []) {
  const cards = Array.from(base.cards);
  for (const [from, to] of replacements) cards[cards.indexOf(from)] = to;
  const remaining = cards.slice();
  for (const n of top) {
    const index = remaining.indexOf(n);
    assert.notEqual(index, -1, `Opening order requests unavailable card ${n}`);
    remaining.splice(index, 1);
  }
  return { identity: base.identity, cards: [...remaining, ...top.slice().reverse()] };
}

async function buildReferenceEval() {
  const game = makeGame();
  const trace = [], checkpoints = [];
  const initialConfig = {
    side: 'corp', seed: 'nsg-reference-adaptation-v1', control: 'scripted', orderedDecks: true,
    decks: {
      corp: orderedDeck(game.api.presets.corp, [30075, 30070, 30072, 30040, 30037, 30055, 30067, 30072, 30037, 30073], [[30053, 30055]]),
      runner: orderedDeck(game.api.presets.runner, [30028, 30027, 30006, 30008, 30030, 30028, 30034, 30015, 30031], [[30034, 30027]]),
    },
  };
  let state;
  const clean = value => JSON.parse(JSON.stringify(value));
  const fail = label => new Error(`${label}\n${state.phase.title} / ${state.active} / turn ${state.turn}\n${choices(state).map(o => `${o.command}: ${o.label} [${o.card?.number || ''}] ${o.detail || ''}`).join('\n')}`);
  const checkpoint = (id, title, videoTime, notes, expected = {}) => checkpoints.push({ id, title, videoTime, traceIndex: trace.length - 1, state: clean(state), notes, expected });
  const choose = async (command, predicate = () => true, label = command, advance = true) => {
    const option = choices(state).find(o => o.command === command && predicate(o));
    if (!option) throw fail(`Missing ${label}`);
    const choice = { version: state.version, command, index: option.index };
    const before = { phase: state.phase.identifier, active: state.active, turn: state.turn };
    game.api.choose(choice);
    state = advance ? await game.api.advance() : game.api.snapshot();
    checkState(game); checkSnapshot(game, state);
    trace.push({ label, before, choice, ...(advance ? {} : { advance: false }) });
    return state;
  };
  const number = n => o => o.card?.number === n;
  const named = text => o => o.label.includes(text) || o.detail?.includes(text);
  const install = (n, server) => choose('install', o => o.card?.number === n && (server === undefined || o.server === server), `Install ${n}${server ? ` in ${server}` : ''}`);
  const play = n => choose('play', number(n), `Play ${n}`);
  const pass = () => choose('n', () => true, 'Pass timing window');
  const until = async (predicate, limit = 30) => {
    for (let i = 0; i < limit && !predicate(state); i++) {
      if (choices(state).some(o => o.command === 'n')) await pass();
      else if (choices(state).some(o => o.command === 'continue' && /continue/i.test(o.label))) await choose('continue', named('Continue'));
      else if (state.phase.title === 'Run: Subroutines' && state.active === 'corp') await choose('trigger', () => true, 'Fire unbroken ICE subroutine');
      else if (choices(state).some(o => o.command === 'trigger' && [30028, 30001].includes(o.card?.number))) await choose('trigger', o => [30028, 30001].includes(o.card?.number), 'Resolve run or identity trigger');
      else throw fail('Cannot pass toward requested checkpoint');
    }
    if (!predicate(state)) throw fail('Checkpoint not reached');
  };
  const action = side => s => s.active === side && s.phase.identifier === (side === 'corp' ? 'Corp 2.2' : 'Runner 1.3');
  try {
    game.api.boot(initialConfig); state = await game.api.advance();
    checkpoint('setup', 'Opening hands', 67, 'Ordered legal decks make the teaching sequence reproducible. Corp hand is visible; Runner hand is concealed.');
    await pass(); await pass();
    await play(30075);
    await install(30070, 'New remote');
    await install(30072, 'Remote 0');
    checkpoint('defended-remote', 'A protected remote server', 147, 'Superconducting Hub substitutes for Greenmail; Palisade substitutes for Maskirovka. Hedge Fund and three Corp actions are retained.');
    await until(action('runner'));
    await choose('run', o => o.server === 'Remote 0', 'Run the defended remote');
    await until(s => choices(s).some(o => o.command === 'rez' && o.card?.number === 30072));
    await choose('rez', number(30072), 'Rez Palisade');
    await until(s => s.run?.encountering);
    checkpoint('failed-run-encounter', 'An unbroken barrier', 201, 'Runner has no installed breaker. Palisade is strength 4 on a remote.');
    await until(action('runner'));
    checkpoint('failed-run', 'The barrier ends the run', 223, 'The real end-the-run subroutine resolves; no access occurs.');
    await play(30028);
    await choose('continue', o => o.server === 'R&D', 'Jailbreak targets R&D');
    await until(s => choices(s).some(o => o.command === 'access'));
    await choose('access', () => true, 'Access first R&D card');
    checkpoint('access-offworld', 'Jailbreak finds an agenda', 274, 'The selected hidden R&D candidate becomes Offworld Office only when accessed.', { access: 30067 });
    await choose('steal', () => true, 'Steal Offworld Office');
    await until(s => choices(s).some(o => o.command === 'access'));
    await choose('access', () => true, 'Access second R&D card');
    await until(action('runner'));
    await install(30027);
    await choose('trigger', o => o.card?.number === 30027, 'Use Telework Contract');
    await until(action('corp'));
    await choose('advance', number(30070), 'Advance Superconducting Hub');
    await play(30040);
    await choose('continue', number(30070), 'Place two advancement with Seamless Launch');
    await choose('score', number(30070), 'Score Superconducting Hub');
    checkpoint('corp-score', 'Corporation scores its first agenda', 398, 'Hub needs three counters: one advance plus Seamless Launch replaces Greenmail’s two advances. Scoring consumes no click.', { corpPoints: 1, runnerPoints: 2 });
    await choose('trigger', named('draw 2'), 'Resolve optional Hub draw trigger');
    await choose('continue', named('Continue'), 'Decline extra Hub draw');
    await choose('trigger', named('Archives'), 'Resolve Precision Design trigger');
    await choose('continue', named('Continue'), 'Decline archive recovery');
    await install(30037, 'Remote 0');
    await until(action('runner'));
    await choose('trigger', o => o.card?.number === 30027, 'Use Telework on second Runner turn');
    await install(30008);
    await play(30028);
    await choose('continue', o => o.server === 'R&D', 'Second Jailbreak targets R&D');
    await until(s => choices(s).some(o => o.command === 'access'));
    await choose('access', () => true, 'Access R&D economy asset');
    await choose('trash', () => true, 'Pay to trash Nico Campaign');
    await until(s => choices(s).some(o => o.command === 'access'));
    await choose('access', () => true, 'Access R&D ice');
    await until(action('runner'));
    await choose('gain', () => true, 'Gain one credit for later tag removal');
    await until(s => choices(s).some(o => o.command === 'rez' && o.card?.number === 30037));
    await choose('rez', number(30037), 'Rez remote Nico Campaign before Corp turn');
    await until(s => choices(s).some(o => o.command === 'trigger' && o.card?.number === 30037));
    await choose('trigger', number(30037), 'Take Nico Campaign income');
    await until(action('corp'));
    await install(30073, 'R&D');
    await install(30072, 'R&D');
    if (state.phase.title === 'Trash Before Install') await pass();
    await install(30055, 'HQ');
    checkpoint('layered-servers', 'Layered central defenses', 634, 'Two real installed ICE protect R&D; Ping protects HQ. Installation is shifted to Corp turn 3 because Gateway has no Top-Down Solutions.', { rdIce: 2 });
    await until(action('runner'));
    await install(30006);
    if (state.phase.title === 'Trash Before Install') await pass();
    await choose('run', o => o.server === 'Remote 0', 'Run remote with Cleaver installed');
    await until(s => s.run?.encountering && s.active === 'runner');
    checkpoint('breaker-before-boost', 'Match the barrier’s strength', 675, 'Cleaver is strength 3, while remote Palisade is strength 4. Cleaver substitutes for Rising Tide.');
    await choose('trigger', o => o.card?.number === 30006 && /strength/.test(o.detail || o.label), 'Boost Cleaver to strength 4');
    checkpoint('breaker-boosted', 'Strength is now sufficient', 688, 'The real Cleaver ability spends two credits to gain one strength.');
    await choose('trigger', o => o.card?.number === 30006 && /Break/.test(o.detail || o.label), 'Break Palisade’s subroutine');
    if (choices(state).some(o => o.command === 'continue' && /End the run/.test(o.label))) await choose('continue', named('End the run'), 'Select the end-the-run subroutine to break');
    if (state.phase.title === 'Break up to 2 barrier subroutines' && choices(state).some(o => o.command === 'continue' && /Continue/.test(o.label))) await choose('continue', named('Continue'), 'Finish Cleaver break selection');
    checkpoint('breaker-broken', 'The end-the-run subroutine is broken', 704, 'One credit pays for Cleaver’s break ability; the actual ICE subroutine is marked broken.');
    await until(s => choices(s).some(o => o.command === 'access'));
    await choose('access', () => true, 'Access the protected Nico Campaign');
    await choose('trash', () => true, 'Trash the protected economy asset');
    await until(action('runner'));
    checkpoint('remote-trashed', 'Successful run removes the asset', 725, 'Nico Campaign substitutes for Anthill Excavation; trashing costs two credits and Loup’s real first-trash trigger resolves.');
    await choose('run', o => o.server === 'HQ', 'Run HQ');
    await until(s => choices(s).some(o => o.command === 'rez' && o.card?.number === 30055));
    await choose('rez', number(30055), 'Rez Ping');
    await choose('trigger', number(30055), 'Resolve Ping’s tag');
    await until(s => s.runner.tags === 1 && s.active === 'runner');
    checkpoint('tagged', 'The HQ run gives the Runner a tag', 746, 'Ping substitutes for Doomscroll’s tag role; its end-the-run subroutine replaces the video’s separate damage sequence.', { runnerTags: 1 });
    await until(action('runner'));
    await choose('remove', () => true, 'Spend final click and two credits to remove the tag', false);
    checkpoint('tag-removed', 'Remove the tag before ending the turn', 793, 'One click and two credits remove the tag through the actual basic action.', { runnerTags: 0 });
    return { id: 'nsg-example-gateway-adaptation-v1', title: 'Three turns: learn by running', source: SOURCE,
      adaptations: [
        'This is a rules-valid System Gateway adaptation, not a one-to-one reproduction of the newer-card video.',
        'The existing legal Precision Design and Loup decks replace Built to Last and Zahya; identity income/triggers and exact credit totals therefore differ.',
        'Greenmail → Superconducting Hub; Maskirovka → Palisade; Anthill Excavation → Nico Campaign; Rising Tide → Cleaver; Doomscroll tag → Ping.',
        'Seamless Launch supplies the extra Hub advancement. Top-Down Solutions is omitted; central ICE installs move to Corp turn 3, after the second Jailbreak.',
        'Leech supplies the installed-program teaching moment; a second Jailbreak supplies multi-access instead of Devadatta. Leech’s strength reduction is deliberately unused so Cleaver demonstrates boosting.',
        'The second Runner turn gains one credit instead of its manual draw; Jailbreak still draws a card. This preserves the budget for the later break, trash, and tag removal.',
        'Nico Campaign supplies automatic turn-start income. HQ damage is omitted; Ping demonstrates a real tag and an ended run before tag removal.',
        'Both players are controlled through legal engine decisions; deck order is deterministic only in explicit scripted evaluation mode. No board state is injected.'
      ], initialConfig, trace, checkpoints };
  } finally { game.close(); }
}

if (require.main === module) buildReferenceEval().then(data => {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2) + '\n');
  console.log(`Generated ${data.checkpoints.length} reference checkpoints from ${data.trace.length} legal decisions: ${OUTPUT}`);
}).catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { buildReferenceEval, OUTPUT };
