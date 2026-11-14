'use strict';
const assert=require('node:assert/strict');
function validateState(game) {
  const { corp, runner } = game.context;
  for (const [name, player] of [['corp', corp], ['runner', runner]]) {
    for (const key of ['creditPool', 'clickTracker', 'maxHandSize']) {
      assert.ok(Number.isFinite(player[key]), `${name}.${key} must be finite, got ${player[key]}`);
    }
    assert.ok(player.creditPool >= 0, `${name} has negative credits`);
    assert.ok(player.clickTracker >= 0, `${name} has negative clicks`);
  }
  assert.ok(Number.isFinite(runner.temporaryCredits), 'Temporary credits must be finite');
  assert.ok(Number.isFinite(runner.tags) && runner.tags >= 0, 'Tags must be finite and nonnegative');
  const containers = [
    corp.HQ.cards, corp.RnD.cards, corp.archives.cards, corp.scoreArea,
    corp.resolvingCards, corp.installingCards, runner.grip, runner.stack, runner.heap,
    runner.scoreArea, runner.resolvingCards, runner.installingCards,
    runner.rig.programs, runner.rig.hardware, runner.rig.resources, game.context.removedFromGame,
  ];
  for (const server of [corp.HQ, corp.RnD, corp.archives, ...corp.remoteServers]) containers.push(server.root, server.ice);
  for(const player of [corp,runner])if(player.identityCard?.setAsideCards)containers.push(player.identityCard.setAsideCards);
  const seen = new Set();
  for (let i = 0; i < containers.length; i++) {
    const zone = containers[i];
    assert.ok(Array.isArray(zone), `Zone ${i} must exist`);
    for (const card of zone) {
      assert.ok(card && card.isCard, `Zone ${i} has an invalid card`);
      assert.ok(!seen.has(card), `Card ${card.title} appears in multiple zones`);
      seen.add(card);
      // Removed-from-game cards may intentionally have a null location.
      if (zone !== game.context.removedFromGame) assert.equal(card.cardLocation, zone, `${card.title} has a stale location`);
      if (card.hostedCards) containers.push(card.hostedCards);
      for (const key of ['advancement', 'credits', 'virus', 'power', 'agenda']) {
        if (card[key] !== undefined) assert.ok(Number.isFinite(card[key]) && card[key] >= 0, `${card.title}.${key} invalid`);
      }
    }
  }
  return seen.size;
}

module.exports={validateState};
