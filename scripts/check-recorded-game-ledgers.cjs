'use strict';
// Checks the annotated observations, not a simulation of the original shuffles.
// Explicitly reported source anomalies are retained; all other underflows fail.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'eval/recorded-games');
const cards = require('../assets/card-data.json');
const summaries = [];
const files = fs.readdirSync(DIR).filter(f => /^(neon-starter|lt-starter|lt-booster)\.json$/.test(f)).sort();
assert.equal(files.length, 3);
for (const file of files) {
  const g = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  const state = { ...g.initialState }, counters = {}, ids = new Set(), anomalies = [];
  const knownIssues = new Set(g.issues.map(x => x.id));
  let events = 0, actions = 0, tags = 0;
  for (const [side, deck] of Object.entries(g.decks)) {
    assert.equal(Object.values(deck.cards).reduce((a, b) => a + b, 0), deck.size);
    for (const [n, count] of Object.entries(deck.cards)) {
      assert.ok(cards[n], `Unknown card ${n}`);
      assert.equal(cards[n].side_code, side);
      assert.ok(Number.isInteger(count) && count > 0 && count <= 3);
      assert.equal(cards[n].pack_code, 'sg');
    }
  }
  for (const [index, t] of g.turns.entries()) {
    assert.equal(t.side, index % 2 ? 'runner' : 'corp');
    assert.equal(t.round, Math.floor(index / 2) + 1);
    let clicks = 0;
    t.derivedStart = { ...state };
    for (const x of t.events) {
      events++;
      assert.ok(!ids.has(x.id), `Duplicate ${x.id}`); ids.add(x.id);
      assert.match(x.time, /^\d{2}:\d{2}$/);
      assert.ok(Number.isInteger(x.clicks) && x.clicks >= 0);
      if (x.clicks && x.kind !== 'gap') actions++;
      clicks += x.clicks;
      if (x.issue) assert.ok(knownIssues.has(x.issue), `Unknown issue ${x.issue}`);
      for (const c of x.cards || []) assert.equal(c.title, cards[c.number].title);
      for (const [key, value] of Object.entries(x.delta)) {
        assert.ok(Object.hasOwn(state, key));
        assert.ok(Number.isInteger(value));
        state[key] += value;
        assert.ok(state[key] >= 0, `${x.id}: ${key} underflow ${state[key]}`);
      }
      for (const c of x.counters || []) {
        const key = `${c.instance}/${c.counter}`;
        counters[key] = (counters[key] || 0) + c.delta;
        if (counters[key] < 0) {
          assert.equal(x.issue, 'lt-starter-red-team', `${x.id}: unlabelled counter underflow ${key}`);
          anomalies.push({ event: x.id, issue: x.issue, counter: key, observedBalanceAgainstCurrentText: counters[key] });
        }
      }
      tags += x.tagDelta || 0;
      assert.ok(tags >= 0, `${x.id}: negative tags`);
      if (x.damage?.gripBefore !== undefined && x.damage.amount > x.damage.gripBefore) {
        assert.equal(g.result.reason, 'flatline');
      }
    }
    const budget = t.side === 'corp' ? 3 : 4;
    const terminalTurn = index === g.turns.length - 1;
    assert.ok(clicks <= budget, `${g.id}/${t.id}: ${clicks} clicks exceeds ${budget}`);
    if (!terminalTurn) assert.equal(clicks, budget, `${g.id}/${t.id}: unaccounted clicks`);
    t.derivedEnd = { ...state };
    t.derivedClicks = clicks;
    // Source log checkpoints are independent of our arithmetic, populated below.
    if (t.observedEndCredits !== undefined) assert.equal(state[t.side + 'Credits'], t.observedEndCredits, `${g.id}/${t.id}: source credit checkpoint`);
  }
  assert.equal(state.corpPoints, g.result.corpPoints);
  assert.equal(state.runnerPoints, g.result.runnerPoints);
  assert.equal(g.reproduction.executableFullGame, !!g.reproduction.verifiedNormalizedFullGame);
  assert.equal(g.reproduction.exactSourceGameExecutable, false);
  assert.equal(g.reproduction.originalShuffleRecovered, false);
  if (g.id === 'lt-starter') assert.equal(anomalies.length, 1, 'Fifth Red Team payout must remain flagged');
  else assert.equal(anomalies.length, 0);
  summaries.push({ id: g.id, sideTurns: g.turns.length, events, actionEntries: actions,
    sourceCreditCheckpoints: g.turns.filter(t => t.observedEndCredits !== undefined).length,
    final: state, counterAnomalies: anomalies, unresolvedIssues: g.issues.filter(x => ['gap', 'uncertainty', 'reproduction blocker', 'source anomaly'].includes(x.severity)).map(x => x.id) });
  if (process.argv.includes('--render')) {
    const timeUrl = time => `${g.source.url}&t=${time.split(':').reduce((m, x) => m * 60 + Number(x), 0)}s`;
    const md = [`# ${g.title}`, '', `[Source recording](${g.source.url}). Reviewed ${g.source.reviewedOn}.`, '',
      `${g.format}. Result: **${g.result.winner} wins, Corp ${g.result.corpPoints}–Runner ${g.result.runnerPoints}**.`, '',
      g.reproduction.verifiedNormalizedFullGame
        ? `**Status:** source observation ledger with explicit gaps. A [verified, normalized full-game reconstruction](../../../eval/recorded-games/${g.id}-full-replay.json) is available; see the [end-to-end audit](end-to-end-audit.md) for corrections and chosen hidden information. The original shuffle remains unknown.`
        : '**Status:** annotated public-action ledger; not an executable full-game replay. Original shuffle is unknown. Unidentified cards are deliberately left unknown.', '',
      `${g.source.timestampPrecision} Credit columns below are reconstructed pool credits after each side-turn, including opponent payments during that turn; hosted/run credits are recorded separately in the JSON.`, '',
      `[Machine-readable ledger](../../../eval/recorded-games/${g.id}.json).`, '', '## Reconstruction issues', ''];
    for (const i of g.issues) md.push(`- **${i.id}** (${i.severity}; ${i.turns.join(', ')}): ${i.text}`);
    md.push('', '## Turn ledger', '');
    for (const t of g.turns) {
      md.push(`### ${t.id} · [${t.sourceStart}](${timeUrl(t.sourceStart)})–${t.sourceEnd}`, '',
        `Pool after this side-turn: **Corp ${t.derivedEnd.corpCredits}, Runner ${t.derivedEnd.runnerCredits}**. Agenda points: Corp ${t.derivedEnd.corpPoints}, Runner ${t.derivedEnd.runnerPoints}. Clicks accounted for: ${t.derivedClicks}.${t.observedEndCredits !== undefined ? ` Source log credit checkpoint: ${t.observedEndCredits}.` : ''}${t.observedEndHandSize !== undefined ? ` Source log hand size: ${t.observedEndHandSize}.` : ''}`, '',
        '| Video anchor | Clicks | Action and result |', '|---|---:|---|');
      for (const x of t.events) {
        const refs = x.issue ? ` **[${x.issue}]**` : '';
        md.push(`| [${x.time}](${timeUrl(x.time)}) | ${x.clicks || '—'} | ${x.text.replaceAll('|', '\\|')}${refs} |`);
      }
      md.push('');
    }
    fs.writeFileSync(path.join(ROOT, `docs/research/gateway-ledgers/${g.id}.md`), md.join('\n') + '\n');
  }
}
if (process.argv.includes('--render')) fs.writeFileSync(path.join(DIR, 'validation.json'), JSON.stringify({ checkedOn: '2026-11-06', method: 'Semantic ledger accounting: click budgets, nonnegative pool credits, source credit checkpoints, counter accounting, deck card counts and terminal points. Does not execute the game engine or verify every source annotation independently.', games: summaries }, null, 2) + '\n');
for (const s of summaries) console.log(`PASS ${s.id}: ${s.sideTurns} side-turns, ${s.events} events, ${s.sourceCreditCheckpoints} source credit checkpoints, ${s.counterAnomalies.length} explicitly retained counter anomaly`);
