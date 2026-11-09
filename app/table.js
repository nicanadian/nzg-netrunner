import { counterEntries, counterMarkup, counterLabel, clickMarkup, resourceChanges } from './counters.mjs';
import { plural, displayText, phaseHeading, priorityLabel, receiptLabel, orderedCommands, restrictionText, continuationModel } from './presentation.mjs';
import { activityModel, activityExplanation, damageExplanation } from './activity.mjs';
import { opponentBeat } from './opponent.mjs';
import { virusStatus, virusMarkup } from './virus.mjs';
import { helperContext } from './helper-context.mjs';
import { mountHelper } from './helper.mjs';
import { encounterTool, relatedCards, corpIceRezHint } from './encounter.mjs';
import {breakerPlan,secondaryAbility,cancellationLabel,assistedChoice,quotedInstallFinish,paidAbilityFinish} from './interaction.mjs';
import {responseLabel} from './presentation.mjs';
import { runDrawerModel } from './run-drawer.mjs';
import '../engine/deck-catalog.js';
const DECKS = globalThis.NRDecks;
const selectedDeckIds = {...DECKS.defaults};
const INSPECTION_PIXELS = 743;
let pixelRatioQuery;
function updateRasterLimit() {
  pixelRatioQuery?.removeEventListener("change", updateRasterLimit);
  const ratio = window.devicePixelRatio || 1;
  document.documentElement.style.setProperty("--card-raster-limit", Math.min(340, Math.max(280, INSPECTION_PIXELS / ratio)) + "px");
  pixelRatioQuery = matchMedia(`(resolution: ${ratio}dppx)`);
  pixelRatioQuery.addEventListener("change", updateRasterLimit);
}
updateRasterLimit();
window.addEventListener("resize", () => { updateRasterLimit(); hideHover(); });
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
let counterChanges = [], lastResourceChange = null;
let actionResourceChange = null, presentationTimer, actionPresentedAt = 0;
let pendingActionLabel = null;
let activityView = 'opponent';
let opponentQueue = [], opponentArchive = [], opponentCurrent = null;
let opponentTimer, opponentFinal = null, opponentPaused = false, opponentSkipped = false, opponentReplaying = false;
const OPPONENT_PACE = 1400;
let gameHelper, inspectedCard = null;
let replayRecovery = null;
let activePlan=null,abilityOrigin=null,cancelReturnFocus=false,manualExpanded=false,lastReceipt=null,pendingReceipt=null,skipPreferenceVersion=null;
let skipBoostWindows=true;try{skipBoostWindows=localStorage.getItem('netrunner-skip-boost-windows')!=='false'}catch{}
let streamlineTiming=true, teachingPauses=false, holdPriority=false, installTransaction=null, installReplaceIntent=false;
let automaticReceiptBefore=null, deferredAutomatic=null;
try{streamlineTiming=localStorage.getItem('netrunner-streamline-timing')!=='false';teachingPauses=localStorage.getItem('netrunner-teaching-pauses')==='true'}catch{}
let runPane = 'actions', runSheetCollapsed = false, wasRunning = false, runDecisionVersion = null;

