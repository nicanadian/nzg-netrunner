# Ping rez report — replay 1ad685a0

Reconstructed all 160 saved choices from the supplied replay. The final run was on the server displayed as **Remote 3** (native ID `Remote 2`), Runner turn 14.

The Corp had **1 credit throughout the approach**. The observed ice windows, from outside inward, were:

| Ice | Rez cost | Eligible credits | Legal rez offered? |
|---|---:|---:|---|
| Ping | 2 | 1 | No |
| Palisade | 3 | 1 | No |
| Tithe | 1 | 1 | Yes |
| Whitespace | 2 | 1 | No |
| Whitespace | 2 | 1 | No |

Ping and Palisade had only a native pass available. The engine advanced through them even without frontend assistance, then stopped at Tithe's affordable rez choice (version 800). The replay records Continue at that point and ends with Send a Message stolen, giving the Runner 9 points. There is no accepted Ping rez choice in the replay.

The last Corp turn spent 4 credits installing the fifth piece of ice and 1 advancing the agenda. Installing Ping did not also pay its 2-credit rez cost. The observed pause at Tithe therefore matches native affordability, rather than a skipped affordable Ping window. A replay records accepted game choices, not failed mouse attempts, so it cannot establish exactly where a rejected click landed.

## UI corrections

- Corp run playback now names unaffordable ice as it is passed: **“Runner passes Ping unrezzed — Could not rez Ping: 2 credits required; 1 eligible credit available.”** The native worker streams this event even though it was the Corp's forced pass, so it is actually visible before the next approach. This introduces no extra confirmation click.
- The card inspector explains when the Runner has already passed that ice, and distinguishes installation cost from the separately paid rez cost.
- Rez choices explicitly say **Rez Ping**, rather than only the card's name and cost.
- The helper receives the visible playback explanation and owner-visible current rez quote, so it can explain affordability during the run.
- Ping's lone mandatory on-rez tag effect resolves automatically; optional tag rewards and other actual choices remain manual.

No affordability restriction was removed and the original replay outcome is unchanged.

## Verification

`node tests/rez-visibility.cjs` reconstructs the exact ending, asserts all five costs/available-credit pairs, checks the four unaffordable-pass explanations and inspector/helper context, then creates an explicit counterfactual approach with 2 Corp credits. Ping is a primary legal rez choice and `assistedChoice` returns no automatic pass.

`node tests/rez-visibility-browser.cjs` uses the real app and worker to play the last Corp action, observes Ping and Palisade's explanations before the Tithe pause, checks the passed-Ping inspector, and reproduces the original win. A separately marked funded fixture verifies that Ping waits for input, charges 2 credits when rezzed and gives the Runner its tag.

Related interaction, playback, privacy/helper, replay/reference and recorded-game checks were run. The isolated frontend acknowledgement test harness was updated to include the real payment-accounting helper used by its extracted handler.

- [Replay fixture](../../tests/fixtures/ping-rez-affordability.json)
- [Exact approach analysis](../../eval/rez-visibility/replay-analysis.json)
- [Browser playback capture](../../eval/rez-visibility/browser-playback.json)
- [Passed-Ping inspector](../../eval/rez-visibility/passed-ping-inspector.png)
- [Affordable Ping rez prompt](../../eval/rez-visibility/affordable-ping.png)
