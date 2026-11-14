'use strict';
// Programmatic worker smoke, separate from the required interactive Chrome games.
const assert=require('node:assert/strict');
const {createServer}=require('../server.cjs');
const {chromium}=require('playwright-core');
(async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'chrome'});
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const config={side:'runner',faceoff:true,seed:'core-profile-1',cardPool:'core-v1',rulesVersion:'26.03-core-1',deckIds:{runner:'phoenix-core-v1',corp:'precision-design-core-v1'}};
  const result=await page.evaluate(config=>new Promise((resolve,reject)=>{
   const worker=new Worker('/engine/worker.js');const timeout=setTimeout(()=>{worker.terminate();reject(Error('Core worker timed out'));},60000);
   worker.onmessage=({data})=>{if(data.type==='state'||data.type==='error'){clearTimeout(timeout);worker.terminate();if(data.type==='error')reject(Error(data.message));else resolve(data.state);}};
   worker.onerror=e=>{clearTimeout(timeout);worker.terminate();reject(Error(e.message));};
   worker.postMessage({type:'start',config});
  }),config);
  assert(result.terminal);assert.equal(result.rulesVersion,'26.03-core-1');assert.equal(result.diagnostics.length,0);
  assert.equal(result.runner.identity.number,35001);
  console.log(`PASS Core browser worker startup and complete AI smoke match (${result.version} decisions); this is not an interactive browser playthrough.`);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
