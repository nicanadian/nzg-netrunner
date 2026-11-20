# Corp constraints review

Fresh AI walkthrough, 19 November 2026, actual shared incognito browser at localhost:5173. C1, C2 and C3 completed. This is one AI review and one natural game, not a human study or balance claim. Snapshot timed out after 15 seconds; evidence is rendered DOM and public state/session, so visual layout was not assessed. First impressions were saved before consulting any other reviews; no other panel review was consulted.

## C1 — choose an opponent as Corp: completed

Opened the lobby's actual Pairing & learning guide with Gateway selected, read Loup results, then selected Tāo Salonga. Chose base Reality Plus (`reality-plus-v2`, Tags & consequences) against base Tāo (`tao-v1`, Build a rig & rearrange ice): Runner 3, Corp 3 of 6, 50% Runner wins. For contrast, Loup versus the same Corp showed Runner 4/6, 67%, harder for Corp; Tāo versus base Precision Design showed Runner 2/6, 33%, harder for Runner.

The guide supplies direction, raw counts, preliminary labels, the roughly 17-point shift per game, AI-versus-AI limitation, and custom-deck caveat. Choosing as Corp requires tester inference: keep the Corp row fixed while browsing a selector labelled “Your Runner deck.” Difficulty moderate; severity medium. Add a Corp view preselected from lobby. Acceptance: Reality Plus Corp lobby opens the correct pool and Corp, shows Tāo's 3–3/6, and describes the sample without promising personal odds. Vantage recommendations still lead the page opened from Gateway; contextual pool recommendations would reduce distraction.

## C2 — encounter and repair constraints: completed

Tune deck → expand Deckbuilding basics → remove one Offworld Office. Builder changes from 44 cards, 18 agenda points to 43 cards, 16 points and states “43 cards requires 18–19 agenda points; currently 16.” Restoring the Office returns Ready to play. At Spin Doctor count 3, + is disabled with title “Maximum 3 copies in a deck”; an attempted click leaves it at 3. Add replacements also labels other-faction agendas “Cannot include · Agendas must match your faction or be neutral.”

Added three Anoetic Voids with rendered + controls: 47 cards, 17/15 influence, 18/20–21 agenda points. Builder reports both influence excess and agenda shortage. Removed two Voids and one Retribution: 44 cards, 8/15 influence, 18/18–19 agenda points, Ready to play. No illegal draft was saved. An accidental read-card selector hit + once, briefly producing 45 cards/12 influence; immediately removed that Void before saving and opened Read card by exact text.

Guide-supplied repair knowledge: none. The builder supplies one-for-one swapping, live errors, faction/import multiplication and limits. Tester knowledge supplied the specific repair. Difficulty low for this experienced AI tester, novice comprehension untested; severity medium. Add a worked Corp repair example including the 44→45-card agenda-band boundary, influence calculation, maximum copies, and same-faction/neutral agendas. Acceptance: a reader can diagnose both errors in the 47-card/17-influence/18-agenda draft and explain a legal repair before relying on UI enforcement.

## C3 — legal revision and natural game: completed

Saved and selected **Suite Constraints 19Nov**, Gateway Reality Plus base minus one Retribution plus one Anoetic Void. Verified the exact 44-card session config after Jack in. Final totals: **44 cards, 8/15 influence, 18 agenda points, required 18–19**. Exact card IDs/counts, identities, seed and all 58 UI choice records are in `constraints-game.json`.

Learning hypothesis: practice ending a remote run with Anoetic Void's 2-credit/2-HQ-card payment. Tradeoff: +3 net influence, one fewer tag-conditional program-trash operation, and card/credit cost to defend. This is a learning revision, with no measured strength claim.

The natural game ended **Corp 8, Runner 6**, UI Corp turn 9 (public internal turn 17), version 511, terminal “Corp reached 8 agenda points.” Diagnostics empty. No concession, undo or reset. Early unprotected R&D cost two Send a Messages; this was a play weakness. Continued scoring and reinforcement recovered the game:

| UI Corp turn | Decisions and observed evidence |
| --- | --- |
| 1 | Keep two agendas/two ice/economy; Hedge Fund; Palisade HQ; Funhouse new scoring remote. Runner trashes Anoetic from R&D and steals Send a Message; choose free Funhouse rez to save its 5-credit cost. |
| 2 | Tomorrow's Headline in remote; advance twice. Runner steals second Send a Message, swaps HQ/remote ice with Tāo; choose free Palisade rez on scoring remote. |
| 3 | Advance and score Headline (2 points); tag effect; choose Reality Plus draw 2 to find defense. Funhouse R&D; Spin Doctor new remote, rez, recycle Anoetic and Hedge Fund; discard Regolith. On HQ encounter resolve Funhouse, choose identity gain 2 to support rez/advancement. |
| 4–5 | Office in remote, Whitespace reinforces R&D, advance; then three advances and score Office (4 total), gain 7 credits. Tāo swaps remote Palisade and R&D Funhouse. |
| 6–7 | Second Office in remote, reinforce with Ping, advance. Explicitly rez Ping for 2 when Runner approaches that remote; choose identity gain 2; Ping ends the run. Three advances and score Office (6 total). Tāo later swaps Ping/Whitespace; Runner uses Cleaver to break R&D barriers. |
| 8–9 | Orbital in remote, advance twice. Recovered Anoetic drawn turn 9; install in same remote, advance twice, score Orbital to 8 and terminal. |

Anoetic was recycled and installed, but never activated before the win. The proposed learning interaction remains untested. The guide's rate caveats correctly prevent treating this custom-deck win as evidence of improved strength. Tester knowledge supplied scoring, rez budgeting, remote reinforcement, tag rewards and recycling. Difficulty moderate; severity medium. Add a side-specific learning worksheet: one change, legal totals, anticipated trigger/cost, tradeoff, whether it occurred. Acceptance: this revision records “no activation observed” and avoids concluding that the win validates the change.

All gameplay mutations used rendered DOM button clicks, including bounded batches of 2–3 known advancement clicks and Skip to decision for animations. Public state/session reads only; no engine/worker injection or private Runner cards. Both opened tabs were closed, confirmed unavailable on the game tab. No shared storage/global preferences were cleared or restored; parent handles restoration.
