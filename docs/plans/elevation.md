# Gateway + Elevation implementation and testing plan

Full 82-card completion, deck building and offline simulation roadmap: [elevation-full-support.md](elevation-full-support.md).

Status: implementation started. The first release target is one curated Gateway + Elevation matchup, followed by broader card/deck coverage. Gateway-only games remain available. This document records completion evidence and blockers as work proceeds.

## 1. Source and compatibility audit — in progress

- Pin the newer Chiriboga fork to an immutable commit; record license, provenance and modifications separately from the existing Gateway vendor.
- Inventory all 82 Elevation card IDs against current official card text, available implementations and the first matchup's dependencies. A card definition is not proof that its behavior or AI works.
- Select official NSG Core Sets sample decks for the initial Runner/Corp pair. Verify deck size, influence, agenda points and card availability.
- Identify required mechanics, engine APIs, AI hooks and UI information. Decide between an isolated versioned engine and narrowly scoped ports using actual compatibility results.
- Preserve the existing uncommitted UI/replay fixes and immutable Gateway deck IDs.

## 2. Engine and asset integration

- Keep the Gateway engine/replay path pinned. Expansion decks select a separate, explicitly versioned rules/engine profile; old saves must retain their original choices and outcomes.
- Bring in the first matchup's card implementations and required mechanics, with native legality/payment/targeting retained. Fetch current card data and art with provenance and hashes.
- Check new run-initiation/approach interactions, action-phase/discard-phase triggers, Threat, once-per-turn limits, hosting, damage and optional effects where the selected decks require them.
- Add clear unavailable-action reasons, explicit defensive rez decisions, optional-effect declines and correct card inspection. Do not introduce automatic passes across meaningful defensive choices.
- Version deck IDs and save configuration; reject unsupported combinations clearly.

## 3. First playable Core Sets matchup

- Add a card-pool selection and curated Runner/Corp decks while retaining the existing Gateway lobby.
- Show deck contents, identity text and the active card pool. Only expose decks whose entire card list is implemented and tested.
- Update helper/reference card context and asset packaging for the new pool.
- Complete native AI games with each human side's opponent policy before browser playtests.

## 4. Automated testing gates

- Baseline Gateway tests, uploaded replay regressions and historical deck/replay compatibility.
- Card-specific native fixtures for every new card in the initial decks: legal/illegal timing, payments, targets, optional decline/cancel, limits and expiration.
- Complete deterministic AI matches, zone/resource invariants, terminal outcomes and recorded replay round trips using multiple seeds.
- Hidden-information checks for observations, inspected cards, helper context and exported live checkpoints.
- Asset/deck completeness, worker startup, import/export, undo and resume.
- Test expansion packaging inputs without publishing a release or replacing Alpha Build 1 automatically.

## 5. Chrome browser-use playthroughs

- User preference: use the user's existing Chrome browser through its extension connection. Do not launch headless Chrome or substitute the shared browser for these playthroughs.
- Use the Chrome browser connection first; record the browser actually used. If unavailable, report the precise connection failure and distinguish any approved/shared-browser fallback from Chrome.
- Complete at least one game as Runner versus Corp AI and one as Corp versus Runner AI, using the initial Core Sets matchup. Use the UI for gameplay decisions; do not substitute direct engine choices for browser playthroughs.
- Check opening hand keep/mulligan, card inspection, installs and payments, income, optional effects, runs, every defensive rez opportunity, breaker/target choices, access, score/steal, end-turn controls and game end.
- Exercise reload/resume, undo and replay export/import in a separate retained session. Spot-check mobile layout and keyboard focus for the new choices.
- Record choices/replays, screenshots of meaningful new interactions, crashes, confusing/extra clicks, AI mistakes and any discrepancies between the displayed log and reconstructed game.
- Fix blocking findings, rerun affected tests and repeat the relevant browser sequence. Report full-game outcomes separately from focused checkpoints and programmatic browser regressions.

## 6. Expansion rollout after the first matchup

- Audit/complete the remaining card implementations and identities in small deck-based batches.
- Add additional official Core Sets decks only when their required cards and AI policies pass the same gates.
- Keep a truthful supported-card/deck inventory. Do not present partial support as the complete 82-card expansion.

## Progress and evidence

- 2026-11-13: plan created; source, card inventory and initial-matchup audit started.
- Current Gateway vendor: bobtheuberfish/chiriboga at `77c80b1f0f96a2af068f5d267cc0df1a1b0c9b39`.
- Candidate expansion source: https://github.com/drbo6/chiriboga, pinned at `c863f5af74ceb4fa821a4c84d3f643efffacb7ba`.
- Official set: https://nullsignal.games/products/elevation/
- Official starting decks: https://nullsignal.games/players/getting-started-sample-decklists/
- Official rules: https://rules.nullsignal.games/

