# Counter playtest: Runner

Date: 2026-11-05. Tester: independent AI player, not a recruited human participant. Browser: actual Google Chrome extension browser. Origin: http://localhost:5175/. No viewport changes. No app-code edits, hidden game state, direct engine calls, or injected states. Closed own tab at end.

## Scope and reproducibility

Two focused legal-play sessions, not a completed match. Fresh Runner session exported 16 choices. Separate Botulus continuation imported a recorded 19-choice prefix through Menu > Paste game replay, then made **20 new legal choices** (39 total in export). Total new decisions in this test: **36**. Card inspection and action-group expansion are not counted as gameplay decisions. Export counts are authoritative.

Files:
- eval/counters/runner-fresh-session.json: fresh seed 327a3566-86ad-4e62-907e-4144b7de09af, 16 new choices.
- eval/counters/runner-botulus-session.json: seed 4e2bd374-fa72-4ff3-98a0-cc68f2e499a8, 19 imported +20 new choices.
- eval/counters/runner-virus-replay.json: imported prefix.

Chrome file chooser import was blocked by extension setting: Allow access to file URLs was disabled. No extension setting was changed. The new normal Paste game replay UI successfully restored the supplied legal replay through its JSON text field. Export UI downloaded the files normally. The browser automation download-event wait timed out once, although Chrome had successfully downloaded the file; the file was recovered from Downloads. This is automation behavior, not an observed app failure.

## Observed fresh-session results

- Kept opening hand, installed Smartware Distributor: clicks 4→3, pool5 unchanged (0-credit installation).
- Used Smartware: clicks3→2, pool5 unchanged, gold ¢3 CR marker appeared. Last resource change recorded −1click and +3 ·3 hosted credits. Clicking that card opened Smartware details with its own3 hosted credits and correct ability text.
- Gained1credit: pool5→6 and clicks2→1, both reported together.
- Used Smartware again as last click: next-decision panel explicitly reported net changes including automatic effects; hosted credits3→5 (=+3 ability, −1 start payout), pool6→7, clicks reset4. Nico Campaign appeared with6 hosted credits on Corp remote.
- Drew, played Wildcat Strike (−2credits, −1click; Corp chose draw4), installed Fermenter (−1credit, −1click, purple ☣1 VIR), installed Leech via Finish install, discarded duplicate T400 Memory Diamond.
- Next turn: Nico6→3, Smartware5→4, Fermenter1→2, Runner+1credit and click reset. All appeared in persistent resource-change panel.
- Successful Archives run: Leech0→1. Accessing Hedge Fund and returning to action phase did not erase the last resource change.
- Cashed Fermenter2: +4credits, −1click, Fermenter leftplay; panel reported all three.

## Observed Botulus continuation

- Restored at Brân1.0 encounter: Botulus1 virus, Leech2 virus, Nico6 hosted credits. Botulus is shown in HOSTED PROGRAMS with HQ ·ice1 from outside host label. Corp gold ¢ CR versus Runner purple ☣ VIR markers were visually distinguishable at once.
- Clicking Botulus opened the correct card details and its1 virus counter. Used its ability and selected the first End the run subroutine. Botulus1→0 remained visible on the board; middle subroutine became grey and struck through. Log explicitly recorded1 virus removed and End the run broken. Persistent panel: Botulus ·HQ ice1 ·hosted / −1 ·0 virus counters.
- Spent oneclick on Brân's bioroid ability: clicks2→1 and another End the run broken. Used Leech:2→1 virus, ice strength6→5. Spent final click breaking the installation subroutine: clicks1→0; engine advanced to movement with all subs broken and strength restored6.
- Continued successfulHQ run: Leech1→2. Accessed and stole Send a Message: Runner3 agenda points. Next turn Botulus0→1, Nico6→3, clicks reset4.
- Installed Smartware, placed3credits, gained1credit, installed Fermenter through Finish install. Next turn Botulus1→2, Fermenter installed and grew to2, Smartware3→2, Nico leftplay after payout. No hidden-state claims: these changes were read in the DOM and visible UI.
- Drew, gained1credit, cashed Fermenter2 for4credits, placed3 more Smartwarecredits as final click. Next turn Botulus2→3, Smartware2→4 net, Runner+1credit/reset4. Final gain1credit left Runner10credits and3clicks.

## Clarity assessment and findings

The click tiles provide a clear physical affordance: available tiles are gold with a turnover symbol; spent tiles show dark card backs. The numeric total remains beside them. The hosted credit markers look like gold coins/stacks and stay attached to cards. The virus symbol and VIR label prevent color being the sole distinction. Zero-virus marker persistence makes a spent Botulus easier to understand than disappearing its badge. The persistent resource-change panel is the most useful feedback when automatic effects fire between player decisions; it also explicitly calls changes net values, which matters for Smartware +3 and −1 appearing as +2.

No blocking gameplay bug found in these focused flows. Minor copy issue observed: agenda points in resource change used '+3 ·3 left', which sounds like points remaining rather than current score. Singular click text appeared as '1 clicks' in the session before the parent’s grammar update; retest the shipped revision for this copy change. When using desktop hover cards, the enlarged hover preview can temporarily cover part of the board; moving to the action rail clears it. This did not block legal actions.

Not covered: full game completion, human-player comprehension, every counter type, narrow/mobile viewport, purge interaction, or long-session performance. This is an independent AI Chrome playtest, not evidence of human usability testing.

## Screenshot evidence

- eval/counters/runner-smartware-3.png:3 hosted credits after legal ability,2clicks remaining.
- eval/counters/runner-smartware-nico.png: Smartware5 and Nico6 hosted credits, turn2.
- eval/counters/runner-virus-and-credits.png: Fermenter1 virus and Smartware5credits.
- eval/counters/runner-botulus-before.png: starting encounter, Botulus1 / Leech2 / Nico6.
- eval/counters/runner-botulus-after.png: Botulus0 and struck-through End the run.
- eval/counters/runner-continued-turn5.png: Botulus3, Smartware4 after further legal play.
