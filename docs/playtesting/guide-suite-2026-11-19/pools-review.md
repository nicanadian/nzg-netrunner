# Cross-pool guide review — fresh AI reviewer #6

P1 **completed**. P2 **partial**: actual UI rule and identity checks completed, but guide-only rule explanation unavailable. P3 **completed**: one legal revision saved, learning hypothesis/tradeoff/evaluation plan recorded. These are educational/navigation tasks; no games were played and no game outcomes are claimed.

Used the shared browser through an own incognito tab at `http://127.0.0.1:5173`. Read no previous review or guide source. First impressions were saved before further exploration. Snapshot timed out: all findings are DOM-backed functional observations, without visual certification.

## P1: available pairings and sample strength

| Pool | Pairing chosen from guide, then confirmed in lobby | Evidence |
|---|---|---|
| System Gateway | Loup **Trash & viruses** vs Built to Last **Advance & threaten** | 3/6 Runner wins; preliminary 50%. Gateway has 15 lists, 7 Runner/8 Corp, across 3/4 identities. Heavy ice & threats is a different Built to Last list with 1/6 Runner wins. |
| Gateway + Elevation | Ryō **Dashing Mad** vs NBN **[NSG Core] Fine Print** | 3/6 Runner wins; preliminary 50%. Lobby has 21 official Core Sets lists (9/12) and warns rules/AI audit is in progress. This is a close sample to try, not a claimed beginner recommendation. |
| Gateway + Elevation + Vantage | **Loup · Tailored economy** vs **Restoring Humanity · Ambushes** | Explicit familiar-identities recommendation, 28/54 Runner wins (52%). Lobby has 66/66 Vantage cards, 9 recommended decks and 13 interaction pilots; guide defaults exclude pilots. |

The guide clearly teaches that percentages mean Runner wins, 40–60% is close **in the sample**, six games are preliminary (one game changes ~17 points), and 54-game tests are AI-versus-AI rather than human tournament strength. Identity alone is insufficient; exact list matters. Custom lists explicitly have no benchmark.

The opening path is **not contextual**. `?pool=gateway-v1` selects Gateway matchups, yet navigation and intro remain “First Vantage games” / “First Vantage games after Gateway,” recommending unavailable Tailored economy, stealth pilot and Vic lists. Selecting Elevation changes the table but not that path. Changing guide pool also leaves its query and Back to lobby href unchanged.

Exact-list navigation needs translation: Gateway base rows show only identities instead of lobby nicknames. Elevation Ryō and Precision Design omit Dashing Mad and Brutal Efficiency. One Gateway row exposes `restoring-humanity-v2 / Planogram instead of Clearinghouse` rather than the lobby's Planogram economy.

## P2: guide knowledge versus builder evidence

Guide alone did not teach influence, exact minimum deck size, copy limit, uniqueness, or Corp agenda band. The only collapsed guide section, “What to learn next,” gives Vantage card observations. My prior Netrunner knowledge supplied identity-defined minimum/influence, the usual three-copy maximum, uniqueness restricting simultaneous active copies rather than the deck's count, and agenda requirements depending on Corp deck size. No external rules resource was consulted.

The separate builder's expanded **Deckbuilding basics** teaches one-for-one swaps, minimum/influence limits, own-faction zero influence and printed cost per imported copy. Corp text adds “agenda-point range”; it does not define the arithmetic, copy limit or uniqueness.

Actual rendered controls established:

- Loup starts at 40 cards, 6/15 influence. Carmen shows 2 influence per copy and 6 total for three copies. Matching Anarch and neutral rows show zero.
- Removing Wildcat Strike gives 39 cards and “Needs at least 40 cards; currently 39.” Save & use disables; Save draft remains available. Immediately re-added it and restored legality; no invalid list saved.
- After explicitly stating guide-only/prior knowledge in commentary, checked three-copy Wildcat Strike, Botulus, Buzzsaw and Cleaver controls in Vantage Loup: plus disabled with “Maximum 3 copies in a deck.”
- Selecting Tāo from the Loup builder opens a helpful choice: load legal Shaper starter (40 cards, 12/15 influence) or retain all cards (40 cards, 42/15). It explains that identity-only changes retain cards and saved decks stay unchanged. Canceled.
- Gateway Precision Design shows 44 cards, 18/18–19 agenda points. Removing Superconducting Hub yields 43 cards, 17 points and “43 cards requires 18–19 agenda points; currently 17.” Opened Add replacements and restored Hub, returning to 44/18 legal without saving.
- No unique-card explanation found. Carnivore preview says “Limit 1 console per player”; that teaches a console restriction, not uniqueness.

