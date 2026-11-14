/* Official NSG Core Sets starting decks, fetched 2026-11-13. Immutable save IDs. */
(function(){
 const catalog=[
  {
    "title": "Dashing Mad",
    "identity": 35001,
    "side": "runner",
    "cards": [
      [
        35003,
        2
      ],
      [
        30028,
        3
      ],
      [
        35015,
        3
      ],
      [
        30029,
        2
      ],
      [
        35004,
        2
      ],
      [
        35005,
        3
      ],
      [
        30030,
        3
      ],
      [
        35018,
        2
      ],
      [
        35011,
        3
      ],
      [
        35034,
        3
      ],
      [
        30033,
        2
      ],
      [
        30034,
        2
      ],
      [
        30015,
        2
      ],
      [
        35009,
        3
      ],
      [
        30026,
        2
      ],
      [
        30004,
        3
      ],
      [
        30007,
        3
      ],
      [
        30008,
        2
      ]
    ],
    "source": "https://netrunnerdb.com/en/decklist/074c32b0-6429-49ec-91c1-46dcddba9e4b/-nsg-core-dashing-mad",
    "id": "phoenix-core-v1",
    "name": "Ryō “Phoenix” Ōno: Out of the Ashes",
    "faction": "Anarch",
    "style": "Run through danger",
    "description": "Let a subroutine resolve, then complete the run to gain a credit and force an HQ trash. Shred and new economy tools support aggressive runs.",
    "pool": "core-v1"
  },
  {
    "title": "Brutal Efficiency",
    "identity": 30035,
    "side": "corp",
    "cards": [
      [
        30036,
        1
      ],
      [
        30067,
        3
      ],
      [
        35038,
        2
      ],
      [
        30069,
        2
      ],
      [
        35039,
        2
      ],
      [
        30071,
        2
      ],
      [
        30053,
        3
      ],
      [
        30075,
        3
      ],
      [
        30056,
        1
      ],
      [
        30040,
        3
      ],
      [
        30050,
        2
      ],
      [
        35082,
        2
      ],
      [
        30042,
        3
      ],
      [
        35045,
        2
      ],
      [
        30039,
        2
      ],
      [
        35075,
        3
      ],
      [
        35079,
        2
      ],
      [
        35042,
        2
      ],
      [
        30038,
        1
      ],
      [
        35041,
        3
      ]
    ],
    "source": "https://netrunnerdb.com/en/decklist/b441510e-00e7-42b7-a559-a7eba52b31a4/-nsg-core-brutal-efficiency",
    "id": "precision-design-core-v1",
    "name": "Haas-Bioroid: Precision Design",
    "faction": "Haas-Bioroid",
    "style": "Core Sets glacier",
    "description": "Build scoring servers with new ice, Project Ingatan, Mahkota Langit Grid and Mercia B4LL4RD. Based on the official Brutal Efficiency list.",
    "pool": "core-v1"
  }
];
 for(const d of catalog){d.cards.forEach(Object.freeze);Object.freeze(d.cards);Object.freeze(d);}
 globalThis.NRCoreDecks=Object.freeze({engine:"chiriboga-core-c863f5a-local-2",rulesVersion:"26.03-core-2",engines:Object.freeze({"26.03-core-1":"chiriboga-core-c863f5a-local-1","26.03-core-2":"chiriboga-core-c863f5a-local-2"}),supportedRules:Object.freeze(["26.03-core-1","26.03-core-2"]),cardPool:"core-v1",catalog:Object.freeze(catalog),defaults:Object.freeze({runner:"phoenix-core-v1",corp:"precision-design-core-v1"})});
 if(typeof module!=="undefined")module.exports=globalThis.NRCoreDecks;
})();
