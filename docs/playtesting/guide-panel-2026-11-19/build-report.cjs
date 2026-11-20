'use strict';
const fs=require('node:fs'),path=require('node:path'),dir=__dirname;
const checks=JSON.parse(fs.readFileSync(path.join(dir,'replay-validation.json'))),files=['runner-review','corp-review','experiment-review'].filter(n=>fs.existsSync(path.join(dir,n+'.json')));
const rows=checks.map(v=>{const saved=JSON.parse(fs.readFileSync(path.join(dir,v.name+'.json'))),side=saved.session.config.side,own=v.construction.find(c=>c.side===side);return `| ${v.name} | ${side} | ${own.name} | ${own.totals.size} / ${own.totals.influence} influence | Corp ${v.points.corp} – Runner ${v.points.runner} | ${v.terminal.reason} | ${v.decisions} |`;}).join('\n');
const report=`# Guide-led deckbuilding panel · 19 November 2026

The guide works best as a matchup and learning-goal reference. It is much less effective as a deck-crafting tutorial: the testers supplied their own knowledge to choose cuts, additions and opening plans. Three independent AI reviewers used the actual guide, saved legal custom decks through the deckbuilder, and completed real browser games against the built-in AI. The experienced reviewer completed a second game with the identical custom deck, adding more deliberate threat and encounter choices after early heuristic mistakes.

These are AI reviewers using different role-based lenses, not recruited humans or blind novices. All inherited project context. Routine gameplay used bounded public-state DOM-click heuristics. Their documented strategic errors substantially confound outcomes and enjoyment scores; this is useful functional/qualitative evidence, not a human study or deck-balance experiment. The original benchmark percentages apply to the exact bundled lists, not these revisions.

## What they actually tried

- **Gateway-graduate Runner lens:** guide's familiar Loup Tailored economy / Jinteki Ambushes pairing; replace one Underdome Irregulars with a second Tungsten Tailor. Learning goal: see the strength-reduction effect more often, accepting the risk of drawing duplicate unique hardware. Legal 40 cards, 7/15 influence.
- **Corp learner lens:** funded Weyland / Vic Central pressure; replace Pharos with Tithe and one Vulture Fund with Regolith Mining License. Learning goal: affordable defenses and income with less bad publicity. Legal 40 cards, 14/15 influence, 18 agenda points.
- **Experienced tinkerer lens:** Hiram funded rig / Jinteki Ambushes, a difficult guide pairing; replace two Beta Builds and one Sipa with two Jailbreaks and one T400 Memory Diamond. Hypothesis: increase central pressure and hardware utility. Legal 45 cards, 9/15 influence. This hypothesis was not established by the game outcome.

## Completed games and verification

Each retained session reconstructs its exact terminal, points and decision version in the offline engine. The validator also checks both exact game deck documents and records their differences from the nearest bundled snapshot. No diagnostics or engine errors were present in these validated replays.

| Session | Player side | Saved custom deck | Cards / influence used | Final agenda points | Ending | Native decisions |
|---|---|---|---|---|---|---:|
${rows}

Native decision count is not a physical click count: UI assists may combine decisions, and inspection/navigation adds other clicks. See each review and UI trace for method details.

## What worked

- Named learning paths gave testers a concrete place to start: familiar identities, stealth credits, or a new Runner.
- Explicit Runner-win direction, sample counts and preliminary labels were understandable. The custom-deck warning correctly limits the benchmark's applicability.
- Deckbuilding legality, influence accounting, saving and selecting the final custom documents worked. The game sessions confirm those saved revisions were actually used.
- The Loup game exercised Tungsten Tailor reducing Tithe to zero strength. Corp rez opportunities were exercised without a skipped pause or blocked end turn.

## Highest-priority improvements

1. **Bridge the guide to setup.** Add Use this pairing with an explicit player-side choice, plus Tune this deck. Configure a new matchup without starting it or overwriting a saved game. Current users must remember two names and navigate back through selectors.
2. **Teach one small deck edit.** Give each learning path an example cut/add recipe, legal totals, required supporting cards and the expected tradeoff. Explain what must stay intact: agenda totals, basic income, breaker coverage, or affordable ice. Make a single hypothesis and change only a few slots.
3. **Supply a short opening and threat checklist.** Include mulligan priorities, when the deck is ready to run/score, and what public threat to reassess. For Jinteki, explain why an advancing remote deserves attention. For bad-publicity economy, demonstrate how recurring run credits can make a once-useful cheap defense porous. The testers' mistakes are not proof every human needs this, but they identify missing teaching material.
4. **Support the Corp perspective.** Let a player select My Corp deck and explore Runner opponents. Keep the denominator explicit; difficulty labels should be relative to the selected player side.
5. **Offer an optional lesson reminder during play.** A small reference checklist could connect the chosen learning goal to later decisions. Keep it optional and avoid adding mandatory pauses.

## Concrete defect and tentative UX observation

**Confirmed inspector attribution defect:** Tungsten Tailor and Aircheck were observed with correct Vantage rules text but System Gateway set labels. Source inspection confirms app/table.js treats every pack other than elev as System Gateway. This is a copy/metadata defect, not a rules or deck-validation error. No app source change was made during this panel; it remains a specific follow-up fix.

**Tentative distraction:** the advanced tester could spend credits boosting a breaker that did not match the encountered ice. The action can be legal while strategically irrelevant. The tester's heuristic made the mistaken choice, so this is an interface-salience hypothesis, not evidence that the engine allowed an illegal break. Consider keeping irrelevant boosts out of the primary suggestions while preserving access to legal paid abilities.

## Outcome and method limits

The initial Runner attacked before rig completion; the Corp heuristic accumulated credits without reinforcing; the advanced heuristic initially ignored an advancing remote and later selected an irrelevant boost. These are explicitly tester-strategy confounds. Do not treat their losses as confirmation that the guide's original percentages are inaccurate, that the custom lists are bad, or that the swaps improved anything. Visual screenshots were unavailable for parts of the review, so DOM/control checks do not establish visual or accessibility quality.

The useful result is the consistent gap between **choosing a matchup** and **knowing what to change and how to pilot it**. The next pass should prioritize that instructional bridge, then repeat the same task with explicit strategic decisions and eventually actual human players.

## Evidence

${files.map(n=>'- ['+n+']('+n+'.md) · ['+n+' structured notes]('+n+'.json)').join('\n')}
- [Validated sessions and exact deck deltas](replay-validation.json)
- [Protocol](protocol.md)
- Run node docs/playtesting/guide-panel-2026-11-19/validate-replays.cjs with the saved game basenames to repeat validation. Full configs/choices and rendered-control traces are retained alongside the reviews.
`;
fs.writeFileSync(path.join(dir,'panel-report.md'),report);console.log('Saved panel report with '+checks.length+' validated games and '+files.length+' completed reviews.');
