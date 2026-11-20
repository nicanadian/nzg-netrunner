'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),dir=__dirname,ROOT=path.resolve(dir,'../../..');
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n))),names=['beginner','constraints','dependency','navigation','returning','pools'];
const reviews=names.map(name=>({name,data:read(name+'-review.json')}));const tasks=reviews.flatMap(({name,data})=>{const list=Array.isArray(data.tasks)?data.tasks:Object.entries(data.tasks||{}).map(([id,t])=>({id,...t}));assert.equal(list.length,3,name);return list.map(t=>({reviewer:name,...t}));});assert.equal(tasks.length,18);
const games=read('replay-validation.json'),checkpoints=read('checkpoint-validation.json'),boundaries=read('boundary-results.json');assert.equal(games.length,3);assert(games.every(g=>g.replayPassed&&g.diagnostics.length===0&&g.construction.every(c=>c.valid)));assert.equal(checkpoints.length,3);assert(checkpoints.every(c=>c.replayPassed));assert.equal(checkpoints[0].runnerRevision,checkpoints[1].runnerRevision);assert.notEqual(checkpoints[1].runnerRevision,checkpoints[2].runnerRevision);assert.equal(boundaries.passed,14);
const snapshot=read('source-snapshot/manifest.json');assert(snapshot.every(x=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,x.file))).digest('hex')===x.sha256),'Product changed during review');
const findings=[
 {priority:'P1',title:'Match exact list names and carry setup intent',evidence:['B1','C1','D1','N3','R1','P1'],observation:'Guide-to-lobby name matching and round trips require manual reconstruction. Core guide labels omit Dashing Mad/Brutal Efficiency. Browsing another pool does not change the Back link; a fresh lobby defaults player side to Runner.',proposal:'Share lobby display labels with the guide. Add Use this pairing with exact IDs, pool and explicit human side, plus Tune this list. Clarify returning to the original lobby versus configuring a selected pairing.',acceptance:'From Gateway, choose Vantage Jinteki as human Corp versus Loup; the setup has the exact lists and side without starting a game or overwriting an existing save. Core titles match verbatim. The original tab is preserved.'},
 {priority:'P1',title:'Teach one deliberate edit, with construction and coherence explained separately',evidence:['B2','C2','D2','P2','P3'],observation:'One guide-only edit task was blocked; its fallback succeeded with builder/expert help. Corp errors were repaired using builder feedback. Removing all Touchstones left a legal list with Corsairs and no stealth credit source.',proposal:'Attach an optional worked cut/add example to each learning goal: role of both cards, legal totals, sacrificed capability and dependencies. Link to existing Deckbuilding basics. Keep coherence advisories distinct from legality errors and preserve creative legal lists.',acceptance:'A reader can explain the role lost by a cut and diagnose a missing stealth source. Last-Touchstone removal remains legal but has a specific advisory about Corsair reduction funding. A Corp example explains size and agenda-band changes, plus influence/copies.'},
 {priority:'P1',title:'Move prerequisites beside the chosen lesson and show a real payment example',evidence:['D1','D3','B3'],observation:'A short Touchstone/Corsair hint exists under collapsed What to learn next. The dependency reviewer did not obtain a sufficient working model from it. Actual play required named source selection and separate strength-reduction/break costs.',proposal:'Show a compact dependency chain beside the stealth path and a worked barrier encounter; retain full card-text links. Explain the finite stealth budget and which cost can use ordinary credits.',acceptance:'Given strength-4 Palisade, a learner can explain two Corsair reductions paid with two stealth credits and a separate one-credit break paid from another legal source. They can identify what fails with an empty stealth budget.'},
 {priority:'P2',title:'Give each side and card pool a relevant entry point',evidence:['C1','N3','P1'],observation:'Corp users browse Your Runner deck and invert rates. Gateway/Core routes still lead with Vantage lessons.',proposal:'Initialize from pool, human side and exact selected deck. Offer My Runner/My Corp views with explicitly labeled test-win direction; surface the relevant learning path first.',acceptance:'A Gateway Corp can hold their Corp fixed while comparing Runner opponents. The header and recommendations show the selected pool; six-game results remain visibly preliminary.'},
 {priority:'P2',title:'Keep a baseline and game-start snapshot visible across edits',evidence:['R1','R2','R3','N3'],observation:'Persistence works, but reopened custom editors show changes relative to that edit session, not the original baseline. A resumed game and revised library deck may share a name while holding different card counts.',proposal:'Add Based on [exact baseline], cumulative Compare to baseline, and a game-start snapshot label. Add short returning-player instructions that reuse current Resume/Jack in copy. Show custom benchmark status at the edit/selection point.',acceptance:'After two saved revisions, the cumulative delta remains inspectable. Resume shows the old exact list; fresh Jack in shows the new list, with names/revision context making the difference clear. No original benchmark percentage is assigned to the custom revision.'},
 {priority:'P2',title:'Teach an observation loop instead of using wins as the only feedback',evidence:['B3','C3','D3','P3'],observation:'The extra Docklands Pass was not installed and Anoetic Void never activated before their wins. The stealth lesson occurred through the preserved core package; that does not measure benefit of the DZMZ swap.',proposal:'Use a small worksheet: goal, one edit, cost/tradeoff, expected interaction, what actually happened, next decision. Include optional opening/threat reminders. Pairings and recipes are hypotheses, not strength certifications.',acceptance:'An edit can be recorded as untested when its interaction never occurs, even after a win. A player can separate a deck issue from a missed remote threat or payment/strategy mistake and define a useful next trial.'},
 {priority:'P3',title:'Polish narrow navigation targets',evidence:['N1'],observation:'No horizontal overflow at 390px; sampled keyboard navigation worked. Section/back links measured around 23px high while form controls met 44px.',proposal:'Increase link hit areas while preserving wrap and focus outlines; repeat keyboard and coarse-pointer checks.',acceptance:'Relevant links have comfortable 44px targets at narrow width and retain correct Tab/Enter behavior. Full visual/accessibility qualification remains separate.'}
];
const counts=tasks.reduce((a,t)=>(a[t.status]=(a[t.status]||0)+1,a),{});
const summary={date:'2026-11-19',reviewers:6,reviewerType:'Fresh AI reviewers with distinct task briefs; not human novice research',manualTaskSlots:18,reportedTaskStatuses:counts,naturalBrowserGames:3,nativeGameDecisions:games.reduce((n,g)=>n+g.decisions,0),persistenceCheckpoints:3,guardrailCases:boundaries.passed,baselineDocuments:boundaries.baselineDocumentsChecked,productUnchanged:true,findings,tasks:tasks.map(t=>({reviewer:t.reviewer,id:t.id,status:t.status,severity:t.severity||t.friction?.severity||null}))};
fs.writeFileSync(path.join(dir,'suite-summary.json'),JSON.stringify(summary,null,2)+'\n');
const taskTable=tasks.map(t=>`| ${t.id} | ${t.reviewer} | ${String(t.status).replace(/\|/g,'/')} | [Detailed steps and help attribution](${t.reviewer}-review.md) |`).join('\n');
const gameTable=games.map(g=>{const saved=read(g.name+'.json'),side=saved.session.config.side,own=g.construction.find(c=>c.side===side);return `| ${g.name} | ${own.name} | ${own.totals.size} cards / ${own.totals.influence} influence | Corp ${g.points.corp} – Runner ${g.points.runner} | ${g.decisions} |`;}).join('\n');
const text=`# Expanded deckbuilding-guide usefulness suite · 19 November 2026

Six fresh AI reviewers performed **18 task slots**, with **three full browser games**, **three saved-game checkpoints**, and **14 focused construction checks**. All 58 bundled documents also validated. This extends the earlier three-reviewer panel with new task lenses and independently saved first impressions. Product code was unchanged throughout this suite; the exact guide and builder sources are retained in source-snapshot/.

The central finding is more specific now: **players can complete deckbuilding tasks using the builder and existing rules knowledge, but the guide does not consistently connect their learning goal, deck edit and in-game observation.** One beginner guide-only edit task was explicitly blocked; a fallback edit then succeeded. Completed task counts do not mean the guide taught the task.

## Coverage and trust limits

Reviewers covered a Gateway graduate, Corp construction constraints, stealth dependencies, narrow/keyboard navigation, a returning custom-deck user, and cross-pool interpretation. They used actual shared-browser rendered controls in incognito profiles. First impressions preceded prior-panel reading. This is role-based AI critique, not a human user study or a statistical estimate of player prevalence; reviewers retain substantial prior rules knowledge and shared task framing.

Routine clicks were sometimes scripted, with strategy based on public state. No headless Chrome, engine-choice/worker injection, private-card strategy data or default-profile writes were used. Snapshot requests timed out; narrow geometry, visible text, native key actions and DOM traces do not certify visual design or full accessibility. Localhost and 127.0.0.1 served the same unchanged app; the alias isolated some browser storage. Each natural game's authoritative config confirms the intended revision actually played. Parent checks replayed the exact sessions.

Reported task statuses: ${Object.entries(counts).map(([s,n])=>n+' '+s).join(', ')}. Sampled keyboard coverage was partial within a completed navigation task; that qualifier is retained rather than counted as a full accessibility pass.

## What is already working

- N2 correctly explained that 28/54 is a Runner AI record, derived the Corp direction, rejected a six-game counter claim and recognized that editing leaves the original benchmark. Test-pilot populations and sample labels were understandable.
- The builder catches construction violations and supports legal repair. Corp C2 exercised agenda underflow, a real 17/15 influence overflow, copy limits and foreign-agenda restrictions through UI controls. Basic explanations already exist in its Deckbuilding basics section.
- The saved custom decks were selected correctly. Original/resumed Core checkpoints have the same exact document revision and version41; fresh Jack in uses a different revised document and a new seed. No save-corruption defect was observed.
- The natural games replay exactly with zero diagnostics. Their outcomes are useful UI completion evidence, not a deck-strength result.
- At 390px, the navigation reviewer found no horizontal overflow and measured 44px select/checkbox-label targets. Sampled native Tab, Enter, Space and Escape behaviors worked; End/Enter selection had a host-specific limitation, documented without calling it an app bug.

## Findings and acceptance criteria

${findings.map(f=>`### ${f.priority} · ${f.title}\n\n**Observed:** ${f.observation}\n\n**Recommended:** ${f.proposal}\n\n**Verify with:** ${f.acceptance}\n\nEvidence tasks: ${f.evidence.join(', ')}.\n`).join('\n')}

