// Run inside the trusted Chrome-extension Node REPL with an existing browser.
// Reads only DOM presentation; creates no game state and makes no game choices.
export async function runCounterBrowserEval({browser, fs, root, baseUrl='http://localhost:5173'}) {
 const viewport=await browser.capabilities.get('viewport');
 const tab=await browser.tabs.new();
 const rows=[];
 try {
  for(const size of [{width:1280,height:800},{width:1440,height:900},{width:1024,height:768},{width:390,height:844}]) {
   await viewport.set(size);
   for(const step of ['layered-servers','breaker-broken']) {
    await tab.goto(`${baseUrl}/?reference=example&step=${step}`);
    await tab.playwright.locator('.reference-controls').waitFor({state:'visible'});
    await tab.playwright.domSnapshot();
    const measured=await tab.playwright.evaluate(()=>{
     const box=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
     const cards=[...document.querySelectorAll('.mat .card')];
     return {
      viewport:{width:innerWidth,height:innerHeight},
      pageOverflow:document.documentElement.scrollWidth>innerWidth,
      hiddenLeaks:document.querySelectorAll('.hidden-card[data-number],.hidden-card img').length,
      statusOverflow:[...document.querySelectorAll('.player-status')].some(e=>e.scrollWidth>e.clientWidth),
      clippedBoardCards:cards.filter(c=>{const a=box(c),b=box(c.closest('.mat'));return a.left<b.left-1||a.right>b.right+1||a.top<b.top-1||a.bottom>b.bottom+1;}).map(c=>c.getAttribute('aria-label')),
      verticallyClippedCards:cards.filter(c=>{const a=box(c),b=box(c.closest('.mat'));return a.top<b.top-1||a.bottom>b.bottom+1;}).map(c=>c.getAttribute('aria-label')),
      boardScroll:[...document.querySelectorAll('.mat')].map(e=>e.scrollHeight-e.clientHeight),
      handInsideViewport:[...document.querySelectorAll('#hand .card')].every(c=>{const r=box(c);return r.left>=0&&r.right<=innerWidth&& (innerWidth<=760||r.bottom<=innerHeight);}),
      counterTotals:[...document.querySelectorAll('#table .card-counter')].map(e=>({type:e.dataset.counter,count:Number(e.dataset.count)})),
      clickMarkers:[...document.querySelectorAll('.clicks')].map(e=>({name:e.getAttribute('aria-label'),ready:e.querySelectorAll('.filled').length,spent:e.querySelectorAll('.used').length})),
      imagesLoaded:[...document.querySelectorAll('#game img')].every(i=>i.complete&&i.naturalWidth>0),
     };
    });
    // Chrome may report new DOM geometry before the compositor presents it.
    await tab.playwright.waitForTimeout(200);
    const image=`after-${step}-${size.width}.jpg`;
    await fs.writeFile(`${root}/eval/counters/${image}`,await tab.screenshot({fullPage:false}));
    rows.push({step,image,...measured});
   }
  }
  await fs.writeFile(`${root}/eval/counters/browser-results.json`,JSON.stringify({browser:'Google Chrome extension',rows},null,2)+'\n');
 } finally {await viewport.reset();await tab.close();}
 return rows;
}
