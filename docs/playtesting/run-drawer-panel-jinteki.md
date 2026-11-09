# Chrome run drawer panel — Corp tester

Fresh actual Chrome-extension game, 6 November 2026. Independent AI-operated playtest, not recruited human feedback. All 72 recorded decisions were made through the visible UI, from lobby to terminal result. No engine-generated replay was imported and no game state or rules were modified.

## Game and evidence

- Human-controlled side: Jinteki: Restoring Humanity; AI opponent: Loup.
- Seed: `bb6edd08-1760-4cd0-ae0c-fafe741e9e57`; rules profile `26.03-local-2`.
- Isolated origin: `http://127.0.0.1:5177/`, using the installed Chrome plugin's extension browser. Screenshots were captured at the browser's existing size (1771×927); no phone or keyboard-only pass was performed.
- Result: Runner won 7–2 during Runner turn 11. The terminal screen named agenda victory and removed live run continuation controls.
- Complete UI-exported replay: `eval/run-drawer-panel/jinteki/final-replay.json` (72 decisions). Earlier ordinary exports: `urtica-checkpoint.json` (9) and `progress-replay.json` (55).
- Screenshots alongside the replay: `advance-preview.png`, `run-initiation.png`, `urtica-access.png`, `rez-options.png`, `palisade-fire.png`, `terminal.png`.

## Experience through the game

The opening hand offered an immediate ambush test. Clicking Urtica in HQ opened its full text and the same install action as the sidebar. I could predict that installing cost one click and that rezzing was unnecessary. After installation, each Advance option explicitly quoted one credit/one click and the resulting damage total, first 3 then 4. The board showed the two advancement counters separately from the unrezzed label.

Loup ran that remote on its first turn. The wide drawer separated the accessed card from its action, and its Urtica button explicitly said “Deal 4 net damage: 2 base + 2 advancement · no rez required.” I did not need a nested action menu. Resolving it produced a causal damage playback, the four trashed card names, and the Runner's remaining grip count. Loup survived, trashed Urtica, installed Fermenter, then ran both centrals. The next Corp turn's 33-event Runner summary was enough to reconstruct that sequence, including the distinction between Loup's free draw and click draws.

I installed Diviner over HQ and Tithe over R&D, used Hansei Review through card inspection, selected the spare Tithe for its required HQ trash, and resolved Restoring Humanity's clearly explained income from facedown Archives. The nested Hansei choices preserved its source, but their header was generic; I relied on the full card text I had just read for the consequence of selecting a card.

An unprotected Offworld Office was stolen on turn 4. A second Urtica trap on turn 5 again dealt the advertised 4 damage and forced the Runner to rebuild. I then tried to score Orbital Superiority behind Whitespace. The drawer exposed its 2-credit rez directly; paying it changed the pinned Corp pool 9→7. Loup's Buzzsaw broke both subroutines and stole the agenda. The next-turn log clearly showed the rez, breaker payment, both broken subroutines and theft.

For the next scoring attempt I put Palisade outside Whitespace, retaining both ice through the explicit 1-credit Finish install step. Palisade's remote strength changed 2→4 when rezzed for 3 credits. The Runner initially had no matching breaker. The Corp drawer then offered the actual unbroken “Palisade · End the run.” action, with its numbered subroutine alongside. The action was easy to see; resolving it marked the subroutine Fired and ended the run. I advanced and scored Orbital on turn 9, gaining two points and giving the untagged Runner a tag. Loup removed that tag on its next turn.

After that scoring attempt, later Corp turns deliberately emphasized drawing and discarding to exercise hand-limit/identity lifecycle and reach a terminal position. This was functional playtesting with limited competitive intent. It did not require a concession or fabricated ending: Loup installed its full breaker suite and Leech, stole Superconducting Hub from HQ, then used Jailbreak through Diviner to steal Offworld Office and win naturally on turn 11.

## Findings

1. **P2: remote names disagree across action and receipt surfaces.** During turn 8, the inspector explicitly offered “Install → Remote 4” for Palisade. After choosing it, the resource receipt said “Install · Palisade → Remote 5.” The subsequent Finish install status said “Whitespace: Remote 3 ice 1 → Remote 3 ice 2,” while the board and target choices consistently called the server Remote 4. Actual placement was correct. A novice checking whether they selected the right server could reasonably doubt it. Normalize locations once at the presentation boundary, without re-applying display numbering to an already displayed label.
2. **P3: initiation stage can be labeled Movement on an ice-free run.** On the initial Remote 1 run, the pinned stage badge read Movement while the heading and live status said Initiation / Run: Initiation. The hint likewise described movement. See `run-initiation.png`. Use the actual timing phase before the broad movement flag for this label.
3. **P3: Orbital's trigger sounds like a choice.** The score response button said “Do 4 meat damage or give the Runner 1 tag.” The outcome was automatically one tag because the Runner was untagged. Showing “Give 1 tag — Runner is untagged” would make the pending impact apparent without re-reading its conditional printed text.
4. **Low friction: animation can move controls between observation and input.** A “Skip to decision” click based on an earlier snapshot missed because playback had already ended; the next observation showed the genuine decision intact. This was not an accidental game action. Controls which disappear during autoplay need to remain easy to distinguish from live choices; the footer's “Watching recorded actions” treatment helped.

The main layout goal passed in the sampled desktop encounters: compact card context did not push rez, Urtica or fire-subroutine actions below a large image. Full text was available when needed, and the pinned footer remained separate from card abilities. No gameplay-rules defect was established by this playtest.

## Coverage limits and tool behavior

Observed: card-based install/play, sidebar advancement/rez, nested install-cost completion, Urtica damage twice, Hansei trash, Restoring Humanity income, Whitespace breaks by AI, Palisade end-run firing, Diviner rez and AI break, Orbital scoring/tag, tag removal, Loup triggered draw, virus/hosted-credit growth, opponent activity and terminal cleanup.

Not observed: Spin Doctor rez or shuffle (the AI trashed the first copy from HQ), Anoetic Void activation (a later copy was drawn but not activated), Runner-controlled source allocation, phone layout, complete keyboard-only play, or all identity matchups.

The Chrome plugin's `waitForEvent('download')` call hung even though Export game replay successfully saved its file, eventually resetting that JavaScript tool session. The owned Chrome tab and game survived. I recovered the same tab, identified my downloaded replay by its seed/decks, and used ordinary Export clicks for subsequent captures. This was a tooling issue, not a game failure. No timeout is counted as a game decision.


Parent verification: independently restored all 72 exported choices with snapshot checks after each choice and reached the same natural terminal outcome.
