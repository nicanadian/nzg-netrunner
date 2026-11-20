# Updated guide playtest · 19 November 2026

Three fresh AI reviewers tried the implemented guide in actual browser sessions, crafted exact custom revisions, and completed three natural games. The new setup, recipe, baseline and notes flows worked end to end in these sessions. Parent replay checks reconstructed all **896 native decisions**, exact terminal results and points; all game deck documents validated and diagnostics were empty.

This is AI usability critique, not a recruited human study or competitive balance experiment. Reviewers retain prior Netrunner knowledge and used public-state tactical choices. They saved impressions before reading previous panel reports. Routine rendered clicks were sometimes batched. Snapshot requests timed out, so this pass does not certify visual design or accessibility. Each tester had a distinct storage origin, reducing interference between simultaneous library/game saves.

## What worked

- **Setup intent:** guide actions retained exact deck IDs, pool and player side, opened the correct editor and did not start a game. The returning reviewer explicitly tested a Corp setup with a custom Runner opponent, then restored Runner and later returned again with the same correct pair.
- **Actionable recipes:** the Corp reviewer could perform Retribution → Anoetic Void without inventing an experiment. The displayed 44 cards, 8/15 influence and 18 agenda points matched the saved and played list. The stealth and Core recipes also produced legal revisions.
- **Cumulative comparison:** the returning reviewer saved Leech/Charm Offensive, then Smartware/Scrounge. Session Changes described the latest edit while Compared with baseline retained all four changes after save, reload and reopen.
- **Benchmark honesty:** the builder and guide identified custom revisions as unbenchmarked, keeping the original AI record attached to the bundled list.
- **Observation notes:** custom context was named, fields persisted after reload, and postgame notes separated a card being installed from its effect being useful. Separate baseline/custom scopes were understood.

## What the games taught

| Session | Played revision | Legal totals | Final agenda points | Native decisions |
|---|---|---|---|---:|
| stealth-game | Retest Stealth 19Nov | 40 cards · 8/15 influence | Corp 6 – Runner 8 | 494 |
| corp-game | Retest Corp 19Nov | 44 cards · 8/15 influence | Corp 9 – Runner 2 | 200 |
| returning-game | Retest Returning 19Nov | 45 cards · 17/17 influence | Corp 0 – Runner 9 | 202 |

### Stealth Runner

DZMZ was actually used: early installation reduced the costs of Conduit, Corsair, Echelon and Unity. The baseline already included two copies, so the opening draw cannot be attributed to adding a third. The reviewer used named Touchstone credits for Corsair reductions and separate ordinary/run credits for breaking, adapting the guide's strength-4 example to other ice strengths. These are observed uses, not proof that the edit beats Pantograph. Purging Conduit and dense R&D defenses later required changing the attack plan. Reviewer opening/timing mistakes and prior rules knowledge remain documented in the individual report.

### Corp learning

Anoetic Void was drawn and installed on turn 7. The reviewer reserved two credits and two expendable HQ cards. Earlier Whitespace stopped a run before the upgrade had a chance to matter; the notes did not credit Anoetic for that defense. On turn 14, Anoetic actually rezzed and ended a run before access to Send a Message after payment of two credits and discarding Funhouse/Hansei Review. The remaining Retribution also trashed Cleaver during the game, making the cost of cutting a copy concrete. One successful opportunity does not establish comparative deck strength.

### Returning Core player

The guide/lobby agreed on Dashing Mad and Fine Print. Two saved revisions, custom benchmark context, original setup return, note reload and Resume all worked. Leech never appeared; Smartware was installed/loaded but trashed after a tag before its payout. The reviewer correctly recorded the sustained-income and Leech hypotheses as untested despite winning. Most tactical subroutine, memory and remote-threat decisions still relied on prior knowledge.

## Defects found and small follow-up corrections

1. **Corp reading-section direction:** rows correctly used Corp win rates, but the static text still said below 40% was harder for Runner and above 60% harder for Corp. Parent reproduced the inconsistency. After the sessions, that paragraph was corrected to selected-side/opponent wording and checked in Corp mode. See direction-defect-before.json and post-review-checks.json.
2. **Touchstone prerequisites needed prominence:** the stealth reviewer identified that the short event → credit wording omitted the first-event-per-turn limit and uniqueness at the point of use. After the sessions, the inline lesson was clarified: only the first event each turn loads Touchstone, multiple active copies should not be assumed, and separate reduction/break funding still matters. Full card text remains the authority.

The product snapshot stayed fixed during gameplay evidence gathering; these copy refinements were made afterward. A further low game-copy defect, Spend ClickClick for a two-click Manegarm payment, was normalized to Spend 2 clicks in the presentation layer and regression-tested. The Palisade example now explicitly distinguishes remote strength 4 from central strength 2 before modifiers. These refinements are not a new full-game cohort or a claim that all remaining educational gaps are resolved.

## Remaining polish

- **Copy baseline plan into a custom experiment.** Keep notes isolated, but offer an explicit action copying the hypothesis/tradeoff/opening plan into a new revision. Do not copy old outcomes as though they belong to the new list.
- **More concrete optional opening examples.** Corp advice about the exact Anoetic payment was more useful than the generic right-breaker/rez-budget sentence. A short side-specific scoring/rez checklist and a Phoenix safe-subroutine example could reduce reliance on expert knowledge.
- **Adaptive-play guidance.** A lesson should permit switching targets when the opponent purges viruses or overprotects a central. Avoid turning a suggested learning plan into mandatory repeated runs.

These are targeted refinements. The observed baseline, handoff, custom-context and save/note workflows did not reproduce the prior failures. Different AI reviewers and strategies prevent a causal before/after score or human-learning claim.

## Evidence

- [Stealth review](stealth-review.md) · [structured notes](stealth-review.json)
- [Corp review](corp-review.md) · [structured notes](corp-review.json)
- [Returning-player review](returning-review.md) · [structured notes](returning-review.json)
- [Exact construction and replay validation](replay-validation.json)
- [Protocol](protocol.md) · source-snapshot/ contains the reviewed product version.

Game configs/choices, exact lists, UI traces and observation notes are retained beside the reviews. Run node docs/playtesting/guide-retest-2026-11-19/validate-replays.cjs to reproduce the game checks. Test-profile storage was restored and the temporary 5174 app server stopped; the user's default browser profile and normal dev server were preserved. No release or publishing was performed.
