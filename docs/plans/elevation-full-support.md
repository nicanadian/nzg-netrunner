# Full Elevation support, deck building, and offline simulation

Planning date: 2026-11-13. Status: implementation in progress; the experimental development build is available, and full release certification remains open. It extends `elevation.md` beyond its first curated matchup. The accompanying `elevation-82-card-tests.md` and machine-readable JSON give a card-specific checklist for every Elevation ID.

## Current development-loop checkpoint

Implemented: all 82 definitions, full text/art/faces, all-card printed-field checks and partial ability fixtures; shared deck documents/validation; 21 official attributed Core sample decks; local builder/library/import/export; replay-embedded custom lists; production UI-free runtime; seeded CLI; persistent workers; summary fast path with transcript parity; resumable matchup matrices and pinned-source failure replay; portable Node package tested with networking denied on macOS.

Core revision 2 repairs timing, costs, hosted uninstalled cards, private looks/searches, optional and sequential transactions, identity flips, and additional rez costs. Revision 1 and Gateway retained Chrome replays still reconstruct. Existing Chrome evidence now includes a fresh Core revision 2 Runner game (153 native choices, normal Corp win on turn 10), builder/mobile/import/recovery flows, Nebula's back face and MuslihaT's private look. All 14 new identities completed a native smoke game; this is separate from Chrome UI qualification.

The Gateway stress run attempted 1,000 games: 999 completed, one parent timeout, no engine exceptions. The retained timeout's 1,800-decision prefix reproduced against its frozen runtime. Full protocols A–H, all-identity Chrome qualification, fair-observation AI certification, Windows/Linux clean-machine tests and 10,000-game studies remain open. The coverage report intentionally certifies zero cards as fully audited.

See [development evidence](../playtesting/elevation/development-loop.md), [CLI instructions](../offline-engine.md), and `../../eval/offline-engine/elevation-coverage.json`. The detailed roadmap below preserves the original acceptance requirements; proposed file/command examples describe the planning baseline, while the CLI document describes the implemented interface.

## Product decisions

1. Ship a complete **Gateway + Elevation / Core Sets** pool first. Do not imply that importing a Standard/Startup deck makes its additional sets available. NSG currently defines Core Sets as Gateway + Elevation with no associated ban list; tournament-format support is a separate, versioned feature.
2. Use one rules implementation, one deck document and one validator across browser play, deck building and offline simulation. Browser UX, AI strategy and batch execution are separate consumers of that rules core.
3. Offer three deck entry points: bundled ready-to-play lists, imported public net-decks, and a local custom builder. All can be cloned into editable local decks. A supported public list is playable offline after import.
4. Start the simulator as a standalone Node CLI with local AI policies and no browser, web server, Docker, LLM service or network requirement. Profile it before considering a Rust/WASM rewrite. Native simulation is distinct from the user's actual-Chrome UI testing requirement.
5. Keep separate badges for **rules tested**, **UI tested**, and **AI support**. Do not infer any of these from a card definition existing or a game finishing.

## Planning baseline (before this implementation loop)

- All 82 IDs are inventoried: 14 identities and 68 other cards. The candidate source defines 76; six NBN definitions are absent. Only the first matchup's 17 Elevation cards have local card data/art.
- Two official decks and partial card fixtures exist. Two complete existing-Chrome games reached matching reconstructed results; Mercia, timing, cost and streamlining bugs found in those games were repaired. Reuse this evidence, then fill the gaps.
- `engine/adapter.js` already accepts `config.decks` for simulation and exposes boot/choose/advance/snapshot. This is an internal entry point, not a complete public custom-deck validation path.
- `tests/engine-smoke.cjs` creates an isolated VM per game because upstream scripts mutate globals, JSON and randomness. Move reusable loading into production engine modules; production CLI must not depend on test helpers.
- `scripts/benchmark-gateway-decks.cjs` already runs seeded AI matches and retains errors/timeouts. It starts a process per job, repeatedly materializes presentation snapshots and contains Gateway-specific deck assumptions. Reuse the job/result concepts, not its hardcoded validation or worker lifecycle.

## Milestone 0 — freeze the baseline and expose honest coverage

Deliverables:

- Pin current Gateway and first-Core runtime bundles, card-data hashes and the two Chrome replay fixtures before incompatible work. Subsequent semantic fixes get an engine revision; old saves resolve their pinned runtime or fail with an explicit migration explanation.
- Extend the card manifest with definition, rules, UI and AI status; fixture IDs; exact rule/ruling references; known gaps; and evidence links. An implemented callback is not a completed card.
- Cache current official text/rulings, front/back faces, metadata and all remaining 65 cards' art with provenance. Test assets for all faces of flipping identities; art is not required by engine-only packages.
- Add a coverage check that requires exactly IDs 35001–35082 and reports missing evidence for each ability. Unknown/experimental cards remain visible in the builder as drafts, but are excluded from advertised supported play.

