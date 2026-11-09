'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { buildReferenceEval, OUTPUT } = require('../scripts/build-reference-eval.cjs');
const { makeGame, choices, checkState, checkSnapshot } = require('./engine-smoke.cjs');

async function referenceEval() {
  const stored = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
  const generated = await buildReferenceEval();
  assert.deepEqual(generated, stored, 'Regenerated reference dataset must exactly match the committed artifact');
  assert.equal(stored.source.url, 'https://www.youtube.com/watch?v=xtI0-j0utLo');
  assert.equal(stored.source.kind, 'adapted teaching sequence');
  assert.ok(stored.adaptations.some(note => note.includes('not a one-to-one')));
  assert.ok(stored.adaptations.some(note => note.includes('HQ damage is omitted')));
  assert.equal(stored.initialConfig.control, 'scripted');
  assert.equal(stored.initialConfig.orderedDecks, true);
  for (const deck of Object.values(stored.initialConfig.decks)) {
    assert.equal(deck.cards.length, 40);
    const counts = deck.cards.reduce((result, n) => (result[n] = (result[n] || 0) + 1, result), {});
    assert.ok(Object.values(counts).every(count => count <= 3), 'No card exceeds three copies');
  }

  // Rebuild independently from the exported choice trace, not the semantic plan.
  const game = makeGame();
  try {
    game.api.boot(stored.initialConfig);
    assert.equal(game.context.corp.AI, null);
    assert.equal(game.context.runner.AI, null);
    let state = await game.api.advance();
    const capture = index => {
      checkState(game); checkSnapshot(game, state);
      assert.equal(state.side, state.active, 'Scripted view follows the decision owner');
      for (const checkpoint of stored.checkpoints.filter(c => c.traceIndex === index)) {
        assert.deepEqual(JSON.parse(JSON.stringify(state)), checkpoint.state, `Trace reproduces ${checkpoint.id}`);
      }
    };
    capture(-1);
    for (const [index, entry] of stored.trace.entries()) {
      assert.ok(choices(state).some(o => o.command === entry.choice.command && o.index === entry.choice.index), `Choice ${index} is legally offered`);
      assert.equal(entry.choice.version, state.version, `Choice ${index} uses the current decision`);
      game.api.choose(entry.choice);
      state = entry.advance === false ? game.api.snapshot() : await game.api.advance();
      capture(index);
    }
    assert.equal(game.errors.length, 0);
  } finally { game.close(); }

  const normal = makeGame(), ignoredOrderFlag = makeGame();
  try {
    const normalConfig = { side: 'runner', seed: 'normal-mode-isolation', decks: stored.initialConfig.decks };
    normal.api.boot(normalConfig);
    ignoredOrderFlag.api.boot({ ...normalConfig, orderedDecks: true });
    assert.ok(normal.context.corp.AI, 'Normal local play retains the Corp AI');
    assert.equal(normal.context.runner.AI, null);
    const normalState = await normal.api.advance();
    const flaggedState = await ignoredOrderFlag.api.advance();
    assert.deepEqual(JSON.parse(JSON.stringify(flaggedState)), JSON.parse(JSON.stringify(normalState)), 'Ordered-deck flag has no effect outside explicit scripted evaluation');
    assert.equal(normalState.side, 'runner', 'Normal view remains the chosen human side');
  } finally { normal.close(); ignoredOrderFlag.close(); }

  const at = id => {
    const result = stored.checkpoints.find(c => c.id === id);
    assert.ok(result, `Missing checkpoint ${id}`);
    return result.state;
  };
  const server = (state, name) => state.corp.servers.find(s => s.name === name);
  const cleaver = state => state.runner.rig.programs.find(c => c.number === 30006);
  const setup = at('setup');
  assert.deepEqual(setup.corp.hand.map(c => c.number), [30075, 30070, 30072, 30040, 30037]);
  assert.ok(setup.runner.hand.every(c => c.hidden && c.number === undefined));
  assert.equal(server(at('defended-remote'), 'Remote 0').ice.length, 1);
  assert.equal(server(at('defended-remote'), 'Remote 0').root.length, 1);
  assert.equal(at('failed-run-encounter').run.card.strength, 4);
  assert.equal(at('failed-run-encounter').run.card.subroutines[0].broken, false);
  assert.equal(at('failed-run').run, null);
  assert.equal(at('failed-run').runner.points, 0);
  assert.equal(at('access-offworld').access.number, 30067);
  assert.equal(at('access-offworld').access.hidden, false);
  assert.equal(at('corp-score').corp.points, 1);
  assert.equal(at('corp-score').runner.points, 2);
  assert.equal(at('corp-score').corp.clicks, 1, 'Scoring does not consume the remaining click');
  assert.equal(server(at('layered-servers'), 'R&D').ice.length, 2);
  assert.equal(server(at('layered-servers'), 'HQ').ice.length, 1);
  assert.equal(cleaver(at('breaker-before-boost')).strength, 3);
  assert.equal(at('breaker-before-boost').run.card.strength, 4);
  assert.equal(cleaver(at('breaker-boosted')).strength, 4);
  assert.equal(at('breaker-before-boost').runner.credits - at('breaker-boosted').runner.credits, 2);
  assert.equal(at('breaker-broken').run.card.subroutines[0].broken, true);
  assert.equal(at('breaker-boosted').runner.credits - at('breaker-broken').runner.credits, 1);
  assert.equal(cleaver(at('breaker-broken')).strength, 3, 'Temporary boost expires at encounter end');
  assert.equal(server(at('remote-trashed'), 'Remote 0').root.length, 0);
  assert.equal(at('remote-trashed').corp.discard.filter(c => c.number === 30037).length, 2, 'Both accessed Nico Campaigns were really trashed');
  assert.equal(at('tagged').runner.tags, 1);
  assert.equal(at('tag-removed').runner.tags, 0);
  assert.equal(at('tagged').runner.credits - at('tag-removed').runner.credits, 2);
  assert.equal(at('tag-removed').runner.clicks, 0);
  assert.equal(at('tag-removed').turn, 6, 'Fixture stops after three paired turns, before a fourth Corp turn');

  const sourceTimes = {
    setup: 67, 'defended-remote': 147, 'failed-run-encounter': 201, 'failed-run': 223,
    'access-offworld': 274, 'corp-score': 398, 'layered-servers': 634,
    'breaker-before-boost': 675, 'breaker-boosted': 688, 'breaker-broken': 704,
    'remote-trashed': 725, tagged: 746, 'tag-removed': 793,
  };
  assert.equal(stored.checkpoints.length, Object.keys(sourceTimes).length);
  for (const checkpoint of stored.checkpoints) {
    assert.equal(checkpoint.videoTime, sourceTimes[checkpoint.id], `${checkpoint.id} retains reviewed source timestamp mapping`);
    assert.ok(checkpoint.notes.length > 30);
  }
  console.log(`PASS reference evaluation: ${stored.checkpoints.length} regenerated and independently replayed checkpoints, ${stored.trace.length} legal decisions, ${at('tag-removed').steps} engine actions; payments, boosts, breaks, scoring, tags, privacy, and timestamp mapping`);
}

if (require.main === module) referenceEval().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { referenceEval };
