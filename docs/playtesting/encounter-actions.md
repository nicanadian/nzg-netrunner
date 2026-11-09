# Encounter actions and card/sidebar connections

2026-11-06. Agent-operated browser tests, not recruited human playtesters.

## What the tests exposed

The retained Brân encounter (`eval/counters/runner-virus-replay.json`) originally offered “Resolve unbroken subroutines” and “Use ability · 3 choices.” Opening the latter revealed Botulus, Leech and Brân's bioroid click ability. Virus costs were missing from those labels. Card inspection offered the same choices through a different presentation, without showing the connection to the sidebar.

The retained Ansel encounter (`eval/polish/ansel-encounter-replay.json`) has Cleaver installed. A novice could see a strength gap but had to inspect the cards to learn that Cleaver's Barrier interface cannot break this Sentry at any strength. Ansel's click-break ability still works.

## Implemented behavior

- Card abilities appear directly in the root action panel. Target choices and multi-card selections retain their required selection steps.
- Encounter options group currently legal ability buttons with their source program. Installed breakers also show mismatched types, strength shortfalls, eligible credit limits and costs to boost and break the remaining subroutines with that program alone. These are quotes, not an automatically executed plan.
- Botulus shows its host/counter constraint and strength-independent break. Leech explicitly lowers strength without breaking a subroutine. Bioroid text explains the click alternative and remaining clicks.
- The ice's subtype and current strength appear above its subroutines. Hover/focus links cards to action rows in both directions. A target button also highlights its numbered subroutine and public ice target.
- The first break-target screen names the source, quotes the pending cost and explains that Cancel returns without payment. Buzzsaw/Cleaver follow-up breaks show zero additional credits and that the previous payment includes the second break.
- Inspection uses the same action labels/costs and identifies the shared action panel. Costs remain enforced by native rules; no vendor card or AI file changed.
- Echelon's upstream ability labels described a code gate break and an incorrect boost formula. The presentation now describes the native sentry break and +2 strength, matching its actual Resolve handlers and printed card data, including the pending target screen.

## Browser observations

Chrome could not connect: “The browser access host is unavailable.” Tests used a separate shared-preview tab on `127.0.0.1:5173`, leaving the user's existing game tab and `localhost` save untouched. Replay fixtures were imported through Menu → Paste game replay. The shared preview's snapshot capture timed out, so these are control/DOM/style/geometry checks, not fresh visual screenshot approval or native Chrome captures.

| Scenario | Actions and observed result |
|---|---|
| Brân / Botulus / Leech | All three abilities and their costs appeared without opening Use ability. Hovering Botulus's ability linked its installed card and program section. Opening target selection preserved resources; Cancel restored the options. Clicking Botulus on the board exposed the same action in inspection. Confirming subroutine 2 spent its one virus counter and marked only that subroutine broken. |
| Brân click break | Opening Brân's ability showed only remaining unbroken targets, each costing one click. Breaking subroutine 3 left one click and two broken end-the-run subroutines. |
| Ansel / wrong breaker | Cleaver displayed “Cannot break this ice,” with Barrier versus Sentry explained, and no unavailable break button. Ansel's click alternative remained available. Hovering target 3 highlighted exactly the no-steal/no-trash subroutine. |
| Keyboard and small screen | At 390×844 there was no page-wide horizontal overflow. Tapping Cleaver opened a 366px inspection dialog with readable text and no unavailable actions. Escape restored focus; Tab focused the bioroid action and linked the ice. Enter opened the numbered target choices. At 1440×900 there was likewise no page-wide horizontal overflow. |
| Corp advancement | Hovering Advance linked Superconducting Hub on the board. Advancing once from the sidebar changed its counter 0→1 and spent one click/credit. Inspecting the agenda showed the same one-click/one-credit action; using it changed the counter 1→2 and again spent exactly that cost. |

## Automated verification and limits

`tests/encounter-ui.cjs` exercises all seven pinned Gateway breakers against actual native boost/break payments. It checks dynamic Marjanah discounts and Unity boost amounts, Echelon labels, cancellation before payment, free second breaks, source/target references, insufficient funds, incompatible types, virus costs and concealed-ice privacy. These are isolated engine fixtures, not seven additional browser playthroughs.

The full regression command is `npm test`. Updating the teaching baseline added only presentation metadata/quotes: the 66 native decisions and all 13 checkpoints' board, resources, phase, version, steps and history were independently compared with the previous artifact and remained identical. The regenerated reference suite passes its payment, strength, break, scoring, tag and privacy assertions.

The overview covers the pinned Gateway card pool. It does not solve a run, promise that a complete route is affordable, predict unrezzed ice, or plan combined breaker/virus/click sequences. Later sets and bespoke costs require explicit quote support and payment tests. Card inspection remains the place to read full rules text. The later run drawer update below changes the phone layout.


## Run drawer follow-up

2026-11-06. The existing sidebar now expands during a run. Desktop separates compact ice details and numbered subroutines from an independently scrolling action list. The pinned header shows server, timing stage and resources; the pinned footer contains only continuation or cancellation commands actually offered by the engine. Passing priority explains that both players must pass before the timing window advances. Full card text opens through inspection, and general encounter guidance and recent activity are expandable below the actions.

At narrow widths, the drawer becomes a foldable bottom sheet. Actions open first; an Ice details tab shows subroutines, while current run restrictions remain in the header. A new human decision reopens the sheet. Switching views and folding the sheet do not submit game actions.

Agent-operated checks used a separate incognito preview at `127.0.0.1:5175`, with the retained Brân/Botulus/Leech replay. At 1280×800, all three ability buttons fit alongside the ice, above the pinned footer. At 390×844, all three appeared in the action pane above the footer, without horizontal page overflow. Opening Botulus target selection and cancelling used the existing decision handlers. Switching the Ice/Actions views, folding/reopening the sheet and opening full card inspection preserved the recorded choice count. This is a focused interface check, not a new full-game human playtest.

`tests/run-drawer.cjs` restores engine snapshots to check native command/option indices, encounter pass priority, cancellation, a paid virus break, current-profile Overclock payment, restricted access, replay playback and concealed cards. It also checks movement continuation labels and terminal cleanup. The frontend error recovery test verifies that stale footer actions are removed on an engine error. The new test runs in `npm test`.