Acceptance: existing Gateway suite and both real Chrome replays still pass; a reproducible coverage report distinguishes implementation from verification. No previous deck ID or release download is overwritten.

## Milestone 1 — shared deck documents, validation and engine boundary

Create proposed production modules `engine/runtime`, `engine/decks`, `engine/validation`, `engine/policies` and a thin browser-worker adapter. Names are a proposal, not files implemented by this plan.

Deck document:

- Schema version, immutable revision/content hash, display name, side, identity, card/count entries and intended pool/rules profile.
- Source metadata: URL, external decklist ID/revision, author, fetch timestamp, original title and local edits. Preserve the original imported list; never silently substitute unsupported cards.
- Canonical card IDs with aliases for current numeric codes, NRDB logical IDs and reprints. Aggregate copy limits by logical card, not printing. Identity faces are one identity, not extra deck cards.
- Normalized content hashes cover identity and sorted quantities; name/source notes do not change gameplay identity. Editing creates a new revision. Every game embeds the resolved deck snapshots and hashes so deleting/editing the library cannot alter replays.

Shared validation must run in the browser worker and CLI, not only in the editor:

- Counts must be finite positive integers; IDs known, enabled, on the correct side and in the chosen pool. One identity is separate from draw-deck contents. Honor identity-specific deckbuilding exceptions.
- Use printed minimum size, influence limit and per-card copy limits; distinguish absent influence from zero. Check faction restrictions and Corp agenda totals for the actual deck size, including size-band boundaries. Do not copy the old benchmark's 18–19-points assertion into a general builder.
- Tutorial identities/decks retain their own teaching profile. They do not pass ordinary Core Sets legality merely because their engine definitions exist.
- Return actionable structured errors and separate legality, implementation and AI-compatibility results. Drafts may be saved while invalid. Normal Play and default benchmarks require a legal supported list. Any developer sandbox is explicit and excluded from ranked comparisons.

Acceptance: UI/worker/CLI agree on valid and invalid fixtures, larger decks, reprint aliases and malformed imports; a replay survives editing/deleting its original library deck.

## Milestone 2 — rules foundations and the six missing cards

First audit shared primitives needed by the difficult cards: installation cost modifiers and sequential transactions; action/discard-end timing for both players; identity flips and private looks; tag removal/additional/X costs; score-area ownership and agenda movement; run redirection/swap/bypass; delayed effects, Threat, Dividends and persistent modifiers; restricted/recurring payments; damage, prevention and terminal checkpoints.

Then implement the six absent NBN cards against the actual rule text:

- 35057 Nebula Talent Management; 35058 Synapse Global.
- 35059 Embedded Reporting; 35060 Next Big Thing.
- 35065 Bigger Picture; 35066 IP Enforcement.

Do these early: identity flipping, either-score-area activation and retrieving stolen agendas may reveal engine work that affects other cards. Do not leave them as stubs until all simpler cards are done. Keep UI presentation corrections outside the unmodified upstream vendor; keep local semantic ports explicit and versioned.

Acceptance: protocol A–H below for these cards and their primitives; no generic fallback choices for unresolved rules; fixtures cover interrupted payment, score-area changes and terminal ordering. Jinteki is a useful independent comparison, with official rules/rulings as the authority when engines disagree. Do not start Docker Desktop automatically.

## Milestone 3 — audit and complete all 82 cards in waves

The card matrix assigns work, not release certification:

1. Close remaining gaps in the original 17, reusing native and real-Chrome evidence. Finish Humanoid Resources' actual operation play/additional costs, Phoenix reward ordering/limits, Shred branches and payment restrictions.
2. Complete the six missing NBN cards after the shared primitives.
3. Audit the other 25 Runner cards: hosted uninstalled cards, consoles, memory, identity faces, run events, redirection and encounter lifetime interactions.
4. Audit the other 34 Corp cards in small mechanic batches: turn-end economy/advancement; agenda/Dividends; damage/ambushes; swapped/remote subroutines; additional costs/forfeits; operations and region funding.
5. Cross-card integration across the complete Core Sets pool, including older Gateway cards. Release cards/decks only as their dependencies pass, rather than declaring a whole faction supported from a handful of games.

### Required protocol for every card

A. Independent specification: enumerate each printed ability, legal timing, costs, choices, mandatory/optional branches, zone moves and exact expected outcomes from official text and current rules/rulings. Do not derive the oracle by copying candidate implementation code.

B. Positive native fixtures: exercise **every ability**, subroutine and mode, through the legal decision API. Hand-author the setup; resolve actual choices rather than calling a card callback as the only evidence.

C. Negative and boundary fixtures: insufficient credits/clicks/counters, zero/exact/over thresholds, wrong target/type/zone, no targets, prevention/replacement, decline/cancel where legal, and additional costs already committed. Distinguish cancellation before a cost from undo after an action.

