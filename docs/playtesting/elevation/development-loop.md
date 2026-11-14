# Elevation / deck builder / offline engine development loop

2026-11-13. Experimental development build; Alpha Build 1 and its release downloads are unchanged.

## Implemented and usable

- All 82 Elevation definitions, metadata, printed text and card art, including both flipping identity back faces. Six absent NBN definitions were implemented locally. Every card has linked partial ability-test evidence; no card is marked fully certified by the release protocol.
- Shared deck documents, stable content hashes and browser/engine/CLI validation. The local library supports cloning, editing, URL/text/JSON import, backups, draft recovery and recoverable deletion. Twenty-one official Core sample lists retain author/source snapshots; their union includes all 82 Elevation cards.
- Custom games embed both exact deck documents. Chrome checks confirmed a game resumes after its library deck is deleted, and exported replays reconstruct without library access.
- A production runtime and offline CLI support seeded matches, persistent workers with fresh game VMs, summary and reference modes, resumable deck-variant matrices, diagnostics, hard parent limits and replay against executable frozen source snapshots.
- Portable Node code package at `builds/engine-dev/`, separate from desktop releases. A copied package in a spaced/Unicode path completed a match with macOS network access denied and verified the saved replay. Node 22+ is required; Windows/Linux clean-machine qualification remains open.

## Actual existing-Chrome checks

These used the installed official Chrome client connected to the user's existing extension-backed browser. No headless Chrome or shared-browser substitutes were used.

The earlier complete Core revision 1 games remain regression fixtures: Runner-side Phoenix vs Precision Design, Corp 7–0, turn 12, 223 native choices; Corp-side Precision Design vs Phoenix, Corp 7–2, turn 12, 156 choices.

A new Core revision 2 Runner game completed normally: Corp 7–0 on turn 10, 153 recorded native choices. It exercised Keep, Sure Gamble, Leech and Unity installation, Rent Rioters' three-click trash ability, Shred's first-end-run prevention against Kessleroid, its second end-run succeeding, Side Hustle counters, Rising Tide installation and queued breaks, Overclock source payments, R&D access/trashing Mercia, hand-limit discard, opponent playback, scoring and terminal export. The final turns deliberately used basic credit actions to exercise Corp scoring/terminal flow; this is not a strong-policy or deck-balance test. Native choice totals include streamlined transitions and are not mouse-click counts. The original export reconstructs to exactly the same terminal result.

Focused Chrome checks:

- Clone/save/select a custom deck on both sides; play the opening; survive reload; delete the originating library deck then resume; restore the deleted entry; export/import the custom game.
- Import the official Phoenix URL in the actual browser, retain its exact 45-card/17-influence list, reject an over-influence edit and recover after removing the extra card.
- Narrow 390×844 builder layout: no horizontal overflow, working filters, quantity edits retain focus, and deck contents remain accessible. This is focused responsive QA, not a complete mobile game.
- Official Nebula deck: play Petty Cash as the first action, install Regolith, end actions; identity flips, pays its credit and displays the loaded back-face art. The current face also opens correctly in card inspection.
- Official MuslihaT deck under revision 2: resolve the turn-start private look. A nonqualifying Sure Gamble is visible in the private panel and readable in its full-card dialog; only Leave on top is offered. Completing the look removes the private panel and returns to actions. The pending-look export reconstructs with the card visible only to its owner, without a permanent face-up flag. Opponent privacy is separately checked by native paired-view fixtures.

Evidence: `chrome-core2-runner-replay.json`, `chrome-core2-runner-complete.png`, `chrome-core2-ui-trace.json`, `chrome-custom-deck-replay.json`, `chrome-nebula-flip-replay.json`, `chrome-nebula-back-face.png`, `chrome-deck-builder-mobile.png`, `chrome-muslihat-private-replay.json`, and `chrome-muslihat-private-look.png`. UI traces are partial observations, not exhaustive click instrumentation. The browser's download-event wait can time out despite a successful download; retained files were read from the actual Chrome Downloads folder.

## Rules bugs found and repaired

The local revision 2 layer adds missing run-begins/approach/breach, end-action and hand-limit-discard timing; preserves hosted-uninstalled zones; completes sequential native transactions; and scopes private looks/searches to their decision windows. Specific regressions cover:

