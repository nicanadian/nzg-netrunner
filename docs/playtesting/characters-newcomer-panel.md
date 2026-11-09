# Character panel: novice interaction review

Date: 2026-11-06. Reviewer: independent AI panel member taking a novice/UI perspective, not a recruited human tester. Browser: shared T3 preview; own tab and own server at `127.0.0.1:5176`. The user's `localhost:5173` game was not touched. Browser evaluation read rendered DOM only; choices used ordinary controls. No application, engine or vendor code was edited by this reviewer.

## Real game completed

Tāo Salonga vs Jinteki: Restoring Humanity, seed `58a69a99-4abd-4047-9819-7ffd33641b5b`. Started from lobby and played to a natural terminal result through the UI: Corp victory by flatline on Runner turn 2. The UI-exported 13-choice replay is [newcomer-tao-jinteki-ui-replay.json](../../eval/characters/newcomer-tao-jinteki-ui-replay.json).

Actual sequence covered opening keep; VRcation; Telework install and taking credits twice; discarding two grip cards; Unity and Cleaver installs, including the final install confirmation; last-click Remote 1 run; Corp rez of Tithe; net damage randomly trashing Pantograph; continuing past fired ice; accessing a facedown three-advanced Urtica Cipher; 5 net damage with only 2 grip cards, causing flatline.

This is one deliberately risky full game, not evidence of deck balance or good Runner strategy. Tāo's ability did not trigger in this short game, so a separate legal replay setup covered it below.

## Lobby and control checks

- Runner picker listed Loup, Zahya and Tāo; Corp picker listed all four Corp identities.
- Selecting Tāo/Jinteki updated faction, play style and portrait. “Read identity ability” showed Tāo's full printed swap rule. Matchup deck viewer showed the correct identities, 40 cards each, influence totals and Jinteki's 18 agenda points.
- Reload displayed a saved-game label naming Tāo/Jinteki. Resume restored their board and terminal result. The lobby's new-game selectors independently returned to defaults; saved-game identity naming prevented ambiguity.
- Hovering the Telework install row highlighted that exact grip card. Keyboard Tab navigation reached Overclock then VRcation; each focused row acquired `action-related`, and the matching board card acquired the same linked state.
- The Telework ability was directly visible at the root, including its 1-click cost. Hosted credits changed visibly 9 → 6 → 3 with explicit credit-transfer receipts.
- At 390 CSS pixels wide, action rows fit their rail, but the decision rail was below the board (`top:1048px` in an 844px-high viewport). The document measured 398px wide, an 8px horizontal overflow; the server area itself intentionally scrolls. These are DOM geometry observations, not a full screenshot-based visual audit. Browser preview resizing reports can lag a call; measured `innerWidth` was used instead of trusting the resize response.

## Findings communicated during the session

| Priority | Observation | Effect on a novice | Status |
|---|---|---|---|
| High | VRcation initially quoted “1 click · 1 credit”, then actually spent 2 clicks. | Additional click loss was a surprise after commitment. | Parent fixed conditional click previews. Retested by importing this game's one-choice prefix after reload: “2 clicks · 1 credit / Draw 4 cards · 1 action click + lose 1 remaining click”. |
| High | With Unity and Cleaver but no Sentry breaker, Tithe's encounter had no legal Runner choice and proceeded directly into damage playback. | Encounter advice explaining type mismatch never appeared before subroutines fired. | Reported; a read-only encounter observation or richer rez beat should explain unavailable defenses and unbroken consequences without inventing a legal action. |
| Medium | Breach sole-option detail said “Facedown card · Remote 0” while the board/run banner said Remote 1. | Looks like a different server. | Reported exact text; root option detail needs presentation normalization. |
| Medium | After Urtica flatline, victory text said only “Runner flatlined”; the prior resource receipt still referred to Tithe's Corp credit gain. | Cause requires reading log and card text: Urtica base 2 + 3 advancement = 5 net damage versus 2 grip. | Reported; a source-named damage/terminal summary would make the new ambush mechanic understandable. No hidden information should be disclosed before access. |
| Medium | Before the first Corp response in Runner turn, activity remained on the completed Corp turn even after VRcation. | Draw-four and extra click loss aren't visible in default activity; own-action spending is only in last resource receipt. | Reported as context, not a rules error. |
| Low | Damage log attributed “Pantograph trashed” to Corp, while the damaged card was from Runner grip. | Actor and card owner can be confused. | Reported wording; adjacent “Runner takes 1 net damage” supplies context. |

## Tāo ability: legal setup plus real UI branch

To reach the rare scoring trigger efficiently, an engine harness played 17 legal keep/gain choices against the normal Jinteki AI, without modifying game state or card positions. The replay is [newcomer-tao-swap-prefix.json](../../eval/characters/newcomer-tao-swap-prefix.json). This is explicitly a prepared setup, not 17 human-style browser choices.

Imported through Menu → Paste game replay. Corp had just scored Superconducting Hub on turn 5. UI correctly showed “Opponent's turn · your decision”, “Resolve score effects” and Tāo's named swap ability. Clicking it opened a two-card selection with four facedown ice targets and a clearly named “Continue without swapping” alternative. Selecting R&D and HQ changed their rows to checkmarks, `aria-pressed=true`, matching board cards to `.selected`, and “Select 2 cards · 2 selected”; Confirm then became available. Confirmation actually exchanged the rendered card IDs between the two server containers while keeping identities concealed.

Remaining feedback issue: activity said exactly “hidden card protecting HQ · ice 1 in R&D swapped with hidden card protecting R&D · ice 1 in HQ”. Current and previous locations are combined confusingly. Identical facedown backs make the result hard to perceive after selection disappears. Prefer a source-named result such as “Tāo swaps R&D ice 1 ↔ HQ ice 1”, with both affected locations highlighted. Jinteki's next income was also generic “When your discard phase ends triggered / Corp gained one credit”, without identity attribution.

## Evidence limits

The full game and rare-trigger branch were driven through the real UI and inspected through rendered DOM. No claims are made about new screenshot captures, pixel quality, complete keyboard-only game completion, every identity matchup, tags, or mobile touch accuracy. Keyboard linked highlighting and phone-width geometry were sampled. The parent panel combines these observations with the other reviewers' mechanics coverage and subsequent fixes.