## Adjudication: missing content versus hidden or insufficient content

The dependency reviewer reported too little explanation of the Touchstone/Corsair chain. Source inspection confirms a short sequence already exists inside the collapsed What to learn next section. The supported finding is **discoverability and depth**, not complete absence. Moving that prerequisite next to the selected learning path and adding one worked example is better grounded than claiming the guide contains nothing about stealth.

The builder's Ready to play verdict correctly means legal/implemented under local rules. It is not a guarantee of functional synergy. The deliberately constructed no-Touchstone list remained legal; a coherence advisory should not turn every unusual legal deck into a hard error. Some Corsair abilities can still be useful with zero-strength ice or other support, so advice should name the affected reduction/funding path precisely.

Back to lobby creates another lobby page; it does not prove the original tab's setup or saved game was modified. N3 observed that the new page retained the entry pool and defaulted the human role to Runner. This is a setup-intent and navigation-label issue. The returning-user checkpoints independently show the existing saved game's original document survives later edits.

One cross-pool reviewer initially asked whether an expanded guide had been deployed. We clarified that the TEST suite was expanded and the product unchanged; their final educational tasks assess the current guide. There were no newly implemented recipe/workflow sections to evaluate.

## Natural games and persistence checks

| Game | Custom deck | Legal totals | Agenda result | Native decisions |
|---|---|---|---|---:|
${gameTable}

