# Redesign 2: panel feedback

Four independent GPT-6.1 Sol AI specialist perspectives reviewed the frozen `redesign-2` artifact after the redesign. This is an AI review panel, not a human usability study. The playable app and engine remain unchanged.

**Result: carry the design forward.** The earlier priority bypass and primary keyboard-flow issues are resolved in independent checks. Graphic design, digital art and game design mark this version ready for design implementation; UI/UX is conditional on the remaining affordability and cancellation-focus refinements. No newly reproduced payment or opponent-priority blocker was reported. Production rules/accessibility certification is outside this prototype review.

| Perspective | Verdict | Remaining findings |
| --- | --- | --- |
| [Graphic design](v2-review-graphic-design.md) | Ready | No blocking graphic issue reproduced. Mobile source labels, review length and neutral waiting treatment resolved |
| [UI/UX](v2-review-ui-ux.md) | Conditional | Medium: explicit insufficient-credit reason in encounter review; low: restore originating Carmen control after individual cancellation |
| [Digital art](v2-review-digital-art.md) | Ready | Optional: improve recognition of tiny breaker thumbnails |
| [Game design](v2-review-game-design.md) | Ready for design implementation | Low: table divider still says ENCOUNTER after completion, despite correct decision header |

## What changed

- **Plan and priority are separate.** Stop keeps the Corp response pending. The next planned or manual payment is unavailable until response completes. The reviewer independently exercised both recovery routes.
- **Spending review is shorter and clearer.** Repeated threat information collapses to one line, source names and balances occupy separate lines, and confirmation distinguishes “1 now” from the total plan. All amounts are in-game credits.
- **Keyboard transitions are deliberate.** Spending review focuses the visible source selector; response focuses the waiting disclosure; repeated quiet boosts retain card identity. Exhaustion moves focus to Continue.
- **Affordability updates immediately.** Quiet and gallery controls disable at zero credits with associated reasons. The encounter review also disables unaffordable confirmation, but needs the explicit reason requested below.
- **Inspection and context are restored.** Seamless Launch and Ansel can be inspected without committing or clearing the target. The mobile table groups Corp/server/ice and Runner installed cards.
- **Waiting and completion have accurate decision states.** Neutral disclosures replace unavailable gold actions, completed/invalid headers remove active encounter priority, and changed-price break-zero wording agrees with its quote.

## Remaining refinements

1. **Medium — encounter affordability explanation.** With pool and run credits both exhausted, the ability can still open a review and its confirmation correctly disables. This is not a silent payment failure or extra debit. Add a direct “Needs 1 credit; 0 eligible credits available” explanation and reflect affordability on the initiating control.
2. **Low — individual Carmen cancellation focus.** Return to the exact originating Carmen ability after cancelling its review, rather than falling back to Mayfly's primary action.
3. **Low — completed table caption.** Derive the desktop divider from the same state as the corrected decision header.
4. **Optional visual polish — thumbnails.** Compare larger illustration crops with current full-card miniatures, retaining names, stats and inspectors.

The first two items are the UI/UX review's conditions. The panel does not recommend another visual-system redesign or new artwork.

## Artifacts and checks

- Main fixture: `eval/interaction-proposal-v2.html`; all five scenarios are selectable.
- Inline opening-state variant: `eval/interaction-proposal-v2/spending-mockup.html`. It uses the same fixture, with only a scripted initial click into review; Replay returns to the normal opening state.
- Source/build/checks/screenshots: `eval/interaction-proposal-v2/`.
- Run: `node eval/interaction-proposal-v2/build.cjs`, then `node eval/interaction-proposal-v2/check.cjs`. Check dependencies use the existing isolated Playwright installation and Chromium cache documented in the brief.

Checks passed for preserved priority when stopping; planned/manual funding and response steps; changed quotes; zero-credit disabled controls; visible distinct focus; terminal states; mobile target/operation inspection; optional skip; five scenes at widths 320/390/728/1000; and zero JavaScript errors. Reviewers also ran independent browser checks. Neither those checks nor passing design review establishes the real engine's rules, privacy, concurrent/stale-decision handling, skip eligibility, screen-reader behavior or human usability.

Frozen standalone SHA-256: `a2c9839b56705a108f0ee8a08e24b6c5ac7a81bed0a5b20539b4547370341958`. Review reports apply to that version; the remaining findings have intentionally not been hidden by post-review edits.
