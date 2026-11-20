'use strict';
// Production UI-free runtime: compiled code is cached; mutable globals never cross games.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {performance}=require('node:perf_hooks');
const ROOT=path.resolve(__dirname,'..'),compiled=new Map();
const CORE_SCRIPTS=Object.freeze(['vendor/chiriboga-elevation/sets/elevation.js','engine/core-decks.js','engine/elevation-compat.js','engine/elevation-transactions.js','engine/elevation-local.js','engine/elevation-hosting.js','engine/elevation-economy.js','engine/core-events.js','engine/core-private.js','engine/core-operations.js','engine/core-rez.js','engine/core-audit-fixes.js']);
function createGame({vendor='vendor/chiriboga',extraScripts=[],core=false,vantage=false,verbose=false,searchOptimizations} = {}) {
  const timers = new Set();
  const errors = [];
  const sandbox = {
    console: {
      log: (...args) => { if (verbose) console.log(...args); },
      warn: (...args) => { if (verbose) console.warn(...args); },
      error: (...args) => { errors.push(args.map(String).join(' ')); },
    },
    performance,
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    structuredClone,
    location: { search: '', hostname: 'localhost', href: 'http://localhost/' },
    navigator: {},
    setTimeout(callback, delay, ...args) {
      const timer = setTimeout(() => { timers.delete(timer); callback(...args); }, Math.min(delay || 0, 1));
      timers.add(timer);
      return timer;
    },
    clearTimeout(timer) { clearTimeout(timer); timers.delete(timer); },
    setInterval() { return 0; },
    clearInterval() {},
    requestAnimationFrame(callback) { return sandbox.setTimeout(() => callback(performance.now()), 0); },
    cancelAnimationFrame(timer) { sandbox.clearTimeout(timer); },
    postMessage() {},
    addEventListener() {},
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  const context = vm.createContext(sandbox);
  function load(relativePaths) {
    const candidates = Array.isArray(relativePaths) ? relativePaths : [relativePaths];
    const file = candidates.map(p => path.join(ROOT, p)).find(p => fs.existsSync(p));
    if(!file)throw Error(`Missing engine script: ${candidates.join(' or ')}`);
    let script=compiled.get(file);if(!script){script=new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});compiled.set(file,script);}script.runInContext(context,{timeout:10000});
  }
  load('engine/shims.js');
  load('vendor/chiriboga/seedrandom.min.js');
  for (const file of ['init', 'phase', 'command', 'checks', 'mechanics', 'utility']) load(`${vendor}/${file}.js`);
  load([`${vendor}/sets/systemgateway.js`, `${vendor}/systemgateway.js`]);
  for (const file of ['decks', 'runcalculator', 'ai_corp', 'ai_runner']) load(`${vendor}/${file}.js`);
  load('engine/deck-catalog.js');
  load('engine/card-catalog.js');
  if(vantage){load('engine/vantage-catalog.js');load('engine/vantage-profile.js');}
  load('engine/deck-document.js');
  if(core||vantage)for(const file of CORE_SCRIPTS)load(file);
  if(vantage){load('engine/vantage-rules.js');load('engine/vantage-complete.js');load('engine/vantage-policy.js');}
  for (const file of extraScripts) load(file);
  load('engine/pressure-policy.js');
  load('engine/adapter.js');
  sandbox.NRSearchOptimizationSettings = {
    cache:searchOptimizations !== false && searchOptimizations?.cache !== false,
    continuous:searchOptimizations !== false && searchOptimizations?.continuous !== false,
  };
  load('engine/simulation/search-optimizations.js');
  if(!context.NR)throw Error('Adapter must expose globalThis.NR');
  return {
    context,
    api: context.NR,
    errors,
    close() { for (const timer of timers) clearTimeout(timer); },
  };
}

module.exports={createGame,CORE_SCRIPTS};
