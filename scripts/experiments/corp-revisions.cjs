'use strict';
const fs=require('node:fs'),path=require('node:path');
const docs=require('../../engine/deck-document.js'),catalog=require('../../engine/deck-catalog.js');
const {fingerprint}=require('../../engine/simulation/batch.cjs');
const {readPair,summarize,quantile,seedRandom}=(()=>{const m=require('./deck-study.cjs');return {...m,seedRandom(seed){let state=seed>>>0;return()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}}})();
const ART=path.resolve('eval/deck-experiments/experiment-2'),RAW=path.resolve('tmp/deck-experiment-2');
const json=file=>JSON.parse(fs.readFileSync(file));
const save=(name,value)=>fs.writeFileSync(path.join(ART,name+'.json'),JSON.stringify(value,null,2)+'\n');
function document(id,side){const d=catalog.resolve({runner:'tao-v1',corp:'precision-design-v2',[side]:id})[side];const deck=docs.normalize({name:id,side,identity:d.identity,pool:'gateway-v1',cards:d.cards});const validation=docs.validate(deck);if(!validation.valid)throw Error(JSON.stringify(validation));return {label:id,deck,validation:validation.totals};}
function prepare(){
 if(fs.existsSync(path.join(ART,'design.json')))throw Error('Experiment already prepared');
 const runners=['loup-v1','zahya-v2','tao-v1'].map(id=>document(id,'runner'));
 const families=['precision-design','restoring-humanity','reality-plus','built-to-last'];
 const corps=families.flatMap(f=>[1,2].map(v=>document(f+'-v'+v,'corp')));
 const common={schemaVersion:1,workers:4,wallMs:120000,decisions:100000,traceEvery:1,mode:'fast'};
 const design={createdAt:new Date().toISOString(),engineHash:fingerprint(),pool:'gateway-v1',policy:'chiriboga-native-unaudited-v1',families,runners,corps,common,screen:{gamesPerMatchup:40,seed:'corp-revisions-screen-2'},confirmation:{gamesPerMatchup:200,seed:'corp-revisions-confirm-2',bootstrapReplicates:20000,bootstrapLevel:.975},selection:'Largest absolute equal-weight Corp win-rate change v2 minus v1 across three Runner decks, at least 90% completed and no errors in all six cells; fixed family order breaks ties. Select one primary family using screen results only.',criterion:'Confirm only if the fresh-seed 97.5% seed-cluster bootstrap interval excludes zero and the direction agrees with the screen. Report every outcome including unfinished games; no selective seed exclusions.',interpretation:'Exploratory whole-list comparisons, not isolated identity or individual-card effects. No engine or AI changes during the study. Shared seeds form a cluster across all three Runner matchups.'};
 save('design',design);save('screen',{...common,runners,corps,gamesPerMatchup:40,seed:design.screen.seed});
 console.log(JSON.stringify({families,runners:runners.map(r=>r.label),games:960,engineHash:design.engineHash}));
}
function bootstrap(blocks,{level=.975,replicates=20000,seed=18231}={}){
 const random=seedRandom(seed),samples=[],n=blocks.length;
 for(let b=0;b<replicates;b++){let sum=0;for(let j=0;j<n;j++)sum+=blocks[Math.floor(random()*n)];samples.push(sum/n);}
 const alpha=(1-level)/2;return {level,replicates,seed,interval:[quantile(samples,alpha),quantile(samples,1-alpha)]};
}
function analyze(phase){
 const design=json(path.join(ART,'design.json')),root=path.join(RAW,phase),matrix=json(path.join(root,'matrix.json'));
 if(matrix.engineHash!==design.engineHash)throw Error('Source revision mismatch');
 const cells=[];const jobRows=[];
 for(let r=0;r<matrix.runners.length;r++){const row=[];for(let c=0;c<matrix.corps.length;c++){
  const directory=`matchup-${r}-${c}`,{manifest,jobs}=readPair(root,directory);
  if(manifest.engineHash!==design.engineHash||manifest.seed!==matrix.seed)throw Error('Cell provenance mismatch');
  cells.push({r,c,directory,runner:matrix.runners[r].label,corp:matrix.corps[c].label,...summarize(jobs)});row.push(jobs);
 }jobRows.push(row);}
 const families=phase==='screen'?design.families:[json(path.join(ART,'selection.json')).family];
 const contrasts=families.map((family,i)=>{
  const original=i*2,revised=original+1,blocks=[],bounds=[];let pairedCount=0;
  for(let index=0;index<matrix.gamesPerMatchup;index++){
   let total=0,lo=0,hi=0,complete=true;
   for(let r=0;r<jobRows.length;r++){
    const a=jobRows[r][original][index],b=jobRows[r][revised][index];
    if(a.seed!==b.seed||a.index!==b.index)throw Error('Seed pairing mismatch');
    const av=a.status==='completed'?Number(a.terminal.winner==='corp'):null,bv=b.status==='completed'?Number(b.terminal.winner==='corp'):null;
    lo+=(bv??0)-(av??1);hi+=(bv??1)-(av??0);
    if(av===null||bv===null)complete=false;else {total+=bv-av;pairedCount++;}
   }
   bounds.push([lo/jobRows.length,hi/jobRows.length]);if(complete)blocks.push(total/jobRows.length);
  }
  const selected=cells.filter(c=>c.c===original||c.c===revised);
  return {family,completedSeedClusters:blocks.length,scheduledSeedClusters:matrix.gamesPerMatchup,pairedGames:pairedCount,delta:blocks.length?blocks.reduce((s,d)=>s+d,0)/blocks.length:null,bootstrap:blocks.length?bootstrap(blocks,{replicates:design.confirmation.bootstrapReplicates,level:phase==='screen'?.95:design.confirmation.bootstrapLevel,seed:18231+i}):null,allScheduledDeltaBounds:[0,1].map(k=>bounds.reduce((s,b)=>s+b[k],0)/bounds.length),reliable:selected.every(c=>c.completed>=c.scheduled*.9&&!c.statuses.error),runnerDeltas:matrix.runners.map((r,ri)=>{const a=selected.find(c=>c.r===ri&&c.c===original),b=selected.find(c=>c.r===ri&&c.c===revised);return {runner:r.label,originalCorpWins:a.corpWins,revisedCorpWins:b.corpWins,games:a.scheduled,delta:(b.corpWins-a.corpWins)/a.scheduled};})};
 });
 const result={phase,engineHash:matrix.engineHash,seed:matrix.seed,finishedAt:new Date().toISOString(),cells,contrasts};save(phase+'-analysis',result);
 console.log(JSON.stringify({phase,cells:cells.map(c=>({runner:c.runner,corp:c.corp,corpWins:c.corpWins,n:c.completed,statuses:c.statuses})),contrasts},null,2));
 return result;
}
function select(){
 const screen=analyze('screen'),design=json(path.join(ART,'design.json'));
 const ranked=screen.contrasts.filter(c=>c.reliable).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)||design.families.indexOf(a.family)-design.families.indexOf(b.family));
 if(!ranked.length)throw Error('No reliable candidate');
 const chosen=ranked[0],file=path.join(ART,'selection.json');if(fs.existsSync(file))throw Error('Selection already saved');
 save('selection',{selectedAt:new Date().toISOString(),...chosen,ranked,rule:design.selection});
 save('confirmation',{...design.common,runners:design.runners,corps:design.corps.filter(c=>c.label.startsWith(chosen.family+'-v')),gamesPerMatchup:design.confirmation.gamesPerMatchup,seed:design.confirmation.seed});
 console.log('Selected '+chosen.family+' for independent confirmation.');
}
module.exports={bootstrap,analyze};
if(require.main===module){const action=process.argv[2];if(action==='prepare')prepare();else if(action==='screen')analyze('screen');else if(action==='select')select();else if(action==='confirmation')analyze('confirmation');else throw Error('prepare | screen | select | confirmation');}
