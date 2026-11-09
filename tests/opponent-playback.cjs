'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {makeGame, checkSnapshot} = require('./engine-smoke.cjs');
const plain = value => JSON.parse(JSON.stringify(value));
async function main() {
  const {opponentBeat} = await import('../app/opponent.mjs');
  const beats = [];
  for (const file of ['corp-draw-feedback-replay', 'live-revision-runner-replay']) {
    const replay = require(`./fixtures/${file}.json`), normal = makeGame(), watched = makeGame();
    try {
      normal.api.boot(replay.config); watched.api.boot(replay.config);
      assert.deepEqual(plain(await watched.api.advance()), plain(await normal.api.advance()));
      for (const choice of replay.choices) {
        normal.api.choose(choice); watched.api.choose(choice);
        const expected = await normal.api.advance();
        const actual = await watched.api.advance(300, (before, after) => {
          checkSnapshot(watched, after);
          const beat = opponentBeat(before, after);
          if (beat) {
            assert.notEqual(beat.opponent, replay.config.side);
            assert.equal(beat.state, beat.kind==='encounter' ? before : after);
            assert.ok(!/Remote undefined|undefined|null/.test(beat.caption));
            beats.push(beat);
          }
        });
        assert.deepEqual(plain(actual), plain(expected), `${file}: observations preserve the complete state and decision versions`);
      }
    } finally { normal.close(); watched.close(); }
  }
  for (const kind of ['run','install','draw','break','access','score','credit'])
    assert.ok(beats.some(b => b.kind === kind), `Real replay covers ${kind}`);
  assert.ok(beats.some(b => b.caption.includes('Runner steals Orbital Superiority')));
  assert.ok(beats.filter(b => b.kind === 'run').every(b => b.targets.server));
  assert.ok(beats.filter(b => b.kind === 'draw').every(b => b.targets.zones.length));
  assert.ok(beats.filter(b => b.kind === 'break').every(b => b.targets.cards.length));
  assert.ok(beats.some(b => b.opponent === 'corp'), 'The same flow supports playing as Runner');

  // Exercise the actual worker protocol, including quiet restoration and the
  // final authoritative decision after public observation messages.
  const replay = require('./fixtures/corp-draw-feedback-replay.json');
  const worker = makeGame(), direct = makeGame(), messages = [];
  try {
    worker.context.importScripts = () => {};
    worker.context.postMessage = message => messages.push(plain(message));
    vm.runInContext(fs.readFileSync('engine/worker.js', 'utf8'), worker.context);
    const prefix = replay.choices.slice(0, 4);
    await worker.context.onmessage({data:{type:'start',config:replay.config,replay:prefix}});
    assert.ok(messages.every(m => m.type !== 'opponent-step'), 'Loading never replays old turns automatically');
    direct.api.boot(replay.config); await direct.api.advance();
    for (const choice of prefix) { direct.api.choose(choice); await direct.api.advance(); }
    messages.length = 0;
    direct.api.choose(replay.choices[4]); const expected = await direct.api.advance();
    await worker.context.onmessage({data:{type:'choose',choice:replay.choices[4]}});
    assert.equal(messages[0].type, 'resources');
    const observed = messages.filter(m => m.type === 'opponent-step');
    assert.ok(observed.length > 0, 'Live progression streams public opponent steps');
    assert.equal(messages.at(-1).type, 'state');
    assert.deepEqual(messages.at(-1).state, plain(expected));
    assert.ok(expected.decision || expected.terminal, 'The worker stops at a real human decision');
    for (const message of observed) { checkSnapshot(worker, message.before); checkSnapshot(worker, message.state); }
  } finally { worker.close(); direct.close(); }
  console.log(`Opponent playback: ${beats.length} public action beats, both sides, worker protocol and observed/unobserved replay equivalence pass.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