D. Lifetime and interaction fixtures: repeated use, either player's turn, run/encounter/turn end, rehosting, trash/derez/reinstall, simultaneous triggers and changed legality during a sequential effect. Include at least one relevant Gateway interaction and any special interaction in the matrix.

E. Privacy and invariants: inspect each side's observations around looks/reveals/search/hosts and restore concealment when appropriate; cards exist in one zone, legal counters/resources/ownership, no post-terminal actions or invalid choice references. Full developer traces must be separate from player-visible exports.

F. Replay/determinism: save/restore mid-effect and mid-payment, cancel/retry/undo at permitted boundaries, reproduce the event sequence and final state from seed + choices + versions. Checkpoint-based UI exports and reconstruction must agree.

G. AI: targeted positions prove the policy can pay, target, decline and terminate safely without hidden-information leakage; distinguish legal fallback from competent use. Unsupported AI behavior blocks certified benchmark use, even if human-side rules work.

H. Existing-Chrome UI: focused scenarios verify displayed costs, source/target labels, full card text, accessible controls, optional exits and meaningful defensive pauses. Reuse a mechanic fixture across cards only when the card-specific behavior is still asserted. Complete full games spanning all 14 new identities, plus Gateway regressions; not 82 full games as a substitute for native rules fixtures. Exercise mobile-width layouts and keyboard focus in this same Chrome connection and restore temporary viewport overrides.

A card passes only when all applicable cases are linked to executable or retained UI evidence. There is no fixed "one test per card" quota; a multimode or timing-heavy card needs more cases. Known bugs remain visible and are never converted to passes by deleting assertions.

## Milestone 4 — deck library and custom builder

### First usable UI

In the lobby offer Ready-made decks and My decks, with identity, size/influence/agendas, strategy summary and support badges. Start with official NSG Core Sets samples, then curated community lists using only supported cards. Cover all seven factions, then provide useful lists across the 21 regular Core identities as their rules/AI pass. Tutorial identities remain under teaching games.

Ready-made deck actions: View cards, Play, Clone and edit, View source. A modified list is labeled a local variant, retaining attribution.

### Custom builder

Choose side/identity/pool, then search/filter cards by name, faction, type, cost, subtype, influence and support. Add/remove quantities with a persistent deck panel, live size/influence/agenda totals and specific validation errors. Full-card inspection works without losing selection or scroll. Show a deck curve/type breakdown and optional notes, but do not invent a competitive power rating.

Save locally, duplicate, rename, delete recoverably, export/import JSON and support plain-text decklists with explicit ambiguous-title resolution. Preserve unsaved drafts and edits through reload; offer local backup files. Do not silently convert or erase old character decks.

### Internet decklists

Import a public NetrunnerDB decklist URL or pasted list. Use the documented API through a small versioned importer and test it against real current payloads before choosing v2/v3 deployment details; the v3 documentation currently includes preview-host examples. Keep the provider adapter separate from the deck schema.

Validate the response, map logical IDs/printings, preview exact quantities and unsupported cards, then let the user save a local snapshot. Fetch on explicit import/refresh; network failure cannot break existing local play. Bundle curated snapshots so first offline launch works. Never execute HTML/scripts from deck descriptions. Do not promise OAuth/private-deck sync, public publishing or full Standard support in v1.

Acceptance: create a legal deck from scratch; clone/import/edit a net-deck; reject an unsupported or illegal list with precise reasons; reopen and play it offline; preserve its original revision in a replay. Verify these flows in existing Chrome for both sides and at narrow widths.

## Milestone 5 — offline engine CLI and stable results

Extract the existing native engine into a UI-free runtime before optimizing it. Keep the browser worker on that same runtime; no parallel reimplementation of card rules. Suggested CLI shapes (not implemented commands):

```text
netrunner validate deck.json
netrunner simulate --runner runner.json --corp corp.json --seed 123 --out game.json
netrunner bench --manifest experiment.json --games 10000 --workers auto --out results/
netrunner replay failed-game.json
```

Modes: validation; one fully traced match; large summary-only runs; matchup matrices; deck-variant experiments; replay a failure. Versioned policy modules select legal actions from the appropriate player's observation. The existing AI can be the first baseline, but its access to engine globals must be audited; do not label results fair hidden-information evaluations until that gate passes. Omniscient/debug policies, if retained, are clearly marked and cannot mix with fair-policy results.

Each result records job ID, exact deck revisions/hashes, engine/card/rules/policy versions, seed, terminal reason and points, turn/decision count, elapsed time, limits, error status and selected gameplay counters. Keep event logs/replays for all failures and a deterministic sample of successes; offer full trace mode for debugging. Optional metrics include first-install/first-score timing, economy, run success, accesses, damage/tags and card usage/opportunities, with instrumentation definitions versioned so incomparable metrics cannot be merged accidentally.

