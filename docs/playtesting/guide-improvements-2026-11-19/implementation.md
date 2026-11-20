# Guide improvements · 19 November 2026

Implemented from the expanded usefulness suite:

- Guide links carry the selected pool, player side and both exact deck IDs. Use this pairing configures a new lobby without starting a game. Tune my deck opens the correct editor. Invalid/stale/wrong-side links show a setup error. The original-return link explicitly retains the entry setup. Context parameters are consumed after a successful handoff.
- Guide deck titles now match lobby titles, including Dashing Mad, Brutal Efficiency and Planogram economy. Corp perspective fixes the chosen Corp while comparing Runner opponents and explicitly shows Corp test-win percentages; raw counts remain visible.
- Learning paths change with the pool. Eight worked, production-validator-checked edits show exact before/after size, influence and Corp agenda totals, cut/add text, required support, tradeoff and an observation. Opening/threat reminders are beside the lesson. The stealth example separates restricted strength-reduction payments from ordinary breaking costs; bad-publicity advice includes its recurring per-run consequence.
- Construction help links guide and builder. It explains minimum size, own/import influence, copies versus uniqueness, faction agendas and the deck-size-dependent agenda band, including a worked repair.
- Cloned decks retain a baseline document/title in library metadata and drafts. Cumulative differences survive further saves/reloads; game deck documents remain independent. Legacy lists without recorded baselines are identified honestly. Library backup imports retain normalized baseline metadata when available. Custom revisions are explicitly unbenchmarked.
- Missing Stealth-source messages are advisory, naming the affected ability rather than blocking legal creative lists. Restoring support clears the message.
- Experiment notes save locally by selected deck, role and pool, with separate custom-deck note scope. Hypothesis/change, tradeoff, opening plan, actual observations and next decision can be exported. The form asks whether a changed card was drawn, affordable, installed and useful, rather than equating a win with evidence.
- In-game matchup-deck copy identifies game-start snapshots and explains Resume versus new-library edits. Card inspector attribution now distinguishes Vantage Point from System Gateway.

Validation:

- npm run test:decks passed, including construction/import, exact bundled lists, deck tuning and legacy draft compatibility, lobby/save flows, existing browser replay corpus and new guide tests.
- tests/guide-improvements.cjs checks all 281 pairings with both player sides and Tune intent (562 handoffs), invalid/wrong-side links, all eight recipe totals, advisory-only stealth support, baseline deltas and exact Core titles.
- tests/pairing-guide.cjs exercises role inversion, mixed test populations, local note separation/restoration, loading failures and local HTTP/offline dependencies.
- tests/frontend-audit.cjs passed the existing native/adapter enumeration, replay/live restoration and privacy checks.
- Actual shared-browser DOM actions verified guide-to-Corp tuning with exact IDs and no game auto-start; notes isolated by deck and restored; missing Touchstone support while Ready to play; repair clearing the advisory; save/use, second edit and cumulative comparison after reload; custom-deck benchmark warning and custom note scope.
- At confirmed 390px width, the expanded guide had no horizontal overflow and select heights were 44px. This is geometry/control verification, not full visual/accessibility certification.

The isolated test profile is restored after checking. No public release or publishing is part of this change. The benchmark values and bundled deck documents remain unchanged; the examples are teaching hypotheses, not measured upgrades.

## Follow-up from the fresh game retest

Addressed the remaining polish in guide-retest-2026-11-19/report.md:

- Added optional role-specific opening and mulligan checklists above learning paths. Corp guidance covers affordable ice, rez reserves, a protected scoring lane, reassessing the visible rig and Tāo swaps, and Anoetic Void's separate 2-credit/two-HQ-card payment. Runner guidance covers income, matching breakers/current strength, damage buffers, advanced remotes and reconsidering a memory-expensive install.
- Added a Phoenix/Doomscroll worked encounter in the selected Phoenix context, with full-size card links. It explicitly starts at zero tags, breaks the tag and unconditional damage, lets the final conditional subroutine resolve harmlessly, and requires the run to become successful for Phoenix. The two-tag threshold and first-time-per-turn limit remain explicit. Stealth openings explain installing Touchstone before the first event and building reserves across turns.
- Added adaptive-play advice: changing targets after a virus purge or an expensive central is compatible with an experiment. Record drawn, installed and useful separately.
- Added explicit Copy baseline plan for custom lists with a linked baseline in the same card set and role. It fills only empty hypothesis, opportunity-cost and opening fields; existing custom text, observations and next decisions are preserved. Baseline notes remain unchanged. Lists without a valid linked baseline do not expose this action or export an unrelated selected comparison as their baseline. Empty/malformed baseline notes and storage failures have clear status feedback.

Validation: npm run test:decks passed, including the existing three-game browser replay corpus (411 decisions), all eight validated recipes and 562 pairing/side/tune handoffs. New tests exercise explicit copying, no automatic copy, existing-text/result protection, reload, pool/side scope rejection, malformed storage and persistence failure. Tactical assertions check the shipped Phoenix, Doomscroll and Anoetic Void metadata. The guide loads locally and its referenced card-image files exist; the dev server remains on port 5173. This follow-up used automated DOM/state and replay tests, not a new browser playtest cohort or visual certification.
