# Board-game and digital card-game design review

Reviewer: independent AI specialist perspective, not a claim of human credentials. Date: 2026-11-05. Chrome extension browser, isolated `http://localhost:5176` save origin, existing desktop viewport (1771 × 961 capture). No viewport change and no app code changes. All play used public buttons and the normal **Menu → Paste game replay** UI. Page reads were DOM only. Initial review tab closed after capture.

## Coverage and evidence

Loaded `eval/counters/corp-advance-replay.json`, `runner-virus-replay.json`, and `corp-income-replay.json`. Submitted 19 game decisions plus one Undo, excluding menu, preview, group-navigation and import clicks:

- Corp: advance Hub three times (one through preview), score it, choose and resolve draw-two trigger, choose identity trigger, recover Spin Doctor (8).
- Recovery: Undo rewound the Spin Doctor choice and automatic AI follow-through to the Archives choice (1 undo).
- Runner: choose Botulus and break one end-the-run subroutine; choose Brân ability and spend one click to break the other; choose Brân ability again and spend another click to break installation subroutine; continue run, access HQ card, steal Send a Message (9).
- Corp income: resolve Nico Campaign payout; concede disposable review game to inspect terminal screen (2).

Screenshots under `eval/polish/`: `board-advance-before.jpg`, `board-score-ready.jpg`, `board-scored-triggers.jpg`, `board-run-encounter.jpg`, `board-subroutine-broken.jpg`, `board-income-before.jpg`, `board-income-after.jpg`, `board-concede-complete.jpg`. These capture the initial implementation before the parent's polish integration. Files contain screenshot bytes returned by the Chrome runtime.

## Ranked findings

### 1. Make subroutine choice verbs and ordinal positions explicit

Observed: Botulus → Break 1 subroutine presents two indistinguishable buttons **End the run.** The screen title gives context but the button text reads like a harmful action rather than the target of a break. After breaking one, the receipt headline is **Continue · End the run.**, while the log correctly says the subroutine was broken. Brân's own click ability does include `Lose Click: Break`, showing this is an inconsistent presentation problem. The duplicate end-the-run entries remain distinguishable only by position and faint struck-through styling in the side list.

Change: expose a subroutine ordinal consistently in the list and actions; render **Break 2 · End the run** and **Break 3 · End the run**, add an explicit **Broken** label to disabled/struck entries, and receipt **Botulus · Break subroutine 2**. Preserve literal subroutine text below the action verb. Distinguish the Corp's **Fire subroutine** action from the Runner's **Break subroutine** action. Cost should say **1 virus counter** or **1 click** in the same cost component as other actions when the engine can provide it, not inferred from arbitrary card prose.

Evidence: `board-run-encounter.jpg`, `board-subroutine-broken.jpg`. Source diagnosis: `engine/adapter.js` optionDTO sends existing label text before a numeric subroutine fallback; `app/table.js` combines command and option labels for receipt. Subroutine list already has a `broken` class but only CSS line-through/opacity, so this is a small presentation change rather than rules redesign.

### 2. Explain passing and scoring at the zero-click action window

Observed: after third advance, Hub has 3 ADV and legal **Score agenda** is available; generic **Continue** appears first. The paragraph still says **Spend clicks to build your position** despite zero clicks. A player needs to know scoring remains available and that passing ends their action phase. Gold styling is helpful, but specific language should carry this decision.

Change: label this window's pass **End action phase**, with a short **No clicks left. Resolve any available abilities or score an eligible agenda, then end your action phase.** Show the scoring action prominently and before the pass when legal. Do not assume zero clicks always skips all remaining options. For known eligible agenda cards, add **Ready to score**; never reveal requirements/types from hidden cards.

Evidence: `board-score-ready.jpg`. `engine/adapter.js` commandLabel already distinguishes several contexts for generic `n`, so this follows an existing pattern. `app/table.js` hint uses static action-phase text.

### 3. Name the source of simultaneous card triggers

