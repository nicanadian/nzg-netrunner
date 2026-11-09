# Tactical and newcomer retest

Reviewer: independent AI playtester, 2026-11-05. One complete Corp match was played through the Chrome extension's tab-scoped controls, never T3 or native desktop input. Earlier source-only hypotheses are distinguished from live findings below.

## Goals

- Play the Corp side, complementing the prior full Runner match.
- Install and rez ICE, distinguish installation costs from rez costs, and understand the threatened server during AI runs.
- Advance and score an agenda while tracking credits, clicks, advancement requirements, and points.
- Verify the player can choose between immediate economy and defending a future scoring opportunity without consulting source code.
- Finish a real match and export its replay through the game menu, if the browser session remains available.

## Focused scenarios

1. Install ICE on an empty server and then add a second ICE to the same server; compare displayed cost with the credit deduction.
2. Inspect an agenda and install it; ensure the UI does not claim agendas have a later rez cost.
3. Advance an agenda one step at a time, identify when scoring becomes legal, and verify that scoring itself does not consume a click.
4. During a Runner turn, observe which server is attacked and whether a rez choice makes the cost/consequence clear before commitment.
5. Use an installed economy asset and verify click/credit/hosted-counter consequences are visible.
6. Check a terminal result and exported replay against the actual observed outcome.

## Source-only hypotheses

- ICE install choices currently say `+ server install cost` rather than naming the numerical surcharge even when a server target is available. The engine may allow trashing existing ICE before the final payment, so a useful label must account for that intervening choice instead of presenting an unconditional final amount.
- Recent activity now shows five raw entries. Repeated generic spend/gain messages may still bury the important event from an AI turn; verify in a live game before proposing event grouping.
- Prior action-cost coverage concentrated on Runner access costs and Overclock. Corp advancement, scoring, protected-server install cost, and rez windows provide complementary coverage.
- `hint()` in `app/table.js` uses Runner-only instructions for both human sides: encounter says to use an icebreaker; movement says to jack out; access says to steal agendas. A Corp viewer should instead receive defense/timing-window guidance. This is a directly inspected source defect; it has not been reproduced in Chrome in this pass.

## Live Chrome evidence

At the initial checkpoint, browser work was pending; the completed extension session is recorded below.

Browser work was subsequently suspended by the root because native input from another tester interfered with the user's foreground browser. This reviewer issued no browser/native-input calls. Resume only after the root establishes tab-confined Chrome control.

## Extension-only Chrome session

The root subsequently established the Chrome extension connection. This reviewer opened an isolated test tab at `http://localhost:5175/` and used only tab-scoped browser locators/snapshots/screenshots. No native desktop controls were used.

The Corp opening contained Seamless Launch, Brân 1.0, Palisade, Tithe, and Superconducting Hub. Tithe installed at HQ and Palisade on a new remote each consumed one click and no credits. Installing Superconducting Hub in that remote clearly said `Install facedown`. On turn 2, one normal advancement plus Seamless Launch produced three advancement counters; scoring the Hub retained the remaining click, added one point, drew two cards through its optional ability, and offered identity recovery from Archives. These flows worked visibly.

On turn 3, two normal advancements plus Seamless Launch prepared Offworld Office on the final click. **New observed tactical-design defect:** the rail highlighted Continue in gold while the available `Score agenda Offworld Office` action was secondary. A newcomer following the visual emphasis could miss the immediate scoring window. Screenshot: [before scoring priority fix](../screenshots/tactics-score-choice.jpg). Root was notified; undo restored the pre-score position for a same-state comparison after the patch.

## Completed match and retest

- **Corp won 8–3 on displayed turn 9.** Exported replay: `tests/fixtures/tactics-chrome-replay.json`, seed `4b8b775b-60c2-40be-8a90-264649a3139c`.
- The final replay contains **69 actual player decisions and 435 engine actions**. Menu/submenu clicks and the two decisions undone for comparison are not counted in that replay. The UI was used for every decision; no game-state injection or direct engine calls drove the browser match.
- The game was played toward a strategic Corp win, scoring five agendas; it did not use repeated credit actions to force a terminal outcome. It exercised 10 installs, 12 advances, 4 played operations, 5 scores, 8 trigger choices, 1 explicit rez, and the associated continuation windows.
- Reload → Resume restored the exact Offworld Office pre-score position (zero credits, zero clicks, four advancement, one scored point). **The patched Score action is now gold and Continue is secondary.** [Same-state after image](../screenshots/tactics-score-choice-after.jpg).
- Adding Brân 1.0 outside Palisade at Remote 0 presented the improved optional-trash explanation. Retaining Palisade and choosing Finish install deducted one credit and one click. The final button still omitted that numerical surcharge. [Install-cost screenshot](../screenshots/tactics-install-cost.jpg). Sent root the concrete suggestion to display the current cost at the final commitment, after optional trashing.
- Runner stole Send a Message from undefended R&D. Its on-steal ability correctly offered Corp a free ICE rez; choosing Brân 1.0 preserved seven credits and removed its UNREZZED badge. Later installing Palisade on R&D closed the exposed central.
- Spin Doctor showed a zero-credit rez action, then drew two cards through its trigger. Optional Spin Doctor windows required repeated Continue choices at turn boundaries. A small bounded script passed only already-observed Continue windows, stopping for any other tactical choice; every step took a fresh DOM snapshot.
- The winning screen reported the actual eight agenda points and removed gameplay actions. The ten-card hand remained visibly distinguishable across the bottom. [Completed game](../screenshots/tactics-corp-victory.jpg).
- Menu → Export game replay downloaded the file successfully. The browser API's download wait timed out, but the matching newly downloaded replay was recovered and deterministically replayed through `checkState` and `checkSnapshot`: Corp 8, Runner 3, no diagnostics.

## Regression coverage added

The root separately reproduced Botulus disappearing after being installed on concealed ICE. `tests/hosted-privacy.cjs` adds a headless regression using an arranged board followed by the real adapter install-choice path. It verifies the target label identifies HQ without revealing the ICE title, the host remains concealed, the hosted Botulus and its virus counter remain visible, and installation costs two credits/one click. The patched adapter passes. Loading the previous visibility-branch behavior in the isolated test process fails; production files were not changed to perform that comparison.

## Coverage limits

This match did not encounter a paid ICE rez or a full defended-run subroutine sequence; the AI chose other lines. It therefore does not verify every defense/encounter hint in live play. Asset click abilities, optional multiselect, and narrow-viewport behavior remain covered by other reviewers or tests, not this session. The one successful strategy is not an AI-strength benchmark.


## Final install-payment finding resolved

The adapter now retains the pending upstream install context and recomputes the final quote after optional trashing. `tests/install-cost.cjs` passes three comparisons of displayed metadata to actual payment: keep existing ICE (1 credit / 1 click), trash existing ICE (0 credits / 1 click), and a free effect install (0 credits / no click). The visual reviewer additionally verified Chrome displayed and charged 1 credit / 1 click when installing Ansel over Palisade at HQ. Screenshot: [final install payment](../screenshots/chrome-final-install-cost.jpg).
