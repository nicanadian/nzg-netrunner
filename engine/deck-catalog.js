/* Shared, versioned Gateway loadouts for the lobby, worker and saved replays. */
(function () {
  const catalog = [
    {id:'loup-v1',side:'runner',identity:30001,name:'René “Loup” Arcemont',faction:'Anarch',style:'Trash & viruses',
      description:'Trash accessed cards for a credit and a card. Grow viruses and dismantle the Corp’s defenses.',
      cards:[[30002,3],[30003,2],[30004,3],[30005,3],[30006,3],[30007,3],[30008,3],[30015,3],[30028,3],[30029,3],[30030,3],[30031,2],[30033,3],[30034,3]]},
    {id:'zahya-v2',side:'runner',identity:30010,name:'Zahya Sadeghi',faction:'Criminal',style:'Central-server pressure',
      description:"Find your rig with draw and breaker searches, earn credits from central accesses, and pressure servers with run economy.",
      cards:[[30011,3],[30012,3],[30013,2],[30014,3],[30015,2],[30016,2],[30017,2],[30018,3],[30005,2],[30004,1],[30027,2],[30033,1],[30028,3],[30029,3],[30030,3],[30034,2],[30021,3]]},
    {id:'tao-v1',side:'runner',identity:30019,name:'Tāo Salonga',faction:'Shaper',style:'Build a rig & rearrange ice',
      description:'Swap installed ice when agendas are scored or stolen. Build efficient breakers and grow Conduit for deeper R&D access.',
      cards:[[30020,3],[30021,3],[30022,2],[30023,2],[30024,2],[30025,3],[30026,3],[30027,3],[30006,3],[30004,2],[30028,3],[30029,3],[30030,3],[30033,3],[30034,2]]},
    {id:'precision-design-v2',side:'corp',identity:30035,name:'Haas-Bioroid: Precision Design',faction:'Haas-Bioroid',style:'Build & score',
      description:"Protect your scoring server with bioroids and affordable ice. Campaign income and card selection help sustain scoring.",
      cards:[[30036,1],[30067,3],[30069,3],[30070,1],[30037,3],[30038,3],[30039,3],[30040,3],[30042,2],[30071,1],[30072,3],[30073,3],[30074,3],[30075,3],[30053,2],[30048,2],[30056,3],[30041,2]]},
    {id:'restoring-humanity-v2',side:'corp',identity:30043,name:'Jinteki: Restoring Humanity',faction:'Jinteki',style:'Ambushes & net damage',
      description:"Build affordable defenses, earn Archives income, and threaten ambushes and damage while preparing to score.",
      cards:[[30044,1],[30067,3],[30068,2],[30069,2],[30045,3],[30046,3],[30047,3],[30048,3],[30049,2],[30050,2],[30071,3],[30072,3],[30073,3],[30074,3],[30075,3],[30053,3],[30061,2]]},
    {id:'reality-plus-v2',side:'corp',identity:30051,name:'NBN: Reality Plus',faction:'NBN',style:'Tags & consequences',
      description:"Use affordable ice and card draw to establish defenses. Tags fuel identity rewards and Retribution.",
      cards:[[30052,1],[30067,3],[30068,2],[30069,2],[30053,3],[30054,3],[30055,3],[30056,3],[30057,2],[30058,2],[30071,3],[30072,3],[30073,3],[30074,3],[30075,3],[30065,3],[30048,2]]},
    {id:'built-to-last-v2',side:'corp',identity:30059,name:'Weyland Consortium: Built to Last',faction:'Weyland Consortium',style:'Advance & threaten',
      description:'Build early defenses with affordable ice, earn credits from advancement, and threaten meat damage from Clearinghouse.',
      cards:[[30060,1],[30067,3],[30068,2],[30069,1],[30070,3],[30061,2],[30062,2],[30063,2],[30064,1],[30065,1],[30066,1],[30071,3],[30072,3],[30074,3],[30075,3],[30053,3],[30073,3],[30055,3]]},
  ];
  // Historical deck IDs remain immutable for saved games and deterministic replays.
  const archived = [
    {id:'precision-design-v1',side:'corp',identity:30035,name:'Haas-Bioroid: Precision Design',faction:'Haas-Bioroid',style:'Build & score',
      description:'Score behind bioroid ice, then recover a card from Archives. Campaigns fund a protected scoring server.',
      cards:[[30036,1],[30067,3],[30068,2],[30069,1],[30070,3],[30037,3],[30038,3],[30039,3],[30040,3],[30042,2],[30071,3],[30072,3],[30073,3],[30075,3],[30053,2],[30048,2]]},
    {id:'restoring-humanity-v1',side:'corp',identity:30043,name:'Jinteki: Restoring Humanity',faction:'Jinteki',style:'Ambushes & net damage',
      description:'Earn income from facedown Archives cards. Bluff with advanced ambushes and punish risky runs with net damage.',
      cards:[[30044,1],[30067,3],[30068,2],[30069,1],[30070,3],[30045,3],[30046,3],[30047,3],[30048,3],[30049,2],[30050,2],[30071,3],[30072,3],[30073,2],[30074,1],[30075,3],[30053,2]]},
    {id:'reality-plus-v1',side:'corp',identity:30051,name:'NBN: Reality Plus',faction:'NBN',style:'Tags & consequences',
      description:'Turn the first tag each turn into credits or cards. Tagging ice and operations open the way for Retribution.',
      cards:[[30052,1],[30067,3],[30068,2],[30069,1],[30070,3],[30053,3],[30054,3],[30055,3],[30056,3],[30057,2],[30058,2],[30071,3],[30072,3],[30073,2],[30075,3],[30065,3]]},
    {id:'zahya-v1',side:'runner',identity:30010,name:'Zahya Sadeghi',faction:'Criminal',style:'Central-server pressure',
      description:'Earn credits from HQ and R&D accesses. Use extra accesses, run economy and ice derezzing to keep moving.',
      cards:[[30011,3],[30012,3],[30013,2],[30014,2],[30015,3],[30016,3],[30017,2],[30018,3],[30005,3],[30004,2],[30027,3],[30028,3],[30029,3],[30030,3],[30034,2]]},
    {id:'built-to-last-v1',side:'corp',identity:30059,name:'Weyland Consortium: Built to Last',faction:'Weyland Consortium',style:'Advance & threaten',
      description:'Earn credits from the first advancement counter on a card. Build towering ice and threaten meat damage from Clearinghouse.',
      cards:[[30060,1],[30067,3],[30068,2],[30069,1],[30070,3],[30061,3],[30062,3],[30063,3],[30064,3],[30065,2],[30066,2],[30071,3],[30072,3],[30074,3],[30075,3],[30053,2]]},
  ];
  const defaults = {runner:'loup-v1',corp:'precision-design-v2'};
  // Saves without explicit deck IDs predate versioned lobby choices.
  const legacyDefaults = {runner:'loup-v1',corp:'precision-design-v1'};
  function resolve(ids) {
    if (ids !== undefined && (!ids || typeof ids !== 'object' || Array.isArray(ids))) throw Error('Invalid character selection.');
    return Object.fromEntries(['runner','corp'].map(side=>{
      const key = ids?.[side] ?? legacyDefaults[side];
      const deck = catalog.find(d=>d.id === key && d.side === side) || archived.find(d=>d.id === key && d.side === side);
      if (!deck) throw Error(`Unknown ${side === 'runner' ? 'Runner' : 'Corp'} deck: ${String(key).slice(0,80)}`);
      return [side,deck];
    }));
  }
  const expand = deck => ({identity:deck.identity,cards:deck.cards.flatMap(([number,count])=>Array(count).fill(number))});
  for (const deck of [...catalog,...archived]) {deck.cards.forEach(Object.freeze);Object.freeze(deck.cards);Object.freeze(deck);}
  const api = Object.freeze({catalog:Object.freeze(catalog),defaults:Object.freeze(defaults),resolve,expand});
  globalThis.NRDecks = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
