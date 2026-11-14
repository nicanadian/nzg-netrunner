'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),docs=require('../deck-document.js');
const {fingerprint,freezeRuntime,lockDirectory,atomic}=require('./batch.cjs');
async function runMatrix(spec,{out,onProgress=()=>{}}){
 for(const side of ['runners','corps'])if(!Array.isArray(spec[side])||!spec[side].length||spec[side].length>100)throw Error('Matrix needs 1–100 '+side+'.');
 const normalized={schemaVersion:1,kind:'netrunner-matrix',engineHash:fingerprint(),runners:spec.runners.map(d=>({label:d.label||d.deck.name,deck:docs.normalize(d.deck)})),corps:spec.corps.map(d=>({label:d.label||d.deck.name,deck:docs.normalize(d.deck)})),gamesPerMatchup:spec.gamesPerMatchup||100,seed:String(spec.seed||'matrix-1'),wallMs:spec.wallMs||60000,decisions:spec.decisions||100000,traceEvery:spec.traceEvery||100,mode:spec.mode||'fast'};
 if(!Number.isSafeInteger(normalized.gamesPerMatchup)||normalized.gamesPerMatchup<1)throw Error('Invalid gamesPerMatchup.');
 for(const runner of normalized.runners)for(const corp of normalized.corps){if(runner.deck.side!=='runner'||corp.deck.side!=='corp'||runner.deck.pool!==corp.deck.pool)throw Error('Each matrix pairing needs a Runner and Corp from the same pool.');for(const deck of [runner.deck,corp.deck]){const v=docs.validate(deck);if(!v.valid)throw Error(deck.name+': '+[...v.errors,...v.support].map(e=>e.message).join('; '));}}
 const experimentHash=crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');out=path.resolve(out);const root=path.resolve(__dirname,'../..');if(out===root||['engine','vendor'].some(d=>out===path.join(root,d)||out.startsWith(path.join(root,d)+path.sep)))throw Error('Matrix output must not overwrite engine source directories.');fs.mkdirSync(out,{recursive:true});const unlock=lockDirectory(out);
 try{
  const file=path.join(out,'matrix.json');if(fs.existsSync(file)&&JSON.parse(fs.readFileSync(file)).experimentHash!==experimentHash)throw Error('Matrix directory belongs to another experiment or engine revision.');
  if(!fs.existsSync(file))atomic(file,{...normalized,experimentHash,workers:spec.workers||1});
  const pinned=freezeRuntime(out,normalized.engineHash),batch=require(path.join(pinned,'engine/simulation/batch.cjs'));
  const matchups=[];for(let r=0;r<normalized.runners.length;r++)for(let c=0;c<normalized.corps.length;c++){
   const runner=normalized.runners[r],corp=normalized.corps[c],directory=`matchup-${r}-${c}`;
   const summary=await batch.runBatch({runner:runner.deck,corp:corp.deck,games:normalized.gamesPerMatchup,workers:spec.workers||1,seed:normalized.seed,out:path.join(out,directory),wallMs:normalized.wallMs,decisions:normalized.decisions,traceEvery:normalized.traceEvery,mode:normalized.mode,onProgress:progress=>onProgress({...progress,runner:runner.label,corp:corp.label})});
   matchups.push({runner:runner.label,corp:corp.label,directory,...summary});atomic(path.join(out,'matrix-summary.json'),{schemaVersion:1,experimentHash,matchups,complete:matchups.length===normalized.runners.length*normalized.corps.length});
  }
  return {schemaVersion:1,experimentHash,matchups,complete:true};
 }finally{unlock();}
}
module.exports={runMatrix};
