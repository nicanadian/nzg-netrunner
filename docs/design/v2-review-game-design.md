# Redesign 2 — independent game-design review

Reviewed 2026-11-07 by an AI game-design specialist. This is an independent prototype review, not a human playtest or rules certification.

**Verdict: ready for design implementation; not ready for production engine certification.** The previous high-priority response bypass is resolved. The remaining reproduced presentation issue below does not block adopting the interaction design. Engine integration must establish actual legality, payment eligibility, both-player priority, automation eligibility and privacy.

## Evidence and resolved concerns

Read `redesign-2-brief.md`, the prior `final-review-game-design.md`, the current template and standalone artifact. Exercised each artifact independently in fresh headless Chromium 1193 pages with Playwright Core, `page.setContent`, blocked network requests and no server or user tabs. The template received empty image sources solely for this behavioral check. No mockup or production files changed; no JavaScript errors occurred.

- **Stopping preserves Corp priority.** Review full break → choose pool-only funding → spend the boost → Stop queued plan leaves `pendingResponse` true, the stage at response, priority at Corp and spending at 1. Reopening review, manual abilities and additional-payment controls are absent. After Corp passes, both the reopened full-break route and the manual break route accept a separately confirmed payment and enter a new Corp response. Stopping cannot reach the old second-debit bypass through the available controls.
- **Source choice and changed quotes agree.** Pool-only funding survives the immediate synthetic re-quote. Stopping after the changed quote and switching to individual break retains the 2-credit price. Confirmation debits the selected pool source; encounter spending becomes 3 including the prior boost. The changed-price break-zero explanation, review and confirmation consistently show 2 credits.
- **Decision headers distinguish completion from current priority.** Letting End the run resolve shows Run ended, no active Runner priority and zero Overclock credits. The invalid-encounter fixture shows Encounter ended, no active priority, no payable break and a next-decision status; it does not invent a run end. Passing Palisade also removes active encounter priority.
- The retained design strengths are exact subroutine identity, visible strength/type reasons, explicit funding, separate prior payment and remaining plan, and Mayfly's run-end consequence. Review remains separate from payment.

## Remaining reproduced issue

1. **Low — Desktop table caption retains an active encounter after completion.** Reproduction: Replay → individual boost → confirm payment → Corp passes → Return to encounter options → Let End the run resolve. The decision header correctly says Run ended, but the table divider still reads `RUN → R&D · ENCOUNTER`. The same divider remains after breaking the subroutine → Corp passes → Continue run, while the header says Palisade passed / Encounter complete. Reproduced in both artifacts. Derive the divider from the decision state: show Run ended for the first path and an encounter-complete or neutral table-context caption for the second. This is a context inconsistency, not a reproduced payment or priority failure.

## Implementation boundary

The synthetic price/encounter controls intentionally illustrate interruptions; they are not claims about real card modifiers. Cancellation intentionally covers target effects only and excludes operation-cost semantics. Neither limitation is counted as a defect here.

The passing fixture demonstrates its narrow state transitions, not a production engine contract. Before every real payment or automatic pass, validate the current position, targets, strength, funding restrictions, mandatory decisions and priority through the engine. Both-player pass handling, stale or concurrent decisions, viewer-specific receipts and hidden information require integration evidence. Accessibility certification and human usability testing also remain outside this game-design review.
