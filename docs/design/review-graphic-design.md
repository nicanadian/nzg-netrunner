# Graphic design review: interaction proposal

Perspective: independent AI graphic designer on the review panel. This is a visual and interaction critique, not a human usability study.

The proposal has a convincing tabletop foundation: restrained blue Corp and red Runner mats, real card art, a warm gold action accent, and a consistent decision rail. The quieter paid-window scene best expresses that system. The encounter scene needs stronger prioritization: the interface currently gives an action that ends the run the same visual endorsement as the full-break plan.

## Evidence and scope

Reviewed `docs/design/interaction-proposal.md`, the supplied `eval/interaction-proposal/panel-desktop.png`, and all five scene branches in `eval/interaction-proposal/proposal.template.html`. Also rendered the standalone `eval/interaction-proposal.html` through Playwright using `page.setContent`, without a server or the user's browser. Examined all five initial scenes at 1000px wide in dark mode; payment review, response pause, changed quote, selected target, cancellation, and expanded availability at 390px wide; and the quieter-window scene in light mode. The extra captures are temporary `/tmp/nt-gd-*.png` files.

Findings below identify visual observations separately from supporting code inferences. No mockup or production code was changed.

## Findings

### High — Opposite encounter outcomes receive the same primary emphasis

**Observed:** In the supplied desktop screenshot, “Review full break · 2 credits” and “Continue without breaking” both use a full-width gold fill, gold border, and forward arrow. The latter ends this run through Palisade's unresolved subroutine. Its explanatory subtitle is smaller than its reassuring “Continue” label. The bottom placement gives it additional prominence as the final action in the rail.

**Fix:** Keep full-break review as the single filled primary action. Present the alternative as a secondary action with the outcome in the main label, such as “Let End the run resolve.” Keep that choice available; change its visual rank and explicitness. Preserve the ordinary gold “Continue run” treatment once every subroutine is broken. This makes the appearance communicate the changed consequences.

### Medium — Target preview does not look selected

**Observed:** Clicking Ansel changes the helper sentence and enables Confirm, but the Ansel target tile retains its original border, fill, and label. In the mobile capture the confirmation button is the strongest indication that anything was selected. With multiple targets, the visual pattern would be difficult to scan.

**Code support:** The target button's markup and classes do not depend on `state.target`; only the following helper text and Confirm's disabled state change.

**Fix:** Give the selected tile an explicit checkmark, a stronger border, and a “Preview selected” label. Include “Ansel 1.0” in the confirm action or immediately attached confirmation summary. Use a restrained selection treatment distinct from the gold commit button so preview still looks reversible.

### Medium — Payment review gives supporting text too much vertical weight

**Observed:** The quote itself is well aligned, but the 390px payment review stacks the threat, subroutine, four step chips, plan heading, cost rows, funding fieldset, warning, timing explanation, primary action, cancel action, and receipt. The primary payment action begins around y=941 in this fixture, below an 844px viewport. The user reaches the total and funding controls before seeing the action that spends the first credit. The fixture's top review controls contribute to that height; this is not a measured production-app position.

**Fix:** Compress the already-known threat into one encounter summary during review. Keep the cost total, allocation, Mayfly consequence, and immediate payment together as one clear decision group. Put “1 now · 2 total” beside the first payment action. Consider a reserved action area on narrow screens, with enough content padding that it cannot cover funding or warnings. Keep the separate response step visible; it is a valuable distinction.

### Medium — Essential explanations sit too low in the type hierarchy

**Observed:** Most of the content that makes these improvements trustworthy is small secondary text: why Carmen cannot break, when Telework refreshes, what Overclock can fund, what has already been paid, and what cancellation accomplished. Card names and buttons are readable, but these explanations require more deliberate reading than their importance warrants. In the expanded mobile availability gallery, nearly every explanation has the same small size and muted tone.

**Code support:** `.nt-help`, `.nt-reason`, `.nt-phase`, funding notes, and receipt detail generally use 12px type. Many headings, names, totals, and controls also share weight 500, leaving limited emphasis within dense groups.

