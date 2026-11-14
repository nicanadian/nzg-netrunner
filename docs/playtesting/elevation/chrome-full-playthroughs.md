# Elevation: full UI playthroughs in existing Chrome

Date: 2026-11-13. Browser: user's existing extension-backed Google Chrome profile (`Your Chrome`), through the installed official Chrome client in `node_repl`. No headless or shared-browser playthroughs were used for this report.

## Completed games

| Human side | Matchup | Result | Final turn | Exported native choices |
| --- | --- | --- | --- | --- |
| Runner | Phoenix vs Precision Design AI | Corp wins 7–0 | 12 | 223 |
| Corp | Precision Design vs Phoenix AI | Corp wins 7–2 | 12 | 156 |

Gameplay decisions were made with visible AX/Playwright UI controls. Native engine fixtures were used separately for debugging and regression tests, not to advance these browser games. Both games reached their terminal screens without a gameplay crash or concession. Both original exports reconstruct to the same terminal scores/turns using the updated engine. Native choice counts include recorded automatic transitions; they are **not** mouse-click counts.

## Coverage

Runner: Keep, card inspection, direct modal installs, economy and resource counters, Overclock funding, split trash payments, Carmen breaks, bioroid click breaks, core damage and hand-limit reduction, Phoenix successful-run reward, HQ/R&D/remote runs, Jailbreak multi-access, Rising Tide vs Kessleroid, Botulus hosting/counter expenditure, Scrounge heap installation, Lie Low, Side Hustle payout/draw/trash, discard, reload/resume, game end and replay export.

Corp: Mulligan, central/remote ice installations, Spin Doctor rez/draw, agenda installs/advancement/scoring, Precision Design recursion, Mercia end-action timing/decline/discount/relocation, Project Ingatan overadvancement/counter/discard-end Archives installation, separate outer/inner ice rez pauses, affordable pass warning/back-out, explicit unaffordable Ansel warning, Flyswatter purge, Brân defense, opponent accesses/steals, game end and replay export. Undo returned the completed Corp game to the last scoring choice; scoring again restored the win. UI paste import restored the Runner terminal result.

## Findings fixed and retested

1. **Mercia charged the wrong ice install cost.** Gateway's native ice cost function bypassed install modifiers. The Core compatibility path now discounts Mercia's marked transaction in both quote and payment. Native regression covers no click, payment, relocation and expiry. In Chrome, installing Flyswatter outside one ice cost 0; installing Bumi outside two ice cost 1.
2. **Unrelated Spin Doctor movement stops.** Core Corp priority during Run 4.3 wasn't classified as a paid-ability window. It now places unrelated abilities under the secondary controls and offers a routine pass to streamlining. Runner jack-out remains explicit. Chrome resume went directly from the cleared outer Brân to Ansel's rez decision, including its unaffordable warning.
3. **Redundant forced-effect clicks.** Streamlining now records/resolves Flyswatter's mandatory purge, Scrounge's mandatory post-install transition and an empty optional program-return step, and Lie Low's sole draw-four outcome. Native tests retain real tag/draw and eligible heap-program choices. Chrome retests of the original pre-play positions confirmed direct return to actions after Lie Low and after Scrounge's installation.
4. **Effect wording.** Explicit native effect labels survive continuation rendering; full-control Lie Low says Draw 4 cards. A sole Scrounge Done option says Skip optional program return. Flyswatter's on-rez trigger identifies the purge. End-action/end-discard response headings no longer imply ordinary actions or additional discarding.
5. **Remote number formatted twice in resource feedback.** Raw receipt labels now cross the display-number boundary once. Actual placement was correct throughout; the resource-change heading was wrong. Chrome verified Bumi → Remote 2 in both receipt and resource feedback after the fix. Read-before-choosing accessible labels also use displayed remote numbers.
6. **Incorrect set attribution.** Elevation card details and the preview deck-library heading now identify Elevation. Chrome verified Flyswatter and Project Ingatan footers.
7. **Incorrect grouped Double-event click quote.** A Play group with two Double events claimed one click. Core groups now show a common actual cost or defer differing costs to card selection. Chrome verified Play 2 clicks · 1 credit · 2 choices for Lie Low/Scrounge; native coverage includes mixed click costs.

## Click/UX observations

- Normal grip-card installation took card inspection + Install, with no hidden sidebar confirmation afterward.
- Scrounge's sampled flow fell from five clicks (Play, program, confirm install, Scrounge trigger, Add/Done) to three (Play, program, confirm install). Meaningful replacement/target choices are retained.
- Lie Low no longer needs its extra generic Finish click when draw-four is the sole legal outcome. Tagged Runner alternatives remain a decision.
- Flyswatter's mandatory purge no longer adds an extra confirmation after rez when streamlining is on.
- An unrelated Spin Doctor no longer adds a Corp Continue click in the sampled movement window. Hold priority remains the opt-out for routine passing.
- The fixed run footer worked and kept Continue/Jack out separate from paid abilities. An early shortened accessibility read omitted that footer; full DOM/screenshot inspection confirmed it was present. This was not a missing-control bug.
- **Remaining payment friction:** the sampled Carmen Break all with Overclock required three funding confirmations (2 + 1 + 1 credits) after selecting the plan. Correct amounts and sources were preserved, but choosing a funding policy once per plan is a possible future improvement. It is not implemented here.
- The Corp's final score was reflected in the win screen, but the last resource-change panel could still show the previous advancement while score resolution completed. The terminal state and replays were correct; no score-receipt redesign was made in this pass.

The browser tool's download-event wait timed out once even though Chrome successfully downloaded the export. Recovery used the actual downloaded file. A few playback controls expired between observation and a click; current state was re-read rather than repeating stale controls. These were automation issues, not recorded gameplay crashes.

## Evidence

- `chrome-runner-replay.json`, `chrome-corp-replay.json`: original complete exports.
- `chrome-runner-ui-trace.json`, `chrome-corp-ui-trace.json`: retained accessibility observations and partial action annotations. These are not exhaustive click counters.
- `chrome-runner-complete.png`, `chrome-corp-complete.png`: terminal screens.
- `chrome-corp-rez-warning.png`: affordable ice-pass warning.
- `chrome-lie-low-fixed.png`, `chrome-scrounge-fixed.png`: focused corrected flows.

Validation passed: `NR_TEST_SEEDS=1 npm test`, `npm run test:core-foundation`, `node tests/core-chrome-replays.cjs`, and `git diff --check`. The native regressions include Mercia payment, mandatory/optional distinction, movement passing/jack-out safety, explicit labels and remote-number formatting. No headless browser tests were run during this playtest pass.

This is desktop UI coverage of the first curated matchup. It does not certify all 82 Elevation cards, all seeds, AI strategic quality, or a full mobile playthrough. The per-card expansion audit remains in progress.
