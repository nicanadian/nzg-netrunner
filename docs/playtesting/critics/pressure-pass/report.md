# Opponent pressure and decision flow

The unreleased development build clears stale encounter outcomes, adds a versioned opponent policy, approves ordinary breaker funding once, and gives the current decision more space. Existing saved games keep their original opponent policy. No release was published.

## Changes

Ice outcomes reset at the start of a run and when a new approach begins. The recorded Lethe position at version 629 now says “Passed inactive ice · no subroutines resolved” and has no fired flags from its earlier encounter. The change affects presentation, not encounter timing or legal choices.

New games use `pressure-v1`. The Runner may replace an idle action with an affordable central probe or an attempt against an advanced remote, using the native complete-run calculator and rejecting predicted damage, tags and serious effects. The Corp may replace an idle action with agenda advancement, a defended scoring route, a search for scoring support, or affordable central reinforcement. Constructive native actions stay intact. Missing `aiPolicy` selects `native-v1`; both policies are accepted in saves, offline jobs, matrix specifications and deterministic replay.

“Break all” shows its funding quote before approval. Bad-publicity and Overclock credits are allocated first, followed by the credit pool. Each debit, boost and subroutine selection still goes through a currently offered native choice and appears in the replay. Persistent hosted and stealth credits require manual allocation. A changed cost, ice, source, additional cost or Corp response pauses the plan. A known Shackleton Grid response requires manual payment. “Choose sources yourself” retains the original payment controls.

Routine ability costs, completed-action explanations, payment explanations and plan limits use disclosures. The primary action and funding quote stay visible. Busy text says the last action is resolving, including when the player's own effect is being processed.

## Verification

`npm run check:dev` passed, including native rules, retained browser replays, deck/lobby flow, Vantage, Elevation, simulation parity and the offline package under denied network access. Focused presentation, frontend, deck and pressure regressions passed after the final UI edits.

The new pressure tests reproduce the actual stale Lethe replay, exercise the six-credit native boost/break loop, preserve pool credits when expiring funds suffice, stop on source/ice/cost changes, keep stealth credits manual, recognize Shackleton Grid, cover a new-remote installation quote, and preserve the legacy policy. The reference dataset changed only by adding funding data and clearing three obsolete fired flags. The six recorded full-game artifacts retain their decision traces; two terminal Tithe fired flags were corrected.

Two new shared-browser games ended naturally and reconstructed exactly from their saved choices:

| Player side | Matchup | Native human choices | Ending |
| --- | --- | ---: | --- |
| Runner | Vic against Editorial | 309 | Corp 8–6, round 23 |
| Corp | Precision Design against Loup | 91 | Runner 7–1, round 23 |

The Runner opponent made 24 runs in the Corp game. These were functional playthroughs using a scripted UI player with occasional strategy adjustments, not independent critic ratings. Actions used rendered DOM buttons and public game state; no headless game browser, engine injection or worker-message control was used.

The recorded six-credit Carmen break needed one “Break all” click, spending one bad-publicity credit and five Overclock credits while keeping all three pool credits. This passed at desktop width and at 390×844. Manual payment instead spent two pool credits and preserved the expiring sources. Buttons stayed within the mobile viewport and the page had no horizontal overflow. Shared-browser screenshots timed out, so these layout checks use rendered DOM geometry rather than a new screenshot review.

## Matched benchmarks

The comparison uses eight deck pairings and eight identical seeds per pairing: 64 matched pairs, 128 completed games, no errors or timeouts. Gateway uses Loup/Zahya against Precision Design/Built to Last; Vantage uses Vic/Hiram against Editorial/Méliès U. All four matrices use engine fingerprint `f13f5fe6482206473d79bda8ebfb3dbcf9228b369de9136ad452fb8599248ba9` and seed prefix `pressure-paired-2026-11-16`.

| Measure | Gateway native | Gateway updated | Vantage native | Vantage updated |
| --- | ---: | ---: | ---: | ---: |
| Corp action-phase decisions taking one basic credit | 13.6% | 7.7% | 42.6% | 39.9% |
| Runner runs per Runner turn reached | 0.85 | 0.93 | 0.90 | 0.98 |
| Mean round reached | 13.28 | 13.44 | 19.75 | 17.13 |
| Corp wins out of 32 | 15 | 11 | 12 | 12 |

These measurements support a modest reduction in idle play. They do not establish stronger overall AI, human balance, or a higher review score. Vantage still spends many Corp clicks on basic credits. The updated policy chose 65 extra affordable probes in these games and still rejected most candidate probes. Eight additional Phoenix/Precision Design Elevation profile games completed without errors.

[Benchmark aggregates](benchmarks.json), [browser replay verification](replay-validation.json), [targeted UI evidence](targeted-ui-evidence.json), and [mobile/manual interactions](browser-interactions.json) retain the results. The four matrix files beside this report retain exact deck lists and seeds. Frozen executable runs and per-job traces remain locally under `tmp/pressure-final-*`.
