# Runner character panel — 2026-11-06

Independent AI playtester, focused on move discovery and the effect of character abilities. This is an AI review, not a claim of human playtesting. No app, engine, or vendor code was edited by this panelist.

## Evidence and scope

Actual browser interaction used an owned T3 preview tab at 1280×800, on an isolated development server at port 5174. The initial origin was `127.0.0.1:5174`; the final recheck used `localhost:5174`. User game tabs and the normal port 5173 save were untouched. The shared preview was used because the Chrome extension was previously unavailable. Browser control disconnected intermittently; reconnecting/reopening the owned tab restored it. Those failures are tool failures, not game bugs.

Two complete games were generated using only legal public adapter options, then independently replayed from their seeds with `checkState` and `checkSnapshot` after every choice:

| Match | Choices | Engine side-turns | Result | Browser coverage |
|---|---:|---:|---|---|
| Zahya vs Reality Plus | 99 | 38 | Runner 7–Corp 2, agenda victory | Imported 98-choice prefix, clicked the winning steal, verified “You win.” / 7 agenda points |
| Tāo vs Built to Last | 185 | 67 | Runner 2–Corp 4, Corp deck exhaustion | Imported natural agenda checkpoints to exercise Pantograph and Tāo; not an entire browser match |

These are deterministic functional runs with a simple policy, not competitive balance tests. The policy repeats economy abilities aggressively and is not a skilled player. Engine `turn` counts both sides; Zahya’s terminal UI shows Runner turn 19. Regenerate with `node eval/characters/runner-policy.cjs`. Full replays and checkpoint/history evidence use the `runner-{zahya,tao}-v1-vm-*` prefix.

Additional actual browser play started Zahya from the lobby and played through the first three Runner turns: installed Tranquilizer, installed Marjanah via its inspector, ran R&D, resolved Tithe, accessed Hedge Fund, took Zahya’s credit, and watched Tranquilizer reach three counters and derez Tithe. Ordinary exported evidence is `runner-zahya-first-run.json` (7 choices) and `runner-zahya-tranquilizer-turn3.json` (15 choices).

## Findings sent to implementation owner

### 1. Wrong-type rig could silently auto-pass an encounter — medium, fixed and browser rechecked

Repro: `runner-zahya-first-run.json`, import its first four choices, make a run on R&D. The Corp rezzes Tithe. Installed Marjanah is a Fracter; Tithe is a Sentry. Before the fix, the UI moved through rez and both fired subroutines to Movement without a persistent explanation of why no breaker action existed. This is a forced rules pass, not a missing legal response.

A first fix had an incorrect phase-boundary condition: Runner passes to Corp priority while both snapshots still have identifier `Run 3.1`. A real engine observer isolated that boundary; the owner corrected it.

Final actual browser recheck: playback pauses on “No available response to Tithe,” lists its two unbroken subroutines and Marjanah’s “Cannot break this ice / Breaks barrier … type does not match.” It explicitly says this is a recorded position and Next shows resolution. Clicking Next shows net damage, Buzzsaw trashed, the first subroutine Fired, and the second still Unbroken. No artificial game action was added. Pass.

### 2. Special installs lost costs and the ability source — medium

Repro: `runner-tao-v1-vm-game.json`, import first 54 choices, trigger Pantograph. It correctly gains one credit and then offers Botulus hosts / Smartware Distributor / decline. Before the fix, none of these options quoted credit cost or said no click was required. Source linkage associated targets with themselves, not Pantograph. The heading only said Pantograph with no FROM source.

Fresh-browser and independent fresh-VM recheck at prefix 55 initially showed the same failure after the first attempted fix: phase `Pantograph Install`, source null, all option costs null. The owner was informed that native triggered-response resolution bypasses the wrapped `Trigger()` path. The owner moved this tracking to ChangePhase; final browser recheck passed as recorded below.

### 3. Ice locations used conflicting conventions — medium

During that Pantograph choice one button said “Ballista protecting R&D · ice 1” and its detail said “Ballista · R&D · ice 2 from outside.” Tāo’s selection also omitted the position for a facedown ice candidate. The same host was being counted once from the inside and once from outside. The owner is standardizing outer-first labels.

### 4. Tāo’s swap functioned, but its impact was easy to miss — medium

Repro: import first 58 choices of the Tāo replay. Select Ballista using the sidebar, select Palisade directly on the board, then Confirm selection. Checkmarks and selection count mirror across both paths; Confirm stays disabled until exactly two cards are selected. Correct result: Ballista moves to HQ, Palisade to R&D, and hosted Botulus travels with Ballista and updates its host caption to HQ. Facedown identities stay concealed.

Before the fix, there was no persistent swap receipt; default Corp activity continued showing the previous Corp turn and the live status only said Run ends. The owner added moved-ice receipts and highlights. Screenshot `runner-tao-swap-before.png` is before this fix; it was visually inspected and also shows a hover card obscuring the center of the board. It is not final visual approval.

### 5. Automatic benefits needed causal explanations — low/medium

Actual browser: Tranquilizer’s counter grew 1→2→3; Tithe became visibly UNREZZED. The resource receipt only showed the counter change, while the status said a raw “at position 0 derezzed.” The default Corp activity hid this Runner start-of-turn effect. The rule worked, but the cause was missing. The owner added source-aware derez feedback.

Actual browser: the naturally seeded `runner-tao-dzmz-installed.json` has DZMZ installed, 5 free MU, and a first Cleaver install quote of 2 credits rather than printed 3. The correct discount lacked a DZMZ explanation or used/available indicator. The owner added the discount source to eligible quotes.

Actual browser: `runner-zahya-redteam-installed.json` has Red Team with 12 hosted credits. Root run ability and its central-server target choices correctly quote one click and link the source. After a successful Archives run, the response initially displayed only “Red Team”; after clicking it, pool credits increased 0→3 and hosted credits decreased 12→9, with a clear resource receipt. Payout descriptions were requested before the click. Zahya’s initial response similarly displayed only its identity name before the nested “Gain 1 credit” option. The owner added response payout previews.

## Limits

This panel did not complete an entire match exclusively through UI clicks. Complete replay verification and selected browser decision checks are separate evidence. Conduit and Echelon appeared in the full native runs; Conduit counter growth/multi-access, Unity’s dynamic boost, and a low-credit dynamic breaker branch were not comprehensively browser tested here. No phone-width or keyboard-only pass was performed by this panelist. The main regression suite and other panelists supply separate coverage.

## Final recheck

Both key fixes are now verified in the actual shared browser preview (not Chrome extension):

- Forced Tithe encounter: persistent paused explanation before the recorded damage; Next advances to the first fired subroutine and shows the lost grip card, as described above.
- Pantograph: FROM Pantograph and the guide explain the gained credit, optional no-click install, normal credit cost, memory, and decline. Botulus quotes 2 credits, Smartware quotes 0, and decline says to keep the gained credit. Hovering a Botulus target highlights **Botulus, its Ballista host, and Pantograph** together. The source/target association is now correct. Independent native prefix-55 inspection agrees.

A final small residual was sent to the owner: hosted install main labels still used the old inner-first ice number while their detail used outside-first. The owner corrected it after this panel closed its browser: an independent native prefix-55 check confirms “Host Botulus on Ballista” plus “Ballista · R&D · ice 2 from outside”, with no conflicting second index. That final wording has native verification here, not an additional browser capture. DZMZ causal text, Tranquilizer recap, Tāo impact receipt, and response payout previews were implemented by the owner but were not all individually rechecked in this panel’s final browser pass.
