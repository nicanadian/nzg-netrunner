'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {makeGame, choices, checkSnapshot, checkState} = require('./engine-smoke.cjs');
async function restore(replay) {
  const game = makeGame();
  try {
    game.api.boot(replay.config);
    let state = await game.api.advance();
    for (const choice of replay.choices) { game.api.choose(choice); state = await game.api.advance(); }
    return {game, state};
  } catch (error) { game.close(); throw error; }
}
async function main() {
  const {activityModel, drawExplanation} = await import('../app/activity.mjs');
  const spin = await restore(require('./fixtures/spin-doctor-rez-replay.json'));
  try {
    const {game} = spin; let state = spin.state;
    assert.equal(game.context.corp.AI, null, 'The human Corp has no AI controller');
    const mandatory = state.history.filter(e => e.draw?.kind === 'mandatory');
    assert.equal(mandatory.length, 1);
    assert.match(drawExplanation(mandatory[0]), /no click cost/);
    const rez = choices(state).find(o => o.command === 'rez' && o.card?.number === 30053);
    assert.match(rez.cost.note, /draw 2 cards/);
    const hand = state.corp.hand.length, clicks = state.corp.clicks;
    game.api.choose({version: state.version, command: rez.command, index: rez.index});
    state = await game.api.advance();
    const onRez = choices(state).find(o => o.command === 'trigger' && o.card?.number === 30053);
    assert.match(onRez.label, /Draw 2 cards on rez/);
    game.api.choose({version: state.version, command: onRez.command, index: onRez.index});
    state = await game.api.advance();
    assert.equal(state.corp.hand.length, hand + 2, 'Spin Doctor draws exactly two on rez');
    assert.equal(state.corp.clicks, clicks, 'Rezzing and its draw do not spend action clicks');
    const drawn = state.history.findLast(e => e.draw);
    assert.equal(drawn.text, 'Corp drew 2 cards');
    assert.equal(drawn.draw.kind, 'effect'); assert.equal(drawn.draw.source, 'Spin Doctor');
    assert.match(drawExplanation(drawn), /Spin Doctor/);
    const paused = await game.api.advance();
    assert.equal(paused.steps, state.steps, 'Automatic advancement stops at the human action');
    assert.equal(paused.corp.hand.length, state.corp.hand.length);
    const draw = choices(state).find(o => o.command === 'draw');
    game.api.choose({version: state.version, command: draw.command, index: draw.index});
    const paid = await game.api.advance();
    assert.equal(paid.corp.clicks, clicks - 1);
    assert.equal(paid.corp.hand.length, hand + 3);
    assert.equal(paid.history.findLast(e => e.draw).draw.kind, 'action');
    assert.match(drawExplanation(paid.history.findLast(e => e.draw)), /1 click/);
    checkState(game); checkSnapshot(game, paid);
  } finally { spin.game.close(); }

  const replay = require('./fixtures/corp-draw-feedback-replay.json');
  // The optional Hub draw is a separate decision, even when no clicks remain.
  for (const accept of [false, true]) {
    const hub = await restore({...replay, choices: replay.choices.slice(0, 54)});
    try {
      const s = hub.state, before = s.corp.hand.length;
      assert.equal(s.phase.source, 'Superconducting Hub');
      assert.equal(choices(s).length, 2);
      const paused = await hub.game.api.advance();
      assert.equal(paused.steps, s.steps); assert.equal(paused.corp.hand.length, before);
      const option = choices(s).find(o => o.index === (accept ? 0 : 1));
      hub.game.api.choose({version: s.version, command: option.command, index: option.index});
      const after = await hub.game.api.advance();
      assert.equal(after.corp.hand.length, before + (accept ? 2 : 0));
      if (accept) assert.equal(after.history.findLast(e => e.draw).draw.source, 'Superconducting Hub');
    } finally { hub.game.close(); }
  }
  const played = await restore(replay);
  try {
    const {state} = played;
    const recap = activityModel(state);
    assert.equal(recap.recap, true); assert.equal(recap.name, 'Runner');
    assert.equal(recap.turn, 24); assert.ok(recap.entries.length > 40);
    assert.equal(recap.entries.filter(e => /^Run initiated/.test(e.text)).length, 3);
    assert.ok(recap.entries.some(e => e.text === 'Orbital Superiority stolen'));
    assert.ok(recap.entries.every(e => e.side === 'runner' && e.turn === 24));
    assert.match(recap.summary, /3 runs.*1 agenda stolen/);
    const latest = activityModel(state, 'latest');
    assert.equal(latest.entries.length, 16);
    assert.equal(latest.entries[0].text, state.history.at(-1).text);
    // Current-turn Corp messages cannot push the previous Runner turn away.
    const dense = {...state, history: [...state.history, ...Array.from({length: 180}, () => ({text:'Corp gained one credit',side:'corp',turn:25}))]};
    assert.equal(activityModel(dense).entries.length, recap.entries.length);
    vm.runInContext(`for (let i = 0; i < 180; i++) Log('Corp gained one credit');`, played.game.context);
    assert.equal(activityModel(played.game.api.snapshot()).entries.length, recap.entries.length,
      'The adapter retains the full previous Runner turn beyond its old 150-event cutoff');
    const runnerView = activityModel({...state, side:'runner'});
    assert.equal(runnerView.name, 'Corp');
    assert.ok(runnerView.entries.every(e => e.side === 'corp'));
    assert.equal(activityModel({side:'corp', history:[]}).recap, false);
  } finally { played.game.close(); }
  console.log('Turn feedback: mandatory/action/card-effect draws, Spin Doctor, optional Hub draw, human pause and complete opponent-turn recap pass.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
