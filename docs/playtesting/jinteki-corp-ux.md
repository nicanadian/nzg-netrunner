# Jinteki Corp UX playtest — 2026-11-07

Completed an isolated Jinteki **Beginner** match through a real Runner win on **Runner turn 11, 6–2**, plus a separate Local Table Corp game through a real AI Runner win on turn 3, 7–0. The strongest transferable Jinteki feature is its quoted-cost **match strength and fully break** shortcut, which retains individual pump/break controls. Local Table's strongest observed advantage is explicit cost, destination and resource-change guidance around Corp decisions.

## Method and evidence limits

GPT-6.1 Sol agent-operated browser work, not recruited human playtesting. Initially paired with a separate Runner agent for the Intermediate opening; subsequently one agent controlled both views of the isolated Beginner game. Self-play samples interaction and rules presentation, not hidden-information strategy, balance or competitive strength.

The user chose the shared T3 preview browser after the Chrome extension host was unavailable. All gameplay used normal UI controls, including inspected visible enabled DOM controls through their normal click handlers when preview automation was slow. Read-only DOM inspection supplied visible text and selectors. No engine globals, game APIs, imports, scripted positions, concessions or source changes. Some actions were batched, with visible phase/counter changes checked between dependent actions.

Snapshots repeatedly timed out on both apps. These findings concern observed text and controls; **no image-based visual hierarchy or small-print readability assessment is claimed**. Tool locator failures and stale immediate reads are excluded from game-defect findings. The user's default-profile game and original server were untouched. Own test tabs were closed after saving evidence.

## Completed Beginner match

Native neutral **The Syndicate: Profit over Principle vs The Catalyst: Convention Breaker**, 34-card Corp / 30-card Runner, six points required. Both original hands were untouched and kept. Isolated server port 1043 used the `intermediate` route/account key but initialized native Beginner lists; original visible deck-plus-hand totals and six-point target were verified before play.

| Round | Corp decisions | Runner decisions |
| --- | --- | --- |
| 1 | Install/rez/use Regolith; Palisade on R&D | Telework, Mayfly, Jailbreak HQ; draw one/access two ice |
| 2 | Hedge Fund; Diviner HQ; draw | Telework; Jailbreak R&D; Mayfly auto-break Palisade; trash Urtica for 2; leave Manegarm; Cleaver; draw |
| 3 | Brân into new scoring remote; draw; Regolith income | Final Telework payout; Unity; VRcation |
| 4 | Draw Hub; install behind Brân; Government Subsidy | New Telework; Overclock R&D; Cleaver full-break; access Seamless; Smartware |
| 5 | Seamless plus advancement; score Hub (1); draw two; Karunā on R&D | Telework; Pennyshaver; run Regolith but cannot afford its 3-credit trash; cash Pennyshaver |
| 6 | Draw twice seeking agendas; install second Hub; discard spare Tithe | Final Telework; run/trash Regolith; draw; Creative Commission last click |
| 7 | Seamless/advance/score Hub (2); draw two; Whitespace outside Brân | HQ pressure, Unity auto-break Diviner; access Tithe; draw three |
| 8 | Hedge Fund; install/advance Send a Message | Overclock scoring remote; Unity breaks Whitespace; three clicks break Brân; steal Message (3). Corp free-rezzes Karunā on R&D |
| 9 | New Regolith, rez/use; draw | Red Team; cash Pennyshaver; VRcation finds Carmen and economy |
| 10 | Regolith income; Hedge Fund; draw | Red Team HQ, Unity break; leave Nico; cash Pennyshaver; Sure Gamble; Carmen |
| 11 | Install Manegarm and Message in scoring remote; advance Message | Run remote; pay 2 for Whitespace; three clicks through Brân; Corp rezzes Manegarm; pay final 5; access/steal Message and win 6–2 |

No crash occurred during this match. The final log explicitly says `GatewayInterRunner wins the game.` Both complete visible terminal views are saved:

- [Corp terminal text and full log](../../eval/jinteki-ux/corp-beginner-terminal-corp.txt)
- [Runner terminal text and full log](../../eval/jinteki-ux/corp-beginner-terminal-runner.txt)

At victory the Corp still has a Send a Message target prompt, while the Runner rail says **“Waiting for Corp to resolve pending triggers.”** This conflicts with the terminal log/score and could leave a newcomer unsure the game is over. The pending position was preserved; no attempt was made to force post-win resolution. The `/save-replay` menu item was inspected/clicked, but no downloadable artifact was returned; the text evidence is the durable Jinteki record.

## Jinteki controls worth referencing

**Quoted-cost breaker shortcuts.** Clicking installed Mayfly during the Palisade encounter opened its abilities menu. Alongside manual `1 credit: Break 1 subroutine` and `1 credit: Add 1 strength`, it offered **`2 credits: Match strength and fully break Palisade`** and `1 credit: Match strength of Palisade`. One choice paid from the ordinary pool, raised Mayfly 1→2, broke Palisade's one subroutine and marked Mayfly for run-end trash. No separate payment-source prompt was needed in that position. The log confirmed all effects and run-end trash.

Unity similarly quoted `2 credits: Match strength and fully break Diviner`, correctly using its pump based on installed icebreakers. Cleaver offered `1 credit: Fully break Palisade` when already strong enough. This is useful expert convenience without removing manual control. This Corp-focused Local Table game did not exercise its Runner break workflow, so the direct encounter comparison belongs with the separate Runner report.

**Explicit source selection when necessary.** With Overclock credits available, a full-break selection opened `Choose a credit providing card (0 of 2 credits)` with Overclock and Done. Each source click supplied one credit; at two credits the payment completed automatically. This preserves control but adds repeated source clicks even when spending temporary run credits is the obvious choice.

