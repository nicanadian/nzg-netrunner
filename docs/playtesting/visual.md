# Visual presentation and readability playtest

Current status: the Corp match is complete (83 decisions, Runner 8–Corp 6). The extension-only continuation verified compact actions, Corp subroutine guidance, a thirteen-card hand without clipping, and exact final install payment. Earlier pending notes below are historical checkpoints.

Reviewer: independent AI test player, visual presentation/readability focus. Date: 2026-11-05.

## Goal and method

Evaluate a full match in Chrome, emphasizing card resolution and magnification, board hierarchy, selection/turn feedback, crowded positions, and the coherence of the cyan/red illustrated tabletop. Record observable problems and compare the same state after fixes. A source or static-image concern is a hypothesis until checked during play.

No live browser session has been completed at this initial checkpoint. The reviewer is waiting for its exclusive Chrome turn; no T3 browser is used.

## Reference inspected

The official [Gwent media page](https://www.playgwent.com/en/media) and [homepage](https://www.playgwent.com/en) were read. Two official gameplay screenshots were downloaded and visually inspected: [Skellige](https://cdn-l-playgwent.cdprojektred.com/screenshots/CardGameplayEffects-01-Skellige_EN.jpg) and [Nilfgaard](https://cdn-l-playgwent.cdprojektred.com/screenshots/CardGameplayEffects-05-Nilfgaard_EN.jpg). These are historical promotional screenshots, not evidence of current Gwent behavior or a Gwent playthrough.

Concrete visual lessons from those images: large art-led card silhouettes; subdued detailed scenery; strongly contrasted numerical state; highlights anchored to specific cards; effects concentrated at their targets; a clear separation between opposing sides. Preserve the Netrunner playmat aesthetic rather than importing Gwent's fantasy styling.

## Review rubric

1. **Read cards:** names and costs are recognizable on the table; full rules are crisp without browser zoom; magnification stays on screen and does not interfere with selecting a card.
2. **Understand position:** side, turn, clicks, credits, score, selected server, and current ICE are apparent without searching the log.
3. **Understand choices:** the current legal action identifies its target and consequence; the card/action relationship remains apparent during multi-step decisions.
4. **Feel changes:** actions have visible feedback without excessive delay or distracting layout movement; draw, install, break, damage, and scoring are distinguishable.
5. **Retain density:** cards, counters, and controls remain reachable in crowded boards and longer hands at a common laptop viewport.
6. **Stay cohesive:** cyan/red mats, bright cards, restrained gold emphasis, and typography support the physical game; visual flourishes must improve interaction or mood.

## Baseline artifact observations (not a new playthrough)

Inspected `docs/design-review.md`, `docs/screenshots/dense-board.png`, and `docs/screenshots/encounter.png`.

The two illustrated mats establish coherent faction geography. Selected R&D is outlined in gold; encountered Tithe appears in the decision rail with subroutines in UI text. The dense position keeps hands and rigs separated. Small all-caps state labels look weak in these saved images; verify native-resolution Chrome before labeling this a defect. The rail is legible structurally, but its generic rectangular controls may be less direct than card-anchored choices; verify during actual decision flow.

## Live results

Pending Chrome turn.

## Chrome attempt and current coverage limit

The reviewer received exclusive Chrome access after the accessibility reviewer left a Corp opening at Turn 1, 6 credits, 2 clicks. Before any gameplay action, `cua.getApp("Google Chrome")` failed with `cgWindowNotFound`. Bundle-ID and application-path retries failed identically. Native inventory listed Chrome as running but exposed no browser connectors. The documented browser-tab creation returned `Browser is not available: chrome`; the native launch helper was unavailable on macOS. Finder also returned `cgWindowNotFound`; a native T3 application binding attempted only to reach Spotlight (not its browser) timed out and reset the kernel. No game action or visual capture succeeded in this slot. Root is seeking restoration of desktop availability.

**This reviewer has not completed a new live Chrome game or validated the current patch visually.** The preceding reviewers' successful observations must not be attributed to this reviewer. No T3 browser, alternate browser, or synthetic game state was used to work around the native desktop failure.

## Pass 2 source review while blocked

These are implementation observations and testing targets, not visual pass/fail results:

- Costs now appear below action labels; their styling is compact and distinct. Primary actions explicitly use dark text on gold, including option details.
- Credit and agenda deltas are anchored at their counters rather than changing layout. This supports the reference rubric's stable positions and local feedback. The normal animation lasts four seconds; reduced motion disables animation.
- Recent activity now contains five reverse-ordered entries with a full-log link and a bounded scroll area. This is more persistent than the baseline two lines, but still chooses the last five raw messages. Scoring/installation can potentially be buried by routine spend/gain chatter. Consider meaningful-event grouping only if actual play confirms that loss of context.
- The activity container's scroll position is not explicitly restored when its contents are replaced. If a player scrolls down to older messages, new prepended entries may remain above the visible region. Verify this in Chrome before treating it as a reproduced defect.
- Pinned actions now include server destinations. The full-size inspector and hover preview still use the high-resolution card files; table cards use the compact files. Native-resolution legibility and modal placement await a live capture.
- Table and action option highlighting remain separate. A sidebar-hover/focus highlight on the corresponding visible card/server may improve target mapping. This is a design experiment, not a proven requirement; test it against dense boards and hidden-information boundaries.

## Resumed native Chrome visual session — 2026-11-05

Desktop availability recovered. This reviewer bound only `cua.getApp('com.google.Chrome')`, opened a new localhost:5173 tab, and resumed the existing Corp save at Turn 1, 6 credits, 2 clicks. All game input used fresh native accessibility observations followed by matching visible button clicks; no T3 browser, injected state, or engine calls were used. Screenshots were viewed directly through the native screenshot API.

**The match remains unfinished.** The user reported unwanted mouse activity over Firefox during this session. Root immediately stopped native input. This reviewer never selected Firefox or another app. The final tool call completed successfully in Chrome; no further UI input was attempted after the stop. Native screenshot output showed the cursor at clicked Chrome elements, but this review cannot establish the underlying cross-application input mechanism.

### Actual play coverage

Played from the restored opening through Corp Turn 5. Installed Tithe on R&D, installed Offworld Office in Remote 0, protected that remote with Palisade, advanced and scored Offworld Office using Seamless Launch, recovered Seamless Launch using the identity, installed another Palisade on HQ, installed/advanced Superconducting Hub, rezzed remote Palisade against an AI run, fired its end-the-run subroutine, and scored Superconducting Hub. The AI installed Smartware Distributor, Fermenter, and Cleaver, played events, and initiated runs. No stuck state or error was observed during these interactions.

Final visible position: Corp Turn 5, 3 agenda points, 4 credits, 2 clicks. Scored phase offers `You may draw 2 cards` and `You may add 1 card from Archives to HQ`. Runner has 0 agenda points and 12 credits. The existing autosave remains in Chrome. No replay export was attempted after the stop, and this is not a completed-match claim.

### Verified fixes and visual observations

- Tithe's pinned actions now identify New remote, HQ, R&D, and Archives distinctly. Selecting R&D installed it in the intended server.
- Offworld Office's pinned action correctly says `Install facedown`, with no agenda rez-cost explanation.
- The large pinned card image and separate text were crisp. The playmat's cyan/red separation, gold remote/current-ICE focus, legible strength badges, and advancement counter made the live run position understandable.
- Credit deltas appeared next to the changing resource: -3 when rezzing Palisade and +7 after scoring Offworld Office. Recent activity showed the corresponding rez/scoring sequence. These are clear local cues, although AI turns can resolve several events before the next decision.
- No card or control clipping was observed at this large Chrome window. This session did not test a laptop-sized or mobile viewport, dense late-game board, or reduced-motion behavior.

### Reproduced improvements sent to root

1. **Pinned installation choices are excessively tall.** Each of four Tithe actions occupied five lines: command, destination, cost, note, and detached arrow. The four choices filled most of the tall dialog despite short content. Compact into a target-bearing header, one cost/note line, and aligned arrow. Root reported implementing this; live recheck is pending.
2. **Wildcat Strike omits the recipient in Corp choices.** During `YOUR RESPONSE`, the buttons said `Gain 6 credits` and `Draw 4 cards` even though the benefit goes to Runner. Explicitly name Runner in these choices. Root reported retaining the upstream recipient-specific button text; live recheck is pending.
3. **Corp subroutine help incorrectly instructs use of an icebreaker.** After rezzing Palisade, the Corp's `Run: Subroutines` phase said `Use a matching icebreaker, raise its strength if needed, then break subroutines`. The sole action was `Use ability Palisade`, which actually fired `End the run`. Use Corp-specific guidance and a subroutine-specific action label. This was reproduced by firing the action and observing the run end.
4. **Hover may obscure the rail after layout changes.** After rez, the pointer remained where the newly displayed current-ICE card appeared; its magnification opened and covered part of the instructions and action. It did not prevent clicking, but the preview's placement deserves review against the action rail. This is a visual obstruction observation, not a reported engine failure.

The Gwent reference criteria helped distinguish strong local state cues from generic or ambiguous action presentation. This session does not establish parity with Gwent's polish or exhaustively validate rules.

## Completed extension-only continuation

Chrome's tab-confined extension connection was restored later in the same review. From this point onward the reviewer used only the browser runtime's extension `Tab` and Playwright locator APIs, never native `getApp`, CUA desktop input, or another application. The original tab was already claimed by root, so this reviewer opened a new localhost:5173 tab and resumed the same saved game at the exact Turn 5 scoring decision.

**The Corp game is now complete:** Runner won 8–6 on displayed Turn 13. The exported seed is `4134a6df-23f7-4c3b-9394-ea28ea09f73d`, with **83 human engine decisions** including the original short opening. The entire game was played through visible choices; the later turns deliberately drew heavily to seek another scoring agenda, also exercising 13–14-card hand/discard states. This is a functional playthrough, not a win-rate measurement or expert competitive evaluation.

Replay: `tests/fixtures/visual-chrome-corp-replay.json`. The Menu → Export game replay action downloaded `~/Downloads/netrunner-replay-4134a6df.json`. The browser download-event wait subsequently timed out and reset its REPL; the file's existence and content were verified on disk and copied into the test fixtures. No native input was used to retrieve it. Headless deterministic replay verification is assigned to root.

### Fixes verified in the continuation

- **Compact pinned options:** Ansel 1.0's five install destinations fit together with readable target headers, costs, and aligned arrows. This is materially easier to scan than the preceding five-line-per-button layout. [Screenshot](../screenshots/chrome-compact-install.jpg).
- **Corp subroutine guidance/action:** On a live Tithe encounter, the help now says to fire unbroken subroutines in order, and the action says `Fire subroutine Tithe`. The AI-broken damage subroutine was visibly struck through; firing the remaining credit subroutine worked. [Screenshot](../screenshots/chrome-corp-subroutines.jpg).
- **Agenda wording:** Rechecked Offworld Office and Send a Message in the patched inspector; both correctly said `Install facedown`.
- **Terminal score:** The result correctly reported `Runner reached 8 agenda points`, matching the board's 8–6 score. [Screenshot](../screenshots/chrome-corp-complete.jpg).
- **Sustained interaction:** Scored four agendas, used optional draws and identity recovery, played economy/advancement operations, installed layered ICE with the optional pre-install trash window, rezzed defensive ICE, resolved repeated AI runs, and discarded down to the increased ten-card hand limit. No stuck engine state or visible game error occurred. Some AI transitions briefly displayed the thinking state, then resolved normally.

### Remaining reproduced layout issue

At Turn 12 with 13 cards in HQ, the live 1771×961 viewport had an outer page scrollbar and the bottom corners of the fanned hand extended below the visible viewport. Card tops remained reachable, but this violates the intended anchored-hand presentation and looks unfinished. [Screenshot](../screenshots/chrome-large-hand.jpg). The final ten-card position also retained slight bottom clipping. Root received the reproduction and screenshot. A layout fix and same-position retest remain separate from the completed gameplay claim.

The Wildcat Strike recipient wording change was not exercised again after reload because the event did not recur. Hover placement after a state transition remains a visual improvement target. The current game has coherent presentation and readable inspection, but cinematic movement, richer target-local feedback, and transitions between AI actions remain less developed than the Gwent reference.

## Dense-hand fix verification

After root capped hand rotation and lifted the outer corners, this reviewer reloaded through the extension-only tab, resumed the saved completed game, and used four Menu → Undo actions to reach a 13-card hand on Turn 13. The completed replay fixture was retained unchanged. This is the **same 1771×961 viewport and card count**, though the exact cards/turn differ from the Turn 12 baseline.

The hand no longer clips or expands the document. Read-only DOM measurements showed document width/height **1771×961**, equal to the viewport; hand bounds x=0–1461, y=763–961; all 13 transformed card bottoms at **946.797px**, leaving about 14px clearance. The outermost horizontal bounds were 38.55px and 1422.45px, both within the hand. Visual inspection confirmed no outer page scrollbar and complete card silhouettes. [After screenshot](../screenshots/chrome-large-hand-after.jpg).

The tab is left at that comparison position for root/user review. The full completed 83-decision game remains available in the exported fixture. This resolves the reproduced dense-hand clipping issue at the tested desktop viewport; it does not imply every viewport/card-count combination has been checked.

## Final installation-payment check

Reloaded the latest patch and resumed the same local comparison game through extension-only Chrome. At Turn 13, Corp had 16 credits and 1 click. Chose Ansel 1.0 → HQ, which already had Palisade. The pre-install window explained that trashing existing ICE can lower the installation cost and showed **Finish install · 1 click · 1 credit**. Clicking it without trashing Palisade resulted in 15 credits, 0 clicks, both ICE protecting HQ, and matching one-click/one-credit log entries. The game then correctly requested hand-limit discards. [Payment screenshot](../screenshots/chrome-final-install-cost.jpg).

This verifies the one-existing-ICE payment branch through actual UI. The completed-match replay remains unchanged. No native app or desktop-input calls were used in this follow-up.
