'use strict';
const fs=require('node:fs'),path=require('node:path');
const catalog=require('../engine/card-catalog.js'),plan=require('../docs/plans/elevation-82-card-tests.json'),{createGame}=require('../engine/runtime.cjs');
const runtime=createGame({core:true});
try{
 const report={schemaVersion:1,scope:'Elevation 35001–35082',notice:'Definitions and partial fixtures are not full rules, AI or UI certification.',cards:plan.cards.map(c=>({id:c.id,title:c.title,definition:!!runtime.context.cardSet[c.id],metadata:!!catalog.cards[c.id],art:fs.existsSync(path.join(__dirname,`../assets/cards-display/${c.id}-743.webp`)),rules:c.rulesStatus,ai:c.aiStatus,evidence:c.evidence,remainingScenarios:c.scenarioFocus}))};
 if(report.cards.length!==82||new Set(report.cards.map(c=>c.id)).size!==82||report.cards.some((c,i)=>Number(c.id)!==35001+i))throw Error('Coverage must contain each Elevation card exactly once.');
 if(report.cards.some(c=>c.definition!==catalog.coverage[c.id].definition))throw Error('Definition registry disagrees with actual runtime.');
 report.totals={cards:82,definitions:report.cards.filter(c=>c.definition).length,metadata:report.cards.filter(c=>c.metadata).length,art:report.cards.filter(c=>c.art).length,withPartialEvidence:report.cards.filter(c=>c.evidence.length).length,fullyCertified:0};
 const target=process.argv[2];if(target)fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.totals,null,2));
}finally{runtime.close();}
