# Live frontend regression after reference-game iteration

Independent AI tester, 2026-11-05. Chrome extension controls only, in a new isolated `localhost:5176` tab. No native desktop input, T3, engine-state injection, or viewport changes. The created tab was closed afterward.

Completed **15 real player decisions / 113 engine actions** in a fresh Runner game. This is a short regression session, not a completed match. Export: `tests/fixtures/live-revision-runner-replay.json`, seed `58e93e91-159d-43b1-8659-00c459405783`.

- Pinned Jailbreak from the opening hand; its card image, normal-size rules text, cost, and artist credit were clearly readable. Closing the preview did not commit a game action.
- Played Sure Gamble, installed Smartware Distributor, and used its ability. The installed resource retained a readable hosted-credit counter.
- Played Jailbreak into R&D. Corp rezzed Tithe; its unbroken subroutines dealt net damage (trashing T400 Memory Diamond) and gained the Corp one credit. With no usable defensive ability, these steps resolved before the next movement decision.
- Continued the run, resolved Jailbreak, accessed two concealed candidates individually, and stole Offworld Office for two points. Card names appeared only after each access.
- Installed Leech, played the second Sure Gamble, and drew Carnivore. Final visible state: Runner turn 2, 13 credits, one click, two agenda points, Leech installed, Smartware Distributor holding two credits.
- No visible freeze, error, inaccessible required choice, or broken card layout occurred. Browser warning/error log was empty. The downloaded replay passes `checkState` and `checkSnapshot` through the full 15-decision trace with no engine diagnostics.

Screenshots: [readable card preview](../screenshots/live-revision-card-preview.jpg), [live board after actions](../screenshots/live-revision-gameplay.jpg).

No new blocking issue was found in this short session. Matching-breaker interaction, a terminal outcome, hover behavior, and responsive widths were outside this pass's scope; other reference/playtest checks cover those separately.
