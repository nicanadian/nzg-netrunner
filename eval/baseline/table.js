const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const DATA = await fetch("/assets/card-data.json").then((r) => r.json());
const SAVE = "netrunner-local-table-v1",
  ENGINE = "chiriboga-77c80b1-local-1";
let worker,
  state,
  busy = false,
  selectedCommand = null,
  multiSelected = [],
  role = "runner",
  session,
  pending = false,
  hoverTimer,
  watchdog,
  toastTimer,
  focusIntent = null,
  previousState = null;
let cardsById = new Map(),
  previousCards = new Map();
const presets = {
  runner: {
    identity: 30001,
    cards: [
      [30002, 3],
      [30003, 2],
      [30004, 3],
      [30005, 3],
      [30006, 3],
      [30007, 3],
      [30008, 3],
      [30015, 3],
      [30028, 3],
      [30029, 3],
      [30030, 3],
      [30031, 2],
      [30033, 3],
      [30034, 3],
    ],
  },
  corp: {
    identity: 30035,
    cards: [
      [30036, 1],
      [30067, 3],
      [30068, 2],
      [30069, 1],
      [30070, 3],
      [30037, 3],
      [30038, 3],
      [30039, 3],
      [30040, 3],
      [30042, 2],
      [30071, 3],
      [30072, 3],
      [30073, 3],
      [30075, 3],
      [30053, 2],
      [30048, 2],
    ],
  },
};
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 5000);
}
function readSave() {
  try {
    return JSON.parse(localStorage.getItem(SAVE));
  } catch {
    return null;
  }
}
function save() {
  try {
    localStorage.setItem(SAVE, JSON.stringify(session));
  } catch {
    toast(
      "Browser storage is full. Export your replay from Menu to keep this game.",
    );
  }
}
function validateReplay(data) {
  if (
    data?.engine !== ENGINE ||
    !["runner", "corp"].includes(data.config?.side) ||
    typeof data.config.seed !== "string" ||
    data.config.seed.length > 200 ||
    !Array.isArray(data.choices) ||
    data.choices.length > 10000
  )
    throw Error(
      "This replay is not compatible with this version of Local Table.",
    );
  for (const c of data.choices)
    if (
      !c ||
      typeof c.command !== "string" ||
      !Number.isInteger(c.version) ||
      (!c.cancel && !Number.isInteger(c.index)) ||
      (c.cards &&
        (!Array.isArray(c.cards) || c.cards.some((x) => typeof x !== "string")))
    )
      throw Error("Invalid replay decision.");
  return {
    engine: ENGINE,
    config: { side: data.config.side, seed: data.config.seed },
    choices: data.choices,
    conceded: !!data.conceded,
  };
}
function rememberActionFocus() {
  const el = document.activeElement;
  if (!el?.matches(":focus-visible") || !el.closest("#decisions, #inspect-dialog, #hand, #table")) return;
  focusIntent = { command: el.dataset.command || el.dataset.inspectCommand, option: el.dataset.option, card: el.dataset.card };
}
function restoreActionFocus() {
  if (!focusIntent || busy) return;
  const intent = focusIntent;
  focusIntent = null;
  if (document.activeElement !== document.body && document.activeElement?.isConnected && document.activeElement.getClientRects().length) return;
  const buttons = [...document.querySelectorAll("#decisions button:not(:disabled)")];
  const same = buttons.find(el => el.dataset.command === intent.command && el.dataset.option === intent.option);
  (same || buttons.find(el => !el.hasAttribute("data-back")) || $("#phase-title")).focus({ preventScroll: true });
}
function costHTML(cost) {
  if (!cost) return "";
  const parts = [];
  if (cost.clicks) parts.push(cost.clicks + (cost.clicks === 1 ? " click" : " clicks"));
  if (Number.isFinite(cost.credits)) parts.push(cost.credits + (cost.credits === 1 ? " credit" : " credits"));
  return `<span class="action-cost">${esc(parts.join(" · "))}${cost.note ? `<span class="cost-note">${esc(cost.note)}</span>` : ""}</span>`;
}
function deltaHTML(p, key) {
  const before = previousState?.[p.side]?.[key];
  const diff = typeof before === "number" ? p[key] - before : 0;
  return diff ? `<span class="resource-delta ${diff > 0 ? "gain" : "spent"}" aria-label="${key} changed by ${diff}">${diff > 0 ? "+" : ""}${diff}</span>` : "";
}
function start(config, replay = [], conceded = false) {
  worker?.terminate();
  clearTimeout(watchdog);
  hideHover();
  session = {
    engine: ENGINE,
    config,
    choices: structuredClone(replay),
    conceded,
  };
  pending = false;
  focusIntent = document.activeElement?.matches(":focus-visible") ? {} : null;
  previousState = null;
  state = null;
  busy = true;
  selectedCommand = null;
  $("#lobby").hidden = true;
  $("#game").hidden = false;
  $("#loading").hidden = false;
  $("#loading").textContent = replay.length
    ? "Restoring your game…"
    : "Shuffling the decks…";
  worker = new Worker("/engine/worker.js");
  worker.onmessage = ({ data }) => {
    clearTimeout(watchdog);
    $("#loading").hidden = true;
    if (data.type === "error") {
      busy = false;
      if (pending) {
        session.choices.pop();
        pending = false;
      }
      toast("The game stopped: " + data.message);
      $("#decisions").innerHTML =
        '<p class="phase-hint">This position could not be resolved. Undo the last decision from Menu to recover.</p>';
      console.error(data.stack);
      return;
    }
    if (data.type === "state") {
      previousState = state;
      state = data.state;
      busy = !state.decision && !state.terminal;
      pending = false;
      selectedCommand = null;
      multiSelected = [];
      render();
      save();
    }
  };
  worker.onerror = (e) => {
    clearTimeout(watchdog);
    $("#loading").hidden = true;
    busy = false;
    toast("The game could not start. " + e.message);
  };
  worker.postMessage({ type: "start", config, replay, conceded });
  watch();
}
function watch() {
  watchdog = setTimeout(() => {
    toast(
      "The AI is still calculating. You can undo from Menu if it gets stuck.",
    );
    $("#loading").hidden = true;
  }, 60000);
}
function choose(command, index, cards, cancel = false) {
  if (new URLSearchParams(location.search).get("reference") === "example") { toast("Recorded position. Use the example controls, or Play live to start a game."); return; }
  if (busy || !state?.decision) return;
  const choice = {
    version: state.version,
    command,
    index,
    ...(cards ? { cards } : {}),
    ...(cancel ? { cancel: true } : {}),
  };
  rememberActionFocus();
  session.choices.push(choice);
  pending = true;
  busy = true;
  hideHover();
  closeDialogs();
  renderDecisions();
  worker.postMessage({ type: "choose", choice });
  watch();
}
function actionRefs(id) {
  if (busy) return [];
  return (
    state?.decision?.commands.flatMap((c) =>
      c.options
        .filter((o) => o.card?.id === id)
        .map((o) => ({
          command: c.command,
          group: c,
          index: o.index,
          option: o,
        })),
    ) || []
  );
}
function cardHTML(card, extra = "") {
  if (!card) return "";
  cardsById.set(card.id, card);
  const legal = actionRefs(card.id).length > 0;
  const counters = Object.entries(card.counters || {}).filter(
    ([k, v]) => v > 0,
  );
  if (card.advancement && !counters.some(([k]) => k === "advancement"))
    counters.push(["advancement", card.advancement]);
  const title = card.hidden ? "Facedown " + card.side + " card" : card.title;
  return `<button class="card ${card.hidden ? "hidden-card" : ""} ${card.side} ${legal ? "legal" : ""} ${multiSelected.includes(card.id) ? "selected" : ""} ${extra} ${previousCards.size && (!previousCards.has(card.id) || previousCards.get(card.id).installed !== card.installed) ? "card-arrived" : ""} ${state?.run?.card?.id === card.id ? "encounter-target" : ""}" data-card="${esc(card.id)}" aria-label="${esc(title)}${legal ? " — action available" : ""}${counters.map(([k,v]) => `, ${v} ${k}`).join("")}"${state?.decision?.commands.some(g => g.options.some(o => o.multi && o.card?.id === card.id)) ? ` aria-pressed="${multiSelected.includes(card.id)}"` : ""}${card.hidden ? "" : ` data-number="${card.number}"`}>${card.hidden ? "" : `<img src="/assets/cards/${card.number}.jpg" alt="" draggable="false">`}${counters.map(([k, v], i) => `<span class="card-counter ${k}" style="right:${-5 + i * 22}px" title="${v} ${k}">${v}</span>`).join("")}${card.installed && ["ice", "asset", "upgrade"].includes(card.type) && card.side === "corp" && !card.hidden && !card.faceUp ? '<span class="unrezzed-badge">UNREZZED</span>' : ""}${card.installed && card.strength !== null && card.strength !== undefined && !card.hidden ? `<span class="strength-token" title="Current strength">${card.strength}</span>` : ""}${card.hosted?.length ? `<span class="card-hosted">+${card.hosted.length} hosted</span>` : ""}</button>`;
}
const deckBack = (side, count) =>
  `<div class="deck-back ${side}" aria-label="${count} cards in deck"><span><b>N</b></span></div><div class="pile-count">${count} cards</div>`;
