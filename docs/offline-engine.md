# Offline engine development build

Requires Node.js 22 or newer. Matches need no npm installation, browser, web server, Docker, card images, model service or network. This portable Node CLI is separate from the published Alpha Build 1 desktop downloads.

```sh
node scripts/netrunner.cjs validate loup-v1
node scripts/netrunner.cjs simulate --runner phoenix-core-v1 --corp precision-design-core-v1 --seed example --out results/example
node scripts/netrunner.cjs bench --games 1000 --workers 4 --wall-ms 120000 --seed gateway-study --out results/gateway-study
node scripts/netrunner.cjs replay results/example/jobs/JOB_ID.json
```

In the repository, `npm run engine -- …` is equivalent. `npm run build:engine` creates `builds/engine-dev/`. Run `node scripts/netrunner.cjs …` inside that folder. It contains code and licenses, without the app, artwork, browser binaries or npm dependencies. Windows, macOS and Linux share this entry point; Node must already be installed. This is not an embedded executable or a new public release. Clean Windows/Linux machine qualification remains pending. The macOS test copies the package to a spaced/Unicode path and completes a match with OS network access denied, then verifies its replay.

## Decks and rules

`--runner` and `--corp` accept a bundled deck ID or local deck JSON exported from the browser builder. All 21 official NSG Core sample lists are bundled as attributed, immutable snapshots in `engine/net-decks.js`. Public URL import is a separate browser feature; simulation never fetches decks. Use `--pool core-v1` to promote a Gateway catalog deck to the larger Core pool. Both sides must use the same pool.

The shared `engine/deck-document.js` validator checks identity, quantities, aliases, side, copy limits, minimum deck size, influence, agenda factions and agenda totals for the actual deck size. Unknown cards and missing definitions fail before a game starts. Core games default to `26.03-core-2`; older Core revision 1 and Gateway save profiles retain their routes. All 82 Elevation definitions and initial per-card ability fixtures exist, but the full rules/UI/AI audit remains open. Core lists explicitly remain experimental.

## Vantage Point development preview

The separate `vantage-preview-v1` pool uses rules profile `26.03-vantage-3`; revisions 1 and 2 remain available for saved replays. All 66 Vantage cards, including all four identities, have native definitions and executable rules evidence. Existing Gateway/Core validators and game profiles remain isolated. `npm run coverage:vantage` reports implementation and audit status separately.

There are 22 local Vantage decks: nine recommended play decks and thirteen interaction test pilots. Seven frozen full-set lists still cover every Vantage card for reproducible benchmarks. Recommended Runner decks have basic fracter/decoder/killer coverage and matching support for their stealth abilities; this is a playability check, not competitive or strategic AI certification. The same rules run in the browser worker and offline engine:

```sh
node scripts/netrunner.cjs validate hiram-full-vp-v1
node scripts/netrunner.cjs simulate --runner hiram-full-vp-v1 --corp editorial-full-vp-v1 --out tmp/vantage-example
node scripts/netrunner.cjs bench docs/research/vantage-point/benchmark-matrix.json --out tmp/vantage-validation
```

The checked matrix uses 100 common seeds across 12 matchups (1,200 games) and four workers. Its source fingerprint, completion counts, timing distribution, outcomes and policy limitations are recorded in [benchmark-validation.json](research/vantage-point/benchmark-validation.json). Earlier failures and their reproductions remain in the local experiment directories. A completed game is not proof of a strong deck or strategically competent AI.

The preview is available at `/?vantage-preview=1`. All 66 fronts and three alternate Méliès U faces have locally bundled artwork. Nine complete shared-browser games have retained decision traces and replay regressions, including games using Hiram, Vic, Méliès U and Editorial Division. The existing Chrome access host and shared-browser snapshots were unavailable; DOM interactions, mobile geometry, loaded images and replay import were checked through the authorized shared browser. Full visual/keyboard qualification in the user’s Chrome and strategic AI audits remain separate work. The detailed implementation record is [Vantage Point implementation and testing](plans/vantage-point.md).

