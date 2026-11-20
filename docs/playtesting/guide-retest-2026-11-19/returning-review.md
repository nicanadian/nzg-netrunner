# Returning-player retest — 19 November 2026

The requested guide, tuning, saving and return flows passed. I played one complete natural Runner game with **Retest Returning 19Nov** against **[NSG Core] Fine Print**, winning **9–0 on displayed turn 14**. The final state reports turn 28, version 1005 and no diagnostics. This result does not establish that the edits improved the deck.

## First impression and method

I reviewed the guide before reading any earlier panel or retest reports. The learning paths were approachable, the six-game denominator was prominent, and the construction checklist distinguished legality from practical support. I found **Dashing Mad / Ryō “Phoenix” Ōno** by selecting **Gateway + Elevation**. The guide and lobby agreed on both exact deck titles.

This was an AI reviewer using a returning-player lens with prior Netrunner knowledge, not a new human participant. I used a new incognito browser tab on localhost:5174 and the actual rendered UI. I read DOM text and clicked rendered controls, sometimes batching routine consecutive actions with short waits. I did not call the engine, worker, a choose API, inspect private cards, or inject state. Session and final state were read only after the game ended, for evidence. Screenshot snapshots timed out twice, so the artifacts use text traces and the replay.

## Requested checks

| Check | Result |
|---|---|
| Guide lesson and recipe | Read Phoenix tools and the legal **−1 Charm Offensive / +1 Leech** recipe, including the duplicate-virus opportunity cost. |
| Tune from exact opponent row | Fine Print’s **Tune my deck** opened Dashing Mad with that opponent retained. |
| First saved revision | Saved **Retest Returning 19Nov**, 45 cards, 17/17 influence. |
| Second revision | Reopened and changed **−1 Scrounge / +1 Smartware Distributor**. |
| Cumulative baseline | Before save, session “Changes” showed the second edit while “Compared with baseline” showed all four changes. After save/reload/reopen, session changes were empty and all four baseline changes remained. Counts were Leech 3, Smartware 3, Charm 1, Scrounge 1. |
| Custom benchmark context | Builder explicitly said the revision was unbenchmarked. Guide showed a saved-custom notice explaining that its records describe bundled baselines. |
| Original setup with Corp selected | Configured human Corp once, opened the guide and returned. Human Corp, Fine Print, and custom Phoenix opponent were retained. |
| Final Runner return | Postgame guide return retained human Runner, custom Phoenix and Fine Print. |
| Local notes | Baseline notes and custom notes had distinct labels. All five custom note fields persisted after reload. |
| Saved game | Change decks retained the list; Resume saved game restored the 9-point terminal result. |

## What happened in the game

The opening had Unity, Jailbreak, two Side Hustles and Smartware. I kept it for economy plus early central pressure. Smartware was installed and loaded with three credits, but Public Trail tagged me on turn 2 and the AI trashed both installed resources. Removing the tag and rebuilding income became a real cost lesson. I used cheap central accesses while they were unprotected, then installed Carmen, Rising Tide and Unity to cover the three ice types.

At the turn-11 HQ Doomscroll encounter, I read all three subroutines. I paid Carmen’s strength boost and broke the tag and one-net-damage subroutines. I let the conditional two-net-damage subroutine fire with zero tags, taking no damage. That enabled Phoenix’s successful-run credit and forced HQ trash. This was a deliberate alternative to paying for Break all.

I also canceled a Fermenter installation when the memory dialog required trashing one of my three breakers or hosted Botulus. That preserved coverage and the existing virus investment.

On turn 14 the Corp installed new contents in an iced remote and advanced once. I prioritized the remote immediately. With no pool credits, I first gained one credit to play Overclock. Its five restricted run credits funded Unity’s boost and two breaks against Scatter Field. Unity gained three strength from the three installed breakers. I accessed the upgrade first, could not afford its trash cost, then stole Next Big Thing for three points and ended the game. Damage was read and prevented; no damage was actually taken.

The helper’s **Explain viruses** response correctly recognized that the opening position had no visible viruses or counters and explained that a purge removes counters without removing programs. I used its explanation as learning support.

## What the edits actually tested

**Leech never appeared or was used.** Its usefulness, duplicate-copy cost and the cost of cutting Charm Offensive remain untested. **Smartware was used once, then trashed before its payout.** That is evidence about tag exposure, not evidence for its sustained-income hypothesis. Neither Charm Offensive nor Scrounge was used, so their lost opportunities were not tested. The custom notes explicitly preserve these limits and recommend more observations before changing the hypothesis.

## Findings and acceptance

No concrete reproducible product defect was found in the requested guide, revision or return paths. Two preferences are low priority: a short safe-subroutine Phoenix example could accelerate returning-player learning, and a copy-baseline-notes action could reduce rewriting after saving a custom revision. The current text and separate scopes work correctly.

Keep the following acceptance checks: exact title transfer; two-save cumulative baseline retention; Corp return with a custom Runner opponent; prominent custom/unbenchmarked context; five-field note persistence; and Resume restoring the embedded final list and terminal game.

The experimental AI spent several early turns gaining credits, allowing cheap central access. This game is not evidence of human matchup balance or tournament strength. It used 202 public choices and ended naturally, without a concession or second game.

## Evidence

- [Game replay and final state](returning-game.json)
- [Exact final deck](returning-final-deck.json)
- [UI trace](returning-ui-trace.json)
- [Persisted experiment-note text](returning-notes.json)
- [Structured review](returning-review.json)

All owned tabs and guide popups are closed after evidence capture. Browser storage and global preferences are left for the parent’s restoration.
