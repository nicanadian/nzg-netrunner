# Corp guide retest — 19 November 2026

Completed one natural game as **Retest Corp 19Nov**, NBN: Reality Plus, against the worked guide's **Tāo Salonga / Build a rig & rearrange ice** (`tao-v1`). Corp won **9–2 on UI turn 16** (public state turn 31, version 1009), with no diagnostics. This is evidence that the learning workflow can be completed; it does not prove the edit improved the deck.

## First impressions and setup

I read no earlier panel or retest reports. From a fresh Gateway lobby, choosing Corp then opening the guide carried **Gateway, Corp and my Precision Design / Build & score baseline**. Corp percentages and raw counts agreed: for example 4 Corp wins of 6 showed 67% Corp wins. Difficulty labels on matchup rows agreed too.

The Tag and score worked example gave a concrete experiment without requiring me to invent one. Its **Open starting deck to edit** action correctly selected Reality Plus `reality-plus-v2`, Tao `tao-v1`, and the Corp player role, then opened the builder over the lobby. It did not start a game. I applied **−1 Retribution / +1 Anoetic Void**, saved **Retest Corp 19Nov**, and separately clicked Jack in.

The resulting **44 cards, 8/15 influence, 18 agenda points against the required 18–19** matched the recipe. The builder named the Tags & consequences baseline, showed the exact difference, and warned that the custom revision had no benchmark results. Reopening the guide from the custom lobby clearly explained that its rows describe bundled baselines and named the custom deck in the notes area. All five note fields were filled through actual inputs; observed results and next decision were updated after the game.

## What happened in the game

- Kept an opening hand with Hedge Fund, Palisade, Regolith and agendas. Played Hedge, protected HQ and R&D, and made explicit rez decisions when the Runner approached. An early Hansei discard of Send a Message to unprotected Archives was a strategic mistake; Spin Doctor later recovered it.
- Scored Offworld Office on turn 4. Tao's ice swap changed the scoring protection; I failed to reassess fully and exposed Orbital behind Funhouse, which the Runner stole on turn 5. I then reinforced the scoring lane with Whitespace and HQ with Tithe rather than repeatedly banking credits.
- Anoetic was **drawn and installed on turn 7**. I kept its two-credit and two-HQ-card payment in mind. A turn 10 remote attack ended at Whitespace, so there was no upgrade activation to credit for that defense.
- On turn 9, Public Trail enabled Reality Plus's draw reward and the **remaining Retribution trashed Cleaver**. That made the removed slot's alternative use concrete.
- Scored another Offworld on turn 11 and Orbital on turn 13. After another Tao swap, I played Hedge and installed a second Whitespace around the scoring lane, then installed Send a Message.
- On **turn 14**, a wealthy Runner passed Whitespace, Tithe and Funhouse. I rezzed Anoetic for zero before approach, triggered it at approach, **paid two credits and trashed Funhouse plus Hansei Review**, and ended the run before access to Send a Message. The payment choice and the first/second-card prompts clearly stated the committed costs.
- Next turn I chose Planogram income before advancing to preserve the defense budget. On turn 16 I finished advancing Send a Message to five and scored for the natural agenda win. No undo, concession or restart was used.

The guide's support reminder was useful: its two expendable HQ cards mattered as much as the two credits. The notes prevented me from confusing “the upgrade was installed” with “the upgrade caused the defense.” I brought prior Netrunner rules and strategy knowledge; the guide structured the experiment and reserve planning, while most individual economy, ice and scoring choices came from that prior knowledge.

## Prioritized findings

**P2 concrete content bug:** the static **How to read the results** section still says “Below 40%: harder for the Runner … Above 60%: harder for the Corp” while in Corp mode the rows show **Corp** win rates. This contradicts the correct row labels and the selected-side introductory text. Make that paragraph role-aware or say “below 40% is harder for the selected side; above 60% is harder for the opposing side.” Acceptance: switch Runner ↔ Corp and check explanation, percentage label, raw counts and difficulty label across below-40, 40–60 and above-60 examples.

**Low-priority preference:** the generic before-play sentence about the “right breaker or rez budget” is less actionable than the concrete Corp paragraph about Anoetic's payment. A role-specific opening checklist could mention rez reserve, scoring lane and visible breakers/Tao swaps. This is a refinement, not a failed workflow.

All requested context, tune, legal-recipe, baseline/custom-warning, note and complete-game checks passed in this run. No additional concrete guide defect was observed.

## Evidence and limits

`corp-game.json` contains the exact session and requested final state; `corp-decks.json` contains both exact game-start lists. `corp-ui-trace.json` includes the workflow/strategy trace, all 200 recorded decisions and the final 150 public history events. `corp-notes.json` preserves actual guide field values and saved status. `corp-review.json` is the structured assessment.

The first preview snapshot timed out. **This was a DOM-only assessment with no visual or layout certification.** All mutations used rendered DOM buttons or inputs, and only public `localTable.state` informed play. Session data was read only after the terminal state for evidence. Some initial rapid dependent clicks arrived during rerender and failed harmlessly; subsequent interactions used settling delays.

One AI playtester against an AI opponent cannot establish human novice comprehension, deck strength or a matchup rate. Strategic mistakes in the game further limit balance inference. No Conduit appeared installed, so I did not test its multiaccess threat. Anoetic's one successful activation establishes an observed opportunity and usable payment workflow, not comparative superiority.
