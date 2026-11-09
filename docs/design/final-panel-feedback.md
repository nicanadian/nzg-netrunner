# Final panel feedback: revised interaction proposal

Reviewed frozen version `panel-revised` on 2026-11-07. Four independent GPT-6.1 Sol AI specialist perspectives reviewed the revised artifact, acknowledging resolved initial findings. These are AI critiques, not a recruited human panel or usability study. No mockup or production code was changed during this pass.

**Combined assessment: retain the visual direction; conditionally proceed with implementation. The full-break interaction is not ready to copy as written.** A newly reproduced opponent-priority bypass and remaining keyboard-focus defects take precedence over cosmetic refinements. Passing the earlier fixture checks did not cover these newly identified paths.

| Perspective | Final assessment | Remaining emphasis |
| --- | --- | --- |
| [Graphic design](final-review-graphic-design.md) | Conditional; visual direction ready | Mobile funding-label spacing and payment-review length; neutral waiting treatment |
| [UI/UX](final-review-ui-ux.md) | Conditional | Visible and meaningful keyboard focus; disabled unaffordable actions; operation/target inspection on mobile |
| [Digital art](final-review-digital-art.md) | Ready for design implementation with finishing work | Keep existing art and palette; improve mobile context and optional thumbnail treatment |
| [Game design](final-review-game-design.md) | Conditional; not ready as an engine interaction contract | Stop must preserve opponent priority; terminal-state labels and all cost copy must remain accurate |

## What the panel supports keeping

- One clear primary break-review action; a secondary action explicitly names End the run.
- Compact blue/red table, restrained gold emphasis, existing card art, and stronger decision-critical text.
- Separate, explicitly named turn owner and priority holder.
- Editable temporary/pool funding, accurate reopened quotes, and committed-payment receipts.
- Optional paid abilities remain available; one chosen boost no longer silently closes the window.
- Visible type, used-this-turn and no-target explanations, alongside manual legal choices.

## Fix first

1. **High: stopping a plan must not take priority from the opponent.** Review full break → Start sequence → Stop while the Corp has priority → reopen review → confirm break currently permits another debit without a Corp pass. Cancel the queued automation while retaining the pending response state; gate both manual and planned payment on the same priority transition.
2. **High: restored keyboard focus must be visible and meaningful.** At 390 × 844, keyboard activation of review focuses an offscreen payment action without scrolling it into view. A resolved boost can focus Read card instead of the response state; Carmen's quiet boost restores focus to Mayfly because both share an action identifier. Use deliberate transition destinations and unique ability identity, then verify the whole keyboard path.
3. **Medium: zero-credit actions need an affordability reason.** After three quiet boosts exhaust the pool, enabled buttons silently do nothing and leave the previous success receipt visible. Disable unaffordable actions, show the missing credit, and update action counts.
4. **Medium: complete mobile payment and inspection context.** Separate source names from balances (currently “Overclock5 available”), shorten repeated information above payment, and provide Seamless Launch/Ansel inspectors in the cancellation scene.
5. **Medium/low: keep all status and cost text tied to current state.** Ended/invalid encounters still show active Runner priority and encounter resources. In the changed-cost fixture, break-zero introductory text still says 1 credit while the final quote correctly says 2. Waiting should look like a status rather than a faded gold action.

## What does not need redesign

No new illustration, theme replacement, decorative dashboard or wholesale layout change is recommended. A compact relational mobile board and better rail-art crops are optional polish. The supported direction is clearer presentation of decisions and consequences, with exact engine timing underneath.

The recommended sequence remains receipts/reasons and turn/priority first, quiet-window layout next, and full-break orchestration after the priority bypass and shared engine payment contract are resolved. Target-effect-only cancellation and synthetic interruption fixtures are clearly disclosed; they do not establish operation refund behavior or comprehensive rules correctness.

Review identity: standalone SHA-256 `0558d363e89643aeac0b2729344c3cab29387473179e77e778fa7e93832c8b2d`; template SHA-256 `8a23c0164e0bfb25cc138256feab9f0c611aebefb2ebbd3a45add1da0133f7eb`.