**Bioroid interaction stays on the relevant ice.** Brân's own card menu exposes `Lose click: Break 1 subroutine`. Its persistent prompt removes each chosen subroutine while clicks fall 3→0. There were two identical `End the run` choices without ordinal context; broken marks and log show progress, but labels could be more specific. This matters when only some duplicate-looking subroutines are to be broken.

**Opponent-controlled consequences are clear.** Source-card prompts include explicit alternatives. In the inherited Intermediate opening, Wildcat Strike offered Runner gains 6 credits versus Runner draws 4 cards; Corp chose draw-four. In Beginner, Hub scoring asked `Draw 2 cards? Yes/No` and updated HQ limit from 5→7, then 7→9. Manegarm offered `Pay 5` versus `End the run` when Runner had zero clicks; an unaffordable click-payment choice was absent.

**Useful reference and recovery.** Run Timing and Turn Timing expose a numbered reference beside the board. They distinguish ice rez permissions, non-ice windows, scoring, jack-out and run end. This is detailed reference rather than a short instruction for the present decision. Captures: [run timing](../../eval/jinteki-ux/corp-run-timing.txt), [turn timing](../../eval/jinteki-ux/corp-turn-timing.txt). `/` exposes `/undo-click`, `/undo-paid-ability`, `/undo-turn`, `/counter type n` and `/close-prompt`. Manual credit/click controls are also present. Recovery was inspected without undoing decisions or altering counters.

## Friction and comparison lessons

| Observed Jinteki behavior | Direct Local Table observation / lesson |
| --- | --- |
| Initial Keep/Mulligan appears in both intro and action rail; later Start Game dismisses the intro, then Start Turn begins play | Local Table kept hand, resolved AI mulligan and mandatory draw directly into the first action. Fewer ceremonies help teaching |
| Installing uses a per-card inline servers menu while main rail stays generic | Local Table's action rail lists card → destination, thumbnail, click cost and “Rez cost paid later.” More verbose, more explicit |
| Direct `Rez Diviner` / `Rez Palisade` names the legal action but omits its credit cost | Local Table quotes rez cost before commitment and separates pool change from hosted counters afterward |
| Hub's card menu gains Score after third advancement; main rail stays generic | Make readiness apparent without requiring a player to reopen the card. Local Table's observed Advance action quotes click and credit costs; scoring itself was not reached in that sample |
| Telework clicked after its once-per-turn use gives no explanation and changes nothing | A disabled-action reason such as “Already used this turn” would support recall of printed restrictions |
| Log gives exact payments/destinations but Corp sees both private named installation and generic public installation entries; ice positions begin at 0 | Local Table uses “ice 1 from outside” and resource receipts. Preserve exact cause/effect while reducing duplicate prose and internal numbering |
| Both players pass run priority; next-phase labels help orientation | This is expected multiplayer procedure, not a rules defect. Local Table's AI resolves opposing passes automatically, so raw interaction count is not directly comparable |
| Win log/6 points coexist with pending-trigger rail | Make terminal status override stale decision guidance; preserve optional post-game inspection separately |

Hidden information was correctly represented at the UI level: Corp saw its named facedown installs; Runner saw facedown corp cards and advancement counters until access. No hidden engine state was inspected. Self-play still means the operator knew both hands, so no strategic inference test is claimed.

## Local Table completed comparison game

Fresh incognito session on localhost:5179: **Haas-Bioroid: Precision Design v2 (44 cards shown in lobby) vs René Loup Arcemont v1 (40 cards)**. These faction decks and identities differ from Jinteki's neutral teaching lists, so economy and outcome differences cannot be attributed to interface or engine alone.

The AI Runner won 7–0 on turn 3. First-turn central accesses yielded Send a Message (3) and Luminal Transubstantiation (2); the final unprotected remote yielded Offworld Office (2). Corp protected both centrals and built economy but left the new scoring remote unprotected. This short game with poor defense is a limited UX sample, not AI-strength or balance evidence.

Directly exercised installation, Regolith rez/payout/hosted counters, Send a Message's free rez of Brân, Ansel installation, Spin Doctor rez/draw-two, its paid-window remove/shuffle recycling Regolith, operation targeting/cancellation, advancing Offworld twice and terminal feedback. The unified guidance and explicit resource receipts were helpful. Between some own actions, “Your opponent is considering the position / Calculating the next move” described an AI response window; this wording can obscure whose turn it is. Spin Doctor's own Corp effects also appeared under Runner-turn activity, so actor and turn labels should remain distinct.

Cancelling Seamless target selection correctly restored the card; the newly installed Offworld was correctly absent from legal targets. However the last-action receipt said `Ansel 1.0 · R&D · ice 1 from outside` despite cancelling, which could imply the highlighted target resolved. The native replay records `cancel: true`.

Menu clearly exposes autosave wording, `Undo your last decision`, and replay export/import. Undo discoverability was inspected without changing the game. Ordinary UI export saved [corp-local-table-replay.json](../../eval/jinteki-ux/corp-local-table-replay.json), including seed, presets and `conceded: false`. No replay was imported or scripted.

## Inherited Intermediate opening, separately scoped

Before sole-control Beginner play, I operated Corp through C1 and the first HQ approach of the separate Intermediate game on port 1042, paired with the Runner agent. Native neutral teaching totals were 44 Corp / 40 Runner. Kept original hand; Hedge Fund; Palisade R&D; Diviner HQ. Runner played Sure Gamble, Carmen, Wildcat Strike and Overclock HQ. Corp chose Wildcat's draw-four outcome, passed initiation, rezzed Diviner for 2 and passed approach. Both views then transferred to the Runner agent. This report claims no full Intermediate result; see that agent's report for continuation.
