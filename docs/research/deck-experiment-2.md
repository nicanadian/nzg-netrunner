# Deck experiment 2: do the revised Corp decks actually help?

2760 scheduled games; 2760 completed. Native Gateway AI, engine hash `c8c52ccc31737fc9422b50e395a7400e0be4a08b2dffddedda3e275d88c8925f`.

Primary independent result: **Restoring Humanity confirmed the screening direction**, with revised-minus-original Corp win rate +22.2 pp; 97.5% paired seed-cluster bootstrap interval +15.8 pp to +28.5 pp.

## Screening: four complete-list revisions

40 games per version against each of three Runner lists. Rates below pool equal numbers of games from each Runner. Four screen comparisons are exploratory; their uncertainty is not evidence of confirmation.

| Corp | Original wins / 120 | Revised wins / 120 | Corp win-rate change |
|---|---:|---:|---:|
| Precision Design | 53 | 53 | +0.0 pp |
| Restoring Humanity | 21 | 50 | +24.2 pp |
| Reality Plus | 36 | 50 | +11.7 pp |
| Built to Last | 51 | 43 | -6.7 pp |

Predeclared selection: largest absolute equal-weight change across Runners; ties follow fixed family order. Selected Restoring Humanity before any confirmation seeds were played.

## Confirmation on independent seeds

200 fresh seeds per version per Runner; 1,200 games total. No optional stopping or seed exclusions.

| Runner | Original Corp wins | Revised Corp wins | Corp win-rate change |
|---|---:|---:|---:|
| loup-v1 | 46/200 (23.0%) | 85/200 (42.5%) | +19.5 pp |
| zahya-v2 | 33/200 (16.5%) | 74/200 (37.0%) | +20.5 pp |
| tao-v1 | 42/200 (21.0%) | 95/200 (47.5%) | +26.5 pp |

The primary interval resamples 200 complete seed clusters, each containing all three paired Runner matchups (20,000 bootstrap replicates). Resampling entire clusters preserves correlation between matchups using the same seed. The interval is approximate, at 97.5% confidence. Only one family was selected for this confirmation; the other three have not been independently confirmed. The additional predeclared slot contrast is described below.

Worst-case all-scheduled effect bounds for missing outcomes: +22.2 pp to +22.2 pp. Shared seed labels do not force equal opening hands or subsequent random events after changing the list.

## The win condition changed

| Version | Corp wins / 600 | Flatline wins | Agenda wins |
|---|---:|---:|---:|
| Original v1 | 121 (20.2%) | 14 | 107 |
| Revised v2 | 254 (42.3%) | 144 | 110 |
| Planogram swap | 185 (30.8%) | 23 | 162 |

The revised list gained 133 Corp wins over the original across the 600 matched-seed games: 130 more flatline wins and only three more agenda wins. The Planogram alternative scores more agenda wins but loses enough damage wins to finish below the revised list. Win-reason counts are descriptive; the two planned overall-win contrasts carry the uncertainty estimates.

## Focused Clearinghouse slot comparison

Before reading any confirmation outcomes, the screen’s damage-win pattern motivated one additional predeclared contrast: replace both Clearinghouses in revised Jinteki with two Predictive Planograms. All other 42 cards, 44-card size, identity, ice and agendas stay fixed. Both lists are legal; influence changes from 9/15 to 5/15. This compares two specific slot packages, not Clearinghouse in isolation against an otherwise identical alternative.

Another 600 games reuse the same 200 held-out seed labels across all three Runner matchups, paired with the existing revised-list games. Corp win-rate change for the Planogram swap versus Clearinghouse: -11.5 pp; 97.5% seed-cluster bootstrap interval -16.7 pp to -6.3 pp.

| Runner | Revised with Clearinghouse | Planogram swap |
|---|---:|---:|
| loup-v1 | 85/200 (42.5%) | 61/200 (30.5%) |
| zahya-v2 | 74/200 (37.0%) | 57/200 (28.5%) |
| tao-v1 | 95/200 (47.5%) | 67/200 (33.5%) |

The primary revision contrast and this slot contrast each use a 97.5% interval: a Bonferroni family-wise 95% target for two planned held-out comparisons. Intervals are approximate. This second contrast was saved before the confirmation outcomes were inspected; see ablation-plan.json. The original primary protocol is retained unchanged.

## What changed

Original size 40; revised size 44. Original ice: 12, mean printed rez cost 2.58. Revised ice: 15, mean printed rez cost 2.40.

- +1 Spin Doctor
- +1 Send a Message
- -3 Superconducting Hub
- +1 Tithe
- +2 Whitespace
- +2 Clearinghouse

These changes form one package. The experiment cannot attribute the effect to a single card, identity ability, deck size or average rez cost.

## Native-action and game-length measurements

