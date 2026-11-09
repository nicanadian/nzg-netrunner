// Run from the trusted Chrome-extension Node REPL with its existing `browser`.
// No standalone browser, native input, or access to hidden game runtime state.
export async function runReferenceEval({browser, fs, root, baseUrl='http://localhost:5173'}) {
  const fixture = JSON.parse(await fs.readFile(root + '/eval/reference-game.json', 'utf8'));
  const viewport = await browser.capabilities.get('viewport');
  const tab = await browser.tabs.new();
  const rows = [];
  try {
    for (const size of [{width:1280,height:800},{width:1440,height:900}]) {
      await viewport.set(size);
      for (const version of ['before','after']) {
        for (const step of ['layered-servers','breaker-before-boost','breaker-broken','tag-removed']) {
          const path = version === 'before' ? '/eval/baseline/index.html' : '/';
          await tab.goto(`${baseUrl}${path}?reference=example&step=${step}`);
          const id = await tab.playwright.locator('.reference-controls').getAttribute('data-checkpoint', {});
          if (id !== step) throw Error(`Wrong checkpoint ${id}`);
          let measured;
          for (let retry=0;retry<12;retry++) {
            measured = await tab.playwright.evaluate(() => {
              const box=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
              const inside=(a,b)=>a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;
              const servers=[...document.querySelectorAll('[data-server]')].map(e=>{
                const ice=[...e.querySelectorAll('.server-ice .card')];
                const root=e.querySelector('.server-root');
                return {name:e.dataset.server,root:box(root),ice:ice.map(c=>({id:c.dataset.card,...box(c)})),rootsBehindIce:!ice.length||box(root).top<Math.min(...ice.map(c=>box(c).top))};
              });
              const matCards=[...document.querySelectorAll('.mat .card')];
              const images=[...document.querySelectorAll('#game img')];
              return {
                viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},
                pageOverflow:document.documentElement.scrollWidth>innerWidth,
                hqIdentity:!!document.querySelector('[data-server="HQ"] .server-root [data-number]'),
                servers,
                clippedBoardCards:matCards.filter(c=>!inside(box(c),box(c.closest('.mat')))).map(c=>({name:c.getAttribute('aria-label'),...box(c)})),
                boardScroll:[...document.querySelectorAll('.mat')].map(e=>({side:e.classList.contains('corp-mat')?'corp':'runner',vertical:e.scrollHeight-e.clientHeight})),
                hand:[...document.querySelectorAll('#hand .card')].map(c=>({name:c.getAttribute('aria-label'),...box(c)})),
                rigCardWidths:[...document.querySelectorAll('#rig .card')].map(c=>c.offsetWidth),
                emptyZoneWidths:[...document.querySelectorAll('.rig-zone')].filter(c=>!c.querySelector('.card')).map(c=>c.offsetWidth),
                images:images.map(i=>({src:i.currentSrc||i.src,loaded:i.complete&&i.naturalWidth>0,cssWidth:i.clientWidth})),
                hiddenNumberLeaks:document.querySelectorAll('.hidden-card[data-number],.hidden-card img').length,
                readableNames:document.querySelectorAll('#hand .card-name, #rig .card-name').length,
                nativeNames:[...document.querySelectorAll('.card-name')].map(e=>({fontSize:getComputedStyle(e).fontSize,text:e.textContent})),
                brokenSubroutines:document.querySelectorAll('.subroutines .broken').length
              };
            });
            if (measured.images.every(i=>i.loaded)) break;
          }
          const cp=fixture.checkpoints.find(c=>c.id===step);
          for(const server of measured.servers) {
            const expected=cp.state.corp.servers.find(s=>s.name===server.name).ice.map(c=>c.id);
            server.innerToOuterOrder=JSON.stringify(expected)===JSON.stringify(server.ice.map(c=>c.id));
          }
          // Chrome can report the new DOM before its compositor presents the frame.
          await tab.playwright.waitForTimeout(250);
          const image=`${version}-${step}-${size.width}.jpg`;
          await fs.writeFile(`${root}/eval/artifacts/${image}`,await tab.screenshot({fullPage:false}));
          rows.push({version,step,image,...measured});
        }
      }
    }
    await fs.writeFile(root+'/eval/artifacts/browser-results.json',JSON.stringify({browser:'Chrome extension',generatedAt:new Date().toISOString(),fixture:fixture.id,rows},null,2)+'\n');
  } finally { await viewport.reset(); await tab.close(); }
  return rows.map(r=>({version:r.version,step:r.step,width:r.viewport.width,rootsBehindIce:r.servers.every(s=>s.rootsBehindIce),innerToOuter:r.servers.every(s=>s.innerToOuterOrder),hq:r.hqIdentity,clipped:r.clippedBoardCards.length,scroll:r.boardScroll,rig:r.rigCardWidths,names:r.readableNames,hiddenLeaks:r.hiddenNumberLeaks,loaded:r.images.every(i=>i.loaded)}));
}
