/* Local Table adapter and versioned rules corrections; upstream stays pinned. */
(function () {
  const CURRENT_RULES = '26.03-local-2';
  const SUPPORTED_RULES = ['26.03-local-1', CURRENT_RULES];
  const currentRules = () => SUPPORTED_RULES.includes(config?.rulesVersion);
  const fullPaidChoices = () => config?.rulesVersion === CURRENT_RULES;
  const rulesAdvanceChoices = phases.corpActionMain.Enumerate.advance;
  phases.corpActionMain.Enumerate.advance = function () {
    if (!fullPaidChoices() || corp.AI) return rulesAdvanceChoices.call(this);
    if (!CheckActionClicks(corp, 1)) return [];
    return ChoicesInstalledCards(corp, CheckAdvance).filter(({card}) => CheckCredits(corp, 1, 'advancing', card));
  };
  const noop = () => {};
  Render =
    UpdateCounters =
    SetHistoryThumbnail =
    AddHistoryBreakIfRequired =
    RenderRewindOptions =
      noop;
  ReproductionCode = () => "";
  Main = ExecuteChosen = MakeChoice = ResolveChoice = noop;
  cardRenderer = new Proxy({}, { get: () => noop });
  // The original renderer zooms cards that may still be in a deck. Preserve
  // that explicit viewing window without exposing the rest of the pile.
  const viewedPhases = new WeakMap();
  // CR 7.3.1a: an accessed object stays visible until this breach ends.
  // Remember its zone too: a card changing zones becomes a new object.
  const breachVisibility = new Map();
  const rulesPlayerCanLook = PlayerCanLook;
  PlayerCanLook = function (player, card) {
    return rulesPlayerCanLook(player, card) ||
      (currentRules() && player === runner && breachVisibility.has(card) && breachVisibility.get(card) === card.cardLocation);
  };
  const rulesMoveCardTriggers = MoveCardTriggers;
  MoveCardTriggers = function (card, from, to) {
    if (from !== to) breachVisibility.delete(card);
    return rulesMoveCardTriggers.apply(this, arguments);
  };
  const guidedPhases = new WeakMap(), anoeticRemaining = new WeakMap(), phaseSources = new WeakMap();
  const phaseSourceCard=()=>currentPhase.context?.isCard ? currentPhase.context : phaseSources.get(currentPhase);
  const rulesChangePhase=ChangePhase;
  ChangePhase=function(phase,...args) {
    // CR 6.9.6b: empty the bad-publicity fund before run-end abilities.
    if (currentRules() && (phase === phases.runEnds || phase === phases.runUnsuccessful) && runner.temporaryCredits > 0) {
      Log(`Runner returns ${runner.temporaryCredits} unspent bad publicity credits`);
      runner.temporaryCredits = 0;
    }
    if (phase === phases.runAccessingCard && accessingCard)
      breachVisibility.set(accessingCard, accessingCard.cardLocation);
    if (phase === phases.runEnds || phase === phases.runUnsuccessful)
      breachVisibility.clear();
    if (phase?.identifier==='Pantograph Install') {
      const source=InstalledCards(runner).find(c=>c.setNumber===30023 && c.SharedPhase===phase);
      if(source){phaseSources.set(phase,source);guidedPhases.set(phase,{kind:'pantograph-install'});}
    }
    return rulesChangePhase.call(this,phase,...args);
  };
  const abilityPhases = new WeakMap();
  const rulesTriggerAbility = TriggerAbility;
  TriggerAbility = function (card, ability, ...args) {
    const phase = rulesTriggerAbility.call(this, card, ability, ...args);
    abilityPhases.set(phase, {card, ability});
    return phase;
  };
  const rulesReveal = Reveal, rulesDecisionPhase = DecisionPhase;
  Reveal = function (card, ...args) {
    const result = rulesReveal.call(this, card, ...args);
    if (currentPhase?.title?.startsWith('Revealing ')) viewedPhases.set(currentPhase,{kind:'reveal',card});
    return result;
  };
  DecisionPhase = function (...args) {
    const phase = rulesDecisionPhase.apply(this,args);
    if (args[3]?.startsWith('Exposing ') && intended.expose) viewedPhases.set(phase,{kind:'expose',card:intended.expose});
    if (args[5]?.setNumber===30050) {
      if (args[6]==='discard') {
        const remaining=anoeticRemaining.get(args[5]) || 2;
        guidedPhases.set(phase,{kind:'anoetic-trash',remaining});anoeticRemaining.set(args[5],remaining-1);
      } else if (args[1]?.some(o=>/Pay 2/.test(o.button || o.label || ''))) {
        anoeticRemaining.set(args[5],2);guidedPhases.set(phase,{kind:'anoetic-choice'});
      }
    }
    return phase;
  };
  // Track public encounter outcomes without changing upstream timing or choices.
  const firedSubroutines = new WeakMap();
  const rulesAutomaticTriggers = AutomaticTriggers;
  AutomaticTriggers = function (name, cards, ...args) {
    if (name === "automaticOnEncounter") for (const card of cards || []) firedSubroutines.set(card, new Set());
    return rulesAutomaticTriggers.call(this, name, cards, ...args);
  };
  const rulesTrigger = Trigger;
  Trigger = function (card, ability, params, verb) {
    if (verb === "Firing" && card?.subroutines?.includes(ability)) {
      if (!firedSubroutines.has(card)) firedSubroutines.set(card, new Set());
      firedSubroutines.get(card).add(card.subroutines.indexOf(ability));
    }
    const previous=effectSource;effectSource=card;
    try {
      const result=rulesTrigger.apply(this, arguments);
      if (card?.setNumber===30023 && currentPhase.identifier==='Pantograph Install') {
        phaseSources.set(currentPhase,card);guidedPhases.set(currentPhase,{kind:'pantograph-install'});
      }
      return result;
    } finally {effectSource=previous;}
  };
  // Preserve the upstream install transaction while exposing its final payment.
  // The quote is recomputed after optional trashing changes the destination.
  let installContext = null;
  const rulesInstall = Install;
  Install = function (...args) {
    const [card, destination = null, ignoreAllCosts = false, position = null] = args;
    const context = {
      card, destination, ignoreAllCosts, position,
      actionClick: ["Corp 2.2", "Runner 1.3"].includes(currentPhase.identifier) && executingCommand === "install",
    };
    const previousServers = card.player === corp && destination === null ? new Set(corp.remoteServers) : null;
    installContext = context;
    const result = rulesInstall.apply(this, args);
    if (previousServers) context.destination = corp.remoteServers.find(server => !previousServers.has(server)) || null;
    return result;
  };
  const history = [],
    diagnostics = [];
  let version = 0,
    steps = 0,
    turn = 1,
    lastTurn = null,
    terminal = null,
    cached = null,
    config;
  let instance = 0;
  let effectSource = null, drawing = null, basicDrawing = false, pendingDamage=null, latestDamage=null, activeSwap=null;
  const spinLocations = new WeakMap();
  const id = (card) =>
    card && (card.localId || (card.localId = "c" + ++instance));
  const side = (p) => (p === corp ? "corp" : "runner");
  const plain = (text) =>
    String(text ?? "")
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replaceAll("[click]", "Click")
      .replaceAll("[credit]", "credit")
      .replaceAll("[c]", " credit")
      .replaceAll("->", "→")
      .replaceAll("[trash]", "Trash");
  Log = (value) => {
    if (!logDisabled) {
      let text = plain(value);
      const owner = side(playerTurn);
      const actor = /^Corp\b/.test(text) ? 'corp' : /^Runner\b/.test(text) ? 'runner' : side(activePlayer || playerTurn);
      const source = effectSource || (currentPhase?.context?.isCard ? currentPhase.context : null);
      let effect;
      if (activeSwap && / swapped(?: with|$)/.test(text)) {
        const [a,b]=activeSwap.targets;
        text=`Tāo Salonga swaps ${a.location} ↔ ${b.location}`;
        effect={kind:'swap',card:{id:id(activeSwap.source),number:30019,title:activeSwap.source.title},targets:activeSwap.targets};
      }
      if (/ derezzed$/.test(text) && source?.setNumber===30017 && PlayerCanLook(viewingPlayer,source))
        effect={kind:'derez',card:{id:id(source),number:source.setNumber,title:source.title}};
      let damage;
      const damageMatch=text.match(/^Runner takes (\d+) (net|meat|core) damage$/);
      if (damageMatch) {
        damage={amount:Number(damageMatch[1]),type:damageMatch[2],gripBefore:runner.grip.length,
          ...(pendingDamage?.card ? {card:pendingDamage.card} : {})};
        latestDamage=damage;pendingDamage=null;
      }
      if (source?.setNumber === 30053 && PlayerCanLook(viewingPlayer, source)) {
        const server = GetServer(source);
        if (server) spinLocations.set(source, server);
        const location = server || spinLocations.get(source);
        const kind = /^Corp rezzed Spin Doctor/.test(text) ? 'rez'
          : /^Using Spin Doctor:/.test(text) ? 'ability'
          : /^Spin Doctor removed from the game$/.test(text) ? 'remove'
          : / shuffled into R&D from Archives$|^R&D shuffled$/.test(text) ? 'shuffle' : null;
        if (kind) effect = {kind,card:{id:id(source),number:source.setNumber,title:source.title},
          ...(location ? {server:location.serverName} : {}),
          ...(kind==='remove' && location && !location.cards ? {rootEmpty:location.root.length===0} : {})};
      }
      history.push({ text, turn, side: side(playerTurn),
        ...(actor !== owner ? {actor} : {}), ...(effect ? {effect} : {}), ...(damage ? {damage} : {}),
        ...(drawing && /^(Corp|Runner) drew (a card|\d+ cards)$/.test(text) ? {draw: drawing} : {}) });
    }
  };
  const rulesDamage=Damage;
  Damage=function(type,amount,...args) {
    const source=effectSource || (currentPhase.context?.isCard ? currentPhase.context : null);
    pendingDamage={...(source && PlayerCanLook(viewingPlayer,source) ? {card:{id:id(source),number:source.setNumber,title:source.title,
      ...(source.setNumber===30045 ? {advancement:source.advancement || 0} : {})}} : {})};
    return rulesDamage.call(this,type,amount,...args);
  };
  const rulesDerez=Derez;
  Derez=function(card,...args) {
    const previous=effectSource;
    effectSource=(card.hostedCards || []).find(c=>c.setNumber===30017 && c.virus>=3) || effectSource;
    try {return rulesDerez.call(this,card,...args);} finally {effectSource=previous;}
  };
  // Explain the public cause of a draw without exposing the cards drawn or
  // changing the upstream draw/response transaction.
  const rulesDraw = Draw;
  const rulesBasicActionDraw = BasicActionDraw;
  BasicActionDraw = function (...args) {
    const previous = basicDrawing;
    basicDrawing = true;
    try { return rulesBasicActionDraw.apply(this, args); }
    finally { basicDrawing = previous; }
  };
  Draw = function (player, ...args) {
    const previous = drawing;
    const source = effectSource || currentPhase.context;
    drawing = player === corp && currentPhase === phases.corpEndDraw
      ? {kind: "mandatory"}
      : basicDrawing
        ? {kind: "action"}
        : {kind: "effect", source: source?.isCard && PlayerCanLook(viewingPlayer, source) ? source.title : null};
    try { return rulesDraw.call(this, player, ...args); }
    finally { drawing = previous; }
  };
  LogError = (value) => diagnostics.push(String(value?.stack || value));
  console.log = noop;
  console.error = LogError;
  PlayerWin = (p, reason) => {
    if (!terminal) {
      terminal = { winner: side(p), reason: plain(reason),
        ...(reason==='Runner flatlined' && latestDamage ? {damage:latestDamage} : {}) };
      Log(reason);
    }
  };
  // Preserve legacy choice traces when no rules version is present. New games
  // use the current profile; the pinned upstream files remain unmodified.
  const rulesMakeRun = MakeRun;
  MakeRun = function (...args) {
    const result = rulesMakeRun.apply(this, args);
    if (currentRules()) {
      const next = currentPhase;
      const initiation = CreatePhaseFromTemplate(phaseTemplates.standardResponse, runner,
        'Run: Initiation', 'Run 1.5', next);
      // Only non-ice rez is allowed here; CheckApproach is false in Run 1.5.
      ChangePhase(initiation);
    }
    return result;
  };
  const rulesCredits = Credits, rulesAvailableCredits = AvailableCredits, rulesLoseCredits = LoseCredits;
  Credits = function (player) {
    return currentRules() ? player.creditPool : rulesCredits(player);
  };
  AvailableCredits = function (player, ...args) {
    return rulesAvailableCredits(player, ...args) +
      (currentRules() && player === runner && attackedServer ? runner.temporaryCredits : 0);
  };
  LoseCredits = function (player, num) {
    if (!currentRules()) return rulesLoseCredits(player, num);
    const lost = Math.min(player.creditPool, num);
    player.creditPool -= lost;
    Log(`${PlayerName(player)} lost ${lost} credit${lost === 1 ? '' : 's'}`);
    return lost;
  };
  // CR 1.10.3c: the payer chooses the division among eligible locations.
  // Keep payment before its continuation: installs, breaks, rez and trash
  // effects must not resolve while a player is still paying their cost.
  const rulesSpendCredits = SpendCredits;
  SpendCredits = function (player, num, doing = '', card = null, afterSpend, context) {
    if (!fullPaidChoices() || num <= 0)
      return rulesSpendCredits.apply(this, arguments);
    const sources = [];
    const add = (object, key, label, sourceCard = null) => {
      if (object[key] > 0) sources.push({object, key, label, card:sourceCard});
    };
    add(player, 'creditPool', 'credit pool');
    if (player === runner && attackedServer) add(runner, 'temporaryCredits', 'bad publicity');
    for (const source of ActiveCards(player))
      if (typeof source.canUseCredits === 'function' && source.canUseCredits(doing, card))
        add(source, 'credits', source.title, source);
    const spend = (source, amount) => {
      source.object[source.key] -= amount;
      Log(`${PlayerName(player)} spent ${amount} credit${amount === 1 ? '' : 's'} from ${source.label}`);
      UpdateCounters();
    };
    if (sources.reduce((sum, source) => sum + source.object[source.key], 0) < num)
      throw Error('Insufficient eligible credits');
    // No decision is needed when there is only one legal allocation. The AI
    // chooses expiring funds first as a policy, rather than restricting humans.
    if (sources.length <= 1 || player.AI) {
      let remaining = num;
      const priority = [...sources].sort((a,b) =>
        (a.key === 'temporaryCredits' ? 0 : a.card ? 1 : 2) -
        (b.key === 'temporaryCredits' ? 0 : b.card ? 1 : 2));
      for (const source of priority) {
        const amount = Math.min(remaining, source.object[source.key]);
        if (amount > 0) spend(source, amount);
        remaining -= amount;
      }
      if (typeof afterSpend === 'function') afterSpend.call(context);
      return;
    }
    const previous = currentPhase;
    let remaining = num;
    const phase = {
      player, title:'Choose credit sources', identifier:'Pay credits', next:previous,
      requireHumanInput:true,
      text:{pay:'Choose where to spend credits. The effect resolves after the full cost is paid.'},
      Enumerate:{pay() {
        return sources.flatMap((source, sourceIndex) => {
          const options = [];
          for (let amount = 1; amount <= Math.min(source.object[source.key], remaining); amount++)
            options.push({sourceIndex, amount, sourceLabel:source.label,available:source.object[source.key],card:source.card,
              label:`Pay ${amount} credit${amount === 1 ? '' : 's'} from ${source.label}`});
          return options;
        });
      }},
      Resolve:{pay(params) {
        const source = sources[params.sourceIndex];
        spend(source, params.amount);
        remaining -= params.amount;
        if (remaining === 0) {
          ChangePhase(previous, true);
          if (typeof afterSpend === 'function') afterSpend.call(context);
        } else guidedPhases.set(phase, {kind:'credit-payment', total:num, remaining});
      }},
    };
    guidedPhases.set(phase, {kind:'credit-payment', total:num, remaining});
    ChangePhase(phase);
  };
  const rulesBoostStrength = BoostStrength;
  BoostStrength = function (card, amount) {
    const result = rulesBoostStrength.apply(this, arguments);
    // Gateway boosts have no subsequent instruction before the effect-end
    // checkpoint. Outside an encounter they expire there (CR 3.9.5d).
    if (fullPaidChoices() && !CheckEncounter() && breakerProfile(card)) {
      card.strengthBoost = 0;
      Log(`${card.title}'s strength boost expires outside an encounter`);
    }
    return result;
  };
  const expand = (pairs) => pairs.flatMap(([n, count]) => Array(count).fill(n));
  const presets = Object.fromEntries(Object.entries(NRDecks.resolve()).map(([side,deck])=>[side,NRDecks.expand(deck)]));
  function make(n, zone) {
    const c = InstanceCard(n);
    const profile = breakerProfile(c);
    if (profile) {
      const nativeBoost = c.abilities[1].Enumerate;
      c.abilities[1].Enumerate = function () {
        if (!fullPaidChoices() || runner.AI) return nativeBoost.call(this);
        return CheckCredits(runner, breakerProfile(this).boostCost, 'using', this) ? [{}] : [];
      };
    }
    if ([30005,30006].includes(n)) {
      const ability = c.abilities[0], nativeEnumerate = ability.Enumerate, nativeResolve = ability.Resolve;
      ability.Enumerate = function () {
        const options = nativeEnumerate.call(this);
        if (fullPaidChoices() && !runner.AI && CheckEncounter() && CheckStrength(this) &&
          CheckSubType(GetApproachEncounterIce(), breakerProfile(this).type) && CheckCredits(runner, 1, 'using', this))
          options.push({label:'Break 0 subroutines', button:'Break 0 subroutines'});
        return options;
      };
      ability.Resolve = function (params) {
        if (fullPaidChoices() && !params.subroutine)
          return SpendCredits(runner, 1, 'using', this);
        return nativeResolve.call(this, params);
      };
    }
    if (n === 30007 || n === 30008) {
      const ability = c.abilities[0], nativeEnumerate = ability.Enumerate;
      ability.Enumerate = function () {
        if (!fullPaidChoices() || runner.AI) return nativeEnumerate.call(this);
        if (n === 30007) return CheckActionClicks(runner, 1) ? [{}] : [];
        return CheckEncounter() && CheckCounters(this, 'virus', 1) &&
          !GetApproachEncounterIce().strengthCannotBeLowered ? [{}] : [];
      };
    }
    if (n === 30040) {
      const nativeEnumerate = c.Enumerate;
      c.Enumerate = function () {
        if (!currentRules() || corp.AI) return nativeEnumerate.call(this);
        // "Place" counters is not the basic advance action (CR 1.18.2).
        return ChoicesInstalledCards(null, card => !this.cardsInstalledThisTurn.includes(card));
      };
      const nativeInstallTracker = c.automaticOnInstall.Resolve;
      c.automaticOnInstall.Resolve = function (card) {
        if (!currentRules() || card.player === corp) nativeInstallTracker.call(this, card);
      };
    }
    if (n===30019) {
      const nativeSwap=c.SharedResolve;
      c.SharedResolve=function(cards) {
        const previous=activeSwap;
        activeSwap=cards?.length===2 ? {source:this,targets:cards.map(card=>{
          const server=GetServer(card),index=server.ice.indexOf(card);
          return {id:id(card),location:`${server.serverName} · ice ${server.ice.length-index} from outside`};
        })} : null;
        try {return nativeSwap.call(this,cards);} finally {activeSwap=previous;}
      };
    }
    id(c);
    ClearAllCounters(c);
    c.renderer = {
      sprite: { x: 0, y: 0, visible: true },
      destinationPosition: { x: 0, y: 0 },
      FaceUp() {
        this.faceUp = true;
      },
      FaceDown() {
        this.faceUp = false;
      },
      ToggleZoom() {
        this.zoomed = !this.zoomed;
      },
      Destroy: noop,
    };
    if (zone) {
      zone.push(c);
      c.cardLocation = zone;
    }
    return c;
  }
  function boot(options = {}) {
    if (config) throw Error("Create a fresh engine for a new game.");
    config = { side: "runner", seed: "local-table", ...options };
    if (config.rulesVersion !== undefined && !SUPPORTED_RULES.includes(config.rulesVersion))
      throw Error('Unsupported rules version: ' + config.rulesVersion);
    // Six points is an explicit teaching/evaluation variant. Normal local
    // games always use the standard seven-point target.
    globalProperties.agendaPointsToWin = config.control === 'scripted' && config.agendaPointTarget === 6 ? 6 : 7;
    const selectedDecks = NRDecks.resolve(config.deckIds);
    installContext = null;
    Math.seedrandom(String(config.seed));
    Object.assign(corp, {
      identityCard: null,
      creditPool: 5,
      clickTracker: 0,
      scoreArea: [],
      HQ: NewServer("HQ", true),
      RnD: NewServer("R&D", true),
      archives: NewServer("Archives", true),
      remoteServers: [],
      serverIncrementer: 0,
      maxHandSize: 5,
      resolvingCards: [],
      installingCards: [],
      badPublicity: 0,
    });
    Object.assign(runner, {
      identityCard: null,
      creditPool: 5,
      temporaryCredits: 0,
      clickTracker: 0,
      startingMU: 4,
      scoreArea: [],
      grip: [],
      stack: [],
      heap: [],
      rig: { programs: [], hardware: [], resources: [] },
      maxHandSize: 5,
      tags: 0,
      coreDamage: 0,
      resolvingCards: [],
      installingCards: [],
    });
    viewingPlayer = config.side === "corp" ? corp : runner;
    // Explicit evaluation mode drives both players through the same legal
    // decision API. Normal local games retain their existing opponent policy.
    corp.AI = config.control === "scripted" ? null : config.faceoff || viewingPlayer !== corp ? new CorpAI() : null;
    runner.AI = config.control === "scripted" ? null :
      config.faceoff || viewingPlayer !== runner ? new RunnerAI() : null;
    for (const s of ["corp", "runner"]) {
      const p = s === "corp" ? corp : runner,
        deck = config.decks?.[s] || NRDecks.expand(selectedDecks[s]);
      p.identityCard = make(deck.identity);
      p.identityCard.faceUp = true;
      const zone = s === "corp" ? corp.RnD.cards : runner.stack;
      for (const n of deck.cards) make(n, zone);
      if (!(config.control === "scripted" && config.orderedDecks)) Shuffle(zone);
    }
    Log(`Game begins. First to ${AgendaPointsToWin()} agenda points.`);
    IncrementPhase();
    TriggeredResponsePhase(
      runner,
      "responseOnBeforeStartingHand",
      [],
      () => {
        for (let i = 0; i < 5; i++) {
          MoveCardByIndex(
            corp.RnD.cards.length - 1,
            corp.RnD.cards,
            corp.HQ.cards,
          );
          MoveCardByIndex(runner.stack.length - 1, runner.stack, runner.grip);
        }
      },
      "Before Starting Hand",
    );
  }
  function winCheck() {
    if (AgendaPoints(corp) >= AgendaPointsToWin())
      PlayerWin(
        corp,
        "Corp reached " + AgendaPoints(corp) + " agenda points.",
      );
    else if (AgendaPoints(runner) >= AgendaPointsToWin())
      PlayerWin(
        runner,
        "Runner reached " + AgendaPoints(runner) + " agenda points.",
      );
  }
  function enumerate() {
    if (config?.control === "scripted") viewingPlayer = activePlayer;
    if (cached) return cached;
    winCheck();
    if (terminal) return [];
    if (lastTurn !== playerTurn) {
      if (lastTurn) turn++;
      lastTurn = playerTurn;
    }
    // Match upstream EnumeratePhase: some hooks (combined response/action
    // windows) must recalculate their next phase after every resolved choice.
    // Global trigger hooks enforce their own one-time guard. An outer guard
    // leaves a stale discard destination when Luminal grants clicks on score.
    if (currentPhase.PreEnumerate) {
      currentPhase.PreEnumerate.call(currentPhase);
      currentPhase.preEnumerated = true;
    }
    phaseOptions = {};
    validOptions = [];
    for (const cmd of Object.keys(currentPhase.Resolve || {})) {
      if (typeof currentPhase.Resolve[cmd] !== "function") continue;
      const options = currentPhase.Enumerate?.[cmd]
        ? currentPhase.Enumerate[cmd].call(currentPhase)
        : [{}];
      if (options?.length) {
        phaseOptions[cmd] = options;
        for (const o of options) o.command = cmd;
      }
    }
    version++;
    cached = Object.keys(phaseOptions);
    if (!cached.length && !terminal)
      throw Error(
        "No legal choices in " +
          currentPhase.title +
          " (" +
          currentPhase.identifier +
          ")",
      );
    return cached;
  }
  function resolve(cmd, index, selected) {
    executingCommand = cmd;
    validOptions = phaseOptions[cmd];
    const choice = validOptions?.[index];
    if (!choice) throw Error("Invalid choice");
    if (selected) {
      if (!Array.isArray(choice.cards))
        throw Error("This choice does not accept multiple cards");
      const candidates = validOptions.map((o) => o.card).filter(Boolean);
      if (
        new Set(selected).size !== selected.length ||
        selected.some((x) => !candidates.some((c) => id(c) === x))
      )
        throw Error("Invalid selected cards");
      const max = choice.cards.length;
      const optional = validOptions.some((o) => o.button && o.cards);
      if (
        selected.length > max ||
        (!optional && selected.length !== max) ||
        (choice.multiSelectDynamicButtonEnabler &&
          !choice.multiSelectDynamicButtonEnabler(selected.length))
      )
        throw Error("Select the required number of cards");
      choice.cards = Array.from(
        { length: max },
        (_, i) => candidates.find((c) => id(c) === selected[i]) || null,
      );
    } else if (choice.cards?.some((c) => c === null) && !activePlayer.AI)
      throw Error("Select cards first");
    if (currentPhase.chosenString && choice.label)
      Log(choice.label + " " + currentPhase.chosenString);
    cached = null;
    steps++;
    const previousSource = effectSource;
    // A continuation may select a target card (e.g. a card in Archives).
    // Keep the resolving ability's card as its public cause across the callback.
    effectSource = currentPhase.context?.isCard ? currentPhase.context : choice.card || null;
    // Preserve ResolveChoice's receiver: handlers may call siblings via this.n().
    try { currentPhase.Resolve[cmd](choice); }
    finally { effectSource = previousSource; }
    winCheck();
  }
  function forcedPass(commands) {
    if (commands.length !== 1 || phaseOptions[commands[0]].length !== 1) return false;
    const option=phaseOptions[commands[0]][0];
    return !currentPhase.requireHumanInput && !option.card && !option.cards && !option.label && !option.button && ['n','continue'].includes(commands[0]);
  }
  function needsAdvance() {
    const commands=enumerate();
    return !terminal && (!!activePlayer.AI || forcedPass(commands));
  }
  async function advance(limit = 300, observe = null) {
    for (let i = 0; i < limit && !terminal; i++) {
      const commands = enumerate();
      if (terminal) break;
      const ai = activePlayer.AI;
      // Auto-pass only forced non-interactive timing windows. Never hide card/access choices.
      const forced = forcedPass(commands);
      if (!ai && !forced) break;
      const cmd =
        commands.length === 1
          ? commands[0]
          : commands[await ai.CommandChoice(commands)];
      if (!cmd) throw Error("AI returned an invalid command");
      executingCommand = cmd;
      validOptions = phaseOptions[cmd];
      const index = ai ? await ai.SelectChoice(validOptions) : 0;
      if (!Number.isInteger(index) || !validOptions[index])
        throw Error("AI returned an invalid option");
      const before = observe ? snapshot() : null;
      resolve(cmd, index);
      if (observe) observe(before, snapshot());
    }
    if (!terminal) enumerate();
    return snapshot();
  }
  function choose(input) {
    enumerate();
    if (terminal || activePlayer.AI || input.version !== version)
      throw Error("That decision has already passed.");
    if (input.cancel) {
      if (typeof currentPhase.Cancel?.[input.command] !== "function")
        throw Error("Cannot cancel");
      cached = null;
      currentPhase.Cancel[input.command]();
      return;
    }
    resolve(input.command, input.index, input.cards);
  }
  function cardDTO(c, force = false) {
    if (!c) return null;
    const visible = force || PlayerCanLook(viewingPlayer, c);
    const out = {
      id: id(c),
      side: side(c.player),
      hidden: !visible,
      installed: CheckInstalled(c),
      rezzed: !!c.rezzed,
      faceUp: !!IsFaceUp(c),
      advancement: c.advancement || 0,
      hosted: (c.hostedCards || []).map((x) => cardDTO(x)),
    };
    if (visible) {
      Object.assign(out, {
        number: c.setNumber,
        title: c.title,
        type: c.cardType,
        subTypes: c.subTypes || [],
        strength: typeof c.strength === "number" ? Strength(c) : null,
        advancementRequirement: c.cardType === "agenda" ? AdvancementRequirement(c) : null,
        ...(c.player===viewingPlayer && c.setNumber===30027 && CheckInstalled(c) ? {availability:c.usedThisTurn ? 'Used this turn. Available on your next turn.' : !CheckActionClicks(runner,1) ? 'Needs 1 action click in your action phase.' : null} : {}),
        canScore: c.player === corp && CheckInstalled(c) && !!phaseOptions.score?.some(o => o.card === c),
        counters: Object.fromEntries(
          counterList.filter((k) => c[k]).map((k) => [k, c[k]]),
        ),
        subroutines: (c.subroutines || []).map((s, i) => ({
          text: plain(s.text),
          broken: !!s.broken,
          fired: !!firedSubroutines.get(c)?.has(i),
        })),
      });
      if (c.cardType === "ice" && CheckEncounter() && c === GetApproachEncounterIce()) {
        const effects = ChoicesActiveTriggers("modifyStrength")
          .filter(({card}) => card.setNumber === 30008 && card.strengthReduce < 0 && PlayerCanLook(viewingPlayer, card))
          .map(({card}) => ({source: card.title, sourceId: id(card), amount: card.strengthReduce, duration: "this encounter"}));
        if (effects.length) out.strengthEffects = effects;
      }
    }
    return out;
  }
  const labelMap = {
    n: "Continue",
    m: "Take a mulligan",
    gain: "Gain 1 credit",
    draw: "Draw a card",
    install: "Install",
    play: "Play",
    trigger: "Use ability",
    run: "Make a run",
    advance: "Advance",
    score: "Score agenda",
    rez: "Rez",
    trash: "Trash",
    remove: "Remove tag",
    purge: "Purge virus counters",
    jack: "Jack out",
    continue: "Continue",
    discard: "Discard",
    steal: "Steal agenda",
    access: "Access a card",
  };
  function commandLabel(cmd) {
    if (cmd === "trigger" && currentPhase.identifier === "Run Subroutines") return "Fire subroutine";
    if (cmd === "advance" && activePlayer === runner) return "Remove a tag";
    if (cmd === "n") {
      if (["Corp 2.2", "Runner 1.3"].includes(currentPhase.identifier) && /Action Phase/.test(currentPhase.title)) return "End action phase";
      if (currentPhase.identifier.includes("Mulligan")) return "Keep this hand";
      if (currentPhase.identifier === "Run Accessing")
        return "Finish accessing";
      if (currentPhase.title === "Trash Before Install")
        return "Finish install";
      if (currentPhase.identifier === "Run 3.1")
        return "Resolve unbroken subroutines";
      if (currentPhase.identifier === "Run 2.1") return "Continue to encounter";
      if (currentPhase.identifier === "Run 4.3") return "Continue the run";
    }
    return labelMap[cmd] || cmd.charAt(0).toUpperCase() + cmd.slice(1);
  }
  // Describe only costs the current rules window actually charges. Ability text
  // remains authoritative for bespoke effects and additional costs.
  // Printed Gateway costs, including the two dynamic breakers. These are
  // presentation quotes only; upstream Enumerate/Resolve still owns legality/payment.
  function breakerProfile(card) {
    const profiles = {
      30005: ['Code Gate', 1, 2, 3, 1], 30006: ['Barrier', 1, 2, 2, 1],
      30015: ['Sentry', 1, 1, 2, 3],
      30016: ['Barrier', card.madeSuccessfulRunThisTurn ? 1 : 2, 1, 1, 1],
      30025: ['Sentry', 1, 1, 3, 2],
      30026: ['Code Gate', 1, 1, 1, InstalledCards(runner).filter(c => CheckSubType(c, 'Icebreaker')).length],
      30032: ['Any', 1, 1, 1, 1],
    };
    const p = profiles[card.setNumber];
    return p ? {type:p[0], breakCost:p[1], breakCount:p[2], boostCost:p[3], boostAmount:p[4]} : null;
  }
  function abilityCost(card, ability) {
    if (!card || !ability) return null;
    const profile = breakerProfile(card);
    const index = card.abilities?.indexOf(ability);
    if (profile && index >= 0) return {credits:index === 0 ? profile.breakCost : profile.boostCost,
      ...(card.setNumber === 30032 && index === 0 ? {note:'Trash Mayfly when this run ends'} : {})};
    if ([30004,30008].includes(card.setNumber) && index === 0) return {virus:1};
    if ([30014,30018,30024].includes(card.setNumber) && index === 0) return {clicks:1};
    return null;
  }
  function abilityText(card, ability) {
    if (card?.setNumber === 30025) {
      if (ability === card.abilities[0]) return 'Break 1 sentry subroutine.';
      if (ability === card.abilities[1]) return '+2 strength.';
    }
    if (card?.setNumber === 30008 && ability === card.abilities[0]) return '−1 ice strength this encounter.';
    return plain(ability?.text);
  }
  function costDTO(cmd, card = null, option = null) {
    const action = ["Corp 2.2", "Runner 1.3"].includes(currentPhase.identifier);
    const cost = {};
    const selectedAbility = typeof option?.ability === 'number' ? card?.abilities?.[option.ability] : option?.ability;
    const pendingAbility = cmd === 'continue' ? abilityPhases.get(currentPhase) : null;
    Object.assign(cost, abilityCost(card, selectedAbility) || (pendingAbility && abilityCost(pendingAbility.card, pendingAbility.ability)));
    if (cmd === 'continue' && option?.subroutine && !pendingAbility &&
      [30005,30006].includes(currentPhase.context?.setNumber)) {
      cost.credits = 0; cost.note = 'Second break included in the credit already paid';
    }
    if (cmd === "rez" && card?.setNumber === 30053) cost.note = "On rez: draw 2 cards";
    const abilitySource = card || (currentPhase.context?.isCard ? currentPhase.context : null);
    if (abilitySource && activePlayer === runner && CheckSubType(abilitySource, "Bioroid") &&
      ((cmd === "trigger" && currentPhase.identifier === "Run 3.1") || (cmd === "continue" && option?.subroutine))) cost.clicks = 1;
    // Explicit costs from the pinned Gateway economy abilities. Turn-start
    // responses are deliberately excluded; these are action-window abilities.
    if (action && cmd === "trigger" && card && [30007, 30027, 30033, 30071].includes(card.setNumber)) {
      cost.clicks = 1;
      if (card.setNumber === 30007) cost.note = "Trash this program";
    }
    if (!action && cmd === "trigger" && card?.setNumber === 30037 && /Turn Begins/.test(currentPhase.title)) {
      cost.note = "Take 3 hosted credits · no click cost";
    }
    if (cmd === "n" && currentPhase.title === "Trash Before Install" && installContext &&
      installContext.card.cardLocation === installContext.card.player.installingCards) {
      cost.credits = InstallCost(installContext.card, installContext.destination, installContext.ignoreAllCosts, installContext.position);
      if (installContext.actionClick) cost.clicks = 1;
    }
    if (action && ["gain", "draw", "install", "play", "run", "advance", "remove", "trash", "purge"].includes(cmd)) {
      cost.clicks = cmd === "purge" ? 3 : cmd === "play" && card && CheckSubType(card, "Double") ? 2 : 1;
      if (cmd === "advance") cost.credits = activePlayer === runner ? 2 : 1;
      if (["remove", "trash"].includes(cmd)) cost.credits = 2;
      if (cmd === "play" && card) cost.credits = PlayCost(card);
      if (cmd === "install" && card) {
        cost.credits = card.player === runner ? InstallCost(card, option?.host) :
          card.cardType === 'ice' ? (option?.server?.ice.length || 0) : InstallCost(card);
        if (card.player === corp) cost.note = ['asset','upgrade'].includes(card.cardType) ? 'Rez cost paid later' : card.cardType === 'agenda' ? 'Install facedown' : 'Keep existing ice';
      }
    }
    if (cmd === "rez" && card && PlayerCanLook(viewingPlayer, card)) cost.credits = RezCost(card);
    if (cmd === "trash" && currentPhase.identifier === "Run Accessing" && accessingCard && PlayerCanLook(viewingPlayer, accessingCard)) {
      cost.credits = TrashCost(accessingCard);
      const pool = runner.creditPool;
      const available = AvailableCredits(runner, "paying trash costs", accessingCard);
      cost.note = available > pool ? `${pool} pool + ${available - pool} eligible run/card credits` : `${pool} credits available`;
    }
    const notes=[];
    const guide=guidedPhases.get(currentPhase);
    if (cmd==='install' && guide?.kind==='pantograph-install') {
      if (card) cost.credits=InstallCost(card,option?.host);
      notes.push(card ? 'Pantograph: no click cost; pay the quoted install credits' : 'Keep the gained credit and skip the optional install');
    }
    if (guide?.kind==='anoetic-choice' && option?.id===0) {cost.credits=2;notes.push('Trash 2 HQ cards, then end the run');}
    if (guide?.kind==='anoetic-trash') notes.push(`2 credits already paid · trash ${guide.remaining===2?'first':'second'} HQ card to end the run`);
    if (cmd==='trigger' && card?.setNumber===30043) notes.push('Gain 1 credit because Archives contains a facedown card · no click cost');
    if (cmd==='trigger' && card?.setNumber===30051) notes.push('First tag this turn: choose gain 2 credits or draw 2 cards · no click cost');
    if (cmd==='trigger' && card?.setNumber===30018) notes.push(action ? 'If this run succeeds, take 3 credits from Red Team' : 'Successful Red Team run: take 3 hosted credits · no click cost');
    if (cmd==='trigger' && card?.setNumber===30024) notes.push(action ? `If successful, access ${card.virus || 0} additional R&D cards` : 'Optional: add 1 virus counter after the successful R&D run');
    if (cmd==='trigger' && card?.setNumber===30014 && action) notes.push(`Add 1 hosted credit, then take all ${(card.credits || 0)+1} credits`);
    if (cmd==='trigger' && card?.setNumber===30010 && card.cardsAccessedThisRun>0)
      notes.push(`Optional: gain ${card.cardsAccessedThisRun} credits for this run’s accesses · once per turn`);
    if (cmd==='trigger' && card?.setNumber===30045)
      notes.push(`Deal ${2+(card.advancement || 0)} net damage: 2 base + ${card.advancement || 0} advancement · no rez required`);
    if (cmd==='trigger' && card?.setNumber===30061)
      notes.push(`Optional: trash Clearinghouse to deal ${card.advancement || 0} meat damage`);
    if (cmd==='trigger' && card?.setNumber===30050)
      notes.push('Optional: pay 2 credits and trash 2 HQ cards to end the run');
    if (cmd==='continue' && currentPhase.context?.setNumber===30061 && option?.id===0)
      notes.push(`Trash Clearinghouse to deal ${currentPhase.context.advancement || 0} meat damage · no click cost`);
    if (cmd==='install' && card?.player===runner && card.cardType==='program' &&
      InstalledCards(runner).some(c=>c.setNumber===30022 && !c.installedProgramThisTurn && CheckHasAbilities(c)))
      notes.push('DZMZ Optimizer: first-program install discount applied');
    if (action && cmd==='play' && card?.setNumber===30057)
      notes.push('Give the Runner 1 tag unless they pay 8 credits · Reality Plus may trigger on the first tag');
    if (action && cmd === 'play' && [30020,30021].includes(card?.setNumber)) {
      cost.clicks=runner.clickTracker > 1 ? 2 : 1;
      notes.push((card.setNumber===30020 ? 'Gain 5 credits' : 'Draw 4 cards') +
        (runner.clickTracker > 1 ? ' · 1 action click + lose 1 remaining click' : ' · last click: no extra click lost'));
    }
    if (cmd === 'advance' && card?.setNumber === 30045)
      notes.push(`After advancing: ${3+(card.advancement || 0)} net damage on access · works unrezzed`);
    if (cmd === 'rez' && card?.setNumber === 30045)
      notes.push('This ambush already works unrezzed; rezzing reveals it to the Runner');
    if (cmd === 'advance' && card?.setNumber === 30061)
      notes.push(`After advancing: ${1+(card.advancement || 0)} meat damage if trashed for its turn-start ability · must be rezzed`);
    if (cmd === 'advance' && card?.setNumber === 30063)
      notes.push((card.advancement || 0) === 2 ? 'Third counter: +5 strength while rezzed' : 'At 3 advancement counters: +5 strength while rezzed');
    if (action && cmd === 'advance' && card?.player===corp && corp.identityCard.setNumber===30059 && !card.advancement)
      notes.push('Built to Last: pay 1 credit, then gain 2 credits for the first counter');
    if (notes.length) cost.note=[cost.note,...notes].filter(Boolean).join(' · ');
    return Object.keys(cost).length ? cost : null;
  }
  function optionDTO(o, index, cmd) {
    const context=phaseSourceCard();
    const searchChoice=o.card && viewingPlayer===activePlayer && o.card.player===viewingPlayer &&
      ((context?.setNumber===30066 && viewingPlayer===corp && o.card.cardLocation===corp.RnD.cards && o.card.cardType!=='agenda') ||
       (context?.setNumber===30011 && viewingPlayer===runner && o.card.cardLocation===runner.stack && CheckSubType(o.card,'Icebreaker')));
    const visible=!!o.card && (searchChoice || PlayerCanLook(viewingPlayer,o.card));
    let text = plain(o.button || o.label || "");
    if(searchChoice)text=o.card.title;
    if (o.card && !visible)
      text =
        "Facedown card" +
        (GetServer(o.card) ? " · " + GetServer(o.card).serverName : "");
    if (!text && o.card)
      text = visible
        ? o.card.title
        : "Facedown card";
    if (!text && "server" in o)
      text = o.server?.serverName || "New remote server";
    if (!text && typeof o.subroutine === "number")
      text = "Subroutine " + (o.subroutine + 1);
    if (!text) text = labelMap[cmd] || cmd;
    const out = {
      index,
      cost: costDTO(cmd, o.card, o),
      label: text,
      card: o.card ? cardDTO(o.card,searchChoice) : null,
      server: "server" in o ? o.server?.serverName || "New remote" : null,
    };
    if(cmd==='pay' && Number.isFinite(o.amount))out.payment={amount:o.amount,source:o.sourceLabel,available:o.available};
    if(searchChoice)out.searchChoice=true;
    const source = phaseSourceCard() || o.card;
    if (source?.isCard && PlayerCanLook(viewingPlayer, source)) out.sourceId = id(source);
    if (o.card) {
      const server=GetServer(o.card),position=server?.ice.indexOf(o.card);
      if (position>=0) {
        out.location=`${server.serverName} · ice ${server.ice.length-position} from outside`;
        if (!o.ability) out.label=`${PlayerCanLook(viewingPlayer,o.card) ? o.card.title : 'Facedown ice'} · ${out.location}`;
      }
    }
    if (guidedPhases.get(currentPhase)?.kind==='anoetic-choice' && o.id===0) out.label+=' → end the run';
    if (o.host) {
      const hostServer = GetServer(o.host);
      const position = hostServer?.ice.indexOf(o.host);
      out.hostId = id(o.host);
      out.hostLabel = (PlayerCanLook(viewingPlayer, o.host) ? o.host.title : "Facedown ice") +
        (hostServer ? ` · ${hostServer.serverName}` : "") +
        (position >= 0 ? ` · ice ${hostServer.ice.length - position} from outside` : "");
      if (cmd === 'install' && o.card && visible)
        out.label = `Host ${o.card.title} on ${PlayerCanLook(viewingPlayer,o.host) ? o.host.title : 'Facedown ice'}`;
    }
    if (o.ability && typeof o.ability === "object")
      out.detail = abilityText(o.card, o.ability);
    else if (typeof o.ability === "number" && o.card)
      out.detail = abilityText(o.card, o.card.abilities?.[o.ability]);
    const profile=visible && breakerProfile(o.card);
    const selectedAbility=typeof o.ability==='number'?o.card?.abilities?.[o.ability]:o.ability;
    if(profile && selectedAbility)out.abilityKind=o.card.abilities.indexOf(selectedAbility)===1?'boost':'break';
    if (cmd==='install' && ['Corp 2.2','Runner 1.3'].includes(currentPhase.identifier)) out.installQuote=true;
    if (fullPaidChoices() && o.card && isPriorityWindow()) {
      if (cmd==='rez') out.secondary = !(attackedServer &&
        (currentPhase.identifier==='Run 2.1' && o.card===attackedServer.ice[approachIce] ||
         currentPhase.identifier==='Run 4.5' && approachIce===0 && GetServer(o.card)===attackedServer && o.card.cardType==='upgrade'));
      if (cmd==='trigger' && o.card.setNumber===30053 && o.card.abilities?.includes(selectedAbility))
        out.secondary = !(attackedServer && currentPhase.identifier==='Run 4.5' && approachIce===0 &&
          (GetServer(o.card)===attackedServer || attackedServer===corp.archives));
    }
    if (o.card && out.detail && PlayerCanLook(viewingPlayer, o.card)) {
      out.label = `${o.card.title} · ${out.detail}`;
      out.source = o.card.title;
    }
    if (cmd === "trigger" && o.card && !out.detail && PlayerCanLook(viewingPlayer, o.card)) {
      out.source = o.card.title;
      if (out.label !== o.card.title) out.label = `${o.card.title} · ${out.label}`;
      if (currentPhase.identifier === "Rez" && o.card.setNumber === 30053)
        out.label = "Spin Doctor · Draw 2 cards on rez";
    }
    if (o.subroutine && attackedServer && approachIce >= 0) {
      const ice = attackedServer.ice[approachIce];
      const subIndex = typeof o.subroutine === "number" ? o.subroutine : ice?.subroutines?.indexOf(o.subroutine);
      if (subIndex >= 0 && ice && PlayerCanLook(viewingPlayer, ice)) {
        out.subroutine = subIndex + 1;
        out.targetId = id(ice);
        out.label = `${/Break another/i.test(text) ? 'Break another subroutine' : 'Break subroutine'} ${subIndex + 1}: ${plain(ice.subroutines[subIndex].text)}`;
      }
    }
    if (o.cards?.some((c) => c === null))
      out.multi = {
        max: o.cards.length,
        optional: phaseOptions[cmd].some((x) => x.button && x.cards),
        button: !!o.button,
      };
    return out;
  }
  function encounterTools() {
    const ice = CheckEncounter() && GetApproachEncounterIce();
    if (!ice || viewingPlayer !== runner || !PlayerCanLook(viewingPlayer, ice)) return [];
    const unbroken = ice.subroutines.filter(s => !s.broken).length;
    return InstalledCards(runner).filter(c => PlayerCanLook(viewingPlayer,c)).flatMap(card => {
      const profile = breakerProfile(card);
      if (!profile && ![30004,30008].includes(card.setNumber)) return [];
      const tool = {card:cardDTO(card),enabled:CheckHasAbilities(card)};
      if (profile) {
        const matches = profile.type === 'Any' ? !ice.cannotBreakUsingAIPrograms : CheckSubType(ice,profile.type);
        const gap = Math.max(0,Strength(ice)-Strength(card));
        const boostTotal = Math.ceil(gap / Math.max(1,profile.boostAmount)) * profile.boostCost;
        const breakTotal = Math.ceil(unbroken / profile.breakCount) * profile.breakCost;
        Object.assign(tool,{kind:'breaker',...profile,matches,gap,boostTotal,breakTotal,
          availableCredits:AvailableCredits(runner,'using',card),unbroken});
      } else Object.assign(tool,{kind:card.setNumber === 30004 ? 'hosted-virus' : 'strength-virus',
        counters:Counters(card,'virus'),matches:card.setNumber !== 30004 || card.host === ice,
        canLower:!ice.strengthCannotBeLowered});
      return [tool];
    });
  }
  function isPriorityWindow() {
    return ['Corp 1.1','Corp 2.1','Corp 2.2','Corp 2.2*','Corp 3.2',
      'Runner 1.1','Runner 1.3','Runner 1.3*','Runner 2.2','Run 1.5','Run 2.1','Run 3.1','Run 4.5'].includes(currentPhase.identifier) && !abilityPhases.has(currentPhase);
  }
  function quietWindowEligible(commands) {
    // Skip only known Gateway boosts that expire outside an encounter.
    // Send the ordinary pass: the opponent still receives native priority.
    // Never skip targets, funding, mandatory effects, jack-out or other abilities.
    if (!fullPaidChoices() || viewingPlayer!==runner || activePlayer!==runner ||
      !isPriorityWindow() || CheckEncounter() || currentPhase.requireHumanInput ||
      commands.some(c=>!['n','trigger'].includes(c)) || !phaseOptions.trigger?.length ||
      phaseOptions.n?.length!==1 || Object.keys(phaseOptions.n[0]).some(k=>k!=='command')) return false;
    return phaseOptions.trigger.every(o=>{
      const profile=breakerProfile(o.card),ability=typeof o.ability==='number'?o.card?.abilities[o.ability]:o.ability;
      return profile && o.card.abilities.indexOf(ability)===1;
    });
  }
  // Assistance describes a currently legal native choice. The UI records every
  // accepted choice, so restoration and full-control replays keep native timing.
  function assistanceDTO(commands) {
    if (!fullPaidChoices() || activePlayer.AI || terminal) return null;
    if (commands.length===1 && commands[0]==='access' && phaseOptions.access.length===1 && currentPhase.identifier==='Run 5.2')
      return {kind:'single-access',command:'access',index:0};
    if (commands.length===1 && commands[0]==='trigger' && phaseOptions.trigger.length===1) {
      const o=phaseOptions.trigger[0], callback=o.callbackName || currentPhase.triggerCallbackName;
      const known={30037:'responseOnCorpTurnBegins',30053:'responseOnRez',30055:'responseOnRez',30042:'responseOnApproachServer',30036:'responseOnScored'};
      const forcedEffect=o.card && known[o.card.setNumber] && known[o.card.setNumber]===callback;
      const forcedSub=currentPhase.identifier==='Run Subroutines' && (!o.choice || !Object.keys(o.choice).length);
      if (forcedEffect || forcedSub) return {kind:'forced-effect',command:'trigger',index:0};
      if (o.card?.setNumber===30035 && callback==='responseOnScored' ||
        o.card?.setNumber===30069 && ['responseOnScored','responseOnStolen'].includes(callback))
        return {kind:'effect-targets',command:'trigger',index:0};
    }
    const plainPass=phaseOptions.n?.length===1 && Object.keys(phaseOptions.n[0]).every(k=>k==='command');
    if (!plainPass || currentPhase.requireHumanInput || !isPriorityWindow()) return null;
    if (viewingPlayer===runner && CheckEncounter() && attackedServer.ice[approachIce]?.subroutines.every(s=>s.broken) &&
      commands.every(c=>c==='n'||c==='trigger'&&phaseOptions[c].every(o=>breakerProfile(o.card))))
      return {kind:'cleared-encounter',command:'n',index:0};
    // End turn remains explicit, and a useful rez/paid response always stops.
    if (!['Corp 2.2','Runner 1.3'].includes(currentPhase.identifier) && commands.every(c=>c==='n'||
      ['rez','trigger'].includes(c)&&phaseOptions[c].every((o,i)=>optionDTO(o,i,c).secondary)))
      return {kind:'optional-window',command:'n',index:0};
    return null;
  }
  function snapshot() {
    const commands = terminal ? [] : enumerate();
    const approachedIce=attackedServer?.ice[approachIce];
    const rezStatus=fullPaidChoices() && viewingPlayer===corp && currentPhase.identifier==='Run 2.1' && approachedIce && !approachedIce.rezzed
      ? {cardId:id(approachedIce),cost:RezCost(approachedIce),available:AvailableCredits(corp,'rezzing',approachedIce),
        offered:activePlayer===corp && !!phaseOptions.rez?.some(o=>o.card===approachedIce)} : null;
    const pDTO = (p) => ({
      side: side(p),
      identity: cardDTO(p.identityCard),
      credits: p.creditPool,
      clicks: p.clickTracker,
      points: AgendaPoints(p),
      maxHand: MaxHandSize(p),
      score: p.scoreArea.map((c) => cardDTO(c)),
      hand: (p === corp ? p.HQ.cards : p.grip).map((c) => cardDTO(c)),
      deck: (p === corp ? p.RnD.cards : p.stack).length,
      discard: (p === corp ? p.archives.cards : p.heap).map((c) => cardDTO(c)),
      resolving: p.resolvingCards.map((c) => cardDTO(c)),
    });
    return {
      version,
      steps,
      turn,
      side: config.control === "scripted" ? side(viewingPlayer) : config.side,
      seed: config.seed,
      ...(currentRules() ? {rulesVersion: config.rulesVersion, agendaPointTarget: AgendaPointsToWin()} : {}),
      active: side(activePlayer),
      playerTurn: side(playerTurn),
      phase: {
        title: abilityPhases.has(currentPhase) ? abilityText(abilityPhases.get(currentPhase).card,abilityPhases.get(currentPhase).ability) : plain(currentPhase.title),
        identifier: currentPhase.identifier,
        source: phaseSourceCard() && PlayerCanLook(viewingPlayer,phaseSourceCard()) ? phaseSourceCard().title : null,
        ...(guidedPhases.has(currentPhase) ? {guide:guidedPhases.get(currentPhase)} : {}),
      },
      terminal,
      corp: {
        ...pDTO(corp),
        badPublicity: corp.badPublicity,
        servers: [corp.HQ, corp.RnD, corp.archives, ...corp.remoteServers].map(
          (s) => ({
            name: s.serverName,
            central: !!s.cards,
            ice: s.ice.map((c) => cardDTO(c)),
            root: s.root.map((c) => cardDTO(c)),
          }),
        ),
      },
      runner: {
        ...pDTO(runner),
        tags: runner.tags,
        coreDamage: runner.coreDamage,
        temporaryCredits: runner.temporaryCredits,
        memory: MemoryUnits(),
        memoryUsed: InstalledMemoryCost(),
        rig: Object.fromEntries(
          Object.entries(runner.rig).map(([k, v]) => [
            k,
            v.map((c) => cardDTO(c)),
          ]),
        ),
      },
      run: attackedServer
        ? {
            server: attackedServer.serverName,
            ice: approachIce,
            encountering,
            movement,
            tools: encounterTools(),
            ...(rezStatus ? {rezStatus} : {}),
            restrictions: ChoicesActiveTriggers("modifyCannot").flatMap(({card}) => {
              const target = accessingCard || corp.identityCard;
              const steal = !!card.modifyCannot.Resolve.call(card, "steal", target);
              const trash = !!card.modifyCannot.Resolve.call(card, "trash", target);
              if (!steal && !trash) return [];
              return [{source: card.isCard && PlayerCanLook(viewingPlayer, card) ? card.title : "Card effect", steal, trash}];
            }),
            card:
              approachIce >= 0
                ? cardDTO(attackedServer.ice[approachIce])
                : null,
          }
        : null,
      access: accessingCard ? cardDTO(accessingCard) : null,
      ...(viewedPhases.has(currentPhase) && PlayerCanLook(viewingPlayer,viewedPhases.get(currentPhase).card)
        ? {viewed:{kind:viewedPhases.get(currentPhase).kind,card:cardDTO(viewedPhases.get(currentPhase).card)}} : {}),
      decision:
        terminal || activePlayer.AI
          ? null
          : {
              version,
              commands: commands.map((cmd) => ({
                command: cmd,
                label: commandLabel(cmd),
                cost: costDTO(cmd, phaseOptions[cmd].length === 1 ? phaseOptions[cmd][0].card : null, phaseOptions[cmd].length === 1 ? phaseOptions[cmd][0] : null),
                instruction: abilityPhases.has(currentPhase) ? abilityText(abilityPhases.get(currentPhase).card,abilityPhases.get(currentPhase).ability) : plain(currentPhase.text?.[cmd]),
                cancel: !!currentPhase.Cancel?.[cmd],
                options: phaseOptions[cmd].map((o, i) => optionDTO(o, i, cmd)),
              })),
            },
      quietWindow: !terminal && !activePlayer.AI && quietWindowEligible(commands),
      assistance: assistanceDTO(commands),
      installation: currentPhase.title==='Trash Before Install' && installContext ? {
        card:cardDTO(installContext.card),destination:installContext.destination?.serverName || (installContext.card.player===runner?'Runner rig':'New remote'),
      } : null,
      historyCount: history.length,
      // Keep the complete previous turns even when a busy run generates more
      // than 150 messages (for example, accessing a large Archives).
      history: history.slice(Math.min(Math.max(0, history.length - 150),
        Math.max(0, history.findIndex(entry => entry.turn >= turn - 3)))),
      diagnostics: diagnostics.slice(-5),
    };
  }
  globalThis.NR = {
    boot,
    advance,
    needsAdvance,
    choose,
    snapshot,
    presets,
    metrics: () => ({ steps, version, diagnostics }),
  };
})();
