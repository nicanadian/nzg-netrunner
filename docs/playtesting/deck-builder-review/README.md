# Deckbuilding modal design review — 2026-11-15

Two independent AI reviewers assessed graphic design and UI/UX, using current source and actual shared-browser captures. Two fresh reviewers then assessed the revised editor, library, card preview and mobile layout. Reviewers were AI agents acting in those roles. This was not a human usability study.

## Findings and resulting design

The initial reviewers agreed that cyan belongs in the game's existing palette. The problem was the strong repeated teal surfaces, independently chosen cyan/green/yellow shades, heavy dividers, and excessive text hierarchy. Gold is now reserved for primary actions and focus; the existing `--cyan` identifies included cards and links. Ivory carries titles/important values, muted text carries routine metadata, and warm error coloring indicates construction problems. The editor, library, import page and full-card preview share surfaces, borders, radii and button treatment.

Card rows now have three logical bands:

1. Name, explicit membership count, and horizontal quantity controls.
2. Type, faction and credit cost.
3. Effective influence per copy, total contribution or short faction relationship, and Read card.

Long names and narrow screens may wrap naturally. The full-card preview retains the detailed faction explanation and multiplication. Artwork remains clickable and loads the 743px display asset.

The routine help is a disclosure. Advanced filters are grouped separately from Search/Type/Faction. The sticky summary/actions bar is compact; Close remains in a sticky header. Library action groups align along the bottom of their tiles. Empty searches explain the result and offer Clear filters.

Mobile switches between Your deck and Add replacements. Each active list flows through the modal instead of being an independently scrolling miniature list. Quantity buttons are at least 40 CSS pixels on mobile, and background scrolling is locked while a modal is open.

## Measured layout

At a 1280×800 viewport, the first four replacement rows measured 182.09px before and 93.80px after. Row widths changed from 520.5px to 548px as modal padding and spacing were revised. These measurements describe the sampled rows, not a guaranteed height for every name or text scale.

At 390×844, sampled rows measured 121.5px with 40×40px quantity buttons. No horizontal overflow was observed at 320px or 390px widths. Mobile text is allowed to wrap.

## Final reviewers

The fresh graphic-design reviewer approved the direction with no visual blockers. It requested keyboard/sticky-region checks and aligned library actions, both addressed afterward. The fresh UX reviewer likewise found no visual blockers and flagged focus continuity after view switches and filter clearing; these were fixed and checked in the browser. Neither reviewer recommended abandoning cyan or restoring tall rows.

Remaining validation opportunities are physical touch use, increased browser text/zoom and a dedicated screen-reader pass. The checked viewport sizes and accessible names are useful functional evidence, not accessibility certification.

## Verification

- `npm run test:decks`, `node tests/decks.cjs` and `node tests/polish.cjs` pass.
- Shared-browser UI checks covered identity/faction changes, effective-influence filtering, quantity changes, copy/influence/minimum-size errors, empty search and Clear filters, preserved advanced-filter state, full-resolution preview, Escape/back navigation and save-and-use.
- Mobile view switching restores focus to the selected view button. Clear filters restores Search focus; the next Tab reaches Type rather than restarting at Close. Focused fields were checked below the sticky controls at 320px.
- A temporary named deck was saved and selected from the actual UI, then removed. Its saved list remained the intended 40-card/12-influence Tao list.
- No engine rules or release artifacts were changed by this design pass. Published v0.2.0 remains separate on port 5174.

## Captures

- [Before: editor top](before-desktop-top.png)
- [Before: replacement rows](before-desktop-rows.png)
- [After: editor](after-desktop-editor.png)
- [After: library](after-desktop-library.png)
- [After: import](after-desktop-import.png)
- [After: full card](after-desktop-card-preview.png)
- [After: mobile replacements](after-mobile-replacements.png)

## Follow-up: unexpected 48/15 influence

The user's reported `Uses 48/15 influence` was reproduced exactly: open Zahya's Gateway list and select Tao in the editor. The old handler immediately changed the identity while retaining every card. The arithmetic was correct, but the earlier review did not catch the confusing character-switch workflow.

A nonempty deck now previews the choice before changing anything: load the new character's legal ready-made list, explicitly retain the current cards and change identity, or cancel. The keep-cards option shows its resulting construction requirements/errors beforehand. Opposite-side changes offer a matching starter rather than keeping wrong-side cards. Existing mismatched drafts have a recovery action to load the current character's ready-made list. Starting a new empty deck still allows choosing an identity without injecting cards. Saved decks are not modified by loading another character's list.

The quantity buttons now stop at a card's copy limit, with a handler guard for stale actions. Invalid imported drafts can still be repaired by removing excess copies.

Actual shared-browser UI checks covered the exact Zahya→Tao case, cancel, starter loading (40 cards/12 influence), explicit keep-cards and recovery, all seven Gateway starters and all 21 Core sample starters, Runner/Corp switching, and the 390px switch screen. The Core checks verify construction and navigation, not full card-rules or AI certification.

A real UI swap removed one Telework Contract and added a third Botulus, producing a legal 40-card/15-influence Tao deck. Save-and-use selected it; starting the game embedded the exact quantities and reached Runner Mulligan with empty engine diagnostics. The high-resolution image loaded at 743px. The temporary test deck and test game were cleaned up.

Automated regression checks now cover the exact 48/15 preview, cancel immutability, loading the proper list, explicit identity-only changes, wrong-side protection, saved-custom-deck preservation, empty-deck identity selection and the copy-limit guard. Evidence is retained in [character-switch-checks.json](character-switch-checks.json).
