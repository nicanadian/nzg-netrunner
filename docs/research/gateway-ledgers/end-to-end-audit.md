# End-to-end recorded-game rules audit

Completed 6 November 2026 against **NSG Comprehensive Rules v26.03**, effective 2 March 2026, and current NetrunnerDB card data. **All three reconstructed games now run from opening hands to a terminal result, then replay independently.** This replaces the earlier status where only three injected encounter positions had been exercised.

The verification covers these games and the additional rule probes described below. It is not an exhaustive certification of every System Gateway card combination or every current Netrunner rule.

## Results

| Recording | Side-turn checkpoints | Legal decisions | Engine ending | Qualification |
|---|---:|---:|---|---|
| Neon Static starter | 26 | 273 | Runner wins, Corp 3–Runner 7 | One synthetic action fills an unrecorded click; six-point teaching target explicitly selected. |
| Legendary Tactics starter | 12 | 117 | Corp flatline, points 2–5 | Fifth Red Team payout removed; Sure Gamble/Mayfly order corrected. Final Runner pool is 2, rather than the source's 5. |
| Legendary Tactics booster | 33 | 306 | Corp wins 8–1 | Inner Diviner rez delayed to its legal approach window; undo operations collapsed into the final accepted install. |
| **Total** | **71** | **696** | **Same winners, scores and win methods** | Explicit corrections and hidden-state completions; not original unique shuffles. |

The two Jinteki recordings supply 45 observed pool-credit checkpoints and 43 observed hand-size checkpoints. **41 credit checkpoints match without adjustment**; four late Runner checkpoints in the starter match are exactly three lower after removing its impossible payout. All 43 observed hand-size checkpoints match. Neon Static's pool checkpoints match the annotated action arithmetic; its turn-end balances were not independently logged by the source.

The structured replays include every chosen input, chosen deck order, random-number tape, checkpoint and normalization:

- [Neon full replay](../../../eval/recorded-games/neon-starter-full-replay.json)
- [Starter full replay](../../../eval/recorded-games/lt-starter-full-replay.json)
- [Booster full replay](../../../eval/recorded-games/lt-booster-full-replay.json)
- [Targeted rule-probe results](../../../eval/recorded-games/rules-audit-validation.json)
- [Twelve current-profile faction matchup smoke games](../../../eval/recorded-games/current-rule-matchups.json)
- [Machine-readable audit summary](../../../eval/recorded-games/full-game-audit.json)

## How the verification works

[The completion planner](../../../scripts/complete-recorded-decks.cjs) assigns card draws consistently with required plays, accesses, discards, deck quantities and observed hand sizes. Unspecified R&D accesses are constrained to non-agendas where the source leaves a card. Corp-view frames additionally constrain the Legendary Tactics starter opening and establish its inner HQ ice as Brân 1.0. Unknown ice and unaccessed cards receive explicitly documented choices; no claim is made that these recover the actual original shuffle.

[The full-game driver](../../../scripts/run-recorded-full-games.cjs) boots those complete decks normally, keeps both hands and performs every move through the same legal choice API used by the browser worker. It never moves cards, assigns resources, edits clicks, changes phases or overwrites results mid-game. Separate targeted probes intentionally use injected setups; those are labelled separately and are not counted as full-game evidence.

HQ selection and damage are random in the rules. During construction, a test controller supplies valid random values that produce the observed outcomes, recording **every** random value. A fresh engine then replays the entire decision trace using only that tape and the native shuffle implementation, without the controller or the completion planner. Every decision must be offered, every recorded side-turn checkpoint must match, and the final snapshot must match exactly. This demonstrates one feasible legal hidden-state completion, not a recovered historical seed or an estimate of how likely the players' draws were.

## Engine/rule differences found and disposition

Four engine differences were corrected in the **`26.03-local-1` rules profile**. The pinned upstream files were left unchanged; corrections live in [the adapter](../../../engine/adapter.js).

