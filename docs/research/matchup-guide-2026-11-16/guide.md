# Deck matchup guide · 16 November 2026

Use the exact deck names in the lobby. These are fixed-policy AI results, not a human matchup tier list. A different list for the same identity can change the result. The interactive chart includes all three local card pools; card-testing snapshots are excluded by default.

## First Vantage games after Gateway

- Familiar identities: Loup · Tailored economy [loup-vantage-tailor-v1] vs Restoring Humanity · Ambushes [jinteki-vantage-pilot-v1] — Runner 28/54 (51.9%). Loup introduces a small new-card package.
- Stealth practice: Tāo · Stealth foundation pilot [tao-vantage-pilot-v1] vs Precision Design · Tempo and recycling [hb-vantage-tempo-v1] — Runner 27/54 (50.0%). Both identities remain familiar while the Runner learns a new credit engine.
- First new Runner: Vic · central pressure [vic-play-v1] vs Built to Last · defensive economy [weyland-vantage-tools-v2] — Runner 26/54 (48.1%). Vic uses a complete, familiar breaker rig.

These are starting candidates that combine close observed results with a manageable learning goal. Swap sides when trying them with a friend.

## Expanded Vantage evidence

The four recommended Runner decks were tested against all five recommended Corp decks over 48 fresh seeds per pairing (960 additional games), combined with six prior audit games: **54 games per recommended Vantage pairing, 1,080 total**. All used the same engine fingerprint, exact deck documents and pressure-v1 policy. All additional games completed without errors or timeouts. No deck tuning used this follow-up sample.

### Tāo · Stealth foundation pilot

Closer results in the 40–60% window:

- Tāo · Stealth foundation pilot [tao-vantage-pilot-v1] vs Precision Design · Tempo and recycling [hb-vantage-tempo-v1] — Runner 27/54 (50.0%).

Harder for the Runner: Tāo · Stealth foundation pilot [tao-vantage-pilot-v1] vs Restoring Humanity · Ambushes [jinteki-vantage-pilot-v1] — Runner 17/54 (31.5%).

Harder for the Corp: Tāo · Stealth foundation pilot [tao-vantage-pilot-v1] vs Méliès U · campaign control [melies-play-v1] — Runner 36/54 (66.7%).

### Loup · Tailored economy

Closer results in the 40–60% window:

- Loup · Tailored economy [loup-vantage-tailor-v1] vs Méliès U · campaign control [melies-play-v1] — Runner 27/54 (50.0%).
- Loup · Tailored economy [loup-vantage-tailor-v1] vs Restoring Humanity · Ambushes [jinteki-vantage-pilot-v1] — Runner 28/54 (51.9%).

Harder for the Corp: Loup · Tailored economy [loup-vantage-tailor-v1] vs Editorial · funded defenses [editorial-play-v2] — Runner 42/54 (77.8%).

### Vic · central pressure

Closer results in the 40–60% window:

- Vic · central pressure [vic-play-v1] vs Built to Last · defensive economy [weyland-vantage-tools-v2] — Runner 26/54 (48.1%).
- Vic · central pressure [vic-play-v1] vs Precision Design · Tempo and recycling [hb-vantage-tempo-v1] — Runner 29/54 (53.7%).
- Vic · central pressure [vic-play-v1] vs Méliès U · campaign control [melies-play-v1] — Runner 30/54 (55.6%).

Harder for the Corp: Vic · central pressure [vic-play-v1] vs Editorial · funded defenses [editorial-play-v2] — Runner 39/54 (72.2%).

### Hiram · funded rig

Closer results in the 40–60% window:

- Hiram · funded rig [hiram-play-v1] vs Precision Design · Tempo and recycling [hb-vantage-tempo-v1] — Runner 25/54 (46.3%).
- Hiram · funded rig [hiram-play-v1] vs Editorial · funded defenses [editorial-play-v2] — Runner 30/54 (55.6%).
- Hiram · funded rig [hiram-play-v1] vs Built to Last · defensive economy [weyland-vantage-tools-v2] — Runner 22/54 (40.7%).

Harder for the Runner: Hiram · funded rig [hiram-play-v1] vs Restoring Humanity · Ambushes [jinteki-vantage-pilot-v1] — Runner 12/54 (22.2%).

Harder for the Corp: Hiram · funded rig [hiram-play-v1] vs Méliès U · campaign control [melies-play-v1] — Runner 33/54 (61.1%).

## Reading the chart

- Every percentage is **Runner wins / completed games**, so a low percentage favors the Corp.
- 40–60% is an observed close-result window chosen for browsing, not a statistical equivalence test. Even a 50% record does not prove a balanced human matchup.
- Gateway, Elevation, and Vantage card-testing pairings retain just six games each. They are clearly preliminary: one result changes the estimate by 16.7 percentage points. Avoid calling a 4–2 record a reliable counter.
- Use the Runner selector to find easier or harder opponents for a particular deck. Full deck names and IDs are retained in matchup-data.json and the chart key.
- When testing with a friend, play both sides and swap roles. Treat close pairings as starting candidates; local skill and AI habits can change the experience.
- For learning Vantage after Gateway, familiar identities reduce the amount to learn at once. Loup Tailor and funded Weyland remain a useful mechanics introduction, but that recommendation is separate from whether their win record is close.

## Coverage and reproduction

The guide covers 281 unique within-pool pairings and 2646 completed games across the three pools. Only the recommended Vantage pairings received the 48-game follow-up. The original 256-game deck-tuning experiment is not pooled into these estimates.

Run `node scripts/netrunner.cjs bench docs/research/matchup-guide-2026-11-16/vantage-followup-spec.json --out <fresh-directory>`, then set `NR_MATCHUP_GUIDE_RUN=<fresh-directory>` and run `node scripts/build-matchup-guide.cjs`. Existing results require the same engine fingerprint; use their frozen runtime to replay individual jobs. The source matrix and summary are retained beside this guide. Complete job traces and a frozen runtime live under ignored tmp/vantage-matchup-guide-2026-11-16/.

Engine: d8ca9a11d7e9724aa0636b608763aa8c7265d22404dbcb0467dd721496b10dbd. Policy: pressure-v1.
