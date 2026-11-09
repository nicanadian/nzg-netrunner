#!/usr/bin/env node
'use strict';
// Analyze the two actual browser games; replay reconstructs public option metadata only.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { makeGame } = require('../tests/engine-smoke.cjs');
const dir = path.resolve(__dirname, '../eval/click-audit');

async function analyze(side) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, `${side}.json`), 'utf8'));
  const game = makeGame();
  const snapshots = new Map();
  try {
    game.api.boot(data.session.config);
    let state = await game.api.advance();
    snapshots.set(state.version, state);
    for (const choice of data.session.choices) {
      game.api.choose(choice);
      state = await game.api.advance();
      snapshots.set(state.version, state);
    }
    assert.equal(state.terminal?.winner, data.final.terminal.winner);
    assert.equal(state.corp.points, data.final.corp.points);
    assert.equal(state.runner.points, data.final.runner.points);
    assert.equal(game.api.metrics().diagnostics.length, 0);
  } finally { game.close(); }
  const events = data.audit.events.map(e => {
    const snapshot = snapshots.get(e.before?.version);
    const commands = snapshot?.decision?.commands || [];
    const d = e.data || {};
    const command = commands.find(c => c.command === d.command);
    let category = 'Game action / choice';
    if (!e.before || /Mulligan/.test(e.before.phaseId)) category = 'Setup / opening hand';
    else if (side === 'corp' && [46, 47].includes(e.n)) category = 'Deliberate recovery probe';
    else if (d.command === 'n' && e.before.pendingInstall) category = 'Extra install confirmation';
    else if (d.command === 'n') category = 'Pass / advance';
    else if ('opponentPause' in d) category = 'Playback resume';
    else if ('planReview' in d) category = 'Break-plan review';
    else if ('card' in d || 'inspectTool' in d || 'close' in d || ('group' in d && command?.options.length > 1)) category = 'Navigation / reading';
    const boostOnlyPass = d.command === 'n' && !e.before?.run && commands.some(c => c.command === 'trigger') && commands.every(c => c.command === 'n' || (c.command === 'trigger' && c.options.every(o => o.abilityKind === 'boost')));
    const singleEffect = d.command === 'trigger' && commands.length === 1 && commands[0].options.length === 1;
    return { ...e, category, boostOnlyPass, singleEffect, offered: commands.map(c => ({command:c.command, count:c.options.length, options:c.options.map(o=>({label:o.label, abilityKind:o.abilityKind, cardId:o.card?.id}))})) };
  });
  const counts = {};
  for (const e of events) counts[e.category] = (counts[e.category] || 0) + 1;
  const result = { side, total:events.length, counts, boostOnlyPasses:events.filter(e=>e.boostOnlyPass).map(e=>e.n), singleEffectAcknowledgements:events.filter(e=>e.singleEffect).map(e=>e.n), turns:data.final.turn, points:[data.final.corp.points,data.final.runner.points], terminal:data.final.terminal, sessionChoices:data.session.choices.length, events };
  fs.writeFileSync(path.join(dir, `${side}-analysis.json`), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({...result,events:undefined},null,2));
  console.log('Passes:', events.filter(e=>e.category==='Pass / advance').map(e=>`${e.n}: ${e.before.phaseId} [${e.offered.map(c=>c.command+':'+c.count).join(', ')}]`).join('\n'));
}
(async()=>{ await analyze('corp'); await analyze('runner'); })().catch(error=>{console.error(error);process.exitCode=1;});
