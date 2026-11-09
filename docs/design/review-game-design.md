# Game-design review: interaction proposal

Reviewed 2026-11-07 as an independent AI game-design perspective. This is a review of an illustrative interaction fixture, not a recruited-player study or a rules certification.

Evidence: `docs/design/interaction-proposal.md`, `docs/playtesting/jinteki-ux-comparison.md`, `eval/interaction-proposal/proposal.template.html`, the rendered `panel-desktop.png`, and normal button interactions in the standalone `eval/interaction-proposal.html`. Browser exercise used a fresh headless Chromium page with `page.setContent`; requests were blocked, and no server or user tab was used. State snapshots were read after those interactions to check debits and stages. No production code was changed. Code references below are to the reviewed template before revision.

The direction is strong: teach compatibility and consequences before payment, reduce repetitive choices, and retain expert agency. The sequence and manual paths do not yet uphold the same timing and payment contract. The changed-quote fixture exposes an especially important failure: an explicitly confirmed price can differ from the actual debit.

## Severity-ranked corrections

### High — the changed quote survives internally but disappears from reopened review

**Observed interaction.** Replay encounter → Review full break → Start sequence → Test changed quote → Stop sequence → Review full break. The new review says `Current total: 1 credit` and `Break subroutine 1 · pay 1`, with 1 Overclock and 0 pool allocated. Confirming debits **2 credits**: Overclock falls from 4 to 3 and pool from 3 to 2. The prior boost remains paid, making 3 total credits spent. The displayed confirmation underquotes the new payment by one credit.

**Cause inferred from code.** `changed` remains true after Stop; the review total uses strength alone, while `finish` reads `changed` (lines 40–41, 98–99). Separately, `manual-break` sets `changed=false` (line 102), so entering the manual route can erase the persistent synthetic modifier.

**Correction.** Use one current quote for the ready button, review breakdown, manual ability, affordability check and payment. Preserve the fixture modifier until an explicit position change removes it. Stop should discard the queued plan, not the game state that determines cost. Bind confirmation to the same quote and position revision that payment validates. If either changes, require a new review before debit. Add this exact stop/reopen reproduction and the switch-to-manual variant to acceptance checks.

The modifier is explicitly **synthetic**, not a Gateway card interaction. This finding concerns the fixture's own stated contract; it makes no claim about an actual Gateway card creating this cost change.

### High — individual abilities bypass the shortcut's response and funding decisions

**Observed interaction.** Individual boost/break → +1 strength spends 1 pool credit, leaves all 5 Overclock credits untouched and remains in the manual stage. Break becomes immediately available. The shortcut's corresponding boost instead enters a Corp response stage and honors the chosen funding allocation. The manual copy nevertheless says the same costs and response windows apply.

**Code inference.** The More abilities boosts have the same immediate pool-only handler. At zero pool, they silently do nothing even if run credits remain. Thus a supposedly available manual route can be unusable with sufficient eligible credits, while the shortcut still works (lines 95, 101–102).

**Correction.** Treat the full-break feature as a plan over the same individual ability/payment/priority transitions used manually. Both routes should offer every eligible funding source and the same interruption points. After one ability resolves, return through the engine's priority decision before allowing the next ability or run progression. The shortcut should reduce target selection and repetitive allocation, not remove rules decisions. Make an unavailable payment visibly disabled with its reason rather than a silent click.

### High before implementation — re-quote validity needs more than a changed price

**Observed scope.** The prototype demonstrates one response outcome that changes price and one pass. It does not demonstrate a response invalidating the plan.

**Design requirement, not a demonstrated engine defect.** Before every payment, check that the encounter and priority still permit the action; the breaker exists and can use the ability; type and strength still suffice; selected subroutines remain valid and unresolved; funding sources remain eligible and available; and mandatory choices or terminal state do not supersede the plan. A fresh cost alone is insufficient if there is no longer a legal target. If only part of a multi-subroutine plan remains legal, explain the remaining choices rather than silently substituting targets or charging the original total.

**Correction.** Add interruption fixtures for an invalid target or unavailable breaker, changed required strength, unavailable funding, and a response requiring another decision. Show `Plan paused: …`, retain committed costs/effects, then offer legal manual recovery and Stop. Use engine-derived legality and a position revision, not UI assumptions about this fixed Palisade encounter. Exact timing should be verified against the engine's intended rules profile during implementation.

### Medium — a re-quote replaces the player's funding preference

**Observed interaction.** Choose 0 Overclock in review, pay the boost from pool, then Test changed quote. The remaining confirmation now says `Use 2 Overclock + 0 pool`; there is no funding editor on that screen. The change is disclosed before payment, but the prior pool-only choice is discarded without an explanation or a direct way to restore it.

**Correction.** Reopen funding when re-quoting. Preserve the original source preference where feasible; otherwise identify why it changed. Show the next ability's exact source debit before confirmation and distinguish that from an allocation reserved for later abilities. Do not reserve or spend future costs merely because the total plan was reviewed.

### Medium — receipts need an immutable account of payment versus effect

**Observed interaction.** After a paid manual boost, return to encounter options and Continue without breaking. The receipt says `No breaker cost paid`, although the pool is lower and the boost payment remains committed. The same contradiction occurs after stopping the paid shortcut boost and choosing to continue without breaking.

**Code inference.** Receipts use a single mutable string and aggregate `paid`. Break-zero payments and some gallery payments do not update that aggregate. A final Mayfly receipt states total encounter spending but does not identify the current break debit or its sources. `Nothing spent yet` in a reopened review can also be mistaken for the entire encounter rather than this newly reviewed step.