| Runner / Corp version | Median round reached | Corp basic credit actions / Corp turn | Runner basic credit actions / Runner turn | Flatlines |
|---|---:|---:|---:|---:|
| loup-v1 / restoring-humanity-v1 | 15 | 0.537 | 0.646 | 6 |
| loup-v1 / restoring-humanity-v2 | 14 | 0.537 | 0.646 | 49 |
| zahya-v2 / restoring-humanity-v1 | 13 | 0.574 | 0.240 | 4 |
| zahya-v2 / restoring-humanity-v2 | 12 | 0.577 | 0.261 | 46 |
| tao-v1 / restoring-humanity-v1 | 14 | 0.587 | 0.360 | 4 |
| tao-v1 / restoring-humanity-v2 | 14 | 0.566 | 0.435 | 49 |
| loup-v1 / restoring-humanity-v2 / Planogram instead of Clearinghouse | 14 | 0.430 | 0.628 | 5 |
| zahya-v2 / restoring-humanity-v2 / Planogram instead of Clearinghouse | 13.5 | 0.497 | 0.265 | 9 |
| tao-v1 / restoring-humanity-v2 / Planogram instead of Clearinghouse | 14 | 0.476 | 0.418 | 9 |

These are descriptive secondary metrics. A basic credit action is the ordinary click for one credit, excluding card income. Final partial turns are included. Median round reached includes the last partial round. These metrics alone do not explain a win-rate effect.

## Replay inspection

54 diagnostic games: the first six held-out seeds in all nine cells, without choosing winners or interesting outcomes. Every complete native decision trace hash and terminal outcome matched the original run under read-only observers.

| Runner / Corp version | Agenda scores | Agenda steals | Unrezzed passes | Unaffordable passes |
|---|---:|---:|---:|---:|
| loup-v1 / restoring-humanity-v1 | 16 | 20 | 3 | 1 |
| loup-v1 / restoring-humanity-v2 | 7 | 18 | 1 | 0 |
| zahya-v2 / restoring-humanity-v1 | 12 | 22 | 7 | 6 |
| zahya-v2 / restoring-humanity-v2 | 5 | 19 | 2 | 1 |
| tao-v1 / restoring-humanity-v1 | 12 | 21 | 0 | 0 |
| tao-v1 / restoring-humanity-v2 | 13 | 19 | 2 | 0 |
| loup-v1 / restoring-humanity-v2 / Planogram instead of Clearinghouse | 10 | 20 | 7 | 7 |
| zahya-v2 / restoring-humanity-v2 / Planogram instead of Clearinghouse | 14 | 17 | 3 | 3 |
| tao-v1 / restoring-humanity-v2 / Planogram instead of Clearinghouse | 13 | 19 | 1 | 0 |

Counts in the replay table are aggregate events over six games, not win rates. Unaffordable means available rez credits were below the current rez cost when an approached piece of ice passed unrezzed; this observational measure does not show every reason for passing. Affordable passes can be intentional. The sample is diagnostic, too small to support causal or population claims.

3 Clearinghouse activations in the fixed held-out sample were checked against the actual pre-choice advancement counters, damage calls and turn timing. All matched: 9 counters → 9 meat damage into 5 cards; 3 counters → 3 meat damage into 2 cards; 6 counters → 6 meat damage into 5 cards. All fired at the beginning of a Corp turn and flatlined the Runner. This verifies those recorded activations, not every possible Clearinghouse interaction. See damage-verification.json.

The Runner AI explicitly recognises a known Clearinghouse as dangerous. Its unknown-remote heuristic gives a lower target value above three advancement counters than at one to three. This may affect the result but is an untested policy explanation; the study does not show that a human Runner would react the same way.

## Reproduce and inspect

Exact legal lists, card deltas and fixed selection/confirmation rules are in `eval/deck-experiments/experiment-2/`. `game-results.json` contains every seed, outcome, final points, turn, decision count, elapsed time and trace hash, together with cell manifests. Full decision traces, frozen runtimes and full diagnostic logs are retained locally in ignored `tmp/deck-experiment-2/`.

```sh
node scripts/netrunner.cjs bench eval/deck-experiments/experiment-2/screen.json --out tmp/deck-experiment-2/screen
node scripts/netrunner.cjs bench eval/deck-experiments/experiment-2/confirmation.json --out tmp/deck-experiment-2/confirmation
node scripts/experiments/corp-revisions.cjs confirmation
node scripts/netrunner.cjs bench eval/deck-experiments/experiment-2/ablation.json --out tmp/deck-experiment-2/ablation
node scripts/experiments/revision-ablation.cjs
node scripts/experiments/revision-audit.cjs tmp/deck-experiment-2/confirmation 6
node scripts/experiments/revision-audit.cjs tmp/deck-experiment-2/ablation 6
node scripts/experiments/corp-revision-report.cjs
node tests/corp-revision-analysis.cjs
```

Existing completed jobs are resumed, not silently rerun. After source changes, use the saved frozen runtime CLI with absolute paths, or a new output directory for a different engine. These findings describe the exact lists and current native AI. Hidden-information behavior and strategic quality are not certified. This study does not certify Elevation rules or predict human win rates.
