# Interaction redesign 2

Version `redesign-2`; standalone `eval/interaction-proposal-v2.html`; source and isolated checks in `eval/interaction-proposal-v2/`. Previous mockup and review are retained. Production app and engine unchanged.

The five scenarios are retained. This pass addresses the final panel findings in `docs/design/final-panel-feedback.md`:

- Independent pending-response state: Stop clears the queued plan while retaining Corp priority. Both controls and spending guard prevent another ability until response completes.
- Spending review collapses repeated threat details, aligns source/balance lines, and says “Spend 1 now · 2 total planned.” These are in-game credits.
- Focus destinations: source selector for spending review; native waiting disclosure for response; originating distinct ability for repeated boosts; useful Continue when credits are exhausted. Native focus scrolls into view. A separate live status announces decision changes. No positive or negative tabindex is used.
- Zero-credit quiet/gallery controls disable with visible associated affordability reasons. Card-specific quiet actions retain identity and receipts.
- Neutral waiting disclosure replaces the unavailable gold button.
- Run-ended and invalid encounter headers no longer claim active Runner encounter priority. Run-ended temporary credits expire; invalid encounter context defers to the next engine decision rather than inventing run end.
- All break-zero cost explanations derive from the current synthetic quote.
- Mobile operation and target inspectors preserve uncommitted target selection. Expanded mobile context groups Corp/server/protecting ice and Runner installed cards.

Review the frozen current artifact independently, credit resolved issues, reproduce remaining concerns, and distinguish UI design readiness from production engine/accessibility certification. Existing Playwright Core under `/tmp/nt-mockup-tools/node_modules/playwright-core` and Chromium1193 can exercise a fresh `page.setContent` with no server/user tabs. The prototype check is `node eval/interaction-proposal-v2/check.cjs`. Screenshots alongside source cover desktop, spending, stopped waiting, invalid, unaffordable, mobile spending/table and cancellation. This is an AI specialist panel, not human recruitment or a user study.

Synthetic price and encounter-change controls and target-effect-only cancellation remain explicitly limited. Full rules legality, both-player priority, privacy and skip eligibility must come from the production engine.
