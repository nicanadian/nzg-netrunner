# Legendary Tactics — starter game

[Source recording](https://www.youtube.com/watch?v=4Gr47iNjo0w). Reviewed 2026-11-06.

34/30-card starter decks; Jinteki.net, Corp viewpoint. Result: **corp wins, Corp 2–Runner 5**.

**Status:** source observation ledger with explicit gaps. A [verified, normalized full-game reconstruction](../../../eval/recorded-games/lt-starter-full-replay.json) is available; see the [end-to-end audit](end-to-end-audit.md) for corrections and chosen hidden information. The original shuffle remains unknown.

Approximate navigation anchors; Jinteki log observations sampled every 10 seconds. They are not wall-clock action times. Credit columns below are reconstructed pool credits after each side-turn, including opponent payments during that turn; hosted/run credits are recorded separately in the JSON.

[Machine-readable ledger](../../../eval/recorded-games/lt-starter.json).

## Reconstruction issues

- **lt-starter-red-team** (source anomaly; R1, R2, R3): Five successful Red Team runs/payouts are recorded: R1 R&D/HQ, R2 Archives/HQ, R3 R&D. Current card loads 12, permitting four 3-credit payouts. Video shows Red Team surviving the fourth and paying on the fifth. Cause not established; do not attribute it to our engine or silently copy it into a legal fixture. Observed runner balance includes the extra 3.
- **lt-starter-seamless-undo** (source correction; C6): Keep the attempted action/undo as a UI observation, but only the replacement basic advancement enters the normalized resource ledger. Seamless cannot target a card installed this turn.
- **lt-starter-overclock-adjustment** (source correction; R6): Manual +5 pool adjustment reconciles the source UI with the intended Overclock funds. The ledger collapses debit/refund into one legal temporary-credit payment; does not award an extra 5 credits.
- **lt-starter-hidden-order** (reproduction blocker; C1, R1, C2, R2, R3, C4, R4, R5, R6): Complete Runner draw order, unseen R&D access identities, concealed central ice and HQ random access selection are not recovered. Corp-view footage contains more hand evidence than the narration, but this ledger does not claim every hidden slot is identified.

## Turn ledger

### C1 · [02:00](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=120s)–02:40

Pool after this side-turn: **Corp 5, Runner 5**. Agenda points: Corp 0, Runner 0. Clicks accounted for: 3. Source log credit checkpoint: 5. Source log hand size: 5.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [02:00](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=120s) | — | Corp mandatory draw; no click spent. |
| [02:20](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=140s) | 1 | Install Palisade protecting new Server 1 for 0. |
| [02:30](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=150s) | 1 | Install Offworld Office in Server 1. |
| [02:40](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=160s) | 1 | Draw 1 card; identity not established here. |

### R1 · [02:50](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=170s)–04:50

Pool after this side-turn: **Corp 5, Runner 6**. Agenda points: Corp 0, Runner 3. Clicks accounted for: 4. Source log credit checkpoint: 6. Source log hand size: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [02:50](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=170s) | 1 | Install Red Team for 5. |
| [03:20](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=200s) | 1 | Red Team run R&D: gain 3, access unseen card. |
| [03:40](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=220s) | 1 | Red Team run HQ: gain 3. |
| [04:00](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=240s) | — | Access and steal Send a Message for 3 points. |
| [04:10](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=250s) | — | Send a Message lets Corp rez remote Palisade for 0. |
| [04:30](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=270s) | 1 | Jailbreak HQ: draw 1, access Brân 1.0 and Seamless Launch; leave both. |

### C2 · [05:00](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=300s)–06:00

Pool after this side-turn: **Corp 6, Runner 6**. Agenda points: Corp 0, Runner 3. Clicks accounted for: 3. Source log credit checkpoint: 6. Source log hand size: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [05:00](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=300s) | — | Corp mandatory draw; no click spent. |
| [05:30](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=330s) | 1 | Install ice on R&D for 0; later revealed as Palisade. |
| [05:50](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=350s) | 1 | Install Brân 1.0 on HQ for 0; identified by the visible C1 hand and subsequent card movements, while still concealed from the Runner. |
| [05:50](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=350s) | 1 | Gain 1 credit. |

### R2 · [06:10](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=370s)–08:20

Pool after this side-turn: **Corp 3, Runner 6**. Agenda points: Corp 0, Runner 5. Clicks accounted for: 4. Source log credit checkpoint: 6. Source log hand size: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [06:40](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=400s) | 1 | Install Cleaver for 3. |
| [06:40](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=400s) | 1 | Red Team run Archives: take 3. |
| [07:00](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=420s) | 1 | Play Jailbreak on R&D: draw 1, access 2 if successful. |
| [07:00](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=420s) | — | Corp rezzes central Palisade for 3. |
| [07:40](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=460s) | — | Cleaver pays 1 to break Palisade; no boost needed on central server. |
| [07:40](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=460s) | — | Steal Offworld Office for 2 points (total 5); other access remains unidentified. |
| [08:00](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=480s) | 1 | Red Team run HQ; Corp leaves HQ ice unrezzed. Take 3. |
| [08:20](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=500s) | — | Access Nico Campaign in HQ and trash for 2. |

### C3 · [08:20](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=500s)–08:50

Pool after this side-turn: **Corp 7, Runner 6**. Agenda points: Corp 2, Runner 5. Clicks accounted for: 3. Source log credit checkpoint: 7. Source log hand size: 2.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [08:20](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=500s) | — | Corp mandatory draw; no click spent. |
| [08:40](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=520s) | 1 | Advance installed Offworld for 1. |
| [08:40](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=520s) | 1 | Advance installed Offworld for 1. |
| [08:40](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=520s) | 1 | Seamless Launch for 1 adds 2 advancement. |
| [08:50](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=530s) | — | Score Offworld for 2 points and gain 7. |

### R3 · [09:20](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=560s)–10:40

Pool after this side-turn: **Corp 7, Runner 15**. Agenda points: Corp 2, Runner 5. Clicks accounted for: 4. Source log credit checkpoint: 15. Source log hand size: 0.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [09:30](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=570s) | 1 | Recorded: use Red Team on R&D again, pass Palisade with Cleaver for 1. **[lt-starter-red-team]** |
| [09:50](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=590s) | — | Recorded fifth Red Team payout: gain 3 and trash Red Team. This exceeds the current 12-credit load by 3. **[lt-starter-red-team]** |
| [10:10](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=610s) | — | Access unseen R&D card; leave it. |
| [10:30](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=630s) | 1 | Install Mayfly for 1. |
| [10:30](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=630s) | 1 | Sure Gamble: pay 5, gain 9. |
| [10:40](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=640s) | 1 | Last-click Creative Commission: pay 1, gain 5. |

### C4 · [10:50](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=650s)–11:20

Pool after this side-turn: **Corp 6, Runner 15**. Agenda points: Corp 2, Runner 5. Clicks accounted for: 3. Source log credit checkpoint: 6. Source log hand size: 1.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [10:50](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=650s) | — | Corp mandatory draw; no click spent. |
| [11:20](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=680s) | 1 | Install outer ice on R&D for 1; identity remains concealed. |
| [11:20](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=680s) | 1 | Install outer ice on HQ for 1; identity remains concealed. |
| [11:20](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=680s) | 1 | Gain 1 credit. |

### R4 · [11:30](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=690s)–12:00

Pool after this side-turn: **Corp 6, Runner 12**. Agenda points: Corp 2, Runner 5. Clicks accounted for: 4. Source log credit checkpoint: 12. Source log hand size: 2.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [11:50](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=710s) | 1 | Draw 1 card; identity not established here. |
| [12:00](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=720s) | 1 | Draw 1 card; identity not established here. |
| [12:00](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=720s) | 1 | Draw 1 card; identity not established here. |
| [12:00](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=720s) | 1 | Install Unity for 3. |

### C5 · [12:30](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=750s)–13:30

Pool after this side-turn: **Corp 7, Runner 12**. Agenda points: Corp 2, Runner 5. Clicks accounted for: 3. Source log credit checkpoint: 7. Source log hand size: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [12:30](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=750s) | — | Corp mandatory draw; no click spent. |
| [13:20](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=800s) | 1 | Draw 1 card; identity not established here. |
| [13:30](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=810s) | 1 | Draw 1 card; identity not established here. |
| [13:30](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=810s) | 1 | Gain 1 credit. |

### R5 · [13:40](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=820s)–15:00

Pool after this side-turn: **Corp 7, Runner 9**. Agenda points: Corp 2, Runner 5. Clicks accounted for: 4. Source log credit checkpoint: 9. Source log hand size: 2.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [13:50](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=830s) | 1 | Draw 1 card; identity not established here. |
| [13:50](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=830s) | 1 | Tread Lightly for 1 runs HQ; pass both unrezzed ice. |
| [14:40](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=880s) | — | Access second Nico Campaign from HQ; trash for 2. |
| [15:00](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=900s) | 1 | Draw 1 card; identity not established here. |
| [15:00](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=900s) | 1 | Install Smartware for 0; do not load it this turn. |

### C6 · [15:10](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=910s)–16:20

Pool after this side-turn: **Corp 6, Runner 9**. Agenda points: Corp 2, Runner 5. Clicks accounted for: 3. Source log credit checkpoint: 6. Source log hand size: 2.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [15:10](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=910s) | — | Corp mandatory draw; no click spent. |
| [15:30](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=930s) | 1 | Install Manegarm Skunkworks in Server 1. |
| [15:30](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=930s) | 1 | Install Urtica Cipher in Server 1. |
| [16:10](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=970s) | — | Attempt Seamless Launch, then /undo-click and return the card to HQ. Net zero clicks/credits after undo. The newly installed target is ineligible. **[lt-starter-seamless-undo]** |
| [16:20](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=980s) | 1 | Instead, spend last click and 1 credit to advance Urtica once. |

### R6 · [16:30](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=990s)–19:10

Pool after this side-turn: **Corp 4, Runner 5**. Agenda points: Corp 2, Runner 5. Clicks accounted for: 2. Source log credit checkpoint: 5.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [16:40](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=1000s) | 1 | Draw 1 card; identity not established here. |
| [16:50](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=1010s) | 1 | Play Overclock for 1, load 5 eligible run credits, run Server 1. |
| [17:20](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=1040s) | — | Corp rezzes Manegarm Skunkworks for 2. |
| [18:00](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=1080s) | — | Remote Palisade is strength 4: Cleaver boosts once for 2 and breaks for 1. |
| [18:40](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=1120s) | — | Normalized final payment: spend the 5 Overclock credits at Manegarm; leave pool at 5. **[lt-starter-overclock-adjustment]** |
| [18:50](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=1130s) | — | Recorded UI debits 5 from pool, then player manually increments pool five times, restoring 5. Combined net zero pool change; normalized payment above spends hosted credits once. **[lt-starter-overclock-adjustment]** |
| [19:10](https://www.youtube.com/watch?v=4Gr47iNjo0w&t=1150s) | — | Access 1-advanced Urtica: 3 net damage against grip of 2 (Pennyshaver, Cleaver). Both trash; Runner flatlines. |

