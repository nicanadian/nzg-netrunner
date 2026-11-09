"use strict";
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { makeGame, checkState, checkSnapshot } = require("./engine-smoke.cjs");
(async () => {
  for (const side of ["runner", "corp"]) {
    const replay = JSON.parse(
      fs.readFileSync(`${__dirname}/fixtures/${side}-ui-replay.json`, "utf8"),
    );
    const game = makeGame();
    try {
      game.api.boot(replay.config);
      await game.api.advance();
      for (const choice of replay.choices) {
        game.api.choose(choice);
        await game.api.advance();
        checkState(game);
      }
      const state = game.api.snapshot();
      checkSnapshot(game, state);
      assert.equal(
        state.terminal.winner,
        side === "runner" ? "corp" : "runner",
      );
      assert.equal(game.api.metrics().diagnostics.length, 0);
      console.log(
        `PASS ${side} browser replay: ${replay.choices.length} human decisions, ${state.steps} engine actions, ${state.terminal.winner} wins`,
      );
    } finally {
      game.close();
    }
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