The package contains runtime, card definitions, policies and schemas; no card art or browser binaries. Ship reproducible Node distributions first, then consider platform executables with an embedded runtime. Test clean network-disabled runs on Windows/macOS/Linux after dependencies are installed, including non-ASCII paths and interrupted writes.

Acceptance: browser and CLI replay fixtures match; a local deck can run with networking unavailable; every failed/stalled job has a reproducible artifact; no UI module or test helper is required in production.

## Milestone 6 — high-volume performance and experiment integrity

Measure cold start, steady-state throughput, decisions/second, p50/p95 match time, per-worker memory and output size on a pinned mix of easy, long and complex games. Record CPU, OS, Node version and worker count. Do not promise games/second before measuring.

Optimize in this order:

1. Summary-only `runToTerminal` avoids full DTO/card-image/log construction after every decision; event counters and authoritative win/legality checks remain active. Full snapshots stay available on request and failure.
2. Use a bounded persistent worker pool instead of a new process per game. Compile/load static source once per worker where safe; begin with a fresh VM realm per game. Reusing a game realm requires explicit repeated-game/no-state-leak tests before it is enabled.
3. Profile AI search/run calculation, allocation, serialization and shuffling. Optimize measured hotspots, with reference-versus-fast transcript/state parity on a deterministic corpus.
4. Tune parallelism against actual CPU/memory contention. Parent-enforced wall-time and decision limits terminate/replace stuck workers. Atomic per-job results plus a manifest allow resume without duplicate games. Preserve initial failure outcomes when retrying.
5. Consider native/WASM hotspots only if profiling justifies the maintenance cost. A full second engine comes with its own 82-card certification burden and is not the first optimization.

Experiment design:

- Use the same versioned opponent panel and seed schedule for deck variants. Pair variants by opponent/seed; document that identical initial seeds do not guarantee identical later random events once decision paths diverge. Keep scheduling independent from RNG and validate deterministic results across worker counts.
- Separate engine throughput benchmarks from AI deck-performance experiments. Publish wins/losses and errors/timeouts/nonterminal/unsupported-policy counts separately; never count failures as ordinary losses or silently drop difficult matchups.
- Report matchup-level results, sample sizes, confidence intervals and paired variant differences, not just a grand win rate. Around 1,000 independent games gives roughly a ±3 percentage-point interval near 50%; a 10,000-game total spread across many matchups does not give that precision to each matchup.
- Reserve a held-out opponent/seed panel for final comparisons. More games reduce sampling noise, not systematic AI bias; evaluate deck conclusions under multiple policy versions/strengths and retain human validation.

Staged runs: small deterministic qualification for each changed mechanic; a 100-game reliability pilot; a 1,000-game soak; then an interruptible 10,000-game offline experiment. Gate the next stage on completion/error rates, reproducibility and memory stability. Exact throughput goals are set after the baseline; initial success is a reproducible, resumeable thousand-game runner with measured improvement over the existing script.

## Delivery order and release gates

1. Baseline/coverage registry + shared deck schema/validator.
2. First standalone CLI using existing supported decks; get performance measurements early while rules work continues.
3. Shared mechanics + missing NBN implementations, then all-card waves with per-card evidence.
4. Bundled net-decks and custom builder on the same deck schema; imports as a separate optional network boundary.
5. Worker-pool/summary fast path, deterministic parity and large offline soaks.
6. All-card release qualification: 82/82 audited rules definitions with required fixtures, all 14 new identities exercised in real Chrome, adequate AI coverage for every advertised benchmark deck, complete assets/faces, custom-deck replay survival, Gateway regressions and clean offline packaging.

The earliest useful deliverable is deck validation + a UI-free CLI for the already-supported matchup. Full 82-card rules/AI certification is the largest workstream and can progress without blocking that initial simulator. Do not publish a new release or replace Alpha Build 1 simply because an intermediate milestone passes.

## Sources and reference code

- Official set scope: https://nullsignal.games/products/elevation/
- Core Sets pool/sample-list policy: https://nullsignal.games/players/supported-formats/
- Rules, deck construction and timing (currently v26.03): https://rules.nullsignal.games/
- Public decklist API documentation: https://api.netrunnerdb.com/api/docs/decklists%2Fall_decklists
- Per-card reference URLs and proposed cases: `elevation-82-card-tests.json`.
- Existing implementation: `engine/adapter.js`, `engine/worker.js`, `engine/deck-catalog.js`, `engine/core-decks.js`.
- Existing runtime/benchmark evidence: `tests/engine-smoke.cjs`, `scripts/benchmark-gateway-decks.cjs`, `tests/core-chrome-replays.cjs` and `../playtesting/elevation/chrome-full-playthroughs.md`.
