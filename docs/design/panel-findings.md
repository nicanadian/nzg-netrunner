# Five-interaction mockup: panel findings and revision

The deliverable is `eval/interaction-proposal.html`: five interactive scenarios in one self-contained file. Production game files were not changed. Select an idea at the top; Replay resets its example. Existing card art supplies identity, while native text supplies readable rules.

Four independent GPT-6.1 Sol AI specialist reviews were completed. These are simulated professional perspectives, not human reviewers or a player study. Their initial findings are retained verbatim in the reports; the table below records the subsequent revision, so an issue in a report is not automatically an outstanding defect.

| Perspective | Main findings | Revision |
| --- | --- | --- |
| [Graphic design](review-graphic-design.md) | Equal gold emphasis for breaking and allowing End the run; weak selected state; small critical text; stretched board | One dominant break action; explicit secondary “Let End the run resolve”; selected target styling; larger reasons; compact table stack |
| [UI/UX](review-ui-ux.md) | Focus lost during redraw; funding preference replaced; one optional boost silently passed the window; mobile rules inaccessible | Focus restored to the active input or next decision; editable funding on requote; optional boost keeps the window open; mobile context and direct card inspectors |
| [Digital art](review-digital-art.md) | Priority looked like static metadata; mobile lacked resources; small card art; weak numeric hierarchy | Dedicated labelled priority status; mobile resource summary; direct rail inspectors with readable rules; stronger totals. Existing palette and art retained |
| [Game design](review-game-design.md) | Reopened quote could understate debit; manual route erased modifier and skipped response; inaccurate prior-payment receipt; invalid plan recovery missing | Shared quote for display/debit; modifier retained; manual funding and response steps; previous payments retained in receipts; encounter-ended fixture stops before another debit |

## Proposed behavior

1. **Cancellation:** target previews remain reversible and do not become effect receipts. Cancel names Seamless Launch; confirming produces a different result. This scenario demonstrates target effects only; operation click/play-cost commitment and refunds are outside its scope.
2. **Turn / priority:** both players are named explicitly. Waiting explains why the next action is unavailable. Resolving an ability is not described as automatically closing the paid window.
3. **Quiet windows:** Continue leads; all optional choices remain discoverable. Skipping is off by default, applies to future eligible windows, and can be turned off. A chosen boost does not silently pass the window.
4. **Full break:** review total and source allocation, resolve one ability, allow a response, then recheck and confirm the next payment. Stopping retains committed costs and effects. The changed-price and encounter-ended controls are synthetic design fixtures. They do not assert actual Gateway card interactions.
5. **Reasons:** show used-this-turn, wrong-type and no-remaining-target explanations directly. Distinguish unavailable shortcuts from underlying legal but ineffective abilities.

## Validation and limits

The fixture's interaction check exercises cancellation versus confirmation; no payment at review; stop and reopen with a changed quote; persistent modifier in manual mode; displayed versus debited sources; funding retention/editing; manual response timing; response after a completed break; retained costs after letting End the run resolve; invalid plan with no further payment; opt-in skip; repeated optional choices; focus restoration; mobile card inspection; 320px/390px overflow; and JavaScript errors. Theme/layout previews cover dark desktop and light mobile.

Build with `node eval/interaction-proposal/build.cjs`. The isolated prototype check is `node eval/interaction-proposal/check.cjs`; it uses Playwright Core installed under `/tmp/nt-mockup-tools` and the existing Chromium 1193 cache. It is not part of the production suite and does not launch a server or operate an existing tab. Review screenshots are retained in `eval/interaction-proposal/review-evidence/`; `revised-*.png` records the later fixture.

No screen-reader study, human playtest, full contrast audit, or engine integration is claimed. Do not treat the fixture as rules certification. A production shortcut needs quotes tied to the engine position/version; it must revalidate breaker, strength, targets, payment eligibility, priority, mandatory decisions and terminal state before every payment. Automation also needs conservative engine-derived eligibility and viewer-specific information privacy. The mobile summary is not yet a full interactive board. Card-art crops, larger inspector artwork and tighter mobile payment layout remain optional visual refinements.

Recommended implementation order: receipts and visible reasons first; turn/priority second; quiet-window layout with conservative opt-in skipping next; full-break orchestration last, after the shared engine payment/priority contract exists. This retains the useful polish while containing the most complex rules work.
