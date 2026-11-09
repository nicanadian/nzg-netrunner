# Tāo Chrome extension playtest

Independent AI-operated tester, 6 November 2026. This is an actual fresh lobby-to-terminal browser game through the Chrome extension, not recruited human feedback or an engine-generated match. The installed Chrome plugin's trusted `node_repl` service controlled an owned tab at `http://127.0.0.1:5178`. All moves used rendered UI controls. No application, rules, or vendor files were edited.

## Complete game and evidence

- Match: Tāo Salonga vs Haas-Bioroid Precision Design; Runner controlled by tester.
- Seed: `355fd498-00a1-4bd6-8e99-68cefb2d8086`; rules `26.03-local-2`.
- Full normal UI export: `eval/run-drawer-panel/tao/full-game.json`, 380 recorded human decisions.
- Terminal UI: turn 22, Runner wins because Corp attempted to draw from empty R&D after rezzing Spin Doctor. Final points Runner 2–Corp 6. `terminal.png` captures the actual result.
- The tester actively built and ran through turn 9; afterward an explicit economy/pass policy completed the natural match. This is interface and lifecycle coverage, not competitive or balance evidence. UI-driven repeated actions were batched with a fresh DOM observation before each choice.
- Default Chrome viewport was used; screenshots are 1771×927. No phone-width or keyboard-only pass was performed in this game.

All paths below are relative to `eval/run-drawer-panel/tao/`.

| Scenario | Actual interaction and observed result | Evidence |
|---|---|---|
| HQ access | First run stole Luminal Transubstantiation for 2 points. Compact accessed-card summary and separate Steal action were clear. No invented Finish/Jack control was present during mandatory steal. | `first-access.png`, `turn1.json` |
| Remote access | Ran Remote 1, accessed Nico Campaign and paid 2 credits to trash it. Trash cost and available credits were visible; Finish accessing was separately pinned. | Full export |
| Mismatched rig | Unity vs Palisade explicitly said Cannot break this ice and explained Decoder/Barrier mismatch. Its legal boost remained available. Read Unity opened full text and the same boost action; closing returned to the encounter. Passed priority; Palisade's end-run subroutine fired and the run ended. | `palisade-mismatch.png` |
| Install from card | Installed Pantograph through its hand-card inspector, quoting 1 click and 2 credits. Installed Echelon while retaining Unity by choosing Finish install rather than trash. | Full export |
| Pantograph response | Natural Send a Message score on Corp turn 8 triggered Pantograph. Its guide explained already gained credit, no-click install, normal credit/memory cost. Installed Cleaver for 3 credits and no click. | Full export |
| Tāo source/target connection | Same score triggered Tāo. Selected Palisade using sidebar, then Ansel directly on board; sidebar selection count changed 1→2 and Confirm became enabled. Swap moved both cards to the intended servers. Concealed candidates remained concealed. | `swap-result.png` |
| Expensive vs click break | Turn 9 R&D run encountered Brân. Cleaver quote correctly said 8 credits to break all with that program alone, only 6 available. Used bioroid click alternative instead. Opened target choices, cancelled, observed unchanged 6 credits/3 clicks, reopened and broke subs 2, 3, then 1. Header clicks changed 3→0 and unresolved count 3→0 with corresponding numbered Broken states. | `bran-options.png`, `bran-all-broken.png` |
| Correct breaker and exact cost | Next encountered swapped Ansel. Echelon quote said 3 credits to match and 6 total to break all. Boosted for 3, then paid 1 each for subroutines 3, 1, 2: pool 6→0, Echelon strength 3→5, all Ansel subs broken. Reached R&D and accessed Brân, then finished access. | Full export, `turn9.json` |
| Terminal cleanup | At actual deck-out terminal, drawer shrank to normal rail, You win and reason appeared, run continuation disappeared. | `terminal.png` |

## Findings

### P2 — Pantograph's decline-only action is labeled Install

On Corp turn 10, Pantograph gained a credit but no grip card was affordable. The single action rendered **Install** with detail **Keep the gained credit and skip the optional install**, followed by an arrow. Clicking it correctly declined the optional install. The heading and explanation are good, but the primary action contradicts the actual choice. Prefer Continue without installing / Keep credit. Evidence: `pantograph-decline-install-label.png`. At other scores with multiple options, the decline was correctly named Continue without install.

### P2 — Forced encounter review pauses even after every subroutine is broken

After spending the final credit to break Ansel's final subroutine on turn 9, playback paused on **No available response to Ansel 1.0** and explained **0 unbroken subroutines will resolve in order**. All three subs visibly had Broken markers. Skip to decision continued normally to Movement. This creates a needless warning-shaped interruption after successful play. Skip this review when zero unbroken subroutines remain, or positively describe the successful full break. Evidence: `zero-unbroken-review.png`.

### P2 — Swap resource receipt uses a different remote number

The sidebar, board, choices and action history called the destination **Remote 3**. The persistent last-resource-change receipt said Ansel moved **Remote 2 ice 1 → R&D ice 2**, and Palisade moved to **Remote 2 ice 1**. The actual swap was correct; its location feedback was inconsistent. Evidence: `swap-result.png` and turn-8 swap in full export.

### P3 — Initiation stage can be labeled Movement for a server with no ice

During the Remote 1 run, the persistent human initiation decision displayed stage pill **Movement**, heading **Initiation**, and a movement hint about continuing/jacking out, while the footer correctly offered **Pass priority**. This was not merely a transient thinking frame: the same combination persisted at the human decision. Protected R&D initiation correctly displayed Initiation. Prefer deriving stage/hint from the current timing phase before movement flags.

### P3 — Legal boosts on incompatible programs still compete with useful actions

With Unity, Echelon and Cleaver installed, Brân's action area put two incompatible-program rows and their boost buttons before Cleaver and the click-break option. Type mismatch messages were clear, and at the large default viewport all options fit above the footer. A novice could still spend time on a legal boost that cannot help break the current ice. Consider sorting immediately useful matching breakers and ice click abilities ahead of unrelated legal abilities; keep legality intact. This is a usability recommendation, not an observed illegal move.

## Overall experience and limits

The new layout kept the current ice and numbered unresolved threats visible while exploring target choices. The pinned footer made Pass priority, Continue the run and Finish accessing distinct. The cancelled target choice had an explicit no-payment explanation and preserved resources. Drawer card inspection and board selection exposed the same actions and selection state, making their relationship concrete.

Outside runs, installed breakers offered strength boosts during many paid windows; passing those windows added substantial interaction overhead throughout both turns. These were legal choices, not an autoplay or click-accounting failure. The completion policy makes the large decision count unsuitable for estimating typical skilled-player game length.

No virus host/counter action or mobile sheet was tested in this match. The full run used no Overclock despite holding it. UI screenshots and replay evidence are separate from any independent engine restoration performed by the parent.

The normal Export button successfully downloaded JSON. Waiting for the plugin's Playwright download event timed out and reset the tool kernel; recovery reused the owned Chrome tab, and exported files were copied from Downloads after identifying the unique seed. That was an automation-tool failure, not a game failure.


Parent verification: independently restored all 380 exported choices with snapshot checks after each choice and reached the same natural terminal outcome.
