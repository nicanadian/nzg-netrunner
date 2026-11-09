# Character mechanics and move clarity suite

2026-11-06. Three independent AI reviewers took Runner-mechanics, Corp-mechanics and newcomer-interaction roles. These are agent-operated playtests, not recruited human participants. The panel found and retested presentation defects; it is not a balance or tournament-rules certification.

## Coverage

Two fresh games were played from lobby to terminal through ordinary browser controls: **Tāo vs Jinteki (13 choices)** and **Jinteki vs Zahya (25 choices)**. A further Zahya session played the first three Runner turns. The panel used the shared T3 browser initially; Corp follow-ups and the implementation owner's final checks used actual Chrome after repeated preview connection failures. Test origins on ports 5174–5177 kept the user's port 5173 save untouched.

Two additional complete legal-option engine games were independently replayed: **Zahya vs NBN (99 choices)** and **Tāo vs Weyland (185 choices)**. Selected prefixes were imported using Menu → Paste game replay and then operated through the UI. These engine games are separate evidence, not additional full browser matches. The existing all-12-pairings AI smoke suite is also separate.

The five identities added beyond Loup/Haas-Bioroid all received focused checks:

| Character | Focused mechanics |
|---|---|
| Zahya | Access-based income, successful Red Team payout, Tranquilizer counter/derez, type-mismatched breaker |
| Tāo | Optional two-ice swap, mixed sidebar/board selection, hosted programs moving with their host, Pantograph install, DZMZ discount |
| Jinteki | Facedown Archives income, unrezzed Urtica damage, Anoetic Void's paid two-card sequence |
| NBN | Public Trail tag/payment, first-tag reward, both draw-two and gain-two branches |
| Weyland | First advancement refund, Pharos's third counter, Clearinghouse self-trash damage, Malapert search |

Individual reports preserve original observations, retests and scope limits: [Runner](characters-runner-panel.md), [Corp](characters-corp-panel.md), [newcomer](characters-newcomer-panel.md). Replay JSON and screenshots are in [eval/characters](../../eval/characters/).

## Fixed following the panel

- **Unreadable private searches:** Malapert originally offered 25 identical facedown choices. Eligible choices now show names and thumbnails only to the player searching. A separate **Read card** control opens full rules before committing; its inspector offers the same Choose action. Mutual Favor receives the same decision-scoped treatment. Tests cover opponent privacy, unchanged native deck visibility and expiry of unchosen references.
- **Silent forced encounters:** when no Runner response is legal, playback now pauses at the public encounter before subroutines fire. It shows the ice's unbroken subroutines and the rig's type/strength limitations. Next watches the resolution; no artificial rules choice is added.
- **Missing costs and consequences:** VRcation and Creative Commission quote the conditional extra click loss, including last-click behavior. Pantograph shows its source, gained credit, optional no-click install and actual credit cost. DZMZ discounts, Zahya/Red Team payouts, Jinteki income, NBN rewards, Urtica's damage formula, Clearinghouse's self-trash, and Pharos's rez condition have explicit action notes.
- **Paid multi-step ambiguity:** Anoetic distinguishes the initial 2-credit/two-card commitment, first HQ card and second HQ card. It says credits are already paid and the run will end. Target choices retain the ability's source so hovering/focusing links both source and target.
- **Hard-to-see results:** Tāo produces a source-named swap event, before/after location receipts and outlines on both moved ice. Hosted cards follow their host. Tranquilizer derez events name their cause. Hand-count changes appear in resource receipts. Damage events and flatline results show source, amount/type and grip before damage; Urtica includes base plus advancement.
- **Inconsistent positions:** ice target and host choices use positions from the outside, and Remote numbering is normalized in action details, announcements and receipts. Repeated position text was removed from selection rows.

## Final checks and evidence

The Runner panel rechecked the forced Tithe pause and Pantograph's source/cost/target highlighting in the shared browser. The Corp panel rechecked named Malapert selection, both paid Anoetic steps, Urtica, Jinteki/NBN reward notes, Clearinghouse and Pharos in Chrome.

The implementation owner separately verified in Chrome:

- Reading Government Subsidy during Malapert's search opened its complete rules and a **Choose Government Subsidy** action while leaving the search, hand, credits and score unchanged. [Capture](../../eval/characters/parent-read-search-card-chrome.jpg).
- Urtica's terminal result showed **5 net damage = 2 base + 3 advancement**, versus **2 cards in grip**, explaining the flatline. [Capture](../../eval/characters/parent-ambush-summary-chrome.jpg).
- Tāo's hidden-ice swap showed both moved-card outlines, both before/after locations, and source-named log/status feedback while keeping identities concealed. [Capture](../../eval/characters/parent-tao-swap-result-chrome.jpg).
- Chrome warning/error log was empty in this final check. At a 390×844 viewport, the Malapert and novice terminal positions had no document-wide horizontal overflow; the earlier shared-browser 8px finding did not reproduce here. The decision rail still follows the board on phones.

`npm test` covers these regressions alongside native rules/payments, existing browser replays, private information, worker playback equivalence, helper boundaries and the reference teaching sequence. `tests/character-feedback.cjs` adds actual payment checks, both search privacy paths, paid Anoetic stages, no-response encounter review, Urtica's damage cause, Pantograph and Tāo's hidden-ice swap. The reference artifact changed only by adding one option location annotation; all 66 native choices and every other checkpoint field remained identical to the previous baseline.

## Remaining limits

No complete NBN or Weyland game was played entirely through browser clicks. Conduit multi-access, Unity's dynamic boost and low-credit mixed-breaker plans did not receive comprehensive new browser passes; existing native cost tests cover the seven supported breakers. Phone touch accuracy and a full keyboard-only match remain untested. The counter/quote descriptions target the pinned System Gateway cards, and do not plan a complete run or predict concealed ice. Original panel reports explicitly distinguish older captures from final results.
