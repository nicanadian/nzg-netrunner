# Deck-selection browser playtests

2026-11-14. Actual shared-browser UI at `http://localhost:5173`, in a dedicated incognito profile. Viewports: 1280×800 and 390×844. No headless Chrome process was launched. The user's normal browser saves were not changed.

## What was played

Three games reached a natural terminal result through rendered controls:

- Runner: Tāo Burst economy versus Jinteki Planogram economy. Manual opening, hardware/program installs, an unsuccessful R&D run, Botulus breaking, successful R&D access, and accessed-card inspection; then a DOM-only continuation. Corp won by flatline.
- Corp: Jinteki Planogram economy versus Tāo Mayfly backup. Manual economy and ice installs, then a DOM-only continuation through multiple Corp/Runner turns. Runner won by seven agenda points.
- Runner: a locally cloned and renamed Mayfly deck versus Weyland Built to Last, on the phone-sized viewport. Included editing/saving/choosing a custom deck, installs, runs, multi-card selection, reload/resume and further play. Corp won by seven agenda points.

The Core preview received a **partial** opening playthrough: Dewi versus Nebula. Verified 9 Runner and 12 Corp character choices, startup, economy/install/run actions, separate Gateway/Core saves, native diagnostics, identity inspection and Nebula's back-face artwork. Dewi's enlarged art loaded at 743×1029; the flipped Nebula view requested `35057-0-743.webp`. This was not a completed Core match or an Elevation rules/AI qualification.

## Confirmed issues fixed

1. **Start controls below the viewport.** At 1280×800, the setup initially put Jack in around y=986. Compact short-desktop spacing and a sticky action row now keep the control visible. `overflow: clip` prevents the lobby from accidentally becoming a non-scrolling sticky container. Reloaded checks show Jack in at y=731–778 on desktop and y=718–765 at 390×844, with no horizontal document overflow. Smaller screens still scroll to see all character/deck descriptions.
2. **Custom decks called “Gateway baseline.”** A renamed Mayfly clone incorrectly received that label in the library. It now says “Gateway · legal deck.” The clone's actual chosen name appears in the deck selector and game snapshot.
3. **Skipping animation could bypass a mandatory rez-shortage review.** When the worker had already queued an unrezzed-ice review behind an ordinary action, Skip to decision discarded the queue. It now preserves mandatory reviews in order, skips only ordinary animation, and refuses to skip the current required review. A real imported UI-game prefix reproduced the case: advancing Urtica twice and skipping the next Runner animation now stops at “Could not rez Palisade: 3 credits required; 2 eligible credits available.” There was no skip control, the review remained paused, and the board version stayed 132 until acknowledgement. Archive replays can still be closed normally.

## UX observations

- Character and deck selection remain distinct. Library selection correctly chooses the associated character, and the custom deck name survives startup and resume.
- Opening-hand Keep and Mulligan were both visible. Exact variant documents were present in each game config.
- Straightforward installs from the card preview needed an inspect click and an explicit install click; no extra sidebar confirmation remained afterward. Botulus listed the host and applied the DZMZ discount before commitment.
- Botulus required selecting its ability and then its target subroutine. The target's cost was visible, and the remaining virus counter updated. Passing a movement window still offers the meaningful alternative of jacking out.
- Reading the accessed Urtica card worked, including full rules text. The first instantaneous image check preceded image loading; subsequent Core image checks confirmed native display dimensions.
- Mobile servers scroll horizontally within their board region; decisions remain below the board/hand and require vertical scrolling. No overall horizontal page overflow was observed. Further mobile decision-panel compaction would be a useful separate design task.
- A flipped identity has the correct reverse-face image and a “Current face: back” marker, but the inspector heading retains the front identity name and displays both sides' rules. Clearer active-face naming would be a useful follow-up.

## Method and limits

Manual browser actions were used for setup, representative card interactions, inspection, clone/edit/use, resume, profile switching, and warning reproduction. Longer sequences used `scripts/ui-deck-playtest.js`, injected into the owned tab. It clicks rendered DOM controls, reads visible/player-authorized DTO information and never calls engine actions, posts worker choices, changes board state, or installs a native game AI. Its simple policy is for UI traffic and completion, not competitive play or deck-balance conclusions.

The driver initially mishandled multi-card selection by toggling the first target repeatedly. It was corrected to choose distinct unselected cards before confirming. Those synthetic extra clicks are **not** an application defect and are excluded from UX conclusions. Early click logs also contain manual-event/driver duplication, so no exact “unnecessary clicks per game” metric is claimed. An animation control disappearing during a click and an overly long evaluation batch caused tool timeouts; subsequent page checks showed continued game progress. Later batches were bounded and checked separately.

## Evidence and checks

`eval/deck-loadouts/` retains all three completed browser sessions and public histories, the partial Core session, resume observations, viewport/library checks and the real rez-shortage reproduction. The immediate after-resume observation was captured before state loading finished; config and retained choice count matched, and subsequent play continued normally. All three complete browser sessions were reconstructed separately and reached exactly their recorded terminal results without engine errors or diagnostics.

Passed checks:

- `npm run test:decks`
- `node tests/playback-required-review.cjs`
- `node tests/opponent-playback.cjs` (158 real public action beats and worker/direct replay equivalence)
- `node tests/interaction.cjs`
- `node tests/run-drawer.cjs`
- `node tests/polish.cjs`
- Syntax checks for modified browser modules and the DOM driver

The focused mandatory-review regression is included in the normal `npm test` sequence. No broad statement of full Core card coverage or human-quality AI follows from this playtest.