## Matrices and variants

Save a specification beside exported variant decks, then run:

```sh
node scripts/netrunner.cjs bench experiment.json --out results/variants
```

```json
{
  "schemaVersion": 1,
  "runners": ["loup-v1", {"label": "My variant", "deck": "runner-variant.json"}],
  "corps": ["precision-design-v2", "reality-plus-v2"],
  "gamesPerMatchup": 1000,
  "seed": "variants-1",
  "workers": 4,
  "wallMs": 120000
}
```

Every Runner/Corp combination uses the same seed schedule and a frozen source bundle. Paths are relative to the specification. Embedded deck documents are also accepted. `matrix-summary.json` separates each matchup's results and confidence interval. A common initial seed does not guarantee identical later random events after strategies diverge.

## Reproducibility and recovery

Each experiment records exact deck documents and SHA-256 revisions, engine fingerprint, rules and policy versions, seed schedule, machine, limits and mode. It also copies the executable source into its `runtime/` directory. Replay uses this saved runtime even after the working checkout changes. Preserve the whole experiment directory, including its manifest and runtime.

Run the identical command to resume; completed job files are retained. Another experiment or engine revision in that directory fails explicitly. Worker count can change. Extend game counts in a new output directory. Initial failures are preserved; investigate/retry separately. A directory lock prevents concurrent writers; a dead process's lock can be recovered.

Workers persist between jobs, while each game receives a fresh VM and seeded randomness. Static compiled code is cached per worker. Defaults: `--wall-ms 60000`, `--decisions 100000`, `--workers 1` (maximum 64), `--trace-every 100`. Every failure retains its available decisions and diagnostics; the parent receives periodic checkpoints before killing a stuck worker, including synchronous AI searches. A deterministic sample of successes retains full traces; use `--trace-every 1` for every game.

`replay` compares the terminal result and retained decision transcript against the frozen engine. For timeouts it compares the available decision prefix and reports the new completion/timeout state; wall time itself is not deterministic. `--wall-ms` can increase the replay's time allowance. A truncated prefix match is not proof that a timed-out match completed.

## Results and measured limits

Outputs are atomic `jobs/*.json`, `results.jsonl`, `results.csv`, `manifest.json` and `summary.json`. Summaries separate completed, timeout, decision-limit and error outcomes; unfinished games never count as losses. Completed wins, a Wilson interval and p50/p95 match times are included. Job telemetry includes process RSS and worker heap. RSS is shared across worker threads and must not be summed as independent worker memory.

The retained pre-optimization Gateway soak attempted 1,000 games: 999 completed, one hit the 120-second parent limit, and none threw an engine error. Match times were p50 3.543 seconds and p95 24.093 seconds with four workers on this Mac; maximum process RSS was about 717 MiB. The timed-out game retained 1,800 decisions; replay against its saved runtime matched that decision prefix and also reached the limit. See `eval/offline-engine/gateway-soak-1000-summary.json`, its manifest and timeout artifact. Original complete experiments and frozen runtimes remain under ignored `tmp/gateway-soak-1000/`.

A final native smoke panel completed one official-list game for each of the 14 new identities. This checks that each matchup can terminate; it does not establish card-by-card behavior. Evidence is `eval/offline-engine/core-identity-smoke.json`; executable experiment snapshots are under `tmp/core-identity-qualification-final2/`.

Default `fast` mode omits presentation snapshots between batches and avoids trigger scans only when no card or lingering effect has that callback. `--mode reference` retains full observations. Regression tests compare complete native decision transcripts for Gateway and Core, and difficult Gateway seeds were compared before enabling the scan guard.

The latest search optimization pass measured the same 100 Gateway games at four workers: **138.727 seconds before, 73.727 seconds after**, with all 83,830 decisions identical. A separate four-mode comparison measured caching alone, timer removal alone and both together. Fast mode now caches board lookups within individual synchronous search steps and omits UI-oriented timer yields; modifier values remain live. `reference` mode retains the original behavior. See [controlled measurements, cache boundaries and regression evidence](offline-engine-performance.md). The earlier 1,000-game soak has not been repeated on this revision. Use a new output directory for new experiments because the engine fingerprint changed; old experiment replays retain their frozen runtime.

