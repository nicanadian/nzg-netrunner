# Existing Chrome connection from T3

Verified on 2026-11-13 with T3 0.1.9 and installed Chrome plugin 26.1027.61615.

The normal `mcp__cua_repl.js` browser discovery fails with `The browser access host is unavailable` before extension discovery. Its desktop-oriented launcher expects browser-access host context that this T3 session does not receive. Restarting T3 and resetting the CUA JavaScript session did not fix that route. The extension itself was running.

Browser access was restored through the existing `mcp__node_repl__js` tool and the installed official Chrome client's exported entry point. This controls the user's existing Chrome through the extension; it does not launch Chrome, a headless browser, or T3's shared browser. No plugin files, environment variables, authorization checks, permissions or user configuration were modified.

## Reconnect in a fresh JavaScript session

Use `mcp__node_repl__js`, not a shell. Initialize once and retain the handles. Discover the browser rather than hardcoding its ID:

```js
var { setupBrowserRuntime } = await import(
  '/Users/nicanadian/.codex/plugins/cache/openai-bundled/chrome/latest/scripts/browser-client.mjs'
);
var chromeAgent = await setupBrowserRuntime();
var available = await chromeAgent.browsers.list();
var matches = available.filter(b => b.type === 'extension' && b.family === 'chrome');
if (matches.length !== 1) throw new Error('Select the intended Chrome profile explicitly');
var liveChrome = await chromeAgent.browsers.get(matches[0].id);
nodeRepl.write(await liveChrome.documentation());
await liveChrome.nameSession('🧪 Netrunner playtests');
nodeRepl.write(await liveChrome.user.openTabs());
```

Read and follow the returned API documentation. Claim only the intended tab from the current list, or create a test tab in this same browser. Do not navigate an unrelated user tab. Retain handles across calls; a new turn alone does not require setup again. Use native AX/Playwright controls for decisions, observing each result. Do not use direct engine calls to substitute for UI playthroughs.

Do not remove the access-check preload, unset authorization markers, copy another session's authorization context, or patch the browser service. If this entry point also reports denied/unavailable access, stop and investigate the reported failure.

## Verification performed

- Discovered extension-backed Chrome, named `Your Chrome`.
- Opened `http://localhost:5173/?core-preview=1` in a new tab in that existing browser.
- Read the live accessibility tree.
- Clicked View decks, verified both official deck lists, and closed the library.
- Clicked Jack in; verified the live Runner opening hand and both Keep/Mulligan controls.
- Retained a screenshot at `elevation/chrome-connection.png`.

This verifies browser control, not a completed gameplay test. Full both-side playthroughs remain in the Elevation plan. The normal CUA route remains broken; this is a verified alternate connection path.

## Upstream reports

- https://github.com/pingdotgg/t3code/discussions/26102
- https://github.com/openai/codex/issues/57641
- Alternate installed-client entry point: https://github.com/openai/codex/issues/57641#issuecomment-6701344387

The reports describe the same host-context failure after bundled plugin updates. They do not establish the precise date this installation first failed.
