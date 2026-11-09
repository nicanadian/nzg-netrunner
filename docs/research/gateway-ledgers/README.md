# Three reconstructed System Gateway games

Reviewed 6 November 2026.

**End-to-end follow-up completed:** all three now have independently replayed full-game reconstructions, totaling **696 legal decisions**. The audit found and corrected four engine/rules differences in a versioned rules profile. See the [complete audit and dispositions](end-to-end-audit.md). The original annotation-stage details below remain useful for understanding source gaps; these are corrected reconstructions, not recovered historical shuffles. All three candidates now have **timestamped ledgers from opening to recorded ending**, comprising **71 side-turns and 385 annotated events**. The ledgers include basic actions, run encounters, payments, counters, scoring, damage, and visible corrections. They are suitable references for scenario reconstruction and UI evaluation.

They are **not three exact executable full-game replays**. Original shuffles and some concealed cards remain unknown. Two recordings also contain sequences that must be resolved before treating their entire observed game as legal ground truth. Unknown information and source mistakes are labelled in each ledger.

| Recording | Side-turns covered | Events | Recorded ending | Ledger |
|---|---:|---:|---|---|
| [Neon Static starter demo](https://www.youtube.com/watch?v=EpoV0ezJFFg) | C1–C13, R1–R13 | 140 | Runner wins 7–3 at approximately 31:47 | [Readable](neon-starter.md) · [JSON](../../../eval/recorded-games/neon-starter.json) |
| [Legendary Tactics starter](https://www.youtube.com/watch?v=4Gr47iNjo0w) | C1–C6, R1–R6 | 62 | Corp flatlines Runner at approximately 19:10; points 2–5 | [Readable](lt-starter.md) · [JSON](../../../eval/recorded-games/lt-starter.json) |
| [Legendary Tactics booster](https://www.youtube.com/watch?v=NwMp40meA1A) | C1–C17, R1–R16 | 183 | Corp wins 8–1 at approximately 37:25 | [Readable](lt-booster.md) · [JSON](../../../eval/recorded-games/lt-booster.json) |

An event is an annotation unit, not necessarily one click or one atomic engine decision. For example, a play and its net payment can share an entry; run reactions receive separate entries. Terminal turns can end with unused clicks. The Neon game announces a six-point teaching target; its winning steal actually reaches seven. These neutral starter identities do not test the seven faction identity abilities in our curated decks.

## What was recovered and checked

English caption tracks were successfully retrieved for all three videos using yt-dlp. Neon Static has automatic captions; the selected Legendary Tactics English tracks are not marked ASR in YouTube metadata. Both Legendary Tactics games are **Jinteki.net screen recordings**, with a visible action log. They are not physical-table recordings, as our initial inventory suggested. The starter game is shown from the Corp side, and the booster from the Runner side.

The Jinteki log area was extracted at ten-second intervals through play and processed with macOS Vision OCR. Overlapping log windows were aligned to recover actions; repeated OCR windows were not counted as repeated moves. Narration, board frames, and later reveals supplied checks and retrospective card identities. OCR alone was not treated as an authoritative parser. Video times are approximate navigation anchors to the source footage, not exact action timestamps.

The [accounting validator](../../../scripts/check-recorded-game-ledgers.cjs) checks alternating turns, click budgets, nonnegative pool credits, counter accounting, deck quantities, card identifiers and terminal point totals. Reconstructed credit totals match **45 observed checkpoints** in the two Jinteki recordings. Neon Static's pool totals are reconstructed from narrated actions and payments, rather than independently transcribed turn-end balances. The [validation results](../../../eval/recorded-games/validation.json) retain the exceptional Red Team counter underflow explicitly.

The [official Gateway product card lists](https://nullsignal.games/products/system-gateway/) establish the 34-card Corp / 30-card Runner starter decks and the ten-card additions per side for the booster game. The Neon creator's linked NetrunnerDB lists agree with those starter quantities. These lists are stored as card-number quantities in each JSON; they are different from our curated 40-card faction decks. See the [evidence manifest](../../../eval/recorded-games/evidence-manifest.json) for source hashes and acquisition details. Raw captions and signed media URLs are not part of the delivered ledgers.

## Findings that affect reproduction

**Neon Static: one click is unresolved.** At [09:54–10:44](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=594s), the Runner narrates two Sure Gambles and installing Telework, then ends the turn. The fourth click is not established. The ledger reserves it as a gap, without awarding another credit or inventing a draw. The opening remote's three installed cards are all revealed, but their exact per-click installation order is uncertain. Other gaps include hidden draws, the HQ ice, an unaccessed late remote and some discards. Mayfly's physical trash reminder is late; the normalized placement is at the end of the run where it was used.

**Legendary Tactics starter: an extra Red Team payout appears in the source.** The visible log records two payouts in R1, two in R2 and a fifth on [R3 around 09:50](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=590s). Current Red Team holds twelve credits, sufficient for four three-credit payouts. The source preserves it through the fourth and pays again on the fifth. The cause is unestablished. Its recorded credit totals reconcile only when that extra three is retained as a labelled source anomaly; a legal full-game fixture cannot silently copy it. The [official card explanation](https://nullsignal.games/players/learn-to-play/learn-to-play-runner/) confirms the twelve-credit load and three-credit payouts.

The same starter game attempts Seamless Launch on a just-installed card, undoes it, and substitutes ordinary advancement. Its final run also uses manual pool-credit increments after paying Manegarm. The ledger records that correction and accounts for the five Overclock credits once. In our engine, eligible hosted credits are spent automatically; their allocation between Cleaver and Manegarm can differ while reaching the same final pool.

**Legendary Tactics booster supplied the strongest full-game reconstruction basis.** Its resource accounting reconciles, and it has richer mechanics: DZMZ discounts and memory, four Red Team payouts, Smartware and Nico income, tags, tagged-resource trashing, bioroid click breaking, Leech strength reduction, partial subroutine breaking, and Urtica damage. The memory-related undo sequence is preserved separately from the final paid install. Later board frames identify the C12 Server 2 root as Regolith and the C15 replacement as Urtica. Remaining unknowns include concealed R&D ice, some accesses/draws, and an unrezzed Server 1 upgrade. The completed deterministic reconstruction uses explicitly chosen, consistent hidden-state completions; see the end-to-end audit for the verified result and timing corrections.

## Three scenarios already exercised in our engine

The [encounter fixtures](../../../tests/recorded-game-scenarios.cjs) pass through **53 legal engine decisions** after explicitly injecting their starting positions. They do not replay the preceding turns, run Chrome, or establish complete source-game equivalence. The [saved results and decision traces](../../../eval/recorded-games/engine-scenario-validation.json) record their outcomes.

| Source segment | Reconstructed position and tested result | Useful UI expectations |
|---|---|---|
| Neon R1, approximately 02:48–05:25 | Overclock run through Tithe; unused installed Mayfly survives; spare Mayfly takes net damage. Five temporary credits pay Manegarm, then both root cards are trashed. Final pools: Runner 1, Corp 3. | Show hosted funds separately; with one click left at server approach, the two-click Manegarm option is unavailable. Explain that allowing Tithe does not end the run. |
| LT starter R6, approximately 16:50–19:10 | Cleaver passes strength-4 remote Palisade, Manegarm is paid, then one-advanced Urtica deals three net damage against two cards: Corp flatline win. Runner pool remains 5 without manual refund. | Show boost plus break cost, automatic use of temporary funds, and the damage/flatline sequence once the ambush is revealed. |
| LT booster R12, approximately 26:50–29:00 | Three Leech counters lower Brân from 6 to 3. Cleaver breaks all three subs for 2; Carmen breaks only Tithe's damage for 1 and Corp gains 1; remote Palisade costs 3. Hub is stolen; no new Leech counter on a remote. | Connect strength reduction to newly affordable breaks; distinguish broken and resolving subs; show six-credit total and zero remaining virus counters. |

## Re-running the checks

From the repository root:

```sh
npm run test:recorded-games
# Refresh the readable ledgers/accounting report after editing JSON annotations:
node scripts/check-recorded-game-ledgers.cjs --render
# Refresh the saved adapted-encounter results:
node tests/recorded-game-scenarios.cjs --write
```

JSON annotations are the source of truth for the readable ledgers. Each event has a stable identifier, video anchor, kind, click count, known card references, pool/point deltas, and optional counter changes or issue references. `gap`, `source-correction`, and `source-anomaly` entries must remain distinguishable from ordinary actions. Credit checkpoints verify the accounting; they do not prove all hidden information or all rules choices were recovered. No production gameplay code or saved player game was changed for this research.
