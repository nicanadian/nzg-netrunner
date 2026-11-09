# Interaction proposal review — AI UI/UX perspective

Review scope: the five scenes in `eval/interaction-proposal/proposal.template.html`, the desktop panel image, the cancellation, priority, quiet, reasons and requote captures, and the 390px mobile capture. I also exercised the standalone HTML with local headless Chromium via Playwright `setContent`; no server or user browser tabs were used. This is an AI specialist review, not a human usability study. Findings below separate rendered behavior from implementation inference. Production code and the mockup were not changed.

The direction is sound: decisions lead with a task, cancellation names the cancelled operation, priority is separate from turn ownership, and the full-break path exposes its constituent payments. The fixture is not ready to serve as an implementation contract until keyboard continuity, payment-source control and preservation of optional choices are corrected.

## High priority

### 1. Keyboard focus disappears during ordinary decisions

**Observed by interaction; affects all scenes.** Focusing “Review full break” and pressing Enter changed the scene content and left `document.activeElement` at `BODY`. Changing the Overclock funding select likewise removed focus. Executing a quiet-window boost also left focus at `BODY`. A keyboard player loses their position during the central payment flow, and a screen reader receives only the footer receipt rather than a reliable introduction to the new decision. The footer often remains below the visible mobile viewport.

**Cause inferred from code:** `render()` replaces the board, priority, content and receipt with `innerHTML` after virtually every event, including select changes. There is no focus restoration. The native dialog itself is a useful foundation, but it does not address these transitions.

**Correction:** preserve the existing input when only the allocation changes; update the calculated values around it. On a genuine step transition, focus a named step heading or the first appropriate decision control. On cancellation, restore focus to the originating action. Keep disclosures open across local actions. Associate newly available decisions and their summaries with accessible headings; use the polite receipt for the transaction result, not as the only navigation mechanism.

**Acceptance check:** complete review, funding choice, boost, response, break and cancellation using only Tab/Shift+Tab/Enter; focus remains visible and reaches each next decision without restarting at the page controls. Verify with a screen reader before claiming accessible flow.

### 2. A changed quote silently replaces the selected funding source

**Observed by interaction; full-break scene.** I selected **0 Overclock**, paid the boost from the pool, and used “Test changed quote.” The remaining quote became **2 Overclock + 0 pool**. The confirmation screen provides no funding editor. The increased cost is disclosed, but the player's explicit source choice is not retained. No incorrect payment was necessary to reproduce this; the new allocation is visible before confirmation.

**Cause inferred from code:** `cost-change` assigns `state.allocation = Math.min(state.fund, 2)` rather than preserving the intended funding choice. The remaining step contains only a confirmation button.

**Correction:** treat a changed amount or payment source as a new review. Preserve the player's source preference where possible, show previous and new remaining costs together, and allow allocation to be edited before payment. Keep “1 already spent” separate from the new amount. The existing explicit reconfirmation and retained-boost language should remain.

**Acceptance check:** test all-pool, all-temporary and mixed selections through both unchanged and changed responses. Confirm that the displayed and debited sources match the final explicit choice.

### 3. Using one optional boost closes the entire paid window

**Observed by interaction; quiet-window scene.** With skip disabled, I opened More abilities and activated one boost. The next screen said the window was closed and removed the other actions. The player never chose Continue. That contradicts the promise of full control and the claim that uncommon legal choices remain available.

**Cause inferred from code:** `quiet-boost` sets `quietPassed = true` immediately. The rule entitlement to further actions must come from the engine; this review does not establish legality for every position.

**Correction:** resolve the individual ability, show its payment/expiry at the correct checkpoint, and return the player's remaining choices whenever the timing model permits. Advance only through an explicit pass or an eligible, opted-in automatic pass. Do not use “ability resolved” as a substitute for “window passed.”

**Acceptance check:** with automation off, taking one legal optional action does not silently pass a still-open window; with automation on, eligibility is rechecked against the new state before any automatic advance.

## Medium priority

### 4. Mobile removes the only route to several relevant card rules

