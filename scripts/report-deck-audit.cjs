'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'docs/research/deck-audit-2026-11-16');
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n)));
const inv=read('inventory.json'),screen=read('screen-results.json'),baseline=read('baseline-inventory.json'),initial=read('baseline-screen-results.json'),tuning=read('tuning-results.json');
assert.equal(screen.settled,screen.planned);assert(screen.pools.every(p=>p.complete));assert(screen.pools.every(p=>p.engineHash===inv.engineHash));
for(const old of baseline.rows)assert.deepEqual(inv.rows.find(d=>d.id===old.id)?.document,old.document,'Historical deck changed: '+old.id);
assert(inv.rows.every(d=>d.validation.valid));assert(inv.aliases.every(d=>d.valid));assert(inv.archived.every(d=>d.valid));
const pct=n=>(100*n).toFixed(1)+'%',esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function verdict(d){
 if(d.failures.length)return 'Unresolved engine/policy failure: investigate before recommending.';
 if(d.purpose==='interaction')return 'Card-testing snapshot. Use a recommended play deck for a normal game.';
 if(d.id==='weyland-vantage-tools-v2')return 'Revised: opening burst income added; preferred over v1.';
 if(d.id==='editorial-play-v2')return 'Revised: more income and affordable stopping ice; preferred over v1.';
 if(d.id==='restoring-humanity-planogram-v1')return 'Weak in this bot screen; main Restoring Humanity variant is the safer first pick.';
 if(d.pool==='core-v1'&&d.winRate<.25)return 'Official sample with weak bot results. Advanced human review; list preserved.';
 if(d.winRate>.8)return 'Bot-favored in these opponents; human balance is unmeasured.';
 if(d.meanBasicGainShare>.35)return 'Frequent basic income under this policy; inspect economy pacing in human play.';
 if(d.pool==='core-v1')return 'Official sample: construction and runtime pass; advanced/experimental AI.';
 return 'Construction and runtime pass. No large economy warning in this screen.';
}
const decks=screen.decks.map(d=>({...inv.rows.find(i=>i.id===d.id),...d,verdict:verdict(d)}));
fs.writeFileSync(path.join(dir,'per-deck-results.json'),JSON.stringify(decks,null,2)+'\n');
const checks={selectable:inv.rows.length,validSelectable:inv.rows.filter(d=>d.validation.valid).length,validAliases:inv.aliases.length,validArchived:inv.archived.length,unchangedHistoricalDocuments:baseline.rows.length,missingHighResolutionArt:inv.rows.reduce((n,d)=>n+d.missingHighResolutionArt.length,0),planned:screen.planned,statuses:screen.statuses,engineHash:inv.engineHash,policy:inv.policy};
fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify(checks,null,2)+'\n');
for(const p of screen.pools){const source=path.join(root,'tmp/all-decks-final-2026-11-16',p.pool);for(const file of ['matrix.json','matrix-summary.json'])fs.copyFileSync(path.join(source,file),path.join(dir,p.pool+'-'+file));}
const errors={};for(const f of initial.failures){const message=(f.error||'Unknown').split('\n')[0].replace(/^No cached path \.alt\?.*/, 'No cached run-path alternative');errors[message]=(errors[message]||0)+1;}
const totals=tuning.totals,rate=id=>totals[id].gain/totals[id].actions;
const table=decks.map(d=>`| ${d.poolLabel} | ${d.name.replace(/\|/g,'/')} | ${d.purpose==='play'?'Play':'Test pilot'} | ${d.size} | ${d.validation.totals.influence}/${d.validation.totals.influenceLimit} | ${d.completed} | ${pct(d.winRate)} | ${pct(d.meanBasicGainShare)} | ${d.verdict} |`).join('\n');
const pools=screen.pools.map(p=>{const rows=decks.filter(d=>d.pool===p.pool);return {pool:p.pool,decks:rows.length,pairings:p.pairings,games:rows.filter(d=>d.side==='corp').reduce((n,d)=>n+d.games,0)};});
const md=`# Bundled deck audit · 16 November 2026

All **${inv.rows.length} selectable decks** pass the local construction validator, with no missing full-resolution artwork. The final **${screen.planned}-game screen** finished with **${screen.statuses.completed||0} completed, ${screen.failures.length} failures**. Two Vantage Corp lists received new funded revisions. The originals remain exact, in the card-testing group.

This is an implementation and playability screen, not a claim that every list is equally strong or enjoyable. Automated agents can mishandle an otherwise good deck. Six games per pairing are enough to expose some failures, not to rank close matchups.

## Coverage and method

${pools.map(p=>`- ${p.pool}: ${p.decks} decks, ${p.pairings} Runner/Corp pairings, ${p.games} games.`).join('\n')}

Every within-pool pairing used six deterministic seeds, pressure-v1, four workers, a 60-second per-game limit and a 30,000-decision limit. Full traces and a frozen runtime are retained under ignored tmp/all-decks-final-2026-11-16/. Portable matrix specifications, final summaries and per-deck aggregates sit beside this report. Different card pools were not mixed.

Construction checks cover minimum size, side/faction restrictions, influence, copy limits, card availability and Corp agenda totals. Two aliases and five archived save IDs also pass: **65 resolvable IDs total**. All 56 pre-audit deck documents are unchanged; only two new IDs were added. This validator describes the local card pool, not current Standard/Startup tournament legality.

The 1,578-game initial screen produced 79 failed jobs (exceptions or native AI diagnostics), not 79 malformed decks. The failures were investigated using their frozen traces. The expanded final screen uses the same six-seed experiment with the two additional lists and the fixes below. Because opponents and engine behavior changed, raw before/after wins are not a controlled deck-quality comparison.

## What changed

- Fixed missing next-turn click allotment for Aggressive Trendsetting.
- Fixed LEO trashing approached ice while Shred prevents ending the run: the vacated position survives until movement, then the next inner ice receives its approach window. The table explains the removed position. This follows [NSG Comprehensive Rules 6.2.4 and 6.2.7a](https://rules.nullsignal.games/).
- Fixed Scrounge when its event payment makes every heap program unaffordable; the optional recycle step can still finish.
- Sequenced Transfer of Wealth's tag response before Corp loss/Runner gain in the audited pressure policy. Legacy native replay behavior remains available.
- Made expansion AI respect constrained install destinations, legal rez opportunities, Semak-samun's fracter restriction, changed breaker choices, subroutine targets and optional multi-break completion. These bridges select offered legal options; they do not suppress diagnostics globally.

Initial failure groups:

${Object.entries(errors).map(([e,n])=>`- ${n}: ${e}`).join('\n')}

## Two targeted deck revisions

**Built to Last · defensive economy (weyland-vantage-tools-v2):** replace one Government Subsidy, one Malapert Data Vault and one Esca with three Hedge Funds. It remains 40 cards / 18 agenda points and uses 14/15 influence. Cards classified as economy with printed cost no greater than the opening five credits rise from 2 to 5. Exact probability of seeing none in the initial five drops from 76.3% to 49.3%, ignoring mulligans, identity effects and extra draws. This measures affordability, not a guaranteed payout.

**Editorial · funded defenses (editorial-play-v2):** replace three Scapegoats and three Flood the Markets with three Palisades and three Hansei Reviews. It remains 45 cards / 20 agenda points and uses 15/15 influence. Classified economy rises from 9 to 12 copies; low-cost ice with printed end-the-run text rises from 3 to 6.

A separate paired experiment tested each original and revision against four recommended Runners over 16 held-out seeds: **256 games, all completed**. The share of Corp action-phase decisions spent taking a basic credit fell:

| Deck | Original | Revised | Corp wins, original → revised |
|---|---:|---:|---:|
| Built to Last | ${pct(rate('weyland-vantage-tools-v1'))} | ${pct(rate('weyland-vantage-tools-v1-candidate'))} | 31/64 → 34/64 |
| Editorial | ${pct(rate('editorial-play-v1'))} | ${pct(rate('editorial-play-v1-candidate'))} | 14/64 → 22/64 |

This denominator includes action-phase passes, so it is not literally a percentage of clicks. The reduction in basic-credit decisions is the main evidence for smoother funding; these samples do not establish competitive balance or a statistically reliable win-rate improvement. The tuning experiment has its own frozen engine revision, recorded in tuning-results.json.

## Decks to approach cautiously

The Vantage lobby has **9 recommended play lists and 13 interaction snapshots**. The latter intentionally exercise unusual cards and are not normal-game recommendations. For example, Vic's full interaction list lacks a dedicated decoder and has a stealth ability without a Stealth credit source; Hiram's full interaction list lacks a dedicated fracter. Loup's full interaction list also lacks a source for its stealth-specific ability. Méliès' full interaction list has only three explicitly classified economy cards. Their improved play variants remain in the recommended group.

Gateway's Planogram-only Jinteki variant is legal but notably weaker under this bot policy; the main Restoring Humanity list is a safer first choice. Low bot wins for official Core samples such as LEO Agency are a reason to review AI strategy and explain the deck, not silently rewrite an official snapshot. Taxing, damage and identity-driven defenses need more analysis than counting cheap end-the-run ice.

## Browser and regression checks

Three actual shared-browser games were completed by clicking rendered UI controls and reading public state. No headless Chrome, private-state strategy input or engine action injection was used. The test driver is a heuristic functional tester, not an independent human critic.

- Weyland tools v1 as Corp vs Tāo: Corp won 8–6 in round 14; 67 recorded native decisions. Its opening affordability problem motivated the revision.
- Vic vs revised Editorial: Runner won 8–0 in round 15; 332 native decisions. Income, installs, runs, payments and completion worked. The driver initially repeated empty Archives runs; that was corrected as test-driver strategy, not attributed to the deck.
- LEO Agency as Corp vs Phoenix: Runner won 7–0 in round 3; 12 native decisions. The Corp driver exposed agendas before banking rez money. This short smoke test verifies UI completion, not the exact LEO/Shred timing or human deck strength.

All three browser decision streams reconstruct their exact terminal, points and version in the current offline engine. tests/deck-audit-browser.cjs retains them as regression checks. The full npm run check:dev suite passed; the added three-game browser replay regression passed separately. The 17-case pre-optimization parity corpus retains all 16,884 original decisions. Focused rules fixtures cover the precise LEO/Shred, Scrounge, click-bonus, Transfer and Semak cases. Shared-browser screenshots were unavailable, so this pass does not claim visual/accessibility certification.

## Per-deck screen

AI win rates below are descriptive for this fixed policy and opponent set. Test pilots can distort the all-opponent figures; per-deck-results.json also separates outcomes against recommended play decks. Basic-credit figures are the mean per-game action-phase decision share, unlike the pooled shares in the controlled tuning table.

| Pool | Deck | Group | Cards | Influence | Games | AI wins | Basic credit | Assessment |
|---|---|---|---:|---:|---:|---:|---:|---|
${table}

## Reproduction

Run node scripts/audit-all-decks.cjs to validate and prepare matrix specs. Run node scripts/netrunner.cjs bench <pool-matrix.json> --out <fresh-directory> for each matrix. Set NR_DECK_AUDIT_RUNS to that directory's parent and run node scripts/audit-all-decks.cjs --summarize; then node scripts/report-deck-audit.cjs creates this report. The reporting script expects this dated audit's original baseline/tuning artifacts and final run directory; it asserts every matrix is finished, hashes match, and historical deck documents remain exact. Use fresh output directories after engine changes; original job replays require their frozen runtime.

Final engine fingerprint: ${inv.engineHash}. No public release or publish was performed.
`;
fs.writeFileSync(path.join(dir,'report.md'),md);
const comparison=[['Built to Last','weyland-vantage-tools-v1','weyland-vantage-tools-v1-candidate'],['Editorial','editorial-play-v1','editorial-play-v1-candidate']];
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
*{box-sizing:border-box}body{margin:0;font-family:var(--font-sans,system-ui);color:var(--foreground,#dedfe4)}p{line-height:1.5}.muted,small{color:var(--muted-foreground,#939aa5)}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.stat{background:var(--card,#151a22);border:1px solid var(--border,#343b45);border-radius:var(--radius,12px);padding:16px}.stat strong{display:block;font-size:28px}.section{margin-top:25px}h2{font-size:17px;margin:0 0 12px}.chart{height:210px}.row{margin:15px 0}.bars{display:grid;grid-template-columns:76px 1fr 48px;align-items:center;gap:8px;font-size:12px;margin-top:5px}.track{height:15px;background:var(--secondary,#252b35);border-radius:3px}.bar{height:100%;border-radius:3px;background:var(--chart-1,#538fe8)}.after{background:var(--chart-2,#2fbd9a)}.controls{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}select,input{font:inherit;padding:8px;border:1px solid var(--border,#343b45);border-radius:7px;background:var(--card,#151a22);color:inherit;min-width:0}.list{max-height:480px;overflow:auto}.deck{padding:12px 0;border-top:1px solid var(--border,#343b45)}.deck strong{font-size:14px}.meta{font-size:12px;margin:5px 0}.deck p{font-size:13px;margin:4px 0}.pill{color:var(--success,#65c9a8)}@media(max-width:440px){.stats{gap:5px}.stat{padding:10px}.stat strong{font-size:23px}.controls>*{flex:1 0 100%;width:100%}}
</style></head><body>
<div class="stats"><div class="stat"><strong>${inv.rows.length}/${inv.rows.length}</strong><small>Legal local lists</small></div><div class="stat"><strong>${screen.statuses.completed}</strong><small>Final games completed</small></div><div class="stat"><strong>${screen.failures.length}</strong><small>Final errors / timeouts</small></div></div>
<section class="section"><h2>Less time taking basic credits</h2><p class="muted">Controlled 256-game comparison · Corp action-phase decision share</p><div class="chart">${comparison.map(([name,b,a])=>`<div class="row"><strong>${name}</strong>${[[b,'Original',''],[a,'Revised','after']].map(([id,label,cls])=>`<div class="bars"><span>${label}</span><div class="track"><div class="bar ${cls}" style="width:${rate(id)*200}%"></div></div><span>${pct(rate(id))}</span></div>`).join('')}</div>`).join('')}<small>Bars share a 0–50% scale. This measures bot decisions, not human enjoyment or competitive strength.</small></div></section>
<section class="section"><h2>Inspect every deck</h2><div class="controls"><select id="pool" aria-label="Card pool"><option value="">All card pools</option>${pools.map(p=>`<option>${p.pool}</option>`).join('')}</select><select id="purpose" aria-label="Deck group"><option value="play">Recommended play decks</option><option value="interaction">Card-testing snapshots</option><option value="">All groups</option></select><input id="search" placeholder="Find a deck or identity" aria-label="Find a deck or identity"></div><p id="count" class="muted"></p><div id="list" class="list"></div></section><p class="muted"><small>Six seeds per within-pool matchup. All 56 previous documents are preserved. Browser-tested three games and reconstructed their exact results; broad human balance remains unmeasured.</small></p>
<script>const decks=${JSON.stringify(decks).replace(/</g,'\\u003c')};const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function draw(){const p=document.getElementById('pool').value,g=document.getElementById('purpose').value,q=document.getElementById('search').value.toLowerCase();const rows=decks.filter(d=>(!p||d.pool===p)&&(!g||d.purpose===g)&&(d.name+' '+d.identity).toLowerCase().includes(q));document.getElementById('count').textContent=rows.length+' decks';document.getElementById('list').innerHTML=rows.map(d=>'<article class="deck"><strong>'+escape(d.name)+'</strong><div class="meta">'+escape(d.identity)+' · '+d.side+' · '+d.size+' cards · '+d.validation.totals.influence+'/'+d.validation.totals.influenceLimit+' influence · <span class="pill">Valid</span></div><div class="meta">'+d.completed+' games · '+(100*d.winRate).toFixed(1)+'% bot wins · '+(100*d.meanBasicGainShare).toFixed(1)+'% basic credit · '+d.longGames+' games over 30 rounds</div><p>'+escape(d.verdict)+'</p></article>').join('');}for(const id of ['pool','purpose','search'])document.getElementById(id).addEventListener('input',draw);draw();</script></body></html>`;
fs.writeFileSync(path.join(dir,'dashboard.html'),html);
console.log(JSON.stringify({...checks,pools},null,2));
