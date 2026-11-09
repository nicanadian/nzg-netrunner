# Jinteki and Local Table UX playtests — 2026-11-07

Two GPT-6.1 Sol agents completed both Jinteki teaching games and a separate Local Table Corp game, then directly sampled our Runner encounter flow. The most useful Jinteki feature to borrow is its **quoted-cost strength-match/full-break shortcut**. Keep our explicit cost, compatibility and target guidance around it.

## Method and limits

Two GPT-6.1 Sol agents used actual browser controls, with separate Runner- and Corp-focused notes. These are AI-operated UX sessions, not recruited human participants or a competitive-strength evaluation. The Chrome extension host was unavailable; the user explicitly selected the shared T3 browser. Tool disconnections and locator failures are recorded separately from game defects.

The Intermediate Gateway game on port 1042 began with one agent per side. To reduce handoff delays, the Runner-focused agent then took over both sides of that match. The Corp-focused agent used a separate Jinteki instance on port 1043 to play both sides of the Beginner teaching match. That instance used the same isolated test-account names but separate in-memory games. Its `/local/intermediate/...` login routes intentionally selected a native Beginner match through a startup-only environment override. Neither agent played the user's existing Beginner match on port 1042. Self-play meant the operator saw both hands; strategic strength and hidden-information inference are not evaluated.

Our app ran at isolated origins: port 5178 for the Runner comparison and 5179 for the Corp comparison. The observed presets were Loup v1 (40 cards) and Precision Design v2 (44 cards). Jinteki's neutral teaching identities and lists differ, and Jinteki's two seats were controlled through player UIs while Local Table supplied a heuristic AI opponent. Those differences limit conclusions about card balance, difficulty and strategy.

No imported positions, engine globals, injected state, scripted policies, concessions or API game actions were used for gameplay. Actions included inspected visible, enabled DOM controls through their normal click handlers when the preview action tool was unreliable. Costs and phase changes were checked between dependent actions. Setting up native teaching matches and local server instances was separate from the subsequent browser-only play.

Repeated screenshot attempts failed on both apps. **No image-based evaluation of aesthetics, visual hierarchy, small-print readability or mobile layout is claimed.** Evidence consists of rendered text, controls, logs and ordinary Local Table exports. Native Jinteki replay commands did not produce downloaded artifacts, so no Jinteki replay export is claimed. Match clocks include pre-created-session idle time and automation delays; they are not play-speed measurements. Local login conveniences bypassed account setup, so this is not a review of service registration.

## Jinteki: what worked and what was harder

