# Experienced deck-tinkerer review · 19 November 2026

The guide worked well for choosing a hard pairing: Hiram funded rig versus Jinteki Ambushes, listed as 12 Runner wins in 54 games (22%). It was much less useful for deciding what to change. The guide gives an outcome, without a threat explanation or a worked counter-tuning example.

I built **Panel Experiment 19Nov** through the actual UI: −2 Beta Build, −1 Sipa, +2 Jailbreak, +1 T400 Memory Diamond. The saved deck remained legal at **45 cards and 9/15 influence**, retained all three breaker types, and was selected for both games. The hypothesis was affordable multiaccess/draw and a hardware hand-size buffer. That was my hypothesis, not an established counter from the guide.

Both natural games completed without engine diagnostics. Game one ended in round 6 with Clearinghouse doing 8 meat damage against five cards; Runner had 2 points. The bounded early strategy had ignored the advancing remote and did not fully use the new maximum hand size. Game two ended in round 13 with Corp scoring Send a Message to reach 8 points, Runner 0. Early routine choices also mistakenly boosted Cleaver against a sentry. These tester mistakes materially confound the losses; neither game is evidence that the swaps helped or hurt.

In the follow-up I took over encounters explicitly. I installed Echelon by trashing Sipa for memory, used Aircheck to protect the credit pool against Whitespace, broke only its ETR routine using one Aircheck credit, and trashed Esca with the remaining event credits. I later challenged an advanced remote, paid to raise Echelon and break Lionsmane's first and third routines, and accepted two net damage to preserve a credit. The inner Whitespace ended the run before my intended Unity break completed. The history shows its routines unbroken; this is not proof of an engine timing bug.

## Highest-value improvements

1. **Explain hard pairings and give one legal tuning example with tradeoffs.** A percentage does not tell a player whether the problem is economy, a missing tutor, remote pressure, damage risk or a bot habit. Custom results should remain explicitly unmeasured.
2. **Fix observed card provenance copy.** Reading Aircheck through its play action showed its correct text but a footer saying “System Gateway #18.” Aircheck is Vantage 36018. This undercuts learning which set introduced a card.
3. **Connect the guide to action.** Provide “use this pairing” and “tune this list” links instead of requiring name matching across tabs. Preserve the source deck name and show an untested-custom-list label after editing.
4. **Reduce irrelevant ability prominence.** The UI labels a wrong-type breaker correctly, but still offers its strength boosts, including during movement/turn-start windows. My wrong boosts were a tester-driver error; their prominence is a usability hypothesis, not a rules defect.
5. **Give Hiram a concrete lesson.** The guide's next-step examples cover Loup, Weyland, Tao and Vic; Hiram could use a hardware/peek and rig/economy sequencing example.

## What worked

- Runner-win direction, denominators and AI limitations were explicit.
- Faction and influence labels were useful, changes were summarized, and Save & use selected the tuned deck successfully.
- Memory replacement, named credit sources and individually targeted subroutines supported meaningful choices.
- Both saved sessions include exact configurations, native choices, terminal results and zero diagnostics.

Subjective AI-review scores: **8/10 selecting a matchup; 4/10 crafting guidance; 8/10 deckbuilder clarity; 6/10 gameplay enjoyment; 6/10 overall guide usefulness.** This is one AI reviewer, not a human usability study or a balance estimate. I used public DTO reads and rendered DOM actions only, with bounded heuristics early and explicit manual encounter decisions later. No app changes, private-state inspection or engine-choice injection were used. No visual certification is claimed.
