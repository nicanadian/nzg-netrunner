# Corp character mechanics panel — 6 November 2026

This is an independent AI-operated playtest, not recruited human feedback or a balance study. The tester controlled the Corp through ordinary browser controls. No browser runtime state was injected. Checkpoints contain ordinary legal choices from fresh seeded games and were imported with Menu → Paste game replay.

The initial completed match and Anoetic Void check used the shared browser preview at 1280 × 800. Repeated preview disconnections and click timeouts led to Chrome extension testing for NBN and Weyland. Both browsers used isolated `127.0.0.1:5175`; the user's `localhost:5173` game was untouched.

## Games and checkpoints actually operated through the UI

| Match | Extent | Mechanics and observed result |
| --- | --- | --- |
| Jinteki: Restoring Humanity vs Zahya | Complete fresh lobby-to-terminal match, 25 human decisions, engine turn 6 | Installed Urtica from its card inspector, advanced it once, drew and discarded, resolved identity income, passed defensive windows, triggered unrezzed Urtica for 3 net damage, reviewed named cards lost to damage. Zahya eventually won with 8 agenda points. Later Corp turns deliberately drew/discarded to exercise completion; this was not competitive play. |
| Jinteki vs Zahya | Anoetic Void checkpoint, then complete activation | Paid 2 credits (10 → 8), chose Neurospike then Diviner from HQ (4 → 2 cards), both moved to Archives, and the run ended. The Runner subsequently initiated another run on HQ. |
| NBN: Reality Plus vs Zahya | Public Trail checkpoint and both identity reward branches | Before tags, Retribution lacked the gold action outline. Public Trail cost 4 credits and 1 click (11 → 7 credits; 3 → 2 clicks); Zahya took a tag. Reality Plus then offered Gain 2 credit / Draw 2 cards. Reimporting the same legal checkpoint tested both: credits 7 → 9, or HQ 5 → 7 and R&D 32 → 30, with clicks unchanged at 2. |
| Weyland: Built to Last vs Tāo | First and third Pharos advancements | First counter cost 1 credit then refunded 2: credits 5 → 6 and clicks 2 → 1. The third counter cost 1 credit/1 click and raised advancement 2 → 3. Pharos remained unrezzed and displayed strength 5. |
| Weyland vs Tāo | Guarded Clearinghouse turn-start checkpoint, then damage choice | A rezzed Clearinghouse with 1 advancement offered Do 1 meat damage / Continue. Choosing damage moved Clearinghouse from its remote to Archives, trashed VRcation from Runner grip, and reduced grip 4 → 3. The Corp retained all 3 action clicks. |
| Weyland vs Zahya | Malapert Data Vault search checkpoint | Scoring Superconducting Hub reached the optional non-agenda R&D search. All 25 selectable cards appeared as identical facedown cards. Initially held before making a blind choice; the fix and named selection were subsequently verified. |

The exported complete Jinteki UI match was independently replayed through the engine: all 25 choices restored successfully, Runner 8 points, no engine diagnostics.

## Findings sent to implementation (original observations)

### P1 — Malapert's permitted private search is unreadable

Reproduction: import `eval/characters/corp-malapert-search.json` (13 choices; seed `malapert-panel-57`). The Corp sees “Resolve score effects”, “FROM Malapert Data Vault”, and “Search R&D for 1 non-agenda card”, followed by 25 identical “Facedown card” buttons and Continue. Neither card names nor thumbnails identify valid selections.

This blocks meaningful use of the new Weyland card even though the engine enumerates legal candidates. The chooser needs decision-scoped visibility of those candidates. It must not reveal the Corp's deck to the Runner, expose unrelated deck cards, or retain visibility after the search ends. Browser evidence: `eval/characters/corp-malapert-facedown-search-chrome.jpg`.

### P2 — Choice impact is hidden behind card inspection

- **Urtica:** the initial Advance and Rez buttons lacked the damage total and unrezzed ambush explanation. During access the trigger was just “Urtica Cipher”. The engine correctly dealt 3 net damage from 1 advancement without rez. New action notes were implemented during the panel; the exact access trigger wording still needs the final retest.
- **Restoring Humanity:** the initial discard-end trigger said only “When your discard phase ends”. It did not preview the 1-credit income or facedown Archives condition. Payment worked (4 → 5 credits).
- **Anoetic Void:** initial binary choice named the 2-credit/two-card payment but omitted the end-run consequence. Nested HQ choices used the generic “Discard” header and did not distinguish first from second card or explain that payment was committed. The actual cost and end-run resolution worked. A new root ability hint explaining the cost and end-run outcome was observed during this test.
- **Reality Plus:** the intermediate tag response initially named only the identity, while the following screen clearly distinguished credits from cards. Public Trail's new preview explaining tag/payment and possible identity trigger was verified in Chrome.
- **Clearinghouse:** the binary “Do 1 meat damage” label omitted that the asset would be trashed. The resulting receipt clearly showed the asset leaving play, but that consequence should be stated before commitment.
- **Pharos:** the initial new third-counter preview said “ice gains +5 strength” while the unrezzed card remained STR 5. The modifier only functions while active. The preview needs the rez condition; the observed strength is consistent with the engine.

