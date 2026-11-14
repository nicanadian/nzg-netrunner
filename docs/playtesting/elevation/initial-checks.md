# Elevation initial checks

This is an implementation checkpoint, not approval for general play or a completed playthrough report.

The requested Chrome browser-use host returned `The browser access host is unavailable` when inventory was requested. The previously authorized shared browser was used for a brief interim UI check: load the development preview, confirm the new matchup, start as Runner, inspect the opening decision, choose Keep, and observe the first live Runner action phase after Corp AI's opening. The retained public checkpoint is version 37 with one human choice. No game was completed in this session. `shared-runner-opening.png` records the shared-browser screen.

Separate programmatic checks used installed Google Chrome in headless mode through Playwright. Both human sides loaded their new identities and opening hands; Keep and Mulligan were visible; deck previews and identity text loaded; card image requests succeeded; the separate Core save restored after reload. A full automated AI-vs-AI worker smoke match reached a Corp win with 7 points in 919 native decisions without engine diagnostics. That is engine/worker coverage, not a human-side browser playthrough.

Issues found and corrected during this pass:

- Optional null-card install choices crashed the original Corp AI ranking code.
- Phoenix depended on an observation callback from the upstream renderer. It now tracks actual subroutine firing instead of assuming unbroken subroutines resolve.
- Mercia's end-of-action-phase event was missing in the Gateway phase graph. The Core profile now has a distinct trigger/decline point before discarding.
- Humanoid Resources replaced pending installation phases with the next choice. Installs now finish in sequence through native transactions before the following install/operation decision.
- Rising Tide was missing the new UI's breaker classification, estimates and target/cost links.
- Preview lobby footer inherited a Gateway-only label; preview labels now identify the Core Sets card pool.

The normal Gateway lobby and saves are separate. Normal-lobby Core Sets exposure, all remaining card fixtures, full games with UI decisions, and interactive Chrome verification are still pending. Alpha Build 1 downloads have not been replaced.