### Initial implementation checkpoint

- Candidate pinned at `c863f5af74ceb4fa821a4c84d3f643efffacb7ba`. The original Gateway vendor was retained.
- First decks: official **Dashing Mad** (Phoenix, 45 cards, 17 influence) and **Brutal Efficiency** (Precision Design, 44 cards, 15 influence, 18 agenda points). They require 17 Elevation definitions including Phoenix.
- Inventory is in `elevation-card-inventory.json`. Missing from the candidate file: 35057–35060 and 35065–35066 (six NBN cards). None is in the initial matchup. The other definitions have not all been certified.
- Added isolated `core-v1` / `26.03-core-1` configuration, immutable Core deck IDs, and lazy expansion loading in the worker. Normal Gateway deck IDs, profile and catalog remain intact.
- Added 17 original-art masters and 51 WebP variants, with source URLs, hashes and dimensions in `assets/elevation-sources.json`.
- Corrected a null decline-install crash in Corp AI; corrected Phoenix tracking to follow actual fired subroutines; inserted the optional action-phase-end event needed by Mercia; repaired Humanoid Resources' sequential native install transactions; added Rising Tide encounter tools and quotes.
- Development-only UI is `http://localhost:5173/?core-preview=1`. It has a separate save slot and explicit preview labeling. The normal lobby does not offer these decks yet. This is not a complete or release-ready Elevation implementation.
- `npm run test:core-foundation`: native deck legality, profile isolation, terminal AI smoke match, Phoenix/Mercia timing, Humanoid Resources branches, Rising Tide strength/payment. These focused tests do not certify every card in the decks.
- `npm run test:core-browser`: headless installed Google Chrome worker/UI checks; complete automated AI smoke match, both-side opening controls, deck lists, card text/art, separate save slot and reload/resume. These are not interactive browser-use playthroughs.
- Gateway baseline: `NR_TEST_SEEDS=1 npm test` passed after reviewing the four recorded artifacts affected by the earlier Nico `rezStatus` display metadata. A comparison that removed only `rezStatus` proved all remaining recorded fields unchanged before refreshing those artifacts.
- Chrome browser-use connection: **blocked** by `The browser access host is unavailable`. Interim shared-browser session opened the preview, started Runner, kept the hand and reached the first live Runner action phase (version 37). This is a partial session, not a full game. Report and retained state are under `docs/playtesting/elevation/`.
- Remaining before normal-lobby exposure: complete per-card rules/payment/AI audits, broader deterministic seeds and replay round trips, then full UI games as both sides with findings/fixes retained. Chrome-specific completion remains pending a working connection.

### Next test cases

- Full existing-Chrome games completed on both sides, 2026-11-13: Runner lost 0–7 on turn 12; Corp won 7–2 on turn 12. Original exports independently reconstructed; UI resume/import/undo and focused fixes were verified. Findings, remaining payment friction, test commands and evidence: `../playtesting/elevation/chrome-full-playthroughs.md`. Chrome connectivity and initial full-playthrough gates are now satisfied for this matchup. Per-card coverage and broader seed audits remain open.

- Browser connection restored on 2026-11-13 through the installed official Chrome client in the existing `node_repl` tool. Real Chrome navigation, deck-library clicks and starting a Runner game were verified. Follow `../playtesting/chrome-connection.md`; the normal `cua_repl` route remains broken. Full playthroughs are still pending.

- Humanoid Resources: actually play the optional operation, additional-cost legality, all skip paths and AI decisions.
- Phoenix: complete successful-run reward with HQ trash, multiple runs and both-turn once-per-turn limits.
- Mercia: cost reduction, server creation, upgrade relocation and cancellation.
- Project Ingatan: excess advancement counters, discard-end timing, optional Archives installs and costs.
- Charm Offensive, Scrounge, Shred, Lie Low, Detente, Rent Rioters and Side Hustle: native timing, costs, targeting, flags and complete AI behavior.
- Flyswatter/Bumi: rez effects, hosted viruses, purge, bioroid click breaks, core damage and target privacy.
- Kessleroid/Scatter Field/Mahkota Langit Grid: trash restrictions, variable strength, install decline, recurring-credit eligibility and persistent trash-cost effects.
- Where available, compare focused card scenarios with the independent Jinteki headless engine. Do not start Docker Desktop for this work.
