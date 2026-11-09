'use strict';
// Adapted encounter fixtures from the annotated recordings. Initial positions
// are explicitly injected; every subsequent action uses real legal choices.
// These are NOT full-game replays or evidence of the original hidden shuffle.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { makeGame, choices, checkState, checkSnapshot } = require('./engine-smoke.cjs');
const starter = require('../eval/recorded-games/neon-starter.json').decks;
const booster = require('../eval/recorded-games/lt-booster.json').decks;
const config = (decks, seed) => ({ side: 'runner', control: 'scripted', seed,
  decks: Object.fromEntries(Object.entries(decks).map(([side, d]) => [side, {
    identity: d.identity, cards: Object.entries(d.cards).flatMap(([n, count]) => Array(count).fill(Number(n))),
  }])) });

async function fixture(id, decks, setup, run) {
  const game = makeGame(), trace = [];
  try {
    game.api.boot(config(decks, `recorded-${id}`));
    vm.runInContext(`
      var selectedFixtureCards = [];
      function fixtureCard(player, number, zone) {
        var card = AllCards(player).find(c => c.setNumber === number && !selectedFixtureCards.includes(c));
        if (!card) throw Error('Fixture missing ' + number);
        selectedFixtureCards.push(card); MoveCard(card, zone); if (player === runner || zone === corp.scoreArea || zone === runner.scoreArea) card.faceUp = true; return card;
      }
      // The bootstrap deals hands; return those unknown starting hands first.
      while (runner.grip.length) MoveCard(runner.grip[0], runner.stack);
      while (corp.HQ.cards.length) MoveCard(corp.HQ.cards[0], corp.RnD.cards);
      var fixtureRemote = NewServer('Recorded remote', false); corp.remoteServers.push(fixtureRemote);
      playerTurn = runner; runner.clickTracker = 4; corp.clickTracker = 0;
      ${setup}
      ChangePhase(phases.runnerActionMain);
    `, game.context);
    let state = game.api.snapshot();
    checkState(game); checkSnapshot(game, state);
    const fail = label => new Error(`${id}: ${label}\n${state.phase.title} / ${state.active}\n${choices(state).map(o => `${o.command} ${o.label} ${o.detail || ''} ${o.card?.number || ''}`).join('\n')}`);
    const choose = async (command, predicate = () => true) => {
      const o = choices(state).find(x => x.command === command && predicate(x));
      if (!o) throw fail(`Missing ${command}`);
      const entry = { before: { phase: state.phase.title, active: state.active }, command, index: o.index, label: o.label };
      game.api.choose({ version: state.version, command, index: o.index });
      state = await game.api.advance();
      checkState(game); checkSnapshot(game, state); trace.push(entry);
      return state;
    };
    const pass = async () => {
      if (choices(state).some(o => o.command === 'n')) return choose('n');
      if (choices(state).some(o => o.command === 'continue' && /^Continue/.test(o.label))) return choose('continue', o => /^Continue/.test(o.label));
      if (state.phase.title === 'Run: Subroutines' && state.active === 'corp') return choose('trigger');
      const automatic = choices(state).find(o => o.command === 'trigger' && [30042, 30045, 30008, 30014, 30029].includes(o.card?.number));
      if (automatic) return choose('trigger', o => o.index === automatic.index);
      throw fail('Cannot pass');
    };
    const until = async (predicate, max = 60) => {
      for (let i = 0; i < max && !predicate(state); i++) await pass();
      if (!predicate(state)) throw fail('Checkpoint not reached');
    };
    const tools = { choose, until, pass, state: () => state, game,
      card: n => o => o.card?.number === n,
      encounter: n => s => s.active === 'runner' && s.run?.encountering && s.run.card?.number === n,
    };
    await run(tools);
    assert.equal(game.errors.length, 0, game.errors.join('\n'));
    const result = { id, setupKind: 'explicitly injected starting position adapted from video', legalDecisionCount: trace.length,
      final: { corpCredits: state.corp.credits, runnerCredits: state.runner.credits, corpPoints: state.corp.points,
        runnerPoints: state.runner.points, runnerClicks: state.runner.clicks, terminal: state.terminal || null }, trace };
    console.log(`PASS ${id}: ${trace.length} legal decisions after explicit setup`);
    return result;
  } finally { game.close(); }
}

