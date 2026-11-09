# Digital art and visual direction review

AI specialist perspective, reviewed 2026-11-07. This is a visual critique of the interactive fixture, not a human design review or usability study. No production source or mockup was changed.

## Evidence and assessment

I read `interaction-proposal.md`, inspected the supplied initial `panel-desktop.png`, `panel-payment.png`, and `panel-mobile.png`, then rendered the current standalone fixture (`NTProposal.version === 'revised-1'`) at 1000px and 390px widths. Current captures are `/tmp/nt-art-current-desktop.png`, `/tmp/nt-art-current-payment.png`, `/tmp/nt-art-current-mobile.png`, and `/tmp/nt-art-current-inspector.png`. I opened payment review and the mobile Mayfly inspector. Dark mode was explicitly selected through browser CSS; the supplied payment and mobile captures also provide light-mode evidence. Findings below distinguish current visual observation from code inference.

The direction is coherent and worth retaining: a quiet teal tabletop, blue Corp and muted red Runner mats, warm gold decisions, and existing illustrated cards. It reads as a considered card-game table rather than a neon cyberpunk dashboard. New art is unnecessary. The next gains come from making the existing art and state vocabulary do more useful work.

## Severity-ranked findings

### Medium — Active priority lacks a distinct visual identity

Current render: “You have priority” uses the same thin outlined pill vocabulary as “Design proposal” and “Barrier · STR 2.” Turn ownership is readable in text, but a quick glance does not distinguish a live response opportunity from static metadata. The colored player mats do not change to identify who can act. Code inspection confirms the same neutral `.nt-tag` supplies these roles.

Fix: give response priority a dedicated compact treatment: explicit “Runner may act” / “Corp may respond,” a small side-colored bar or marker, and a consistent priority symbol. Preserve the separate turn-owner line. Use shape and words together; do not make blue/red alone carry the meaning. Keep static type badges quieter than the live priority indicator.

### Medium — Mobile restores rule access, but not enough table state

Initial mobile screenshot has no board access. The current revision adds “Table context & card rules,” which successfully opens Mayfly, Carmen, and Telework inspectors. However, its expanded content is only a server-position string plus rule links. It does not show the opponent's resources, the Runner's board grouping, or the relationship between Palisade and R&D. Thus it is still a rule-access drawer rather than a compact table view. This is especially relevant to the proposal's own concern about retaining board access.

Fix: expand this same disclosure into a small schematic: Corp resource row, R&D with its protecting Palisade, and a labeled Runner installed-card row. Keep the actual run position visible. Reuse existing thumbnails and labels rather than adding illustration. The desktop mats already provide the necessary visual vocabulary.

### Medium — Card art is recognizable, but the most relevant cards are visually underscaled

Current desktop and mobile renders: full-card thumbnails in the action rail are 30×42px for breakers and 43×60px for the threat; most of those pixels depict unreadable card text and framing. The illustrations become tiny identity cues. The mobile inspector improves this with accessible text, but the Mayfly image remains about 123px wide in the inspected 390px layout. The image itself should not be described as readable rules text at that scale.

Fix: preserve complete card images in the table and inspector, but test an illustration crop in the rail at roughly 48–56px with the card name and current stats beside it. Make the card name or image an explicit inspector control. The current breaker rail images are not clickable (`tool()` emits plain images), so desktop users must switch to the table to inspect the same card; mobile users must open the separate context drawer. In the inspector, offer enlargement of the full card or stack a larger card above the native rules text on narrow screens. Keep the current text transcription; it is what makes the rules reliably legible.

### Low — Gold now carries both action emphasis and completed payment

Code inference, not a claim about an inspected paid-state screenshot: the revision changes `.nt-status-dot.good` from green to gold, while the green `--nt-green` still marks broken subroutines. This is a defensible distinction between payment and success, but a 9px filled gold dot is easily read as the same “next action” emphasis used by gold buttons and the current progress step.

Fix: specify a small, stable shape vocabulary: hollow circle for pending, a receipt/coin mark for committed payment, check for resolved effect, square or crossed mark for cancellation. Continue spelling out “Paid,” “Resolved,” and “Cancelled”; icons should reinforce those labels. Reserve the broad gold fill for the action the player can take next.

### Low — Costs are organized correctly, but their visual rhythm can be stronger

Current payment render clearly separates the two-credit plan from the one-credit first payment and distinguishes Overclock from the pool. However, cost values, explanatory lines, and resource counters cluster around similar text sizes. The distinction between available credits and allocated credits depends heavily on reading the small labels.

Fix: use tabular numerals throughout `.nt-cost` and `.nt-source`, slightly strengthen the total row, and label the allocation values explicitly (“Spend 2” / “Spend 0”). Keep “5 available · run only” subordinate. No new currency icon is required; an unfamiliar icon would make this less clear.

## What the revision already improved

- **Action hierarchy:** the initial dark desktop and light mobile screenshots give “Continue without breaking” the same gold prominence as “Review full break.” The current fixture makes the run-ending choice secondary and gives “Palisade will end this run” warm warning text. This is a substantial improvement; do not carry the old criticism forward as an unresolved defect.
- **Table composition:** the initial dark desktop stretches the two mats apart around a large empty center. The revised `justify-content:flex-start` groups them naturally, as confirmed in the fresh desktop render. There is still empty space below the mats when the rail is tall, but it is calm peripheral space rather than a false gap between opponents. Do not fill it with decorative art.
- **Type and surfaces:** the native labels, calm panel backgrounds, thin dividers, and larger reason text stay legible without fighting the card illustrations. The light-mode payment capture is particularly clear. Retain the restrained contrast hierarchy.
- **Threat communication:** “End the run” is isolated in its own row, with a numbered subroutine marker and explicit unresolved state. That is more useful than trying to make the miniature printed card text carry the danger.
- **Payment communication:** the plan stepper, itemized costs, warm Mayfly consequence strip, and separate confirmation button form a coherent sequence. Cancellation remains a plain secondary action.

## Recommended next pass

Prioritize a dedicated priority indicator and a real compact mobile table summary. Then connect the relevant rail card directly to its inspector and improve the art-to-frame ratio in thumbnails. Keep the current palette and existing art. None of these changes calls for additional generated images, stronger glow, or a more decorative interface.