function statusHTML(p) {
  const mine = state.side === p.side;
  return `<div class="player-name">${p.side === "corp" ? "CORPORATION" : "RUNNER"}<small>${mine ? "YOU" : "CHIRIBOGA AI"}</small></div><div class="stats"><div class="stat" title="Credits"><span class="credit-token">${p.credits}</span>${deltaHTML(p, "credits")}<small>credits</small></div><div class="stat" title="${p.clicks} clicks remaining"><div class="clicks">${Array.from({ length: Math.max(p.side === "corp" ? 3 : 4, p.clicks) }, (_, i) => `<i class="click-pip ${i < p.clicks ? "filled" : ""}"></i>`).join("")}</div><small>${p.clicks} clicks</small></div>${p.side === "runner" ? `<div class="stat" title="Available memory"><strong>${p.memory - p.memoryUsed}</strong><small>free MU</small></div>${p.tags ? `<div class="stat"><strong>${p.tags}</strong><small>tags</small></div>` : ""}` : p.badPublicity ? `<div class="stat"><strong>${p.badPublicity}</strong><small>bad pub</small></div>` : ""}</div><button class="scroll-cue" data-scroll-mat="${p.side}" aria-label="Scroll ${p.side} play area" title="Scroll to see more cards" hidden>↕ Board</button><button class="points" data-zone="${p.side}-score" aria-label="Inspect ${p.points} scored agenda points"><strong>${p.points}</strong>${deltaHTML(p, "points")}<span>/ 7 <small>AGENDA</small></span></button>`;
}
function hostedRecords(side) {
  const groups = [];
  const visit = (host, location) => {
    const own = (host.hosted || []).filter(card => card.side === side && !card.hidden);
    for (const card of own) groups.push({ card, location });
    for (const child of host.hosted || []) visit(child, child.hidden ? location : child.title);
  };
  for (const server of state.corp.servers) {
    server.ice.forEach((card, i) => visit(card, `${server.name} · ice ${server.ice.length - i} from outside`));
    server.root.forEach(card => visit(card, `${server.name} root`));
  }
  for (const cards of Object.values(state.runner.rig)) for (const card of cards) visit(card, card.title || "Runner rig");
  return groups;
}
function hostedHTML(side) {
  return hostedRecords(side).map(({card,location}) => `<div class="hosted-group"><span class="zone-title">HOSTED · ${esc(location)}</span>${cardHTML(card)}</div>`).join("");
}
function singleActionLabel(command) {
  const option = command.options.length === 1 ? command.options[0] : null;
  return command.label === "Continue" && option?.label &&
    !["Continue", command.command].includes(option.label)
    ? option.label : command.label;
}
function render() {
  rememberActionFocus();
  previousCards = cardsById;
  cardsById = new Map();
  hideHover();
  $("#session-label").textContent =
    "SYSTEM GATEWAY · " + (state.side === "runner" ? "RUNNER" : "CORPORATION");
  for (const side of ["corp", "runner"]) {
    const p = state[side];
    $("#" + side + "-status").innerHTML = statusHTML(p);
    $("#" + side + "-identity").innerHTML =
      cardHTML(p.identity) + '<span class="identity-label">IDENTITY</span>';
    $("#" + side + "-other").innerHTML =
      (p.resolving.length ? '<div class="resolving-group"><span class="zone-title">RESOLVING</span>' + p.resolving.map(c => cardHTML(c)).join("") + '</div>' : "") + (side === "corp" ? hostedHTML(side) : "");
  }
  $("#servers").innerHTML = state.corp.servers
    .map((s) => {
      const targets =
        state.decision?.commands.flatMap((c) =>
          c.options
            .filter((o) => o.server === s.name)
            .map((o) => ({ command: c.command, index: o.index })),
        ) || [];
      let center = s.root.map((c) => cardHTML(c)).join("");
      if (s.central) {
        if (s.name === "R&D")
          center += "<div>" + deckBack("corp", state.corp.deck) + "</div>";
        else if (s.name === "HQ")
          center += `<button class="pile-button" data-zone="corp-hand" aria-label="Inspect HQ">${deckBack("corp", state.corp.hand.length)}</button>`;
        else
          center += state.corp.discard.length
            ? `<button class="pile-button" data-zone="corp-discard">${state.corp.discard.length} cards<br><small>View Archives</small></button>`
            : '<span class="server-empty">EMPTY</span>';
      }
      return `<div class="server ${state.run?.server === s.name ? "target" : ""}" data-server="${esc(s.name)}"><button class="server-title" ${targets.length ? 'data-server-action="' + esc(s.name) + '"' : ""}>${esc(s.name)}${targets.length ? " ↗" : ""}</button><div class="server-ice">${[
        ...s.ice,
      ]
        .reverse()
        .map((c) => cardHTML(c, "ice"))
        .join(
          "",
        )}</div><div class="server-root">${center || '<span class="server-empty">EMPTY</span>'}</div></div>`;
    })
    .join("");
  $("#rig").innerHTML = Object.entries(state.runner.rig)
    .map(
      ([type, cards]) =>
        `<div class="rig-zone" style="--slots:${Math.max(1, cards.length)}"><div class="zone-title">${type.toUpperCase()}</div><div class="rig-cards">${cards.map((c) => cardHTML(c)).join("")}</div></div>`,
    )
    .join("") + (hostedRecords("runner").length ? `<div class="rig-zone hosted-zone" style="--slots:${hostedRecords("runner").length}"><div class="zone-title">HOSTED PROGRAMS</div><div class="rig-cards">${hostedRecords("runner").map(({card,location}) => `<div class="hosted-program">${cardHTML(card)}<span class="host-location">${esc(location)}</span></div>`).join("")}</div></div>` : "");
  $("#runner-piles").innerHTML =
    `<div>${deckBack("runner", state.runner.deck)}</div><button class="pile-button" data-zone="runner-discard"><span class="zone-title">HEAP</span><div class="pile-count">${state.runner.discard.length}</div></button>`;
  const own = state[state.side];
  $("#hand-label").textContent =
    state.side === "runner" ? "YOUR GRIP" : "YOUR HQ";
  $("#hand-count").textContent =
    own.hand.length + " / " + own.maxHand + " HAND LIMIT";
  const count = own.hand.length,
    overlap = 0;
  $("#hand").innerHTML = own.hand
    .map((c, i) =>
      cardHTML(c).replace(
        "aria-label=",
        `style="--tilt:${(i - (count - 1) / 2) * 1.6}deg;--offset:${Math.abs(i - (count - 1) / 2) * 1.3}px;--overlap:${i ? overlap : 0}px" aria-label=`,
      ),
    )
    .join("");
  fitHand();
  const run = state.run;
  $("#run-divider").classList.toggle("running", !!run);
  $("#run-divider").innerHTML = run
    ? `<strong>RUN ON ${esc(run.server).toUpperCase()}</strong><span>／</span>${["Approach", "Encounter", "Movement", "Breach", "Access"].map((t, i) => `<span class="run-stage ${state.access ? (i === 4 ? "active" : "") : run.encountering ? (i === 1 ? "active" : "") : run.movement ? (i === 2 ? "active" : "") : run.ice >= 0 ? (i === 0 ? "active" : "") : i === 3 ? "active" : ""}">${t}</span>`).join("<span>›</span>")}`
    : "<span>NETRUNNER</span><span>／</span><span>THE NETWORK IS QUIET</span>";
  const freshCount = previousState ? Math.max(0, state.historyCount - previousState.historyCount) : 0;
  const entries = state.history.filter(e => e.text.trim());
  $("#recent-log").innerHTML = `<div class="activity-heading">RECENT ACTIVITY <button class="quiet" data-open-log>Full log ↗</button></div>` + entries.slice(-5).reverse()
    .map((e, i) => `<div class="recent-entry ${i < freshCount ? "fresh" : ""}"><small>TURN ${Math.ceil(e.turn / 2)} · ${e.side.toUpperCase()}</small>${esc(e.text)}</div>`).join("");
  if (freshCount) $("#recent-log").scrollTop = 0;
  $("#decision-announcement").textContent = `${state.phase.title}. ${entries.at(-1)?.text || ""}`;
  renderDecisions();
  requestAnimationFrame(updateScrollCues);
}
function hint() {
  if (state.terminal) return "Every run tells a story.";
  if (busy) return "Your opponent is considering the position.";
  if (state.phase.identifier.includes("Mulligan"))
    return "Keep your opening five, or shuffle them back and draw a fresh hand. You can mulligan once.";
  if (state.phase.title === "Trash Before Install")
    return state.side === "runner"
      ? "You may trash installed programs to free memory. Choose Finish install when you have enough memory; you can keep your other programs."
      : "You may trash existing cards to make room. Trashing ice can lower the install cost. Choose Finish install when ready.";
  if (state.decision?.commands.some(c => c.command === "discard"))
    return "Choose cards to discard until your hand is within its limit. Inspect a card to read it before choosing.";
  if (state.access && state.side === "corp")
    return "The Runner is accessing this server. Resolve any available defensive abilities; the Runner chooses whether to steal or pay to trash.";
  if (state.access)
    return "You made it in. Steal agendas, or pay the trash cost to remove assets and upgrades. Any additional costs appear in your choices.";
  if (state.phase.identifier === "Run Subroutines")
    return state.side === "corp" ? "Fire each unbroken subroutine in order. Broken subroutines are skipped." : "The Corp is resolving unbroken subroutines. Resolve any available responses.";
  if (state.run?.encountering && state.side === "corp")
    return "The Runner is encountering your ice. Use available defensive abilities or pass; unbroken subroutines will fire afterward.";
  if (state.run?.encountering)
    return "Use a matching icebreaker, raise its strength if needed, then break subroutines. Unbroken subroutines will fire.";
  if (
    state.phase.identifier === "Runner 1.3" ||
    state.phase.identifier === "Corp 2.2"
  )
    return "Spend clicks to build your position. Gold outlines mark cards with available actions.";
  if (state.run?.movement && state.side === "corp")
    return "The Runner is moving through the server. Use available defenses or pass this window; the Runner decides whether to continue or jack out.";
  if (state.run?.movement)
    return "Continue deeper into the server, or jack out to end this run.";
  if (state.phase.identifier === "Run 5.2" && state.side === "corp")
    return "The Runner is breaching this server and choosing cards to access.";
  if (state.phase.identifier === "Run 5.2")
    return "Choose a card to access. Facedown cards stay hidden until you select them.";
  return "Choose an action, or continue to pass this timing window.";
}
function renderDecisions() {
  if (!state) return;
  rememberActionFocus();
  requestAnimationFrame(restoreActionFocus);
  $("#game").classList.toggle("busy", busy);
  $("#turn-label").textContent = state.terminal
    ? "GAME COMPLETE"
    : busy
      ? "AI THINKING"
      : state.phase.identifier.includes("Mulligan")
        ? "OPENING HAND"
        : state.playerTurn === state.side
          ? "YOUR TURN"
          : "YOUR RESPONSE";
  $("#turn-number").textContent = "TURN " + Math.ceil(state.turn / 2);
  $("#phase-title").textContent = state.terminal
    ? "Connection closed"
    : state.phase.title;
  $("#phase-hint").textContent = hint();
  const focus = state.access || (state.run?.encountering && state.run.card);
  $("#access-card").innerHTML = focus
    ? `<div class="access-inline">${cardHTML(focus)}</div>${focus.subroutines?.length ? `<ul class="subroutines">${focus.subroutines.map((s) => `<li class="${s.broken ? "broken" : ""}">${esc(s.text)}</li>`).join("")}</ul>` : ""}`
    : "";
  if (state.terminal) {
    $("#decisions").innerHTML =
      `<div class="gameover"><span class="eyebrow">${state.terminal.winner.toUpperCase()} WINS</span><h2>${state.terminal.winner === state.side ? "Well played." : "Another run awaits."}</h2><p>${esc(state.terminal.reason)}</p><button class="primary" data-lobby>Play again ↗</button></div>`;
    return;
  }
  if (busy) {
    $("#decisions").innerHTML =
      '<div class="spinner"></div><p class="thinking">Calculating the next move…</p>';
    return;
  }
  const commands = state.decision?.commands || [];
  const primaryCommand = state.run?.encountering && commands.some(c => c.command === "trigger")
    ? "trigger" : ["score", "steal", "n", "continue"].find(cmd => commands.some(c => c.command === cmd));
  let group = commands.find((c) => c.command === selectedCommand);
  if (!group && commands.length === 1 && commands[0].options.length > 1) {
    group = commands[0];
    selectedCommand = group.command;
  }
  if (group) {
    const multi = group.options.find((o) => o.multi)?.multi;
    const head = `${commands.length > 1 ? '<button class="action-back" data-back>← All actions</button>' : ""}${group.instruction ? `<p class="phase-hint">${esc(group.instruction)}</p>` : ""}`;
    const options = group.options
      .filter((o) => !multi || !o.multi?.button)
      .map(
        (o) =>
          `<button class="action-button ${multiSelected.includes(o.card?.id) ? "selected" : ""}" ${multi && o.multi ? `aria-pressed="${multiSelected.includes(o.card?.id)}"` : ""} data-option="${o.index}" data-command="${esc(group.command)}"><span class="action-option">${o.card && !o.card.hidden ? `<img class="option-thumb" src="/assets/cards/${o.card.number}.jpg" alt="">` : ""}<span>${esc(o.label)}${o.hostLabel ? `<span class="option-detail">${esc(o.hostLabel)}</span>` : ""}${costHTML(o.cost)}${o.detail && !o.label.replace(/[.\s]+$/, "").includes(o.detail.replace(/[.\s]+$/, "")) ? `<span class="option-detail">${esc(o.detail)}</span>` : ""}</span></span>${multi && o.multi ? "<small>" + (multiSelected.includes(o.card?.id) ? "✓" : "＋") + "</small>" : ""}</button>`,
      )
      .join("");
    $("#decisions").innerHTML =
      head +
      `<div class="actions">${options}</div>` +
      (multi
        ? `<p class="phase-hint" style="margin-top:14px">Select ${multi.optional ? "up to " : ""}${multi.max} cards · ${multiSelected.length} selected</p><button class="action-button primary-action" data-multi-confirm ${(multiSelected.length === 0 && !multi.optional) || (multiSelected.length !== multi.max && !multi.optional) ? "disabled" : ""}>Confirm selection</button>`
        : "") +
      (group.cancel
        ? `<button class="quiet" data-cancel="${esc(group.command)}">Cancel</button>`
        : "");
  } else {
    $("#decisions").innerHTML =
      '<div class="actions">' +
      commands
        .map(
          (c) =>
            `<button class="action-button ${c.command === primaryCommand ? "primary-action" : ""}" data-command="${esc(c.command)}" data-group><span>${esc(singleActionLabel(c))}${costHTML(c.cost)}${c.options.length === 1 && c.options[0].card ? `<span class="option-detail">${esc(["install", "play", "rez", "advance"].includes(c.command) ? c.options[0].card.title || c.options[0].label : c.options[0].label)}</span>` : ""}</span><small>${c.options.length > 1 ? c.options.length + " choices" : "↗"}</small></button>`,
        )
        .join("") +
      "</div>";
  }
}
function toggleMulti(group, option) {
  const id = option.card?.id;
  if (!id) return;
  const i = multiSelected.indexOf(id);
  if (i >= 0) multiSelected.splice(i, 1);
  else if (multiSelected.length < option.multi.max) multiSelected.push(id);
  else toast("Select at most " + option.multi.max + " cards.");
  renderDecisions();
  document
    .querySelectorAll("[data-card]")
    .forEach((el) =>
      { el.classList.toggle("selected", multiSelected.includes(el.dataset.card));
        if (el.hasAttribute("aria-pressed")) el.setAttribute("aria-pressed", multiSelected.includes(el.dataset.card)); },
    );
}
function closeDialogs() {
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
}
function inspect(card) {
  hideHover();
  if (card.hidden) {
    const refs = actionRefs(card.id);
    if (refs.length === 1) choose(refs[0].command, refs[0].index);
    else if (refs.length) {
      selectedCommand = refs[0].command;
      renderDecisions();
    } else toast("This card is facedown. Its identity is hidden.");
    return;
  }
  const d = DATA[card.number];
  if (!d) return;
  const actions = actionRefs(card.id);
  const stats = [
    ["cost", "Cost"],
    ["strength", "Strength"],
    ["memory_cost", "Memory"],
    ["advancement_cost", "Advance"],
    ["agenda_points", "Agenda"],
    ["trash_cost", "Trash"],
  ]
    .filter(([k]) => typeof d[k] === "number")
    .map(
      ([k, label]) =>
        `<span><b>${k === "strength" && card.strength !== null && card.strength !== undefined ? card.strength : d[k]}</b> ${label}</span>`,
    )
    .join("");
  $("#inspect-content").innerHTML =
    `<div class="inspect-layout"><img class="inspect-image" src="/assets/cards-hires/${card.number}.png" data-fallback="${card.number}" alt="${esc(d.title)} card"><div class="inspect-copy"><span class="eyebrow">${esc(d.faction_code.replaceAll("-", " ")).toUpperCase()}</span><h2>${esc(d.title)}</h2><p class="inspect-type">${esc(d.type_code.toUpperCase())}${d.keywords ? " · " + esc(d.keywords) : ""}${d.uniqueness ? " · UNIQUE" : ""}</p>${stats ? `<div class="inspect-stats">${stats}</div>` : ""}${
      Object.entries(card.counters || {}).length
        ? `<p class="inspect-type">${Object.entries(card.counters)
            .map(([k, v]) => v + " " + k)
            .join(" · ")}</p>`
        : ""
    }<p class="card-text">${esc(d.stripped_text || d.text)
      .replaceAll("[credit]", "¢")
      .replaceAll(
        "[click]",
        "⏱",
      )}</p>${d.flavor ? `<p class="card-flavor">${esc(d.flavor.replace(/<[^>]*>/g, ""))}</p>` : ""}<p class="artist">Art by ${esc(d.artist || d.illustrator)} · System Gateway #${d.position}</p>${card.hosted?.length ? `<h3>Hosted cards</h3><div>${card.hosted.map((c) => cardHTML(c)).join("")}</div>` : ""}<div class="inspect-actions">${actions.map((a) => `<button class="action-button primary-action" data-inspect-command="${esc(a.command)}" data-option="${a.index}"><span class="inspect-action-copy"><strong>${esc(a.group.label)}${a.option.server ? ` → ${esc(a.option.server)}` : a.option.hostLabel ? ` → ${esc(a.option.hostLabel)}` : ""}</strong>${costHTML(a.option.cost || a.group.cost)}${a.option.detail ? `<span class="option-detail">${esc(a.option.detail)}</span>` : ""}</span><span aria-hidden="true">↗</span></button>`).join("")}</div></div></div>`;
  $("#inspect-dialog").setAttribute("aria-label", d.title + " card details");
  $("#inspect-dialog").showModal();
}
function showHover(el) {
  const card = cardsById.get(el.dataset.card);
  if (
    !card ||
    card.hidden ||
    document.querySelector("dialog[open]") ||
    window.innerWidth <= 760
  )
    return;
  const box = el.getBoundingClientRect(),
    width = Math.min(330, window.innerHeight * 0.55),
    height = width * 1.4 + 45;
  let x = box.right + 18;
  if (x + width > window.innerWidth - 15) x = box.left - width - 18;
  const railLeft = $(".decision-rail").getBoundingClientRect().left;
  if (!$("#game").hidden && railLeft > width + 24) x = Math.min(x, railLeft - width - 14);
  const y = Math.max(
    75,
    Math.min(box.top - 50, window.innerHeight - height - 22),
  );
  const preview = $("#hover-preview");
  preview.style.width = width + "px";
  preview.style.left = Math.max(10, x) + "px";
  preview.style.top = y + "px";
  preview.innerHTML = `<img src="/assets/cards-hires/${card.number}.png" data-fallback="${card.number}" alt="${esc(card.title)}"><div class="preview-caption"><b>${esc(card.title)}</b>${card.installed && card.strength !== null && card.strength !== undefined ? "Current strength " + card.strength + " · " : ""}Click to pin & read</div>`;
  preview.hidden = false;
}
function hideHover() {
  clearTimeout(hoverTimer);
  $("#hover-preview").hidden = true;
}
function lobby() {
  worker?.terminate();
  clearTimeout(watchdog);
  closeDialogs();
  hideHover();
  $("#game").hidden = true;
  $("#lobby").hidden = false;
  $("#resume-button").hidden = !readSave();
  $("#session-label").textContent = "SYSTEM GATEWAY";
}
function showZone(zone) {
  const [side, type] = zone.split("-"),
    cards =
      type === "hand"
        ? state[side].hand
        : type === "score"
          ? state[side].score
          : state[side].discard;
  $("#deck-content").innerHTML =
    `<h3>${type === "score" ? "Scored agendas" : side === "corp" ? (type === "hand" ? "HQ" : "Archives") : "Heap"} · ${cards.length} cards</h3><div style="display:flex;gap:12px;flex-wrap:wrap">${cards.map((c) => cardHTML(c)).join("") || "<p>No cards here yet.</p>"}</div>`;
  $("#deck-dialog h2").textContent = "Inspect pile";
  $("#deck-dialog>p").hidden = true;
  $("#deck-dialog").showModal();
}
function viewDecks() {
  $("#deck-dialog h2").textContent = "Your loadout";
  $("#deck-dialog>p").hidden = false;
  $("#deck-content").innerHTML =
    '<div class="deck-columns">' +
    Object.entries(presets)
      .map(
        ([side, d]) =>
          `<section><h3 class="deck-title">${side === "runner" ? "Loup · Break the system" : "Precision Design · Build an empire"}</h3><p class="phase-hint">40 cards · ${side === "runner" ? "6 / 15 influence" : "18 agenda points · 4 / 15 influence"}</p><div class="deck-list">${[[d.identity, 1], ...d.cards].map(([n, count]) => `<button class="deck-row" data-library="${n}"><img src="/assets/cards/${n}.jpg" alt=""><strong>${esc(DATA[n].title)}</strong><small>${DATA[n].type_code}</small><b>×${count}</b></button>`).join("")}</div></section>`,
      )
      .join("") +
    "</div>";
  $("#deck-dialog").showModal();
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("button,[data-zone]");
  if (!el) return;
  if (el.hasAttribute("data-open-log")) { $("#log-button").click(); return; }
  if (el.matches("[data-close]")) {
    el.closest("dialog").close();
    return;
  }
  if (el.dataset.library) {
    inspect({
      id: "library-" + el.dataset.library,
      number: Number(el.dataset.library),
      hidden: false,
    });
    return;
  }
  if (el.dataset.card) {
    const card = cardsById.get(el.dataset.card);
    const group = state?.decision?.commands.find(
      (c) => c.command === selectedCommand,
    );
    const option = group?.options.find(
      (o) => o.card?.id === card.id && o.multi,
    );
    if (option) toggleMulti(group, option);
    else inspect(card);
    return;
  }
  if (el.dataset.scrollMat) {
    const mat = $("." + el.dataset.scrollMat + "-mat");
    mat.scrollTo({
      top:
        mat.scrollTop + mat.clientHeight >= mat.scrollHeight - 5
          ? 0
          : mat.scrollTop + mat.clientHeight * 0.65,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
    return;
  }
  if (el.dataset.zone) {
    showZone(el.dataset.zone);
    return;
  }
  if (el.hasAttribute("data-back")) {
    selectedCommand = null;
    multiSelected = [];
    renderDecisions();
    return;
  }
  if (el.hasAttribute("data-lobby")) {
    lobby();
    return;
  }
  if (el.dataset.cancel) {
    choose(el.dataset.cancel, 0, undefined, true);
    return;
  }
  if (el.dataset.inspectCommand) {
    const group = state.decision.commands.find(
        (c) => c.command === el.dataset.inspectCommand,
      ),
      option = group.options.find((o) => o.index === Number(el.dataset.option));
    if (option.multi) {
      selectedCommand = group.command;
      closeDialogs();
      toggleMulti(group, option);
    } else choose(group.command, option.index);
    return;
  }
  if (el.hasAttribute("data-multi-confirm")) {
    const group = state.decision.commands.find(
      (c) => c.command === selectedCommand,
    );
    const option =
      group.options.find((o) => o.multi?.button) ||
      group.options.find((o) => o.card?.id === multiSelected[0]);
    if (option) choose(group.command, option.index, multiSelected);
    return;
  }
  if (el.dataset.serverAction) {
    const refs = state.decision.commands.flatMap((c) =>
      c.options
        .filter((o) => o.server === el.dataset.serverAction)
        .map((o) => ({ command: c.command, index: o.index })),
    );
    if (refs.length === 1) choose(refs[0].command, refs[0].index);
    else if (refs.length) {
      selectedCommand = refs[0].command;
      renderDecisions();
    }
    return;
  }
  if (el.dataset.command) {
    const group = state.decision?.commands.find(
      (c) => c.command === el.dataset.command,
    );
    if (!group) return;
    if (el.hasAttribute("data-group")) {
      if (group.options.length === 1 && !group.options[0].multi)
        choose(group.command, 0);
      else {
        selectedCommand = group.command;
        renderDecisions();
      }
    } else {
      const option = group.options[Number(el.dataset.option)];
      if (option.multi) toggleMulti(group, option);
      else choose(group.command, option.index);
    }
    return;
  }
});
document.addEventListener("pointerdown", () => { focusIntent = null; });
document.addEventListener("pointerover", (e) => {
  const el = e.target.closest("[data-card]");
  if (!el) return;
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => showHover(el), 220);
});
document.addEventListener("pointerout", (e) => {
  const el = e.target.closest("[data-card]");
  if (el && !el.contains(e.relatedTarget)) hideHover();
});
document.addEventListener("focusin", (e) => {
  const el = e.target.closest("[data-card]");
  if (el) showHover(el);
});
document.addEventListener("focusout", hideHover);
document.addEventListener("scroll", hideHover, true);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideHover();
});
document.addEventListener(
  "error",
  (e) => {
    if (e.target.matches?.("img[data-fallback]")) {
      e.target.src = "/assets/cards/" + e.target.dataset.fallback + ".jpg";
      e.target.removeAttribute("data-fallback");
    }
  },
  true,
);
document.querySelectorAll("[data-side]").forEach((btn) =>
  btn.addEventListener("click", () => {
    role = btn.dataset.side;
    document
      .querySelectorAll("[data-side]")
      .forEach((b) => { b.classList.toggle("active", b === btn); b.setAttribute("aria-pressed", b === btn); });
  }),
);
$("#start-button").onclick = () =>
  start({ side: role, seed: crypto.randomUUID() });