- Topan's discounted install completes before mandatory damage; zero-credit floor and once-per-turn restriction.
- Illumination and Top-Down installs finish individually; Bling/Madani hosted programs remain uninstalled and pay correctly.
- Sericulture accepts any installed card, including non-advanceable cards and Runner cards.
- Private AU Co./Poétrï/MuslihaT looks do not expose deck cards to the opponent. Dividends searches pay before looking and shuffle before revealing. Touch-ups does not leave shuffled cards face-up in the stack.
- Plutus charges its additional rez cost, selects exactly three HQ cards and removes a played transaction only after nested effects finish. Biawak supports its optional agenda forfeit without banking a surplus reduction.
- N-Pot accepts eligible bad-publicity payment. Open Market trashes after its final hosted credit is spent.
- KPI completes its draw/shuffle or free installation before selecting a distinct second mode; advancement places counters without an extra basic action cost.
- Mycoweb pays the discounted rez cost once. Peer Review can install in a new remote without an undefined helper.
- Lamplighter's trash and BANGUN's damage use proper response windows; Aggressive Trendsetting excludes Corp self-trash. Proprionegation ends the original encounter before redirecting, and can restart an Archives run.
- Semak's printed-subroutine restriction reaches native choices and the encounter explanation for non-fracter tools.

All new semantic behavior is gated behind Core revision 2 where needed. Three complete actual-Chrome games and three focused exports reconstruct under their own configured revisions. Gateway regression outcomes remain unchanged.

## Native execution and performance evidence

`eval/offline-engine/elevation-coverage.json` reports 82 definitions, 82 metadata/art entries and 82 cards with partial ability evidence, with zero fully certified. `docs/plans/elevation-82-card-tests.json` links executable fixtures and preserves outstanding scenario requirements. Printed-field verification is separate from ability verification.

One native AI game per new identity completed using its official sample list: 14/14, with a single frozen engine fingerprint for the panel. See `eval/offline-engine/core-identity-smoke.json` and the executable experiment directories under ignored `tmp/core-identity-qualification-final2/`. This panel is distinct from Chrome identity testing and does not prove every card ability was used.

The Gateway soak attempted 1,000 games with four workers on Apple M4/macOS arm64, Node 25.2.1, 120-second wall limit and 100,000-decision limit. It completed 999, recorded one timeout and no engine exception. p50 match time was 3.543 seconds; p95 was 24.093 seconds. Peak process RSS was approximately 717 MiB. The timeout retained 1,800 decisions; its frozen-runtime replay matched the prefix and also reached the limit. The original timeout remains recorded. Results, machine metadata and limits are retained in `eval/offline-engine/`; full executable experiments stay under ignored `tmp/`.

The fast path retains seeded decision parity with the full-observation path. Existing heuristic AIs can inspect engine globals; hidden-information policy fairness and full Elevation strategy remain unaudited. These runs measure execution reliability and those particular policies, not human deck balance.

## Validation and remaining gates

Passed `NR_TEST_SEEDS=1 npm run check:dev`, which includes Gateway regressions, deck construction/import, Core rule fixtures, actual-Chrome replay reconstruction, simulator/matrix parity/resume/limits and network-denied packaging. Changed Core mechanics and encounter presentation were checked again after the final focused fixes; the latest retained Chrome replay fixture also passes.

Still required for release: complete protocols A–H per card, further adversarial cross-card and terminal/prevention cases, actual-Chrome qualification across all new identities, AI hidden-information/strategy audits, Windows/Linux clean-machine runs, richer card-usage metrics and a qualified 10,000-game experiment. The preview and builder state these limits. The game server remains available locally; Jinteki and Docker were not started.

## Follow-up: offline search performance

The subsequent [search optimization pass](../../offline-engine-performance.md) enabled per-step lookup caching and continuous search in Node fast faceoffs. A matched 100-game/four-worker batch improved from 138.727 to 73.727 seconds, with all 83,830 decisions unchanged. All 14 identity trace baselines also match, and the full development check passes. This is separate from the historical 1,000-game soak above.
