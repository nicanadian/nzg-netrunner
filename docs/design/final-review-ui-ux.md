# Final UI/UX review — panel-revised

**Verdict: conditional for design implementation.** The revised direction is coherent enough to implement, provided the three remaining issues below become acceptance criteria. The frozen fixture should not be copied as a complete interaction contract yet.

This independent AI review read the current template, standalone HTML and earlier UI/UX review; inspected `revised-mobile.png` and `revised-payment.png`; and exercised the standalone `panel-revised` fixture in fresh headless Chromium using Playwright `setContent`. Checks included keyboard transitions, all-pool funding through a changed quote, subsequent payment, quiet-window actions, cancellation and mobile inspection at 390px, plus an overflow check at 320px. No server or user browser tabs were used. These are rendered-fixture observations, not human usability or screen-reader validation.

## Earlier findings now resolved or substantially improved

- **Funding after a response:** choosing 0 Overclock, paying the boost from the pool and testing a changed quote preserves 0 Overclock. The remaining payment has an editable source selector and explicitly states its debit sources. Already-spent credits remain separate from the new amount. The synthetic cost-change notice is clearly labelled.
- **Optional-action continuity:** a quiet-window boost now leaves the window open and More abilities expanded; the player still chooses when to continue. It no longer silently passes after one action.
- **Basic focus retention:** funding changes retain focus on the selector; ordinary actions generally restore a control rather than dropping focus to `BODY`. Context and visibility still need the correction below.
- **Encounter inspection on mobile:** the table-context drawer restores Mayfly, Carmen and Telework access; rail card names also expose inspection. The encounter retains its Palisade inspector. This resolves the original missing installed-card access for that scene, with a cancellation-scene gap remaining below.
- **Intent and trust:** “Let End the run resolve” has secondary styling and names its consequence. The pending Seamless Launch receipt is now labelled pending, the post-cancellation phase is accurate, and response availability no longer promises that resolving any ability immediately unlocks the next Corp action. Tool-generated disabled reasons are associated with their controls.

## Remaining findings

### 1. High — restored focus can be invisible or identify the wrong decision

**Reproduce:** at 390 × 844, use Tab to reach Review full break, then Enter. Focus moves to Start sequence at approximately y=988 while scroll remains 0: the focused control is below the viewport. After paying the boost, focus moves to Palisade’s Read card rather than introducing the response state. In the quiet scene, open More abilities, focus Carmen’s boost and press Enter: focus returns to Mayfly’s boost. The latter uses the same `data-action` for both cards, so restoring the first match loses action identity.

**Fix:** define focus destinations by transition and unique card/ability identity. On step changes, focus an accessible step heading or an appropriate decision control and bring it into view; preserve input focus for local allocation updates. Announce waiting states independently of the receipt. Restore cancellation to its originating action where available. Avoid a generic “first button” fallback.

**Acceptance:** a keyboard-only review → payment → response → remaining break → cancellation path retains visible, meaningful focus at desktop and mobile sizes; activating Carmen retains Carmen’s identity. Verify announcements separately with a screen reader.

### 2. Medium — exhausted optional abilities remain enabled and silently do nothing

**Reproduce:** in the quiet scene, open More abilities and buy three boosts to exhaust the initial 3 pool credits. Both 1-credit boosts remain enabled and the disclosure still says “2 legal boosts.” A fourth activation changes neither state nor receipt; the previous successful payment receipt remains. The reasons-gallery payment actions have the same exhausted-pool behavior.

**Fix:** derive affordability and availability counts from current resources. Disable unaffordable controls with a visible, associated “Needs 1 credit; 0 available” reason, and retain Continue as the useful next action. Give each successful quiet boost a card-specific receipt so repeated actions remain auditable.

**Acceptance:** at 0 pool credits, no enabled payment button silently fails or appears to confirm another payment. Counts and reasons update immediately after the final affordable activation.

### 3. Medium — mobile cancellation still lacks the relevant card rules

**Reproduce:** at 390px, select Trustworthy cancellation and expand Table context & card rules. Its inspectors are only Mayfly, Carmen and Telework. Seamless Launch is shown as an image/name without an inspector, while its desktop board inspector is hidden by the mobile breakpoint. Ansel, the proposed target, has no inspector in either layout. The target preview can be selected and confirmed without access to its card reference.

**Fix:** make context entries depend on the pending decision. Provide direct inspectors for Seamless Launch and Ansel beside the operation and target, retaining the chosen target when a dialog closes. Keep the existing encounter drawer behavior.

**Acceptance:** at 320px and 390px, inspect both operation and target and return to the same uncommitted selection; closing an inspector must neither confirm nor clear the target.

## Strengths to retain

The payment plan separates review, committed boost, response and remaining break; editable funding and explicit reconfirmation make the interrupted sequence understandable. Consequences and retained earlier spending are visible before continuation. Turn ownership and priority use distinct persistent labels. Cancellation names the operation and distinguishes its preview from earlier committed actions. Mobile keeps a readable single decision column without horizontal overflow in the checked cancellation layout. Prototype-only opponent controls and synthetic rule changes are clearly identified, which protects the credibility of the proposed game interface.
