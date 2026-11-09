# Netrunner · Local Table

A playable, offline-first System Gateway game: choose Runner or Corporation and play against Chiriboga's AI. The interface is a new tabletop presentation with illustrated blue/red mats, legal actions, magnified cards, and local replay saves.

## Play

Requires Node.js 22 or newer. No package installation, build step, Docker, PHP, or external runtime services are required for the game.

```sh
git clone https://github.com/nicanadian/nzg-netrunner.git
cd nzg-netrunner
```

Start the local game:

```sh
npm run dev
```

Open **http://localhost:5173/**. Choose a side and **Jack in**. If that port is occupied, use `PORT=5174 npm run dev`.

Choose your character and AI opponent in the lobby. Each character has a complete ready-to-play deck; portraits open the identity's rules text. **View decks** previews the selected matchup, and **Menu → View matchup decks** shows the decks in an active game. Resume uses the saved characters, independently of the lobby's current selections.

- Hover or keyboard-focus a visible card to magnify it. Click/tap to pin its higher-resolution image, readable rules text, current strength, and available actions.
- Gold borders identify actionable cards. The side panel lists legal decisions. Select individual cards or servers there when a choice has several targets.
- Hover or keyboard-focus a card or action to highlight its counterpart. During encounters, **Your encounter options** shows breaker type/strength checks, quoted costs, hosted viruses and bioroid click breaks. Available abilities appear directly; target selection shows what will be paid, with Cancel available before payment. Breaker estimates use that program alone and can change when other abilities are used.
- Click tiles turn over as actions are spent. Gold stacks show credits hosted on a card, separate from the player pool. Typed ADV/VIR/PWR/AGN markers distinguish other counters. Last resource change keeps the action payment and later automatic changes visible; reduced-motion preferences skip the visual hold.
- Clicking an agenda-point total opens that player's score area. HQ, Archives, and Heap can also be inspected; hidden cards remain concealed.
- Hands stay on screen on desktop. Crowded play areas and server/rig rows scroll independently. On phones, the decisions follow the board.
- Menu provides undo, resume, replay file import/export, paste-replay import, and concession. Games save in this browser after each decision. A new game replaces the latest local save; export a replay to keep multiple games.
- **Corp activity** includes defensive responses during your Runner turn. Spin Doctor's rez, two-card draw, removal and Archives shuffles appear in the timeline and paced playback, with an explicit explanation when the remote has no cards left to access. Full log labels who acted separately from whose turn it is.
- Pink virus-host labels identify ice hosting a virus program and show the program's counters, including zero. Leech reductions appear on the affected ice with their encounter duration. The VIRUS counter stays on the program that owns it.
- **Ask helper** opens a left-side panel. Built-in help explains the current decision, visible viruses, draws, scoring and named cards. Inspect a card and choose **Ask helper about this card** to attach it. **Copy visible situation** provides a safe position summary for reporting a problem. Opening the panel pauses opponent playback.

## Optional AI chat

The panel works as a clearly labeled built-in reference guide without a model. AI is enabled only by an explicit provider setting. Chat history stays in memory and clears for a different game. The helper receives the displayed public snapshot and your own visible cards, with card text and short rule notes. Recently revealed Spin Doctor events retain its printed text after it leaves play. It does not receive the shuffle seed, replay choices, deck order or concealed-card characteristics, and cannot make game decisions. During playback it describes the displayed step.

To use your **Codex subscription**, install the official Codex CLI, sign in with `codex login` using your ChatGPT account, and put `HELPER_PROVIDER=codex` in `.env.local` (Node 22+). Restart `npm run dev`, then reload the game. The helper uses the official local Codex app-server and the account's default available model; `HELPER_MODEL` can select a specific model. No API key is needed. Questions count toward your Codex subscription usage. The panel confirms **Codex connected · uses your subscription** after checking sign-in. Credentials and token refresh stay with Codex; the game never reads or copies its token files. Each question runs in an ephemeral session in an empty temporary directory with shell, browser, apps, plugins, hooks, and agent features disabled; configured MCP servers are disabled for that session. Temporary working directories are removed afterward. Sign-in, usage-limit and timeout failures appear as retryable errors without changing the game. See [Codex authentication](https://learn.chatgpt.com/docs/auth) and [app-server](https://learn.chatgpt.com/docs/app-server).

