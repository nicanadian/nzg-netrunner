'use strict';
// Targeted rules fixtures complement (and do not replace) visible Chrome playtests.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { makeGame, choices, checkState, checkSnapshot } = require('./engine-smoke.cjs');

async function overclockAccess(trashAsset) {
  const game = makeGame();
  try {
    game.api.boot({ side: 'runner', seed: 'rules-overclock' });
    vm.runInContext(`
      var testOverclock = AllCards(runner).find(c => c.setNumber === 30029);
      MoveCard(testOverclock, runner.grip);
      var testAsset = AllCards(corp).find(c => c.setNumber === 30071);
      var testRemote = NewServer('Remote test', false);
      corp.remoteServers.push(testRemote);
      MoveCard(testAsset, testRemote.root);
      playerTurn = runner; runner.clickTracker = 4;
      ChangePhase(phases.runnerActionMain);
    `, game.context);
    let state = game.api.snapshot();
    const choose = async (option, inspectResolved) => {
      assert.ok(option, `Missing choice in ${state.phase.title}`);
      game.api.choose({ version: state.version, command: option.command, index: option.index });
      if (inspectResolved) inspectResolved();
      state = await game.api.advance();
      checkState(game); checkSnapshot(game, state);
    };
    const play = choices(state).find(o => o.command === 'play' && o.card?.id === game.context.testOverclock.localId);
    assert.equal(play.cost.clicks, 1);
    assert.equal(play.cost.credits, 1);
    await choose(play);
    // Selecting the event opens a cancellable target choice; costs are paid on confirmation.
    assert.equal(state.runner.credits, 5);
    assert.equal(state.runner.clicks, 4);
    await choose(choices(state).find(o => o.server === 'Remote test'));
    assert.equal(state.runner.credits, 4, 'Overclock costs one credit');
    assert.equal(state.runner.clicks, 3, 'Overclock costs one click, not a second click for the run');
    assert.equal(state.runner.resolving.find(c => c.number === 30029).counters.credits, 5);
    for (let i = 0; i < 15 && !state.access; i++) {
      const next = choices(state).find(o => o.command === 'access') || choices(state).find(o => o.command === 'n');
      if (next?.command === 'access') {
        assert.equal(next.card.hidden, true, 'Access candidate stays concealed');
        assert.equal(next.cost, null, 'Cost metadata must not leak a concealed card');
      }
      await choose(next);
    }
    assert.equal(state.access?.number, 30071, 'Chosen remote asset becomes visible on access');
    const trash = choices(state).find(o => o.command === 'trash');
    assert.equal(trash.cost.credits, 3, 'Trash action displays actual Regolith cost');
    assert.equal(trash.cost.clicks, undefined, 'Access trash does not cost a click');
    assert.equal(trash.cost.note, '4 pool + 5 eligible run/card credits');
    await choose(choices(state).find(o => o.command === (trashAsset ? 'trash' : 'n')), () => {
      if (trashAsset) assert.equal(game.context.testOverclock.credits, 2, 'Three-credit trash cost uses hosted Overclock credits first');
    });
    if (trashAsset) {
      assert.ok(game.context.corp.archives.cards.includes(game.context.testAsset));
    } else assert.ok(game.context.testRemote.root.includes(game.context.testAsset), 'Declining trash preserves the installed asset');
    assert.equal(state.runner.credits, 4, 'Using hosted credits or declining trash must preserve the pool');
    for (let i = 0; i < 15 && state.run; i++) {
      await choose(choices(state).find(o => o.command === 'n') || choices(state).find(o => o.command === 'continue') || choices(state)[0]);
    }
    assert.equal(state.run, null);
    assert.equal(state.runner.resolving.length, 0, 'Run event leaves the resolving area after the run');
    assert.ok(game.context.runner.heap.includes(game.context.testOverclock));
    assert.equal(vm.runInContext('AvailableCredits(runner)', game.context), game.context.runner.creditPool, 'Unused hosted credits are unavailable after the run');
    assert.equal(game.context.runner.creditPool, trashAsset ? 5 : 4, 'Loup gains one credit for the first trash that turn');
    console.log(`PASS Overclock ${trashAsset ? 'trash payment' : 'declined trash'}, click cost, hidden access, and credit expiry`);
  } finally { game.close(); }
}
async function chromeReplay() {
  const game = makeGame();
  try {
    const replay = JSON.parse(fs.readFileSync(`${__dirname}/fixtures/rules-chrome-replay.json`, 'utf8'));
    game.api.boot(replay.config);
    await game.api.advance();
    for (const choice of replay.choices) {
      game.api.choose(choice);
      const state = await game.api.advance();
      checkState(game); checkSnapshot(game, state);
    }
    const state = game.api.snapshot();
    assert.equal(state.terminal.winner, 'corp');
    assert.equal(state.corp.points, 9);
    assert.equal(state.runner.points, 3);
    assert.equal(replay.choices.length, 148);
    assert.equal(state.decision, null);
    console.log(`PASS visible Chrome Runner replay: ${replay.choices.length} decisions, ${state.steps} engine actions, Corp 9–3`);
  } finally { game.close(); }
}
(async () => { await overclockAccess(true); await overclockAccess(false); await chromeReplay(); })().catch(error => { console.error(error); process.exitCode = 1; });
