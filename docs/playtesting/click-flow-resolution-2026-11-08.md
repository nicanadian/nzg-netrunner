# Click-flow fixes — 2026-11-08

Implemented all five areas from the [full-game click audit](click-audit-2026-11-08.md).

## Current player experience

1. **Useful timing by default.** Known Gateway breaker boosts that expire outside an encounter no longer interrupt turn starts, discards, or the opponent's actions. Optional Corp rez and Spin Doctor windows use card-aware timing: relevant defensive ice/upgrade rez remains prominent, while routine options live under Other paid abilities and on the card inspector. End action phase stays explicit. Hold priority is always visible in the action area and restores paid-ability stops for tactical play. Menu preferences independently disable boost skipping, streamlined timing, or enable encounter teaching pauses. Preference changes do not consume the current decision.

2. **Continuous installation.** Each normal Install action quotes its actual destination cost, including Corp ICE server cost. It commits the native install when the final quote still matches and the engine permits completion. Install options opens replacement/trash choices in an installation modal; required replacement, insufficient memory, changed quotes, resumed installations, and payment-source selection stay in that flow. Cancellation uses the engine's actual cancellation availability. Reading another card during a pending installation displays a direct Return to installation action, including while allocating credits. Trashing old ICE still removes hosted Botulus through native rules.

3. **Automatic effects with receipts.** Single Nico payouts, Spin Doctor draws, Manegarm approach effects, lone Luminal triggers, and targetless forced subroutine triggers resolve without acknowledgements. Native target/cost/prevention choices still stop. Competing effects retain ordering. Lone Precision Design and Send a Message triggers open their target/decline chooser directly; neither chooses a target nor accepts an optional effect for the player. Receipts and activity retain resolved changes.

4. **One quoted full-break action.** Break all displays the full current credit quote and advances only through presently legal native abilities and targets. It tracks actual native spending, including debits in forced continuations and card-credit payments, against the authorized budget. Changed costs and Corp responses pause the plan for review. Funding choices remain explicit at each native payment step. Stop cancels further automation without passing priority or refunding committed spending. Manual boosts, partial breaks, and target cancellation remain available. The completion receipt names the breaker and total credits spent.

5. **Less run bookkeeping.** Once all subroutines are broken, the default flow passes the remaining useless encounter window. Movement still offers Continue or Jack out. A sole breach target opens its access decision directly; multi-card ordering and steal/trash choices remain explicit. Encounter-review playback advances automatically unless the player enabled teaching pauses. An all-broken encounter never inserts a teaching stop. Reading cards or opening the menu defers assistance until the dialog closes.

All assistance submits ordinary versioned native choices and records them in the replay. The engine's payment, priority, legality, and target resolution remain authoritative. Assistance uses explicit Gateway card/window policies rather than treating every paid ability as irrelevant.

## Browser verification

The shared browser reported **“Preview automation click timed out”** after some clicks had dispatched. Those checks were stopped and the test tab was closed. Final verification used isolated local Chromium with the real application and worker, without touching the user's saved game.

Focused real-browser checks cover:

- normal Runner installs completing without a second confirmation;
- installation modal recovery, cancellation without spending, required/optional replacement, 390px and 320px layout;
- replacing Ansel with Whitespace and removing hosted Botulus;
- one-action full break spending exactly its displayed three-credit quote and showing the total receipt;
- explicit Overclock/pool funding before each debit, with the pool unchanged when Overclock pays;
- manual keyboard boost, partial-break target cancellation, and unchanged payment after cancellation;
- automatic boost-window progression, Hold priority restoring stops, and no retroactive passing when preferences change;
- automatic Spin Doctor draw receipt, optional Send a Message decline, and full accessed-card inspection.

Both audited games were then reproduced from fresh shuffles with their original seeds and strategic decisions, using actual DOM controls for every gameplay input. Narration delay alone was accelerated from 1400ms to 20ms in the test harness. No gameplay engine commands were invoked from page evaluation. This is an automated UI reproduction, not two new independent human playtests.

| Reproduced match | UI activations | Outcome | Native trace |
|---|---:|---|---|
| Runner | 59 | Runner wins, Corp–Runner 0–7 | All 108 choice records exactly match the audit |
| Corp | 89 | Corp wins, Corp–Runner 7–5 | All non-pass choices match; Whitespace rez moves from initiation to its relevant approach window, adding one native pass |

The original audit totals were 97 Runner / 107 Corp activations. Reading/navigation/setup differ slightly in the automated driver, and the original Corp audit includes a deliberate two-click recovery probe. Treat these totals as diagnostics, not a controlled percentage improvement. The targeted evidence is stronger: all 24 audited outside-run boost-only stops are eligible for native assistance, normal quoted installs need no second sidebar commit, and break plans no longer demand separate boost/break/finish acknowledgements.

## Checks and artifacts

- `npm test`: complete engine, rules, privacy, replay, reference, helper, and six recorded-game reconstructions.
- `node tests/click-flow.cjs`: replays both audit sessions and checks every audited boost stop, routine Corp stops, forced effects, relevant defensive rez, simultaneous effects, and install quote/replacement guards.
- `npm run test:interaction-browser`: focused real app/worker integration checks.
- `node scripts/retest-click-flow-browser.cjs`: complete UI reproductions; verifies outcomes, scores, native choices and zero page/engine errors.
- [Runner captured UI log and replay](../../eval/click-flow/runner-browser.json), [Corp captured UI log and replay](../../eval/click-flow/corp-browser.json).
- [Mobile install options](../../eval/click-flow/mobile-install-options.png), [completed break](../../eval/click-flow/break-complete.png), [funded break](../../eval/click-flow/funded-break.png).

Reference and recorded-game snapshots were regenerated for the added presentation metadata. Source event ledgers and native scenario choices were retained. Browser tests use the repository's existing local Playwright/Chromium installation. No screen-reader study or larger user study was performed.
