# Third-party notices

The game rules, System Gateway implementations, run calculator, and heuristic opponents in `vendor/chiriboga` are from [bobtheuberfish/chiriboga](https://github.com/bobtheuberfish/chiriboga), commit `77c80b1f0f96a2af068f5d267cc0df1a1b0c9b39`, licensed under GNU GPL version 3. The full license is retained both at the project root and in the vendor directory. Original source comments are retained. The new adapter and frontend are also provided under GPL-3.0.

`vendor/chiriboga/seedrandom.min.js` is the upstream-distributed seedrandom library, with its original license header retained.

The 76 candidate Elevation definitions in `vendor/chiriboga-elevation/sets/elevation.js` are from [drbo6/chiriboga](https://github.com/drbo6/chiriboga), commit `c863f5af74ceb4fa821a4c84d3f643efffacb7ba`, under GPL-3.0. The source file, license and provenance are retained. The six missing NBN cards and compatibility/rules corrections are local code in `engine/`; the pinned vendor source is unchanged. This attribution does not imply comprehensive rules or AI certification.

Card names, rules text, art, and frames are credited to their respective creators, including Null Signal Games and the artists printed on the cards. The local assets were downloaded from NetrunnerDB and Chiriboga's public card-image hosts. See `assets/card-sources.json` for exact URLs, dimensions, hashes, and retrieval information. These images are not relicensed by the code's GPL license. This local project is independent and is not endorsed by Null Signal Games.

Elevation faces, including both reverse identity faces, are extracted at native 746×1033 resolution from Null Signal Games’ official English A4 print-and-play PDF. The source URL, PDF checksum, image-object mapping, ICC color conversion and delivery checksums are recorded in `assets/elevation-sources.json`. Rebuild or verify with `scripts/build-elevation-assets.py --download` / `--check`. Bundled public sample decklists retain source URLs, authors and retrieval snapshots in `engine/net-decks.js`.

`assets/playmat.png` is original AI-generated illustration created for this project. See `docs/playmat-generation.md` for the generation method and prompt.
