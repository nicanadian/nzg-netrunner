'use strict';
// Regression for the Botulus disappearance reproduced in the extension browser.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { makeGame, choices, checkState, checkSnapshot } = require('./engine-smoke.cjs');

async function hostedPrivacy() {
  const game = makeGame();
  try {
    game.api.boot({ side: 'runner', seed: 'hosted-privacy' });
    vm.runInContext(`
      var hostedTestIce = AllCards(corp).find(c => c.cardType === 'ice');
      MoveCard(hostedTestIce, corp.HQ.ice);
      hostedTestIce.rezzed = false;
      hostedTestIce.faceUp = false;
      hostedTestIce.knownToRunner = false;
      var hostedTestBotulus = AllCards(runner).find(c => c.setNumber === 30004);
      MoveCard(hostedTestBotulus, runner.grip);
      playerTurn = runner;
      runner.clickTracker = 4;
      ChangePhase(phases.runnerActionMain);
    `, game.context);
    let state = game.api.snapshot();
    const install = choices(state).find(o => o.command === 'install' && o.card?.id === game.context.hostedTestBotulus.localId && o.hostId === game.context.hostedTestIce.localId);
    assert.ok(install, 'Legal Botulus install must identify its host');
    assert.match(install.hostLabel, /HQ/);
    assert.ok(!install.hostLabel.includes(game.context.hostedTestIce.title), 'Host label must not reveal concealed ICE title');
    assert.equal(install.cost.credits, 2);
    assert.equal(install.cost.clicks, 1);
    game.api.choose({ version: state.version, command: install.command, index: install.index });
    state = await game.api.advance();
    if (state.phase.title === 'Trash Before Install') {
      const finish = choices(state).find(o => o.command === 'n');
      assert.ok(finish, 'Install can complete with sufficient memory');
      game.api.choose({ version: state.version, command: finish.command, index: finish.index });
      state = await game.api.advance();
    }
    checkState(game);
    checkSnapshot(game, state);
    const hq = state.corp.servers.find(s => s.name === 'HQ');
    assert.ok(hq, 'HQ must be exported');
    const host = hq.ice.find(c => c.id === game.context.hostedTestIce.localId);
    assert.equal(host.hidden, true, 'Unrezzed ICE remains concealed');
    for (const key of ['title', 'number', 'type', 'strength', 'subTypes', 'subroutines']) {
      assert.equal(host[key], undefined, `Concealed host must not export ${key}`);
    }
    assert.ok(Array.isArray(host.hosted), 'Concealed host must still export its hosted-card list');
    const botulus = host.hosted.find(c => c.number === 30004);
    assert.ok(botulus, 'Visible hosted program must remain exported under a concealed host');
    assert.equal(botulus.hidden, false);
    assert.equal(botulus.title, 'Botulus');
    assert.equal(botulus.counters.virus, 1, 'Install trigger gives visible virus counter');
    assert.equal(botulus.installed, true);
    assert.equal(state.runner.credits, 3);
    assert.equal(state.runner.clicks, 3);
    assert.ok(game.context.hostedTestBotulus.host === game.context.hostedTestIce, 'Installed Botulus points to the selected host');
    console.log('PASS Botulus visible with virus counter on concealed ICE; host identity remains private');
  } finally { game.close(); }
}

if (require.main === module) hostedPrivacy().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { hostedPrivacy };
