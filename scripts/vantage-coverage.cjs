'use strict';
const fs=require('node:fs'),{createGame}=require('../engine/runtime.cjs'),{cards,coverage}=require('../engine/vantage-catalog.js');
const plan=require('../docs/plans/vantage-card-tests.json'),game=createGame({vantage:true});
try{
 const report={schemaVersion:1,scope:'Vantage Point 36001–36066',notice:'Definitions and partial native fixtures do not certify full rules, UI or AI support.',cards:plan.cards.map(c=>({id:c.id,title:c.title,definition:!!game.context.cardSet[c.id],rules:coverage[c.id].rules,ui:coverage[c.id].ui,ai:coverage[c.id].ai,evidence:c.evidence,requiredScenarios:c.requiredScenarios}))};
 if(report.cards.length!==66||report.cards.some(c=>c.definition!==coverage[c.id].definition||!cards[c.id]))throw Error('Vantage runtime/catalog/inventory disagree.');
 report.totals={cards:66,definitions:report.cards.filter(c=>c.definition).length,withPartialNativeEvidence:report.cards.filter(c=>c.rules==='partial').length,uiQualified:0,aiCertified:0,fullyCertified:0};
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report.totals,null,2));
}finally{game.close();}
