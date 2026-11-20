# Bundled deck audit · 16 November 2026

All **58 selectable decks** pass the local construction validator, with no missing full-resolution artwork. The final **1686-game screen** finished with **1686 completed, 0 failures**. Two Vantage Corp lists received new funded revisions. The originals remain exact, in the card-testing group.

This is an implementation and playability screen, not a claim that every list is equally strong or enjoyable. Automated agents can mishandle an otherwise good deck. Six games per pairing are enough to expose some failures, not to rank close matchups.

## Coverage and method

- gateway-v1: 15 decks, 56 Runner/Corp pairings, 336 games.
- core-v1: 21 decks, 108 Runner/Corp pairings, 648 games.
- vantage-preview-v1: 22 decks, 117 Runner/Corp pairings, 702 games.

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

- 2: TypeError: Cannot read properties of undefined (reading 'rezzed')
- 18: ReferenceError: AddTempBonusClicks is not defined
- 39: bestInstallOption failed to find any desired install options with this optionList:
- 12: preferred option not matched with the above optionList and preferred:
- 3: .responseOnRunSuccessful on Transfer of Wealth should not be automatic (it fires responseOnTakeTags which might require a decision)
- 2: No cached run-path alternative
- 1: Error: No legal choices in Scrounge (Runner 1.3*)
- 2: Path specifies nothing but a choice is required (optionList above)

## Two targeted deck revisions

**Built to Last · defensive economy (weyland-vantage-tools-v2):** replace one Government Subsidy, one Malapert Data Vault and one Esca with three Hedge Funds. It remains 40 cards / 18 agenda points and uses 14/15 influence. Cards classified as economy with printed cost no greater than the opening five credits rise from 2 to 5. Exact probability of seeing none in the initial five drops from 76.3% to 49.3%, ignoring mulligans, identity effects and extra draws. This measures affordability, not a guaranteed payout.

**Editorial · funded defenses (editorial-play-v2):** replace three Scapegoats and three Flood the Markets with three Palisades and three Hansei Reviews. It remains 45 cards / 20 agenda points and uses 15/15 influence. Classified economy rises from 9 to 12 copies; low-cost ice with printed end-the-run text rises from 3 to 6.

A separate paired experiment tested each original and revision against four recommended Runners over 16 held-out seeds: **256 games, all completed**. The share of Corp action-phase decisions spent taking a basic credit fell:

