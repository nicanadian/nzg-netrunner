# Dependency reviewer

D1, D2 and D3 completed. Fresh first impressions were saved before any panel review was read. Own incognito tab only; snapshot timed out after 15 seconds, so this is a rendered-DOM review with no screenshot/layout claims. Routine button sequences were scripted, with strategic decisions made from public localTable.state; terminal session was read only after the game ended.

## Main finding

The recommendation makes the stealth lesson discoverable, and actual card text plus payment controls make it playable. The guide does not explain the dependency chain well enough to preserve it while editing. The lobby synopsis says to build stealth credits with Touchstone then use Corsair. The pairing guide only says to practice the two cards. Touchstone's first-event loading rule and Corsair's stealth-only reduction cost were learned from builder full-card text, then combined using reviewer rules knowledge.

## D1 — completed

Opened lobby Pairing & learning guide, selected Vantage and Tao stealth foundation, and learned the exact recommended HB Tempo and recycling pairing (Runner27/54,50%). Guide correctly limits benchmark interpretation to exact lists and AI tests; custom lists are unbenchmarked. No claim is made that the revision retains that result.

Medium friction: no worked dependency example, event-loading timing, ordinary-versus-stealth cost distinction, or tuning safeguard. Useful improvement: add event → Touchstone credit → Corsair reduction → barrier break beside the pairing, with a direct exact-pairing launch action. Acceptance: a reader can explain the chain and load that pairing without translating names back into selectors.

## D2 — completed

In actual builder, removed all three Touchstones and added three Smartware Distributors. At37 cards it correctly required changes; at40cards/8influence it said Ready to play with changes -3Touchstone/+3Smartware Distributor. No warning explained that Corsair could no longer reduce positive-strength barriers. This is a high-severity learning/coherence gap, not a deck-legality defect.

Repaired all three Touchstones and removed all Smartware Distributors before saving or starting. Final legal one-slot change: -1Pantograph,+1DZMZ Optimizer. Kept three Corsairs and three Touchstones. Named Suite Dependency 19Nov,40cards,8/15influence. The defensible aim was earlier program discounts and MU for rig plus Conduit; opportunity cost is Pantograph's agenda draw/install utility. This is a hypothesis, not demonstrated improvement. Exact list is in dependency-deck.json and embedded game config.

Post-game I opened Deckbuilding basics to confirm scope: it explains one-for-one swapping, minimum size, influence and saving, with no coherence guidance. Improvement: keep legality saveable but show a separate advisory naming Corsair's missing stealth source. Acceptance: replacing last Touchstone with generic economy preserves legal status but shows the advisory; restoring it clears the advisory.

## D3 — completed

Played to natural agenda victory, Runner7–Corp6, UI turn15/internal turn30, version1172, diagnostics empty. No concession, fabricated state, assumed win, private information or headless simulation. Replay choices and exact decks are captured in dependency-game.json.

The lesson became actionable. On UI turn8 I explicitly chose Confirm from Touchstone to pay Echelon for Tithe's net-damage break. On UI turn9/internal18, Overclock attacked UI Remote2. Palisade had4strength: Corsair spent two Touchstone credits on two reductions (4→1→0), then used an Overclock credit to break its end-the-run subroutine. Echelon broke inner Tithe damage using Overclock. The run stole Offworld Office. I used Unity on Sleipnir code gates, Echelon on Ansel sentries, and bioroid clicks when preserving money mattered. Against Ansel I prioritized rig trash and steal prohibition, allowing its installation subroutine. Against Tithe I sometimes accepted damage only with expendable hand buffer.

Final R&D run traversed Bran, Palisade, Sleipnir, Ansel and Tithe; stole Superconducting Hub and Offworld Office for7. Tao swapped Bran out of R&D for a Tithe after the first steal. The initial Vicsek probe had zero tags, so I accepted the first tag, jacked out before unknown inner ice with no clicks, and removed it next turn. These threat choices used own rules knowledge; the lobby HB synopsis did mention last-click Vertigo and tag-escalating Vicsek.

Medium friction: the guide does not explain budgeting finite stealth credits across ordinary breaks and Corsair reductions. Improvement: a worked str4Palisade example requires two stealth credits plus an ordinary break credit; an empty-stealth example explains why reduction is unavailable. Acceptance: learner can name payment sources and demonstrate the sequence in play.

## Method limitations and reviewer errors

Routine DOM clicking covered economy/draw, named options, source payment, and Skip to decision. One later internal28 routine over-continued and allowed Sleipnir's end-the-run; that is reviewer automation error, not a product defect. I continued naturally without undo/reload. Initial remote target interpretation confused UI one-based names with state zero-based names; the resulting Vicsek encounter was played and recorded. Helpers were corrected when installer options used data-install-card rather than data-command. No generic wrong-breaker boost heuristic was used. Snapshot failure limits visual conclusions.

Artifacts: dependency-first-impression.md; dependency-review.json with per-task actions, guide versus own knowledge, evidence, friction, improvement and acceptance tests; dependency-ui-trace.json; dependency-deck.json; dependency-game.json; dependency-history.json (last150 public history entries at terminal). Only own tab was closed. No shared storage was cleared or restored.
