# Deck experiment 1: matchups and two-card package changes

Completed on 2026-11-14T04:32:31.649Z. All 1,050 scheduled games completed, with no engine errors, timeouts or decision-limit stops. This is an exploratory experiment using fixed native AI policies and Gateway cards.

## Matchup screen

50 games per cell. Values are Runner wins; the exact complete deck lists, rather than identities alone, are being compared.

| Runner | Precision Design | Restoring Humanity | Built to Last |
|---|---:|---:|---:|
| René “Loup” Arcemont | 21/50 (42.0%) | 34/50 (68.0%) | 29/50 (58.0%) |
| Zahya Sadeghi | 22/50 (44.0%) | 31/50 (62.0%) | 29/50 (58.0%) |
| Tāo Salonga | 24/50 (48.0%) | 31/50 (62.0%) | 33/50 (66.0%) |

Precision Design produced the lowest observed Runner win rate for each of the three lists. Each cell has a wide confidence interval (roughly ±13 percentage points); this screen does not establish an overall ranking. Tāo–Precision Design was selected by the predeclared closest-to-50% rule (24–26), not by inspecting follow-up results.

## Held-out package comparison

200 games per version against the same Precision Design deck, with a new seed prefix. All lists are legal 40-card decks. Original: 3 Telework Contracts. Each alternative removes two Telework Contracts, leaving one, and inserts two cards: Wildcat Strike (burst income) or Mayfly (an AI icebreaker). Other 38 cards are unchanged. Influence: original 12/15, Wildcat 14/15, Mayfly 12/15.

| Tāo version | Runner wins | Wilson 95% interval | Median round reached | Basic +1-credit actions / reached Runner turn |
|---|---:|---:|---:|---:|
| Stored income (original) | 89/200 (44.5%) | 37.8% to 51.4% | 12 | 0.307 |
| Burst income | 94/200 (47.0%) | 40.2% to 53.9% | 13 | 0.441 |
| Two Mayflies | 86/200 (43.0%) | 36.3% to 49.9% | 13 | 0.508 |

| Paired change vs original | Win-rate difference | Paired bootstrap 97.5% interval | Alt-only / original-only wins | Holm-adjusted exact McNemar p |
|---|---:|---:|---:|---:|
| Burst income | +2.5 pp | -8.0 pp to +12.5 pp | 45 / 40 | 1.0000 |
| Two Mayflies | -1.5 pp | -12.0 pp to +8.5 pp | 40 / 43 | 1.0000 |

Neither alternative shows a reliable win-rate improvement: both paired intervals span zero and both Holm-adjusted p-values equal 1. This does not establish equivalence; the intervals still allow meaningful benefits or harms. Keep the original list as the reference while testing the alternatives against more opponents or with human players.

These intervals resample the 200 seed pairs (10,000 replicates); the 97.5% level accounts for two planned comparisons with a Bonferroni 95% family-wise target. Bootstrap coverage is approximate. Exact McNemar tests use discordant pairs and Holm correction. There are no missing outcomes, so worst-case missing-outcome bounds equal the observed estimates. Shared seeds synchronize seed labels, not opening hands or subsequent random events after changing deck contents.

Basic credit actions rose from 0.307 per reached Runner turn in the original to 0.441 with Wildcat Strike and 0.508 with Mayfly (observed increases of 43% and 65%). Median round reached rose from 12 to 13 in both alternatives. These are descriptive secondary metrics, without formal significance claims.

Basic credit actions count only the ordinary click-for-1-credit command, not card-generated income or all click spending. Their per-turn denominator includes every reached Runner turn, including the final partial turn. A change in this metric does not by itself demonstrate credit starvation or explain a win-rate change. Median round reached is ceil(native player-turn count / 2), including a partial final round.

## Reproduction and evidence

Engine SHA-256: `c8c52ccc31737fc9422b50e395a7400e0be4a08b2dffddedda3e275d88c8925f`. Policy: `chiriboga-native-unaudited-v1`. This policy’s hidden-information behavior and strategic quality have not been certified; findings describe these AI policies and specific lists, and need human validation before guiding balance changes. Gateway was chosen for its more mature implementation coverage; this experiment does not certify Elevation.

Four workers, fast mode, 120-second limit per game, 100,000 native decisions per game; every decision trace retained. Panel seeds: `deck-panel-1:0…49` in each cell. Follow-up seeds: `deck-economy-holdout-1:0…199` for each version. Exact documents, legality validations, limits and selection rule were saved before the runs in `design.json`. `selection.json` records the choice before follow-up execution.

```sh
node scripts/netrunner.cjs bench eval/deck-experiments/experiment-1/panel.json --out tmp/deck-experiment-1/panel
node scripts/netrunner.cjs bench eval/deck-experiments/experiment-1/economy.json --out tmp/deck-experiment-1/economy
node scripts/experiments/deck-study.cjs analyze eval/deck-experiments/experiment-1 tmp/deck-experiment-1/economy
node scripts/experiments/deck-study-audit.cjs
node tests/deck-study-analysis.cjs
node scripts/experiments/deck-study-report.cjs
```

The first two commands resume existing outputs without rerunning completed jobs. Frozen engine runtimes, per-game JSON, full traces, CSV exports, manifests and sample replay logs are retained locally under ignored `tmp/deck-experiment-1/`. For a future rerun after engine changes, invoke the frozen `runtime/scripts/netrunner.cjs` entrypoint with absolute spec/output paths, or use a new output directory for the changed engine. Summary evidence and exact deck definitions live in `eval/deck-experiments/experiment-1/`.

A fixed diagnostic sample replays held-out seed indices 0–5 for all three versions, forwarding native log calls and retaining the log. All 18 must match their original entire decision trace hash and terminal outcome. These logs show usage examples, not statistically representative estimates of card value.

All 18 diagnostic replays matched. In this small sample Wildcat Strike was played in four of six burst-version games (five plays total). Mayfly was installed in two of six Mayfly-version games and used in one; it was discarded in three others. This suggests checking AI card selection and timing before treating a package result as a verdict on the cards. The sample is too small to estimate usage rates or explain the overall win-rate differences.

`game-results.json` preserves every seed, outcome, final points, turn count, decision count, elapsed time and SHA-256 decision-trace digest alongside each manifest. `sample-replays.json` preserves package log excerpts and matching trace hashes; full logs remain with the local raw outputs.