function stopOpponentPlayback(clearArchive = false) {
  clearTimeout(opponentTimer); opponentTimer = null;
  opponentQueue = []; opponentCurrent = null; opponentFinal = null;
  opponentPaused = false; opponentSkipped = false; opponentReplaying = false;
  if (clearArchive) opponentArchive = [];
  $('#opponent-playback').hidden = true;
  $('#game').classList.remove('watching-opponent');
  document.querySelectorAll('.opponent-target').forEach(el => el.classList.remove('opponent-target'));
}
function finishOpponentPlayback() {
  const finish = opponentFinal;
  stopOpponentPlayback();
  pendingActionLabel = null; actionResourceChange = null;
  finish?.();
}
function nextOpponentBeat() {
  clearTimeout(opponentTimer); opponentTimer = null;
  const beat = opponentQueue.shift();
  if (!beat) {
    if (opponentFinal) finishOpponentPlayback();
    else { opponentCurrent = null; renderPlayback(); renderDecisions(); }
    return;
  }
  opponentCurrent = beat;
  if (gameHelper?.isOpen() || teachingPauses && beat.pauseForReview) opponentPaused = true;
  previousState = state; state = beat.state; busy = true;
  actionResourceChange = null; actionPresentedAt = 0;
  pendingActionLabel = beat.caption;
  render();
  $('.decision-rail').scrollTop = 0;
  if (!opponentPaused) opponentTimer = setTimeout(nextOpponentBeat, OPPONENT_PACE);
}
function queueOpponentBeat(before, after) {
  const beat = opponentBeat(before, after);
  if (!beat) return;
  if (activePlan) {activePlan.paused=true;activePlan.reason='The Corp responded. Review the current quote before continuing.';}
  if (opponentArchive.at(-1)?.turn !== beat.turn) opponentArchive = [];
  opponentArchive.push(beat);
  if (opponentSkipped) return;
  opponentQueue.push(beat);
  if (!opponentCurrent && !opponentTimer) {
    const hold = actionPresentedAt ? Math.max(0, 520 - (performance.now() - actionPresentedAt)) : 0;
    opponentTimer = setTimeout(nextOpponentBeat, hold);
  } else renderPlayback();
}
function renderPlayback() {
  const panel = $('#opponent-playback');
  panel.hidden = !opponentCurrent;
  $('#game').classList.toggle('watching-opponent', !!opponentCurrent);
  document.querySelectorAll('.opponent-target').forEach(el => el.classList.remove('opponent-target'));
  if (!opponentCurrent) return;
  const beat = opponentCurrent;
  panel.innerHTML = `<small>${opponentReplaying ? 'REPLAY · ' : ''}${beat.opponent.toUpperCase()} ${beat.state.playerTurn===beat.opponent ? 'TURN' : 'RESPONSE · YOUR TURN'} ${Math.ceil(beat.turn / 2)}${opponentPaused ? ' · PAUSED' : ''}</small><h2 role="status" aria-live="polite">${esc(displayText(beat.caption))}</h2>${beat.detail ? `<p>${esc(displayText(beat.detail))}</p>` : ''}${beat.card ? `<button class="playback-card" data-playback-card aria-label="Read ${esc(beat.card.title)}"><img src="/assets/cards-display/${beat.card.number}-300.webp" alt=""><span>Read card ›</span></button>` : ''}<div class="playback-controls"><button data-opponent-pause>${opponentPaused ? 'Resume' : 'Pause'}</button><button data-opponent-next ${!opponentQueue.length && !opponentFinal ? 'disabled' : ''}>Next →</button><button data-opponent-skip>${opponentReplaying ? 'Close replay' : 'Skip to decision'}</button></div><p class="playback-note">${opponentReplaying ? 'Recorded board positions. Your game is unchanged.' : 'Watching the opponent. Your next decision will appear here.'}</p>`;
  const targets = beat.targets;
  document.querySelectorAll('#table [data-card]').forEach(el => {
    if (targets.cards.includes(el.dataset.card)) el.classList.add('opponent-target');
  });
  document.querySelectorAll('.server').forEach(el => {
    if (el.dataset.server === targets.server || targets.zones.includes('corp-deck') && el.dataset.server === 'R&D' || targets.zones.includes('corp-discard') && el.dataset.server === 'Archives') el.classList.add('opponent-target');
  });
  for (const id of targets.zones) document.getElementById(id)?.classList.add('opponent-target');
  if (!document.querySelector('.opponent-target')) $(`#${beat.opponent}-status`).classList.add('opponent-target');
}
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
function resumeSummary(saved) {
  if (!saved) return '';
  try {
    const decks=DECKS.resolve(saved.config?.deckIds),mine=saved.config?.side === 'corp' ? 'corp' : 'runner';
    return `Saved locally · ${decks[mine].name} vs ${decks[mine === 'corp' ? 'runner' : 'corp'].name}`;
  } catch { return 'Saved game · import or resume to check compatibility'; }
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
    config: replayConfig(data.config),
    choices: data.choices,
    conceded: !!data.conceded,
  };
}
function replayConfig(config) {
  const result={side:config.side,seed:config.seed};
  if (config.rulesVersion !== undefined) {
    if (!['26.03-local-1','26.03-local-2'].includes(config.rulesVersion)) throw Error('Unsupported replay rules version.');
    result.rulesVersion = config.rulesVersion;
  }
  if (config.deckIds !== undefined) {
    const decks=DECKS.resolve(config.deckIds);
    result.deckIds=Object.fromEntries(Object.entries(decks).map(([side,deck])=>[side,deck.id]));
  }
  return result;
}
function rememberActionFocus() {
  const el = document.activeElement;
  if (!el?.matches(":focus-visible") || !el.closest("#decisions, #run-footer, #inspect-dialog, #hand, #table")) return;
  focusIntent = { command: el.dataset.command || el.dataset.inspectCommand, option: el.dataset.option, card: el.dataset.card,source:el.dataset.sourceId,kind:el.dataset.abilityKind,plan:el.dataset.planStep,id:el.id };
}
function restoreActionFocus() {
  if (!focusIntent || busy) return;
  const intent = focusIntent;
  focusIntent = null;
  if (!intent.force && document.activeElement !== document.body && document.activeElement?.isConnected && document.activeElement.getClientRects().length) return;
  const buttons = [...document.querySelectorAll("#decisions button:not(:disabled), #run-footer button:not(:disabled)")];
  const same = intent.id && document.getElementById(intent.id) || buttons.find(el =>
    intent.source ? el.dataset.sourceId===intent.source && el.dataset.abilityKind===intent.kind :
    intent.command && el.dataset.command===intent.command && el.dataset.option===intent.option);
  const target= same?.getClientRects().length && !same.disabled ? same :
    $('#decisions select') || $('#decisions [data-plan-step]') || buttons.find(el=>!el.hasAttribute('data-back')) || $('#phase-title');
  target.focus();target.scrollIntoView({block:'nearest'});
}
function costHTML(cost) {
  if (!cost) return "";
  const parts = [];
  if (cost.clicks) parts.push(cost.clicks + (cost.clicks === 1 ? " click" : " clicks"));
  if (Number.isFinite(cost.credits)) parts.push(cost.credits + (cost.credits === 1 ? " credit" : " credits"));
  if (cost.virus) parts.push(cost.virus + ' virus counter' + (cost.virus === 1 ? '' : 's'));
  return `<span class="action-cost">${esc(parts.join(" · "))}${cost.note ? `<span class="cost-note">${esc(cost.note)}</span>` : ""}</span>`;
}
function deltaHTML(p, key) {
  const before = previousState?.[p.side]?.[key];
  const directDiff = typeof before === "number" ? p[key] - before : 0;
  const paid = actionResourceChange?.changes.find(change => !change.cardId && change.side === p.side && change.key === key && change.value === p[key]);
  const diff = directDiff || paid?.delta || 0;
  return diff ? `<span class="resource-delta ${diff > 0 ? "gain" : "spent"}" aria-label="${key} changed by ${diff}">${diff > 0 ? "+" : ""}${diff}</span>` : "";
}
function start(config, replay = [], conceded = false) {
  replayRecovery = null;
  gameHelper?.newGame(`${config.side}:${config.seed}:${JSON.stringify(config.deckIds || {})}`);
  stopOpponentPlayback(true);
  worker?.terminate();
  clearTimeout(watchdog);
  clearTimeout(presentationTimer);
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
  counterChanges = []; lastResourceChange = null;
  actionResourceChange = null; actionPresentedAt = 0;
  pendingActionLabel = null;cancelReturnFocus=false;lastReceipt=null;pendingReceipt=null;activePlan=null;abilityOrigin=null;manualExpanded=false;installTransaction=null;automaticReceiptBefore=null;deferredAutomatic=null;holdPriority=false;$('#hold-priority').checked=false;
  activityView = 'opponent';
  cardsById = new Map(); previousCards = new Map();
  state = null;
  busy = true;
  selectedCommand = null;
  $("#lobby").hidden = true;
  $("#game").hidden = false;
  $(".decision-rail").scrollTop = 0;
  $("#loading").hidden = false;
  $("#loading").textContent = replay.length
    ? "Restoring your game…"
    : "Shuffling the decks…";
  worker = new Worker("/engine/worker.js");
  const runWorker = worker;
  worker.onmessage = ({ data }) => {
    if (worker !== runWorker) return;
    if (data.type !== "resources" && data.type !== 'opponent-step') clearTimeout(watchdog);
    $("#loading").hidden = true;
    if (data.type === "error") {
      stopOpponentPlayback();
      clearTimeout(presentationTimer);
      busy = false;
      if (pending) {
        if (!data.accepted) session.choices.pop();
        pending = false;
        save();
      }
      if (state) state = {...state,decision:null};
      $('#run-footer').innerHTML = '';
      replayRecovery = data.recovery || null;
      toast("The game stopped: " + data.message);
      $("#decisions").innerHTML =
        replayRecovery ? `<p class="phase-hint">This replay stopped after ${replayRecovery.choices} of ${replayRecovery.total} saved decisions. Later choices no longer match this position.</p><p class="phase-hint">Recovery exports the original replay, then resumes at the last compatible decision.</p><button class="action-button primary-action" data-recover-replay>Export original &amp; recover</button>`
          : '<p class="phase-hint">This position could not be resolved. Undo the last decision from Menu to recover.</p>';
      console.error(data.stack);
      return;
    }
    if (data.type === 'opponent-step') {
      queueOpponentBeat(data.before, data.state);
      return;
    }
    if (data.type === "resources") {
      // The human choice resolved. Keep it even if the player leaves during
      // the short visual hold while the opponent finishes its response.
      pending = false;
      save();
      const changes = resourceChanges(state, data.state);
      accountPlanSpending(data.state);
      if(pendingReceipt){lastReceipt={...pendingReceipt,changes,detail:pendingReceipt.cancel ?
        'Selection cancelled. Earlier committed payments and effects remain; no target effect was confirmed by this cancellation.' :
        changes.length ? 'Confirmed choice · resource changes shown below.' :
        data.state.phase?.guide?.kind==='credit-payment' ? 'Payment is in progress. The ability resolves after its full cost is paid.' : 'Choice confirmed. Follow the current decision for any remaining target or effect.'};pendingReceipt=null;renderActionReceipt();}
      if (changes.length) {
        const turnRefresh = changes.every(change => change.key === 'clicks' && change.delta > 0);
        actionResourceChange = {turn:data.state.turn, changes, label:turnRefresh ? 'Turn begins' : pendingActionLabel, automatic:turnRefresh};
        previousState = state; state = data.state;
        busy = true;
        render();
        actionPresentedAt = performance.now();
      }
    }
    if (data.type === "state") {
      const applyState = () => {
        if (worker !== runWorker) return;
        previousState = state;
        state = data.state;
        accountPlanSpending(state);
        if(automaticReceiptBefore && lastReceipt){
          lastReceipt={...lastReceipt,changes:state.turn===automaticReceiptBefore.turn?resourceChanges(automaticReceiptBefore,state):lastReceipt.changes,detail:'Automatically resolved. Resource changes and the full effect remain in Activity.'};
          automaticReceiptBefore=null;
        }
        busy = !state.decision && !state.terminal;
        pending = false;
        selectedCommand = null;
        multiSelected = [];
        if(activePlan && (!state.run?.encountering || state.run.card?.id!==activePlan.iceId || state.terminal)){
          const completed=state.run?.card?.id===activePlan.iceId && state.run.card.subroutines.every(s=>s.broken);
          if(completed)completeBreakerPlan();else activePlan=null;
          toast(completed?'All subroutines broken.':'Breaker plan stopped: the encounter changed. Earlier payments remain spent.');
        }
        render();
        if(cancelReturnFocus){focusIntent={...abilityOrigin,force:true};cancelReturnFocus=false;manualExpanded=true;}
        const plan=activePlan;
        const step=plan&&breakerPlan(state,plan.cardId);
        if(step?.status==='complete'){completeBreakerPlan();renderActionReceipt();}
        const planned=activePlan && nextPlannedChoice(step);
        const finish=paidAbilityFinish(state);
        if(!installTransaction && state.installation){
          const card=state.installation.card;
          installTransaction={cardId:card.id,title:card.title,number:card.number,replace:true};
        }
        const install=quotedInstallFinish(state,installTransaction);
        const assisted=state.version!==skipPreferenceVersion && !activePlan && assistedChoice(state,{skipBoostWindows,streamline:streamlineTiming,hold:holdPriority});
        const automatic=planned || finish || install || assisted;
        if(installTransaction && !state.installation && state.phase.guide?.kind!=='credit-payment' &&
          (cardsById.get(installTransaction.cardId)?.installed || state[state.side].hand.some(c=>c.id===installTransaction.cardId) || state.terminal))installTransaction=null;
        if(!automatic)renderInstallation();
        if(automatic && !new URLSearchParams(location.search).has('reference')){
          const v=state.version;
          const perform=()=>{
            if(worker!==runWorker || $('#game').hidden || busy || state.version!==v || planned&&activePlan!==plan)return;
            if(assisted&&!assistedChoice(state,{skipBoostWindows,streamline:streamlineTiming,hold:holdPriority}))return;
            if(document.querySelector('dialog[open]')){deferredAutomatic=perform;return;}
            deferredAutomatic=null;
            choose(automatic.command,automatic.index,undefined,false,true);
          };
          setTimeout(perform,0);
        }
        actionResourceChange = null; actionPresentedAt = 0; pendingActionLabel = null;
        save();
      };
      if (opponentCurrent || opponentQueue.length || opponentTimer) {
        opponentFinal = applyState;
        renderPlayback();
        return;
      }
      const delay = opponentSkipped || matchMedia("(prefers-reduced-motion: reduce)").matches || !actionPresentedAt ? 0 : Math.max(0, 520 - (performance.now() - actionPresentedAt));
      opponentSkipped = false;
      clearTimeout(presentationTimer);
      if (delay) presentationTimer = setTimeout(applyState, delay);
      else applyState();
    }
  };
  worker.onerror = (e) => {
    if (worker !== runWorker) return;
    stopOpponentPlayback();
    clearTimeout(presentationTimer);
    clearTimeout(watchdog);
    $("#loading").hidden = true;
    busy = false;
    if (state) state = {...state,decision:null};
    $('#run-footer').innerHTML = '';
    toast("The game could not start. " + e.message);
    $("#decisions").innerHTML = '<p class="phase-hint">The game stopped. Your recorded choices are retained. Undo the last decision from Menu to retry from the previous position.</p>';
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
function choose(command, index, cards, cancel = false, automatic = false) {
  if (new URLSearchParams(location.search).get("reference") === "example") { toast("Recorded position. Use the example controls, or Play live to start a game."); return; }
  if (busy || !state?.decision) return;
  opponentSkipped = false;
  const choice = {
    version: state.version,
    command,
    index,
    ...(cards ? { cards } : {}),
    ...(cancel ? { cancel: true } : {}),
  };
  const commandGroup = state.decision.commands.find(group => group.command === command);
  const actionOption = commandGroup?.options.find(option => option.index === index);
  if(command==='install' && actionOption?.installQuote && !cancel){
    installTransaction={cardId:actionOption.card.id,title:actionOption.card.title,number:actionOption.card.number,
      credits:actionOption.cost.credits,clicks:actionOption.cost.clicks || 0,replace:installReplaceIntent};
  }
  installReplaceIntent=false;
  pendingActionLabel = cancel ? cancellationLabel(state) : receiptLabel(commandGroup, actionOption, state);
  pendingReceipt=automatic&&command==='n'&&!state.installation?null:{label:pendingActionLabel,cancel,source:state.phase?.source,kind:actionOption?.abilityKind,command,automatic};
  automaticReceiptBefore=automatic&&state.assistance?.kind==='forced-effect'?state:null;
  if(!['trigger','continue','pay'].includes(command)&&!cancel)abilityOrigin=null;
  if(actionOption?.card && command==='trigger')abilityOrigin={command,source:actionOption.card.id,kind:actionOption.abilityKind};
  if(cancel&&abilityOrigin)cancelReturnFocus=true;else rememberActionFocus();
  session.choices.push(choice);
  pending = true;
  actionResourceChange = null; actionPresentedAt = 0;
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
        .filter((o) => o.card?.id === id || o.sourceId === id)
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
  const counters = counterEntries(card);
  const title = card.hidden ? "Facedown " + card.side + " card" : card.title;
  const virus = virusStatus(card);
  return `<button class="card ${card.hidden ? "hidden-card" : ""} ${card.side} ${legal ? "legal" : ""} ${counterChanges.some(c=>c.cardId===card.id && c.key==='moved') ? 'card-moved' : ''} ${virus.hosts.length ? 'virus-host' : ''} ${virus.effects.length ? 'virus-affected' : ''} ${multiSelected.includes(card.id) ? "selected" : ""} ${extra} ${previousCards.size && (!previousCards.has(card.id) || previousCards.get(card.id).installed !== card.installed) ? "card-arrived" : ""} ${state?.run?.card?.id === card.id ? "encounter-target" : ""}" data-card="${esc(card.id)}" aria-label="${esc(title)}${legal ? " — action available" : ""}${counters.map(([k,v]) => `, ${counterLabel(k, v)}`).join("")}${virus.description ? ', '+esc(virus.description) : ''}"${state?.decision?.commands.some(g => g.options.some(o => o.multi && o.card?.id === card.id)) ? ` aria-pressed="${multiSelected.includes(card.id)}"` : ""}${card.hidden ? "" : ` data-number="${card.number}"`}>${card.hidden ? "" : `<img src="/assets/cards-display/${card.number}-600.webp" srcset="/assets/cards-display/${card.number}-300.webp 300w, /assets/cards-display/${card.number}-600.webp 600w" sizes="(min-width: 1060px) and (min-height: 880px) 132px, 120px" alt="" draggable="false">`}${counterMarkup(card, counterChanges)}${virusMarkup(card)}${!card.hidden && card.installed && card.type === "agenda" && card.advancementRequirement !== null && card.advancementRequirement !== undefined ? `<span class="agenda-progress ${card.canScore ? "ready" : ""}" title="${card.advancement || 0} of ${card.advancementRequirement} advancement${card.canScore ? "; ready to score" : ""}">${card.canScore ? "✓ READY" : `${card.advancement || 0} / ${card.advancementRequirement} ADV`}</span>` : ""}${card.installed && ["ice", "asset", "upgrade"].includes(card.type) && card.side === "corp" && !card.hidden && !card.faceUp ? '<span class="unrezzed-badge">UNREZZED</span>' : ""}${card.installed && card.strength !== null && card.strength !== undefined && !card.hidden ? `<span class="strength-token" title="Current strength ${card.strength}"><span class="strength-label" aria-hidden="true">STR</span><b>${card.strength}</b></span>` : ""}${!card.hidden && card.type !== "identity" ? `<span class="card-name" aria-hidden="true">${esc(card.title)}</span>` : ""}${card.hosted?.length && !virus.hosts.length ? `<span class="card-hosted">+${card.hosted.length} hosted</span>` : ""}</button>`;
}
const deckBack = (side, count) =>
  `<div class="deck-back ${side}" aria-label="${count} cards in deck"><span><b>N</b></span></div><div class="pile-count">${count} cards</div>`;
function statusHTML(p) {
  const mine = state.side === p.side;
  const stat = (key, label, title = label) => `<div class="stat status-condition ${key}" title="${esc(title)}"><strong>${p[key]}</strong><small>${label}</small>${deltaHTML(p, key)}</div>`;
  return `<div class="player-name">${p.side === "corp" ? "CORPORATION" : "RUNNER"}<small>${mine ? "YOU" : "CHIRIBOGA AI"}${state.playerTurn === p.side ? '<span class="turn-dot" title="Current turn" aria-label="Current turn"></span>' : ""}</small></div><div class="stats"><div class="stat pool-stat" title="Credits in your pool"><span class="credit-pile" aria-hidden="true">${Array.from({length:Math.min(4, p.credits)}, (_, i) => `<i style="--coin:${i}"></i>`).join("")}<span class="credit-token">${p.credits}</span></span><span class="sr-only">${p.credits}</span>${deltaHTML(p, "credits")}<small>credits</small></div><div class="stat click-stat">${clickMarkup(p, previousState?.[p.side], previousState?.turn === state.turn)}<small>${p.clicks} ${p.clicks === 1 ? "click" : "clicks"}</small></div>${p.side === "runner" ? `<div class="stat memory-stat" title="Available memory"><strong>${p.memory - p.memoryUsed}</strong><small>MU free</small></div>${p.tags ? stat('tags', 'tags', 'Runner tags') : ''}${p.coreDamage ? stat('coreDamage', 'core damage', 'Core damage permanently reduces your maximum hand size') : ''}${p.temporaryCredits ? stat('temporaryCredits', 'run credits', 'Temporary credits usable during this run') : ''}` : p.badPublicity ? stat('badPublicity', 'bad pub', 'Bad publicity gives the Runner temporary credits each run') : ''}</div><button class="scroll-cue" data-scroll-mat="${p.side}" aria-label="Scroll ${p.side} play area" title="Scroll to see more cards" hidden>↕ Board</button><button class="points" data-zone="${p.side}-score" aria-label="Inspect ${plural(p.points, "scored agenda point")}"><strong>${p.points}</strong>${deltaHTML(p, "points")}<span>/ 7 <small>AGENDA</small></span></button>`;
}
function renderActionReceipt(){
 const panel=$('#action-receipt');panel.hidden=!lastReceipt;if(!lastReceipt)return;
 panel.innerHTML=`<span class="receipt-kind">${lastReceipt.cancel?'CANCELLED':'LAST CONFIRMED CHOICE'}</span><strong>${esc(lastReceipt.label)}</strong><p>${esc(lastReceipt.detail)}</p>${lastReceipt.changes.length?`<ul>${lastReceipt.changes.map(c=>`<li>${esc(c.label)} · ${esc(c.detail || (c.delta>0?'+':'')+c.delta+' · '+c.value+' left')}</li>`).join('')}</ul>`:''}`;
}
function renderResourceFeedback() {
  const fresh = resourceChanges(previousState, state);
  counterChanges = fresh.length ? fresh : (actionResourceChange?.changes || []).map(change => ({...change, quiet:true}));
  const ownAction = Boolean(actionResourceChange);
  if (fresh.length || actionResourceChange) {
    const groups = [];
    if (ownAction) groups.push({...actionResourceChange, label:actionResourceChange.label || 'Your action', kind:actionResourceChange.automatic ? 'automatic' : 'action'});
    if (fresh.length && (!ownAction || JSON.stringify(fresh) !== JSON.stringify(actionResourceChange.changes)))
      groups.push({label:ownAction ? 'After automatic effects' : pendingActionLabel || 'Resource changes', turn:state.turn, changes:fresh});
    if (groups.length) lastResourceChange = {turn:state.turn, groups};
  }
  const panel = $('#resource-feedback');
  panel.hidden = !lastResourceChange;
  if (!lastResourceChange) { panel.innerHTML = ''; return; }
  panel.innerHTML = `<div class="activity-heading">LAST RESOURCE CHANGE <small>TURN ${Math.ceil(lastResourceChange.turn / 2)}</small></div><div class="resource-groups">${lastResourceChange.groups.map(group => `<div class="resource-group"><h3>${group.kind === 'action' && lastResourceChange.groups.length > 1 ? 'Your action · ' : ''}${esc(displayText(group.label))}${lastResourceChange.groups.length > 1 ? `<small> · Turn ${Math.ceil(group.turn / 2)}</small>` : ''}</h3><ul>${group.changes.map(change => `<li><span>${esc(displayText(change.label))}</span><strong class="${change.delta < 0 ? 'spent' : 'gain'}">${change.delta === null ? '' : change.reset ? '↻ ' : change.delta > 0 ? '+' + change.delta + ' · ' : '−' + Math.abs(change.delta) + ' · '}${esc(change.detail || change.value + (['points','tags','badPublicity','coreDamage'].includes(change.key) ? ' total' : ' left'))}</strong></li>`).join('')}</ul></div>`).join('')}</div><p>${lastResourceChange.groups.length > 1 ? 'Your action, followed by net automatic changes.' : 'Net resource changes. Automatic effects are included.'}</p>`;
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
  return hostedRecords(side).map(({card,location}) => `<div class="hosted-group"><span class="zone-title">HOSTED · ${esc(displayText(location))}</span>${cardHTML(card)}</div>`).join("");
}
function singleActionLabel(command) {
  const step=continuationModel(state);if(step?.command===command.command)return step.label;
  const option = command.options.length === 1 ? command.options[0] : null;
  return command.label === "Continue" && option?.label &&
    !["Continue", command.command].includes(option.label)
    ? option.label : command.label;
}
function render() {
  rememberActionFocus();
  renderResourceFeedback();renderActionReceipt();
  previousCards = cardsById;
  cardsById = new Map();
  hideHover();
  $("#session-label").textContent =
    "SYSTEM GATEWAY · " + (state.side === "runner" ? "RUNNER" : "CORPORATION");
  for (const side of ["corp", "runner"]) {
    const p = state[side];
    $("#" + side + "-status").innerHTML = statusHTML(p);
    $("." + side + "-mat").classList.toggle("turn-owner", state.playerTurn === side);
    $("#" + side + "-identity").innerHTML =
      side === "corp" ? "" : cardHTML(p.identity) + '<span class="identity-label">IDENTITY</span>';
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
          center += `<div class="hq-anchor">${cardHTML(state.corp.identity)}</div>`;
        else
          center += state.corp.discard.length
            ? `<div class="archives-anchor">${cardHTML(state.corp.discard.at(-1))}</div>`
            : '<span class="server-empty">EMPTY</span>';
      }
      const pileControl = !s.central ? '' : s.name === 'HQ'
        ? `<button class="server-pile-count" data-zone="corp-hand" aria-label="Inspect HQ · ${plural(state.corp.hand.length,'card')}">${plural(state.corp.hand.length,"card")} ›</button>`
        : s.name === 'Archives' ? `<button class="server-pile-count" data-zone="corp-discard" aria-label="Inspect Archives · ${plural(state.corp.discard.length,'card')}">${plural(state.corp.discard.length,'card')} ›</button>`
        : `<span class="server-pile-count">${plural(state.corp.deck,'card')}</span>`;
      return `<div class="server ${s.central ? "central-server" : "remote-server"} ${state.run?.server === s.name ? "target" : ""}" data-server="${esc(s.name)}"><div class="server-heading"><${targets.length ? "button" : "h3"} class="server-title" ${targets.length ? 'data-server-action="' + esc(s.name) + '"' : ""}>${esc(displayText(s.name))}${targets.length ? " ›" : ""}${s.ice.length ? `<small> · ${s.ice.length} ICE</small>` : ""}</${targets.length ? "button" : "h3"}>${pileControl}</div><div class="server-root">${center || '<span class="server-empty">EMPTY ROOT</span>'}</div><div class="server-ice" aria-label="${esc(displayText(s.name))} ice, innermost to outermost">${s.ice.map((c, i) => cardHTML(c, "ice").replace('<button ', `<button data-ice-order="${i}" `)).join("")}</div></div>`;
    })
    .join("");
  $("#rig").innerHTML = Object.entries(state.runner.rig)
    .map(
      ([type, cards]) =>
        `<div class="rig-zone ${cards.length ? "occupied" : "empty-zone"}" data-rig-type="${type}" style="--slots:${Math.max(1, cards.length)}"><div class="zone-title">${type.toUpperCase()}</div><div class="rig-cards">${cards.map((c) => cardHTML(c)).join("")}</div></div>`,
    )
    .join("") + (hostedRecords("runner").length ? `<div class="rig-zone hosted-zone" style="--slots:${hostedRecords("runner").length}"><div class="zone-title">HOSTED PROGRAMS</div><div class="rig-cards">${hostedRecords("runner").map(({card,location}) => `<div class="hosted-program">${cardHTML(card)}<span class="host-location">${esc(displayText(location))}</span></div>`).join("")}</div></div>` : "");
  $("#runner-piles").innerHTML =
    `<div class="runner-stack"><span class="zone-title">STACK</span>${deckBack("runner", state.runner.deck)}</div><button class="pile-button" data-zone="runner-discard"><span class="zone-title">HEAP</span><div class="pile-count">${state.runner.discard.length}</div></button>`;
  const own = state[state.side];
  $("#hand-label").textContent =
    state.side === "runner" ? "YOUR GRIP" : "YOUR HQ";
  $("#hand-count").textContent =
    plural(own.hand.length, "card") + " · limit " + own.maxHand;
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
  const run = state.terminal ? null : state.run;
  $("#run-divider").classList.toggle("running", !!run);
  $("#run-divider").innerHTML = run
    ? `<strong>RUN ON ${esc(displayText(run.server)).toUpperCase()}</strong><span>／</span>${["Approach", "Encounter", "Movement", "Breach", "Access"].map((t, i) => `<span class="run-stage ${state.access ? (i === 4 ? "active" : "") : run.encountering ? (i === 1 ? "active" : "") : run.movement ? (i === 2 ? "active" : "") : run.ice >= 0 ? (i === 0 ? "active" : "") : i === 3 ? "active" : ""}">${t}</span>`).join("<span>›</span>")}`
    : '<span>Corporation servers</span><span aria-hidden="true">↑</span><span>Runner approaches outer ice first</span>';
  const entries = state.history.filter(e => e.text.trim());
  renderActivity();
  $("#decision-announcement").textContent = `${displayText(state.phase.title)}. ${displayText(entries.at(-1)?.text || "")} ${counterChanges.map(c => `${displayText(c.label)}: ${c.detail || c.value + (["points","tags","badPublicity","coreDamage"].includes(c.key) ? " total" : " remaining")}`).join(". ")}`;
  renderDecisions();
  renderPlayback();
  if (!busy && previousState && (previousState.phase.title !== state.phase.title || previousState.phase.identifier !== state.phase.identifier || previousState.access?.id !== state.access?.id)) {
    $('.decision-rail').scrollTop = 0;
    $('#decision-actions').scrollTop = 0;
  }
  requestAnimationFrame(updateScrollCues);
}
function renderActivity() {
  const model = activityModel(state, activityView);
  const opponent = activityModel(state, 'opponent');
  $('#opponent-review').hidden = !opponent.recap || state.playerTurn !== state.side;
  $('#opponent-review').innerHTML = opponent.recap ? `<strong>${esc(opponent.title)}</strong><span>${esc(opponent.highlights.join(' · ') || `${opponent.entries.length} events`)}<b>Review turn ↓</b></span>` : '';
  $('#opponent-replay').hidden = busy || !opponentArchive.length;
  const freshCount = previousState ? Math.max(0, state.historyCount - previousState.historyCount) : 0;
  $("#recent-log").innerHTML = `<div class="activity-heading">ACTIVITY <button class="quiet" data-open-log>Full log ›</button></div>
    <div class="activity-tabs" role="group" aria-label="Activity view"><button data-activity-view="opponent" aria-pressed="${model.recap}" ${model.turn === undefined ? 'disabled' : ''}>${model.name} activity</button><button data-activity-view="latest" aria-pressed="${!model.recap}">Latest</button></div>
    <h2 class="activity-title">${esc(model.title)}</h2><p class="activity-summary">${esc(model.summary)}</p>
    <ol class="activity-entries" tabindex="0" aria-label="${esc(model.title)} events">${model.entries.map((entry, i) => `<li class="recent-entry ${!model.recap && i < freshCount ? 'fresh' : ''}">${model.recap && !model.responses ? '' : `<small>TURN ${Math.ceil(entry.turn / 2)} · ${(entry.actor || entry.side).toUpperCase()}</small>`}${esc(displayText(entry.text))}${activityExplanation(entry) ? `<span class="activity-cause">${esc(displayText(activityExplanation(entry)))}</span>` : ''}</li>`).join('')}</ol>`;
}
function hint() {
  if (state.terminal) return "Every run tells a story.";
  if (busy) return "Your opponent is considering the position.";
  if (state.phase.guide?.kind==='credit-payment') return `Pay ${state.phase.guide.remaining} more of ${state.phase.guide.total} credits. Choose how much to spend from your pool, bad publicity, or eligible cards. The effect resolves when payment is complete.`;
  if (state.phase.guide?.kind==='anoetic-trash') return `Anoetic Void: 2 credits have been paid. Trash the ${state.phase.guide.remaining===2?'first':'second'} of 2 HQ cards. The run ends after both cards are trashed.`;
  if (state.phase.guide?.kind==='pantograph-install') return 'Pantograph already gained you 1 credit. You may install one card without spending a click; normal install credits and memory still apply. Or continue without installing.';
  if (state.viewed) return `${state.viewed.card.title} is ${state.viewed.kind==='expose' ? 'exposed' : 'revealed'}. Read the card, then choose Continue to finish viewing it.`;
  if (state.phase.identifier.includes("Mulligan"))
    return "Keep your opening five, or shuffle them back and draw a fresh hand. You can mulligan once.";
  if (state.phase.title === "Trash Before Install")
    return state.side === "runner"
      ? "Installation is waiting for confirmation. Confirm installation pays the quoted cost. You can optionally trash programs first to free memory."
      : "Installation is waiting for confirmation. Confirm installation pays the quoted cost. You can optionally trash existing cards first; trashing ice may lower the cost.";
  if (state.decision?.commands.some(c => c.command === "discard"))
    return state.phase.title.includes("Discard Phase")
      ? "Choose cards to discard until your hand is within its limit. Inspect a card to read it before choosing."
      : "Choose the card or cards required by this effect. Inspect a card to read it before choosing.";
  if (/Turn Begins/.test(state.phase.title) && state.decision?.commands.length === 1 && state.decision.commands[0].command === 'trigger')
    return 'Resolve your turn-start effect before taking actions.';
  if (state.access && state.side === 'runner' && state.run?.restrictions?.length)
    return 'Read the active run restriction below. Only actions permitted by that effect are available.';
  if (state.decision?.commands.length === 1 && state.decision.commands[0].command === 'trigger' && !state.decision.commands[0].cancel)
    return 'Choose a card effect to resolve before continuing.';
  if (state.access && state.side === "corp")
    return "The Runner is accessing this server. Resolve any available defensive abilities; the Runner chooses whether to steal or pay to trash.";
  if (state.access && ['ice','operation'].includes(state.access.type))
    return 'Read this card, then finish accessing or use an available card ability.';
  if (state.access)
    return "You made it in. Steal agendas, or pay the trash cost to remove assets and upgrades. Any additional costs appear in your choices.";
  if (state.phase.identifier === "Run Subroutines")
    return state.side === "corp" ? "Fire each unbroken subroutine in order. Broken subroutines are skipped." : "The Corp is resolving unbroken subroutines. Resolve any available responses.";
  if (state.run?.encountering && state.side === "corp")
    return "The Runner is encountering your ice. Use available defensive abilities or pass; unbroken subroutines will fire afterward.";
  if (state.run?.encountering)
    return "Review your programs and other ways to break below. Choose an ability, then its subroutine target. Only broken subroutines are skipped.";
  if (
    state.phase.identifier === "Runner 1.3" ||
    state.phase.identifier === "Corp 2.2"
  )
    return state[state.side].clicks === 0
      ? state.decision?.commands.some(c => c.command === 'score') ? 'Your agenda is ready to score. Score it now, or end the action phase.' : 'No clicks remain. Resolve any available free abilities, then end the action phase.'
      : "Spend clicks to build your position. Gold outlines mark cards with available actions.";
  if (state.run?.movement && state.side === "corp")
    return "The Runner is moving through the server. Use available defenses or pass this window; the Runner decides whether to continue or jack out.";
  if (state.run?.movement)
    return state.run.card?.subroutines?.some(s=>s.fired) ? "Unbroken subroutines have fired. Review their effects, then continue or jack out." : "Continue deeper into the server, or jack out to end this run.";
  if (state.phase.identifier === "Run 5.2" && state.side === "corp")
    return "The Runner is breaching this server and choosing cards to access.";
  if (state.phase.identifier === "Run 5.2")
    return "Choose a card to access. Facedown cards stay hidden until you select them.";
  return "Choose an action, or continue to pass this timing window.";
}
function renderDecisions(resetScroll = false) {
  if (!state) return;
  if (resetScroll) { $(".decision-rail").scrollTop = 0; $('#decision-actions').scrollTop = 0; }
  const disclosure=$('#decisions .more-abilities');if(disclosure)manualExpanded=disclosure.open;
  rememberActionFocus();
  requestAnimationFrame(restoreActionFocus);
  const drawer = renderRunDrawer();
  $('#game').classList.toggle('run-encounter-root', !!drawer && state.phase.identifier === 'Run 3.1' && !selectedCommand && !busy);
  $("#game").classList.toggle("busy", busy);
  $("#turn-label").textContent = priorityLabel(state, busy);
  $("#priority-status").textContent=responseLabel(state,busy);
  $("#turn-number").textContent = "TURN " + Math.ceil(state.turn / 2);
  $("#phase-title").textContent = phaseHeading(state);
  $("#phase-hint").textContent = hint();
  $("#effect-source").hidden = !state.phase.source;
  const sourceRef=state.decision?.commands.flatMap(c=>c.options).map(o=>cardsById.get(o.sourceId)).find(c=>c&&!c.hidden&&c.title===state.phase.source);
  $("#effect-source").innerHTML = state.phase.source ? 'FROM '+esc(state.phase.source)+(sourceRef?` <button class="quiet" data-inspect-tool="${esc(sourceRef.id)}">Read source card</button>`:'') : '';
  const restrictions = state.run?.restrictions || [];
  $("#run-restrictions").hidden = !restrictions.length;
  $("#run-restrictions").innerHTML = restrictions.map(r => `<p>${esc(restrictionText(r))}</p>`).join('');
  const focus = drawer?.card || state.viewed?.card || state.access || ((state.run?.encountering || state.run?.movement) && state.run.card);
  const brokenCount = focus?.subroutines?.filter(s => s.broken).length || 0;
  const firedCount = focus?.subroutines?.filter(s => s.fired).length || 0;
  $("#access-card").innerHTML = drawer ? runContextHTML(drawer) : focus
    ? `${state.viewed ? `<p class="encounter-result">${state.viewed.kind==='expose' ? 'EXPOSED' : 'REVEALED'} CARD</p>` : !state.access && state.run?.movement ? `<p class="encounter-result">ICE PASSED <span>${brokenCount} broken${firedCount ? ` · ${firedCount} fired` : ''}</span></p>` : ""}${!focus.hidden && !state.access && state.run?.encountering ? `<p class="encounter-type">${esc(focus.subTypes?.join(" · "))} · STR ${focus.strength}</p>` : ""}<div class="access-inline">${cardHTML(focus)}</div>${!state.viewed && !state.access && focus.subroutines?.length ? `<ol class="subroutines" aria-label="Ice subroutines">${focus.subroutines.map((s,i) => `<li data-subroutine-number="${i+1}" class="${s.broken ? "broken" : s.fired ? "fired" : ""}"><span class="subroutine-number">${i + 1}</span><span class="subroutine-copy">${esc(s.text)}<small>${s.broken ? '✓ Broken' : s.fired ? 'Fired' : 'Unbroken'}</small></span></li>`).join("")}</ol>` : ""}`
    : "";
  if (state.terminal) {
    $("#decisions").innerHTML =
      `<div class="gameover"><span class="eyebrow">${state.terminal.winner.toUpperCase()} WINS</span><h2>${state.terminal.winner === state.side ? "Well played." : "Another run awaits."}</h2><p>${esc(state.terminal.reason)}</p>${state.terminal.damage ? `<p class="damage-result">${esc(damageExplanation(state.terminal.damage))}</p>` : ''}<button class="primary" data-lobby>Play again →</button></div>`;
    return;
  }
  if (busy) {
    $("#decisions").innerHTML =
      opponentCurrent?.kind==='encounter' ? rootAbilityHTML(null,true) + `<p class="target-instruction">${opponentPaused?'Encounter paused. Review the subroutines, then Resume to watch the result.':'Encounter resolving. No input needed; Pause to review the subroutines.'}</p>` : opponentCurrent ? '' : `<div class="waiting-response"><strong>${state.active===state.side?'Resolving your choice':'Waiting for '+(state.active==='corp'?'Corp':'Runner')+' response'}</strong><p>${state.playerTurn===state.side?'Your turn continues.':'The opponent’s turn continues.'} Committed payments remain spent.</p></div>${activePlan?'<button class="quiet" data-plan-stop>Stop queued plan</button>':''}`;
    return;
  }
  let planNotice='';
  if(activePlan){
    const model=breakerPlan(state,activePlan.cardId);
    if(model.status==='invalid')activePlan=null;
    else if(['paused','unavailable'].includes(model.status)){
      activePlan.paused=true;planNotice=planHTML(model);
    }
    else if(model.status!=='payment'){
      $('#decisions').innerHTML=planHTML(model);return;
    }
  }
  if(state.phase.guide?.kind==='credit-payment' && state.decision?.commands.every(c=>c.command==='pay')){
    $('#decisions').innerHTML=paymentHTML();return;
  }
  const nextStep=continuationModel(state);
  const promoted=!drawer ? nextStep : null;
  const ordered = orderedCommands(state.decision?.commands || [], state);
  const commands = ordered.commands.filter(c => c.command!==promoted?.command && !drawer?.controls.some(control => control.command === c.command));
  const primaryCommand = ordered.primary;
  const encounter = state.side === 'runner' && state.run?.encountering && !state.access;
  const triggers = commands.find(c => c.command === 'trigger' && !c.options.some(o=>o.multi));
  let group = commands.find((c) => c.command === selectedCommand);
  if (!promoted && !group && commands.length === 1 && commands[0] !== triggers && (commands[0].options.length > 1 || commands[0].options.some(o=>o.card || o.subroutine))) {
    group = commands[0];
    selectedCommand = group.command;
  }
  if (group) {
    const multi = group.options.find((o) => o.multi)?.multi;
    const head = `${commands.length > 1 ? '<button class="action-back" data-back>← All actions</button>' : ""}${group.instruction ? `<p class="phase-hint">${esc(group.instruction)}</p>` : ""}`;
    const options = group.options
      .filter((o) => !multi || !o.multi?.button)
      .map(o => {
        const location = o.hostLabel || o.location;
        const locationDetail = location && !o.label.includes(location) ? location : null;
        const button=`<button class="action-button ${multiSelected.includes(o.card?.id) ? "selected" : ""}" data-related-cards="${esc(relatedCards(o).join(' '))}" ${multi && o.multi ? `aria-pressed="${multiSelected.includes(o.card?.id)}"` : ""} ${o.subroutine ? `data-target-subroutine="${o.subroutine}"` : ""} data-option="${o.index}" data-command="${esc(group.command)}"><span class="action-option">${o.card && !o.card.hidden ? `<img class="option-thumb" src="/assets/cards-display/${o.card.number}-300.webp" alt="">` : ""}<span>${esc((group.command==='rez'?'Rez ':'')+displayText(o.label))}${locationDetail ? `<span class="option-detail">${esc(displayText(locationDetail))}</span>` : ""}${costHTML(o.cost)}${o.detail && !o.label.replace(/[.\s]+$/, "").includes(o.detail.replace(/[.\s]+$/, "")) ? `<span class="option-detail">${esc(displayText(o.detail))}</span>` : ""}</span></span>${multi && o.multi ? "<small>" + (multiSelected.includes(o.card?.id) ? "✓" : "＋") + "</small>" : ""}</button>`;
        return (o.searchChoice || o.card && !o.card.hidden) ? `<div class="search-choice">${button}<button class="quiet" data-read-option="${o.index}" data-read-command="${esc(group.command)}" aria-label="Read ${esc(o.label)} before choosing">Read card</button>${o.installQuote?`<button class="quiet" data-install-options="${o.index}">Install options · replace / trash…</button>`:''}</div>` : button;
      })
      .join("");
    $("#decisions").innerHTML =
      head + (encounter && group.options.some(o=>o.subroutine) ? `<p class="target-instruction">${esc(state.phase.source || 'Ability')} → choose the subroutine below.${group.cancel ? ' Nothing spent yet; Cancel returns to your encounter options.' : ' Follow-up choices use the payment shown below.'}</p>` : '') +
      `<div class="actions">${options}</div>` +
      (multi
        ? `<p class="phase-hint" style="margin-top:14px">Select ${multi.optional ? "up to " : ""}${multi.max} cards · ${multiSelected.length} selected</p><button class="action-button primary-action" data-multi-confirm ${(multiSelected.length === 0 && !multi.optional) || (multiSelected.length !== multi.max && !multi.optional) ? "disabled" : ""}>Confirm selection</button>`
        : "") +
      (group.cancel && !drawer
        ? `<button class="quiet" data-cancel="${esc(group.command)}">Cancel</button>`
        : "");
  } else {
    $("#decisions").innerHTML =
      rootAbilityHTML(triggers, encounter && state.phase.identifier === 'Run 3.1') + '<div class="actions">' +
      commands
        .filter(c => c !== triggers && !(c.command==='rez' && c.options.every(o=>o.secondary)))
        .map(
          (c) => c.command==='rez' ? c.options.filter(o=>!o.secondary).map(o=>abilityButton(c,o)).join('') :
            `<button class="action-button ${c.command === primaryCommand ? "primary-action" : ""} ${["gain","draw"].includes(c.command) ? "basic-action" : ""}" data-related-cards="${esc([...new Set(c.options.flatMap(relatedCards))].join(' '))}" data-command="${esc(c.command)}" data-group><span>${esc(displayText(promoted?.kind==='install'&&c.command==='trash'?'Trash existing cards (optional)':singleActionLabel(c)))}${costHTML(c.cost)}${nextStep?.command===c.command?`<span class="option-detail">${esc(nextStep.detail)}</span>`:''}${c.options.length === 1 && c.options[0].card ? `<span class="option-detail">${esc(displayText(["install", "play", "rez", "advance"].includes(c.command) ? c.options[0].card.title || c.options[0].label : c.options[0].label))}</span>` : ""}</span><small>${c.options.length > 1 ? c.options.length + " choices ›" : "→"}</small></button>`,
        )
        .join("") +
      "</div>" + (!commands.length && drawer ? '<p class="run-no-actions">No additional ability choices in this window. Use the continuation below when ready.</p>' : '');
    const extraRez=commands.find(c=>c.command==='rez'&&c.options.some(o=>o.secondary));
    if(extraRez)$('#decisions').insertAdjacentHTML('beforeend',`<details class="more-abilities"><summary>Other paid abilities · rez cards</summary><p>You can also read a card on the board to rez it.</p>${extraRez.options.filter(o=>o.secondary).map(o=>abilityButton(extraRez,o)).join('')}</details>`);
  }
  if(promoted){
    $('#decisions').insertAdjacentHTML('afterbegin',`<section class="next-step ${promoted.kind==='install'?'next-install':''}" aria-label="Your next step"><span class="next-step-label">${promoted.kind==='install'?'INSTALLATION PENDING':'WAITING FOR YOU'}</span><p>${esc(promoted.detail)}</p><button class="action-button primary-action" data-command="${esc(promoted.command)}" data-option="${promoted.index}"><span>${esc(promoted.label)}${costHTML(promoted.cost)}</span><span aria-hidden="true">→</span></button></section>`);
  }
  if(planNotice)$('#decisions').insertAdjacentHTML('afterbegin',planNotice);

}
function planHTML(model){
 const t=model.tool, plan=activePlan;
 const paused=plan?.paused || ['unavailable','paused','invalid'].includes(model.status);
 const total=t?t.boostTotal+t.breakTotal:0;
 return `<section class="breaker-plan"><span class="eyebrow">${esc(t?.card.title || 'Breaker')}</span><h2>${paused?'Break paused':'Breaking the remaining subroutines…'}</h2><p class="plan-quote">${plural(plan?.spent || 0,'credit')} spent of the ${plural(plan?.ceiling || 0,'credit')} approved quote.</p>${paused?`<p class="plan-reason">${esc(plan?.reason || model.reason || 'Review the current encounter before continuing.')}</p><p>${plural(total,'credit')} currently quoted to finish.</p>${model.next?'<button class="action-button primary-action" data-plan-step>Continue break at this quote</button>':''}`:'<p>Stops if the cost changes or the Corp responds. Choose credit sources when asked.</p>'}${t?.card.number===30032?'<p class="plan-warning">Mayfly will be trashed at run end if it breaks a subroutine.</p>':''}<button class="quiet" data-plan-stop>Stop breaking · keep committed effects</button></section>`;
}
function paymentHTML(prefix=''){
 const group=state.decision.commands.find(c=>c.command==='pay');
 const sources=new Map();for(const o of group.options){const key=o.payment?.source || o.card?.title || o.label.replace(/^Pay \d+ credits? from /,'');if(!sources.has(key))sources.set(key,[]);sources.get(key).push(o)}
 return `<section class="credit-sources"><span class="eyebrow">SPEND IN-GAME CREDITS</span><h2>${state.phase.guide.remaining} credit${state.phase.guide.remaining===1?'':'s'} left to pay</h2><p>The effect resolves after the full cost is paid. Any amounts already spent remain paid.</p>${[...sources].map(([source,options],i)=>{const id=prefix+'credit-source-'+i,max=options.at(-1);return `<section class="credit-source"><label for="${id}">${esc(source)}<small>${max.payment?.available ?? 'Eligible'} credits available toward this payment</small></label><select id="${id}" aria-label="Credits from ${esc(source)}">${options.map(o=>`<option value="${o.index}" ${o===max?'selected':''}>${o.payment?.amount ?? o.label.match(/Pay (\d+)/)?.[1]}</option>`).join('')}</select><button class="action-button" data-pay-source="${id}">Confirm from ${esc(source)}</button></section>`}).join('')}${activePlan?'<button class="quiet" data-plan-stop>Stop queued plan · finish this committed payment manually</button>':''}</section>`;
}
function renderRunDrawer() {
  const model = runDrawerModel(state, busy);
  const running = !!model;
  $('#game').classList.toggle('run-active', running);
  $('#run-status').hidden = !running;
  $('.run-view-controls').hidden = !running;
  $('#run-footer').hidden = !running;
  $('#decision-context').tabIndex = running ? 0 : -1;
  $('#decision-actions').tabIndex = running ? 0 : -1;
  if (running !== wasRunning) {
    $('#decision-extras').open = !running;
    runPane = 'actions'; runSheetCollapsed = false; runDecisionVersion = null;
    wasRunning = running;
  }
  if (!model) { $('#run-footer').innerHTML = ''; return null; }
  // A newly offered decision is visible even if the player previously folded
  // the sheet away to inspect the board. Pure view changes never alter play.
  if (!busy && state.decision && runDecisionVersion !== state.version) {
    runPane = 'actions'; runSheetCollapsed = false; runDecisionVersion = state.version;
  }
  $('#game').classList.toggle('run-pane-ice', runPane === 'ice');
  $('#game').classList.toggle('run-sheet-collapsed', runSheetCollapsed);
  document.querySelectorAll('[data-run-pane]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.runPane === runPane)));
  $('#run-sheet-toggle').textContent = runSheetCollapsed ? 'Show decisions ↑' : 'Show board ↓';
  $('#run-sheet-toggle').setAttribute('aria-expanded', String(!runSheetCollapsed));
  $('#run-ice-tab').textContent = state.access ? 'Access details' : model.card && !model.card.hidden && model.card.subroutines?.length ? `Ice · ${model.remaining} unresolved` : 'Run details';
  const payer = state[state.side];
  const runFunds = state.side === 'runner' && state.runner.temporaryCredits ? ` · ${state.runner.temporaryCredits} bad pub` : '';
  const hosted = state.side === 'runner' ? (state.runner.resolving || []).filter(c => !c.hidden && c.counters?.credits).reduce((sum,c) => sum+c.counters.credits,0) : 0;
  $('#run-status').innerHTML = `<div class="run-destination"><strong>${esc(model.server)}</strong><span>${esc(model.stage)}</span></div><p class="run-budget">${payer.credits} pool${runFunds}${hosted ? ` · ${hosted} hosted` : ''} · ${plural(payer.clicks,'click')}<span>${esc(model.cardLabel)}</span></p>${(state.run.restrictions || []).map(r=>`<p class="run-status-restriction">${esc(restrictionText(r))}</p>`).join('')}`;
  $('#run-footer').innerHTML = `<div class="run-footer-controls">${model.controls.map(c => `<button class="action-button ${c.command==='jack'?'run-jack':model.stage==='Encounter'&&model.remaining>0?'run-pass-risk':'primary-action'}" data-command="${esc(c.command)}" data-option="${c.index}"><span>${esc(c.label)}${costHTML(c.cost)}<small>${esc(c.detail)}</small></span></button>`).join('')}${model.cancels.map(c=>`<button class="quiet" data-cancel="${esc(c.command)}">${esc(c.label)}</button>`).join('')}</div>${model.waiting ? `<p class="run-footer-note">${esc(model.waiting)}</p>` : ''}`;
  return model;
}
function runContextHTML(model) {
  const c = model.card;
  if (!c) return '<div class="run-empty-context"><span class="eyebrow">THE RUN CONTINUES</span><p>Follow the run window above. Cards will appear here when approached or accessed.</p></div>';
  // Accessed HQ/R&D cards may have no board element. Register the current
  // viewer-authorized DTO rather than relying on a hidden/absent board copy.
  cardsById.set(c.id,c);
  const visible = !c.hidden;
  const subtitle = visible ? [c.subTypes?.join(' · ') || c.type, c.strength !== null && c.strength !== undefined ? `STR ${c.strength}` : null].filter(Boolean).join(' · ') : 'Identity concealed';
  return `<span class="run-context-label">${esc(model.contextLabel)}</span><button class="run-card-summary" ${visible?'':'disabled'} data-inspect-tool="${esc(c.id)}" data-related-cards="${esc(c.id)}" aria-label="Read ${esc(visible?c.title:'unrevealed card')}">${visible ? `<img src="/assets/cards-display/${c.number}-300.webp" alt="">` : '<span class="run-card-back" aria-hidden="true">?</span>'}<span><strong>${esc(visible?c.title:'Unrevealed card')}</strong><small>${esc(subtitle)}</small><span class="run-read-card">${visible?'Read full card ↗':'Card is unrevealed'}</span></span></button>${visible && !state.access && c.subroutines?.length ? `<h2 class="run-threat-heading">${model.remaining} unresolved <span>of ${c.subroutines.length}</span></h2><ol class="subroutines" aria-label="Ice subroutines">${c.subroutines.map((s,i)=>`<li data-subroutine-number="${i+1}" class="${s.broken?'broken':s.fired?'fired':''}"><span class="subroutine-number">${i+1}</span><span class="subroutine-copy">${esc(s.text)}<small>${s.broken?'✓ Broken':s.fired?'Fired':'Unbroken'}</small></span></li>`).join('')}</ol>` : ''}${visible && state.access ? '<p class="run-context-note">Read the card for its full text. Access choices and costs are shown alongside.</p>' : ''}`;
}
function abilityButton(group, option) {
  return `<button class="action-button ability-action" data-source-id="${esc(option.card?.id || option.sourceId || '')}" data-ability-kind="${esc(option.abilityKind || '')}" data-command="${esc(group.command)}" data-option="${option.index}" data-related-cards="${esc(relatedCards(option).join(' '))}"><span>${esc((group.command==='rez'?'Rez ':'')+displayText(option.label))}${costHTML(option.cost)}</span><span aria-hidden="true">→</span></button>`;
}
function rootAbilityHTML(group, encounter) {
  const options = group?.options || [];
  const tools = encounter ? state.run.tools || [] : [];
  if (!options.length && !tools.length && !encounter && !Object.values(state.runner.rig).flat().some(c=>c.availability)) return '';
  const consumed = new Set();
  const rows = tools.map(tool => {
    const model = encounterTool(tool);
    if (!model) return '';
    const actions = options.filter(o=>o.card?.id === tool.card.id);
    actions.forEach(o=>consumed.add(o.index));
    return `<section class="encounter-tool ${model.tone}" data-related-cards="${esc(tool.card.id)}"><button class="tool-card" data-inspect-tool="${esc(tool.card.id)}" aria-label="Read ${esc(tool.card.title)}"><img src="/assets/cards-display/${tool.card.number}-300.webp" alt=""><span><strong>${esc(tool.card.title)}</strong><small>${esc(model.status)}</small></span></button><p>${esc(model.detail)}</p>${tool.kind==='breaker'?`<p id="tool-reason-${esc(tool.card.id)}" class="tool-availability">${tool.unbroken&&tool.matches ? tool.availableCredits<tool.boostTotal+tool.breakTotal?`Full break needs ${tool.boostTotal+tool.breakTotal} credits; ${tool.availableCredits} eligible credits available.`:'' : !tool.unbroken?'No unresolved subroutines remain. Legal paid abilities are in More abilities.':'Wrong ice type for this breaker.'}</p><button class="action-button primary-action" data-plan-review="${esc(tool.card.id)}" ${busy||!tool.enabled||!tool.matches||!tool.unbroken||tool.availableCredits<tool.boostTotal+tool.breakTotal?'disabled':''} aria-describedby="tool-reason-${esc(tool.card.id)}">Break all · ${tool.boostTotal+tool.breakTotal} credits</button>`:''}${actions.filter(o=>!secondaryAbility(o,state)).map(o=>abilityButton(group,o)).join('')}</section>`;
  }).join('');
  const other = options.filter(o=>!consumed.has(o.index));
  const bioroid = encounter && state.run.card?.subTypes?.includes('Bioroid');
  const guidance = encounter ? `${!tools.some(t=>t.kind === 'breaker' && t.matches) ? '<p class="encounter-warning">No installed icebreaker matches this ice. Other abilities may still help.</p>' : ''}${bioroid ? `<p class="bioroid-tip">Bioroid: spend 1 click to break 1 subroutine, regardless of type or strength.${!state.runner.clicks ? ' No clicks remain.' : ''}</p>` : ''}<p class="encounter-footnote">Only available actions have buttons. Unbroken subroutines fire in order when both players pass. Jacking out is available after the encounter.</p>` : '';
  return `<section class="encounter-options" aria-label="${encounter ? 'Encounter options' : 'Card abilities'}"><h2>${encounter ? 'Your encounter options' : 'Card abilities'}</h2>${rows}${!encounter&&state.side==='runner'?Object.values(state.runner.rig).flat().filter(c=>c.availability&&!options.some(o=>o.card?.id===c.id)).map(c=>`<section class="unavailable-ability"><button class="quiet" data-inspect-tool="${esc(c.id)}">${esc(c.title)} · Read card</button><p>${esc(c.availability)}</p><button disabled aria-describedby="unavailable-${esc(c.id)}">Use ability</button><span id="unavailable-${esc(c.id)}" class="sr-only">${esc(c.availability)}</span></section>`).join(''):''}${other.filter(o=>!secondaryAbility(o,state)).map(o=>abilityButton(group,o)).join('')}${options.some(o=>secondaryAbility(o,state))?`<details class="more-abilities" ${manualExpanded?'open':''}><summary>Other paid abilities · all legal choices</summary><p>These abilities remain legal. Read their cards and check the cost before using them.</p>${options.filter(o=>secondaryAbility(o,state)).map(o=>abilityButton(group,o)).join('')}</details>`:''}${guidance ? `<details class="run-guidance"><summary>Encounter guidance</summary>${guidance}</details>` : ''}</section>`;
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
      renderDecisions(true);
    } else toast("This card is facedown. Its identity is hidden.");
    return;
  }
  const d = DATA[card.number];
  if (!d) return;
  inspectedCard = card;
  gameHelper?.setSelected(card);
  if (opponentCurrent) {
    opponentPaused = true; clearTimeout(opponentTimer); opponentTimer = null;
    renderPlayback();
  }
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
    `<div class="inspect-layout"><img class="inspect-image" src="/assets/cards-display/${card.number}-743.webp" data-fallback="${card.number}" alt="${esc(d.title)} card"><div class="inspect-copy">${state?.installation || installTransaction && state?.phase.guide?.kind==='credit-payment'?`<aside class="pending-install-notice"><p>Finish installing ${esc(state.installation?.card.title || installTransaction.title)} before playing another card.</p><button class="action-button primary-action" data-finish-install>Return to installation →</button></aside>`:''}<span class="eyebrow">${esc(d.faction_code.replaceAll("-", " ")).toUpperCase()}</span><h2>${esc(d.title)}</h2><p class="inspect-type">${esc(d.type_code.toUpperCase())}${d.keywords ? " · " + esc(d.keywords) : ""}${d.uniqueness ? " · UNIQUE" : ""}</p>${stats ? `<div class="inspect-stats">${stats}</div>` : ""}${
      counterEntries(card).length
        ? `<div class="inspect-counters">${counterMarkup(card)}<p class="inspect-type">${counterEntries(card)
            .map(([k, v]) => counterLabel(k, v))
            .join(" · ")}</p></div>`
        : ""
    }<p class="card-text">${esc(d.stripped_text || d.text)
      .replaceAll("[credit]", "¢")
      .replaceAll(
        "[click]",
        "⏱",
      )}</p>${d.flavor ? `<p class="card-flavor">${esc(d.flavor.replace(/<[^>]*>/g, ""))}</p>` : ""}<p class="artist">Art by ${esc(d.artist || d.illustrator)} · System Gateway #${d.position}</p>${card.hosted?.length ? `<h3>Hosted cards</h3><div>${card.hosted.map((c) => cardHTML(c)).join("")}</div>` : ""}<div class="inspect-actions">${actions.map((a) => `<button class="action-button primary-action" data-inspect-command="${esc(a.command)}" data-option="${a.index}"><span class="inspect-action-copy"><strong>${esc(a.group.label)}${a.option.server ? ` → ${esc(displayText(a.option.server))}` : a.option.hostLabel ? ` → ${esc(displayText(a.option.hostLabel))}` : ""}</strong>${costHTML(a.option.cost || a.group.cost)}${a.option.detail ? `<span class="option-detail">${esc(a.option.detail)}</span>` : ""}</span><span aria-hidden="true">→</span></button>`).join("")}</div></div></div>`;
  const virus = virusStatus(card);
  const rezHint=corpIceRezHint(card,state);
  if(rezHint){
    const note=document.createElement('p');note.className='target-instruction rez-availability';note.textContent=rezHint;
    $('#inspect-content .inspect-actions').before(note);
  }
  if (actions.length) {
    const note=document.createElement('p'); note.className='action-link-hint';
    note.textContent='These are the same actions available in the action panel.';
    $('#inspect-content .inspect-actions').before(note);
    [...$('#inspect-content .inspect-actions').children].forEach((button,i)=>{
      button.dataset.relatedCards=relatedCards(actions[i].option).join(' ');
      if (actions[i].command === 'trigger' || actions[i].option.subroutine || actions[i].option.searchChoice)
        button.querySelector('strong').textContent=(actions[i].option.searchChoice ? 'Choose ' : '')+displayText(actions[i].option.label);
      if (actions[i].option.detail && actions[i].option.label.includes(actions[i].option.detail))
        button.querySelector('.option-detail')?.remove();
      if(actions[i].option.installQuote)button.insertAdjacentHTML('afterend',`<button class="quiet" data-install-options="${actions[i].index}">Install options${actions[i].option.server?' · '+esc(displayText(actions[i].option.server)):''} · replace or trash cards…</button>`);
    });
  }
  if (virus.description || card.installed && card.subTypes?.includes('Virus')) {
    const note=document.createElement('p'); note.className='virus-explanation';
    note.textContent=virus.description || `${plural(card.counters?.virus || 0,'virus counter')} on ${card.title}. Counters are stored on this program; spending them activates its printed ability.`;
    $('#inspect-content .inspect-copy').append(note);
  }
  $('#inspect-content .inspect-copy').insertAdjacentHTML('beforeend','<button class="quiet ask-about-card" data-ask-inspected>Ask helper about this card →</button>');
  $("#inspect-dialog").setAttribute("aria-label", d.title + " card details");
  $("#inspect-dialog").showModal();
}
function renderInstallation() {
  const installation=state?.installation;
  const payment=installTransaction && state.phase.guide?.kind==='credit-payment';
  if(!installation && !payment){$('#install-dialog').close();return;}
  const card=installation?.card || installTransaction;
  const finish=state.decision?.commands.find(c=>c.command==='n');
  const trash=state.decision?.commands.find(c=>c.command==='trash');
  const commit=finish?`<button class="action-button primary-action" data-command="n" data-option="${finish.options[0].index}">Install ${esc(card.title)}${costHTML(finish.options[0].cost || finish.cost)}</button>`:'';
  const replacements=trash?`<details class="install-replacements" ${!finish||installTransaction?.replace?'open':''}><summary>Replace / trash installed cards</summary>${trash.options.map(o=>`<div class="search-choice"><button class="action-button" data-command="trash" data-option="${o.index}">Trash ${esc(displayText(o.label))}</button><button class="quiet" data-inspect-tool="${esc(o.card.id)}">Read card</button></div>`).join('')}</details>${trash.cancel?'<button class="quiet" data-cancel="trash">Cancel installation</button>':''}`:'';
  const controls=payment?paymentHTML('install-'):`<p>${finish?'Keep existing cards and install at the cost below, or choose a card to trash first.':'Choose cards to trash before this installation can finish. The quote updates after each choice.'}</p>${commit}${replacements}`;
  $('#install-content').innerHTML=`<span class="eyebrow">INSTALLATION</span><h2>${esc(card.title)}</h2><p>${esc(displayText(installation?.destination || 'Pay installation cost'))}</p>${controls}`;
  closeDialogs();$('#install-dialog').showModal();
}
function nextPlannedChoice(model) {
  if(!activePlan || activePlan.paused || !model?.next || !['ready','target','finish'].includes(model.status))return null;
  const cost=model.status==='ready' && model.next.abilityKind==='break'?0:model.cost || 0;
  const remaining=activePlan.ceiling-activePlan.spent;
  if(cost>remaining || model.status==='ready' && model.total>remaining){
    activePlan.paused=true;activePlan.reason='The remaining cost changed. Review the new quote to continue.';return null;
  }
  return model.next;
}
function accountPlanSpending(next) {
  if(!activePlan)return;
  const count=next.historyCount-activePlan.lastHistoryCount;
  if(count<=0)return;
  // A boost can resolve in a forced continuation after the immediate resource
  // message. Count the native payment log at both authoritative snapshots;
  // balance deltas alone can miss that debit or mistake a loss for spending.
  const spent=next.history.slice(-count).reduce((sum,e)=>{
    const match=e.text.match(/^Runner spent (\d+) credits?(?: from .+)?$/);
    return sum+(match?Number(match[1]):0);
  },0);
  activePlan.lastHistoryCount=next.historyCount;
  activePlan.spent+=spent;activePlan.totalSpent+=spent;
}
function completeBreakerPlan() {
  const plan=activePlan;
  lastReceipt={label:`${plan.cardName} · All subroutines broken`,changes:resourceChanges(plan.before,state).filter(c=>c.side==='runner'&&['credits','temporaryCredits'].includes(c.key)),
    detail:`Spent ${plural(plan.totalSpent,'credit')} during this break. Continue the run or jack out at the next movement window.`};
  activePlan=null;
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
    width = Math.min(330, Math.max(280, INSPECTION_PIXELS / (window.devicePixelRatio || 1)), window.innerHeight * 0.55),
    height = width * 1029 / INSPECTION_PIXELS + 58;
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
  preview.innerHTML = `<img src="/assets/cards-display/${card.number}-743.webp" data-fallback="${card.number}" alt="${esc(card.title)}"><div class="preview-caption"><b>${esc(card.title)}</b>${card.installed && card.strength !== null && card.strength !== undefined ? "Current strength " + card.strength + " · " : ""}Click to pin & read</div>`;
  preview.hidden = false;
}
function hideHover() {
  clearTimeout(hoverTimer);
  $("#hover-preview").hidden = true;
}
function lobby() {
  deferredAutomatic=null;activePlan=null;installTransaction=null;automaticReceiptBefore=null;
  stopOpponentPlayback(true);
  worker?.terminate();
  worker = null;
  clearTimeout(watchdog);
  clearTimeout(presentationTimer);
  closeDialogs();
  hideHover();
  $("#game").hidden = true;
  $("#lobby").hidden = false;
  $("#resume-button").hidden = !readSave();
  const saved = readSave();
  $('#resume-context').hidden = !saved;
  $('#resume-context').textContent = resumeSummary(saved);
  $("#session-label").textContent = "SYSTEM GATEWAY";
}
function showZone(zone) {
  const [side, type] = zone.split('-');
  const player = state[side];
  const cards = type === 'hand' ? player.hand : type === 'score' ? player.score : player.discard;
  const owner = side === 'corp' ? 'Corporation' : 'Runner';
  const title = type === 'score' ? `${owner} score area` : type === 'hand' ? 'HQ' : side === 'corp' ? 'Archives' : 'Heap';
  $('#deck-dialog').classList.add('pile-view');
  $('#deck-dialog').style.setProperty('--pile-count', Math.min(4, Math.max(1, cards.length)));
  $('#library-eyebrow').textContent = `${owner.toUpperCase()} · ${type === 'score' ? 'SCORED AGENDAS' : type === 'hand' ? 'HAND' : 'DISCARD PILE'}`;
  $('#deck-dialog h2').textContent = title;
  $('#deck-dialog>p').hidden = false;
  $('#deck-dialog>p').textContent = `${type === 'score' ? plural(player.points, 'agenda point') + ' · ' : ''}${plural(cards.length, 'card')}`;
  $('#deck-content').innerHTML = cards.length
    ? `<div class="pile-grid">${cards.map(card => `<div class="pile-item">${cardHTML(card)}${!card.hidden && type === 'score' && DATA[card.number]?.agenda_points !== undefined ? `<span class="pile-agenda-points">${plural(DATA[card.number].agenda_points, 'agenda point')}</span>` : ''}</div>`).join('')}</div>`
    : `<div class="empty-pile"><span aria-hidden="true">◇</span><h3>${type === 'score' ? 'No scored agendas yet' : 'This pile is empty'}</h3><p>${type === 'score' ? side === 'corp' ? 'Advance and score agendas to build your total.' : 'Steal agendas during runs to build your total.' : 'Cards will appear here as the game progresses.'}</p></div>`;
  $('#deck-dialog').showModal();
}