The existing heuristic policies can access engine globals. Their hidden-information behavior and Elevation strategy have not been certified. Win rates describe those policies; they are not evidence of human deck balance. A 10,000-game study, fair-observation policies, richer card-usage instrumentation and full per-card release qualification remain subsequent gates.

## Retained deck studies

[Experiment 1](research/deck-experiment-1.md) screened nine Gateway matchups and compared two Runner package swaps over 1,050 games; neither swap demonstrated a reliable improvement. [Experiment 2](research/deck-experiment-2.md) ran another 2,760 games with independent confirmation and a focused two-slot comparison. Revised Jinteki gained 22.2 percentage points in Corp wins against the three Runner lists, primarily through flatlines; replacing its two Clearinghouses with Predictive Planograms cost 11.5 points. Both held-out contrasts excluded zero in their 97.5% seed-cluster bootstrap intervals. These are fixed-policy findings, not human balance estimates. Exact lists, seeds, outcomes and replay evidence accompany each report under `eval/deck-experiments/`.

## Development loop

```sh
NR_TEST_SEEDS=1 npm run check:dev
npm run coverage:elevation
npm run build:engine
```

`check:dev` runs engine, validation/import, Core mechanics, retained actual-Chrome replay, simulator/matrix and network-denied package tests. It does not launch headless Chrome. New browser playtests use the user's existing extension-backed Chrome and are recorded separately in `docs/playtesting/elevation/`.

## Versioned opponent pressure

New browser games opt into `pressure-v1`. Replays without an `aiPolicy` field keep the native opponent; restoring a game never silently changes its policy. Offline runs default to `native-v1` for continuity. Select either explicitly when comparing decks:

```sh
node scripts/netrunner.cjs bench --runner loup-v1 --corp precision-design-v2 --ai-policy pressure-v1 --games 100 --workers 4 --seed pressure-comparison --out results/pressure
```

Matrix JSON also accepts `aiPolicy`. Manifests, frozen jobs and replay retain it. Each job includes `aiAudit`: action counts, runs, scoring opportunities, override reasons, and the latest 80 action decisions with baseline choice and legal-option counts. These diagnostics belong to offline analysis and are not sent to the opponent's UI. `idleWithAgenda` counts basic gain/draw actions while holding an agenda; it does not by itself prove a better legal scoring opportunity existed.

The pressure policy preserves constructive native choices and replaces selected idle actions: affordable Runner probes calculated by the native path search, Corp agenda advancement, defended scoring routes, and affordable central reinforcement. It remains a heuristic opponent. The matched-seed implementation evidence is in [the pressure pass report](playtesting/critics/pressure-pass/report.md).

### Full bundled-deck screen

The [16 November all-deck audit](research/deck-audit-2026-11-16/report.md) retains construction checks, per-deck measurements, failure investigations, a controlled economy comparison, and three shared-browser game replays. `node scripts/audit-all-decks.cjs` validates every selectable list and writes within-pool matrix specs under `tmp/all-decks-2026-11-16/`; set `NR_DECK_AUDIT_RUNS` to choose another run root. Run each spec with `node scripts/netrunner.cjs bench <spec.json> --out <new-directory>`, then use `--summarize`. `node scripts/report-deck-audit.cjs` regenerates the dated report from its saved baseline/tuning artifacts and completed final matrices. Bot outcomes screen runtime and policy behavior; they do not certify human balance or enjoyment.

The [matchup pairing guide](research/matchup-guide-2026-11-16/guide.md) combines this audit with a 960-game follow-up: each recommended Vantage pairing has 54 games. It offers an overview matrix and per-Runner opponent charts, with separate preliminary labels for six-game Gateway, Elevation and test-pilot pairings. Regenerate with `node scripts/build-matchup-guide.cjs` after completing its saved follow-up matrix spec.