### P3 — First remote numbering differs in the resource receipt

The run banner and activity read Remote 1, but one opponent action resource receipt read “Runner runs Remote 0”. This was reported for normalization. It did not alter the run target.

## Final fix verification in Chrome

All three characters were retested after reloading the frontend/worker and importing the same checkpoints:

- **Malapert P1 fixed:** the search displayed all 25 candidates by name with thumbnails. Selected Hedge Fund (option 11); HQ increased 3 → 4 and R&D decreased 33 → 32. Hedge Fund was visible in HQ afterward, and the game continued to Superconducting Hub’s separate score response. The optional Continue remained available. Updated evidence: `corp-malapert-search-fixed-chrome.jpg`. Opponent/privacy assertions are handled by the implementation's native tests; this browser pass directly verified the choosing Corp.
- **Anoetic fixed:** the binary button explicitly says “end the run”. Paid selection screens now say “Trash first HQ card” and “Trash second HQ card”, explain the 2 credits already paid, and remind the player the run ends after both are trashed. Source and target remain linked. Evidence: `corp-anoetic-paid-step-chrome.jpg`.
- **Urtica fixed:** its access trigger reads “Deal 3 net damage: 2 base + 1 advancement · no rez required”.
- **Restoring Humanity fixed:** the trigger previews gaining 1 credit because Archives contains a facedown card, with no click cost.
- **Reality Plus fixed:** its first-tag trigger previews the choice of 2 credits or 2 cards, with no click cost.
- **Clearinghouse fixed:** the binary damage button now explicitly warns that it trashes Clearinghouse and costs no click.
- **Pharos fixed:** the third-counter preview now says “+5 strength while rezzed”, matching the unrezzed STR 5 observed on the board.

A remaining small improvement would be inspecting/hover-reading a searched card directly from its option before choosing. Named candidates and thumbnails now make Malapert functional; full printed-card previews in that list were not added during this panel. The reported first-remote receipt numbering was not separately rechecked after the final reload.

## Connections between actions and cards

The direct-card Urtica install path displayed the same legal action as the sidebar, with a 1-click cost and a note that rez is paid later. Once installed, its advancement and unrezzed state were visible on the board.

During Anoetic's first HQ-card choice, hovering Neurospike highlighted both Neurospike and Anoetic Void. The action element contained both related IDs (`c24 c26`), and both corresponding board cards gained the related highlight. This confirms the source-preservation improvement while choosing a separate target. Named own-HQ choices remained readable.

The NBN tag counter, Corp credit change badges, Pharos advancement counter, and Clearinghouse leaving-play receipt all gave useful immediate feedback. The remaining weakness is mostly predicting consequences before committing, with the Malapert search visibility exception above.

## Evidence and scope limits

- `eval/characters/corp-jinteki-zahya-ui-match.json` — actual UI-exported complete match.
- `eval/characters/corp-jinteki-zahya-ui-terminal.png` — terminal screenshot.
- `eval/characters/corp-anoetic-0.json` — before the payment choice.
- `eval/characters/corp-public-trail-0.json` — before Reality Plus reward choice; use its first four choices to restore before playing Public Trail.
- `eval/characters/corp-pharos-first-advance.json` and `corp-pharos-third-advance.json` — legal advancement checkpoints.
- `eval/characters/corp-clearinghouse-trigger.json` — before the self-trash damage decision.
- `eval/characters/corp-malapert-search.json` — unreadable private search reproduction.
- Chrome screenshots for NBN reward options, Clearinghouse options, Pharos third-counter preview, and Malapert facedown search are alongside those replays.

No complete NBN or Weyland match was hand-played in this panel. It does not cover every tag source, damage prevention, a full Diviner/Karunā encounter, Jinteki Longevity Serum, lethal Clearinghouse, or Pharos rezzing at the three-counter threshold. Earlier all-matchup AI smoke games are separate evidence and are not counted as these UI sessions. Long oracle-assisted candidate replays that failed deterministic restoration were discarded rather than presented as evidence.
