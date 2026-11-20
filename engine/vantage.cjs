'use strict';
// Requiring the preview leaves the default validator and catalog untouched.
const base=require('./card-catalog.js'),extension=require('./vantage-catalog.js');
const catalog={...base,pools:['gateway-v1','core-v1','vantage-preview-v1'],cards:{...base.cards,...extension.cards},coverage:{...base.coverage,...extension.coverage}};
const documents=require('./deck-document.js').withCatalog(catalog);
const profile=Object.freeze({engine:'local-vantage-preview-3',rulesVersion:'26.03-vantage-3',supportedRules:['26.03-vantage-1','26.03-vantage-2','26.03-vantage-3'],engines:{'26.03-vantage-1':'local-vantage-preview-1','26.03-vantage-2':'local-vantage-preview-2','26.03-vantage-3':'local-vantage-preview-3'},cardPool:'vantage-preview-v1'});
module.exports={catalog,documents,profile,decks:require('./vantage-decks.js')};
