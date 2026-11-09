'use strict';
// Real exported extension playthroughs cover strategic and nested human decisions.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { makeGame, checkState, checkSnapshot } = require('./engine-smoke.cjs');
const cases = [
  { file: 'visual-chrome-corp-replay.json', decisions: 83, winner: 'runner', corp: 6, runner: 8 },
  { file: 'tactics-chrome-replay.json', decisions: 69, winner: 'corp', corp: 8, runner: 3 },
];
(async () => {
  for (const expected of cases) {
    const replay = JSON.parse(fs.readFileSync(`${__dirname}/fixtures/${expected.file}`, 'utf8'));
    const game = makeGame();
    try {
      game.api.boot(replay.config);
      await game.api.advance();
      for (const choice of replay.choices) {
        game.api.choose(choice);
        const state = await game.api.advance();
        checkState(game);
        checkSnapshot(game, state);
      }
      const state = game.api.snapshot();
      assert.equal(replay.choices.length, expected.decisions);
      assert.equal(state.terminal?.winner, expected.winner);
      assert.equal(state.corp.points, expected.corp);
      assert.equal(state.runner.points, expected.runner);
      assert.equal(state.decision, null);
      assert.equal(game.api.metrics().diagnostics.length, 0);
      console.log(`PASS extension ${expected.file}: ${expected.decisions} decisions, ${state.steps} engine actions, Corp ${state.corp.points}–Runner ${state.runner.points}`);
    } finally { game.close(); }
  }
  // This historical match contains choices recorded after the old Luminal
  // bug skipped three clicks. Preserve the original evidence and replay its
  // entire valid prefix; later choices belong to a different board position.
  const legacy=require('./fixtures/interaction-chrome-replay.json'),legacyGame=makeGame();
  try {
    legacyGame.api.boot(legacy.config);await legacyGame.api.advance();
    for(const choice of legacy.choices.slice(0,90)){
      legacyGame.api.choose(choice);const state=await legacyGame.api.advance();
      checkState(legacyGame);checkSnapshot(legacyGame,state);
    }
    const state=legacyGame.api.snapshot();
    const bonus=state.history.findLastIndex(e=>e.text==='Corp gained 3 clicks');
    assert.ok(bonus>=0);
    assert.equal(state.history.slice(bonus+1).filter(e=>e.turn===19 && e.text==='Corp spent one click').length,3);
    assert.equal(state.corp.clicks,0);
    assert.notEqual(state.version,legacy.choices[90].version);
    const before=JSON.stringify(state);
    assert.throws(()=>legacyGame.api.choose(legacy.choices[90]),/already passed/);
    assert.equal(JSON.stringify(legacyGame.api.snapshot()),before,'Old choices cannot be silently applied to the corrected position');
    console.log('PASS historical interaction Chrome replay: 90 valid decisions; corrected Luminal spends all bonus clicks; obsolete suffix rejected unchanged');
  }finally{legacyGame.close();}
  // Short live regression on the reference-design revision, exported through Chrome.
  const live = JSON.parse(fs.readFileSync(`${__dirname}/fixtures/live-revision-runner-replay.json`, 'utf8'));
  const liveGame = makeGame();
  try {
    liveGame.api.boot(live.config);
    await liveGame.api.advance();
    for (const choice of live.choices) {
      liveGame.api.choose(choice);
      const position = await liveGame.api.advance();
      checkState(liveGame); checkSnapshot(liveGame, position);
    }
    const position = liveGame.api.snapshot();
    assert.equal(live.choices.length, 15);
    assert.equal(position.runner.points, 2);
    assert.equal(position.runner.credits, 13);
    assert.equal(position.runner.clicks, 1);
    assert.ok(position.runner.rig.programs.some(card => card.number === 30008));
    assert.ok(position.runner.rig.resources.some(card => card.number === 30033));
    assert.equal(liveGame.api.metrics().diagnostics.length, 0);
    console.log('PASS live revised Chrome table: 15 decisions, Tithe damage, multi-access, agenda theft, program/resource install');
  } finally { liveGame.close(); }
  const replay = JSON.parse(fs.readFileSync(`${__dirname}/fixtures/hosted-chrome-checkpoint.json`, 'utf8'));
  const game = makeGame();
  try {
    game.api.boot(replay.config);
    await game.api.advance();
    for (const choice of replay.choices) {
      game.api.choose(choice);
      const state = await game.api.advance();
      checkState(game); checkSnapshot(game, state);
    }
    const state = game.api.snapshot();
    const host = state.corp.servers.find(server => server.name === 'HQ').ice.find(card => card.hosted?.some(child => child.number === 30004));
    const botulus = host?.hosted.find(card => card.number === 30004);
    assert.equal(replay.choices.length, 21);
    assert.equal(state.terminal, null);
    assert.equal(state.run?.server, 'HQ');
    assert.ok(botulus && !botulus.hidden);
    assert.equal(botulus.counters.virus || 0, 0);
    assert.equal(host.subroutines.filter(sub => sub.broken).length, 1);
    assert.equal(state.runner.credits, 2);
    assert.equal(state.runner.clicks, 2);
    assert.equal(game.api.metrics().diagnostics.length, 0);
    console.log('PASS exported Chrome hosted-program encounter: 21 decisions, counter spent and subroutine broken');
  } finally { game.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
