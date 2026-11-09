# UI/UX panel review — initial pass

Date: 2026-11-05. Reviewer: independent AI UI/UX specialist perspective; this is not a claim of human credentials or human playtesting.

## Method

Used the actual Chrome extension browser at `http://localhost:5174`, with its existing desktop viewport (1771 × 1017). Opened a separate review tab and did not change shared viewport settings. Started a fresh Runner game and made 14 legal game decisions, including opening keep, Sure Gamble, Fermenter install, HQ run, Ansel's bioroid break, movement, access, turn transition, Fermenter payout, draw/credits, and concede. Then restored `eval/counters/corp-income-replay.json` through Menu > Paste game replay and resolved Nico Campaign's payout. Tested help-dialog keyboard focus/escape and malformed replay entry. Closed my tab at completion.

All findings below are observed in browser behavior or rendered DOM. No source-only concerns or invented usability scores are included.

## Ranked findings

### 1. Explain active restrictions where the blocked action would appear — high

On the first HQ run, Ansel 1.0's final subroutine prevented stealing/trashing for the remainder of the run. When Offworld Office was accessed, the panel said: “You made it in. Steal agendas, or pay the trash cost…” but offered only **Finish accessing**. The reason was buried in recent activity. This looks like a missing agenda action.

Fix: display the active run restriction next to the accessed card, e.g. “Ansel 1.0: You cannot steal or trash Corp cards this run.” Replace generic access guidance when it contradicts current rules. Keep restrictions visible through access, even after other activity pushes the log down.

Evidence: `eval/polish/ux-restricted-access.jpg`.

### 2. Preserve an understandable encounter resolution checkpoint — high

The Runner had one click left. I chose Ansel's ability and spent that click to break “Trash 1 installed Runner card.” The application immediately fired the two remaining subroutines and advanced to Movement, including the steal/trash restriction. No further explicit Resolve choice remained. This may be legal engine automation, but the outcome is easy to miss. The receipt showed the spent click and “Continue · Lose Click…” while only the recent log explained the non-resource restriction.

Fix: preserve an explicit “Resolve 2 remaining subroutines” checkpoint after breaking, or add an equally clear encounter result before movement: one broken, two fired, with persistent restrictions shown. Strike through broken subroutines and mark resolved ones. Do not rely only on resource deltas for gameplay outcomes.

Evidence: `ux-encounter.jpg`, `ux-restricted-access.jpg`; sequence described above.

### 3. Translate engine labels into player decisions and expose costs early — medium

The encounter button read “Use ability (Ansel 1.0 protecting HQ at position 0) Break 1 subroutine on this ice.” It omitted the click cost until the next selection. Subsequent choices used “Lose Click.” First remote was named **Remote 0**. Logs also exposed **position 0**. Fermenter says “Gain 2 credit for each hosted virus counter.” These details visibly diminish polish and require rules knowledge to parse.

Fix: “Ansel 1.0 — Spend 1 click to break a subroutine”; then “Break: [subroutine]” with consistent `1 click` cost tag. Present the first remote as Remote 1. Use “outermost / innermost” or “ice 1 of 2” instead of zero-based positions. Fix credit/card plurals; for example, DOM labels said “Inspect Archives · 1 cards.” Do not merely change one visible button while retaining internal text in pinned previews/receipts/logs.

Evidence: `eval/polish/ux-encounter.jpg`; focused corp-income scenario.

### 4. Make timing guidance conditional on available choices — medium

The restored Nico Campaign state was at Corporation's Turn Begins. The text said “Choose an action, or continue to pass this timing window,” but the only choice was the mandatory Nico payout. No Continue existed. Runner's generic encounter text also emphasizes matching icebreakers even when the relevant available ability is a bioroid click payment.

Fix: distinguish mandatory triggers, optional paid windows, encounter abilities, and action phases in concise language. “Resolve Nico Campaign's start-of-turn ability” is clearer in that state. Show pass instructions only when passing is currently available.

### 5. Attribute action receipts to the correct cause — medium

Keeping an opening hand produced “Your action · Keep this hand · Continue” and attributed Corp +3 clicks to it. Finishing access later produced a receipt titled “Finish accessing · Continue” containing Corp income, click refresh, and a virus counter from the next turn. The resource data is valuable, but cause and boundary are not consistently described.

Fix: normalize Continue out of user-facing action titles. Separate the chosen action from turn refresh/start-of-turn/AI activity even when the action itself changed no resources. Use clear turn headings, avoid repeating Turn 1 in both outer and inner labels, and include non-resource outcomes such as run restrictions.

### 6. Make replay errors actionable — low

Malformed replay entry showed a raw parser message: `Unexpected token 'o', "not JSON" is not valid JSON`. The field retained the input and dialog remained usable, which is good.

