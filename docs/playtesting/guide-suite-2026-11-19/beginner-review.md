# Beginner usability review

The guide works as a matchup chooser. It does not yet support a guide-only first deck edit or teach the tactical decisions needed to make its recommended matchup approachable.

## B1 — Find a first Vantage matchup: completed

From the lobby link I chose **Vic · central pressure vs Built to Last · defensive economy**. The three learning goals are concrete, and the AI-only/sample caveats are clear. I used the exact recommended lists, not the similarly named interaction pilot. The cards are plain text, so returning to lobby, changing the pool, and matching deck names takes unnecessary work. Severity: medium. Add a Try this pairing button that preselects exact deck IDs, plus a short deck-plan link. Test with a fresh Gateway session and verify no accidental pilot selection.

## B2 — Guide-only legal edit: blocked; fallback edit completed

The rendered guide offers no cut/add recipe, legality explanation, or worked tradeoff. I supplied my own Netrunner knowledge to choose **−1 Marjanah, +1 Docklands Pass**: trade redundant barrier coverage for more HQ access. The separate builder's Deckbuilding basics taught one-for-one swaps and influence, and its validation confirmed **45 cards, 13/15 influence, Ready to play**. Exact export is in `beginner-deck.json`.

Severity: medium educational gap, rather than a claim that the pairing page promises a full tutorial. Add one optional worked edit with card links, role of the cut/add, before/after legality, and an observation to make next game. Test whether Gateway graduates can explain what function they sacrifice using only the guide. Do not present this particular edit as proven stronger.

## B3 — Save, reopen, select, play: completed

Saved **Suite Beginner 19Nov**, reopened Tune deck and checked Docklands Pass 3 / Marjanah 2. Save & use automatically selected the deck. After the game I switched to the preset and back to the saved custom list, reopened it and verified unchanged quantities. The game's embedded exact runner deck matches the export.

Finished an actual DOM-driven game: **Runner 8, Corp 5, UI round 15** (engine turn 30, version 1093), terminal agenda win, no concession, diagnostics empty. `beginner-game.json` contains session and requested final fields; `beginner-ui-trace.json` contains 162 named DOM clicks with pre-action rendered text and tactical notes. Routine known sequences were scripted with waits. No direct engine actions, worker calls, private-card reads, or headless browser were used; session/state were read only after terminal.

Meaningful decisions included contesting a two-advanced remote for a Hub; paying and jacking out safely after Lionsmane revealed; tutoring Carmen; installing Cleaver to reduce Reverb's break cost from five to one; using Vic after Orbital's tag; and a final four-advanced-remote challenge. I drew to six grip before that run, broke Lionsmane's final jack-out subroutine, accepted four net plus Tithe's one, and survived with one card to steal Send a Message. Those choices required substantial outside tactical knowledge. The guide supplied a learning goal but no practical example.

Add a short pregame checklist about economy, killer coverage, damage buffer, advanced remotes and Vic's tag action, plus postgame questions that separate strategy errors from deck changes. Test observable behavior—reading damage subs, noticing a remote, using Vic—not a presumed human difficulty score.

## Limits

This is one AI reviewer simulating a Gateway graduate, not human novice research or balance evidence. The extra Docklands was drawn but never installed, so this game cannot establish edit benefit. Early killer absence, discretionary Spin Doctor trash and expensive full breaks strained economy; these are strategy confounds. Several harmless automation locator/timing misses required rereading the DOM. They are not claimed as human UI defects.

Snapshot timed out, so this is rendered-DOM evidence with no visual certification. First impressions were saved before source, external rules or prior panel reviews; none were subsequently consulted. Shared incognito storage was left for the parent to restore; no other custom decks were deleted and no global game preferences changed.