function deckStats(deck) {
  const identity = DATA[deck.identity];
  return deck.cards.reduce((stats,[number,count])=>{
    const card=DATA[number];stats.size+=count;
    stats.influence+=(card.faction_code === identity.faction_code ? 0 : card.faction_cost || 0)*count;
    stats.points+=(card.agenda_points || 0)*count;return stats;
  },{size:0,influence:0,points:0});
}
function renderCharacterPicker() {
  const opposite=role === 'runner' ? 'corp' : 'runner';
  $('#your-character-label').textContent=role === 'runner' ? 'Your Runner' : 'Your Corporation';
  $('#opponent-character-label').textContent=opposite === 'runner' ? 'AI Runner' : 'AI Corporation';
  for (const [prefix,side] of [['your',role],['opponent',opposite]]) {
    const select=$(`#${prefix}-character`);
    select.innerHTML=DECKS.catalog.filter(d=>d.side === side).map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('');
    select.value=selectedDeckIds[side];
    const deck=DECKS.resolve(selectedDeckIds)[side],stats=deckStats(deck);
    $(`#${prefix}-character-summary`).innerHTML=`<button class="character-portrait" data-library="${deck.identity}" aria-label="Read ${esc(deck.name)} identity"><img src="/assets/cards-display/${deck.identity}-300.webp" alt=""></button><div><span class="character-faction">${esc(deck.faction)} · ${stats.size} cards</span><h2>${esc(deck.style)}</h2><p>${esc(deck.description)}</p><button class="quiet character-ability" data-library="${deck.identity}">Read identity ability →</button></div>`;
  }
  $('.hero-card.front img').src=`/assets/cards-display/${DECKS.resolve(selectedDeckIds).runner.identity}-600.webp`;
  $('.hero-card.back img').src=`/assets/cards-display/${DECKS.resolve(selectedDeckIds).corp.identity}-600.webp`;
}
function viewDecks() {
  closeDialogs();
  if (opponentCurrent) {
    opponentPaused=true;clearTimeout(opponentTimer);opponentTimer=null;renderPlayback();
  }
  const decks=DECKS.resolve($('#game').hidden ? selectedDeckIds : session?.config.deckIds);
  $('#deck-dialog').classList.remove('pile-view');
  $('#library-eyebrow').textContent = 'SYSTEM GATEWAY · SELECTED MATCHUP';
  $('#deck-dialog>p').textContent = 'Ready-to-play decks for this matchup. Inspect any card to read its full text.';
  $('#deck-dialog h2').textContent = 'Your loadout';
  $('#deck-dialog>p').hidden = false;
  $('#deck-content').innerHTML = '<div class="deck-columns">'+Object.values(decks).map(d=>{
    const stats=deckStats(d);
    return `<section><h3 class="deck-title">${esc(d.name)}</h3><p class="phase-hint">${stats.size} cards · ${stats.influence} / ${DATA[d.identity].influence_limit} influence${stats.points ? ` · ${stats.points} agenda points` : ''}</p><div class="deck-list">${[[d.identity,1],...d.cards].map(([n,count])=>`<button class="deck-row" data-library="${n}"><img src="/assets/cards-display/${n}-300.webp" alt=""><strong>${esc(DATA[n].title)}</strong><small>${DATA[n].type_code}</small><b>×${count}</b></button>`).join('')}</div></section>`;
  }).join('')+'</div>';
  $('#deck-dialog').showModal();
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("button,[data-zone]");
  if (!el) return;
  if(el.dataset?.planReview){
    if(busy)return;const id=el.dataset.planReview,tool=state.run?.tools.find(t=>t.card.id===id);
    if(!tool || !tool.matches || !tool.enabled || tool.availableCredits<tool.boostTotal+tool.breakTotal)return;
    activePlan={cardId:id,cardName:tool.card.title,before:state,lastHistoryCount:state.historyCount,iceId:state.run.card.id,originVersion:state.version,ceiling:tool.boostTotal+tool.breakTotal,spent:0,totalSpent:0,paused:false};
    const step=breakerPlan(state,id);
    const next=nextPlannedChoice(step);
    if(next){choose(next.command,next.index);return;}
    rememberActionFocus();renderDecisions();return;
  }
  if(el.hasAttribute('data-plan-stop')){
    activePlan=null;selectedCommand=null;manualExpanded=true;
    lastReceipt={label:'Breaker plan stopped',cancel:true,changes:[],detail:'No further ability is queued. Earlier payments remain spent. Current response priority is unchanged.'};
    const cancel=!busy&&state.decision?.commands.find(c=>c.cancel);
    if(cancel){choose(cancel.command,0,undefined,true);return;}
    if(abilityOrigin)focusIntent={...abilityOrigin};else focusIntent={};renderActionReceipt();renderDecisions();return;
  }
  if(el.hasAttribute('data-plan-step')){
    if(busy||!activePlan)return;const model=breakerPlan(state,activePlan.cardId);
    if(!model.next||!['ready','target','finish'].includes(model.status))return;
    activePlan.paused=false;activePlan.reason=null;activePlan.spent=0;activePlan.ceiling=model.tool.boostTotal+model.tool.breakTotal;
    choose(model.next.command,model.next.index);return;
  }
  if(el.hasAttribute('data-install-options')){installReplaceIntent=true;choose('install',Number(el.dataset.installOptions));return;}
  if(el.hasAttribute('data-finish-install')){renderInstallation();return;}
  if(el.hasAttribute('data-pay-source')){
    const select=document.getElementById(el.dataset.paySource);if(!select)return;
    choose('pay',Number(select.value));return;
  }
  if (el.hasAttribute('data-recover-replay')) {
    if (!replayRecovery || !session) return;
    const {config,choices}=session, prefix=choices.slice(0,replayRecovery.choices);
    $('#export-button').onclick();
    start(config,prefix);
    return;
  }
  if (el.hasAttribute('data-ask-inspected')) { closeDialogs(); gameHelper.open(inspectedCard); return; }
  if (el.hasAttribute('data-playback-card')) {
    if (!opponentCurrent?.card) return;
    inspect(opponentCurrent.card); return;
  }
  if (el.hasAttribute('data-opponent-pause')) {
    opponentPaused = !opponentPaused;
    clearTimeout(opponentTimer); opponentTimer = null;
    if (!opponentPaused) opponentTimer = setTimeout(nextOpponentBeat, OPPONENT_PACE);
    renderPlayback(); return;
  }
  if (el.hasAttribute('data-opponent-next')) { nextOpponentBeat(); return; }
  if (el.hasAttribute('data-opponent-skip')) {
    if (opponentFinal) finishOpponentPlayback();
    else { stopOpponentPlayback(); opponentSkipped = true; render(); }
    return;
  }
  if (el.hasAttribute('data-replay-opponent')) {
    if (busy || !opponentArchive.length) return;
    const current = state, receipt = lastResourceChange;
    stopOpponentPlayback(); closeDialogs();
    opponentReplaying = true; opponentQueue = [...opponentArchive];
    opponentFinal = () => {
      previousState = null; state = current; lastResourceChange = receipt;
      actionResourceChange = null; pendingActionLabel = null;
      busy = !state.decision && !state.terminal; render();
    };
    nextOpponentBeat(); return;
  }
  if (el.hasAttribute('data-review-opponent')) {
    activityView = 'opponent'; renderActivity();
    $('#decision-extras').open = true;
    $('#recent-log').scrollIntoView({block:'nearest'});
    $('.activity-entries').focus({preventScroll:true});
    return;
  }
  if (el.dataset.activityView) { activityView = el.dataset.activityView; renderActivity(); return; }
  // A rapid second click can land on a different action after an AI response
  // or a forced window replaces the button. Require a distinct activation.
  if (e.detail > 1 && el.closest('#decisions, #run-footer, .inspect-actions')) { e.preventDefault(); return; }
  if (el.dataset.runPane) {
    runPane = el.dataset.runPane; runSheetCollapsed = false; renderRunDrawer();
    return;
  }
  if (el.hasAttribute('data-run-sheet')) {
    runSheetCollapsed = !runSheetCollapsed; renderRunDrawer(); return;
  }
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
  if (el.dataset.inspectTool) {
    const card = cardsById.get(el.dataset.inspectTool);
    if (card) inspect(card);
    return;
  }
  if (el.hasAttribute('data-read-option')) {
    const option=state?.decision?.commands.find(c=>c.command===el.dataset.readCommand)?.options.find(o=>o.index===Number(el.dataset.readOption));
    if(option?.card && !option.card.hidden)inspect(option.card);
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
    multiSelected = [];if(abilityOrigin)focusIntent={...abilityOrigin};
    renderDecisions(true);
    return;
  }
  if (el.hasAttribute("data-lobby")) {
    lobby();
    return;
  }
  if (el.dataset.cancel) {
    activePlan=null;
    if(abilityOrigin)focusIntent={...abilityOrigin};
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
      renderDecisions(true);
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
        renderDecisions(true);
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
function linkActions(target) {
  const source = target?.closest?.('button,[data-card]') || target?.closest?.('[data-related-cards]');
  const data=source?.dataset || {};
  const command=data.command || data.inspectCommand || data.readCommand;
  const group=state?.decision?.commands.find(c=>c.command===command);
  const index=data.option ?? data.readOption;
  const option=index!==undefined ? group?.options.find(o=>o.index===Number(index)) : group?.options.length===1 ? group.options[0] : null;
  const context=source?.closest('[data-related-cards]');
  // A choice points at its target, rather than every other choice that shares
  // its ability source. A category menu has no selected target yet.
  const ids=group?.options.length>1 && data.group!==undefined ? [] : option
    ? [option.targetId || option.hostId || option.card?.id || option.sourceId].filter(Boolean)
    : data.card ? [data.card] : data.inspectTool ? [data.inspectTool]
    : (context?.dataset.relatedCards || '').split(' ').filter(Boolean);
  const subroutine = source?.dataset.targetSubroutine;
  document.querySelectorAll('[data-subroutine-number]').forEach(el=>el.classList.toggle('subroutine-related',!!subroutine && el.dataset.subroutineNumber === subroutine));
  document.querySelectorAll('[data-card],[data-related-cards]').forEach(el=>{
    el.classList.toggle('action-related',el===source || !!el.dataset.card && ids.includes(el.dataset.card));
  });
  // Controls such as Read card and Break all can inherit their card context
  // without putting a shared outline on their sibling controls or container.
  document.querySelectorAll('button.action-related').forEach(el=>{
    if(el!==source && !el.dataset.card)el.classList.remove('action-related');
  });
  source?.classList.toggle('action-related',!!source.closest('#game,#inspect-dialog,#install-dialog'));
}
document.addEventListener('pointerover', e=>linkActions(e.target));
document.addEventListener('pointerout', e=>linkActions(e.relatedTarget));
document.addEventListener('focusin', e=>linkActions(e.target));
document.addEventListener('focusout', e=>linkActions(e.relatedTarget));
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
      e.target.src = "/assets/cards-hires/" + e.target.dataset.fallback + ".png";
      e.target.removeAttribute("data-fallback");
    }
  },
  true,
);
document.querySelectorAll("[data-side]").forEach((btn) =>
  btn.addEventListener("click", () => {
    role = btn.dataset.side;
    renderCharacterPicker();
    document
      .querySelectorAll("[data-side]")
      .forEach((b) => { b.classList.toggle("active", b === btn); b.setAttribute("aria-pressed", b === btn); });
  }),
);
$("#start-button").onclick = () =>
  start({ side: role, seed: crypto.randomUUID(), deckIds:{...selectedDeckIds}, rulesVersion:'26.03-local-2' });
