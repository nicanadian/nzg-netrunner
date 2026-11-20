# Vantage Point implementation and testing

Status: all 66 cards implemented with native test evidence; nine complete shared-browser games; 1,200/1,200 benchmark games completed. Included in the 0.3.0 alpha release following separate release qualification and explicit publication authorization.

## Product scope

Add all 66 Vantage Point cards, including four identities, alongside System Gateway and Elevation. Keep Gateway and Core Sets available as independent choices. Adding this card pool does not by itself implement the Startup tournament balance list. Label the initial pool **Gateway + Elevation + Vantage Point · preview**, not certified Startup.

Use the same rules implementation for browser workers and the offline runtime. Retain previous rules profiles and save keys. Never load Vantage patches into an existing Gateway or Elevation game. New Vantage games use `vantage-preview-v1` and `26.03-vantage-3`. Revisions 1 and 2 remain supported for existing preview saves. Revision 2 automatically resolves unaffordable ice payments instead of asking the Runner to confirm a single losing option.

The pinned official metadata and its provenance are in `../research/vantage-point/`. The card-by-card test inventory is `vantage-card-tests.json`. Metadata, definitions, rules evidence, UI evidence, and AI competence are separate statuses. Unsupported cards must fail validation rather than resolve as blank cards.

## Development loop

1. Inventory every printed ability against official card text and rulings. Record dependencies and positive, negative, boundary, replay, privacy, and AI cases. Review current card text updates before release.
2. Build an isolated runtime and validator. Reuse the existing separate bad-publicity fund, verifying it against the 2026 rules. Add explicit restrictions for stealth-only payments; pool credits, bad-publicity credits, and non-stealth hosted credits must not pay those costs.
3. Implement the first batch: Corsair, Borrowed Goods, Touchstone, Stowaway, Reverb, Paywall, and Vulture Fund. Exercise real installs, payments, encounters, subroutines, and run timing through the public decision API. Small hand-authored setups are allowed; invoking the ability callback alone is not sufficient evidence.
4. Expand in dependency order: ordinary economy/ice and tags; stealth and hosted cards; action/turn/run history; ordered searches and Archives reveals; agenda/score-area changes; remote and central access restrictions; cross-player abilities and the private multi-face Méliès U identity. Audit overlapping Elevation primitives as each is reused.
5. Import card art with source hashes and normal display sizes. Provide a few exact, validated sample decks for each playable identity. Add the preview card-set option only after those decks can start and finish games. Keep unavailable cards visible as unsupported in an audit view, never selectable as playable cards.
6. Test in the user's existing Chrome connection: both sides, deck selection and tuning, full-card inspection, restricted payments, rez/pass windows, tags, counters, turn-start effects, and mobile width/keyboard focus. Full games must include each new identity and important cross-set interactions. No headless browser, Docker, or Jinteki startup is required.
7. Run seeded native regressions and replay round trips, then deck benchmarks. Report failures, timeouts, decisions, run time, and policy limitations. A high game completion rate is not proof of card correctness or a reliable competitive deck ranking.

## Completed implementation checkpoint

- **66/66 native definitions and executable rules evidence**, including all four new identities. `vantage-card-tests.json` links each card to its native fixtures. The report deliberately retains partial audit labels: full combinatorial rules, visual/UI and strategic AI certification are separate from implementing every printed ability.
- Printed values for all cards are checked against the pinned official metadata. Coverage includes sides, factions, influence, subtypes, costs, memory, strength, agenda points and advancement requirements.
- New support includes global turn/run history, restricted stealth payments, Aircheck’s credit-pool lock and chained run, mandatory/optional effect ordering, hosted-card privacy and cleanup, private stack/R&D searches and ordering, additional play/steal/score costs, un-forfeitable negative agendas, Méliès U’s three secret copies and public backs, persistent access limits, and Shackleton’s payment interrupt.
- All 66 fronts and three alternate identity faces are bundled at native source quality with 300/600/743-pixel display sizes. Source image objects and checksums are in `assets/vantage-sources.json`.
- **22 legal local decks** are selectable/tunable: nine recommended play decks and thirteen interaction test pilots. The seven full-set lists collectively include every Vantage card and all four new identities; their exact documents are embedded in saved games. The full-set lists remain interaction fixtures; recommended play lists add basic breaker coverage and support checks, without competitive certification.
- Nine full shared-browser games are retained under `docs/playtesting/vantage/`: the five earlier smoke games plus full-set Hiram, Méliès U, Editorial Division and Weyland games. Both human sides and all four Vantage identities appear across these matchups. `tests/vantage-ui-replays.cjs` reconstructs every captured native decision, terminal, score and version. Mobile width, loaded card artwork, the Corp-only selected-copy text, and restoring a complete game through the paste-replay dialog were checked.
- The existing Chrome extension reported “The browser access host is unavailable”; shared-browser snapshots timed out. The authorized shared browser worked through observed DOM controls. No headless Chrome, Docker or Jinteki was started. These are functional/geometry playtests, not a finished screenshot, keyboard or accessibility review in the user’s Chrome.
- **1,200/1,200 completed** in the final 12-matchup, four-worker matrix. The source hash, timing distribution, terminal reasons and matchup totals are in `../research/vantage-point/benchmark-validation.json`; `benchmark-matrix.json` reproduces the experiment. Failures from earlier loops were retained and reproduced before fixing AI legal-choice bridges and rez-usability filtering. The 60-second parent limit accommodates the longest deterministic search; no decision limit or timeouts remained in the final run.
- Optimized/reference traces are compared for all four Corp matchups. The new comparison normalizes objects from separate engine sandboxes before comparing their complete serialized decisions; object prototypes are not game state.
- All older Gateway/Core regressions and existing Vantage revision 1/2 browser captures remain checked. Revision 3 adds the complete card set and hosted-card cleanup; source profiles stay isolated.

## Remaining qualification work

No Vantage card definitions remain missing. Further work is full rules/cross-card auditing, visual/keyboard/accessibility qualification in the user’s Chrome, strategic and hidden-information AI audits, and continued release qualification. The 0.3.0 release includes Vantage as an experimental preview; previous 0.2.1 downloads remain available. An unqualified Startup label also requires its separate tournament restriction validator.

## Release gates

- All 66 cards have specifications and applicable executable evidence; every unsupported ability blocks the affected deck.
- Gateway/Core fixtures retain their old results; old saves restore using their original profile.
- Bad-publicity funds refill per run and empty before run-end effects. Changes to bad publicity mid-run do not refill that run's fund. Credit losses and credit-pool thresholds exclude the fund.
- Stealth-only costs accept exclusively credits from eligible stealth cards, including split payments; failed or cancelled actions do not spend other funds.
- Private deck looks, hidden identities, and facedown hosted cards do not leak to the opponent or player-facing replays.
- Every new identity and curated deck has actual Chrome playthrough evidence. UI, rules, and AI coverage are reported independently.
- Startup tournament restrictions are a separate, versioned validator feature, with dated source attribution, before using an unqualified Startup label.
- 0.3.0 packaging and publication were handled by a separate, explicitly authorized release task; exact checks and limitations are recorded in builds/0.3.0/.

## Sources

- [NSG Vantage Point](https://nullsignal.games/products/vantage-point/)
- [NSG supported formats](https://nullsignal.games/players/supported-formats/)
- [2026 bad-publicity rules explanation](https://nullsignal.games/blog/the-return-of-bad-publicity-in-vantage-point/)
- [Comprehensive Rules](https://rules.nullsignal.games/)
- [Official card metadata](https://github.com/Null-Signal-Games/netrunner-cards-json)
