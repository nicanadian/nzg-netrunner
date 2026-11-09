# Neon Static — System Gateway starter demonstration

[Source recording](https://www.youtube.com/watch?v=EpoV0ezJFFg). Reviewed 2026-11-06.

34/30-card starter decks; players explicitly announce a 6-point target. Result: **runner wins, Corp 3–Runner 7**.

**Status:** source observation ledger with explicit gaps. A [verified, normalized full-game reconstruction](../../../eval/recorded-games/neon-starter-full-replay.json) is available; see the [end-to-end audit](end-to-end-audit.md) for corrections and chosen hidden information. The original shuffle remains unknown.

Approximate navigation anchors; Jinteki log observations sampled every 10 seconds. They are not wall-clock action times. Credit columns below are reconstructed pool credits after each side-turn, including opponent payments during that turn; hosted/run credits are recorded separately in the JSON.

[Machine-readable ledger](../../../eval/recorded-games/neon-starter.json).

## Reconstruction issues

- **neon-opening-install-order** (uncertainty; C1): All three installed cards are identified by the first run. Their exact installation order is uncertain from the caption placement references; listed per-click identities are a possible ordering only. The resulting Remote 1 contains Tithe, Regolith and Manegarm.
- **neon-R4-click** (gap; R4): Only two Sure Gambles and a Telework install are narrated, then the turn ends. A missing click or physical click-accounting error remains. The next spoken 15-credit checkpoint agrees with no extra credit action.
- **neon-mayfly-reminder** (source correction; R5, C6): Mayfly is used during R5 and belongs in the heap at that run end. The physical reminder occurs early C6; it is not another game action.
- **neon-hidden-order** (reproduction blocker; C1, C2, C3, R7, R8, C12, R12, C13): No original deck shuffle or complete Corp hand/draw history. Some R&D accesses, two discards, the HQ ice and an unaccessed late remote remain unidentified. Their identities must remain unknown or become labelled synthetic completions in an engine fixture.

## Turn ledger

### C1 · [01:19](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=79s)–02:10

Pool after this side-turn: **Corp 5, Runner 5**. Agenda points: Corp 0, Runner 0. Clicks accounted for: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [01:19](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=79s) | — | Corp mandatory draw; no click spent. |
| [01:37](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=97s) | 1 | Install a root card in new Remote 1; later access establishes Regolith Mining License. **[neon-opening-install-order]** |
| [01:42](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=102s) | 1 | Install Tithe protecting Remote 1. **[neon-opening-install-order]** |
| [01:49](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=109s) | 1 | Install a second root card in Remote 1; later rez establishes Manegarm Skunkworks. **[neon-opening-install-order]** |

### R1 · [02:17](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=137s)–06:40

Pool after this side-turn: **Corp 3, Runner 1**. Agenda points: Corp 0, Runner 1. Clicks accounted for: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [02:17](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=137s) | 1 | Play Sure Gamble: pay 5, gain 9. |
| [02:35](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=155s) | 1 | Install Mayfly for 1. |
| [02:48](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=168s) | 1 | Play Overclock for 1; load 5 temporary credits and run Remote 1. |
| [03:06](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=186s) | — | Corp rezzes Tithe for 1. |
| [03:40](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=220s) | — | Allow Tithe: 1 net damage randomly trashes the other Mayfly from grip; installed Mayfly is unused. |
| [03:45](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=225s) | — | Allow Tithe: Corp gains 1. |
| [03:58](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=238s) | — | Corp rezzes Manegarm Skunkworks for 2 before server approach. |
| [04:11](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=251s) | — | Pay Manegarm with all 5 Overclock credits; pool stays 7. |
| [05:18](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=318s) | — | Access and trash Regolith Mining License for 3 and Manegarm for 3; runner pool becomes 1. |
| [05:40](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=340s) | 1 | Play Jailbreak on HQ; draw 1, access 2. Accessed identities are Superconducting Hub and Seamless Launch. |
| [06:20](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=380s) | — | Steal Superconducting Hub for 1 point; leave Seamless Launch. |

### C2 · [06:44](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=404s)–07:05

Pool after this side-turn: **Corp 4, Runner 1**. Agenda points: Corp 0, Runner 1. Clicks accounted for: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [06:44](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=404s) | — | Corp mandatory draw; no click spent. |
| [06:49](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=409s) | 1 | Draw 1 card; identity not established here. |
| [06:57](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=417s) | 1 | Install ice protecting one central (HQ/R&D); exact identity and central assignment unresolved. |
| [07:00](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=420s) | 1 | Gain 1 credit. |

### R2 · [07:12](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=432s)–07:34

Pool after this side-turn: **Corp 4, Runner 1**. Agenda points: Corp 0, Runner 1. Clicks accounted for: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [07:12](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=432s) | 1 | Draw 1 card; identity not established here. |
| [07:16](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=436s) | 1 | Draw 1 card; identity not established here. |
| [07:19](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=439s) | 1 | Install Smartware Distributor for 0. |
| [07:29](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=449s) | 1 | Spend a click to load 3 onto Smartware. |

### C3 · [07:36](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=456s)–08:00

Pool after this side-turn: **Corp 5, Runner 1**. Agenda points: Corp 0, Runner 1. Clicks accounted for: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [07:36](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=456s) | — | Corp mandatory draw; no click spent. |
| [07:38](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=458s) | 1 | Draw 1 card; identity not established here. |
| [07:44](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=464s) | 1 | Install ice on the other central. Later free rez identifies R&D ice as Karunā; HQ ice remains concealed. |
| [07:48](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=468s) | 1 | Gain 1 credit. |

### R3 · [08:04](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=484s)–08:46

Pool after this side-turn: **Corp 5, Runner 6**. Agenda points: Corp 0, Runner 1. Clicks accounted for: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [08:04](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=484s) | — | Smartware pays 1 at turn start. |
| [08:10](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=490s) | 1 | Draw 1 card; identity not established here. |
| [08:10](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=490s) | 1 | Draw 1 card; identity not established here. |
| [08:10](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=490s) | 1 | Draw 1 card; identity not established here. |
| [08:26](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=506s) | 1 | Play Creative Commission on last click: pay 1, gain 5; no remaining click to lose. |

### C4 · [08:48](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=528s)–09:22

Pool after this side-turn: **Corp 15, Runner 6**. Agenda points: Corp 0, Runner 1. Clicks accounted for: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [08:48](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=528s) | — | Corp mandatory draw; no click spent. |
| [08:51](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=531s) | 1 | Play Hedge Fund: pay 5, gain 9. |
| [09:09](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=549s) | 1 | Gain 1 credit. |
| [09:13](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=553s) | 1 | Play Government Subsidy: pay 10, gain 15. |

### R4 · [09:26](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=566s)–10:44

Pool after this side-turn: **Corp 15, Runner 14**. Agenda points: Corp 0, Runner 1. Clicks accounted for: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [09:26](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=566s) | — | Smartware pays 1. |
| [09:54](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=594s) | 1 | Play Sure Gamble: pay 5, gain 9. |
| [10:11](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=611s) | 1 | Play second Sure Gamble: pay 5, gain 9. |
| [10:29](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=629s) | 1 | Install Telework Contract for 1 and load 9. |
| [10:44](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=644s) | 1 | Turn ends after three narrated actions. Fourth click is not established; do not insert a draw, credit, or Telework activation. **[neon-R4-click]** |

### C5 · [10:47](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=647s)–11:53

Pool after this side-turn: **Corp 14, Runner 14**. Agenda points: Corp 0, Runner 1. Clicks accounted for: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [10:47](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=647s) | — | Corp mandatory draw; no click spent. |
| [10:55](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=655s) | 1 | Draw 1 card; identity not established here. |
| [11:03](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=663s) | 1 | Install a second Tithe outside Remote 1 ice, paying 1 install credit. |
| [11:24](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=684s) | 1 | Install Send a Message in Remote 1. |

### R5 · [11:54](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=714s)–13:57

Pool after this side-turn: **Corp 13, Runner 14**. Agenda points: Corp 0, Runner 4. Clicks accounted for: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [11:54](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=714s) | — | Smartware pays last credit. |
| [12:05](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=725s) | 1 | Draw 1 card; identity not established here. |
| [12:10](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=730s) | 1 | Run Remote 1. |
| [12:17](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=737s) | — | Corp rezzes outer Tithe for 1. |
| [12:44](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=764s) | — | Use Mayfly to break both subroutines on outer Tithe for 2. |
| [12:58](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=778s) | — | Use Mayfly to break both subroutines on inner Tithe for 2. |
| [13:06](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=786s) | — | Steal Send a Message: +3 points, total 4. |
| [13:23](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=803s) | — | Send a Message lets Corp rez Karunā protecting R&D at no cost. |
| [13:30](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=810s) | — | Used Mayfly should trash at run end; players physically remember this at 14:12. **[neon-mayfly-reminder]** |
| [13:41](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=821s) | 1 | Draw 1 card; identity not established here. |
| [13:49](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=829s) | 1 | Take 3 from first Telework Contract. |

### C6 · [14:02](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=842s)–14:35

Pool after this side-turn: **Corp 11, Runner 14**. Agenda points: Corp 0, Runner 4. Clicks accounted for: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [14:02](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=842s) | — | Corp mandatory draw; no click spent. |
| [14:06](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=846s) | 1 | Draw 1 card; identity not established here. |
| [14:06](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=846s) | 1 | Draw 1 card; identity not established here. |
| [14:18](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=858s) | 1 | Install third ice on Remote 1 for 2; later rez identifies Whitespace. |

### R6 · [14:36](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=876s)–15:14

Pool after this side-turn: **Corp 11, Runner 21**. Agenda points: Corp 0, Runner 4. Clicks accounted for: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [14:48](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=888s) | 1 | Draw 1 card; identity not established here. |
| [14:58](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=898s) | 1 | Draw 1 card; identity not established here. |
| [15:03](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=903s) | 1 | Take 3 from Telework. |
| [15:10](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=910s) | 1 | Last-click Creative Commission: net +4. |

### C7 · [15:16](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=916s)–15:58

Pool after this side-turn: **Corp 16, Runner 21**. Agenda points: Corp 0, Runner 4. Clicks accounted for: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [15:16](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=916s) | — | Corp mandatory draw; no click spent. |
| [15:24](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=924s) | 1 | Government Subsidy: pay 10, gain 15. |
| [15:33](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=933s) | 1 | Install Nico Campaign in new, unprotected Remote 2. |
| [15:40](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=940s) | 1 | Install Offworld Office in Remote 1. |

### R7 · [15:59](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=959s)–16:55

Pool after this side-turn: **Corp 16, Runner 15**. Agenda points: Corp 0, Runner 4. Clicks accounted for: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [15:59](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=959s) | 2 | Play VRcation: pay 1, draw 4, lose one remaining click. |
| [16:24](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=984s) | 1 | Install Pennyshaver for 3. |
| [16:34](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=994s) | 1 | Install Docklands Pass for 2. |
| [16:48](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1008s) | — | Discard 1 unidentified card to hand limit. |

### C8 · [16:56](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1016s)–18:40

Pool after this side-turn: **Corp 21, Runner 15**. Agenda points: Corp 2, Runner 4. Clicks accounted for: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [16:56](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1016s) | — | Rez Nico before Corp turn for 2; load 9. |
| [17:30](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1050s) | — | Take 3 from Nico at turn start. |
| [17:40](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1060s) | — | Corp mandatory draw; no click spent. |
| [17:43](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1063s) | 1 | Advance Offworld Office for 1. |
| [17:46](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1066s) | 1 | Advance Offworld Office for 1. |
| [17:51](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1071s) | 1 | Seamless Launch costs 1, adds 2 advancement to previously installed Offworld. |
| [18:10](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1090s) | — | Score Offworld Office for 2 points; gain 7. |

### R8 · [18:42](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1122s)–21:04

Pool after this side-turn: **Corp 21, Runner 6**. Agenda points: Corp 2, Runner 4. Clicks accounted for: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [18:42](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1122s) | 1 | Run unprotected Remote 2; successful: Pennyshaver +1. |
| [18:57](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1137s) | — | Access and trash Nico for 2; its 6 remaining hosted credits are lost. |
| [19:11](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1151s) | 1 | Install Carmen for 3 using successful-run discount. |
| [19:51](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1191s) | 1 | Play Jailbreak on R&D; draw 1 and access 2 if successful. |
| [20:06](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1206s) | — | Karunā: boost Carmen once for 2 and break both subroutines for 2. |
| [20:35](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1235s) | — | Successful R&D run: Pennyshaver +1. Access two unidentified non-agendas; leave both. |
| [20:59](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1259s) | 1 | Load 3 onto Smartware. |

### C9 · [21:06](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1266s)–21:38

Pool after this side-turn: **Corp 17, Runner 6**. Agenda points: Corp 2, Runner 4. Clicks accounted for: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [21:06](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1266s) | — | Corp mandatory draw; no click spent. |
| [21:10](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1270s) | 1 | Install fourth ice protecting Remote 1 for 3; later revealed as Brân 1.0. |
| [21:21](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1281s) | 1 | Install Superconducting Hub in Remote 1. |
| [21:23](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1283s) | 1 | Advance Hub once for 1. |

### R9 · [21:40](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1300s)–22:59

Pool after this side-turn: **Corp 12, Runner 8**. Agenda points: Corp 2, Runner 4. Clicks accounted for: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [21:40](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1300s) | — | Smartware pays 1. |
| [21:43](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1303s) | 1 | Tread Lightly for 1 runs Remote 1; Corp leaves outer Brân unrezzed. |
| [21:55](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1315s) | — | Rez Whitespace at +3 Tread Lightly tax: 2 + 3 = 5. |
| [22:05](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1325s) | — | Whitespace makes Runner lose 3; remaining pool 3 is ≤6, so next subroutine ends run. |
| [22:22](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1342s) | 1 | Take final 3 from first Telework; trash empty contract. |
| [22:36](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1356s) | 1 | Install second Telework for 1; load 9. |
| [22:55](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1375s) | 1 | Take 3 from second Telework. |

### C10 · [23:01](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1381s)–23:40

Pool after this side-turn: **Corp 14, Runner 8**. Agenda points: Corp 3, Runner 4. Clicks accounted for: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [23:01](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1381s) | — | Corp mandatory draw; no click spent. |
| [23:07](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1387s) | 1 | Advance Hub for 1. |
| [23:10](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1390s) | 1 | Advance Hub for 1. |
| [23:15](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1395s) | — | Score Hub for 1 point; draw 2 and increase Corp maximum hand size by 2. |
| [23:29](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1409s) | 1 | Hedge Fund: net +4. |

### R10 · [23:41](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1421s)–24:34

Pool after this side-turn: **Corp 14, Runner 9**. Agenda points: Corp 3, Runner 4. Clicks accounted for: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [23:41](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1421s) | — | Smartware pays 1. |
| [23:48](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1428s) | 1 | Draw 1 card; identity not established here. |
| [23:55](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1435s) | 1 | Install Unity for 3. |
| [24:26](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1466s) | 1 | Draw 1 card; identity not established here. |
| [24:29](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1469s) | 1 | Take 3 from second Telework. |

### C11 · [24:36](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1476s)–24:57

Pool after this side-turn: **Corp 14, Runner 9**. Agenda points: Corp 3, Runner 4. Clicks accounted for: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [24:36](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1476s) | — | Corp mandatory draw; no click spent. |
| [24:38](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1478s) | 1 | Draw 1 card; identity not established here. |
| [24:38](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1478s) | 1 | Draw 1 card; identity not established here. |
| [24:43](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1483s) | 1 | Install Urtica Cipher in Remote 1; identity established later when overwritten. |

### R11 · [24:59](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1499s)–25:39

Pool after this side-turn: **Corp 14, Runner 10**. Agenda points: Corp 3, Runner 4. Clicks accounted for: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [24:59](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1499s) | — | Smartware pays final credit. |
| [25:07](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1507s) | 1 | Draw 1 card; identity not established here. |
| [25:19](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1519s) | 1 | Draw 1 card; identity not established here. |
| [25:23](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1523s) | 1 | Take final 3 from second Telework; trash it. |
| [25:32](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1532s) | 1 | Install Cleaver for 3. |

### C12 · [25:41](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1541s)–26:30

Pool after this side-turn: **Corp 14, Runner 10**. Agenda points: Corp 3, Runner 4. Clicks accounted for: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [25:41](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1541s) | — | Corp mandatory draw; no click spent. |
| [25:43](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1543s) | 1 | Draw 1 card; identity not established here. |
| [25:43](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1543s) | 1 | Draw 1 card; identity not established here. |
| [25:52](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1552s) | 1 | Install a concealed card in a new unprotected remote; it is never accessed/revealed. |
| [26:00](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1560s) | — | Discard Palisade to Archives for hand limit 7. |

### R12 · [26:33](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1593s)–27:56

Pool after this side-turn: **Corp 14, Runner 7**. Agenda points: Corp 3, Runner 4. Clicks accounted for: 4.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [26:33](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1593s) | 1 | Install Red Team for 5; load 12. |
| [26:40](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1600s) | 1 | Red Team run Archives: take 3; Pennyshaver +1. Access Archives, including discarded Palisade. |
| [27:02](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1622s) | 1 | Red Team run R&D; use Carmen for 4 to pass Karunā, take 3 from Red Team; Pennyshaver +1. Leave unseen non-agenda. |
| [27:46](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1666s) | 1 | Reload Smartware with 3. |

### C13 · [28:15](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1695s)–29:18

Pool after this side-turn: **Corp 13, Runner 7**. Agenda points: Corp 3, Runner 4. Clicks accounted for: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [28:15](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1695s) | — | Corp mandatory draw; no click spent. |
| [29:00](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1740s) | 1 | Draw 1 card; identity not established here. |
| [29:05](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1745s) | 1 | Install Send a Message in Remote 1, trashing the existing Urtica Cipher. |
| [29:11](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1751s) | 1 | Advance Send a Message once for 1. |
| [29:16](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1756s) | — | Discard one unidentified card to maximum hand size 7. |

### R13 · [29:19](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1759s)–31:50

Pool after this side-turn: **Corp 7, Runner 3**. Agenda points: Corp 3, Runner 7. Clicks accounted for: 3.

| Video anchor | Clicks | Action and result |
|---|---:|---|
| [29:19](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1759s) | — | Smartware pays 1. |
| [30:00](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1800s) | 1 | Red Team run Archives: take 3; Pennyshaver +1. Observe Urtica and Palisade in Archives. |
| [30:41](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1841s) | 1 | Click Pennyshaver: add 1, then take all 6 hosted credits. |
| [30:58](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1858s) | 1 | Run Remote 1 with 17 credits. |
| [31:03](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1863s) | — | Corp rezzes Brân 1.0 for 6. |
| [31:11](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1871s) | — | Boost Cleaver three times (6 total), then pay 2 to break all three Brân subroutines. |
| [31:28](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1888s) | — | Use Unity to break both Whitespace subroutines for 2; no strength boost required. |
| [31:35](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1895s) | — | Use Carmen to break both subroutines on each of two Tithes, total 4. |
| [31:42](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1902s) | — | Successful remote run adds 1 to Pennyshaver. |
| [31:47](https://www.youtube.com/watch?v=EpoV0ezJFFg&t=1907s) | — | Access and steal Send a Message for 3, reaching 7; Runner wins with 3 pool credits and one click unused. |