## P3: saved revision and planned learning

Saved **Suite Pools 19Nov**, Gateway Loup, based on **Trash & viruses**: **+1 Carnivore (2→3), −1 T400 Memory Diamond (2→1)**. UI reported 40 cards, 6/15 influence, Ready to play; My decks labeled it Gateway legal. After changing pools and returning, Edit showed the persisted quantities and no new changes. Its UI ID is `local-708a1387-8e81-43fe-b020-1646889e963b`.

Exact list: 3 each Wildcat Strike, Carnivore, Botulus, Buzzsaw, Cleaver, Fermenter, Leech, Carmen, Jailbreak, Overclock, Sure Gamble, Smartware Distributor, Verbal Plasticity; 1 T400 Memory Diamond. Identity is René “Loup” Arcemont: Party Animal.

Hypothesis: the third Carnivore makes its access-trash ability available earlier/more often, supporting Loup pressure. Opportunity cost: one fewer cheap MU/maximum-hand-size card, replacing a 2-credit card with a 4-credit card, and more redundant consoles. Card facts came from actual Carnivore/T400 full-card previews; Loup pressure came from lobby description. The hypothesis and experiment design came from reviewer judgment.

Planned evaluation: six baseline and six revision games against exact Gateway Built to Last **Advance & threaten**, alternating lists and holding settings/opponent fixed. Log first Carnivore drawn/installed turn, useful activations through turn 6, stranded duplicates, occasions missing T400 MU/hand size mattered, and credits/clicks spent establishing rig. Distinguish not drawn from unaffordable. Compare raw behavior counts and examples; wins remain secondary preliminary evidence. Revert the extra Carnivore if duplicates/cost outweigh useful early access-trash opportunities. **No games have yet been played.**

The guide can suggest useful observations for its Vantage packages (Tailor strength/run costs, Touchstone/Corsair sequencing, bad-publicity tradeoff, Vic tags). It supplies no general experiment/log workflow. It explicitly says custom decks have not been benchmarked: the bundled Loup 3/6 statistic cannot become a claimed 50% for this revision.

## Prioritized improvements and acceptance tests

1. **High: contextual opening path.** Each pool's intro should recommend available exact lists. Acceptance: load all three pool queries, change pool, and verify intro, table and launch/back destination agree with selected pool.
2. **High: construction teaching and route.** Link guide and builder to explanations of all five requested rules, including numeric examples and uniqueness versus copy count. Acceptance: a new reader can explain each before experimenting; console restrictions are distinguished from uniqueness.
3. **Medium: exact list names.** Use identity plus the lobby's variant name everywhere. Acceptance: every displayed guide choice matches one visible lobby option; no raw Planogram legacy identifier and no missing Elevation base nicknames.
4. **Medium: reusable experiment form.** Provide hypothesis, opportunity cost, exact comparator and observation log. Acceptance: a reader can plan a custom revision without transferring bundled AI win rates to it.

## Trace and limitations

Lobby → guide link (own popup) → explicit own guide tab from observed href → Gateway/Elevation/Vantage selectors and samples → open What to learn next → Gateway Tune deck → basics → minimum test/repair → identity switch preview/cancel → card previews → revision/name/save → library confirmation → Corp agenda test/repair → confirm all selected lobby pairs → copy-cap check → return Gateway library → Edit saved revision.

Tools briefly disconnected and later reported a 320×200 viewport versus initial 1280×800. Another incognito tab already used 127.0.0.1, so same-origin storage may be shared; no interference was proven. One mistaken unmatched Built to Last option timed out and was corrected to observed v2. Identity preview replaced its selector, explaining one follow-up selector timeout. No hidden engine info, direct storage access/writes, global preference changes, game starts or invalid saved drafts. Existing decks were not edited/deleted.

Closed own explicit tabs with close API; own link popup's API close rejected ownership, so `window.close()` closed it successfully. Saved legal custom list retained. No storage clear/restore. Full structured evidence and exact traces: `pools-review.json`; three pool DOM texts: `pools-guide-dom.json`; initial notes: `pools-first-impressions.md`.