| Deck | Original | Revised | Corp wins, original → revised |
|---|---:|---:|---:|
| Built to Last | 21.2% | 17.0% | 31/64 → 34/64 |
| Editorial | 42.4% | 18.0% | 14/64 → 22/64 |

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
| System Gateway | René “Loup” Arcemont | Play | 40 | 6/15 | 48 | 58.3% | 14.3% | Construction and runtime pass. No large economy warning in this screen. |
| System Gateway | Zahya Sadeghi | Play | 40 | 15/15 | 48 | 66.7% | 6.1% | Construction and runtime pass. No large economy warning in this screen. |
| System Gateway | Tāo Salonga | Play | 40 | 12/15 | 48 | 64.6% | 12.5% | Construction and runtime pass. No large economy warning in this screen. |
| System Gateway | Haas-Bioroid: Precision Design | Play | 44 | 7/15 | 42 | 57.1% | 6.0% | Construction and runtime pass. No large economy warning in this screen. |
| System Gateway | Jinteki: Restoring Humanity | Play | 44 | 9/15 | 42 | 33.3% | 16.4% | Construction and runtime pass. No large economy warning in this screen. |
| System Gateway | NBN: Reality Plus | Play | 44 | 5/15 | 42 | 50.0% | 11.8% | Construction and runtime pass. No large economy warning in this screen. |
| System Gateway | Weyland Consortium: Built to Last | Play | 40 | 9/15 | 42 | 42.9% | 12.3% | Construction and runtime pass. No large economy warning in this screen. |
| System Gateway | Tāo Salonga — burst income | Play | 40 | 14/15 | 48 | 52.1% | 12.1% | Construction and runtime pass. No large economy warning in this screen. |
| System Gateway | Tāo Salonga — two Mayflies | Play | 40 | 12/15 | 48 | 60.4% | 14.0% | Construction and runtime pass. No large economy warning in this screen. |
| System Gateway | restoring-humanity-v2 / Planogram instead of Clearinghouse | Play | 44 | 5/15 | 42 | 19.0% | 15.4% | Weak in this bot screen; main Restoring Humanity variant is the safer first pick. |
| System Gateway | René “Loup” Arcemont — burst income | Play | 40 | 10/15 | 48 | 66.7% | 18.3% | Construction and runtime pass. No large economy warning in this screen. |
| System Gateway | Zahya Sadeghi — two Mayflies | Play | 40 | 11/15 | 48 | 54.2% | 10.5% | Construction and runtime pass. No large economy warning in this screen. |
| System Gateway | Haas-Bioroid: Precision Design — Bioroids & big agendas | Play | 40 | 4/15 | 42 | 42.9% | 5.4% | Construction and runtime pass. No large economy warning in this screen. |
| System Gateway | NBN: Reality Plus — Tag & score | Play | 40 | 3/15 | 42 | 38.1% | 16.0% | Construction and runtime pass. No large economy warning in this screen. |
| System Gateway | Weyland Consortium: Built to Last — Heavy ice & threats | Play | 40 | 2/15 | 42 | 33.3% | 15.0% | Construction and runtime pass. No large economy warning in this screen. |
| Gateway + Elevation | Ryō “Phoenix” Ōno: Out of the Ashes | Play | 45 | 17/17 | 72 | 52.8% | 17.3% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation | Haas-Bioroid: Precision Design | Play | 44 | 15/15 | 54 | 75.9% | 12.2% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation | [NSG Core] Bowel Movements | Play | 40 | 15/15 | 72 | 50.0% | 16.1% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation | [NSG Core] Prick Thyself | Play | 45 | 15/15 | 72 | 45.8% | 11.5% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation |  [NSG Core] Tickets, please | Play | 40 | 15/15 | 72 | 55.6% | 11.3% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation |  [NSG Core] Shootin' 'n' Lootin' | Play | 45 | 15/15 | 72 | 56.9% | 8.3% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation | [NSG Core] Professional Opportunities | Play | 45 | 15/15 | 72 | 48.6% | 16.0% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation | [NSG Core] Flow and Ebb | Play | 40 | 15/15 | 72 | 47.2% | 8.6% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation |  [NSG Core] Enthusiasm | Play | 45 | 15/15 | 72 | 37.5% | 6.2% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation |  [NSG Core] Sabbatical | Play | 45 | 15/15 | 72 | 52.8% | 9.3% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation | [NSG Core] Agency | Play | 49 | 15/15 | 54 | 13.0% | 34.1% | Official sample with weak bot results. Advanced human review; list preserved. |
| Gateway + Elevation | [NSG Core] Fashion Lab | Play | 49 | 15/15 | 54 | 38.9% | 32.5% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation | [NSG Core] Hidden Funds | Play | 44 | 15/15 | 54 | 75.9% | 11.6% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation | [NSG Core] Peculiarity | Play | 49 | 15/15 | 54 | 53.7% | 37.4% | Frequent basic income under this policy; inspect economy pacing in human play. |
| Gateway + Elevation | [NSG Core] Glyph of Warding | Play | 49 | 15/15 | 54 | 38.9% | 16.9% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation | [NSG Core] Fine Print | Play | 44 | 15/15 | 54 | 59.3% | 31.5% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation | [NSG Core] Not so subtle | Play | 49 | 15/15 | 54 | 61.1% | 22.7% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation | [NSG Core] Gimbatul | Play | 49 | 15/15 | 54 | 40.7% | 22.9% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation |  [NSG Core] Brick Stack | Play | 44 | 15/15 | 54 | 57.4% | 26.3% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation | [NSG Core] Pork Chops | Play | 49 | 15/15 | 54 | 53.7% | 29.4% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation | [NSG Core] Quick Returns | Play | 48 | 15/15 | 54 | 35.2% | 31.7% | Official sample: construction and runtime pass; advanced/experimental AI. |
| Gateway + Elevation + Vantage | Tāo · Stealth foundation pilot | Play | 40 | 8/15 | 78 | 64.1% | 15.4% | Construction and runtime pass. No large economy warning in this screen. |
| Gateway + Elevation + Vantage | Built to Last · Bad publicity pilot | Test pilot | 40 | 9/15 | 54 | 64.8% | 15.4% | Card-testing snapshot. Use a recommended play deck for a normal game. |
| Gateway + Elevation + Vantage | Vic · Central pressure | Test pilot | 45 | 15/15 | 78 | 66.7% | 16.4% | Card-testing snapshot. Use a recommended play deck for a normal game. |
| Gateway + Elevation + Vantage | Tāo · Stealth console | Test pilot | 40 | 14/15 | 78 | 59.0% | 18.4% | Card-testing snapshot. Use a recommended play deck for a normal game. |
| Gateway + Elevation + Vantage | Built to Last · Defensive tools | Test pilot | 40 | 15/15 | 54 | 37.0% | 24.0% | Card-testing snapshot. Use a recommended play deck for a normal game. |
| Gateway + Elevation + Vantage | Built to Last · defensive economy | Play | 40 | 14/15 | 54 | 68.5% | 19.3% | Revised: opening burst income added; preferred over v1. |
| Gateway + Elevation + Vantage | Restoring Humanity · Ambushes | Play | 44 | 9/15 | 54 | 63.0% | 18.6% | Construction and runtime pass. No large economy warning in this screen. |
| Gateway + Elevation + Vantage | Precision Design · Tempo and recycling | Play | 40 | 6/15 | 54 | 66.7% | 9.6% | Construction and runtime pass. No large economy warning in this screen. |
| Gateway + Elevation + Vantage | Loup · Tailored economy | Play | 40 | 9/15 | 78 | 69.2% | 14.9% | Construction and runtime pass. No large economy warning in this screen. |
| Gateway + Elevation + Vantage | Precision Design · Reallocation | Test pilot | 40 | 6/15 | 54 | 55.6% | 10.0% | Card-testing snapshot. Use a recommended play deck for a normal game. |
| Gateway + Elevation + Vantage | Loup · Vantage interactions | Test pilot | 45 | 12/15 | 78 | 61.5% | 9.4% | Card-testing snapshot. Use a recommended play deck for a normal game. |
| Gateway + Elevation + Vantage | Vic · Vantage interactions | Test pilot | 45 | 12/15 | 78 | 48.7% | 16.9% | Card-testing snapshot. Use a recommended play deck for a normal game. |
| Gateway + Elevation + Vantage | Hiram · Vantage interactions | Test pilot | 45 | 6/15 | 78 | 39.7% | 16.5% | Card-testing snapshot. Use a recommended play deck for a normal game. |
| Gateway + Elevation + Vantage | Precision Design · Vantage interactions | Test pilot | 45 | 6/15 | 54 | 25.9% | 30.1% | Card-testing snapshot. Use a recommended play deck for a normal game. |
| Gateway + Elevation + Vantage | Méliès U · Vantage interactions | Test pilot | 45 | 9/15 | 54 | 31.5% | 41.4% | Card-testing snapshot. Use a recommended play deck for a normal game. |
| Gateway + Elevation + Vantage | Editorial Division · Vantage interactions | Test pilot | 45 | 6/15 | 54 | 25.9% | 39.9% | Card-testing snapshot. Use a recommended play deck for a normal game. |
| Gateway + Elevation + Vantage | Built to Last · Vantage interactions | Test pilot | 45 | 9/15 | 54 | 18.5% | 40.3% | Card-testing snapshot. Use a recommended play deck for a normal game. |
| Gateway + Elevation + Vantage | Vic · central pressure | Play | 45 | 13/15 | 78 | 56.4% | 17.1% | Construction and runtime pass. No large economy warning in this screen. |
| Gateway + Elevation + Vantage | Hiram · funded rig | Play | 45 | 9/15 | 78 | 56.4% | 16.6% | Construction and runtime pass. No large economy warning in this screen. |
| Gateway + Elevation + Vantage | Méliès U · campaign control | Play | 45 | 15/15 | 54 | 42.6% | 17.2% | Construction and runtime pass. No large economy warning in this screen. |
| Gateway + Elevation + Vantage | Editorial · campaigns & tags | Test pilot | 45 | 12/15 | 54 | 13.0% | 36.9% | Card-testing snapshot. Use a recommended play deck for a normal game. |
| Gateway + Elevation + Vantage | Editorial · funded defenses | Play | 45 | 15/15 | 54 | 33.3% | 23.5% | Revised: more income and affordable stopping ice; preferred over v1. |

## Reproduction

Run node scripts/audit-all-decks.cjs to validate and prepare matrix specs. Run node scripts/netrunner.cjs bench <pool-matrix.json> --out <fresh-directory> for each matrix. Set NR_DECK_AUDIT_RUNS to that directory's parent and run node scripts/audit-all-decks.cjs --summarize; then node scripts/report-deck-audit.cjs creates this report. The reporting script expects this dated audit's original baseline/tuning artifacts and final run directory; it asserts every matrix is finished, hashes match, and historical deck documents remain exact. Use fresh output directories after engine changes; original job replays require their frozen runtime.

Final engine fingerprint: d8ca9a11d7e9724aa0636b608763aa8c7265d22404dbcb0467dd721496b10dbd. No public release or publish was performed.
