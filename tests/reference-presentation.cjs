const assert=require('node:assert/strict');
const results=require('../eval/artifacts/browser-results.json');
assert.equal(results.browser,'Chrome extension');
assert.equal(results.rows.length,16);
for(const row of results.rows){
 assert.equal(row.hiddenNumberLeaks,0,`${row.version}/${row.step}: hidden card data`);
 assert.ok(row.images.every(i=>i.loaded),`${row.version}/${row.step}: broken image`);
 assert.equal(row.pageOverflow,false,`${row.version}/${row.step}: page overflow`);
 if(row.version!=='after')continue;
 assert.equal(row.clippedBoardCards.length,0,`${row.step}: clipped card`);
 assert.ok(row.servers.every(s=>s.rootsBehindIce&&s.innerToOuterOrder),`${row.step}: server geometry/order`);
 if(row.step==='breaker-broken')assert.equal(row.brokenSubroutines,1,'Broken subroutine remains visible through movement');
 assert.equal(row.hqIdentity,true,`${row.step}: HQ identity`);
 assert.ok(row.boardScroll.every(s=>s.vertical===0),`${row.step}: checkpoint should fit`);
 assert.ok(row.rigCardWidths.every(w=>w>=100),`${row.step}: installed card size`);
 assert.ok(row.readableNames>=6,`${row.step}: native card names`);
 assert.ok(row.hand.every(c=>c.left>=0&&c.right<=row.viewport.width&&c.bottom<=row.viewport.height),`${row.step}: hand clipped`);
}
console.log('Reference presentation: 16 Chrome captures, 8 revised positions pass geometry, fit, assets and privacy checks.');
