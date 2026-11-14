'use strict';
// Exercise the rendered controls: a hidden Keep button must fail this regression.
const assert = require('node:assert/strict');
const {createServer} = require('../server.cjs');
const {chromium} = require('/tmp/nt-mockup-tools/node_modules/playwright-core');
(async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  const errors = [];
  try {
    browser = await chromium.launch({headless:true, executablePath:'/Users/nicanadian/Library/Caches/ms-playwright/chromium-1193/chrome-mac/Chromium.app/Contents/MacOS/Chromium'});
    for (const side of ['corp', 'runner']) for (const action of ['keep', 'mulligan']) {
      const page = await browser.newPage({viewport:{width:action==='keep'?1280:390,height:844},reducedMotion:'reduce'});
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.locator(`[data-side="${side}"]`).click();
      await page.locator('#start-button').click();
      await page.waitForFunction(() => localTable.state?.phase.identifier.includes('Mulligan') && !localTable.busy);
      const keep = page.getByRole('button', {name:'Keep this hand', exact:true});
      const mulligan = page.getByRole('button', {name:/mulligan/i});
      assert(await keep.isVisible(), `${side}: Keep must be visible`);
      assert(await mulligan.isVisible(), `${side}: Mulligan must be visible`);
      assert(await keep.isEnabled()); assert(await mulligan.isEnabled());
      assert.equal(await keep.evaluate(button => !!button.closest('#decisions')), true, 'Keep belongs in the ordinary decision panel');
      assert.equal(await page.locator('#run-status').isVisible(), false, 'No run panel in the opening hand');
      const before = await page.evaluate(() => ({version:localTable.state.version, hand:localTable.state[localTable.state.side].hand.map(c=>c.id)}));
      const chosen = action==='keep' ? keep : mulligan;
      const command = await chosen.getAttribute('data-command');
      await chosen.click();
      await page.waitForFunction(version => localTable.state?.version!==version && !localTable.busy, before.version);
      const after = await page.evaluate(() => ({hand:localTable.state[localTable.state.side].hand.map(c=>c.id), choices:localTable.session.choices}));
      assert.equal(after.choices[0].command, command, 'The visible action submits its native choice');
      if(action==='keep') for(const id of before.hand) assert(after.hand.includes(id), 'Keep retains every opening card');
      console.log(`PASS ${side} ${action}: both choices visible, native choice accepted (${action==='keep'?'desktop':'mobile'})`);
      await page.close();
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {console.error(error); process.exitCode=1;});
