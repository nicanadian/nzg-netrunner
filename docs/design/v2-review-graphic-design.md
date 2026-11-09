# Graphic-design review · redesign-2

**Verdict: ready for design implementation.** The current frozen mockup resolves the previous graphic-design review’s three remaining priorities. No blocking graphic-design issue was reproduced in the reviewed evidence.

This is an independent AI graphic-design review, not a human usability study, production accessibility certification, or engine/rules certification. Evidence: `mobile-spend-light.png`, `desktop.png`, `spend-review.png`, and `stopped-waiting.png` in `eval/interaction-proposal-v2/`, with the current `proposal.template.html` inspected for the relevant funding and waiting treatments. The review uses the scope in `docs/design/redesign-2-brief.md` and compares against `docs/design/final-review-graphic-design.md`.

## Resolved prior findings

- **Mobile funding separation is fixed.** In the current light mobile capture, “Overclock” and “5 available · run only” occupy separate lines, as do “Credit pool” and “3 available.” The allocation control and pool contribution stay aligned on the right. The source explicitly restores block display for these notes, so the earlier concatenated labels are no longer present.
- **Payment review is substantially tighter.** Repeated ice art, threat panel, subroutine panel, and step chips give way to one compact encounter line. The plan, itemized costs, total, funding, Mayfly consequence, and payment action read as one sequence. At the supplied 390px capture width, the primary action starts around y=769 rather than around y=1070 in the prior review’s capture. This is a comparison of full-page mockup captures, including fixture controls, not a production viewport or task-time measurement. “Spend 1 now · 2 total planned” places the immediate debit and plan total directly on the action.
- **Waiting no longer resembles an available gold action.** `stopped-waiting.png` shows a neutral, left-bordered waiting disclosure. “Priority: Corp” and “Corp response window” reinforce the same state, while the separate warning and receipt communicate that no further payment is queued. Source inspection confirms that the waiting surface is native `details`/`summary`, rather than the earlier disabled primary button.

The earlier gains remain intact: full-break review has the gold emphasis; letting the run end is a secondary action with a visible consequence; desktop mats retain compact, stable geometry; turn and priority remain distinct; and the critical explanation and warning text remains readable in context. The source also retains the selected-target border, fill, and inset marker credited in the previous review; these four captures do not independently demonstrate that target state.

## Remaining issues

None requiring a graphic-design change before implementation were reproduced in this evidence. The mobile payment action still requires some scrolling in shorter viewports, but its preceding content now consists of decision-relevant costs, funding, consequences, and timing. The supplied capture does not justify treating that remaining length as a defect.

## Strengths to preserve

- The blue Corporation and red Runner mats, real card art, and restrained gold action treatment establish a coherent tabletop identity without overwhelming the decision rail.
- The cost grid, ruled total, and aligned funding rows make the quote easy to scan in both the dark desktop and light mobile examples.
- Warning, receipt, pending status, and next action have distinct treatments. The stopped state is especially clear about retaining the spent credit while awaiting the Corp.
- Mobile context has a recognizable disclosure entry point, and the visible focus ring identifies the funding control without shifting the layout.

Implementation should preserve these hierarchies and the compact review structure. This verdict establishes visual-design readiness for the reviewed states; production engine behavior, keyboard and assistive-technology behavior, contrast compliance, and the complete responsive state set require their own implementation verification.
