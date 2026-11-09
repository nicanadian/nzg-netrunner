#!/usr/bin/env node
'use strict';

// Run with: node tests/engine-smoke.cjs
// Each game gets its own realm: upstream modifies JSON, console, and Math.random.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');

const ROOT = path.resolve(__dirname, '..');
const TIMEOUT_MS = Number(process.env.NR_TEST_TIMEOUT_MS || 120000);
const SEEDS = (process.env.NR_TEST_SEEDS || '1,2,3').split(',').map(Number);
const quiet = process.env.NR_TEST_VERBOSE !== '1';

function makeGame() {
  const timers = new Set();
  const errors = [];
  const sandbox = {
    console: {
      log: (...args) => { if (!quiet) console.log(...args); },
      warn: (...args) => { if (!quiet) console.warn(...args); },
      error: (...args) => { errors.push(args.map(String).join(' ')); },
    },
    performance,
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    structuredClone,
    location: { search: '', hostname: 'localhost', href: 'http://localhost/' },
    navigator: {},
    setTimeout(callback, delay, ...args) {
      const timer = setTimeout(() => { timers.delete(timer); callback(...args); }, Math.min(delay || 0, 1));
      timers.add(timer);
      return timer;
    },
    clearTimeout(timer) { clearTimeout(timer); timers.delete(timer); },
    setInterval() { return 0; },
    clearInterval() {},
    requestAnimationFrame(callback) { return sandbox.setTimeout(() => callback(performance.now()), 0); },
    cancelAnimationFrame(timer) { sandbox.clearTimeout(timer); },
    postMessage() {},
    addEventListener() {},
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  const context = vm.createContext(sandbox);
  function load(relativePaths) {
    const candidates = Array.isArray(relativePaths) ? relativePaths : [relativePaths];
    const file = candidates.map(p => path.join(ROOT, p)).find(p => fs.existsSync(p));
    assert.ok(file, `Missing engine script: ${candidates.join(' or ')}`);
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file, timeout: 10000 });
  }
  load('engine/shims.js');
  load('vendor/chiriboga/seedrandom.min.js');
  for (const file of ['init', 'phase', 'command', 'checks', 'mechanics', 'utility']) load(`vendor/chiriboga/${file}.js`);
  load(['vendor/chiriboga/sets/systemgateway.js', 'vendor/chiriboga/systemgateway.js']);
  for (const file of ['decks', 'runcalculator', 'ai_corp', 'ai_runner']) load(`vendor/chiriboga/${file}.js`);
  load('engine/deck-catalog.js');
  load('engine/adapter.js');
  assert.ok(context.NR, 'Adapter must expose globalThis.NR');
  return {
    context,
    api: context.NR,
    errors,
    close() { for (const timer of timers) clearTimeout(timer); },
  };
}