Observed: scoring Hub opens choices **You may draw 2 cards** and **You may add 1 card from Archives to HQ** under **Scored**. These are different card sources, but the player must remember which is the scored agenda and which is identity. The draw choice then opens another panel before its optional resolution. Default hint says choose an action or Continue even when the only visible choice is one remaining trigger.

Change: show source card name on each trigger, such as **Superconducting Hub · Draw up to 2 cards** only if exact engine effect supports that wording; otherwise keep literal **You may draw 2 cards**. Show identity name beside Archives retrieval. Use **Choose an effect to resolve** for trigger-order panels, and **Resolve this optional effect, or skip it** for a genuine optional-effect prompt. Keep exact effect semantics and number of drawn cards from engine data.

Evidence: `board-scored-triggers.jpg`. No underlying rule failure observed: both effects resolved normally, draw added two cards and recovery returned the chosen Archives card.

### 4. Separate turn owner from response priority

Observed: after an advance on Corp turn, headline remains **Corporation’s Action Phase**, player chip switches **AI THINKING**, then **YOUR TURN** on return. During Wildcat Strike on AI Runner turn, **YOUR RESPONSE** correctly appears. The existing chip collapses computation and decision ownership into one place, which makes same-turn opponent response windows look like an ownership switch.

Change: keep **Corp turn · 2** / **Runner turn · 2** stable, and show a second **Your decision**, **Opponent response**, or **Opponent action** indicator driven by playerTurn and active side. Make waiting hint specific when opponent has priority in your turn. Avoid showing a false full turn transition animation for each response window.

Evidence: DOM snapshots during every advance, Botulus break and bioroid click break; source `renderDecisions` uses busy → AI THINKING, then playerTurn comparison. This finding concerns communication, not an observed illegal turn or timing rule.

### 5. Give advancement a readable goal and scoring a destination

Observed: known Hub board card shows ADV 1/2/3; preview separately shows **3 Advance**. A new player must connect those two numbers. On score, receipt reports **Left play**, although card is now scored and maximum hand size rises from 6 to 8. The change is mechanically correct but the phrase gives the wrong physical impression of a card leaving the game entirely.

Change: known agenda preview **Advancement 2 / 3** (requirements from authoritative snapshot), scored card receipt **Moved to Corp score area · +1 agenda point**, with a score-area affordance. Continue to show only public advancement count for hidden opponent cards. Avoid adding a progress fraction if rules can modify the requirement and snapshot cannot supply current value.

Evidence: `board-advance-before.jpg`, `board-score-ready.jpg`; score flow observed 0 → 1 points and hand limit 6 → 8.

### 6. Keep hosted attachment relationships human-readable

Observed: Botulus sits in HOSTED PROGRAMS on Runner mat, its subtitle **HQ · ice 1 from outside**; Brân shows **+1 hosted**. This preserves readable card size but asks players to mentally match a numeric location across mats.

Change: show known host name **On Brân 1.0 · HQ** beneath Botulus, retaining outside position as secondary text when needed. Make the host's attachment badge read **Botulus** when public and space permits, or **1 hosted card** with readable details on inspect. A subtle shared marker would strengthen the physical relationship without relocating cards or covering ice.

Evidence: `board-run-encounter.jpg`. No hidden-information issue observed; hidden R&D upgrade remained unnamed and HQ accessed card appeared only after access.

### 7. Make terminal state consistent with the visible winner

Observed: conceding ends the game correctly with GAME COMPLETE, RUNNER WINS and Play again; the status announcement still begins **Corporation’s Action Phase. You conceded the game.** The previous campaign receipt remains directly below gameover, competing with conclusion.

Change: announce **Game complete. Runner wins. You conceded.** and visually subordinate or collapse old resource receipt on completion. A small **Review table / Export replay** action would make the final position useful for learning, but is optional scope.

Evidence: `board-concede-complete.jpg`. Tested concession termination only; did not play a fresh natural 7-point victory or flatline, so no claim that those end states were validated.

