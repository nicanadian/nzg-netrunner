importScripts(
  "shims.js",
  "../vendor/chiriboga/seedrandom.min.js",
  "../vendor/chiriboga/init.js",
  "../vendor/chiriboga/phase.js",
  "../vendor/chiriboga/command.js",
  "../vendor/chiriboga/checks.js",
  "../vendor/chiriboga/mechanics.js",
  "../vendor/chiriboga/utility.js",
  "../vendor/chiriboga/sets/systemgateway.js",
  "../vendor/chiriboga/decks.js",
  "../vendor/chiriboga/runcalculator.js",
  "../vendor/chiriboga/ai_corp.js",
  "../vendor/chiriboga/ai_runner.js",
  "deck-catalog.js",
  "adapter.js",
);
let busy = false;
async function advanceToDecision(observe = null) {
  let state = await NR.advance(300, observe);
  while (!state.terminal && (NR.needsAdvance() || !state.decision)) state = await NR.advance(300, observe);
  return state;
}
onmessage = async ({ data }) => {
  if (busy) return;
  busy = true;
  let restoredChoices = 0;
  let choiceAccepted = false;
  try {
    // Restoration stays immediate. Live choices stream public observations;
    // these never accept input or change the AI's decisions.
    const observe = data.type === "choose" ? (before, after) => {
      const forcedEncounter=before.side==='runner' && before.active==='runner' && before.phase.identifier==='Run 3.1' &&
        (after.phase.identifier!=='Run 3.1' || after.active!=='runner') && before.run?.encountering && !before.run.card?.hidden &&
        before.decision?.commands.length===1 && before.decision.commands[0].command==='n';
      if (forcedEncounter) {postMessage({type:'opponent-step',before,state:after});return;}
      const passedUnrezzed=before.side==='corp' && after.side==='corp' && before.active==='corp' && before.phase.identifier==='Run 2.1' &&
        after.phase.identifier!=='Run 2.1' && before.run?.card && !before.run.card.hidden && !before.run.card.rezzed &&
        after.historyCount>before.historyCount && after.history.slice(-(after.historyCount-before.historyCount)).some(e=>e.text==='Corp did not rez ice');
      if(passedUnrezzed){postMessage({type:'opponent-step',before,state:after});return;}
      if (after.historyCount === before.historyCount) return;
      const opponent = before.side === "corp" ? "runner" : "corp";
      const entries = after.history.slice(-(after.historyCount - before.historyCount));
      if (entries.some(entry => (entry.actor || entry.side) === opponent))
        postMessage({type: "opponent-step", before, state: after});
    } : null;
    if (data.type === "start") {
      NR.boot(data.config);
      await advanceToDecision();
      for (const choice of data.replay || []) {
        NR.choose(choice);
        await advanceToDecision();
        restoredChoices++;
      }
      if (data.conceded)
        PlayerWin(
          viewingPlayer === runner ? corp : runner,
          "You conceded the game.",
        );
    } else if (data.type === "choose") {
      NR.choose(data.choice);
      choiceAccepted = true;
      // Show the resolved human payment before automatic windows / AI turns.
      // This is a public snapshot; it never enables a second decision.
      postMessage({ type: "resources", state: NR.snapshot() });
    }
    else if (data.type === "concede") {
      PlayerWin(
        viewingPlayer === runner ? corp : runner,
        "You conceded the game.",
      );
    }
    const state = await advanceToDecision(observe);
    postMessage({ type: "state", state });
  } catch (error) {
    postMessage({ type: "error", message: error.message, stack: error.stack,
      ...(choiceAccepted ? {accepted:true} : {}),
      ...(data.type === 'start' && data.replay?.length ? {recovery:{choices:restoredChoices,total:data.replay.length}} : {}) });
  } finally {
    busy = false;
  }
};