- **Jinteki's individual choice prompts can be excellent.** Wildcat Strike explicitly offered the Corp a choice between the Runner gaining six credits and drawing four cards. The consequence is stated before commitment.
- **Its log is useful evidence.** The Corp's first turn confirmed Hedge Fund payment/income, the destination of ice installations and private/public card descriptions. The agents use these receipts to avoid repeating an action after an asynchronous browser response.
- **Direct-card controls need clearer targeting guidance.** Installing a hand card opens a server menu beside that card while the main action rail does not explain that a target choice is pending. Local Table's consolidated legal-action rail makes that state more explicit.
- **The opening sequence has redundant controls.** Keep/Mulligan appear in both a large overlay and the normal action rail, followed by a separate Start Game overlay dismissal. Waiting dependencies are explained more clearly in the sidebar than on the overlay buttons.
- **Jinteki's run-phase labels help.** Current phase and next-phase Continue labels expose the manual priority flow. The number of human handoffs is not itself a defect; it differs from our AI/playback architecture.
- **Payment guidance differs.** The Corp observed a direct rez button without an inline quoted cost, whereas our normal rez actions quote the cost. In our Send a Message response, the source, free rez and eligible ice position were explicit.
- **Position numbering needs attention when translating conventions.** The Jinteki log used ice position zero; our encounter presentation numbers from one at the outside.
- **Explicit run progression supports expert control.** The Intermediate agent used separate controls to let subroutines fire and to continue to Movement. Our automated opponent and guided playback combine some of this pacing; comparisons must account for whose input each step requires.
- **Conditional effects need a visible explanation.** Two Intermediate HQ attempts met Diviner. One continued after its damage; the other ended because the damage trashed an event. The agent could trace the different result in the log. This is the same printed conditional mechanic, not evidence of different rules between engines.
- **An optional combined breaker action is worth studying.** During the Beginner Palisade encounter, Mayfly offered `2 credits: Match strength and fully break Palisade`, alongside manual boost/break and match-only actions. It paid, raised strength, broke the subroutine and retained Mayfly's run-end trash consequence. Unity's quote reflected its installed-breaker-dependent pump; Cleaver offered full-break when already strong enough. The direct Local Table sample required separate breaker/target choices but made compatibility and pre-payment status clearer.
- **Legal does not mean useful.** The Intermediate agent paid four Overclock credits to match Carmen's strength to barrier ice, then found its sentry-breaking ability still disabled. The pump was legal but did not solve the encounter. Compatibility explanations should remain visible before committing to an expert shortcut.
- **Opponent-card abilities need an obvious entry point.** Discovering Brân's Runner click-break menu required source-assisted help and clicking the actual installed ice image. Subsequent legal click breaks worked. Failure to open the menu by clicking enclosing DOM elements is recorded as tool/hit-target friction, not a proven human pointer defect. The more general UX issue is finding an ability controlled by the other side's card.
- **Selection modes can be easy to lose track of.** Brân's click-break selection remained open until Done; the agent accidentally opened a nested selection while learning it. Both selections were closed and the log confirmed only the two intended click payments. This contrasts with a guided workflow that keeps the current selection stage explicit.
- **Identical subroutines benefit from ordinals.** In the Beginner multi-ice attack, Brân's two `End the run` choices had identical text. Broken marks and the log eventually distinguished progress, but the selection itself did not label their order.
- **Fine-grained payment controls can become repetitive.** The Beginner Overclock payment showed progress such as `0 of 2 credits` and required clicking the source once per credit. This makes the source explicit; amount shortcuts could retain that control with fewer repeated clicks. The Intermediate agent similarly paid a four-credit cost through four source selections.
- **Victory needs to override pending decision guidance.** After the Beginner winning Send a Message steal, the log declared the Runner the winner at six points, but the Runner action rail still said it was waiting for Corp triggers and the Corp retained a target prompt. After the Intermediate winning steal, another access prompt remained. The agents stopped at victory rather than forcing post-win resolution. This is a terminal presentation finding, not a demonstrated rules-engine failure.
- **Reference and repair tools support experienced players.** The Run Timing and Turn Timing tabs provide detailed numbered rules reference. The `/` menu reveals granular undo and correction commands. Local Table instead makes one last-decision undo and replay import/export readily available in Menu; the appropriate complexity depends on the audience.

## Issues observed in our version

- **Opponent-response wording can blur turn ownership.** Between the Corp's own actions, Local Table sometimes said the opponent was considering/calculating. The AI was answering a paid window, not taking its main turn. A source/priority explanation would preserve that distinction.
- **A cancelled target can look like a completed action.** Cancelling Seamless Launch returned it to hand and recorded `cancel: true`, but the last-action receipt named Ansel as the target. The game did not apply the choice; the receipt could imply that it did. This is a UI feedback finding, not evidence of an illegal counter placement.
- **Full legal choices can add teaching friction.** The Runner sample exposed out-of-encounter boosts, optional program trashing with spare memory, a paid break-zero choice, and further boost/break options after all subroutines were broken. These are intentionally legal choices in the current profile, not legality defects. They should remain possible, with clearer reasons or secondary presentation for uncommon/non-progressing uses.
- **Optional paid windows can make solo pacing repetitive.** The Runner agent repeatedly had to Continue past optional boosts in post-action, discard, Corp draw/action/discard and Runner turn-begins windows. This was directly experienced against our AI, separately from Jinteki's expected two-player priority passing. Explain why a window is open and consider an explicit user preference for handling uncommon optional paid windows while preserving full legal control.