## What already works

- Clicking an available card to inspect and then advance gives the same legal outcome as sidebar action; actual click counters turn over and credit/advancement changes persist in a receipt.
- Botulus 1 → 0 virus counter and Brân bioroid click spending correctly show different resource channels. The three-break sequence reached Movement, then successful HQ breach and agenda steal; no rules failure seen.
- Nico campaign payout changes hosted credits 9 → 6 and Corp pool 5 → 8, with two distinct receipt rows and no click charge. This conveys physical transfer better than a generic gain notification.
- The highlighted server, distinct run stage divider and side-panel current ice make run target and current encounter findable.
- Face-down information remained protected in observed UI; Send a Message name appeared when selected for access, then stolen score rose by 3.
- Menu Undo restored the choice before Archives recovery and rewound automatic opponent consequences. This supports safe local learning, though the control is buried in Menu.
- Empty remote root remains clearly visible with its protecting ice after agenda score, maintaining the spatial model.

## Suggested acceptance pass after polish

Replay these same fixtures through normal UI. Verify Botulus cost and break-target verb/ordinal; break both identical end-the-run subroutines and observe distinct broken states; verify End action phase wording at zero clicks without removing legal score; score Hub and identify both trigger sources; verify known-card progress and hidden-card secrecy; take Nico payout and verify separate pool/host totals; confirm Undo still restores correct choice; inspect terminal announcement. No numeric design score assigned because this was a focused expert heuristic playtest, not a blinded human study.

## Focused post-integration Chrome recheck

Reloaded a new Chrome tab at `http://localhost:5176`, restored the advancement and Runner-virus fixtures using normal Paste game replay controls, then closed the tab. Same 1771 × 961 viewport; no global viewport override or app edits. This recheck submitted 10 game decisions (three advances, score, open Hub trigger, Botulus ability/target, Brân ability/target and another Brân ability) plus inspected the final singleton target without spending it.

Verified improvements:

- Known Hub initially shows **0 / 3 ADV**, then **✓ READY** at three advancement. No requirement badge leaked onto the observed facedown R&D root card; its public card button still contains only the card back **N**. This is UI spot coverage of an actual hidden card, not exhaustive hidden-agenda validation.
- Score is the first zero-click choice and **End action phase** is explicit; the score receipt now says **Moved to score area**. Score total and hand-limit change remain correct.
- Nested Hub optional resolution shows **FROM Superconducting Hub**. Turn chip now separates **YOUR TURN · YOUR DECISION** from **YOUR TURN · RESOLVING**, preserving turn identity during automatic response handling.
- Botulus target buttons now say **Break subroutine 1/2/3** with literal effect text. Choosing subroutine 2 yields matching **✓ Broken** on ordered list entry 2 and receipt **Break subroutine 2 · Botulus**; its virus count decreases to zero.
- Brân break alternatives show **1 click**, including the final singleton action, and no longer require reading card prose to identify cost. Breaking entry 3 decreases Runner clicks from two to one and yields **Break subroutine 3 · Brân 1.0**.
- User-facing server and resource receipt use **Remote 1**, replacing technical zero-based server number.

Remaining observed paper cuts, reported promptly to parent:

- Settled **Scored** simultaneous-trigger list still contains only **You may draw 2 cards** / **You may add 1 card from Archives to HQ**. Source labels appear after entering the Hub prompt, not on this initial ordering choice.
- At zero clicks, generic hint still says **Spend clicks to build your position** even though actions correctly prioritize Score and End action phase.
- Live status announcement still reports **Remote 0 root** for advance/score, while the visible receipt says Remote 1. This is an accessibility presentation inconsistency.

No blocking gameplay regression found in this focused recheck. Parent is separately validating automatic outcome and restriction semantics. Final recheck screenshots: `board-final-score-ready.jpg`, `board-final-scored-triggers.jpg`, `board-final-break-choices.jpg`, `board-final-break-result.jpg`, `board-final-bioroid-last-choice.jpg`.