async function within(promise, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} exceeded ${TIMEOUT_MS}ms`)), TIMEOUT_MS); }),
    ]);
  } finally { clearTimeout(timer); }
}

function checkState(game) {
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

function checkSnapshot(game, snapshot) {
  assert.equal(snapshot.diagnostics?.length || 0, 0, (snapshot.diagnostics || []).join('\n'));
  assert.equal(game.api.metrics?.().diagnostics?.length || 0, 0, JSON.stringify(game.api.metrics?.().diagnostics));
  assert.ok(Number.isInteger(snapshot.version) && snapshot.version >= 0, 'Snapshot needs a valid decision version');
  assert.ok(Number.isFinite(snapshot.steps) && snapshot.steps >= 0, 'Action count must remain finite');
  const all = [];
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (Object.hasOwn(value, 'hidden')) {
      all.push(value);
      if (value.hidden) {
        for (const key of ['title', 'number', 'type', 'strength', 'strengthEffects', 'subTypes', 'subroutines', 'advancementRequirement', 'canScore']) {
          assert.equal(value[key], undefined, `Hidden card ${value.id} exposes ${key}`);
        }
      }
    }
    for (const item of Object.values(value)) walk(item);
  }
  walk(snapshot);
  const own = snapshot[snapshot.side];
  const opponent = snapshot[snapshot.side === 'corp' ? 'runner' : 'corp'];
  assert.ok(own.hand.every(card => !card.hidden && card.title && card.number), 'Player must be able to inspect own hand');
  // Initial opponent hands have not been exposed or accessed.
  if (snapshot.phase.identifier.includes('Mulligan')) assert.ok(opponent.hand.every(card => card.hidden), 'Opening opponent hand must stay hidden');
  assert.ok(all.length > 0, 'Snapshot should contain game cards');
}

function terminal(game, snapshot) {
  return game.context.currentPhase?.identifier === 'Game Over' || Boolean(snapshot.terminal || snapshot.winner || snapshot.result || snapshot.gameOver);
}

// Read actions from the adapter DTO rather than upstream phaseOptions, so this
// also exercises the same choice contract used by the browser.
function choices(snapshot) {
  const groups = snapshot.actions || snapshot.commands || snapshot.choices || snapshot.decision?.commands || [];
  if (Array.isArray(groups)) {
    return groups.flatMap(group => {
      if (group.options) return group.options.map((option, index) => ({ ...option, command: group.command || group.id || group.key, index: option.index ?? index }));
      return [group];
    });
  }
  return Object.entries(groups).flatMap(([command, options]) => options.map((option, index) => ({ ...option, command, index: option.index ?? index })));
}

function pick(snapshot, preferred) {
  const list = choices(snapshot);
  assert.ok(list.length, `No human choices at ${snapshot.phase?.title || snapshot.phase || 'unknown phase'}`);
  const option = list.find(o => preferred.includes(o.command)) || list[0];
  return { version: snapshot.version ?? snapshot.decision?.version, command: option.command, index: option.index ?? 0 };
}

function canonical(snapshot) {
  // Timing/debug counters are not part of deterministic game behavior.
  return JSON.stringify(snapshot, (key, value) => /^(timestamp|elapsed|duration|thinkingMs|metrics)$/.test(key) ? undefined : value);
}

async function opening(side, seed) {
  const game = makeGame();
  try {
    await game.api.boot({ side, seed, faceoff: false });
    await within(game.api.advance(), `${side} opening`);
    checkState(game);
    let snapshot = game.api.snapshot();
    checkSnapshot(game, snapshot);
    assert.ok(choices(snapshot).some(o => o.command === 'm'), `${side} opening must offer mulligan`);
    assert.ok(choices(snapshot).some(o => o.command === 'n'), `${side} opening must offer keep`);
    const initial = canonical(snapshot);
    const stale = pick(snapshot, ['n']);
    stale.version--;
    assert.throws(() => game.api.choose(stale), /passed|stale|version/i, 'Stale decisions must be rejected');
    assert.equal(canonical(game.api.snapshot()), initial, 'Rejected stale choice must not change the game');
    const invalid = pick(snapshot, ['n']);
    invalid.index = 999999;
    assert.throws(() => game.api.choose(invalid), /invalid/i, 'Out-of-range choices must be rejected');
    assert.equal(canonical(game.api.snapshot()), initial, 'Rejected invalid choice must not change the game');
    const trace = [canonical(snapshot)];
    for (let i = 0; i < 4 && !terminal(game, snapshot); i++) {
      const choice = pick(snapshot, i === 0 && side === 'corp' ? ['m'] : ['n', 'gain', 'continue']);
      await game.api.choose(choice);
      await within(game.api.advance(), `${side} decision ${i}`);
      checkState(game);
      snapshot = game.api.snapshot();
      checkSnapshot(game, snapshot);
      trace.push(canonical(snapshot));
    }
    assert.equal(game.errors.length, 0, game.errors.join('\n'));
    return trace;
  } finally { game.close(); }
}

async function faceoff(seed) {
  const game = makeGame();
  const start = performance.now();
  try {
    await game.api.boot({ side: 'runner', seed, faceoff: true });
    let snapshot;
    for (let batch = 0; batch < 10000; batch++) {
      await within(game.api.advance(), `Faceoff seed ${seed}, batch ${batch}`);
      checkState(game);
      snapshot = game.api.snapshot();
      checkSnapshot(game, snapshot);
      if (terminal(game, snapshot)) break;
      assert.ok(performance.now() - start < TIMEOUT_MS, `Faceoff seed ${seed} did not finish within ${TIMEOUT_MS}ms`);
    }
    assert.ok(terminal(game, snapshot), `Faceoff seed ${seed} did not reach a winner`);
    assert.equal(game.errors.length, 0, game.errors.join('\n'));
    assert.ok(['corp', 'runner'].includes(snapshot.terminal?.winner), 'Terminal game must identify the winner');
    assert.ok(snapshot.terminal.reason, 'Terminal game must identify the win condition');
    assert.equal(snapshot.decision, null, 'Game over must not accept further decisions');
    console.log(`PASS faceoff seed=${seed}, winner=${snapshot.terminal.winner} (${Math.round(performance.now() - start)}ms) ${JSON.stringify(game.api.metrics?.() || {})}`);
  } finally { game.close(); }
}

async function accessPrivacy() {
  const game = makeGame();
  try {
    game.api.boot({ side: 'runner', seed: 31 });
    // A legal remote containing an asset and an upgrade: the runner chooses
    // access order without learning either card's title in advance.
    vm.runInContext(`
      var testRemote = NewServer('Remote test', false);
      corp.remoteServers.push(testRemote);
      for (var number of [30037, 30042]) {
        var card = AllCards(corp).find(c => c.setNumber === number);
        MoveCard(card, testRemote.root);
        card.rezzed = card.faceUp = card.knownToRunner = false;
      }
      attackedServer = testRemote;
      playerTurn = runner;
      ChangePhase(phases.runBreachServer);
    `, game.context);
    let snapshot = game.api.snapshot();
    checkState(game);
    checkSnapshot(game, snapshot);
    const accessChoices = choices(snapshot).filter(o => o.command === 'access');
    assert.equal(accessChoices.length, 2, 'Remote should offer both access candidates');
    const titles = game.context.corp.remoteServers[0].root.map(c => c.title);
    for (const option of accessChoices) {
      assert.equal(option.card.hidden, true, 'Unaccessed remote card must be hidden');
      for (const title of titles) assert.ok(!option.label.includes(title), `Access label leaked ${title}`);
    }
    game.api.choose({ version: snapshot.version, command: 'access', index: accessChoices[0].index });
    snapshot = await game.api.advance();
    assert.ok(snapshot.access && !snapshot.access.hidden && snapshot.access.title, 'Selected accessed card must be revealed');
    checkSnapshot(game, snapshot);
    console.log('PASS remote access hides candidates and reveals the selected card');
  } finally { game.close(); }
}

async function breakerChoices() {
  const game = makeGame();
  try {
    game.api.boot({ side: 'runner', seed: 41 });
    vm.runInContext(`
      var testBreaker = AllCards(runner).find(c => c.setNumber === 30005);
      MoveCard(testBreaker, runner.rig.programs); testBreaker.faceUp = true;
      var testIce = InstanceCard(30074);
      testIce.renderer = {sprite:{x:0,y:0,visible:true},destinationPosition:{x:0,y:0},ToggleZoom(){},FaceUp(){},FaceDown(){}};
      testIce.rezzed = true; testIce.cardLocation = corp.HQ.ice; corp.HQ.ice.push(testIce);
      attackedServer = corp.HQ; approachIce = 0; playerTurn = runner;
      ChangePhase(phases.runEncounterIce);
    `, game.context);
    let snapshot = game.api.snapshot();
    const ability = choices(snapshot).find(o => o.command === 'trigger' && /Break up to 2/.test(o.label));
    assert.ok(ability, 'Installed Buzzsaw must offer its break ability against Whitespace');
    game.api.choose({ version: snapshot.version, command: 'trigger', index: ability.index });
    snapshot = await game.api.advance();
    let options = choices(snapshot);
    assert.equal(options.length, 2, 'First nested decision must offer the two unbroken subroutines');
    game.api.choose({ version: snapshot.version, command: options[0].command, index: options[0].index });
    snapshot = await game.api.advance();
    assert.equal(game.context.runner.creditPool, 4, 'Breaking up to two subroutines costs one credit');
    assert.equal(game.context.testIce.subroutines.filter(s => s.broken).length, 1, 'First selected subroutine must break');
    options = choices(snapshot);
    assert.ok(options.some(o => o.label === 'Continue'), 'Human may decline the optional second break');
    const second = options.find(o => /Break another/.test(o.label));
    assert.ok(second, 'Second nested decision must allow another break');
    game.api.choose({ version: snapshot.version, command: second.command, index: second.index });
    snapshot = await game.api.advance();
    assert.equal(game.context.testIce.subroutines.filter(s => s.broken).length, 2, 'Both selected subroutines must be broken');
    assert.equal(game.context.runner.creditPool, 4, 'Second break must not charge another credit');
    checkState(game); checkSnapshot(game, snapshot);
    console.log('PASS nested Buzzsaw decisions, optional second break, and payment');
  } finally { game.close(); }
}

async function carnivoreChoice() {
  const game = makeGame();
  try {
    game.api.boot({ side: 'runner', seed: 43 });
    vm.runInContext(`
      var testCarnivore = AllCards(runner).find(c => c.setNumber === 30003);
      MoveCard(testCarnivore, runner.rig.hardware); testCarnivore.faceUp = true;
      while(runner.grip.length < 5) MoveCard(runner.stack[runner.stack.length - 1], runner.grip);
      var testAsset = AllCards(corp).find(c => c.setNumber === 30037);
      var testServer = NewServer('Remote test', false); corp.remoteServers.push(testServer);
      MoveCard(testAsset, testServer.root);
      attackedServer = testServer; accessingCard = testAsset; playerTurn = runner;
      ChangePhase(phases.runAccessingCard);
    `, game.context);
    let snapshot = await game.api.advance();
    const ability = choices(snapshot).find(o => o.command === 'trigger' && o.card?.number === 30003);
    assert.ok(ability, 'Carnivore must be usable while accessing a trashable card');
    game.api.choose({ version: snapshot.version, command: ability.command, index: ability.index });
    snapshot = await game.api.advance();
    const candidates = choices(snapshot).filter(o => o.multi && o.card);
    assert.equal(candidates.length, 5, 'Carnivore must offer every grip card as a discard candidate');
    assert.ok(candidates.every(o => o.multi.max === 2), 'Carnivore requires two cards');
    const choice = { version: snapshot.version, command: candidates[0].command, index: candidates[0].index };
    const before = canonical(snapshot);
    assert.throws(() => game.api.choose({ ...choice, cards: [candidates[0].card.id, candidates[0].card.id] }), /invalid/i, 'Cannot discard the same card twice');
    assert.throws(() => game.api.choose({ ...choice, cards: [candidates[0].card.id] }), /required/i, 'Cannot pay only half the cost');
    assert.equal(canonical(game.api.snapshot()), before, 'Rejected multiselect cannot change state');
    const discarded = candidates.slice(0, 2).map(o => o.card.id);
    game.api.choose({ ...choice, cards: discarded });
    snapshot = await game.api.advance();
    for (let i = 0; i < 12 && !game.context.corp.archives.cards.includes(game.context.testAsset); i++) {
      const next = pick(snapshot, ['n', 'continue']);
      game.api.choose(next); snapshot = await game.api.advance();
    }
    assert.ok(game.context.corp.archives.cards.includes(game.context.testAsset), 'Carnivore must trash the accessed asset');
    assert.ok(discarded.every(id => game.context.runner.heap.some(c => c.localId === id)), 'Both selected cards must be discarded');
    assert.equal(game.context.testCarnivore.usedThisTurn, true, 'Carnivore must consume its once-per-turn ability');
    checkState(game); checkSnapshot(game, snapshot);
    console.log('PASS Carnivore multiselect validation, payment, and accessed-card trash');
  } finally { game.close(); }
}

async function optionalMultiselect() {
  for (const count of [0, 2]) {
    const game = makeGame();
    try {
      game.api.boot({ side: 'corp', seed: 47 });
      vm.runInContext(`
        var testSerum = InstanceCard(30044);
        for (var i = 0; i < 4; i++) MoveCard(corp.HQ.cards[0], corp.archives.cards);
        testSerum.SharedDecisionCallback({});
      `, game.context);
      const snapshot = game.api.snapshot();
      const options = choices(snapshot);
      const finish = options.find(o => o.multi?.button);
      assert.ok(finish && finish.multi.optional && finish.multi.max === 3, 'Longevity Serum must allow up to three cards');
      const selected = options.filter(o => o.card).slice(0, count).map(o => o.card.id);
      const deckSize = game.context.corp.RnD.cards.length;
      game.api.choose({ version: snapshot.version, command: finish.command, index: finish.index, cards: selected });
      assert.equal(game.context.corp.RnD.cards.length, deckSize + count, 'Only selected Archives cards should return to R&D');
      assert.equal(game.context.corp.archives.cards.length, 4 - count, 'Unselected cards must remain in Archives');
      assert.ok(selected.every(id => game.context.corp.RnD.cards.some(c => c.localId === id)), 'Selected cards should actually be in R&D');
      checkState(game); checkSnapshot(game, game.api.snapshot());
    } finally { game.close(); }
  }
  console.log('PASS optional Longevity Serum multiselect with zero and two cards');
}

async function taoSwap() {
  const game = makeGame();
  try {
    game.api.boot({ side: 'runner', seed: 53 });
    vm.runInContext(`
      var testTao = InstanceCard(30019);
      testTao.renderer = runner.identityCard.renderer; testTao.faceUp = true; runner.identityCard = testTao;
      var firstIce = AllCards(corp).find(c => c.setNumber === 30072);
      var secondIce = AllCards(corp).find(c => c.setNumber === 30073);
      MoveCard(firstIce, corp.HQ.ice); MoveCard(secondIce, corp.RnD.ice);
      DecisionPhase(runner, testTao.SharedEnumerate(), function(params) {
        this.SharedResolve(params.cards);
      }, 'Tāo Salonga', 'Swap two pieces of ice', testTao);
    `, game.context);
    const snapshot = game.api.snapshot();
    const options = choices(snapshot);
    assert.ok(options.some(o => /without swapping/.test(o.label)), 'Tāo must permit declining the swap');
    const ice = options.filter(o => o.card);
    assert.equal(ice.length, 2, 'Both installed ICE should be selectable');
    assert.ok(ice.every(o => o.card.hidden), 'Unrezzed ICE must remain concealed during swap');
    game.api.choose({ version: snapshot.version, command: ice[0].command, index: ice[0].index, cards: ice.map(o => o.card.id) });
    assert.equal(game.context.corp.HQ.ice[0], game.context.secondIce, 'Second ICE should move to first server');
    assert.equal(game.context.corp.RnD.ice[0], game.context.firstIce, 'First ICE should move to second server');
    checkState(game); checkSnapshot(game, game.api.snapshot());
    console.log('PASS Tāo two-card swap, optional decline, and hidden ICE');
  } finally { game.close(); }
}

async function main() {
  await accessPrivacy();
  await breakerChoices();
  await carnivoreChoice();
  await optionalMultiselect();
  await taoSwap();
  const first = await opening('runner', 17);
  assert.deepEqual(await opening('runner', 17), first, 'Same seed and human choices must replay deterministically');
  console.log('PASS deterministic runner opening replay and mulligan');
  await opening('corp', 23);
  console.log('PASS Corp opening and mulligan');
  for (const seed of SEEDS) await faceoff(seed);
}

if (require.main === module) main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
module.exports = { makeGame, checkState, checkSnapshot, choices, opening, faceoff, accessPrivacy, breakerChoices, carnivoreChoice, optionalMultiselect, taoSwap };
