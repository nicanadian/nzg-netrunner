'use strict';
const fs=require('node:fs'), path=require('node:path');
const base=path.resolve('eval/deck-experiments/experiment-1');
const read=name=>JSON.parse(fs.readFileSync(path.join(base,name+'.json')));
const panel=read('panel-analysis'), study=read('economy-analysis'), design=read('design');
if([...panel.cells,...study.variants].some(c=>c.completed!==c.scheduled||Object.keys(c.statuses).some(s=>s!=='completed')))throw Error('Report requires all scheduled games to have completed cleanly.');
const audit=JSON.parse(fs.readFileSync('tmp/deck-experiment-1/economy/sample-replays.json'));
if(audit.versions.length!==3||audit.versions.some(v=>v.games.length!==6||v.games.some(g=>!g.traceMatches)))throw Error('Diagnostic replay sample is incomplete.');
const {readPair}=require('./deck-study.cjs'),crypto=require('node:crypto');
const evidence={engineHash:design.engineHash,phases:[]};
for(const [phase,analysis]of [['panel',panel.cells],['economy',study.variants]]){
  const root=path.resolve('tmp/deck-experiment-1',phase),pairs=[];
  for(const cell of analysis){
    const {manifest,jobs}=readPair(root,cell.directory);
    pairs.push({directory:cell.directory,manifest,games:jobs.map(j=>({index:j.index,seed:j.seed,status:j.status,terminal:j.terminal,points:j.points,turn:j.turn,decisions:j.decisions,elapsedMs:j.elapsedMs,traceHash:crypto.createHash('sha256').update(JSON.stringify(j.trace)).digest('hex')}))});
  }
  evidence.phases.push({phase,pairs});
}
fs.writeFileSync(path.join(base,'game-results.json'),JSON.stringify(evidence,null,2)+'\n');
fs.writeFileSync(path.join(base,'sample-replays.json'),JSON.stringify({...audit,versions:audit.versions.map(v=>({...v,games:v.games.map(({log,...g})=>g)}))},null,2)+'\n');
const pct=n=>(100*n).toFixed(1)+'%', pp=n=>(n>=0?'+':'')+(100*n).toFixed(1)+' pp';
const range=(a,f=pct)=>a.map(f).join(' to ');
const lines=[
'# Deck experiment 1: matchups and two-card package changes',
'',
`Completed on ${new Date().toISOString()}. All 1,050 scheduled games completed, with no engine errors, timeouts or decision-limit stops. This is an exploratory experiment using fixed native AI policies and Gateway cards.`,
'',
'## Matchup screen',
'',
'50 games per cell. Values are Runner wins; the exact complete deck lists, rather than identities alone, are being compared.',
'',
'| Runner | Precision Design | Restoring Humanity | Built to Last |',
'|---|---:|---:|---:|',
...[0,1,2].map(r=>'| '+panel.cells.find(c=>c.r===r).runner+' | '+panel.cells.filter(c=>c.r===r).map(c=>`${c.runnerWins}/50 (${pct(c.runnerWinRate)})`).join(' | ')+' |'),
'',
'Precision Design produced the lowest observed Runner win rate for each of the three lists. Each cell has a wide confidence interval (roughly ±13 percentage points); this screen does not establish an overall ranking. Tāo–Precision Design was selected by the predeclared closest-to-50% rule (24–26), not by inspecting follow-up results.',
'',
'## Held-out package comparison',
'',
'200 games per version against the same Precision Design deck, with a new seed prefix. All lists are legal 40-card decks. Original: 3 Telework Contracts. Each alternative removes two Telework Contracts, leaving one, and inserts two cards: Wildcat Strike (burst income) or Mayfly (an AI icebreaker). Other 38 cards are unchanged. Influence: original 12/15, Wildcat 14/15, Mayfly 12/15.',
'',
'| Tāo version | Runner wins | Wilson 95% interval | Median round reached | Basic +1-credit actions / reached Runner turn |',
'|---|---:|---:|---:|---:|',
...study.variants.map(v=>`| ${v.label} | ${v.runnerWins}/200 (${pct(v.runnerWinRate)}) | ${range(v.wilson95)} | ${v.medianRoundReached} | ${v.basicRunnerCreditClicksPerTurn.toFixed(3)} |`),
'',
'| Paired change vs original | Win-rate difference | Paired bootstrap 97.5% interval | Alt-only / original-only wins | Holm-adjusted exact McNemar p |',
'|---|---:|---:|---:|---:|',
...study.contrasts.map(c=>`| ${c.label} | ${pp(c.delta)} | ${range(c.bootstrapInterval,pp)} | ${c.alternativeOnlyWins} / ${c.originalOnlyWins} | ${c.holmAdjustedP.toFixed(4)} |`),
'',
'Neither alternative shows a reliable win-rate improvement: both paired intervals span zero and both Holm-adjusted p-values equal 1. This does not establish equivalence; the intervals still allow meaningful benefits or harms. Keep the original list as the reference while testing the alternatives against more opponents or with human players.',
'',
'These intervals resample the 200 seed pairs (10,000 replicates); the 97.5% level accounts for two planned comparisons with a Bonferroni 95% family-wise target. Bootstrap coverage is approximate. Exact McNemar tests use discordant pairs and Holm correction. There are no missing outcomes, so worst-case missing-outcome bounds equal the observed estimates. Shared seeds synchronize seed labels, not opening hands or subsequent random events after changing deck contents.',
'',
'Basic credit actions rose from 0.307 per reached Runner turn in the original to 0.441 with Wildcat Strike and 0.508 with Mayfly (observed increases of 43% and 65%). Median round reached rose from 12 to 13 in both alternatives. These are descriptive secondary metrics, without formal significance claims.',
'',
'Basic credit actions count only the ordinary click-for-1-credit command, not card-generated income or all click spending. Their per-turn denominator includes every reached Runner turn, including the final partial turn. A change in this metric does not by itself demonstrate credit starvation or explain a win-rate change. Median round reached is ceil(native player-turn count / 2), including a partial final round.',
'',
'## Reproduction and evidence',
'',
`Engine SHA-256: \`${design.engineHash}\`. Policy: \`${design.policy}\`. This policy’s hidden-information behavior and strategic quality have not been certified; findings describe these AI policies and specific lists, and need human validation before guiding balance changes. Gateway was chosen for its more mature implementation coverage; this experiment does not certify Elevation.`,
'',
'Four workers, fast mode, 120-second limit per game, 100,000 native decisions per game; every decision trace retained. Panel seeds: `deck-panel-1:0…49` in each cell. Follow-up seeds: `deck-economy-holdout-1:0…199` for each version. Exact documents, legality validations, limits and selection rule were saved before the runs in `design.json`. `selection.json` records the choice before follow-up execution.',
'',
'```sh',
'node scripts/netrunner.cjs bench eval/deck-experiments/experiment-1/panel.json --out tmp/deck-experiment-1/panel',
'node scripts/netrunner.cjs bench eval/deck-experiments/experiment-1/economy.json --out tmp/deck-experiment-1/economy',
'node scripts/experiments/deck-study.cjs analyze eval/deck-experiments/experiment-1 tmp/deck-experiment-1/economy',
'node scripts/experiments/deck-study-audit.cjs',
'node tests/deck-study-analysis.cjs',
'node scripts/experiments/deck-study-report.cjs',
'```',
'',
'The first two commands resume existing outputs without rerunning completed jobs. Frozen engine runtimes, per-game JSON, full traces, CSV exports, manifests and sample replay logs are retained locally under ignored `tmp/deck-experiment-1/`. For a future rerun after engine changes, invoke the frozen `runtime/scripts/netrunner.cjs` entrypoint with absolute spec/output paths, or use a new output directory for the changed engine. Summary evidence and exact deck definitions live in `eval/deck-experiments/experiment-1/`.',
'',
'A fixed diagnostic sample replays held-out seed indices 0–5 for all three versions, forwarding native log calls and retaining the log. All 18 must match their original entire decision trace hash and terminal outcome. These logs show usage examples, not statistically representative estimates of card value.',
'',
'All 18 diagnostic replays matched. In this small sample Wildcat Strike was played in four of six burst-version games (five plays total). Mayfly was installed in two of six Mayfly-version games and used in one; it was discarded in three others. This suggests checking AI card selection and timing before treating a package result as a verdict on the cards. The sample is too small to estimate usage rates or explain the overall win-rate differences.',
'',
'`game-results.json` preserves every seed, outcome, final points, turn count, decision count, elapsed time and SHA-256 decision-trace digest alongside each manifest. `sample-replays.json` preserves package log excerpts and matching trace hashes; full logs remain with the local raw outputs.',
];
fs.writeFileSync('docs/research/deck-experiment-1.md',lines.join('\n')+'\n');
const data=JSON.stringify({panel,study}).replaceAll('<','\\u003c');
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{color-scheme:light dark;font-family:var(--font-sans,system-ui);color:var(--foreground,CanvasText)}*{box-sizing:border-box}html,body{margin:0}h3{font-size:16px;margin:0 0 8px}p{font-size:13px;line-height:1.5;color:var(--muted-foreground,GrayText);margin:8px 0 16px}section+section{margin-top:26px}.grid{display:grid;grid-template-columns:1fr repeat(3,1fr);gap:6px}.head,.name{font-size:12px;align-content:center}.head{text-align:center}.cell{font:inherit;color:inherit;min-height:62px;border:1px solid var(--border,GrayText);border-radius:var(--radius,7px);background:color-mix(in srgb,var(--chart-1,teal) var(--shade),transparent);cursor:pointer;line-height:1.25}.cell strong{display:block;font-size:20px}.cell small{font-size:11px}.cell[aria-pressed=true]{outline:2px solid var(--ring,teal);outline-offset:1px}.cell:focus-visible{outline:2px solid var(--foreground,CanvasText)}#detail{min-height:42px;font-size:12px;margin:9px 0;color:var(--muted-foreground,GrayText);line-height:1.5}.row{display:grid;grid-template-columns:135px 1fr 67px;align-items:center;gap:10px;margin:16px 0}.label{font-size:12px}.plot{height:28px;position:relative;background:var(--muted,ButtonFace);border-radius:4px}.bar{height:28px;border-radius:4px;background:var(--chart-1,teal);opacity:.5}.ci{position:absolute;top:13px;height:2px;background:var(--foreground,CanvasText)}.ci:before,.ci:after{content:'';position:absolute;width:2px;height:10px;top:-4px;background:var(--foreground,CanvasText)}.ci:after{right:0}.dot{position:absolute;top:9px;width:10px;height:10px;border-radius:50%;background:var(--foreground,CanvasText);transform:translateX(-50%)}.rate{font-size:14px;font-weight:600}.axis{display:flex;justify-content:space-between;margin:0 77px 0 145px;font-size:11px;color:var(--muted-foreground,GrayText)}.contrast{font-size:13px;line-height:1.6;border-top:1px solid var(--border,GrayText);padding:8px 0}.note{font-size:12px}@media(max-width:460px){.row{grid-template-columns:85px 1fr 52px;gap:7px}.axis{margin-left:92px;margin-right:59px}.head,.name{font-size:11px}.cell strong{font-size:18px}}
</style></head><body><main><section><h3>Matchup screen · Runner win rate</h3><p>50 games per cell · all 450 completed. Select a cell for its uncertainty and game length.</p><div class="grid" id="grid"></div><div id="detail" aria-live="polite"></div></section><section><h3>Two-card swaps · Tāo vs Precision Design</h3><p>200 fresh seeds per version · all 600 completed. Lines show 95% win-rate intervals.</p><div id="bars"></div><div class="axis"><span>0%</span><span>50%</span><span>100%</span></div><p class="note">Both alternatives replace two Telework Contracts. Burst adds two Wildcat Strikes; Mayfly adds two Mayflies.</p><div id="contrasts"></div><p class="note">Paired changes use 97.5% bootstrap intervals for two planned comparisons. These are specific deck results under the current AI policies; human play may differ.</p></section></main><script>
const {panel,study}=${data};const pct=x=>(x*100).toFixed(1)+'%', pp=x=>(x>=0?'+':'')+(x*100).toFixed(1)+' pp';const grid=document.getElementById('grid');grid.innerHTML='<div></div>'+['Precision Design','Restoring Humanity','Built to Last'].map(n=>'<div class="head">'+n+'</div>').join('');for(let r=0;r<3;r++){const label=document.createElement('div');label.className='name';label.textContent=['Loup','Zahya','Tāo'][r];grid.append(label);for(const c of panel.cells.filter(c=>c.r===r)){const b=document.createElement('button');b.className='cell';b.style.setProperty('--shade',Math.round(c.runnerWinRate*65)+'%');b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',c.runner+' versus '+c.corp+': '+c.runnerWins+' of 50 Runner wins');b.innerHTML='<strong>'+Math.round(c.runnerWinRate*100)+'%</strong><small>'+c.runnerWins+'/50 wins</small>';b.onclick=()=>{document.querySelectorAll('.cell').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');document.getElementById('detail').textContent=c.runner+' vs '+c.corp+' · 95% interval '+c.wilson95.map(pct).join('–')+' · median round '+c.medianRoundReached+'.';};grid.append(b);if(c.r===2&&c.c===0)b.click();}}
for(const v of study.variants){const row=document.createElement('div');row.className='row';row.innerHTML='<div class="label">'+v.label+'</div><div class="plot"><div class="bar" style="width:'+v.runnerWinRate*100+'%"></div><div class="ci" style="left:'+v.wilson95[0]*100+'%;width:'+(v.wilson95[1]-v.wilson95[0])*100+'%"></div><div class="dot" style="left:'+v.runnerWinRate*100+'%"></div></div><div class="rate">'+pct(v.runnerWinRate)+'</div>';row.setAttribute('aria-label',v.label+': '+v.runnerWins+' of 200 wins; 95% interval '+v.wilson95.map(pct).join(' to '));document.getElementById('bars').append(row);}
for(const c of study.contrasts){const p=document.createElement('div');p.className='contrast';p.textContent=c.label+': '+pp(c.delta)+' vs original · interval '+c.bootstrapInterval.map(pp).join(' to ');document.getElementById('contrasts').append(p);}
</script></body></html>`;
fs.writeFileSync(path.join(base,'results.html'),html);
console.log('Wrote research report and interactive results.');
