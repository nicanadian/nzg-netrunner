/* Explicit opt-in metadata/profile. Never loaded by Gateway or Core workers. */
(function(){
'use strict';
const base=globalThis.NRCardCatalog,extension=globalThis.NRVantageCatalog;
if(!base||!extension)throw Error('Load base and Vantage catalogs before the preview profile.');
globalThis.NRCardCatalog={...base,pools:['gateway-v1','core-v1','vantage-preview-v1'],cards:{...base.cards,...extension.cards},coverage:{...base.coverage,...extension.coverage}};
globalThis.NRVantagePreview=Object.freeze({engine:'local-vantage-preview-3',rulesVersion:'26.03-vantage-3',supportedRules:['26.03-vantage-1','26.03-vantage-2','26.03-vantage-3'],engines:{'26.03-vantage-1':'local-vantage-preview-1','26.03-vantage-2':'local-vantage-preview-2','26.03-vantage-3':'local-vantage-preview-3'},cardPool:'vantage-preview-v1',notice:'Partial card support; rules/UI/AI certification pending.'});
})();
