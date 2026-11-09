# Graphic and visual design review

Independent AI specialist review, 2026-11-05. This is a graphic-design perspective, not a claim of human professional credentials. Read-only review of actual Chrome rendering at its normal 1771 × 961 viewport on isolated origin `http://localhost:5175`. No application code changed and no viewport override applied.

## Overall direction

Preserve the art-led lobby, restrained cream/gold interface, real card imagery, split Corp/Runner table, and large readable inspector. They already give the project a coherent identity. The polish opportunity is to make the actual table quieter and the functional UI more deliberate. At present the atmospheric background and tiny metadata are often more visually prominent than the game state that matters.

Viewed the lobby, a new live Runner opening, layered-server reference position, broken-barrier movement position, asset inspector, help dialog, game menu, and Runner scored-agenda library. Screenshot evidence is in `eval/polish/graphic-*.jpg`. Own Chrome tab closed after review.

## Ranked changes

### 1. Quiet the playmat without losing its faction identity

**Observed:** Corp's bright cyan city and Runner's saturated orange city have strong diagonals, broad light areas, and surface texture directly behind the smallest cards and zone outlines. In the live opening, the largely empty board reads as two large hero illustrations with a thin interface on top. In the populated reference, the lower card borders and zone text disappear into the orange architecture.

**Change:** Keep the artwork and cyan/orange split, but add a stronger dark neutral overlay and reduce saturation specifically on the gameplay surfaces. Give the stat strip a consistent translucent dark backing. Preserve a little color at the perimeter. No need to change the lobby art.

**Acceptance:** At a glance, identify both players' credits/clicks, the installed cards, and the attacked server before noticing the city architecture. Zone borders should read consistently over both sides.

**Evidence:** `graphic-layered.jpg`, `graphic-live-opening.jpg`.

### 2. Bring functional microcopy up to a readable scale

**Observed:** Grip instructions, hand limit, identity/category labels, free-memory unit, and spent-click labels are very small. The server orientation strip is especially compressed: it is a full-board separator with tiny widely tracked text. The Corp click count appears as a small `0` above `CLICKS`; free memory similarly uses a stacked `FREE / MU` treatment. This makes the headers look assembled from unrelated components.

**Change:** Use one common label scale (roughly 11–12 px as a minimum at this desktop size) and fewer letter-spaced uppercase labels. Align the credits, click markers/count, and memory on one deliberate baseline. Use plain `3 MU free` / `2 clicks` text with consistent secondary-label color. Increase the orientation strip text or simplify its copy.

**Acceptance:** Functional metadata can be read without browser zoom, and the Corp/Runner headers look like the same component family.

**Evidence:** `graphic-layered.jpg`, `graphic-encounter.jpg`.

### 3. Make the score area a purposeful visual object

**Observed:** Opening Runner's `2 / 7 AGENDA` shows a roughly 1000 px wide dialog containing a single tiny agenda. It says `SYSTEM GATEWAY · 77 CARDS`, `Inspect pile`, and `Scored agendas · 1 cards`. The broad empty rectangle and generic catalog header undermine the importance of scoring.

**Change:** Name the player and purpose in the heading: `Runner’s score area`. Lead with `2 agenda points · 1 card`. Use a more compact panel for small piles and a comfortable card grid for larger ones. Correct singular/plural. Consider a tiny printed agenda-point badge beside each agenda title so the total is easy to reconcile.

**Acceptance:** The score overlay immediately explains whose score it is, the total points, and which cards produced them, without unrelated catalog metadata.

**Evidence:** `graphic-score.jpg`.

### 4. Consolidate card overlays into a disciplined system

**Observed:** A card can carry its printed title, black digital title strip, circular strength badge, token shape, numeric token value, and a separate black `CR`/`VIR` tab. The labels are legible but feel like several independent stickers. Leech and Telework are visually busier than cards without counters. In the asset inspector, a tiny credit badge is followed by a second line `6 hosted credits`, creating a sparse, duplicated counter section.

**Change:** Preserve exact numeric counters and distinct token colors/shapes. Use a consistent overlay anchor and spacing rule, keep the digital name rail clean, and visually join abbreviation/number/icon into one badge. In inspector, use one concise inline row such as `[credit stack] 6 hosted credits` rather than a badge followed by another paragraph. Avoid removing the names: they are useful at board scale.

**Acceptance:** At tabletop size, every card's name and state can be parsed in the same locations; counters never overlap the digital name rail.

**Evidence:** `graphic-layered.jpg`, `graphic-inspector.jpg`.

### 5. Use icons to distinguish outcomes and destinations

**Observed:** The same northeast arrow appears on an external video link, an internal pile inspection button, a direct card action, and `Jack out`. These are different operations. It gives almost every control the visual suggestion of an external destination. Unicode glyphs also vary in weight: tiny arrows, broad refresh-style click icons, circular strength badges, and the tiny menu glyph do not share one stroke language.