**Observed visually and through the rendered DOM.** At 390px the board disappears entirely. The encounter still exposes Palisade's Read card button, but only one inspector control remains visible: there is no way to open Mayfly, Carmen or Telework Contract from the rail. Mayfly's trash consequence appears in review, which is helpful, but the full rule reference and other installed context are unavailable. This also affects the reasons gallery.

**Cause inferred from CSS:** the breakpoint uses `.nt-board { display:none }`, while breaker/resource thumbnails in the decision rail are plain images.

**Correction:** keep rail-first mobile presentation, add a compact “Table / installed cards” drawer, and make each rail card name or thumbnail open its inspector with an adequate touch target. Include a clear return to the pending decision and preserve its state. Do not require opening the full board merely to read the card causing the decision.

**Acceptance check:** at 320px and 390px, inspect every card referenced by a decision and return to the same target, funding choice and stage. Confirm the drawer does not obscure the active priority state.

### 5. Continuing into the end-the-run subroutine has the same primary styling as reviewing a break

**Visual observation; encounter scene, desktop and mobile.** “Review full break” and “Continue without breaking” are both large gold primary controls. The consequence text correctly says the unbroken subroutine will end the run, but the latter action's leading verb is a generic Continue and its visual weight is equally strong. On mobile the controls are far apart, so the lower control can be interpreted as the normal forward action after scrolling.

**Correction:** give the break review the dominant treatment. Label the consequence-bearing alternative with its outcome, for example “Let End the run resolve,” and use a secondary treatment with the consequence still visible. An extra confirmation is not necessarily needed; clear intent at the initiating control is preferable.

### 6. Response availability copy gives two different completion conditions

**Rendered text observation; priority scene.** The disabled Next Corp action says it becomes available “after the Runner passes or resolves an ability.” The expanded explanation says the action phase resumes “after both players pass.” These produce different expectations about when waiting ends.

**Correction:** derive both explanations from one timing status and phrase the next condition precisely. For example, explain whose response/pass is required now, then update it when priority changes. Keep the visible Corp-turn label: it successfully prevents the mistaken impression that the Runner now owns the turn. The engine/rules review should establish the exact condition.

## Lower priority

- **Pending action is labelled as confirmed in the cancellation receipt.** From code and the initial cancellation scene, the footer title is “Last confirmed action” while its detail says Seamless Launch is awaiting a target. Use “Pending · Seamless Launch” or a separate selection status until the operation resolves or is cancelled. The post-cancel receipt is otherwise explicit and trustworthy.
- **Bind reasons to their controls.** The visible used-this-turn, wrong-type and nothing-left-to-break explanations are useful. Add unique IDs and `aria-describedby` to the relevant controls so the reason remains attached semantically rather than depending on reading the whole article in order. Native disabled controls are skipped in ordinary tab order, so maintain readable reasons outside the controls as the design already does.
- **Clarify skip scope and recovery.** The toggle is off by default, explains future-only behavior and remains available after a window closes. Preserve those properties. In the real interface, state whether the preference applies to the match or persists across sessions, and keep a readily available route to turn it off after automatic progression. Do not claim that engine eligibility has been validated by this fixture.

## Strengths to retain

- **Cancellation:** preview does not produce an effect receipt; the cancelled operation is named, its return to HQ is explicit, and the earlier committed advance is visually distinct. The copy avoids an unsupported refund promise.
- **Turn/priority:** the persistent owner label, response tag and waiting explanation communicate distinct concepts without changing player identity colors.
- **Quiet windows:** Continue is the lead action, uncommon actions have a clear disclosure, and skipping requires an explicit opt-in with stated exclusions. The automatic closure after a chosen boost needs the correction above.
- **Full break:** the review reveals boost and break costs, temporary versus pool funding, the Mayfly consequence, separate response timing and retained earlier payment after stopping. These are meaningful protections against an opaque shortcut.
- **Availability reasons:** already-used, incompatible ice and no remaining target receive different visible explanations. Legal-but-ineffective actions remain discoverable rather than being falsely labelled illegal.

Recommended next revision: address the three high-priority behavior defects first, restore mobile inspection, then refine action hierarchy and response copy. Validate the resulting keyboard flow and payment allocations in the rendered fixture before using it to guide production changes.
