# Counter design playtest: newcomer and accessibility perspective

Date: 2026-11-05. Independent AI playtester using the actual Google Chrome extension browser, isolated origin `http://localhost:5176/`. This was an opening-game and focused-counter session, not a human session or a completed game. No app code or game runtime state was modified by this tester. All game decisions, replay import, undo, and export used the normal UI.

## Scope and evidence

- Started a fresh Runner match from the lobby. Made **20 new game decisions**, including one credit-gain decision subsequently undone. The final normal-UI export contains **19 retained decisions**, saved as `eval/counters/newcomer-fresh-replay.json`. Menu navigation, rules reading, card inspection, reload, and resume are excluded from the count.
- Played to Runner turn 4, with keep hand, basic credit gains, drawing, Verbal Plasticity and Cleaver installs, HQ run, movement/access choices, Carmen install initiation and completion, and automatic Corp turns.
- Then imported `eval/counters/corp-income-replay.json` through Paste game replay for a separate focused Nico Campaign test. Exercised its income ability, undo, reload, and resume. These are additional focused checks rather than fresh-game decisions.
- Screenshots: `eval/counters/newcomer-click-spent.png`, `newcomer-turn-reset.png`, `newcomer-hosted-credits.png`, `newcomer-hosted-credit-details.png`, `newcomer-credit-transfer.png`, and `newcomer-resume.png`.

## Results

**No blocking counter issue found.** The turned-over click markers, exact totals, named counter badges, and persistent resource-change panel make the relationship between actions and resources understandable.

1. **Basic click spending and keyboard activation passed.** Pressing Enter on Gain 1 credit moved the Runner pool from 5 to 6 and clicks from 4 to 3. The screenshot shows three bright faces and one dark reverse. A visible focus outline stays on the action. The accessible click graphic reads “3 clicks remaining out of 4,” and Last resource change records +1 credit and −1 click.
2. **Draw and install costs passed.** Drawing spent one click without changing credits. Verbal Plasticity's details action explicitly said “Install 1 click · 3 credits”; completing it moved pool 6 to 3 and clicks 2 to 1. Cleaver cost 3 credits and one click. Carmen's two-step install showed costs again on Finish install, which made the pending payment understandable.
3. **Run continuation did not replay resource spending.** Running HQ spent the last click and Corp rezzing Ansel cost 6 credits. Continue the run and Access a card left totals unchanged and did not repeat a credit delta badge or resource-change announcement. The “Last resource change” panel intentionally continued to display the most recent actual change, labeled with its turn. Its explanatory copy says these are net changes between decisions, including automatic effects.
4. **Turn refresh passed.** Turns 2, 3, and 4 restored the Runner's four click faces and showed the refresh symbol with “4 left.” Automatic Corp income and the player's final action can share one net-change panel; the explanatory sentence accurately describes this aggregation.
5. **Undo and resume passed for basic resources.** After a second-turn gain, Undo restored Runner pool 3 and clicks 4 and removed the resource-change panel. Reload returned to the lobby; Resume restored exactly those values without invented +1/−1 feedback.
6. **Help and keyboard dialog behavior passed.** Enter opened How to play; Tokens and counters explains bright/spent click faces, card credits versus pool, CR/ADV/VIR/PWR/AGN, and the engine moving counters. Escape closed it and returned focus to How to play. Card details opened through Enter and presented exact counts in ordinary text.
7. **Hosted credits are distinguishable from pool credits.** Imported Nico showed 9 hosted credits on its card, separate from a Corp pool of 5. The card button accessible name includes “9 hosted credits,” and its details repeat that in text beside the CR badge. Its ability moved pool 5→8 and card 9→6, kept all 3 clicks, and the feedback listed both “Corp · credits +3 · 8 left” and “Nico Campaign · Remote 0 root −3 · 6 hosted credits.” This is the strongest moment in the design for teaching what the physical stack represents.
8. **Hosted undo and resume passed.** Undo restored pool 5/card 9 and cleared change feedback. Reload and Resume preserved both counts and the three available clicks without a fabricated change panel.
9. **Replay recovery passed.** Pasting invalid JSON produced an alert while leaving the input editable. Replacing it with the valid income replay succeeded. Import restored counts without animating a fictitious credit transfer. Normal export downloaded the fresh trace; the automation download-event wait timed out, but the file itself was created and copied successfully.

## Remaining observations

- The exact numeric labels and card details matter more than counting the decorative stack. At this viewport the stack gives a clear “money lives here” cue, while the number and explicit hosted-credit language do the precise work.
- The persistent last-change panel can still be mistaken for the effect of a pass by a very new player. Its title and turn label are accurate; a future refinement could add the triggering action or “No resource change” beside pass feedback while retaining history. This is optional, not an observed accounting bug.
- Large turns with automatic opponent actions are summarized as net changes; players needing each individual spend should open the log. Help already explains this.
- Early testing showed “1 clicks.” This was reported and corrected by the implementation agent during the session; later screenshots and snapshots showed “1 click.”

Own Chrome tab was closed at completion. No full-match, screen-reader application, zoom, mobile, or human-player testing was claimed.