**Change:** Reserve `↗` for actual links to another page/site. Use a chevron for opening a choice/pile, and no trailing icon on a direct action unless the icon conveys a specific game consequence. Retain the characteristic physical click tokens, but simplify secondary control iconography around them.

**Acceptance:** Players can tell a direct action, a choice expansion, and an external link apart by their visual treatment.

**Evidence:** `graphic-encounter.jpg`, `graphic-layered.jpg`, `graphic-menu.jpg`.

### 6. Make help teach the visual language it describes

**Observed:** The help dialog has clean typography but is a tall continuous column. The token/counter section spells out abbreviations in prose while the game already has visual token components. The last paragraphs fall below the initial viewport. This is an opportunity to reinforce the new token system rather than add more copy.

**Change:** Add a compact visual legend using actual bright/spent click tokens and credit/virus/advancement badge samples, paired with plain labels. Break the table guidance into short, scannable blocks. Keep the modal's calm text-first appearance.

**Acceptance:** Opening help makes the markers recognizable before the user reads a long paragraph.

**Evidence:** `graphic-help.jpg`.

### 7. Remove small context mistakes from menu/lobby

**Observed:** On the lobby the game menu presents `Return to lobby`, while export/concede/undo are disabled. The lobby also offered `Resume game` on this isolated origin before I created a live game; its meaning is ambiguous alongside the main start action. These are UI details that make a polished visual shell feel less finished.

**Change:** Hide redundant Return to lobby when already there, give Resume an explicit saved-game context only when a resumable live game exists, and distinguish disabled utilities from useful opening actions. Preserve the menu's spacing and restrained surface treatment.

**Acceptance:** Every visible primary/secondary control has a clear purpose in the current context.

**Evidence:** `graphic-lobby.jpg`, `graphic-menu.jpg`.

## What already works

- The lobby composition, large headline, offset identity cards, and restrained gold selection outline are cohesive. Avoid a whole-lobby redesign.
- The inspector has an excellent large-card/text pairing, clear title, and comfortable rule text. Keep its overall layout and image quality.
- The attacked server and encountered ice receive clear gold emphasis, and the continuation action is visually primary in the movement reference.
- The hand is readable as a distinct personal zone and the real card art remains the focus.
- Turned-over click markers and numerically exact hosted credits are appropriate physical-table cues. Their surrounding typography needs refinement more than their core metaphor.

## Review limit

This pass evaluates visual hierarchy and presentation in the states above. It does not verify all rule combinations, long games, mobile layout, or accessibility contrast ratios. No arbitrary visual score is assigned. The most valuable cohesive pass is items 1–4, followed by the contextual copy/icon fixes.

## Revision retest

Reloaded the revised app in actual Chrome, same normal viewport, on 2026-11-05. Reviewed layered servers, movement after breaking Palisade, score library, Nico inspector, help, and lobby menu. Evidence: `graphic-after-layered.jpg`, `graphic-after-encounter.jpg`, `graphic-after-score.jpg`, `graphic-after-inspector.jpg`, `graphic-after-help.jpg`, `graphic-after-menu.jpg`. Own tab closed after review.

The revision is a coherent overall improvement. The table remains recognizably the same game, but its state now reads before its decoration.

- **Playmat:** Darker, less saturated surfaces preserve Corp/Runner atmosphere while letting card edges and gold availability outlines stand forward. Common dark status rails are a particularly successful unifying change.
- **Typography/status:** Credits, click totals, and free memory now align into a readable shared strip. Stronger category labels and plain sentence-case orientation guidance improve the information hierarchy. Hand limit now reads as an explicit card count and limit.
- **Score library:** The oversized generic catalog dialog is replaced by a compact player-specific panel, with `2 agenda points · 1 card`, centered agenda, and per-card points. Singular/plural and unrelated 77-card metadata are resolved.
- **Card state:** Integrated CR/VIR labels read as a single badge. STR tags clearly distinguish current strength from costs/counters. Central pile totals moved off the cards into server headers, revealing the title rails. Nico's narrow title wraps cleanly rather than becoming microscopic. Inspector's hosted-credit line is compact and purposeful.
- **Action hierarchy:** Submenu chevrons and direct-action arrows differentiate decisions from outside links. The two-column basic resource actions reduce sidebar repetition. The movement panel's explicit `1 broken` and `✓ Broken` treatment is clearer than the original crossed-out line alone.
- **Help/menu:** Actual marker samples now teach the token language visually. Return to lobby is hidden while in lobby. Saved locally / Runner context makes Resume clearer. The inspector and lobby composition have retained their strongest qualities.

One small remaining visual consistency detail was sent to the implementer: lobby `Jack in ↗` retains the external-link arrow while game actions now use `→`. Changing that arrow would complete the distinction. This is minor polish, not a blocker to the overall improvement. No further visual defect was found in the reviewed desktop states; responsive geometry remains a separate verification task.