All three testers won their natural games, but no improvement claim follows. Vic's added Docklands Pass was never installed; the Corp's added Anoetic Void was recycled/installed but not activated; the stealth goal was demonstrated using the preserved Touchstone/Corsair package. Knowledge and tactical choices supplied by the reviewers are documented. These outcomes do not show that the unchanged guide improved or that their revisions are stronger.

In the stealth game, strength-4 Palisade was reduced twice with two Touchstone credits, then its end-the-run routine was broken using an Overclock credit. This provides a concrete teaching example of separate restricted and unrestricted payment costs. There were still routine-timing/locator mistakes; those are not silently classified as product bugs.

[Full game construction and replay checks](replay-validation.json) cover ${summary.nativeGameDecisions} native decisions. [Persistence checkpoint checks](checkpoint-validation.json) reconstruct original, resumed and fresh opening states. Checkpoints are not additional completed games.

The cross-pool reviewer's separately saved custom list was also read from the isolated test-profile library after the task and independently validated: 40 cards, 6/15 influence. See [saved list](pools-saved-deck.json) and [validation](additional-deck-validation.json). That task did not include a game.

## Automated guardrails

[Boundary checks](boundary-results.json) cover copy limits, minimum size, wrong-side cards, selected pool, agenda underflow/overflow, foreign agendas, influence, legal one-for-one edits, legal missing-decoder/stealth-support cases, renaming, identity changes, and the larger-deck agenda band. All 14 behaved as expected. All 58 bundled documents validated separately.

Existing production regressions for [deck tuning](deck-tuning-regression.log), [lobby/save flow](lobby-deck-flow-regression.log) and [guide controls](pairing-guide-regression.log) passed. These are functional checks, separate from the 18 manual task slots; do not add them into a single inflated test total.

## Suggested next design pass

Build a small connected flow: **choose a side and goal → inspect prerequisites → try one edit → play with an observation → compare to the saved baseline**. Reuse the working builder validation and basics rather than duplicating them into a long rules page. Preserve explicit AI/sample/custom-deck caveats.

For the first implementation slice, prioritize exact labels and setup handoff, one worked Vic/Corp edit, and the stealth dependency example. Then add persistent baseline/snapshot context and a compact observation worksheet. Repeat B2, C2, D2, N3 and R3 against that version; success means fewer outside-knowledge requirements and less manual reconstruction, not a higher win rate.

## Task register and evidence

| Task | Reviewer lens | Reported status | Evidence |
|---|---|---|---|
${taskTable}

Each review includes actions, guide-versus-builder/expert help, limitations and falsifiable acceptance tests. First impressions, exact decks, UI traces and replays are retained alongside the reviews. No product changes, commit, release or publishing were performed as part of the suite.

Reproduce guardrails with node docs/playtesting/guide-suite-2026-11-19/check-boundaries.cjs, complete-game checks with validate-replays.cjs, and persistence checks with validate-checkpoints.cjs in the same directory. Then build-report.cjs regenerates this report and asserts product snapshot equality.
`;
fs.writeFileSync(path.join(dir,'suite-report.md'),text);console.log(JSON.stringify({reviewers:6,tasks:18,statuses:counts,games:3,gameDecisions:summary.nativeGameDecisions,checkpoints:3,boundaries:14,productUnchanged:true},null,2));
