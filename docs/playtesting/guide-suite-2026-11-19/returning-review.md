# Returning-player review — fresh reviewer #5

R1, R2 and R3 completed with Gateway + Elevation and the unique custom Runner **Suite Returning 19Nov**. All actions used rendered inputs/buttons. Snapshot automation timed out: DOM-only evidence, no visual-layout claims. First impressions were saved before any previous reviews were read. No product source changed.

| Task | Outcome | Guide versus other help |
| --- | --- | --- |
| R1 save, leave, reload, identify custom and baseline | Completed. Dashing Mad → +1 Leech / −1 Charm Offensive. Saved and reloaded 45 cards, 17/17 influence. My deck label and My decks library section distinguish custom from ready-made. Separate baseline inspection confirms Leech2/Charm2 versus own Leech3/Charm1. | Guide explains preliminary six-game results and unbenchmarked custom decks. Builder supplies legality, deltas and save controls; returning-player knowledge supplies the same-faction small swap. |
| R2 brief play, return, edit future deck | Completed. Kept opening hand, gained one credit twice, leaving 7 credits/2 clicks. Menu → Change decks for a new game returns lobby. Saved +1 Smartware Distributor / −1 Scrounge for future play. | Menu and lobby explain saving and future-game edits. Guide has no navigation/persistence instructions. |
| R3 Resume original, start revised fresh game | Completed. Resume retained identical original session and final version41/turn2, 0–0, diagnostics []. In-game loadout shows Smartware2/Scrounge2. New Jack in has new seed, version2/turn1, zero human choices, and Smartware3/Scrounge1 in both session and rendered loadout. | Explicit lobby Resume/Jack in explanation and View matchup decks supplied verification. Guide only helps avoid treating baseline benchmarks as custom-deck results. |

| Finding | Severity | Improvement and acceptance test |
| --- | --- | --- |
| Guide Core entries show Phoenix and Precision Design identity names where lobby/library use Dashing Mad and Brutal Efficiency, despite advice to use exact list names. | P2 | Expose exact bundled list titles in guide options/bars. A returning player must be able to match Dashing Mad and Brutal Efficiency verbatim to lobby. |
| Returning-player save/library/Resume workflow is absent from guide. Tasks succeed from lobby/menu copy. | P3 | Add short Menu → Change decks → edit/save → Resume original or Jack in revised instructions. Acceptance: original session survives later library edit. |
| Reopened saved editor says No card changes yet, so cumulative baseline delta is not presented. | P3 | Show based-on Dashing Mad and cumulative comparison. Reloaded custom editor should expose +Leech/−Charm without opening baseline separately. |
| Saved game and revised library list retain the same name; snapshot context is implicit. | P3 | Label game-start snapshot and current library revision. Acceptance: Resume visibly shows old counts while fresh Jack in shows revised counts. |

Both exact deck documents passed CLI validation: valid/legal/implemented true, 45 cards, 17/17 influence and no errors. Core rules/AI audit remains pending; AI certification is false. Captured prefixes are supplied for parent-suite deterministic replay validation. Public UI calls the first Runner turn Turn1; engine checkpoint uses turn2 after the Corp turn.

Evidence: returning-checkpoints.json contains original, resumed and fresh checkpoints; returning-original-deck.json and returning-revised-deck.json contain exact documents; returning-ui-trace.json records rendered states; returning-review.json expands each task’s steps, status, evidence, help attribution, severity, improvement and acceptance test.

No full natural game was requested. The final fresh opening save intentionally replaced my original Core save through normal Jack in behavior. Other testers’ decks were preserved, no storage was manually written/restored, and no multi-tab interference was observed during my sequence. Initial shared Gateway/Core save labels were recorded as context, not claimed as my work. Own main/guide tabs were closed; the guide popup required window.close after the close API reported ownership mismatch.
