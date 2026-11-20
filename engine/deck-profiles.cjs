'use strict';
const documents=require('./deck-document.js');
function forPool(pool){
 if(pool==='vantage-preview-v1'){
  const vantage=require('./vantage.cjs');
  return {documents:vantage.documents,rulesVersion:vantage.profile.rulesVersion,runtime:{vantage:true}};
 }
 if(pool!==undefined&&!['gateway-v1','core-v1'].includes(pool))throw Error('Unsupported card pool.');
 return {documents,rulesVersion:pool==='core-v1'?'26.03-core-2':'26.03-local-2',runtime:{core:pool==='core-v1'}};
}
module.exports={forPool};
