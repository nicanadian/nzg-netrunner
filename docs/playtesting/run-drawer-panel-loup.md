# Chrome panel: Loup vs Precision Design

6 November 2026. Independent AI-operated tester session through the actual Chrome extension, using the installed Chrome plugin's trusted Node REPL browser API. This is not recruited human feedback.

## Completed game and evidence

- Fresh lobby-to-terminal game at isolated `http://127.0.0.1:5176`, leaving the ordinary port 5173 save alone.
- Loup vs Haas-Bioroid: Precision Design; current rules profile `26.03-local-2`.
- Seed `09e8877f-66ce-4333-a1cd-340658b75974`.
- **67 exported human decisions**, natural Runner victory with **7 agenda points on turn 5**, Corp 0. The last Tithe encounter left the Runner with zero cards; accessing and stealing Superconducting Hub then won the game. No concession.
- All choices used real rendered UI controls. The later repeated central runs and continuation decisions were batched with a simple policy that reread visible UI after every input. That policy is test automation, not an experienced competitive player's strategy; it repeated an R&D access unnecessarily and does not support balance conclusions.
- Complete ordinary UI export: `eval/run-drawer-panel/loup/full-game-replay.json`. Earlier turn-one export is alongside it. This session did not independently headless-replay the exported game.
- Screenshots: `turn1-access.png`, `loup-trigger-name-only.png`, `turn3-tithe-wrong-breaker.png`, `terminal.png` in the same evidence folder. The encounter screenshot is 1771×983; this tester used Chrome's normal window, without a mobile viewport override.
- `decision-observations.json` contains the later automated decisions and panel text, not a complete record of all earlier manual inputs.

## Actual play experience

I mulliganed a breaker-heavy opening into Botulus, Buzzsaw, Sure Gamble, Overclock and Carnivore. Sure Gamble's explicit five-credit cost was easy to compare with my pool. My first run on an unprotected remote advanced from Movement to Breach to Access, revealing Nico Campaign. The pinned Finish accessing button stayed separate from the two-credit Trash action. I paid to trash the campaign and resolved Loup's credit/card benefit.

I installed Botulus on the facedown HQ ice, with the host named by server and outer-first position. Its hosted program and counter were visible on the board, without revealing the ice's identity. On turn two, installing Buzzsaw required a separate Finish install choice; this screen clearly offered keeping Botulus versus trashing it for memory. After gaining a credit, Buzzsaw made a post-action paid-ability window appear. This required Continue before the next normal click action. Its generic heading made that extra window less obvious than its actual choices.

HQ's ice remained unrezzed throughout the game. I could distinguish the movement decision's Continue the run from Jack out. The compact context continued to say Unrevealed card and did not disclose its identity.

At the first Tithe encounter on R&D, playback paused before resolving damage. The context column showed both numbered subroutines. The options column explicitly said Botulus was hosted on different ice and Buzzsaw could not break a Sentry because it breaks Code Gates. I did not need to inspect Buzzsaw's full card to understand the mismatch. Next showed the first subroutine Fired with one unresolved remaining, then the second Fired with zero unresolved. This was useful and substantially clearer than discovering the mismatch after damage.

Later central accesses produced agenda steals, while Tithe's repeated damage removed Carmen, Wildcat Strike, Carnivore and Overclock. The expanded activity contained the source, pre-damage grip size and named trashed card. Terminal state clearly said You win / Runner reached 7 agenda points, and removed the live run continuation footer.

## Findings

| Priority | Observed friction | Evidence and recommendation |
|---|---|---|
| P2 | Loup's mandatory response names only the identity; its effect is not previewed. | After trashing Spin Doctor in turn 2, Card abilities offered only `René "Loup" Arcemont: Party Animal →`. The following receipt clearly showed +1 credit/card. Add that payout to the option before selection. Screenshot `loup-trigger-name-only.png`. |
| P2 | The activity heading misstates the scope of its list. | `Corp responses · your turn 3` contained 36 events including Runner installs/clicks/runs/accesses and agenda theft. Actor labels are accurate, but the group heading and `3 runs · 1 agenda stolen` highlights look like Corp actions. Use a heading such as `Your turn 3 · actions and Corp responses` when the list includes both actors. |
| P3 | Forced encounter guidance points in the wrong direction. | Paused Tithe text says `Review them below`, although the new drawer puts subroutines in the adjacent left column. Use `Review the numbered subroutines` so desktop and mobile agree. Screenshot `turn3-tithe-wrong-breaker.png`. |
| P3 | Ordinary post-action paid windows retain `Choose an action` as the heading. | After the one-credit action, only Buzzsaw's +1 strength ability and Continue were offered; normal click actions had disappeared. A heading naming the paid-ability window would explain why another continuation is needed. |

During damage playback, the subroutine caption and Fired markers were visible immediately, while the expanded activity supplied the specific randomly lost card. Keeping that loss near the damage beat would reduce the need to open activity; this is an improvement suggestion, not a missing damage-resolution defect.

## Limits

No successful Botulus break, bioroid click break, mixed-source payment, Leech use, tags, or mobile interaction occurred naturally in this game. The HQ ice stayed unrezzed, so the hosted Botulus accumulated counters without a legal break opportunity. Card inspection/source linkage was not comprehensively exercised; this tester mainly used the sidebar. No claim is made that every deck mechanic or UI path was covered. The Chrome download event listener timed out even though the browser completed the download; exports were recovered from the normal Downloads folder. That was an automation API issue, not a game-export failure.


Parent verification: independently restored all 67 exported choices with snapshot checks after each choice and reached the same natural terminal outcome.
