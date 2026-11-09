# Chiriboga reuse assessment

Research date: November 3, 2026 (America/Denver).

## Recommendation

Reuse Chiriboga’s rules and card behavior behind an explicit engine boundary, build a new presentation layer, and retain its existing bots as the initial opponents and evaluation baseline. Evaluate the DrBo6 fork as the starting point because it adds considerable Elevation implementation work. The original is a smaller reference for understanding the engine.

Begin with System Gateway and fixed decks. Prove a complete game, then expand toward Gateway plus Elevation. Current Standard is substantially beyond either repository’s implemented pool. Treat training as a later consumer of a reliable headless engine.

## What was inspected

| Repository | Branch / pinned commit | Latest commit at inspection |
|---|---|---|
| [bobtheuberfish/chiriboga](https://github.com/bobtheuberfish/chiriboga) | `dev` / `77c80b1f0f96a2af068f5d267cc0df1a1b0c9b39` | July 6, 2025 |
| [drbo6/chiriboga](https://github.com/drbo6/chiriboga) | `dev` / `c863f5af74ceb4fa821a4c84d3f643efffacb7ba` | April 8, 2026 |

Both codebases were read locally. Their set files were evaluated in isolated Node VM contexts to count actual registered definitions. The original live menu and newer Solo Mode menu were inspected in a browser. No complete match, offline engine deployment, rules conformance audit, or bot-strength benchmark was completed.

Neither checkout includes its required `images/` directory. The original Dockerfile refers to an absent `src/` directory. Neither inspected checkout provides a conventional automated test suite or JS package manifest. The PHP entry pages assemble browser scripts; the actual rules and bots run client side. A fresh clone is therefore not a complete offline game out of the box.

## Architecture and what to keep

The main flow is PHP page assembly → browser `Init()` → `Main()` → phase enumeration → command selection → parameter choice → rules resolution → next phase. All scripts share mutable global objects, notably `corp`, `runner`, `currentPhase`, and the current choice arrays.

| Area | Files | Reuse assessment |
|---|---|---|
| Timing, priority, and turn/run phases | `phase.js` | High value; preserve behavior while separating browser work. |
| Game effects and legality | `mechanics.js`, `checks.js` | High value; costs, drawing, damage, installing, scoring, and checks are expensive to recreate correctly. |
| Command and option enumeration | `command.js` | Useful boundary, but currently mixes rules, UI, and AI-specific behavior. |
| Executable card definitions | `sets/*.js` | High value; actual card-specific effects and response hooks, not merely card metadata. |
| Corp and Runner policies | `ai_corp.js`, `ai_runner.js` | Useful immediate opponents and baselines; hand-authored heuristics. |
| Run planning | `runcalculator.js` | Especially valuable; searches possible encounter paths, costs, and consequences. It is not a general whole-game search engine. |
| Decks and reproduction helpers | `decks.js`, `utility.js` | Adapt selectively; card instantiation also creates renderers and counters. |
| Existing presentation | `init.js`, `cardrenderer/`, PHP pages, CSS | Replace incrementally. Preserve a working reference while building the adapter. |
| Solo additions | `config.js`, `precons/`, `gauntlet.php`, `documentation/ai.md` | Set configuration, deck examples, optional campaign ideas, and useful AI documentation. |

Useful entry points in the pinned Solo fork: `init.js:1990` (`Main`), `command.js:573` (`EnumeratePhase`), `command.js:12` (`Execute`), `command.js:42` (`ResolveChoice`), `phase.js:1949` (`ChangePhase`), and `phase.js:2075` (`DecisionPhase`). Browser URLs for reviewing code can be pinned to the commit above, e.g. [command.js](https://github.com/drbo6/chiriboga/blob/c863f5af74ceb4fa821a4c84d3f643efffacb7ba/command.js#L573).

## Why the UI replacement needs an adapter

`EnumeratePhase()` can call `Render()`. `ResolveChoice()` schedules the next turn with browser timers. Mechanics update render counters. Cards and servers pass around object references, callbacks, and closures. Some card effects inspect whether the player is AI-controlled and influence available choices or policy preferences. Thus the existing option list is not automatically a neutral legal-action API.

There are also global overrides of `JSON.stringify` and console logging. Rewind restores generated JavaScript with `eval`; reproduction helpers explicitly describe themselves as incomplete. These are debugging conveniences, not a complete, portable save-state contract. Wrapping the unmodified engine into a modern app without isolation would carry those side effects into the app.

Proposed boundary, to implement rather than assume already exists:

```text
Modern UI ── commands with stable IDs ──> Game session
Modern UI <── player-safe view + events ─ Game session
                                          │
                                    rules + card registry
                                          │
                         bot / headless simulation adapters
```

First isolate one session in a dedicated context, then remove DOM/render dependencies behind callbacks. Keep game state authoritative and animate emitted events in the UI. AI should receive a player-specific observation and a legal action list. Action IDs should include a decision version so late clicks cannot resolve a different choice. Maintain a rules version, card registry version, seed, and action trace for reproduction.

A worker is a good eventual boundary, but the current code cannot simply move into one: DOM access, browser initialization, card instantiation, and asynchronous control flow must first be adapted. React/TypeScript is a reasonable app choice; the presentation can begin with CSS perspective or move to Three.js if free cameras, physical lighting, and richer tabletop effects justify it. That renderer choice should not change the engine API.

## Card coverage: executable definitions

| Set | Original | Solo fork |
|---|---:|---:|
| System Gateway | 77 | 77 |
| System Update 2021 | 82 | 82 |
| Elevation | 0 | 76 |
| Midnight Sun | 8 | 12 |
| Downfall | 0 | 3 |
| Uprising | 0 | 6 |
| Parhelion | 0 | 4 |
| The Automata Initiative | 0 | 3 |
| Rebellion Without Rehearsal | 0 | 2 |
| Vantage Point | 0 | 0 |

Counts exclude tutorial, cheat, gauntlet, and legacy Core definitions. A definition’s presence does not prove correct rules, complete AI support, or compatibility with current errata. The Solo registry marks Elevation untested and most other expansions hidden/untested.

Elevation lacks IDs `35057`, `35058`, `35059`, `35060`, `35065`, and `35066`: Nebula Talent Management, Synapse Global, Embedded Reporting, Next Big Thing, Bigger Picture, and IP Enforcement. The observed missing IDs agree with the fork’s README.

Importing card names, text, or images does not implement new cards. Each needs executable effects, timing support, tests for meaningful interactions, and bot support or a deliberate fallback. The original Go `setgen` tool produces scaffolding and explicitly leaves behavior and AI implementation to be added.

NSG currently lists Gateway plus Elevation as the non-rotating Core Sets. Vantage Point released March 2, 2026 and is the latest listed expansion. Use a versioned format manifest if supporting current Standard, including rotation and bans; “NSG cards” is not a sufficient legality rule. [NSG formats](https://nullsignal.games/players/supported-formats/), [Vantage Point](https://nullsignal.games/products/vantage-point/).

## Assets and licensing

NSG publishes full-color print-and-play card faces, including [Elevation](https://nullsignal.games/products/elevation/) and [Vantage Point](https://nullsignal.games/products/vantage-point/). This verifies a practical public source for recent card imagery. It does not establish unrestricted software redistribution rights.

The [visual-assets license](https://nullsignal.games/about/nsg-visual-assets/) covers the contents of that symbol pack and explicitly excludes other card art, frames, and backs. The [Creator Resources Portal](https://nullsignal.games/media/) has a separate, limited promotional-use policy, prohibits sharing its resources, and disallows personal use. Do not use either policy as blanket permission for bundling card art in this game. Before publishing asset bundles, establish permission for that use with NSG; no outreach has been sent.

For production ingestion, keep card identity, printing identity, language, artwork source, and behavior separate. Pin metadata from [NSG’s card-data repository](https://github.com/Null-Signal-Games/netrunner-cards-json), review its applicable terms, and keep a local snapshot. Record image source, version, checksum, artist, and permission basis. Generate thumbnail and inspection sizes from the permitted source. If extracting PnP pages, verify card boundaries, duplicates, resolution, and ID mapping rather than assuming image order matches card IDs.

Both inspected engine repositories contain GPL v3. Preserve upstream notices and plan a distributed derivative around its source-sharing requirements. Code licensing and image permissions are separate; an independently written UI does not by itself settle how a combined distribution is licensed. [Pinned upstream license](https://github.com/bobtheuberfish/chiriboga/blob/77c80b1f0f96a2af068f5d267cc0df1a1b0c9b39/LICENSE).

The local visual study uses nine public NetrunnerDB card faces, preserves their printed credits, and records sources/checksums in `prototype/assets/sources.json`. It uses original CSS mat graphics and generic card backs, with no video frames, soundtrack, NSG mat textures, or portal assets embedded.

## AI and self-play

Both sides already have heuristic opponents. `?faceoff=true` enables bot-versus-bot play. The original README mentions an abandoned DQN experiment; the inspected bot code is not a functioning learning pipeline. `GameEnded()` methods are empty, and the inspected original `PlayerWin()` does not call them. Build an explicit terminal-result contract.

For a simulation harness: remove rendering and turn delays, provide one game per isolated context, control every random source, detect terminal states, cap turns/decisions, and classify crashes, timeouts, and draws separately from wins. `seedrandom` exists, but that does not prove whole-game replay determinism: the engine and bots also call `Math.random`.

Netrunner contains hidden information. Existing bots use `PlayerCanLook`, but also have direct access to global game state; a debug “show all fronts” flag changes that helper. Audit information access before trusting training results. Test that changing unseen card identities or deck order leaves the observable view unchanged. Legal-action enumeration must also avoid leaking hidden facts.

Start with reproducible baseline tournaments and replayable failures. Then experiment with heuristic parameter tuning, imitation of the existing bots, or information-set search. A learning policy can follow once trajectories, action masks, rewards, and terminal results are reliable. Retain separate Corp/Runner policies and evaluate across held-out decks and older policy checkpoints. A rising win rate against one fixed opponent alone is insufficient evidence of general improvement. No training throughput or strength claim is justified yet.

## Video direction and local study

Reference: [Learn To Play Netrunner — Example Game](https://www.youtube.com/watch?v=xtI0-j0utLo), visually sampled at approximately 1:50, 6:00, and 11:05. These are sampled stills, not a review of every animation.

Observed: an angled physical table, blue Corp and red Runner playmats, card stacks with visible depth and shadows, chunky credit/click tokens, close views of relevant cards, and compact rules callouts. Translate those ideas into a stable play camera, an overhead mode for dense boards, readable card inspection, and short run-focused transitions. Keep everyday controls outside the perspective transform. Respect reduced-motion preferences and preserve a useful flat view.

`prototype/` explores that direction with original CSS geometry, local card faces, a camera toggle, an inspector, target selection, and a manually stepped run visualization. The scene deliberately labels its scripted progression: it does not implement payments, legal encounters, access resolution, deckbuilding, or an opponent. For example, its installed Buzzsaw cannot break the Ansel sentry; the demo explains that rather than implying a legal break.

The second reference, [Theo’s Agents Sucked At UI (Until Today)](https://www.youtube.com/watch?v=xq0eB8vxeqk), was reviewed through its transcript. It describes repeated screenshot critique against comparison products, and notes that model scores vary with context. The transferable method here is a concrete review loop: compare the same game state and viewport against reference frames, identify visible defects, change the implementation, and inspect again. Do not treat a model’s numeric rating as a usability result.

For this study the review criteria are table legibility, clear action hierarchy, consistent controls, useful perspective, card inspection, smaller-screen fit, and reduced motion. Initial browser checks found a clipped mobile table and small supporting text; the layout and text sizes were revised. Future rounds should include dense remote servers, many installed programs, long card names, nested choices, and actual play rather than judging a sparse opening scene alone.

## Suggested implementation order

1. Pin the chosen fork, preserve notices, add repeatable local startup and an asset manifest. Keep the legacy app available for comparison.
2. Establish a UI-free session and fixed-deck Gateway game. Verify game end, priority, costs, run resolution, hidden observations, and deterministic replay. Benchmark simulations before selecting a training framework.
3. Connect a modern tabletop UI to that session, including legal actions, prompts, event playback, save/load, and both human-side choices.
4. Add validated Elevation support, including the missing six cards and AI behavior. Make supported pools and unimplemented cards explicit in deck selection.
5. Add batch bot tournaments, then optional tuning/self-play experiments. Expand toward later sets in small tested increments.

First substantial milestone: finish a complete local System Gateway game against the existing bot through the new UI, reproduce it from seed/actions, and run that same rules session without a renderer.

## Local prototype verification

Browser checks covered desktop layouts at 1280×800 and 1280×900 and a 390×844 mobile layout; card inspection and closing; camera selection; server selection; and the scripted approach → encounter → breach → reset sequence. Mobile board bounds fit within the viewport. All displayed card images loaded, and the page requested no external runtime resources. JavaScript syntax, asset checksums, and local document links were also checked. These checks validate this visual study, not Netrunner rules or upstream bot behavior.
