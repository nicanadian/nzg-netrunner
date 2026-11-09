# Vendored source

Repository: https://github.com/bobtheuberfish/chiriboga
Commit: 77c80b1f0f96a2af068f5d267cc0df1a1b0c9b39
License: GPL-3.0 (retained in LICENSE).

Copied without edits: init.js, phase.js, command.js, checks.js, mechanics.js, utility.js, decks.js, runcalculator.js, ai_corp.js, ai_runner.js, sets/systemgateway.js, and deck/seedrandom.min.js (flattened here).

UI/PHP/PIXI files are not loaded. `engine/shims.js` supplies headless compatibility boundaries; `engine/adapter.js` replaces only presentation and interaction scheduling. The original global script order is retained inside an isolated Worker.

The newer drbo6 fork was reviewed during discovery. This first playable release pins the original Gateway implementation that was exercised by the integration tests. Expansion migration is separate work rather than silently claiming unsupported sets.