async function playOverclock(t) {
  await t.choose('play', t.card(30029));
  await t.choose('continue', o => o.server === 'Recorded remote');
}
async function breakWith(t, number, label, subLabel) {
  await t.choose('trigger', o => o.card?.number === number && new RegExp(label, 'i').test(`${o.detail} ${o.label}`));
  // Break abilities can ask for individual subroutine choices and then Continue.
  if (subLabel && choices(t.state()).some(o => o.command === 'continue' && new RegExp(subLabel, 'i').test(o.label))) {
    await t.choose('continue', o => new RegExp(subLabel, 'i').test(o.label));
  }
}

async function main() {
  const results = [];
  results.push(await fixture('neon-R1-overclock-manegarm', starter, `
    runner.creditPool = 8; runner.clickTracker = 2; corp.creditPool = 5;
    fixtureCard(runner, 30032, runner.rig.programs);
    fixtureCard(runner, 30029, runner.grip);
    fixtureCard(runner, 30032, runner.grip);
    fixtureCard(runner, 30028, runner.grip);
    var fixtureTithe = fixtureCard(corp, 30073, fixtureRemote.ice);
    var fixtureManegarm = fixtureCard(corp, 30042, fixtureRemote.root);
    fixtureCard(corp, 30071, fixtureRemote.root);
  `, async t => {
    await playOverclock(t);
    await t.until(s => choices(s).some(o => o.command === 'rez' && o.card?.number === 30073));
    await t.choose('rez', t.card(30073));
    await t.until(s => s.phase.title === 'Run: Movement' && choices(s).some(o => o.command === 'rez' && o.card?.number === 30042));
    assert.equal(t.state().runner.hand.length, 1, 'Tithe deals its damage while installed Mayfly is unused');
    assert.equal(t.state().runner.hand[0].number, 30028, 'Spare Mayfly is the random damage, as observed');
    await t.choose('rez', t.card(30042));
    await t.until(s => choices(s).some(o => o.command === 'continue' && /Pay 5/.test(o.label)));
    assert.equal(t.state().runner.clicks, 1);
    assert.ok(!choices(t.state()).some(o => /click/i.test(o.label)), 'Two-click payment unavailable with one click');
    await t.choose('continue', o => /Pay 5/.test(o.label));
    for (let i = 0; i < 2; i++) {
      await t.until(s => choices(s).some(o => o.command === 'access'));
      await t.choose('access'); await t.choose('trash');
    }
    await t.until(s => !s.run);
    assert.equal(t.state().runner.credits, 1);
    assert.equal(t.state().corp.credits, 3);
    assert.ok(t.state().runner.rig.programs.some(c => c.number === 30032), 'Unused Mayfly survives');
  }));
  results.push(await fixture('lt-starter-R6-urtica-flatline', starter, `
    runner.creditPool = 9; runner.clickTracker = 3; corp.creditPool = 6;
    fixtureCard(corp, 30067, corp.scoreArea);
    fixtureCard(corp, 30069, runner.scoreArea);
    fixtureCard(corp, 30067, runner.scoreArea);
    fixtureCard(runner, 30006, runner.rig.programs);
    fixtureCard(runner, 30026, runner.rig.programs);
    fixtureCard(runner, 30032, runner.rig.programs);
    fixtureCard(runner, 30033, runner.rig.resources);
    fixtureCard(runner, 30029, runner.grip);
    fixtureCard(runner, 30014, runner.grip);
    fixtureCard(runner, 30006, runner.grip);
    fixtureCard(corp, 30072, fixtureRemote.ice).rezzed = true;
    fixtureCard(corp, 30045, fixtureRemote.root).advancement = 1;
    fixtureCard(corp, 30042, fixtureRemote.root);
  `, async t => {
    await playOverclock(t);
    await t.until(s => choices(s).some(o => o.command === 'rez' && o.card?.number === 30042));
    await t.choose('rez', t.card(30042));
    await t.until(t.encounter(30072));
    await breakWith(t, 30006, 'strength');
    await breakWith(t, 30006, 'Break', 'End the run');
    if (t.state().phase.title === 'Break up to 2 barrier subroutines') await t.choose('continue', o => /^Continue/.test(o.label));
    await t.until(s => choices(s).some(o => o.command === 'continue' && /Pay 5/.test(o.label)));
    await t.choose('continue', o => /Pay 5/.test(o.label));
    await t.until(s => choices(s).some(o => o.command === 'access'));
    await t.choose('access', o => o.card?.hidden);
    assert.equal(t.state().access?.number, 30045);
    await t.until(s => !!s.terminal);
    assert.equal(t.state().terminal.winner, 'corp');
    assert.equal(t.state().corp.points, 2);
    assert.equal(t.state().runner.points, 5);
    assert.equal(t.state().runner.credits, 5, 'Automatic hosted-credit payment reaches same final pool without manual refund');
    assert.equal(t.state().runner.hand.length, 0);
  }));
  results.push(await fixture('lt-booster-R12-leech-partial-break', booster, `
    runner.creditPool = 6; runner.clickTracker = 2; corp.creditPool = 7;
    fixtureCard(corp, 30067, corp.scoreArea);
    fixtureCard(corp, 30070, corp.scoreArea);
    fixtureCard(corp, 30068, corp.scoreArea);
    fixtureCard(runner, 30006, runner.rig.programs);
    fixtureCard(runner, 30026, runner.rig.programs);
    fixtureCard(runner, 30015, runner.rig.programs);
    fixtureCard(runner, 30008, runner.rig.programs).virus = 3;
    fixtureCard(runner, 30022, runner.rig.hardware);
    fixtureCard(corp, 30072, fixtureRemote.ice).rezzed = true;
    fixtureCard(corp, 30073, fixtureRemote.ice).rezzed = true;
    fixtureCard(corp, 30039, fixtureRemote.ice).rezzed = true;
    fixtureCard(corp, 30070, fixtureRemote.root);
  `, async t => {
    await t.choose('run', o => o.server === 'Recorded remote');
    await t.until(t.encounter(30039));
    for (let i = 0; i < 3; i++) await t.choose('trigger', t.card(30008));
    assert.equal(t.state().run.card.strength, 3);
    for (let i = 0; i < 2; i++) {
      await breakWith(t, 30006, 'Break');
      for (let j = 0; j < 2 && t.state().phase.title === 'Break up to 2 barrier subroutines'; j++) {
        const sub = choices(t.state()).find(o => o.command === 'continue' && !/^Continue/.test(o.label));
        if (sub) await t.choose('continue', o => o.index === sub.index);
      }
      if (t.state().phase.title === 'Break up to 2 barrier subroutines') await t.choose('continue', o => /^Continue/.test(o.label));
    }
    await t.until(t.encounter(30073));
    await breakWith(t, 30015, 'Break', 'net damage');
    await t.until(t.encounter(30072));
    await breakWith(t, 30006, 'strength');
    await breakWith(t, 30006, 'Break', 'End the run');
    if (t.state().phase.title === 'Break up to 2 barrier subroutines') await t.choose('continue', o => /^Continue/.test(o.label));
    await t.until(s => choices(s).some(o => o.command === 'access'));
    await t.choose('access'); await t.choose('steal');
    await t.until(s => !s.run);
    assert.equal(t.state().runner.credits, 0);
    assert.equal(t.state().corp.credits, 8, 'Unbroken Tithe credit subroutine resolves');
    assert.equal(t.state().corp.points, 5);
    assert.equal(t.state().runner.points, 1);
    assert.equal(t.game.context.runner.rig.programs.find(c => c.setNumber === 30008).virus, 0, 'Remote success does not reload Leech');
  }));
  if (process.argv.includes('--write')) fs.writeFileSync(path.resolve(__dirname, '../eval/recorded-games/engine-scenario-validation.json'), JSON.stringify({
    checkedOn: '2026-11-06', scope: 'Three adapted encounter fixtures, with explicit initial state injection. No full source-game replay or browser/UI validation is claimed.', scenarios: results,
  }, null, 2) + '\n');
}
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
module.exports = { main };
