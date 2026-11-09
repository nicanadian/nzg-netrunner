# Final digital-art review — panel-revised

AI digital-art perspective, 2026-11-07. Reviewed the frozen `NTProposal.version === 'panel-revised'` template and `revised-desktop.png`, `revised-payment.png`, and `revised-mobile.png`, with the earlier digital-art review for comparison. Screenshot evidence covers the supplied light-mode states; inspector behavior and response labels were checked in source, not exercised in a new browser session.

**Verdict: Ready for design implementation, with the following finishing work carried into implementation.** The restrained teal table, blue Corp mat, muted red Runner mat, warm gold action emphasis, and existing card illustrations remain a coherent direction. No new art or theme change is needed. This is visual review, not human usability validation or production accessibility sign-off.

## Fixed or materially improved

- Priority now has a dedicated rectangular `Priority: Runner/Corp` treatment, separate from the `Turn:` line and static rounded metadata. The old identical-pill complaint is resolved sufficiently for implementation.
- Relevant rail cards now expose explicit **Read card** controls. Mobile retains rule links and now includes both players' resource totals and server position. The earlier claim that opponent resources are absent no longer applies.
- The cost total has stronger scale and weight; the pool allocation numeral is larger. The two-credit plan and one-credit next payment are clearly separated. The Mayfly consequence strip remains conspicuous without competing with confirmation.
- Desktop mats are grouped, the run-ending choice is secondary with an explicit consequence, and native labels carry rules and state instead of relying on tiny printed card text. Preserve these improvements and the calm unused table space.

## Remaining priorities

1. **Medium — Restore separation within mobile funding labels.** The supplied mobile payment image reads “Overclock5 available · run only” and “Credit pool3 available.” The narrow-screen `.nt-source small{display:inline}` override removes the helpful desktop line break without adding a gap. Keep the availability text on its own line, or insert deliberate spacing and punctuation. Available balance and assigned payment should remain visually distinct at 390px.
2. **Low — Make the expanded mobile context relational.** Resource access is fixed, but the disclosure is still a text summary and rule links; it does not show Palisade protecting R&D or group installed Runner cards. A compact labeled server/ice row and installed-card row would preserve more table awareness. Reuse the existing mat vocabulary and thumbnails; no illustration is necessary.
3. **Low — Improve the art cue only where it helps identification.** Rail breaker images remain 30×42px full-card miniatures. The new inspector controls resolve access, so this is polish rather than a blocker. During implementation, compare an illustration crop around 48–56px against the current miniature, keeping the card name, stats, full-card inspector, and native rules text. Do not enlarge every card or add decoration to fill space.

The supplied screenshots do not show a completed-payment receipt or an open inspector. Earlier comments about those states should remain verification notes rather than claims of a newly observed defect in this version.
