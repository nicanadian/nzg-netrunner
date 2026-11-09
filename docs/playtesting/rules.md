# Rules & tactics playtest

Reviewer: independent AI playtester, 2026-11-05. One native Chrome match is complete. Source inspection and engine fixtures are explicitly distinguished from observed UI play.

## Goals

- Understand the real cost and consequence of a click before committing it.
- Make runs, react to ICE, use breakers, access/trash/steal, and finish a match without consulting implementation details.
- Keep opponent cards concealed until the rules reveal them.
- Observe clear phase, resource, and score transitions.

## Target cases

1. Mulligan or keep an opening Runner hand; compare legal actions with pool and clicks.
2. Play economy, install a breaker, and use a run event; track pool, hosted credits, and click deductions.
3. Encounter ICE; inspect matching breaker strength, break subroutines, and check payment and remaining threats.
4. Access an unrezzed remote; verify candidates stay concealed until individually accessed.
5. Access an asset, compare its printed trash cost with the offered action, and decline without accidentally paying.
6. Play to a genuine win/loss, checking score and terminal behavior; verify the log explains the decisive actions.
7. Check Undo and replay preserve the same visible state.

## Initial source hypotheses (not browser findings)

- Numeric costs are not generally present on command/option buttons. The inspector shows printed costs, which need not equal actual context-sensitive costs. Likely tactical usability gap.
- Only the last two log lines are shown on the table, so an AI turn may obscure the meaningful preceding changes.
- Bad-publicity credits exist in engine state but the adapter does not expose them. The displayed pool alone would understate available run credits. Default decks do not normally generate bad publicity, so this is outside the highest-priority release path.
- Overclock uses credits hosted on its resolving card, not the temporary-credit field. Its hosted counters are already exported and rendered; actual visibility needs browser review.

## Rules references

- [NSG Learn to Play: Runner](https://nullsignal.games/players/learn-to-play/learn-to-play-runner/) explains hosted Overclock credits can pay costs during its run and unspent credits return at run end.
- [NSG Run Guide](https://nullsignal.games/players/learn-to-play/run-guide/) explains voluntary jack-out and the option to pay the printed trash cost on access.
- [NSG current comprehensive rules hub](https://nullsignal.games/rules/comp-rules/) links v26.03. The vendored engine is older; tests are targeted checks, not full tournament certification.

## Engine fixtures completed

`node tests/rules-playtest.cjs` passes two targeted scenarios. Both use an arranged legal board and the adapter's legal-choice interface, not browser clicks:

- Overclock costs one click and one pool credit, provides five hosted run credits, and uses three of them to trash a Regolith Mining License on access. Loup's first-trash trigger gains one credit. The event leaves the resolving area and unspent hosted credits cease to be available after the run.
- Declining the same trash preserves the asset and the credit pool; the run event still expires correctly.

No rules defect was found in these cases. This does not establish comprehensive card/rules accuracy.

## Chrome playthrough — completed

Actual native Chrome play, via `cua_repl` accessibility observations, clicks, and screenshots; no T3 and no direct JavaScript game-state manipulation. Repeated basic runs/credits used bounded native-action loops with a fresh AX tree before each choice. This was a goal-directed AI tester, not a recruited human participant.

- Replay: `tests/fixtures/rules-chrome-replay.json`; seed `bda08b82-0c09-4817-b421-31087ab9ae4a`.
- **148 actual player decisions**, **1061 engine actions**, **17 displayed turns**, **Corp victory 9–3**. Counts verified by deterministic replay after downloading through Chrome's Menu → Export game replay.
- Decisions included 21 basic runs, three played events (Wildcat Strike, Overclock, Jailbreak), one installed Cleaver, 25 access selections, two steals, two required discards, one asset trash, and 39 basic credit actions. Later credit actions deliberately let the opponent finish to test the terminal state; this is not a measurement of competitive player strength or AI win rate.
- Wildcat Strike charged two credits/one click and the opponent selected four cards. Overclock's one-credit/one-click payment and five hosted credits were visible in the log. Trashing Nico Campaign used two hosted credits, Loup gained one credit/drew one card, and the event expired after the run.
- Jailbreak accessed two concealed HQ candidates one at a time, including a stolen Luminal Transubstantiation for two points. An unaffordable Spin Doctor trash option was absent at zero credits. Mandatory end-turn discard reduced the hand to its limit.
- Manegarm Skunkworks offered five-credit payment or end-the-run at zero clicks, correctly omitting its unaffordable two-click alternative. Paying reduced seven credits to two; the three-credit trash option was unavailable afterward.
- Ansel 1.0 eventually protected HQ. Resolving its subroutines trashed Cleaver and prevented stealing/trashing on those runs. The log described the restriction. No breaker was usable against this sentry; this session did not validate a successful matching-breaker interaction (covered separately by the existing Buzzsaw fixture).
- Terminal UI removed gameplay decisions, showed Corp victory, and allowed replay export. No visible freeze/error occurred.

## Ranked findings and iteration feedback

1. **High — trash and install/play costs are missing from actionable buttons.** On Nico access the rail said only “Trash” and “Finish accessing”; knowing the two-credit price required reading the card. On Overclock, the pool showed two while five additional run credits existed. Show the actual action cost and eligible payment resources alongside the commitment. Root has implemented cost metadata/badges; the new rules fixture checks the cost equals actual payment and does not expose hidden candidates.
2. **High — hosted credit counter number is unreadable.** The Overclock token appeared as a blank gold disc. Root traced `.credits` class collision to footer CSS and scoped it. This directly impaired tactical arithmetic.
3. **Medium — movement stage is mislabeled by the progress strip.** Unprotected-server “Run: Movement” highlighted “Breach” before breach occurred. Root added a Movement step.
4. **Medium — opponent changes vanish too quickly.** After an entire AI turn the default table log commonly showed only “Corp spent one click / Corp gained one credit”; newly installed remote cards or scoring could be missed. Root added recent activity and state-change feedback.
5. **Low — win wording is threshold-based while score can exceed it.** Terminal said “Corp reached 7 agenda points” with nine displayed. “Corp reached at least 7 agenda points” or the actual scored total is clearer.
6. **Low — duplicated label and generic instructions.** A sole install target appeared as “Install Install Smartware Distributor into resource row”. At mandatory discard the generic instruction still said “Choose an action, or continue…” with no Continue available. Explicit discard count and cleaner action labels would help newcomers.

## Regression validation after first fixes

`npm run test:rules` passes: two Overclock access/payment/expiry fixtures, action-cost privacy assertions, and replay of all 148 decisions from the completed Chrome game. Browser verification of the changed styling and new labels is delegated to the next independent review pass; the completed match above used the pre-fix loaded page.
