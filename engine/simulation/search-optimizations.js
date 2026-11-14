/* Node simulation only. Browser workers never load this module. */
(function () {
  'use strict';
  const settings = globalThis.NRSearchOptimizationSettings;
  let enabled = false, frame = null;
  const counts = {frames:0, allCardHits:0, allCardMisses:0, installedHits:0, installedMisses:0, invalidations:0, continuousSearches:0};
  const cacheEnabled = () => enabled && settings.cache;
  function clearFrame(target) {
    target.allCards.clear();
    target.installed = new WeakMap();
  }
  function invalidate() {
    if (frame) { clearFrame(frame); counts.invalidations++; }
  }
  function withFrame(callback) {
    if (!cacheEnabled()) return callback();
    const previous = frame;
    frame = {allCards:new Map(), installed:new WeakMap()};
    counts.frames++;
    try { return callback(); }
    finally {
      frame = previous;
      // A nested calculation may have changed and restored hypothetical state.
      if (previous) clearFrame(previous);
    }
  }
  const boot = NR.boot;
  NR.boot = function (config) {
    enabled = config?.simulationFast === true && config?.faceoff === true;
    return boot.apply(this, arguments);
  };
  const allCards = AllCards;
  AllCards = function (player) {
    if (!frame) return allCards.apply(this, arguments);
    if (!frame.allCards.has(player)) {
      counts.allCardMisses++;
      frame.allCards.set(player, allCards.apply(this, arguments));
    } else counts.allCardHits++;
    // Native callers receive fresh arrays and may sort/filter/mutate them.
    return frame.allCards.get(player).slice();
  };
  const installed = CheckInstalled;
  CheckInstalled = function (card) {
    if (!frame || !card) return installed.apply(this, arguments);
    const entry = frame.installed.get(card);
    // Read these fields live: hypothetical moves and hosted-uninstalled status
    // must never reuse an answer from another location, host or owner.
    if (entry && entry.location === card.cardLocation && entry.host === card.host &&
        entry.player === card.player && entry.notInstalled === card.notInstalled) {
      counts.installedHits++;
      return entry.value;
    }
    counts.installedMisses++;
    const value = installed.apply(this, arguments);
    frame.installed.set(card, {location:card.cardLocation, host:card.host, player:card.player, notInstalled:card.notInstalled, value});
    return value;
  };
  // Cache only within one synchronous search step. Do not retain active-trigger
  // lists, modifier values, counters, strength or board state between steps.
  const middle = RunCalculator.prototype.CalculatePieceMiddle;
  RunCalculator.prototype.CalculatePieceMiddle = function (...args) {
    return withFrame(() => middle.apply(this, args));
  };
  // Both upstream paths use the same begin/middle/end code and search limits.
  // The synchronous path omits the UI's setTimeout yield every ten iterations.
  const asynchronous = RunCalculator.prototype.CalculateAsync;
  RunCalculator.prototype.CalculateAsync = async function (...args) {
    if (!enabled || !settings.continuous) return asynchronous.apply(this, args);
    counts.continuousSearches++;
    return this.Calculate(...args);
  };
  for (const name of ['MoveCard','MoveCardByIndex','MoveCardTriggers','InstanceCard','NewServer',
    'ChangePhase','AddLingeringEffect','RemoveLingeringEffect','Rez','Derez','NRCoreInstallPaid']) {
    const original = globalThis[name];
    if (typeof original !== 'function') continue;
    globalThis[name] = function (...args) {
      invalidate();
      try { return original.apply(this, args); }
      finally { invalidate(); }
    };
  }
  globalThis.NRSimulationSearch = {
    // Also used by adversarial fixtures to check expiry and mutation handling.
    withFrame,
    stats: () => ({...counts, cacheEnabled:cacheEnabled(), continuousEnabled:enabled && settings.continuous}),
  };
})();
