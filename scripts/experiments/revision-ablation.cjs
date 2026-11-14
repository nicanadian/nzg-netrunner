'use strict';
const fs=require('node:fs'),path=require('node:path');
const {readPair,summarize}=require('./deck-study.cjs');
const {bootstrap}=require('./corp-revisions.cjs');
const ART=path.resolve('eval/deck-experiments/experiment-2'),RAW=path.resolve('tmp/deck-experiment-2');
const design=JSON.parse(fs.readFileSync(path.join(ART,'design.json'))),plan=JSON.parse(fs.readFileSync(path.join(ART,'ablation-plan.json')));
const cells=[],rows=[];
for(let r=0;r<design.runners.length;r++){
 const base=readPair(path.join(RAW,'confirmation'),`matchup-${r}-1`),variant=readPair(path.join(RAW,'ablation'),`matchup-${r}-0`);
 for(const d of [base,variant])if(d.manifest.engineHash!==design.engineHash||d.manifest.seed!==plan.seed)throw Error('Ablation provenance mismatch');
 rows.push({base:base.jobs,variant:variant.jobs});
 cells.push({r,c:0,directory:`matchup-${r}-0`,runner:design.runners[r].label,corp:variant.manifest.corp.name,...summarize(variant.jobs)});
}
const blocks=[],bounds=[];
for(let index=0;index<plan.gamesPerMatchup;index++){
 let delta=0,lo=0,hi=0,complete=true;
 for(const row of rows){const a=row.base[index],b=row.variant[index];if(a.seed!==b.seed||a.index!==b.index)throw Error('Pairing mismatch');const av=a.status==='completed'?Number(a.terminal.winner==='corp'):null,bv=b.status==='completed'?Number(b.terminal.winner==='corp'):null;lo+=(bv??0)-(av??1);hi+=(bv??1)-(av??0);if(av===null||bv===null)complete=false;else delta+=bv-av;}
 bounds.push([lo/rows.length,hi/rows.length]);if(complete)blocks.push(delta/rows.length);
}
const result={phase:'ablation',engineHash:design.engineHash,seed:plan.seed,finishedAt:new Date().toISOString(),comparison:plan.comparison,delta:blocks.reduce((s,d)=>s+d,0)/blocks.length,completedSeedClusters:blocks.length,scheduledSeedClusters:plan.gamesPerMatchup,bootstrap:bootstrap(blocks,{level:plan.bootstrapLevel,replicates:plan.bootstrapReplicates,seed:19238}),allScheduledDeltaBounds:[0,1].map(k=>bounds.reduce((s,b)=>s+b[k],0)/bounds.length),runnerDeltas:rows.map((row,r)=>({runner:design.runners[r].label,baselineCorpWins:row.base.filter(j=>j.status==='completed'&&j.terminal.winner==='corp').length,alternativeCorpWins:row.variant.filter(j=>j.status==='completed'&&j.terminal.winner==='corp').length,games:plan.gamesPerMatchup})),cells};
fs.writeFileSync(path.join(ART,'ablation-analysis.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