Fix: prefix with “This replay could not be read. Paste the complete JSON from an exported game replay.” Keep technical detail secondary if useful. Associate the error with the field and announce it through an alert/status.

Evidence: `eval/polish/ux-import-error.jpg`.

## What worked

- Lobby gives an immediate, attractive side choice and clear primary Jack in button.
- Card click opens a readable pinned preview with a well-labeled action and full click/credit cost for Sure Gamble. Returning to play after the action is smooth.
- Turned click markers, card credit/virus labels, and exact totals are readable and remain tied to the board state.
- In the inspected encounter, the bioroid ability was visually primary and Resolve was secondary. An initial concern based on DOM order was withdrawn after screenshot inspection.
- Help dialog opens with focus on Close; Tab/Shift+Tab stayed in its native dialog focus behavior; Escape closed it and returned focus to How to play. No keyboard blocker observed.
- Empty Runner rows use reserved labels and dashes without pretending cards exist. Completed game offers a clear result, reason, and Play again action while retaining the board for review.
- Replay import states that it replaces the local save; restore works through the normal UI.

## Screens captured

- `eval/polish/ux-lobby.jpg`
- `eval/polish/ux-opening.jpg`
- `eval/polish/ux-encounter.jpg`
- `eval/polish/ux-restricted-access.jpg`
- `eval/polish/ux-terminal.jpg`
- `eval/polish/ux-import-error.jpg`

## Recheck recommendation

Repeat the Ansel encounter with exactly one click remaining, break its trash subroutine, and then access an agenda. The experience should explain every remaining subroutine outcome and why steal is unavailable without opening the log. Recheck Nico's mandatory turn-begin payout, first remote numbering, and one-card Archives labels. Preserve the working native-dialog focus behavior.

## Integrated final recheck

Reloaded the application on the same isolated Chrome origin, without changing the viewport. Used a fresh Runner game, the existing Nico/Runner virus fixtures, and retained historical Chrome replay prefixes supplied as `eval/polish/ansel-encounter-replay.json` and `eval/polish/restricted-access-replay.json`. All restore operations used the normal Paste game replay dialog; no browser state injection or app code edits.

- **Access restriction — passed.** The retained access checkpoint visibly shows “Ansel 1.0: the Runner cannot steal agendas or trash Corp cards during this run.” The hint now explicitly directs the player to the active restriction and says only permitted actions are available. The contradictory “Steal agendas” hint is gone. The saved checkpoint accesses Palisade, rather than reproducing the initial Offworld Office draw, but the restriction is clearly visible independently of the log.
- **Encounter outcomes — passed.** Starting from the Ansel encounter, chose its ability, spent one click to break subroutine 1, and explicitly resolved the remainder. Movement shows **1 broken · 2 fired**, numbered subroutines, **✓ Broken**, both **Fired** states, and the active restriction banner. Separately, a fresh Tithe run automatically resolved its two subroutines; Movement clearly explained that unbroken subroutines fired and showed **0 broken · 2 fired**. This addresses the visibility problem when the engine advances automatically.
- **Ability wording/cost — passed.** Ansel's ability quotes **1 click** before commitment. Choices say **Break subroutine 1/2/3**, each with the click cost. The receipt says **Break subroutine 1 · Ansel 1.0**. Brân's bioroid choice and receipt were also checked and use the same clearer pattern.
- **Mandatory timing — passed.** Nico's turn-start state now says “Resolve your turn-start effect before taking actions,” with its exact hosted-credit payout choice. It no longer tells the player to use an unavailable Continue.
- **Numbering and grammar — passed.** First remote is **Remote 1**. One-card Archives says **1 card**. After the latest reload, logs say **HQ · ice 1**, with the earlier raw position 0 string removed.
- **Turn ownership and empty states — passed.** Header distinguishes **YOUR TURN · YOUR DECISION** from resolving states and marks the current turn on the player header. Empty Corporation score and Archives dialogs show deliberate titles, explanatory text, and empty-state icons. Escape closes them.
- **Opening receipt — improved.** Keeping a hand now labels the click refresh **Turn begins**, rather than attributing Corp clicks to Keep this hand. Start-of-turn/automatic effects remain separately listed.

No blocker found in this focused retest. One small remaining contextual detail was reported: when accessing an ice card from HQ, the card details area still renders an **Ice subroutines** list with **Unbroken** status. Those encounter statuses would be clearer if limited to actual encounters. The screenshot of Ansel Movement also retains the side-panel scroll offset from choosing a low-down action; the restriction and outcome are visible, but the heading sits above the current panel viewport. A reset-to-top on major phase changes is worth considering if it does not disrupt deliberate log review.

Final evidence: `eval/polish/ux-final-movement.jpg`, `eval/polish/ux-final-restricted-access.jpg`, and `eval/polish/ux-final-ansel-movement.jpg`. The retest tab was closed afterward. This remains AI specialist browser review, not human expert playtesting or a completed full match.