**Correction.** Record each committed payment and effect as separate events. For example: `Mayfly boost: paid 1 Overclock; STR 1 → 2`; `Plan stopped: no further payment; boost remains`; `Palisade subroutine 1 resolved: run ended`. On completion, show both `This break: 1 Overclock` and the earlier-payment summary. For the run-ending case use `No additional payment; earlier boost cost remains spent`. A plan, target preview, pass, cancellation and resolved effect should have distinct receipt types.

### Medium — Seamless cancellation fixes the target lie but leaves commitment underspecified

**Observed interaction.** Selecting Ansel then cancelling produces a clear `Cancelled · Seamless Launch` receipt, returns to the action phase and says no counters were placed. Confirming instead produces the counter-placement receipt. This correctly distinguishes preview from effect.

**Missing evidence.** The fixture does not quote or demonstrate the operation's click and play-cost commitment, and confirmation does not debit them. The card inspector lists a play cost of 1, but target selection starts from a static budget. Consequently this scene proves target-receipt behavior, not payment/refund behavior. `Last confirmed action` initially labels an operation still awaiting a target.

**Correction.** Name the precise stage: `Choose target before committing play` if that is what the app actually supports. Otherwise show the already committed costs and what cancellation means under the engine's action semantics. On either exit, state the verified cost outcome; never infer a refund from the card returning to HQ. Replace the initial confirmed-action label with `Pending selection`. Include costs in the resolved receipt, or explicitly label this fixture as a target-effect-only demonstration.

### Medium — skipping must delegate a pass, not declare the whole window closed

**Observed interaction.** Off-by-default preference, continued control over the current window, and an explicit auto-pass receipt are sound choices. Closed windows correctly remove their ability controls. However, using a quiet boost immediately closes the illustrated window. In the response scene, `Next Corp action` says it becomes available after the Runner `passes or resolves an ability`, while the expanded explanation correctly requires both players to pass.

**Correction.** Base closure on the engine's actual pass/priority transition. Resolving an ability should not itself be presented as equivalent to completing the entire response window. Change the short reason to `Available when this paid-ability window closes` and name the player currently holding priority. For the preference, conservatively recognize an approved class of windows and abilities, reconsider after every public state change, and stop auto-passing when eligibility becomes uncertain. Offer a persistent, quickly reachable `Pause skipping` control and a concise skipped-window history.

The documents' requirement to preserve rez, scoring, targets, new information and mandatory effects is a good boundary. A label such as “boost-only” should be an explanation of an engine-supported decision, not the eligibility algorithm itself. Legal strength changes may interact with other effects in a broader card pool; no universal harmlessness claim is established here.

### Medium before implementation — view ownership and privacy need an explicit contract

**Observed scope.** The screenshot shows public installed Runner cards, face-up Palisade, hand counts and generic Runner card backs. The cancellation scene shows Seamless Launch in HQ while the decision rail is the Corp's. That is consistent with a Corp-owned view; this review did not establish an actual cross-player leak.

**Design requirement.** Public opponent receipts must omit private target previews, cancelled HQ card identities and private funding possibilities unless an actual public commitment revealed them. Auto-pass reasons and button counts must not announce hidden available responses. An opponent view should receive a generic pending-decision state rather than another player's private chooser. Always derive card titles, inspectors and legal options from that viewer's permitted information, including unrezzed installed cards. Record private versus public history deliberately.

## What to preserve across the five scenarios

1. **Cancellation:** the cancelled operation is named without presenting the previewed target as an applied effect. Keep the earlier unrelated action visibly separate from the cancelled selection.
2. **Turn and priority:** the persistent `Corp turn`/`Runner turn` label, separate response tag and retained click budget give a useful answer to “whose turn is it?” Keep this distinction through every response, including shortcut execution. Response controls are clearly labeled prototype controls rather than live-game actions.
3. **Quiet windows:** Continue is prominent, uncommon paid abilities remain reachable, skipping begins off, and setting the preference does not retroactively consume the current decision. Preserve all four properties.
4. **Full break:** the visible strength gap, exact subroutine ordinal, temporary-credit source, separate boost/response/break steps and Mayfly run-end consequence form a good teaching sequence. Stop explicitly preserves a committed boost. These are more valuable than minimizing every click.
5. **Availability reasons:** “used this turn,” “wrong ice type,” and “nothing left for this shortcut to break” are materially different explanations. Legal but ineffective boosting and paid break-zero remain available. Keep the distinction between a disabled convenience shortcut and the underlying legal ability. The gallery correctly discloses that its examples come from different timing contexts.

The desktop image supports these observations: compatibility and the two-credit review are visually adjacent; the ordinal subroutine and unresolved count are readable; the active priority is distinct from turn ownership. On small screens the template hides the board entirely. As a game-design requirement, the decision rail should retain an accessible board/installed-card view: players need public resource and position context to choose whether to spend or pass, even when the immediate choice has been simplified.

## Acceptance examples for the next revision

- Stop and reopen a changed quote; displayed total, funding and actual debit agree. Switching to manual does not remove the modifier.
- Run equivalent manual and planned sequences with the same funding: resources, opportunities to respond, effects and receipts agree.
- Spend a boost, stop, then let the unbroken subroutine resolve: the receipt preserves the earlier payment and states that no additional cost was paid.
- Invalidate the remaining action during the response: no second payment occurs, and legal recovery choices remain available.
- Cancel an operation at the actual supported commitment stage: the receipt reports the target and cost outcome accurately to each viewer.
- Use a quiet ability or receive new public information while skipping is on: priority and eligibility are reconsidered before any later automatic pass.

These are proposed product and implementation checks. The retained legality of out-of-encounter boosts and break-zero follows the supplied app/profile evidence, rather than a newly verified assertion about every card or rules environment.