| Difference | Evidence and written rule | Disposition in Local Table |
|---|---|---|
| **HQ multi-access forgot an earlier accessed card too soon.** During the second access, the first HQ card became concealed again. | Reproduced on the actual full starter prefix and on all five booster HQ multi-accesses. [CR 7.3.1a](https://rules.nullsignal.games/?r=rule_visibility_after_access) retains visibility through that breach. | **Fixed.** Track visibility for that breach and zone; clear it at breach end or a zone change. Unseen HQ cards stay concealed. The helper can use those visible HQ cards without receiving unseen HQ identities. |
| **Seamless Launch offered too few targets.** It reused the basic advancement eligibility check and considered only Corp cards. | [CR 1.18.2](https://rules.nullsignal.games/?r=rule_placing_advancement_counter) distinguishes placing counters from advancing; [current card text](https://netrunnerdb.com/en/card/30040) permits an installed card not installed by the Corp that turn. | **Fixed for human choices.** Old non-advanceable ice and installed Runner cards are eligible; newly installed Corp cards are excluded. Basic advancement still requires an advanceable card. The bot may retain its narrower strategic preferences. |
| **The run skipped the initial paid-ability window.** It jumped directly to the outer ice's approach. | [CR 6.9.1e](https://rules.nullsignal.games/?r=step_initiation_paw) provides a window before approaching ice. | **Fixed.** Add a standard paid-ability/non-ice-rez window. Ice rez remains restricted to the appropriate approach window. All three full games still pass. |
| **Bad-publicity credits affected pool checks and losses, and expired too late.** | An additional Whitespace probe starts with pool 9 and fund 5. Legacy behavior loses from the fund and avoids ending the run. [CR 10.6.2–3](https://rules.nullsignal.games/?r=rule_bad_publicity_fund) separates that fund from the pool and sets its expiry timing. | **Fixed.** Whitespace reduces pool to 6, preserves the fund until run end, then ends the run. Fund credits remain usable for eligible payments and expire before run-end abilities. This edge case is additional coverage: all three recordings have zero bad publicity. |

These fixes address behavior, permissions and timing. They do not merely adjust displayed totals to resemble a video.

### Legal action choices restored in `26.03-local-2`

The follow-up decision is to offer the legal choices directly. The two previously deferred restrictions are resolved for new games:

- **Credit-source allocation:** when more than one eligible location can fund a cost, the payer chooses the amount from each source. Pool, bad-publicity fund, and Overclock are separate options; partial payments update the remaining cost. The effect waits until payment is complete. Eligibility still depends on the cost and run window. Sole-source payments need no additional decision. The AI chooses expiring sources first as its policy.
- **Breaker boosts:** all seven Gateway icebreakers offer affordable boosts in paid-ability windows, including outside encounters, at/above matching strength, against other ice types, after all subroutines are broken, and when an AI breaker cannot break the ice. Interface abilities still enforce encounter, type and strength restrictions. Out-of-encounter boosts expire at the effect-end checkpoint, before another ability or encounter ([CR 3.9.5d](https://rules.nullsignal.games/?r=rule_icebreaker_strength_increase_outside_of_encounter)). Encounter boosts retain their normal encounter duration.
- **Adjacent legal choices:** Buzzsaw and Cleaver can pay to break zero subroutines; Fermenter can be used with no virus counters; Leech remains available after all subroutines are broken; the Corp can advance an agenda beyond its advancement requirement. These choices retain their printed costs and other restrictions.

Targeted tests cover 35 boost cases, split payments with effects held until completion, excluded funding sources, stale input, expiry, costs, adjacent legal choices and preserved older-profile behavior. These checks are additional injected-position probes, separate from full-game evidence. The UI explains the outstanding payment; the helper receives the correct profile description.

All three complete reconstructions also run under `26.03-local-2`, with the payer policy explicitly choosing expiring funds first. Their **1,093 human decisions** include the newly exposed paid windows and payment selections, with the same 71 checkpoints, winners, scores, credit totals, and hand sizes. Each independently replays through the native shuffle engine:

| Reconstruction | Decisions in `local-2` | Independently replayed artifact |
|---|---:|---|
| Neon starter | 424 | [Replay](../../../eval/recorded-games/neon-starter-paid-choices-full-replay.json) |
| Legendary Tactics starter | 189 | [Replay](../../../eval/recorded-games/lt-starter-paid-choices-full-replay.json) |
| Legendary Tactics booster | 480 | [Replay](../../../eval/recorded-games/lt-booster-paid-choices-full-replay.json) |

The original 696-decision `local-1` artifacts remain compatibility fixtures. Neither profile is claimed to be an exhaustive certification of the entire rules engine; upstream conditional-trigger ordering still has simplifications outside this change's coverage.

## Source differences and reconstruction decisions

These are retained as annotations rather than implemented as rule exceptions:

1. **Neon R4, approximately 09:54–10:44:** two Sure Gambles and a Telework install account for only three clicks. [CR 5.4.2](https://rules.nullsignal.games/?r=rule_action_phase_duration) requires spending the remaining click. The test fills the gap with an explicitly synthetic Archives run, changing no recorded pool, hand, score or counter total. This does not assert that the players actually made that run.
2. **Starter R3, approximately 09:50:** the source records a fifth Red Team payout. [Red Team's twelve-credit load](https://nullsignal.games/players/learn-to-play/learn-to-play-runner/) supports four payouts. The corrected reconstruction uses a basic R&D run instead. The resulting five-credit pool cannot afford Mayfly followed by Sure Gamble; a branch from the full-game prefix verifies that failure. Sure Gamble followed by Mayfly is affordable and keeps the remaining public actions legal. Subsequent Runner pool totals remain three below the recording.
3. **Starter C6, approximately 16:10–16:20:** Seamless is attempted on newly installed Urtica, then undone. That target remains illegal. The corrected engine can still offer Seamless on older installed cards; it excludes the new Urtica specifically. The replay commits only the source's replacement basic advancement.
4. **Starter R6, approximately 18:40–19:10:** the video manually restores five pool credits after paying Manegarm. The engine uses eligible Overclock credits automatically, with no arbitrary refund. Removing the earlier extra Red Team payout changes the final pool from five to two; Urtica still deals three net damage against two cards and flatlines the Runner.
5. **Booster R15, approximately 33:50:** the source log rezzes both Palisade and inner Diviner before the Palisade encounter. [CR 6.4.3](https://rules.nullsignal.games/?r=rule_rez_ice_restriction) normally permits only the approached ice. The reconstruction delays Diviner's rez until it is approached; both recorded costs and the run outcome remain unchanged. A negative permission assertion checks that inner ice is not offered early.
6. **Neon R5/C6:** used Mayfly is physically trashed after a late reminder. The engine trashes it at the relevant run end. **Booster R12:** repeated install/undo/manual moves become one accepted Cleaver install with the required Mayfly memory trash. Neither physical bookkeeping nor a UI undo is treated as another paid game action.
7. **Booster terminal score:** the recording flips Karunā after the winning Send a Message score. The engine stops at the win, before that optional effect. The announced six-point teaching target in Neon is separately configured for that replay; ordinary faction games retain seven.

## Deployment and saved-game behavior

New games started from the lobby carry `rulesVersion: "26.03-local-2"`; exports preserve it and imports reject unknown profiles. Previously saved unversioned and `26.03-local-1` games retain their original behavior and choice ordering, so they can still restore. Their positions are not silently reinterpreted under a different rules model. The helper receives the profile and point target as visible context. The six-point target is restricted to explicit scripted evaluation; normal lobby games remain seven-point games.

No saved player game was overwritten. A page reload loads the updated client; the corrected rules apply when starting a new game. Existing saves continue under their recorded profile.

## Validation and practical limits

The normal regression suite passes, including historical replay restoration and the earlier reference game. The new full-game replay checks and targeted rule probes pass, and all **12** Runner/Corp faction pairings finish in automated current-profile smoke matches. Those matchup runs exercise all seven selectable identities but are not a balance evaluation. No new Chrome playtest is claimed by this audit.

Run:

```sh
npm run test:recorded-games
node tests/deck-matchups.cjs --current-rules
node tests/rules-paid-choices.cjs
# Regenerate reviewed artifacts after an intentional change:
node scripts/run-recorded-full-games.cjs --write
node scripts/run-recorded-full-games.cjs --full-paid-choices --write
node tests/recorded-rules-audit.cjs --write
```

The authoritative written reference is the [NSG rules hub](https://nullsignal.games/rules/comp-rules/), which identifies v26.03 as current and NetrunnerDB as the current card-text authority. The downloaded card data also matches our Gateway cards' numerical costs, strength, memory costs, advancement requirements and agenda values. The original physical/Jinteki recordings remain historical observations; current rules determine which observed moves should be retained or corrected.
