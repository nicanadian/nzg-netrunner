# Final game-design review — panel-revised

Reviewed 2026-11-07 as an independent AI game-design perspective, not a human playtest or rules certification. The frozen `panel-revised` template, initial game-design review and panel findings were read. Relevant flows were exercised in a fresh headless Chromium 1193 page using `page.setContent`, blocked network requests and normal button interactions; no server or user tab was used. Template image placeholders were supplied empty sources for this behavioral check. No mockup or production code changed. No JavaScript errors occurred.

**Verdict: conditional for design implementation; not ready as an engine interaction contract.** Receipts, visible reasons and turn/priority presentation are useful implementation directions. Correct the response bypass below before adopting the full-break flow. Production payment, priority, automation and privacy still require engine integration and validation; the fixture does not establish those guarantees.

## Resolved findings

- Changed quote → stop → reopen now quotes a 2-credit remaining break and debits 2; total encounter spending is 3 including the prior boost. Switching to manual retains that modifier.
- Individual boosts now review eligible Overclock/pool funding and enter the Corp response stage. Normal manual and shortcut paths both show a response after the completed break.
- A pool-only allocation survives the immediate re-quote and remains editable. Review itself spends nothing.
- Letting End the run resolve after a paid boost reports no additional payment and preserves the earlier spending. The completed-break receipt names its source debit and encounter total.
- The encounter-ended fixture prevents another payment and explains that the plan has no legal target.
- Optional quiet-window boosts keep the window open, including repeated use. Enabling skip leaves the current decision available and applies to a later illustrated window.
- Cancellation begins as a pending selection and distinguishes cancellation from counter placement. Its target-effect-only scope and excluded operation-cost semantics are explicitly disclosed. Synthetic interruption controls are also disclosed appropriately.

## Remaining findings, in priority order

1. **High — Stop can bypass the pending opponent response.** Reproduction: Replay → Review full break → Start sequence. Priority correctly says Corp. Click Stop sequence before using any simulated opponent response: priority immediately becomes Runner. Review full break → Break subroutine 1 then spends another credit and breaks the subroutine without a Corp pass. The committed boost and price are preserved, but the response opportunity is discarded. Stop must cancel automation while retaining the current priority/window. Keep the Runner's next payment unavailable until the pending response transition completes. Acceptance: this exact path cannot reach a second debit before the Corp response resolves; subsequent manual and planned recovery share that restriction.

2. **Medium — Terminal and invalid states retain active encounter priority.** After a manual boost → Corp passes → Return to encounter options → Let End the run resolve, the receipt says the run ended, but the header still says `Run on R&D`, `Encounter · ice 1 from outside` and `Priority: Runner`, with Overclock shown as available. Test encounter ended produces the same active-encounter header above `Plan no longer legal`. The invalid fixture does not say that the run itself ended, so it should not invent that outcome. Render the actual terminal/invalid context and an appropriate waiting or next-decision status; distinguish remaining displayed balances from spendable resources in that context.

3. **Low — The changed-price break-zero explanation contradicts its quote.** Reproduction: boost → Test changed quote → confirm break → Corp passes → More abilities → Break 0 subroutines. The explanation says `This pays 1 credit`, while the next button and final payment review correctly say 2. The final confirmation is accurate; the introductory cost still teaches the wrong consequence. Derive every cost sentence, including the More abilities label, from the same current quote.

## Strengths and implementation boundary

The strongest features are the visible strength/type explanation, exact subroutine ordinal, explicit funding, separate committed-payment and remaining-plan language, Mayfly's run-end consequence, and direct unavailable-action reasons. The prototype usefully preserves legal but ineffective abilities instead of treating an unavailable shortcut as an unavailable underlying ability. Turn ownership remains distinct from the responder's priority in normal response flows.

The documented limits are candid. The synthetic encounter-ended example establishes one interruption outcome, not comprehensive legality handling. Before each production payment, validate the position/version, breaker, strength, targets, funding, priority, mandatory decisions and terminal state through the engine. Conservative skip eligibility, both-player pass handling and viewer-specific public/private receipts remain implementation requirements, not demonstrated guarantees. The mobile summary is not a full interactive board. No actual hidden-information leak, broad rules correctness, accessibility study or human usability result was established by this review.
