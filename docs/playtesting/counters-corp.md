# Corp counters Chrome playtest

Date: 2026-11-05. Participant: independent AI playtester, not a human participant. Actual Google Chrome extension browser. Dedicated local origin http://localhost:5174; viewport was not modified. Focused sessions, not a completed game.

## Coverage and exact decisions

Income fixture imported 5 existing decisions. Played **17 new legal decisions**, exported final replay has 22 decisions: eval/counters/corp-income-playtest-final.json. New choices: Nico income; Hedge Fund; install Tithe protecting R&D; gain credit; Nico income; purge; Nico final income; install Regolith Mining License; gain credit twice; rez Regolith; trigger Send a Message stolen ability; choose Tithe free rez; Regolith income twice; draw; choose Runner gains 6 credits for Wildcat Strike. Stopped during Tithe encounter on turn 5, Corp pool 25, Regolith 9 hosted, Corp clicks 0, Runner points 6. No win/loss claimed.

Advancement fixture imported 4 existing decisions. Played **4 new legal decisions**, final replay has 8: eval/counters/corp-advance-playtest-final.json. Advanced Superconducting Hub three times, then scored. Stopped at scoring-trigger choice. Also explored a fresh Corp opening before fixture import: Hedge Fund, ice install, advancing Orbital Superiority twice, Palisade rez and subroutine. This exploratory session is excluded from the replay-backed decision totals.

File chooser import was initially blocked by Chrome extension Allow access to file URLs. No browser setting was changed. Parent added a normal Paste game replay interface; fixtures were loaded using the visible textarea and Restore replay, using the regular replay validator. Final replays were exported by normal Menu > Export game replay and copied from Chrome Downloads.

## Observations

- Nico Campaign initially displayed a gold CR stack marked 9, visibly separate from the pool coin marked 5. Clicking Use ability transferred 3: hosted 9→6 and pool 5→8, clicks stayed at 3. Last resource change explicitly showed both +3 pool and −3 hosted credits with card name/server. This summary remained when inspecting Nico, including its full rules and a written 6 hosted credits total. Evidence: corp-nico-nine.png and corp-nico-six.png.
- Subsequent Nico income changed 6→3 and pool 13→16. Final income changed pool 16→19, trashed Nico when empty, and drew its card plus mandatory turn draw. Last resource change said Nico Left play. Evidence: corp-nico-empty.png.
- Regolith rez spent 2 pool credits and loaded 15 hosted credits. Its click ability changed pool 19→22, hosted 15→12, clicks 3→2, all three listed together. Second activation left 9 hosted. Evidence: corp-regolith-twelve.png.
- Gold face-up click markers visibly turn to dark spent backs; Corp shows exactly three and Runner four. Counters were readable at the shared 1771×969 screenshot resolution. Singular 1 click copy was fixed during this test and observed after reload.
- Hub ADV counters used a cyan diamond and explicit ADV tag; separate from gold CR and red VIR. Advancing three times changed ADV 0→1→2→3, pool 5→4→3→2, clicks 3→2→1→0, and agenda score stayed 0. At 0 clicks, Score agenda became available. Scoring changed score 0→1 with no extra click spent. Clear separation of advancement, action cost, and score. Evidence: corp-hub-adv-one.png, corp-hub-adv-two.png, corp-hub-scored.png.
- Palisade rez in exploratory session reduced pool 8→5 without a click cost; fire subroutine was a separate UI decision. Tithe free rez from Send a Message did not spend pool credits.

## Findings and remaining polish

1. **Low: Hansei Review instruction is incorrect.** Playing Hansei Review displayed Choose cards to discard until your hand is within its limit even though its effect requires trashing one card irrespective of hand size (observed HQ5/6). Parent notified.
2. **Design limit: rapid AI automation aggregates steps.** Purging from 3 clicks ran through AI turn and returned to 3 clicks. Persistent summary showed only net Fermenter 2→1 (purge to zero plus turn-start growth), so neither all-three click spend nor virus-clearing moment is preserved. Summary accurately labels itself net changes; a later event-level receipt or paced action replay could teach this better. Parent notified.
3. **Low: long labels wrap in narrow receipt column.** Superconducting Hub · Remote 0 root plus advancement count wraps across several lines; legible, but visually dense. Counters on the card remain clear. No blocking overlap observed.
4. **Potential polish: generic Use ability does not teach timing/cost upfront.** Nico turn-start ability label omits Take 3 credits; Regolith sidebar label includes effect but omits its 1-click cost. Current count feedback after activation is strong. A concrete effect/cost label would help a new player distinguish free automatic income from click income before committing.

No counter arithmetic defect found in the focused checks. This is AI functional and design testing, not evidence of human usability or a full-game balance test.

## Retest after action-before-AI feedback changes

Repeated focused checks in actual Chrome on isolated port 5174, using normal Paste replay. No viewport changes, no extra final replay required.

- Restored income fixture, collected Nico to pool8/hosted6 at 3 clicks, then **double-clicked Purge**. Immediate DOM snapshot showed AI THINKING, Corp0 clicks, Fermenter0 virus counters, receipt Corp −3 clicks/0 left and Fermenter −1/0. This directly verifies public post-action feedback before automatic effects. Exactly one purge/spend event appeared; no duplicate payment from rapid double click.
- Eventual Turn3 snapshot showed 3 clicks and Fermenter1, with TWO persistent groups: Your action preserved −3 clicks and purge-to-zero; After automatic effects showed refreshed clicks, +1 virus growth, and AI credits/score changes. This resolves finding 2 above for the tested purge. Screenshot: eval/counters/corp-purge-retest-final.png.
- Verified a normal no-resource Continue window by installing Manegarm at HQ and spending remaining clicks on credits. Continue advanced Action Phase to Discard Phase: Response while the +1 pool / −1 click spend receipt persisted. Read-only rendered click DOM then had class click-pip used without just-spent, demonstrating the old flip was not reapplied. Screenshot: eval/counters/corp-continue-retest.png. Nico Turn3 had a forced ability, so the Continue check was a separate natural timing window, not the purge receipt itself.
- Hansei Review now says Choose the card or cards required by this effect, instead of the hand-limit instruction. Verified in a fresh import of advancement fixture; finding 1 above is resolved.

Remaining potential polish from initial report: long labels wrap densely; effect/cost names in generic Use ability actions can still explain more before activation. The action/automatic split is a substantial clarity improvement: a new player can see both the actual purge and later growth instead of only its net result.