## Direct strengths observed in our version

- The Corp action rail quoted card, destination, click cost and the reminder that rez is paid later. Regolith's pool payment and hosted credits were separated, and Send a Message's response identified its source, free rez and eligible target.
- In the Runner's real R&D encounter, Cleaver explicitly had sufficient strength to break; Carmen explicitly said its type did not match. The chooser numbered `Break subroutine 1: End the run` and said nothing was spent yet. Selecting the target paid one credit, marked it broken and left zero unresolved subroutines before the run continued.
- Menu exposed last-decision undo, autosave, replay export/import and concession. The agents inspected recovery without undoing live decisions and saved ordinary UI replay exports.

The direct contrast is **more guidance and explicit stages in our flow, fewer selections for a compatible Jinteki full-break action**. It is not evidence that either interface has universally better rules coverage.

## Completed coverage and results

- Intermediate: **completed**, Runner victory 8–5 on Runner turn seventeen. The winning seven-card Conduit breach stole Offworld Office from a six-point position. Coverage included central/remote runs, tutoring, typed breakers, bioroid click breaks, temporary credits/breakers, conditional damage/end-run and hosted counters. [Terminal view and full visible log](../../eval/jinteki-ux/runner-intermediate-terminal.txt).
- Beginner: **completed**, Runner victory 6–2 on Runner turn eleven. Coverage includes Hub scoring, Seamless, advancement, optional draw-two, campaign trashing, multi-ice Overclock attacks, bioroid click breaks, Manegarm payment and Send a Message's stolen-agenda free rez. Both terminal player views and full visible logs are saved under `eval/jinteki-ux/corp-beginner-terminal-*.txt`. A native Jinteki replay download was not obtained; no replay export is claimed for this game.
- Local Table Corp session: completed through ordinary UI decisions, Runner victory 7–0 on Runner turn 3. The Corp left a scoring remote undefended after early central steals; this short/weak-defense sample does not establish balance or AI strength. Export: `eval/jinteki-ux/corp-local-table-replay.json`.
- Local Table Runner: an actual sampled session through a successful R&D run and Palisade break on Runner turn two, after an earlier Archives run and rig setup. This is not an additional full game. [Native 32-choice replay](../../eval/jinteki-ux/runner-local-table-sample-replay.json), [encounter controls](../../eval/jinteki-ux/runner-local-table-palisade-encounter.txt), [broken-state feedback](../../eval/jinteki-ux/runner-local-table-palisade-broken.txt). Mixed-source payments and a bioroid encounter were not exercised in this Local Table sample.

## Evidence

- [Runner notes](jinteki-runner-ux.md)
- [Corp notes](jinteki-corp-ux.md)
- Session plan and artifacts: `eval/jinteki-ux/`

The Local Table Corp game was short and poorly defended: early central steals yielded five points, and the final scoring remote was unprotected. Neither that result nor the neutral teaching-game outcomes establish AI strength or balance.

## Recommended next changes

1. Keep type/strength compatibility and consequence guidance visible before committing credits. The legal Carmen boost against a barrier is a concrete example of why legality alone is insufficient teaching feedback.
2. Explore an optional combined strength-match/break action with an engine-computed quote, while retaining manual steps and clearly explaining compatibility, temporary credits and run-end trash.
3. Repair misleading cancellation receipts, distinguish opponent response windows from turn changes, and make repeated optional paid windows less opaque.
4. Preserve explicit source/target stages, ordinal subroutine labels and discoverable opponent-card alternatives.
5. Keep detailed history and timing references available without making static reference text the primary instruction for the current choice.

These are recommendations only. No Local Table UI or rules fixes were implemented in this playtest task. Local startup configuration was extended only to isolate an additional teaching-game instance.
