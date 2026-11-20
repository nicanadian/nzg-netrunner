# Stealth retest — 19 November 2026

The updated guide supported a complete learning loop: choose the actual Tāo Stealth path, open its starting deck in the builder, make the worked edit, save and use it, record a hypothesis, finish a game, and return to persistent notes. No blocking guide or builder defect was observed. The payment arithmetic helped in actual play. The largest remaining teaching gap is how Touchstone becomes and remains funded, rather than how Corsair spends its credits.

## Setup and method

Used only http://localhost:5173 in my own incognito tab. The initial snapshot timed out, so this is a DOM-only review with no visual claims. Every action used rendered buttons, links, native selects or text areas. Routine DOM click batches were used for already assessed action sequences, including draws/gains and repeated known encounters. Absent controls stopped batches; I inspected fresh state before adapting. Only public `localTable.state` informed strategy. `localTable.session` was read once the game was terminal, for the requested artifact. No source inspection/edits, hidden-state access, worker injection, storage clearing, default-profile actions or empty-Archives farming occurred.

First impressions were saved before reading any prior reviews. The selected experiment was Vantage Runner **Tāo · Stealth foundation pilot** against **Precision Design · Tempo and recycling**, saved as **Retest Stealth 19Nov**. Exact list is in `stealth-deck.json`; complete postgame session and final public state summary are in `stealth-game.json`.

## Actual UI path and checks

1. Opened the lobby's Pairing & learning guide link, changed the guide pool from Gateway to Vantage, expanded **Try one edit · Try earlier program setup** in the **Stealth credits** path, and read the cut/add and opportunity cost.
2. Clicked that path's actual **Open starting deck to edit** link. It carried the Vantage pool, Runner role, Tāo baseline and HB Tempo opponent. The builder opened immediately on the Runner list.
3. Removed one Pantograph and added one DZMZ through the named −/+ buttons. Counts changed Pantograph2→1, DZMZ2→3; all3 Touchstones remained. Before and after were40cards and8/15influence, matching the guide.
4. Named the deck **Retest Stealth 19Nov**, selected **Save & use this deck**, and checked the baseline description and exact diff. The builder explicitly said **Custom revision · its matchup results have not been benchmarked.** The guide subsequently showed a saved-custom banner and kept its benchmark table tied to the bundled baseline, with the experiment notes keyed to the custom name.
5. Filled hypothesis, tradeoff/support and opening/threat fields before play. Returned after the game to fill observations and next decision. Reload preserved all five fields. Selecting Loup showed a separate empty log; reloading the original custom URL restored the Stealth notes.

## What the game actually taught

Finished one natural game: Runner8–Corp6, public state turn42 (displayed turn21), terminal Runner agenda victory; diagnostics empty. This outcome does not establish the edit's strength.

DZMZ was in the opening five, and I kept that hand despite no income card. That choice made the opening slow. Installing DZMZ allowed Conduit at3 rather than4 credits; later it discounted Corsair3→2, Echelon3→2 and Unity3→2. The extra memory supported Conduit, the full three-breaker rig and hosted Stowaway, reaching0freeMU. DZMZ already had two copies in the baseline, so I cannot identify the opening draw as the added third copy or attribute the result to the edit. Pantograph appeared but I discarded it while cash constrained. Several agenda steals would have presented its trigger opportunity; this is the stated tradeoff, not measured lost value.

The split-payment example transferred well. On R&D, actual Palisade was strength2: one Touchstone-funded reduction reached0, then I explicitly confirmed the ordinary pool for its1-credit break. On remote Brân at strength6, I spent two stealth reductions6→3→0 and three ordinary credits on its three subroutines. An empty reserve later really did leave Corsair unable to reduce a new Palisade despite ordinary cash. I let that end-the-run fire rather than boosting an unrelated breaker.

Other strategic decisions were explicit: I initially accepted exactly1Tithe net damage from a3-card grip, then refilled the damage buffer. Later Echelon damage breaks used pool credits to preserve scarce stealth. I contested an advancing remote through Ansel by spending3bioroidclicks, stole an agenda, and used Tāo swaps to change pressure lanes as R&D grew and Conduit was purged. At6–6, a newly advancing remote prompted the final attack. Two Ansels required12credits; I paid11pool plus1Touchstone while preserving2clicks for Manegarm. Its actual tax consumed those2clicks, and I accessed the advancing card first to steal the winning Offworld Office.

## Findings and acceptance tests

**Medium instructional gap — Touchstone funding conditions.** The path says event → Touchstone credit → Corsair reduction, but does not link the two dependency cards beside that lesson or explain its timing/active-copy conditions. I incorrectly expected a second same-turn event to replenish reserve and tried a new Touchstone that replaced the existing installed copy. Those were tester mistakes; the path could prepare a Gateway graduate to avoid them. Add Read Touchstone and Read Corsair links, state the applicable card timing and active-copy restriction after verifying printed text, and give one short install/event/reserve sequence. Acceptance: a reader can explain how to accumulate two stealth credits and what happens after a second event or another install. Exact rules implementation was not inspected, so this is a teaching gap supported by observed behavior, not a claimed rules-engine defect.

**Low instructional precision — Palisade context.** The guide's strength4 arithmetic works, but the server condition is unstated. My actual R&D Palisade was strength2 and needed one reduction. Say which Palisade is4, include the central2 case, and tell the player to check current strength. Acceptance: the reader can correctly choose one reduction for2→0 and two for4→1→0.

**Low game UI copy defect — Manegarm.** With exactly2clicks and0credits, the payment button rendered **Spend ClickClick**. Replace it with **Spend 2 clicks** and ensure the accessible label includes the numeric cost. Acceptance: label and actual2-click spend agree. This is outside the guide flow and did not block play.

Preference: add a short example opening/mulligan checklist—income first, Touchstone before the relevant event, matching breaker, sufficient reserve and cards for damage. The present generic reminder is useful, but my bioroid budgeting, threat calculations and lane switches relied substantially on my own Netrunner knowledge. The title **First Vantage games after Gateway** sets a reasonable prerequisite; this is not a complete tutorial for a brand-new player.

## Honest limits

Only one game and no paired baseline test. Several tactical mistakes and asynchronous DOM batches made play slower: a no-income keep, a queued R&D plan before checking newly added outer barriers, and the Touchstone assumptions above. I corrected each using the actual rendered controls; no blind wrong-breaker boosts were used. The trace is selected UI evidence and strategy notes rather than a raw capture of every intermediate render; the postgame session contains the complete action record. No screenshot/layout judgment is supported.
