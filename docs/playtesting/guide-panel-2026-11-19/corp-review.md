# Corp learner review · guide-led deckbuilding · 19 November 2026

This AI tester used the actual shared browser to read the lobby reference, tune a Corp deck, and complete one full game. Public visible state informed decisions; routine game actions used bounded DOM-button heuristics. No engine action injection or hidden opponent information was used. A shared-browser snapshot timed out, so this is a text/control/flow review rather than visual certification.

The guide led me to **Built to Last · defensive economy vs Vic · central pressure**, shown as Runner 26/54 (48%) in the benchmark. I made a **Panel Corp 19Nov** deck through the builder: −1 Pharos/+1 Tithe and −1 Vulture Fund/+1 Regolith Mining License. It remained **40 cards, 14/15 influence and 18 agenda points**. This was a learning experiment: lower opening rez costs, keep two Vulture Funds to learn bad publicity, and add familiar sustained income. These swap ideas came from prior rules knowledge; the guide itself did not teach how to tune a list.

The game completed **Corp 3–Runner 8 in round 10**, with **48 native decisions, 74 gameplay UI clicks, zero diagnostics**. The exact tuned documents and session are preserved in corp-game.json; corp-ui-trace.json records gameplay controls. One unplayed opening was restarted before any native choice to ensure the asynchronous save/use had finished selecting the custom list.

The clearest gameplay lesson was real: after Vulture Fund, the Runner repeatedly spent bad-publicity credits on Cleaver to break the lone Palisade protecting R&D. The text's warning became concrete. My Corp driver later banked 25 credits without reinforcing effectively, so this loss is evidence of weak heuristic strategy, not evidence that the deck swap damaged balance.

## Highest priorities

1. **Bridge the guide to setup.** Plain-text recommended pairings require remembering names, returning to the lobby, choosing a role, and selecting both lists. Add Use this pairing and Tune this deck actions with an explicit side choice.
2. **Give Corp players a direct view.** The guide's only selector is Your Runner deck. A Corp learner must select the opponent and invert every result. Let me select my Corp deck and see difficulty from my side.
3. **Teach one small tuning loop.** Preserve agenda totals and ice/breaker coverage, change 1–3 slots for one purpose, then check whether the problem was money, coverage or timing. Include a valid before/after example and influence accounting.
4. **Make bad publicity a worked example.** One recurring credit can pay an entire cheap ice break every run. Show this with Palisade/Cleaver and a checkpoint to reconsider defenses after a breaker is installed.
5. **Carry the lesson into the table.** An optional compact checklist or pinned reference could remind a learner to bank rez money, build a scoring lane and reassess defenses. The guide currently disappears from the actual play loop.

## What worked

Exact list names match the lobby, and raw win counts/sample size make choosing a starting opponent grounded. The custom-deck benchmark caveat is honest. The builder showed legal size, influence and agenda totals, imports, membership counts and a useful change summary. Saving and selecting the final tuned list worked. Three explicit ice rez choices were exercised; no approach was skipped and no turn was blocked.

Subjective AI ratings: **guide usefulness 7/10; deckbuilding clarity 7.5/10; guide support for crafting 5/10; gameplay enjoyment 6.5/10**. These are one tester's impressions, not human user-study measurements. The guide is already useful for picking a starting matchup; its next improvement should connect choosing a deck to changing and learning that deck.
