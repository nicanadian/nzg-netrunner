# Interaction smoothness and accessibility review

Current status: the extension-only Runner match is complete (113 decisions, Corp 8–Runner 5). Keyboard entry, nested choices, undo/resume, optional-install guidance, and final bioroid-break wording were checked live. Earlier pending notes below are historical checkpoints.

Reviewer: independent AI playtester, 2026-11-05. Browser: Google Chrome through native `cua_repl` computer control; no T3 browser. This report separates inspected source from observed play. Root fixed initial source findings before the browser slot; the session therefore verified the updated implementation, not an unchanged baseline.

## Goals

- Read cards through hover, keyboard focus, and pinned previews without accidentally committing a move.
- Play a complete match while checking decision feedback, delays, and consistent action placement.
- Verify Escape, modal focus, and keyboard continuation after a decision.
- Verify undo and saved-game resume against a visible before/after position.
- Check crowded play areas, overlapping hand cards, and navigation to hidden portions of the board.

## Initial source review: not yet browser-verified

1. **Keyboard replay import is unreachable.** `index.html` uses a plain label enclosing a hidden file input for Import game replay. The label is not a keyboard focus target. Replace with a real button that activates the file input (or a properly visible/focusable input).
2. **Keyboard focus likely disappears after decisions.** `render()` replaces the board and hand with `innerHTML`; `renderDecisions()` also replaces every action button. There is no focus restoration. Enter on a command that opens a submenu will probably return focus to the document rather than the new choices. Preserve a logical focus target or focus the new action group after keyboard activation, without pulling focus away from other reading tasks.
3. **Selected side is not announced.** The side selector represents selection only with CSS `.active`; neither `aria-pressed` nor radio semantics convey the chosen side.
4. **Multiple selection is not announced.** Card and action buttons toggle a `.selected` class without `aria-pressed`. The live action list may announce re-rendered text, but it does not expose a stable selected/unselected state.
5. **Dialogs have no programmatic names.** Native `<dialog>` focus trapping and Escape are useful, but no `aria-labelledby` or `aria-label` connects each dialog to its heading. Give each a meaningful accessible name, including the current inspected card name.
6. **Reduced-motion board navigation may still animate.** The CSS disables transitions/animations under `prefers-reduced-motion`; the Board shortcut explicitly calls `scrollTo({behavior: "smooth"})`, which should use `auto` when reduced motion is requested.

## Browser evidence

Focused Corp opening and interaction session, then handed the same match to the visual tester. This is **not counted as a completed match**. The root requested a short shared-browser slot for complementary interaction coverage.

### Verified improvements

- **Side state:** Chrome's accessibility tree now identifies both side buttons as toggles. Selecting Corp changes Runner from value 1 to 0 and Corp from 0 to 1.
- **Keyboard submenu continuity:** With Install focused, Enter opens its choices and focuses the first Nico Campaign option. Enter installs it in Remote 0; focus moves to the legal Rez action. Enter on All actions restores focus to the main action list. The expected keyboard path does not fall back to the document between these moves.
- **Keyboard import:** Opening Menu focuses Close menu. Four Tabs reaches Import game replay. Enter opens the native file picker. Escape cancels it and returns focus to Import game replay.
- **Named dialogs:** Accessibility tree exposes `Game menu`, `Offworld Office card details`, and `Tithe card details` containers, with close controls named specifically.
- **Pinned readability:** Offworld Office's full image and separately rendered rule text are sharp and readable at the current large Chrome window. The preview exposes its 4 advancement requirement and 2 agenda points. Tithe exposes cost 1, strength 1, and both subroutines in readable text.
- **Keyboard magnification:** Escape from Offworld Office restores the card focus; Tab moves to Tithe and opens its magnification. Escape dismisses magnification while retaining card focus; Enter pins Tithe. No action is committed merely by reading these visible cards.
- **Undo:** After installing Nico Campaign, Corp had 2 clicks, five cards in hand, and Remote 0 containing Nico. Menu → Undo restored 3 clicks, the same six-card hand, 5 credits, 34-card deck, and no Remote 0.
- **Resume:** After taking Gain 1 credit, refresh → Resume game restored Corp Turn 1, 6 credits, 2 clicks, the same six-card HQ, 34-card deck, and matching recent activity.
- **Responsiveness:** Opening choices, card dialogs, Undo, and this short replay/resume resolved promptly without a visible stuck spinner or error. This does not establish long-match timing or low-end device performance.

### New observed defects, sent to root

1. **Ambiguous pinned-card actions — high priority.** Tithe's preview shows four buttons with the identical accessible/visible text `Install 1 click + server install cost ↗`. Their destinations (new server, HQ, R&D, Archives) are omitted. This creates accidental-action risk. Display the option's destination or full label in pinned-card actions, matching the sidebar choices.
2. **Incorrect agenda cost explanation — medium priority.** Offworld Office's install option says `Rez cost paid later`. Agendas are not rezzed. Restrict that note to assets/upgrades (and applicable ice guidance).
3. **Keyboard game entry — low priority.** Selecting Corp, then Tab → Enter on Jack in starts the game with focus on the document rather than the opening-hand choices. Resume also ends on the document. Set a meaningful initial decision focus when entry was keyboard-initiated, without stealing mouse users' focus.

Root subsequently reported a second patch adding pinned installation destinations, a conditional agenda note (`Installed facedown`), and keyboard-start focus intent that ignores a hidden activator. Those three changes are **awaiting browser re-verification** in this report; the source-change report is not treated as a passed interaction check.

### Coverage limits

- Multi-selection announced states and reduced-motion behavior were source-reviewed but not exercised in this browser slot.
- No screen reader was run; accessibility-tree names and real keyboard behavior were checked directly.
- Dense-board navigation, complete match pacing, and exhaustive hidden-card interaction remain assigned to the other playtest sessions.

