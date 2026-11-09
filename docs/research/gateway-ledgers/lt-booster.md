# Legendary Tactics — starter plus booster game

[Source recording](https://www.youtube.com/watch?v=NwMp40meA1A). Reviewed 2026-11-06.

44/40-card starter-plus-booster decks; Jinteki.net, Runner viewpoint. Result: **corp wins, Corp 8–Runner 1**.

**Status:** source observation ledger with explicit gaps. A [verified, normalized full-game reconstruction](../../../eval/recorded-games/lt-booster-full-replay.json) is available; see the [end-to-end audit](end-to-end-audit.md) for corrections and chosen hidden information. The original shuffle remains unknown.

Approximate navigation anchors; Jinteki log observations sampled every 10 seconds. They are not wall-clock action times. Credit columns below are reconstructed pool credits after each side-turn, including opponent payments during that turn; hosted/run credits are recorded separately in the JSON.

[Machine-readable ledger](../../../eval/recorded-games/lt-booster.json).

## Reconstruction issues

- **booster-memory-undo** (source correction; R12): R12 contains multiple UI undo/manual move operations. Final accepted state has Cleaver installed, original Mayfly absent, one-click install cost 2, and enough memory with DZMZ. Replaying every undo as another paid install would corrupt the ledger.
- **booster-hidden-order** (reproduction blocker; C1, R2, C4, C7, C8, C12, C15): Original shuffles, Corp hand/draw sequence, unrezzed R&D ice, unidentified R&D accesses and the unrezzed Server 1 upgrade installed C15 are not recovered. Regolith is visibly in Server 2 at 29:10, resolving the earlier hidden-root mapping. This ledger establishes the public game, not a unique complete hidden-state replay.

## Turn ledger

### C1 · [01:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=80s)–02:10

Pool after this side-turn: **Corp 15, Runner 5**. Agenda points: Corp 0, Runner 0. Clicks accounted for: 3. Source log credit checkpoint: 15. Source log hand size: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [01:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=80s) | — | Corp mandatory draw; no click spent. |
| [01:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=90s) | 1 | Hedge Fund: pay 5, gain 9. |
| [02:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=120s) | 1 | Gain 1 credit. |
| [02:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=120s) | 1 | Government Subsidy: pay 10, gain 15. |

### R1 · [02:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=130s)–03:30

Pool after this side-turn: **Corp 15, Runner 0**. Agenda points: Corp 0, Runner 0. Clicks accounted for: 4. Source log credit checkpoint: 0. Source log hand size: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [02:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=150s) | 1 | Install Red Team for 5; load 12. |
| [02:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=160s) | 1 | Jailbreak HQ: draw 1; access Diviner and Nico, leave both (pool 0). |
| [03:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=190s) | 1 | Red Team R&D: take 3. |
| [03:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=210s) | — | Access Regolith Mining License in R&D; trash for 3. |
| [03:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=210s) | 1 | Install Smartware for 0. |

### C2 · [03:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=210s)–04:00

Pool after this side-turn: **Corp 14, Runner 0**. Agenda points: Corp 0, Runner 0. Clicks accounted for: 3. Source log credit checkpoint: 14. Source log hand size: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [03:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=210s) | — | Corp mandatory draw; no click spent. |
| [03:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=230s) | 1 | Install Palisade protecting new Server 1 for 0. |
| [04:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=240s) | 1 | Install Offworld Office in Server 1. |
| [04:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=240s) | 1 | Advance Offworld once for 1. |

### R2 · [04:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=250s)–04:50

Pool after this side-turn: **Corp 14, Runner 4**. Agenda points: Corp 0, Runner 0. Clicks accounted for: 4. Source log credit checkpoint: 4. Source log hand size: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [04:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=250s) | 1 | Red Team R&D: take 3. |
| [04:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=260s) | — | Trash Urtica Cipher from R&D for 2; no access damage because it is not installed. |
| [04:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=260s) | 1 | Basic run on R&D; access an unidentified non-agenda and leave it. |
| [04:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=280s) | 1 | Red Team HQ: take 3, access Seamless Launch and leave it. |
| [04:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=290s) | 1 | Load Smartware with 3. |

### C3 · [04:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=290s)–05:00

Pool after this side-turn: **Corp 18, Runner 4**. Agenda points: Corp 2, Runner 0. Clicks accounted for: 3. Source log credit checkpoint: 18. Source log hand size: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [04:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=290s) | — | Corp mandatory draw; no click spent. |
| [05:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=300s) | 1 | Advance Offworld once for 1. |
| [05:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=300s) | 1 | Advance Offworld once for 1. |
| [05:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=300s) | 1 | Advance Offworld once for 1. |
| [05:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=300s) | — | Score Offworld for 2 points and gain 7. |

### R3 · [05:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=310s)–05:50

Pool after this side-turn: **Corp 18, Runner 4**. Agenda points: Corp 2, Runner 0. Clicks accounted for: 4. Source log credit checkpoint: 4. Source log hand size: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [05:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=310s) | — | Smartware pays 1 at turn start. |
| [05:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=310s) | 1 | Sure Gamble: net +4. |
| [05:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=320s) | 1 | Install Verbal Plasticity for 3. |
| [05:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=340s) | 1 | Basic draw 1, then Verbal Plasticity draws 1 additional card (first basic draw this turn). |
| [05:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=340s) | 1 | Jailbreak HQ: draw 1; access Karunā and Nico. |
| [05:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=350s) | — | Trash Nico from HQ for 2. |

### C4 · [06:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=370s)–07:00

Pool after this side-turn: **Corp 17, Runner 4**. Agenda points: Corp 2, Runner 0. Clicks accounted for: 3. Source log credit checkpoint: 17. Source log hand size: 1.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [06:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=370s) | — | Corp mandatory draw; no click spent. |
| [07:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=420s) | 1 | Install concealed ice on R&D for 0. |
| [07:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=420s) | 1 | Install Diviner on HQ for 0; later revealed. |
| [07:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=420s) | 1 | Install Tithe outside remote Palisade for 1. |

### R4 · [07:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=420s)–08:10

Pool after this side-turn: **Corp 17, Runner 6**. Agenda points: Corp 2, Runner 0. Clicks accounted for: 4. Source log credit checkpoint: 6. Source log hand size: 5.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [07:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=420s) | — | Smartware pays 1 at turn start. |
| [07:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=430s) | 1 | Wildcat Strike for 2; Corp chooses Runner draw 4. |
| [07:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=460s) | 1 | Fourth Red Team payout: Archives run gains 3, empty Red Team trashes. |
| [08:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=490s) | 1 | Install Leech for 1. |
| [08:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=490s) | 1 | Gain 1 credit. |

### C5 · [08:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=490s)–08:30

Pool after this side-turn: **Corp 16, Runner 6**. Agenda points: Corp 2, Runner 0. Clicks accounted for: 3. Source log credit checkpoint: 16. Source log hand size: 2.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [08:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=490s) | — | Corp mandatory draw; no click spent. |
| [08:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=500s) | 1 | Install Superconducting Hub in Server 1. |
| [08:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=510s) | 1 | Draw 1 card; identity not established here. |
| [08:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=510s) | 1 | Advance Hub once for 1. |

### R5 · [08:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=510s)–09:30

Pool after this side-turn: **Corp 7, Runner 4**. Agenda points: Corp 2, Runner 0. Clicks accounted for: 4. Source log credit checkpoint: 4. Source log hand size: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [08:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=510s) | — | Smartware pays 1 at turn start. |
| [08:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=520s) | 1 | Tread Lightly for 1 runs Server 1. |
| [08:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=520s) | — | Rez Tithe for 1+3 tax = 4. |
| [08:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=530s) | — | Allow Tithe: 1 net damage trashes Overclock. |
| [09:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=540s) | — | Allow Tithe: Corp gains 1. |
| [09:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=550s) | — | Rez remote Palisade for 3+3 tax = 6. |
| [09:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=560s) | — | Palisade ends run; no successful-central Leech counter. |
| [09:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=570s) | 1 | Basic draw 1, then Verbal Plasticity draws 1 additional card (first basic draw this turn). |
| [09:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=570s) | 1 | Install first DZMZ Optimizer for 2. |
| [09:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=570s) | 1 | Install Mayfly for 0: first program this turn gets DZMZ discount. |

### C6 · [09:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=580s)–10:40

Pool after this side-turn: **Corp 7, Runner 4**. Agenda points: Corp 3, Runner 0. Clicks accounted for: 3. Source log credit checkpoint: 7. Source log hand size: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [09:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=580s) | — | Corp mandatory draw; no click spent. |
| [09:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=580s) | 1 | Seamless Launch costs 1; add 2 advancement to previously installed Hub. |
| [09:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=590s) | — | Score Hub for 1 (Corp total 3); take optional draw 2. |
| [10:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=640s) | 1 | Install Nico Campaign in Server 1. |
| [10:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=640s) | 1 | Gain 1 credit. |

### R6 · [11:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=660s)–11:50

Pool after this side-turn: **Corp 7, Runner 3**. Agenda points: Corp 3, Runner 0. Clicks accounted for: 4. Source log credit checkpoint: 3. Source log hand size: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [11:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=660s) | 1 | Basic draw 1, then Verbal Plasticity draws 1 additional card (first basic draw this turn). |
| [11:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=680s) | 1 | Install Docklands Pass for 2. |
| [11:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=710s) | 1 | Reload Smartware with 3. |
| [11:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=710s) | 1 | Gain 1 credit. |

### C7 · [12:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=720s)–12:40

Pool after this side-turn: **Corp 7, Runner 3**. Agenda points: Corp 3, Runner 0. Clicks accounted for: 3. Source log credit checkpoint: 7. Source log hand size: 2.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [12:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=720s) | — | Rez Nico before Corp turn for 2; load 9. |
| [12:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=720s) | — | Nico pays 3. |
| [12:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=730s) | — | Corp mandatory draw; no click spent. |
| [12:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=760s) | 1 | Install outer HQ ice for 1; later revealed as Palisade. |
| [12:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=760s) | 1 | Install concealed outer R&D ice for 1. |
| [12:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=760s) | 1 | Gain 1 credit. |

### R7 · [12:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=760s)–13:10

Pool after this side-turn: **Corp 7, Runner 4**. Agenda points: Corp 3, Runner 0. Clicks accounted for: 4. Source log credit checkpoint: 4. Source log hand size: 5.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [12:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=770s) | — | Smartware pays 1 at turn start. |
| [12:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=770s) | 1 | Basic draw 1, then Verbal Plasticity draws 1 additional card (first basic draw this turn). |
| [13:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=780s) | 1 | Install Unity for 2 after first-program DZMZ discount. |
| [13:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=790s) | 1 | Gain 1 credit. |
| [13:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=790s) | 1 | Gain 1 credit. |

### C8 · [13:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=800s)–13:50

Pool after this side-turn: **Corp 12, Runner 4**. Agenda points: Corp 3, Runner 0. Clicks accounted for: 3. Source log credit checkpoint: 12. Source log hand size: 2.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [13:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=800s) | — | Nico pays 3. |
| [13:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=800s) | — | Corp mandatory draw; no click spent. |
| [13:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=820s) | 1 | Draw 1 card; identity not established here. |
| [13:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=820s) | 1 | Install third R&D ice for 2; unrezzed throughout play. |
| [13:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=820s) | 1 | Hedge Fund: net +4. |

### R8 · [13:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=830s)–15:00

Pool after this side-turn: **Corp 12, Runner 7**. Agenda points: Corp 3, Runner 0. Clicks accounted for: 4. Source log credit checkpoint: 7. Source log hand size: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [14:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=850s) | — | Smartware pays 1 at turn start. |
| [14:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=850s) | 1 | Gain 1 credit. |
| [14:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=850s) | 1 | Gain 1 credit. |
| [14:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=850s) | 1 | Gain 1 credit. |
| [14:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=860s) | 1 | Tread Lightly HQ for 1; pass two unrezzed ice. |
| [14:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=880s) | — | Successful HQ: Leech +1; Docklands adds one access. |
| [14:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=890s) | — | Access Karunā and Predictive Planogram from HQ; leave both. |

### C9 · [15:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=900s)–15:50

Pool after this side-turn: **Corp 13, Runner 7**. Agenda points: Corp 3, Runner 0. Clicks accounted for: 3. Source log credit checkpoint: 13. Source log hand size: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [15:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=900s) | — | Nico pays last 3, trashes, and draws 1; separate from mandatory draw. |
| [15:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=920s) | — | Corp mandatory draw; no click spent. |
| [15:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=920s) | 1 | Draw 1 card; identity not established here. |
| [15:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=950s) | 1 | Install Orbital Superiority in Server 1. |
| [15:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=950s) | 1 | Install Brân 1.0 outside Tithe on Server 1 for 2. |

### R9 · [15:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=950s)–17:00

Pool after this side-turn: **Corp 13, Runner 5**. Agenda points: Corp 3, Runner 0. Clicks accounted for: 4. Source log credit checkpoint: 5. Source log hand size: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [16:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=960s) | — | Smartware pays 1 at turn start. |
| [16:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=960s) | 1 | Basic draw 1, then Verbal Plasticity draws 1 additional card (first basic draw this turn). |
| [16:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=990s) | 1 | Install Telework Contract for 1, load 9. |
| [16:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=1000s) | 1 | Basic Archives run; successful central adds 1 Leech counter (now 2). |
| [17:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1020s) | 1 | Install Carmen for 2: successful-run discount 2 plus first-program DZMZ discount 1. |

### C10 · [17:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1030s)–17:20

Pool after this side-turn: **Corp 17, Runner 5**. Agenda points: Corp 3, Runner 0. Clicks accounted for: 3. Source log credit checkpoint: 17. Source log hand size: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [17:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1030s) | — | Corp mandatory draw; no click spent. |
| [17:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1030s) | 1 | Government Subsidy: net +5. |
| [17:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1030s) | 1 | Advance Orbital once for 1. |
| [17:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=1040s) | 1 | Draw 1 card; identity not established here. |

### R10 · [17:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=1050s)–19:30

Pool after this side-turn: **Corp 11, Runner 8**. Agenda points: Corp 3, Runner 0. Clicks accounted for: 4. Source log credit checkpoint: 8. Source log hand size: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [18:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1090s) | 1 | Take 3 from Telework. |
| [18:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1090s) | 1 | Run Server 1. |
| [19:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1140s) | — | Corp rezzes Brân 1.0 for 6. |
| [19:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1150s) | 1 | Spend one remaining click to break only Brân’s install-ice subroutine. An unbroken end-the-run subroutine still ends the run. |
| [19:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=1170s) | 1 | Spend final click to reload Smartware with 3. |

### C11 · [19:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=1180s)–20:40

Pool after this side-turn: **Corp 7, Runner 8**. Agenda points: Corp 5, Runner 0. Clicks accounted for: 3. Source log credit checkpoint: 7. Source log hand size: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [19:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=1180s) | — | Corp mandatory draw; no click spent. |
| [19:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=1180s) | 1 | Seamless Launch for 1 adds 2 advancement to Orbital. |
| [19:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=1190s) | 1 | Advance Orbital once for 1 (total 4). |
| [19:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=1190s) | — | Score Orbital Superiority for 2 (Corp total 5); untagged Runner receives 1 tag. |
| [20:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=1240s) | 1 | Spend click and 2 credits to trash tagged Runner’s Telework; remaining 6 hosted credits lost. |

### R11 · [20:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=1240s)–22:30

Pool after this side-turn: **Corp 7, Runner 6**. Agenda points: Corp 5, Runner 0. Clicks accounted for: 4. Source log credit checkpoint: 6. Source log hand size: 5.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [20:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=1250s) | — | Smartware pays 1 at turn start. |
| [21:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1260s) | 1 | Spend click and 2 to remove tag. |
| [21:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1270s) | 1 | Overclock for 1 runs HQ; ice remain unrezzed. Its 5 temporary credits are unused and expire. |
| [21:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=1280s) | — | HQ success: Leech +1 (total 3); Docklands extra access. |
| [21:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=1290s) | — | Access Predictive Planogram and Karunā; leave both. |
| [21:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=1310s) | 1 | Gain 1 credit. |
| [21:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=1310s) | 1 | Last-click VRcation for 1: draw 4, no remaining click to lose. |
| [22:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=1350s) | — | Discard another VRcation to hand limit 5. |

### C12 · [22:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=1360s)–23:10

Pool after this side-turn: **Corp 7, Runner 6**. Agenda points: Corp 5, Runner 0. Clicks accounted for: 3. Source log credit checkpoint: 7. Source log hand size: 2.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [22:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=1360s) | — | Corp mandatory draw; no click spent. |
| [23:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1380s) | 1 | Install Superconducting Hub in Server 1. |
| [23:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1390s) | 1 | Install Karunā on new Server 2 for 0. |
| [23:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1390s) | 1 | Install Regolith Mining License in Server 2; identified when rezzed before C13 and visible there at 29:10. |

### R12 · [23:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1390s)–29:00

Pool after this side-turn: **Corp 8, Runner 1**. Agenda points: Corp 5, Runner 1. Clicks accounted for: 4. Source log credit checkpoint: 1. Source log hand size: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [24:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=1480s) | — | Smartware pays 1 at turn start. |
| [25:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1500s) | — | Several Cleaver install attempts, /undo-click commands and manual return-to-grip operations while resolving memory. Count only final accepted install. **[booster-memory-undo]** |
| [26:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=1600s) | 1 | Final Cleaver install costs 2 with DZMZ. Mayfly is removed to fit memory. **[booster-memory-undo]** |
| [26:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=1610s) | 1 | Gain 1 credit. |
| [26:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=1610s) | 1 | Run Server 1. |
| [27:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1620s) | — | Spend all 3 Leech counters: Brân strength 6 → 3 for this encounter. |
| [27:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=1640s) | — | Cleaver pays 2 to break all three Brân subroutines, with no strength boost. |
| [28:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=1700s) | — | Carmen pays 1 to break only Tithe’s net-damage subroutine. |
| [28:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=1700s) | — | Allow Tithe’s remaining gain-credit subroutine: Corp +1. |
| [28:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=1710s) | — | Cleaver boosts once for 2 and breaks remote Palisade for 1, total 3. |
| [29:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1740s) | — | Steal Superconducting Hub for 1; remote run does not refill Leech. |
| [29:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1740s) | 1 | Gain 1 credit. |

### C13 · [29:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1740s)–29:30

Pool after this side-turn: **Corp 12, Runner 1**. Agenda points: Corp 5, Runner 1. Clicks accounted for: 3. Source log credit checkpoint: 12. Source log hand size: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [29:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1740s) | — | Rez Regolith Mining License in Server 2 for 2; load 15. |
| [29:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1750s) | — | Corp mandatory draw; no click spent. |
| [29:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=1760s) | 1 | Take 3 from Regolith. |
| [29:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=1760s) | 1 | Draw 1 card; identity not established here. |
| [29:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=1770s) | 1 | Take 3 from Regolith. |

### R13 · [29:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=1770s)–30:00

Pool after this side-turn: **Corp 12, Runner 5**. Agenda points: Corp 5, Runner 1. Clicks accounted for: 4. Source log credit checkpoint: 5. Source log hand size: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [29:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=1780s) | — | Smartware pays 1 at turn start. |
| [29:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=1790s) | 1 | Install second DZMZ Optimizer for 2. |
| [29:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=1790s) | 1 | Basic draw 1, then Verbal Plasticity draws 1 additional card (first basic draw this turn). |
| [30:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1800s) | 1 | Gain 1 credit. |
| [30:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1800s) | 1 | Last-click Creative Commission: net +4. |

### C14 · [30:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=1830s)–30:40

Pool after this side-turn: **Corp 21, Runner 5**. Agenda points: Corp 5, Runner 1. Clicks accounted for: 3. Source log credit checkpoint: 21. Source log hand size: 5.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [30:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=1830s) | — | Corp mandatory draw; no click spent. |
| [30:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=1840s) | 1 | Take 3 from Regolith; after third use it is empty and trashes. |
| [30:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=1840s) | 1 | Take 3 from Regolith; after third use it is empty and trashes. |
| [30:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=1840s) | 1 | Take 3 from Regolith; after third use it is empty and trashes. |

### R14 · [30:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=1850s)–32:00

Pool after this side-turn: **Corp 21, Runner 4**. Agenda points: Corp 5, Runner 1. Clicks accounted for: 4. Source log credit checkpoint: 4. Source log hand size: 5.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [31:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1860s) | 1 | Reload Smartware with 3. |
| [31:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1860s) | 1 | Wildcat Strike for 2; Corp chooses Runner draw 4. |
| [31:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=1910s) | 1 | Install Mayfly for 0 with two DZMZ discounts (cost cannot go below 0). |
| [32:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1920s) | 1 | Gain 1 credit. |
| [32:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=1920s) | — | Discard Mutual Favor to hand limit 5. |

### C15 · [32:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1930s)–32:20

Pool after this side-turn: **Corp 25, Runner 4**. Agenda points: Corp 5, Runner 1. Clicks accounted for: 3. Source log credit checkpoint: 25. Source log hand size: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [32:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1930s) | — | Corp mandatory draw; no click spent. |
| [32:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1930s) | 1 | Hedge Fund: net +4. |
| [32:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=1930s) | 1 | Install a concealed root card in Server 1; final board shows an unrezzed root alongside Send a Message. |
| [32:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=1940s) | 1 | Install Urtica Cipher in now-empty Server 2; identified when accessed R16. |

### R15 · [32:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=1940s)–34:40

Pool after this side-turn: **Corp 20, Runner 5**. Agenda points: Corp 5, Runner 1. Clicks accounted for: 4. Source log credit checkpoint: 5. Source log hand size: 5.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [33:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=2000s) | — | Smartware pays 1 at turn start. |
| [33:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=2000s) | 1 | Gain 1 credit. |
| [33:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=2000s) | 1 | Gain 1 credit. |
| [33:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=2000s) | 1 | Gain 1 credit. |
| [33:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=2010s) | 1 | Run HQ. |
| [33:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=2030s) | — | Corp rezzes outer Palisade for 3 and inner Diviner for 2. |
| [33:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=2030s) | — | Cleaver pays 1 to break central Palisade. |
| [34:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=2070s) | — | Unity boosts once for 1 (four installed breakers give +4 strength) and breaks Diviner for 1. |
| [34:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=2070s) | — | HQ success: Leech +1; Docklands adds access. |
| [34:40](https://www.youtube.com/watch?v=NwMp40meA1A&t=2080s) | — | Access Predictive Planogram and Retribution; leave both. |

### C16 · [34:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=2090s)–35:00

Pool after this side-turn: **Corp 18, Runner 5**. Agenda points: Corp 5, Runner 1. Clicks accounted for: 3. Source log credit checkpoint: 18. Source log hand size: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [34:50](https://www.youtube.com/watch?v=NwMp40meA1A&t=2090s) | — | Corp mandatory draw; no click spent. |
| [35:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=2100s) | 1 | Install Send a Message in Server 1. |
| [35:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=2100s) | 1 | Advance Send a Message once for 1. |
| [35:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=2100s) | 1 | Advance Send a Message once for 1. |

### R16 · [35:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=2110s)–37:10

Pool after this side-turn: **Corp 14, Runner 5**. Agenda points: Corp 5, Runner 1. Clicks accounted for: 4. Source log credit checkpoint: 5. Source log hand size: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [36:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=2160s) | — | Smartware pays 1 at turn start. |
| [36:00](https://www.youtube.com/watch?v=NwMp40meA1A&t=2160s) | 1 | Run Server 2. |
| [36:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=2180s) | — | Corp rezzes Karunā for 4. |
| [36:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=2180s) | — | Carmen boosts for 2 and breaks both Karunā subroutines for 2, total 4. |
| [36:30](https://www.youtube.com/watch?v=NwMp40meA1A&t=2190s) | — | Access unadvanced installed Urtica: 2 net damage trashes Jailbreak and a second Leech from grip. Installed Leech survives. |
| [37:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=2230s) | 1 | Gain 1 credit. |
| [37:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=2230s) | 1 | Gain 1 credit. |
| [37:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=2230s) | 1 | Gain 1 credit. |

### C17 · [37:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=2230s)–37:35

Pool after this side-turn: **Corp 11, Runner 5**. Agenda points: Corp 8, Runner 1. Clicks accounted for: 3. Source log credit checkpoint: 11.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [37:10](https://www.youtube.com/watch?v=NwMp40meA1A&t=2230s) | — | Corp mandatory draw; no click spent. |
| [37:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=2240s) | 1 | Advance Send a Message once for 1 (ends with 5 advancement). |
| [37:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=2240s) | 1 | Advance Send a Message once for 1 (ends with 5 advancement). |
| [37:20](https://www.youtube.com/watch?v=NwMp40meA1A&t=2240s) | 1 | Advance Send a Message once for 1 (ends with 5 advancement). |
| [37:25](https://www.youtube.com/watch?v=NwMp40meA1A&t=2245s) | — | Score Send a Message for 3: Corp total 8, Runner 1. Corp wins. |
| [37:35](https://www.youtube.com/watch?v=NwMp40meA1A&t=2255s) | — | Post-win source log shows optional free rez of Karunā from Send a Message. It is not needed to establish the terminal result. |

