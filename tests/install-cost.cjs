'use strict';
// The final install quote must follow optional trashing and actual payments.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { makeGame, choices, checkState, checkSnapshot } = require('./engine-smoke.cjs');

async function installCost({ trashOld = false, freeEffect = false } = {}) {
  const game = makeGame();
  try {
    game.api.boot({ side: 'corp', seed: 'finish-install-cost' });
    vm.runInContext(`
      var costTestIce = AllCards(corp).filter(c => c.cardType === 'ice');
      var costTestOld = costTestIce[0], costTestNew = costTestIce[1];
      MoveCard(costTestOld, corp.HQ.ice);
      MoveCard(costTestNew, corp.HQ.cards);
      playerTurn = corp;
      corp.clickTracker = 3;
      corp.creditPool = 5;
      ChangePhase(phases.corpActionMain);
    `, game.context);
    let state;
    const choose = async option => {
      assert.ok(option, `Missing legal choice in ${state.phase.title}`);
      game.api.choose({ version: state.version, command: option.command, index: option.index });
      state = await game.api.advance();
      checkState(game);
      checkSnapshot(game, state);
    };
    if (freeEffect) {
      // An effect installs directly, outside the basic click-install action.
      vm.runInContext(`
        ChangePhase({
          identifier: 'Test free installation', title: 'Test free installation',
          player: corp, next: phases.corpActionMain,
          Enumerate: {}, Resolve: {}
        });
        Install(costTestNew, corp.HQ, true, null, false);
      `, game.context);
      state = game.api.snapshot();
    } else {
      state = game.api.snapshot();
      await choose(choices(state).find(o => o.command === 'install' && o.card?.id === game.context.costTestNew.localId && o.server === 'HQ'));
    }
    assert.equal(state.phase.title, 'Trash Before Install');
    assert.equal(state.corp.credits, 5, 'Installation has not charged credits before final confirmation');
    assert.equal(state.corp.clicks, 3, 'Basic install click is charged on final confirmation');
    const {continuationModel}=await import('../app/presentation.mjs');
    assert.equal(continuationModel(state).label,'Confirm installation');
    assert.equal(continuationModel(state).command,'n');
    let finish = choices(state).find(o => o.command === 'n');
    assert.ok(finish?.cost, 'Finish install must quote its pending cost');
    assert.equal(finish.cost.credits, freeEffect ? 0 : 1, 'Current quote reflects one retained ICE or ignored costs');
    assert.equal(finish.cost.clicks, freeEffect ? undefined : 1, 'Only a basic action quotes one click');

    if (trashOld) {
      const trash = choices(state).find(o => o.command === 'trash' && o.card?.id === game.context.costTestOld.localId);
      assert.ok(trash, 'Existing ICE can be trashed before payment');
      game.api.choose({ version: state.version, command: trash.command, index: trash.index });
      // Inspect the refreshed quote before advance() automatically resolves the
      // now-forced finish action when no other ICE remains to trash.
      state = game.api.snapshot();
      for (let i = 0; i < 6 && state.phase.title !== 'Trash Before Install'; i++) {
        state = await game.api.advance(1);
      }
      assert.equal(state.phase.title, 'Trash Before Install');
      finish = choices(state).find(o => o.command === 'n');
      assert.equal(finish.cost.credits, 0, 'Trashing existing ICE immediately lowers final quote');
      assert.equal(finish.cost.clicks, 1);
    }
    const step=continuationModel(state);assert.equal(step.cost.credits,finish.cost.credits);assert.equal(step.cost.clicks,finish.cost.clicks);
    const quoted = { ...finish.cost };
    const before = { credits: state.corp.credits, clicks: state.corp.clicks };
    await choose(finish);
    assert.equal(before.credits - state.corp.credits, quoted.credits, 'Actual credit deduction equals final quote');
    assert.equal(before.clicks - state.corp.clicks, quoted.clicks || 0, 'Actual click deduction equals final quote');
    assert.ok(game.context.corp.HQ.ice.includes(game.context.costTestNew), 'New ICE installs on the selected server');
    assert.equal(game.context.corp.HQ.ice.includes(game.context.costTestOld), !trashOld);
    assert.equal(state.corp.credits, freeEffect || trashOld ? 5 : 4);
    assert.equal(state.corp.clicks, freeEffect ? 3 : 2);
    console.log(`PASS Finish install cost: ${freeEffect ? 'free effect, zero credits and no click' : trashOld ? 'trash existing ICE, zero credits and one click' : 'retain existing ICE, one credit and one click'}`);
  } finally { game.close(); }
}

async function run() {
  await installCost();
  await installCost({ trashOld: true });
  await installCost({ freeEffect: true });
}
if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { installCost, run };