For separately billed OpenAI API access, set `HELPER_PROVIDER=openai`, `OPENAI_API_KEY` and optionally `HELPER_MODEL` (default `gpt-5-mini`). The key stays on the local server; it is not put in browser storage or sent in game context. Only submitted questions, recent chat and visible game context go to the configured model. The Responses API uses `store: false`.

For an independently installed Ollama model, set `HELPER_PROVIDER=ollama`, `HELPER_MODEL` to its installed name, and optionally `OLLAMA_HOST` (default `http://127.0.0.1:11434`). No model is downloaded or installed automatically. Provider failures appear in the panel with the question available to retry; the game is unchanged. Without a configured model, broader questions explicitly say AI chat is not connected.

The tutor separates printed rules, observed browser behavior and possible implementation issues. Its reference guide is limited, and connected-model answers still require judgment. **Menu → Export game replay** is the evidence needed to investigate a suspected engine bug. Reference sources: [NSG rules](https://rules.nullsignal.games/), the bundled printed card text, [OpenAI Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses), and [Ollama chat API](https://docs.ollama.com/api/chat).

Seven curated, legal 40-card decks are included:

| Side | Character | Playstyle | Influence |
|---|---|---|---|
| Runner | René “Loup” Arcemont | Access trashing, viruses and rig disruption | 6 / 15 |
| Runner | Zahya Sadeghi | Central-server pressure, multi-access and run income | 15 / 15 |
| Runner | Tāo Salonga | Ice swaps, efficient breakers and Conduit | 12 / 15 |
| Corp | Haas-Bioroid: Precision Design | Bioroid defenses, campaigns and scoring | 4 / 15 |
| Corp | Jinteki: Restoring Humanity | Ambushes, net damage and Archives income | 2 / 15 |
| Corp | NBN: Reality Plus | Tags, extra income/cards and Retribution | 3 / 15 |
| Corp | Weyland Consortium: Built to Last | Advancement rewards, towering ice and meat damage | 2 / 15 |

Every Corp deck has 18 agenda points. The seven lists use 72 distinct Gateway cards, including their identities. The engine retains all 77 definitions; Cookbook, Mayfly, Sprint and the two starter-only identities aren't in these presets. Deck building and other expansions remain outside the current UI.

The shared catalog is `engine/deck-catalog.js`. Saves retain versioned deck IDs for both sides. Keep published lists immutable under those IDs; future list revisions should use new IDs. Old saves without IDs retain the exact original Loup/Precision Design lists and shuffled order. Unknown or wrong-side deck IDs fail visibly instead of silently substituting a character.

## Verify

```sh
npm test
NR_TEST_SEEDS=1 npm test               # one AI faceoff plus regressions
npm run test:rules                    # payment/privacy and Chrome replay
npm run test:matchups                 # all 12 character pairings, native AI vs AI
NR_TEST_SEEDS=1,2,3,4,5,6,7,8,9,10 npm test
```

The tests exercise terminal AI matches, hidden information, deterministic replay, mulligans, nested icebreaker decisions, required/optional multiple-card choices, and card-zone/resource invariants. Full games were also played through the browser UI on both sides; fixtures and results are under `tests/fixtures/` and `docs/browser-*-playtest.json`.

The 2026-11-05 Chrome playtest pass is recorded in [rules](docs/playtesting/rules.md), [interaction/accessibility](docs/playtesting/accessibility.md), and [visual review](docs/playtesting/visual.md). These reports distinguish actual native Chrome sessions from source review and engine fixtures. Four retained Chrome matches contribute 413 decisions, with three completed during the extension-only recovery pass. The suite also includes a real 21-decision hosted-program checkpoint, hosted-card privacy checks, and final installation-payment checks.

The counter-design loop adds three independent AI Chrome player sessions: 76 new retained decisions in five exports, plus undo and focused rechecks. These are focused sessions, not three additional full matches or recruited human participants. Reports: [Corp](docs/playtesting/counters-corp.md), [Runner](docs/playtesting/counters-runner.md), [newcomer/keyboard](docs/playtesting/counters-newcomer.md). Open [the counter comparison](http://localhost:5173/eval/counters.html) for matched screenshots and reproducible ordinary game saves. `node scripts/build-counter-eval.cjs` rebuilds those saves; `scripts/run-counter-browser-eval.mjs` records the presentation checks through the Chrome extension.

The [overall polish review](http://localhost:5173/eval/polish.html) adds independent AI UI/UX, graphic-design and board-game-design reviews and Chrome rechecks. It documents the revised hierarchy, contextual pile dialogs, numbered breaks, source-labelled effects, scoring readiness and visible run restrictions. Original panel reports are under `docs/playtesting/polish-*-review.md`; saved Ansel/score scenarios and matched screenshots are under `eval/polish/`.

The [encounter interaction pass](docs/playtesting/encounter-actions.md) covers card/sidebar links, flat ability choices, explicit targeting/payment stages, incompatible breakers and alternate breaks. This pass used the shared browser because the Chrome connection was unavailable; it distinguishes those UI checks from native engine cost fixtures and historical Chrome captures.

The [character mechanics panel](docs/playtesting/characters-suite.md) adds three independent AI reviewers, two complete UI games, two complete deterministic engine games and focused browser checkpoints for all five new identities. It records the resulting search-visibility fix, forced-encounter review pause, actual payment previews, source/target links and damage/swap feedback. The reports distinguish Chrome from shared-browser checks and complete UI games from imported checkpoints.

## Independent Jinteki scenario comparison

Run `npm run test:jinteki` with Node 22+, Java 21+, `curl` and `tar`. On this Mac the runner finds Homebrew Java 21 automatically; otherwise set `JAVA_HOME`. The first run downloads pinned Jinteki source, Leiningen, Maven dependencies and card metadata. It needs no Docker daemon, database, card images or running website. Runtime files stay under the ignored `tmp/jinteki-runtime/` directory; dependencies also use the standard Maven cache.

Six headless scenario families cover Overclock/Manegarm's three choices, two Whitespace thresholds with bad publicity, Spin Doctor with/without protecting ice, Leech's encounter expiry, Luminal's spendable bonus clicks and scoring restriction, and Seamless Launch's target selection. Initial positions are explicitly constructed; subsequent steps use each engine's action handlers. Only the recorded checkpoint fields are compared. This is independent engine execution, not a browser playtest or exhaustive rules certification.

Source pins and runners are under `scripts/jinteki-comparison/`. Outputs, hashes and the native Jinteki test summary are under `eval/jinteki-comparison/`; `report.json` preserves both engines' actual values. The initial run matches 10 of 11 variants. The remaining difference is Seamless Launch on installed Leech: Local Table places two advancement counters; Jinteki's Corp-only target filter rejects it. Both reject newly installed Urtica and permit older Palisade. No behavior was changed to force agreement, and this comparison does not establish an official ruling on Runner-card targets. The command deliberately exits nonzero while a difference remains.

## Architecture

For an independent local Jinteki frontend, run `npm run jinteki:local` and open http://localhost:1042/local. This uses Docker Desktop for an isolated MongoDB container and the pinned Java runtime setup described above. Beginner and Intermediate Gateway games are prepared with separate local Corp/Runner logins; no registration is needed. Open the two sides in separate tabs using the launcher's links. Jinteki has no AI opponent. Sessions use `localhost` for Corp and `127.0.0.1` for Runner so their cookies stay separate; play one matchup at a time in the same browser. The web server and database bind to loopback. Games live in memory, with a one-day inactivity limit; stopping the server loses active games. `npm run jinteki:stop` stops this server and its database container; database files are retained. Startup logs are in `tmp/jinteki-runtime/server.log`.

The local frontend applies a checked patch to Jinteki's shared card-description formatter: serialized Corp card zones are normalized before server-name lookup. Without it, an approach-ice log entry can throw and unmount the browser board. The patch preserves hidden-name handling and is retained in `scripts/jinteki-local/prepare-frontend.cjs`. The regression fixture is `scripts/jinteki-local/frontend-test.clj`; recovery results are under `eval/jinteki-local/`. Rebuilding this frontend and reloading the page preserves the live server match.

- `app/` and `index.html`: dependency-free frontend. It only receives player-visible observations and legal-choice DTOs.
- `engine/worker.js`: isolates the original engine and AI from the page. Every new/replayed game uses a fresh Worker.
- `engine/adapter.js`: initialization, deterministic RNG, command/choice bridge, hidden-card filtering, terminal states, and snapshots. It keeps actual engine object references inside the Worker.
- `vendor/chiriboga/`: pinned, unmodified upstream rules, card scripts, run calculator, and heuristic AIs. See `vendor/chiriboga/ORIGIN.md`.
- `assets/cards/`: small local board images. `assets/cards-hires/`: 600×839 original PNGs loaded for reading. `assets/card-data.json` provides readable text and credits; the source manifest records every download.
- `prototype/`: the earlier presentation study, retained for comparison.

The AI is the existing heuristic policy, not a learned model. The seeded test harness provides a starting point for self-play experiments; a policy-neutral training API, observations suitable for reinforcement learning, and learning loops remain future work. Upstream AI branches intentionally prune choices for its policy; human choices retain the full card decision paths.

Saved replays contain the seed and human decisions. Restoring re-executes the game and AI, so long games may take a few seconds to load. Incompatible/stale decisions fail visibly. If an upstream rule or AI error occurs, use Undo or export the replay to reproduce it. Passing tests are not a claim of comprehensive tournament rules certification.

The Luminal extra-click timing fix recalculates the next phase after scoring effects. Replays ending at that scoring turn (including `luminal-extra-clicks-replay.json`) restore with the Corp spending its bonus clicks correctly. Older replays with decisions recorded after the skipped-click bug may become stale at the first changed position; those choices are rejected rather than applied to a different board. The original historical Chrome fixture is retained as evidence and its 90-decision valid prefix remains covered.

If restoration stops at an incompatible choice, **Export original & recover** downloads the complete original replay and resumes from its last compatible decision. Later recorded choices remain in the export; they are not applied to the changed position. Accepted choices also remain recorded if a later AI calculation or observation fails. Revealed/exposed cards have an explicit viewing panel, including cards temporarily revealed from a deck. See the [frontend and timing audit](docs/design-review.md#chiriboga-frontend-and-timing-audit--2026-11-06-local) for the source comparison, verified fixes and limits.

## Sources and design

Code is GPL-3.0; see `LICENSE` and `NOTICE.md`. Card artwork retains its printed credits and is included here for local use; public download availability is not a separate grant to redistribute it commercially.

Design references: [NSG's example game](https://www.youtube.com/watch?v=xtI0-j0utLo), [Null Signal Games](https://nullsignal.games/), and the large-card inspection patterns used by established digital card games. The iteration record is in `docs/design-review.md`; the initial reuse research is in `docs/chiriboga-assessment.md`.

## Recorded-game rules audit

[Three end-to-end reconstructed games](docs/research/gateway-ledgers/end-to-end-audit.md) supply 71 checkpoints and 1,093 legal decisions under the current profile, each independently replayed from its opening. The original 696-decision traces remain saved-game compatibility fixtures. Source mistakes and unknown card completions are explicit. Run `npm run test:recorded-games` for the ledgers, full reconstructions and targeted rule probes.

New lobby games select `26.03-local-2`: in addition to the original visibility, Seamless Launch, run-window and bad-publicity corrections, players choose their credit sources before an effect resolves and can use all affordable Gateway breaker boosts. Out-of-encounter boosts expire at the effect-end checkpoint. Legal zero-subroutine breaks, zero-counter Fermenter use, Leech use after breaking all subroutines, and agenda overadvancement are also offered. Unversioned and `26.03-local-1` saves retain their original profiles and decision sequences. Unknown profiles fail visibly. The detailed audit records validation and source normalization decisions.
