# Offline search optimizations

Development check: 2026-11-13. Both changes are enabled automatically by the engine CLI's default `fast` mode. They require the Node simulation runtime, AI faceoff and `simulationFast`; the browser worker does not load this module. The rules and native AI search budget are unchanged.

## Measured results

On this Apple M4 Mac, Node 25.2.1, a matched 100-game Gateway batch with four persistent workers took **138.727 seconds before and 73.727 seconds after**: **1.88× throughput**, or 46.9% less elapsed time. Both batches completed all 100 games. All **83,830 native choices**, outcomes, turn counts and points matched exactly.

The optimized batch ran first and the frozen baseline ran second. These are one batch per mode, including startup, result writes and trace verification; they are not confidence bounds across machines. Both used the same seed schedule, exact decks, 120-second per-game parent limit, 100,000-decision cap and full trace retention. Full results: `eval/offline-engine/search-optimization-batch-100.json`.

A separate ablation used six fixed cases (three Gateway seeds plus official Phoenix, Topan and Synapse Core matchups), two rounds each, one fresh worker per game and rotated execution order. All four modes reproduced the same complete decisions. The figures below sum the 12 match durations per mode, excluding parent worker startup and report-writing time:

| Mode | Total match time | Reduction from baseline |
| --- | ---: | ---: |
| Frozen baseline | 89.310 s | — |
| Board-query cache only | 60.505 s | 32.3% |
| Timer pauses removed only | 76.288 s | 14.6% |
| Both | 47.089 s | 47.3% |

This is a focused corpus with a deliberately slow Gateway case, not a representative 1,000-game estimate. The slow case averaged 32.29 seconds before and 16.74 seconds with both changes. The prior 1,000-game/29-minute soak remains historical evidence from the earlier engine; a new 1,000-game soak has not been run for this revision.

Data and chart: `eval/offline-engine/search-optimization-ablation.json` and `eval/offline-engine/search-speed.html`. Executable baseline and optimized snapshots remain under ignored `tmp/search-optimization-review/`. The reports retain both engine hashes. Old experiments still replay using their own frozen source bundles.

## Implementation and boundaries

`engine/simulation/search-optimizations.js` is loaded by `engine/runtime.cjs`, after the actual rules and adapter. It is absent from the browser's import list.

The cache is opened around **one synchronous `RunCalculator.CalculatePieceMiddle` call**, then discarded in `finally`. It caches card lookup arrays and installation checks; returned card arrays are copied so callers can sort or modify them. Installation checks include the live owner, location, host and hosted-uninstalled flag in their cache keys. Native movement, phase, instance, rez and lingering-effect mechanisms invalidate the frame before and after running. Nested calculations clear their caller's frame on return.

Active-trigger eligibility, callback existence, counters, strength and modifier resolutions remain live. No cached board state survives to another search step, decision, turn or game. This avoids freezing the hypothetical values used by AI search or the state changes from actual play.

Continuous search routes `CalculateAsync` to the existing synchronous `Calculate` implementation only in fast Node faceoffs. Both implementations use the same begin/middle/end methods, iteration limits and fallback search. This omits the browser-oriented `setTimeout` pause every ten iterations. The worker can compute continuously while its parent still enforces the hard wall limit and can terminate it. The `reference` mode retains the original asynchronous path and disables both optimizations.

`createGame({searchOptimizations:false})` or `{searchOptimizations:{cache:true,continuous:false}}` is an internal ablation control; regular CLI experiments use the version pinned in their source snapshot. Mode flags and cache-hit statistics are retained in simulation job results as `searchStats`.

## Verification

Passed:

- `NR_TEST_SEEDS=1 npm run check:dev`, including Gateway/Core regressions, retained actual-Chrome replays, matrix/resume/time limits and the network-denied standalone package check.
- `npm run test:search`: adversarial lifetime/array/mutation checks plus **17 complete games and 16,884 choices** hashed against the exact pre-change runtime. This includes all 14 new Elevation identities and three Gateway seeds.
- The additional matched 100-game batch: **83,830 complete choices** agree with both its frozen pre-change rerun and the earlier retained 100-game pilot. This corpus overlaps the three Gateway golden seeds; counts are not added as independent games.
- `git diff --check`.

The fixtures specifically check exception/nested-frame cleanup, changes to location and hosted-uninstalled status, live rez flags, adding/deleting callbacks, changing modifier counters, and adding/removing lingering effects. A cache hit is not allowed to replace a current modifier calculation.

For a future controlled comparison, capture the old source with `freezeRuntime` before editing, then run:

```sh
node scripts/benchmark-search.cjs /absolute/path/to/old/runtime tmp/new-search-comparison 2
```

The script freezes the current runtime too, rotates mode order, requires complete transcript/outcome parity and refuses to overwrite an existing report. It does not update golden test fixtures automatically.
