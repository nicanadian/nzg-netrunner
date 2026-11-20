# Navigation reviewer

Independent first impression saved before consulting any prior review. Actual shared incognito browser at http://127.0.0.1:5173; confirmed 390×844 CSS viewport. N1, N2 and N3 completed. Keyboard coverage was sampled and partial. Screenshots timed out, so evidence is live DOM text/geometry and native key actions; this is not visual or accessibility certification.

The first learning choice was clear: **Familiar identities — Loup · Tailored economy vs Restoring Humanity · Ambushes**. The familiar-character framing and exact list names let me choose without advanced card knowledge. The cards describe a pairing but provide no action to configure it.

## N1 — Narrow navigation

Native Tab reached Back to lobby, First Vantage games, Explore matchups and How to read the results in order. Enter activated the reading anchor and scrolled there; activeElement became BODY. Links had computed 2px solid focus outlines. Tab reached the pool, Runner selector and pilot checkbox; Space toggled the checkbox. End/Enter on an open pool select did not change its value in this host, so I used the rendered select operation. No DOM-dispatched keyboard events were used.

At the confirmed narrow viewport, document width was 390px and the overflow scan found no elements outside its horizontal bounds. Selects were 354×44px; checkbox label 354×44px; section links 23.09px high with 14px text. These are geometry observations, not a touch/readability certification.

## N2 — Evidence comprehension

- Runner 28/54 means 28 Runner wins in 54 AI games: Corp won 26, about 48%. The 52% figure belongs to Runner.
- Six games cannot establish a reliable counter: the guide calls them preliminary, explains the roughly 17-point swing per game, and limits the record to AI play.
- Editing a deck leaves its benchmark: the guide states custom decks are unbenchmarked and exact bundled lists matter.

With Vantage test pilots off there were four Runner options and five opponents, all 54-game pairings. Space enabled pilots: nine Runner choices, thirteen opponents, mixed 6/54-game summary. Added Runner options said TEST PILOT; added Corp rows said interaction test pilot and Preliminary sample with their six-game counts. The populations were understandable despite the recommended Stealth foundation pilot also using the word pilot.

## N3 — Return, configure, inspect and tune

Changing the guide from Gateway to Vantage and choosing Loup Tailored did not carry to the lobby: Back returned to Gateway with the original default lists. I manually selected Vantage, Corp, Jinteki Ambushes and AI Loup Tailored. Tune deck opened the correct Corp identity and pool. Esca's preview showed its full rules; Escape closed it and restored focus to the originating card control. Remove Esca changed 44 to 43 cards and showed Changes: -1 Esca while retaining influence and agenda totals. Deckbuilding basics explained swaps, size, influence, agenda and Save & use behavior. I closed without saving.

Closing the editor retained Vantage, Corp, Jinteki and AI Loup. A second guide round trip was more concerning: opening from that setup, changing guide pool to Gateway+Elevation and returning kept Vantage but changed the human side to Runner Loup versus AI Jinteki. The same two lists remained, with human-side intent reversed. This records the browser observation, without claiming a source-level cause.

## Improvements

1. **Medium — preserve setup intent.** Add a keyboard-operable Use this pairing action carrying pool, exact lists and selected human side. Back should preserve invoking side and lists. Acceptance: Corp Jinteki versus AI Loup remains that configuration after browsing another guide pool and returning; using the familiar pairing from Gateway configures Vantage and the requested side directly.
2. **Low — larger section links.** Measured section/back targets are about 23px high. Add padding to 44px while preserving wrap. Acceptance: all link boxes reach 44px at 390px width, no horizontal overflow, Tab/Enter still works.
3. **Low — edited-list benchmark reminder.** The guide explains this limitation, but the editor only showed changes and an expansion audit note. Add Custom edits have not been benchmarked beside changes, linked to the evidence explanation. Acceptance: the reminder appears after a count change and clears when exact original counts are restored.

No game started, no deck saved, no engine injection or direct storage writes, no product edits. Both script-opened popups and the owned original tab were closed. Parent will restore origin preferences. Detailed steps and evidence are in navigation-review.json and navigation-trace.json.