$("#resume-button").onclick = () => {
  try {
    const s = validateReplay(readSave());
    start(s.config, s.choices, s.conceded);
  } catch (e) {
    toast(e.message);
  }
};
$("#deck-button").onclick = viewDecks;
$("#menu-button").onclick = () => {
  $("#undo-button").disabled = !session?.choices.length;
  $("#concede-button").disabled = busy || !state || !!state.terminal;
  $("#export-button").disabled = !session;
  $("#menu-dialog").showModal();
};
$("#help-button").onclick = () => $("#help-dialog").showModal();
$("#log-button").onclick = () => {
  $("#full-log").innerHTML =
    state?.history
      .map(
        (e) =>
          `<div class="log-entry"><small>TURN ${Math.ceil(e.turn / 2)} · ${e.side.toUpperCase()}</small>${esc(e.text)}</div>`,
      )
      .reverse()
      .join("") || "<p>No moves yet. Jack in to start a game.</p>";
  $("#log-dialog").showModal();
};
$("#new-button").onclick = lobby;
$("#undo-button").onclick = () => {
  if (!session?.choices.length) return;
  const replay = session.choices.slice(0, -1),
    config = session.config;
  closeDialogs();
  start(config, replay);
};
$("#concede-button").onclick = () => {
  if (busy || !state || state.terminal) return;
  closeDialogs();
  session.conceded = true;
  worker.postMessage({ type: "concede" });
};
$("#export-button").onclick = () => {
  if (!session) return;
  const url = URL.createObjectURL(
      new Blob([JSON.stringify(session, null, 2)], {
        type: "application/json",
      }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = "netrunner-replay-" + session.config.seed.slice(0, 8) + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Game replay exported.");
};
$("#import-button").onclick = () => $("#import-input").click();
$("#import-input").onchange = async (e) => {
  try {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2000000) throw Error("Replay file is too large.");
    const s = validateReplay(JSON.parse(await file.text()));
    closeDialogs();
    start(s.config, s.choices, s.conceded);
  } catch (err) {
    toast(err.message);
  } finally {
    e.target.value = "";
  }
};
$("#resume-button").hidden = !readSave();
// Read-only diagnostics for local integration tests; never exposes hidden engine state.
window.localTable = {
  get state() {
    return state;
  },
  get session() {
    return session;
  },
  get busy() {
    return busy;
  },
};

function fitHand() {
  const hand = $("#hand"),
    cards = [...hand.children];
  if (cards.length < 2) return;
  const available = hand.clientWidth - 56,
    cardWidth = cards[0].offsetWidth,
    gap = parseFloat(getComputedStyle(hand).gap) || 0;
  const overlap = Math.min(
    0,
    (available - cards.length * cardWidth - (cards.length - 1) * gap) /
      (cards.length - 1),
  );
  cards.forEach((c, i) => {
    const angle = Math.max(-5, Math.min(5, (i - (cards.length - 1) / 2) * 1.6));
    c.style.setProperty("--overlap", i ? overlap + "px" : "0px");
    c.style.setProperty("--tilt", angle + "deg");
    c.style.setProperty("--offset", (-Math.sin(Math.abs(angle) * Math.PI / 180) * cardWidth / 2 - 4) + "px");
  });
}
new ResizeObserver(fitHand).observe($("#hand"));

function updateScrollCues() {
  document.querySelectorAll("[data-scroll-mat]").forEach((button) => {
    const mat = $("." + button.dataset.scrollMat + "-mat");
    button.hidden = mat.scrollHeight <= mat.clientHeight + 3;
  });
}
new ResizeObserver(updateScrollCues).observe($("#table"));

if (new URLSearchParams(location.search).get("reference") === "example") {
  const { mountReference } = await import("/eval/reference-viewer.js");
  await mountReference(position => {
    state = position; busy = false; previousState = null;
    selectedCommand = null; multiSelected = [];
    closeDialogs(); hideHover();
    $("#lobby").hidden = true; $("#game").hidden = false;
    render();
  });
}