## Retry source review — 2026-11-05 evening

A new interaction reviewer reread the current UI implementation while waiting for an exclusive Chrome slot. No browser input was made by this reviewer during this retry. The user subsequently reported that native desktop input interfered with another browser; root suspended native interaction pending tab-confined Chrome control. Therefore the three second-pass fixes above remain browser-unverified by this reviewer.

Source findings:

- `start()` now preserves keyboard focus intent before hiding the lobby. `restoreActionFocus()` disregards a hidden old activator and selects a live decision control. This addresses the mechanism behind the observed keyboard-entry defect; actual keyboard behavior still needs the pending retest.
- Pinned installation actions include their server destination. Agenda installation notes now say `Install facedown`; assets and upgrades retain the later-rez explanation. These are confirmed source changes, not a new visual pass.
- The inspector does not generally display the option label, but ability options receive their full ability text through `option.detail`. Consequently, a suspected boost-versus-break ambiguity is not established by source inspection; it should be checked on an encountered icebreaker.
- A server-title click with several matching options opens the complete command group rather than filtering choices to that server. This is a usability testing target, not a reproduced defect. Check whether the destination labels are sufficient to prevent a player from interpreting the click as a committed server choice.

The pending Runner session should cover keyboard entry, a pinned icebreaker's boost/break descriptions, the encounter-to-access transition, undo during a nested choice, and exported replay recovery. No new completed match or accessibility conformance claim is added by this source review.

## Extension-only Chrome retry — 2026-11-06 UTC

Chrome became available through the tab-scoped browser extension. This reviewer created an isolated `http://localhost:5174/` tab and used extension Playwright controls only. No native mouse, keyboard, CUA application, or T3 browser control was used. Actions were chosen from visible UI controls; no game-state injection was used. Repeated late-turn actions were exercised in bounded UI-driven batches, with a fresh public-DOM read after every choice; this is functional playtesting, not a competitive AI evaluation.

Verified during the Runner match:

- **Keyboard entry fixed:** Enter on Jack in focuses the opening mulligan decision after loading. Keeping the hand transfers focus to the first legal action. Action-group focus restoration occurs on the next animation frame.
- **Pinned actions and readable cards:** Sure Gamble and Carmen inspectors show rule text, printed values, and available actions. Carmen's successful-run discount correctly appears as a 3-credit installation beside its printed 5-credit cost. The encountered Carmen inspector names its break ability unambiguously. Screenshot: `../screenshots/interaction-carmen.jpg`.
- **Nested keyboard flow:** Enter on Carmen's pinned break action opens individual subroutine choices; choosing Tithe's net-damage subroutine spends one credit and marks it broken. Undo restores the choice and refunds that credit (1 → 2); repeating the choice works.
- **Save/resume:** Reload and keyboard Resume restore Runner Turn 3, 3 agenda points, 1 credit, 3 clicks, the same three-card grip, and matching recent events after stealing Send a Message. No visible error occurred.
- **Optional install clarification:** The initial generic hint at `Trash Before Install` did not explain that sufficient memory permits keeping existing programs. Root added a specific explanation. After reload, a second Buzzsaw installation with 2 free MU shows: “You may trash installed programs to free memory. Choose Finish install when you have enough memory; you can keep your other programs.” Undo restored the pre-install hand, clicks, and credits. Screenshot: `../screenshots/interaction-optional-install.jpg`.
- **Midgame layout:** At viewport 1771×961, the document measured exactly 1771×961, with the three-card hand bottom at 950.8 pixels. No page overflow or clipping of the hand was observed. The Corp mat exposes its Board scroll control once its ICE grows. This is one desktop viewport, not a responsive-device claim.
- **Stability:** The tab's captured warning/error log was empty at displayed Turn 11. Repeated run, encounter, breach, access, scoring, and AI-turn transitions resolved without a stuck interaction in this sample.

New issue found in the retry: when Brân 1.0 has only one unbroken subroutine left, entering its click-to-break ability displays only `Continue ↗`. Earlier choices explicitly said `Lose Click: Break “End the run.”`; the final choice loses both cost and target wording. It still spends the final click correctly. Root received the exact reproduction; the reviewer held that position through Undo for comparison. Before screenshot: `../screenshots/interaction-bioroid-label-before.jpg`.

### Completed retry result

The match reached its normal terminal state at displayed Turn 12: **Corp 8 – Runner 5**. Exported replay: `../../tests/fixtures/interaction-chrome-replay.json`, seed `50650546-a6f4-46e9-aa60-afb74cce5ee0`, **113 retained human decisions** (undo experiments are not included in the retained replay). The final screenshot is `../screenshots/interaction-terminal.jpg`. No game error or captured browser warning/error occurred by the end.

Root fixed the last-subroutine label. Reload + keyboard Resume at the exact held position now shows `Lose Click: Break “End the run.” ↗`, focused and highlighted. It spends one click and proceeds correctly. The matching after screenshot is `../screenshots/interaction-bioroid-label-after.jpg`; it was opened and visually checked, along with the optional-install and terminal screenshots.

Replay export itself worked through Menu and saved the JSON to Downloads. The extension's download-event waiter timed out and reset the automation session; reconnecting the same tab preserved the game. The final exported file was copied into the fixture path above. This was a testing-tool limitation, not a failed app export.

Coverage includes initial and nested keyboard focus, pinned readability/actions, successful-run discounts, Jailbreak's two-card access, paid trash and Loup reward, repeated Carmen/Tithe subroutine choices, three Brân bioroid click payments, scoring, undo, reload/resume, and terminal display. Multi-selection and screen-reader output were **not** exercised in this retry. No conformance or competitive-strategy claim is made.
