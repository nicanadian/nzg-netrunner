'use strict';
const assert=require('node:assert/strict');
(async()=>{
 const {continuationModel,receiptLabel,displayText,phaseHeading}=await import('../app/presentation.mjs');
 const state={side:'runner',playerTurn:'runner',runner:{clicks:2},phase:{title:'Lie Low',identifier:'Lie Low',source:'Lie Low'},decision:{commands:[{command:'continue',label:'Continue',options:[{index:0,label:'Draw 4 cards'}]}]}};
 assert.equal(continuationModel(state).label,'Draw 4 cards','Effect copy retains the actual action rather than a generic Finish label');
 const receipt=receiptLabel({label:'Install'},{label:'Project Ingatan → Remote 1'},state);
 assert.equal(displayText(receipt),'Install · Project Ingatan → Remote 2','Raw receipt crosses the display-number boundary once');
 assert.equal(phaseHeading({...state,phase:{title:"Corporation's Action Phase Ends",identifier:'Corp 2.3'}}),'Resolve end-of-action effects');
 console.log('PASS Core presentation: explicit effect labels, single remote-number formatting and end-action phase heading.');
})().catch(e=>{console.error(e);process.exitCode=1});
