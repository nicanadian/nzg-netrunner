'use strict';
// Inventory exactly the bundled lists exposed by each lobby. Preserve source
// snapshots and historical IDs; this audit never silently rewrites a deck.
const fs=require('node:fs'),path=require('node:path');
const {forPool}=require('../engine/deck-profiles.cjs');
const {fingerprint}=require('../engine/simulation/batch.cjs');
const ROOT=path.resolve(__dirname,'..'),REPORT=path.join(ROOT,'docs/research/deck-audit-2026-11-16');
const RUNS=path.resolve(process.env.NR_DECK_AUDIT_RUNS||path.join(ROOT,'tmp/all-decks-2026-11-16'));
const economy=new Set([30002,30007,30014,30018,30020,30027,30029,30030,30033,30037,30048,30056,30064,30071,30075,35011,35014,35017,35022,35033,35034,35039,35040,35055,35061,35062,35072,35077,35081,36011,36018,36020,36021,36024,36032,36033,36057,36063]);
const metadata=require('../engine/vantage.cjs').catalog.cards;
const accessibleEconomy=new Set([...economy].filter(id=>Number.isFinite(metadata[id]?.cost)&&metadata[id].cost<=5));
const draw=new Set([30002,30011,30021,30034,30037,30041,30053,30056,35007,35015,35026,35033,35034,35039,35044,35055,35072,35077,36011,36013,36022,36043,36057]);
const choose=(n,k)=>{if(k<0||k>n)return 0;let v=1;for(let i=1;i<=Math.min(k,n-k);i++)v=v*(n-i+1)/i;return v;};
const none=(size,count,seen)=>choose(size-count,seen)/choose(size,seen);
const plain=x=>JSON.parse(JSON.stringify(x));
const write=(name,value)=>{fs.mkdirSync(REPORT,{recursive:true});fs.writeFileSync(path.join(REPORT,name),JSON.stringify(value,null,2)+'\n');};
async function inventory(){
 const gateway=require('../engine/deck-catalog.js'),core=require('../engine/core-decks.js'),net=require('../engine/net-decks.js');
 const {gatewayVariants}=await import('../app/ready-made-decks.mjs');
 const coreKeys=new Set(core.catalog.map(d=>forPool('core-v1').documents.contentKey({...d,pool:'core-v1'})));
 const pools=[{pool:'gateway-v1',label:'System Gateway',lists:[...gateway.catalog,...gatewayVariants]},
  {pool:'core-v1',label:'Gateway + Elevation',lists:[...core.catalog,...net.catalog.filter(d=>!coreKeys.has(forPool('core-v1').documents.contentKey(d.document)))]},
  {pool:'vantage-preview-v1',label:'Gateway + Elevation + Vantage',lists:require('../engine/vantage-decks.js')}];
 const rows=[];
 for(const {pool,label,lists} of pools)for(const entry of lists){
  const api=forPool(pool).documents,deck=api.normalize(entry.document||{...entry,pool}),validation=api.validate(deck);
  const metadata=pool==='vantage-preview-v1'?require('../engine/vantage.cjs').catalog.cards:require('../engine/card-catalog.js').cards;
  const cards=deck.cards.flatMap(({id,count})=>Array(count).fill(metadata[id])),count=f=>cards.filter(f).length;
  const size=cards.length,ice=cards.filter(c=>c.type_code==='ice');
  const stopping=ice.filter(c=>/end the run/i.test(c.stripped_text||c.text||'')),cheap=ice.filter(c=>c.cost<=3),cheapStop=stopping.filter(c=>c.cost<=3);
  const breakers=Object.fromEntries(['Fracter','Decoder','Killer','AI'].map(k=>[k,count(c=>c.type_code==='program'&&(c.keywords||'').split(' - ').includes(k))]));
  const hints=[];
  if(deck.side==='runner'){
   const missing=['Fracter','Decoder','Killer'].filter(k=>!breakers[k]);
   if(missing.length)hints.push({kind:'coverage',message:'No dedicated '+missing.join('/')+'; inspect AI breakers, hosted viruses, bypass and tutors before judging this list.'});
   const stealth=cards.some(c=>(c.keywords||'').split(' - ').includes('Stealth'));
   if(cards.some(c=>/spend credits only from stealth cards/i.test(c.stripped_text||c.text||''))&&!stealth)hints.push({kind:'support',message:'A stealth-dependent ability has no Stealth credit source.'});
  }else{
   if(cheapStop.length<6)hints.push({kind:'defense',message:'Fewer than six low-cost ice copies with printed end-the-run text; inspect taxing/damage defenses and opening consistency.'});
   if(ice.length/size<.23)hints.push({kind:'defense',message:'Low ice density; check whether the alternate win condition and opening defenses compensate.'});
  }
  const econ=count(c=>economy.has(Number(c.code))),accessible=count(c=>accessibleEconomy.has(Number(c.code))),selection=count(c=>draw.has(Number(c.code)));
  if(econ/size<.16)hints.push({kind:'economy',message:'Few explicitly classified economy copies; verify identity income, discounts and alternate economies.'});
  const art=[deck.identity,...deck.cards.map(c=>c.id)].filter(id=>!fs.existsSync(path.join(ROOT,'assets/cards-display',id+'-743.webp')));
  rows.push({id:entry.id,pool,poolLabel:label,name:deck.name,side:deck.side,identity:metadata[deck.identity]?.title,purpose:entry.purpose||'play',
   document:deck,revision:await api.revision(deck),validation:{valid:validation.valid,legal:validation.legal,implemented:validation.implemented,totals:validation.totals,errors:validation.errors,support:validation.support},
   size,typeCounts:cards.reduce((a,c)=>(a[c.type_code]=(a[c.type_code]||0)+1,a),{}),breakers,
   economy:econ,accessibleEconomy:accessible,drawSelection:selection,ice:ice.length,cheapIce:cheap.length,stoppingIce:stopping.length,cheapStoppingIce:cheapStop.length,
   openingNoEconomy:none(size,econ,5),openingNoAccessibleEconomy:none(size,accessible,5),firstEightNoCheapIce:deck.side==='corp'?none(size,cheap.length,8):null,
   hints,missingHighResolutionArt:art});
 }
 const visibleKeys=new Map(rows.map(d=>[forPool(d.pool).documents.contentKey(d.document),d.id]));
 const aliases=net.catalog.filter(d=>!rows.some(r=>r.id===d.id)).map(d=>({id:d.id,canonical:visibleKeys.get(forPool('core-v1').documents.contentKey(d.document)),valid:forPool('core-v1').documents.validate(d.document).valid}));
 const archived=[];const source=fs.readFileSync(path.join(ROOT,'engine/deck-catalog.js'),'utf8');
 for(const [,id,side]of source.matchAll(/\{id:'([^']+)',side:'(runner|corp)'/g))if(!rows.some(d=>d.id===id)){
  const d=gateway.resolve({...gateway.defaults,[side]:id})[side],api=forPool('gateway-v1').documents,doc=api.normalize({...d,pool:'gateway-v1'}),v=api.validate(doc);
  archived.push({id,side,document:doc,valid:v.valid,errors:v.errors});
 }
 return {engineHash:fingerprint(),policy:'pressure-v1',seedsPerPairing:6,rows,aliases,archived,
  definitions:{economy:[...economy],accessibleEconomy:[...accessibleEconomy],drawSelection:[...draw],notes:'Static economy/draw roles are curated screening labels, not guaranteed payouts. Accessible economy means printed startup cost at most the opening five credits; its effect may still require clicks, a run, a discard, or another condition. Exact hypergeometric opening probabilities ignore mulligans, extra draws and identity effects. Printed end-the-run text includes conditional stopping ice; virus, AI, tutor and bypass strategies require manual review. AI benchmarks screen implementation and policy behavior, not human fun or competitive strength.'}};
}
async function prepare(){
 const data=await inventory();write('inventory.json',data);
 if(data.rows.some(d=>!d.validation.valid))throw Error('Invalid selectable deck; see inventory.json');
 fs.mkdirSync(RUNS,{recursive:true});
 for(const pool of [...new Set(data.rows.map(d=>d.pool))]){
  const rows=data.rows.filter(d=>d.pool===pool),spec={schemaVersion:1,aiPolicy:'pressure-v1',seed:'all-decks-2026-11-16',gamesPerMatchup:6,workers:4,wallMs:60000,decisions:30000,traceEvery:1,
   runners:rows.filter(d=>d.side==='runner').map(d=>({label:d.id,deck:d.document})),corps:rows.filter(d=>d.side==='corp').map(d=>({label:d.id,deck:d.document}))};
  fs.writeFileSync(path.join(RUNS,pool+'.json'),JSON.stringify(spec,null,2)+'\n');
 }
 console.log(JSON.stringify({selectable:data.rows.length,aliases:data.aliases.length,archived:data.archived.length,invalid:data.rows.filter(d=>!d.validation.valid).length,artMissing:data.rows.filter(d=>d.missingHighResolutionArt.length).length,
  pools:[...new Set(data.rows.map(d=>d.pool))].map(pool=>{const rows=data.rows.filter(d=>d.pool===pool),r=rows.filter(d=>d.side==='runner').length,c=rows.length-r;return {pool,decks:rows.length,pairings:r*c,games:r*c*6};}),flags:data.rows.filter(d=>d.hints.length).map(d=>({id:d.id,purpose:d.purpose,hints:d.hints}))},null,2));
}
async function summarize(){
 const data=JSON.parse(fs.readFileSync(path.join(REPORT,'inventory.json'))),all=[],poolStatus=[];
 for(const pool of [...new Set(data.rows.map(d=>d.pool))]){
  const base=path.join(RUNS,pool),file=path.join(base,'matrix-summary.json');if(!fs.existsSync(file))continue;
  const m=JSON.parse(fs.readFileSync(file)),matrix=JSON.parse(fs.readFileSync(path.join(base,'matrix.json')));
  for(const pair of m.matchups){const folder=path.join(base,pair.directory,'jobs');for(const f of fs.readdirSync(folder)){
   const result=JSON.parse(fs.readFileSync(path.join(folder,f)));all.push({pool,runner:pair.runner,corp:pair.corp,path:path.relative(ROOT,path.join(folder,f)),...result});
  }}
  poolStatus.push({pool,complete:m.complete,pairings:m.matchups.length,engineHash:matrix.engineHash});
 }
 const decks=data.rows.map(d=>{
  const games=all.filter(g=>g[d.side]===d.id),completed=games.filter(g=>g.status==='completed'),wins=completed.filter(g=>g.terminal?.winner===d.side).length;
  const values=key=>completed.map(g=>key(g)).sort((a,b)=>a-b),mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
  const rounds=values(g=>Math.ceil(g.turn/2)),rate=(g,s,cmd)=>{const a=g.aiAudit?.totals[s];return a?.actions?(a[cmd]||0)/a.actions:0;};
  const opponents=[...new Set(games.map(g=>g[d.side==='runner'?'corp':'runner']))];
  const peers=completed.filter(g=>data.rows.find(d=>d.id===g.runner)?.purpose==='play'&&data.rows.find(d=>d.id===g.corp)?.purpose==='play');
  return {id:d.id,name:d.name,side:d.side,pool:d.pool,purpose:d.purpose,games:games.length,completed:completed.length,wins,winRate:completed.length?wins/completed.length:null,
   againstPlayDecks:{games:peers.length,wins:peers.filter(g=>g.terminal.winner===d.side).length},opponents:opponents.length,meanRound:mean(rounds),p90Round:rounds[Math.floor(rounds.length*.9)]||null,
   meanBasicGainShare:mean(completed.map(g=>rate(g,d.side,'gain'))),lowRunnerPressure:completed.filter(g=>g.turn>=16&&g.aiAudit?.totals.runner.runs<=1).length,
   longGames:completed.filter(g=>g.turn>60).length,deckOuts:completed.filter(g=>/deck|R&D|draw.*card/i.test(g.terminal.reason)).length,
   failures:games.filter(g=>g.status!=='completed').map(g=>({path:g.path,status:g.status,error:g.error,seed:g.seed,runner:g.runner,corp:g.corp})),hints:d.hints};
 });
 const planned=[...new Set(data.rows.map(d=>d.pool))].reduce((n,pool)=>{const rows=data.rows.filter(d=>d.pool===pool);return n+rows.filter(d=>d.side==='runner').length*rows.filter(d=>d.side==='corp').length*data.seedsPerPairing;},0);
 const result={engineHash:data.engineHash,policy:data.policy,planned,settled:all.length,statuses:all.reduce((a,g)=>(a[g.status]=(a[g.status]||0)+1,a),{}),pools:poolStatus,decks,failures:all.filter(g=>g.status!=='completed').map(({trace,...r})=>r)};
 write('screen-results.json',result);console.log(JSON.stringify({settled:result.settled,statuses:result.statuses,pools:poolStatus,failures:result.failures.map(r=>({path:r.path,error:r.error?.slice(0,180)})),outliers:decks.filter(d=>d.failures.length||(d.winRate!==null&&(d.winRate<.15||d.winRate>.85))||d.meanBasicGainShare>.4||d.longGames>5).map(d=>({id:d.id,purpose:d.purpose,games:d.completed,winRate:d.winRate,round:d.meanRound,gain:d.meanBasicGainShare,long:d.longGames,failures:d.failures.length}))},null,2));
}
if(require.main===module)(process.argv[2]==='--summarize'?summarize():prepare()).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={inventory,prepare,summarize,REPORT,RUNS};