**Fix:** Use 13–14px for decision-critical reasons and consequences, reserving 11–12px for turn metadata, timestamps, and incidental board captions. Give the one operative fact in each section a stronger weight: “Used this turn,” “Barrier; breaks Sentries,” “1 already spent.” Keep surrounding prose quiet. The current generous line height is worth retaining.

### Medium — Turn ownership and response priority need distinct visual roles

**Observed:** In scene 2, “Runner response window” is the dominant heading while “Corp turn · 3” is a small line above it. The explanatory sentence makes the distinction explicit, but the typography still makes Runner the stronger ownership cue. The same outlined pill style serves “Design proposal,” “You have priority,” “Runner may respond,” and “Barrier · STR 2,” despite their different significance. The disabled gold “Next Corp action” also retains the shape and color of an endorsed action during waiting.

**Fix:** Establish a stable paired status area: “Turn: Corp” and “Priority: Runner,” with player names in comparable type and explicit labels. Give priority a dedicated status style; keep card traits and fixture badges quieter. Use a calm waiting panel for the unavailable next action rather than a faded primary treatment. Keep disabled reasons outside faded controls, as the proposal already does.

### Medium — Desktop spacing disconnects the two sides of the table

**Observed:** In the supplied encounter screenshot, a large empty region separates the Corp and Runner mats, with the encounter label floating in its center. In shorter scenes the mats sit much closer together. The changing distance makes the board feel like a stretched sidebar instead of a stable table, and pushes the Runner's installed cards toward the bottom of a long decision rail.

**Code support:** `.nt-board` uses a column flex layout with `justify-content:space-between`, and its grid row follows the rail's content height.

**Fix:** Make board geometry independent of decision text length. Use consistent gaps between player areas and a purposeful server/encounter lane, or keep a compact board anchored near the top of the column. Additional height should become ordinary bottom space rather than an expanding separation between opponents.

### Medium — Mobile loses the strongest visual identity and table context

**Observed:** At 390px, the blue/red mats and installed-card grouping disappear. The rail remains orderly, but now reads chiefly as a teal form. In the availability gallery, Palisade is mentioned without a visible encounter summary. Cancellation also loses a visual HQ destination even though “returned to HQ” is a key result.

**Code support:** At widths below 720px, `.nt-board` becomes `display:none`; no replacement board-access control is supplied.

**Fix:** Retain a compact “Table” control or collapsible context strip, including player accents and the current server/card. Keep a small, persistent Corp/Runner visual cue in the status area. The rail can remain the mobile focus while players retain an identifiable game table and a way to inspect its context.

### Low — Availability cards are not fully consistent

**Observed:** Telework and Carmen use thumbnail-plus-name headers; the Mayfly example switches to a text-only heading. Because all three are availability examples, the last item looks like a different class of content. The grey disabled buttons are quiet, but their large repeated outlines take more space than the distinguishing reason.

**Fix:** Give Mayfly the same header construction. Make the reason the first readable line beneath each name, and reduce redundant framing around unavailable actions. Preserve the visible legal-choice disclosure and normal contrast for its explanations.

## Strengths to preserve

- **Coherent color identity:** The subdued Corp blue and Runner red make the card art the visual texture. Gold has enough warmth to locate actions without neon effects. The inspected light version retains the same hierarchy and faction distinction.
- **Quiet-window hierarchy:** Continue is clearly primary; More abilities is visible but subordinate; the optional skip preference is a separate, spacious control. This is the best reference scene for the rest of the proposal.
- **Payment structure:** Aligned cost rows, a separated total, and a bordered funding group make source allocation understandable. The warm Mayfly warning is visually distinct from neutral helper text.
- **Trust through visible outcomes:** Cancellation uses explicit words, a different marker shape, and a named event; the earlier committed advancement remains visually separate in the log. The changed-quote state pairs a warning with an explicit confirmation action rather than relying on a silent amount change.
- **Restraint and consistency:** Repeated rail padding, modest corner radii, readable card inspectors, and limited decoration support a serious local-table tool. The CSS also provides a clear focus outline; this review did not perform a complete keyboard or contrast audit.

## Recommended order

First separate the two encounter actions and add selected-target styling. Next tighten payment review and strengthen critical explanation typography. Then stabilize desktop board spacing and provide mobile table access. Finally refine the shared turn/priority status language and normalize the availability-card headers.
