# Redesign-2 independent UI/UX review

**Verdict: conditional for design implementation.** The core sequence is ready to implement, with the two narrow acceptance criteria below. The previous three main findings are substantially resolved. This is an AI specialist review of the frozen fixture, not a human study or production accessibility certification.

I read `redesign-2-brief.md`, the previous final UI/UX review, and the current template; visually inspected the current mobile spending and stopped-waiting screenshots; and exercised the standalone HTML in fresh headless Chromium via Playwright `setContent`, without a server or user tabs. At 390 × 844 I used actual Tab/Enter navigation for review, payment, waiting, stop, Carmen, and target selection. Inspector opening/closing, Escape restoration, resource exhaustion and browser focus bounds were also checked. Screen-reader announcements were inspected in source, not certified with assistive technology.

## Resolved findings

- **Visible, meaningful primary transitions:** Review focuses the Overclock selector inside the viewport. Confirming the boost focuses the native “Waiting for Corp response” disclosure, also inside the viewport. Stopping the plan retains that waiting destination and Corp priority; after the simulated response, focus returns to the available review action. No further ability is offered while the response remains pending.
- **Distinct quiet actions and exhausted resources:** activating Carmen with Enter retains Carmen focus and creates a Carmen-specific receipt. After three quiet boosts, both boosts disable, “0 affordable” and the visible associated “Needs 1 pool credit; 0 available” reason update, and focus moves to the useful Continue control. This resolves the earlier silent fourth activation in this scene.
- **Mobile operation and target rules:** Seamless Launch and Ansel now have direct inspectors in the decision column. With an uncommitted Ansel selection, opening either inspector and pressing Escape returns focus to its opener, visibly, and preserves selection without confirming it.
- **Spending clarity:** the compact threat reference, aligned source balances, and “Spend 1 now · 2 total planned” make the immediate debit distinct from the proposed total. The waiting panel explains retained earlier payment and prevents a stopped plan from implying the response window closed.

## Remaining priorities

### 1. Medium — encounter affordability feedback is less complete than quiet/gallery feedback

**Reproduce:** in the encounter, purchase eight individual Mayfly boosts, drawing the first five from Overclock and the last three from the pool. Pass the simulated Corp response after each, then return to encounter options. With both balances at zero, More abilities still offers enabled Mayfly and Carmen boosts without an affordability reason. Selecting one opens its payment review. The confirmation is correctly disabled: this is **not a silent payment no-op**, and no additional credits are spent. However, the review gives no explicit explanation beside that disabled confirmation beyond the source balances and required debit.

**Fix / acceptance:** use current available sources to show “Needs 1 credit; 0 available” on this review, associated with its disabled confirmation. Either mark the initial ability as unaffordable or label it clearly as reviewable with an unavailable payment. Retain access to card rules and cancellation. At zero in both sources, users should understand why payment cannot proceed without inferring it from arithmetic. Apply the same rule to the full-break review and manual path.

### 2. Low — cancelling an individual Carmen review loses its originating control

**Reproduce:** open More abilities in the encounter, Tab to Carmen +1 strength and press Enter. Tab to Cancel · no new payment and press Enter. The return focus is visible but lands on Mayfly’s Review full break action, despite Carmen’s originating action still existing in the expanded disclosure.

**Fix / acceptance:** retain the originating card/ability identifier across the individual review and restore it on cancellation. Cancelling Carmen should return to Carmen; cancelling Mayfly should return to its own originating action. The quiet-scene identity fix already demonstrates the desired behavior.

## Strengths to retain

The plan separates intent, immediate spending, opponent response and subsequent spending. Stopping preserves paid effects while clearly retaining opponent priority. The waiting disclosure has an appropriate neutral appearance. Mobile spending has a readable single-column hierarchy, and native focus scrolling keeps the tested decisions visible. Card rules remain accessible without committing a preview. Visible turn and priority labels explain ownership without depending on button color. Synthetic controls remain clearly identified.

These conditions concern interaction consistency, not a redesign of the core direction. Production integration still needs engine-supplied legality and response eligibility plus screen-reader checks of live announcements, dialog context and the complete keyboard journey.
