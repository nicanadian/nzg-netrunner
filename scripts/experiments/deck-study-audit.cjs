'use strict';
// Observational replay of the first six held-out seeds per version. Does not
// replace benchmark outcomes; requires every native decision to match exactly.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {readPair} = require('./deck-study.cjs');
const root = path.resolve(process.argv[2] || 'tmp/deck-experiment-1/economy');
const {createGame} = require(path.join(root, 'runtime/engine/runtime.cjs'));
const {validateState} = require(path.join(root, 'runtime/engine/state-check.cjs'));
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

async function replay(manifest, original) {
  const game = createGame(), logs = [], trace = [];
  try {
    const nativeLog = game.context.Log;
    game.context.Log = function(message) {
      logs.push({turn: game.api.summary().turn, text: String(message)});
      return nativeLog.apply(this, arguments);
    };
    game.api.boot({side:'runner', faceoff:true, simulationFast:true,
      seed:original.seed, rulesVersion:manifest.rulesVersion,
      deckDocuments:{runner:manifest.runner, corp:manifest.corp}});
    let state;
    while (game.api.metrics().steps < manifest.limits.decisions) {
      state = await game.api.advance(Math.min(300, manifest.limits.decisions-game.api.metrics().steps), null, true, choice=>trace.push(choice));
      validateState(game);
      if (state.terminal) break;
      if (!game.api.needsAdvance()) throw Error('Unexpected human decision');
    }
    assert.equal(hash(trace), hash(original.trace), 'Observer changed decision trace');
    assert.deepEqual(JSON.parse(JSON.stringify(state.terminal)), original.terminal);
    assert.deepEqual(game.errors, []);
    const relevant = logs.filter(l=>/Telework Contract|Wildcat Strike|Mayfly/.test(l.text));
    return {index:original.index, seed:original.seed, winner:state.terminal.winner,
      traceHash:hash(trace), decisions:trace.length, traceMatches:true,
      packageLog:relevant, log:logs};
  } finally { game.close(); }
}
(async()=>{
  const matrix=JSON.parse(fs.readFileSync(path.join(root,'matrix.json'))), versions=[];
  for(let i=0;i<matrix.runners.length;i++){
    const {manifest,jobs}=readPair(root,`matchup-${i}-0`), games=[];
    for(const job of jobs.slice(0,6)) games.push(await replay(manifest,job));
    versions.push({label:matrix.runners[i].label,games});
    console.log(matrix.runners[i].label+': 6 replay traces matched');
  }
  fs.writeFileSync(path.join(root,'sample-replays.json'),JSON.stringify({selection:'First six held-out seed indices, all three versions',versions},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