$('#your-character').onchange = e => {selectedDeckIds[role]=e.target.value;renderCharacterPicker();};
$('#opponent-character').onchange = e => {selectedDeckIds[role === 'runner' ? 'corp' : 'runner']=e.target.value;renderCharacterPicker();};
renderCharacterPicker();
$("#resume-button").onclick = () => {
  try {
    const s = validateReplay(readSave());
    start(s.config, s.choices, s.conceded);
  } catch (e) {
    toast(e.message);
  }
};
$("#deck-button").onclick = viewDecks;
$('#matchup-decks-button').onclick = viewDecks;
$("#menu-button").onclick = () => {
  $("#new-button").hidden = $("#game").hidden;
  $("#undo-button").disabled = !session?.choices.length;
  $("#concede-button").disabled = $("#game").hidden || busy || !state || !!state.terminal;
  $("#export-button").disabled = !session;
  $("#menu-dialog").showModal();
};
$('#help-button').onclick = () => {
  if (!$('#token-legend')) {
    const legend=document.createElement('div'); legend.id='token-legend'; legend.className='token-legend';
    legend.innerHTML = `<div>${clickMarkup({side:'corp',clicks:2})}<span>Bright: available<br>Dark: spent</span></div><div>${counterMarkup({id:'legend-credit',counters:{credits:6}})}<span>Credits on a card</span></div><div>${counterMarkup({id:'legend-advance',counters:{advancement:2}})}<span>Advancement</span></div><div>${counterMarkup({id:'legend-virus',counters:{virus:1}})}<span>Virus counters</span></div>`;
    const heading=[...$('#help-dialog').querySelectorAll('h3')].find(el=>el.textContent==='Tokens and counters');
    heading.after(legend);
  }
  $('#help-dialog').showModal();
};
$("#log-button").onclick = () => {
  $("#full-log").innerHTML =
    state?.history
      .map(
        (e) =>
          `<div class="log-entry"><small>TURN ${Math.ceil(e.turn / 2)} · ${(e.actor || e.side).toUpperCase()}</small>${esc(displayText(e.text))}${activityExplanation(e) ? `<span class="activity-cause">${esc(displayText(activityExplanation(e)))}</span>` : ''}</div>`,
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
$("#paste-replay-button").onclick = () => {
  closeDialogs();
  $("#replay-text").value = "";
  $("#replay-error").hidden = true;
  $("#paste-replay-dialog").showModal();
  $("#replay-text").focus();
};
$("#paste-replay-import").onclick = () => {
  try {
    const text = $("#replay-text").value;
    if (text.length > 2000000) throw Error("Replay is too large.");
    const replay = validateReplay(JSON.parse(text));
    closeDialogs();
    start(replay.config, replay.choices, replay.conceded);
  } catch (error) {
    $("#replay-error").textContent = error.message;
    $("#replay-error").hidden = false;
  }
};

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
  const saved = readSave();
  $('#resume-context').hidden = !saved;
  $('#resume-context').textContent = resumeSummary(saved);
gameHelper = mountHelper({
  getContext:selectedCard=>helperContext($('#game').hidden ? null : state,{selectedCard,watching:!!opponentCurrent,replay:opponentReplaying,resolving:busy,
    playback:opponentCurrent ? {caption:opponentCurrent.caption,detail:opponentCurrent.detail} : null}),
  onOpen:()=>{if(opponentCurrent){opponentPaused=true;clearTimeout(opponentTimer);opponentTimer=null;renderPlayback();}},
  onCard:card=>inspect(card),
});
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
    const angle = Math.max(-2.5, Math.min(2.5, (i - (cards.length - 1) / 2) * 0.8));
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

$('#skip-boost-windows').checked=skipBoostWindows;
$('#skip-boost-windows').addEventListener('change',e=>{skipBoostWindows=e.target.checked;skipPreferenceVersion=state?.version;try{localStorage.setItem('netrunner-skip-boost-windows',String(skipBoostWindows))}catch{}toast(skipBoostWindows?'Future boost-only windows will be passed.':'Boost-only windows will stop for your input.');});
$('#hold-priority').addEventListener('change',e=>{holdPriority=e.target.checked;skipPreferenceVersion=state?.version;toast(holdPriority?'Holding priority at every paid-ability window.':'Routine timing resumes after this decision.');});
$('#streamline-timing').checked=streamlineTiming;
$('#streamline-timing').addEventListener('change',e=>{streamlineTiming=e.target.checked;skipPreferenceVersion=state?.version;try{localStorage.setItem('netrunner-streamline-timing',String(streamlineTiming))}catch{}});
$('#teaching-pauses').checked=teachingPauses;
$('#teaching-pauses').addEventListener('change',e=>{teachingPauses=e.target.checked;try{localStorage.setItem('netrunner-teaching-pauses',String(teachingPauses))}catch{}});

// Reading a card or opening the menu must not be interrupted by assistance.
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>{
  if(deferredAutomatic)setTimeout(()=>deferredAutomatic?.(),0);
});
