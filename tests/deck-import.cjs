'use strict';const assert=require('node:assert/strict');
const importer=require('../engine/deck-import.js'),docs=require('../engine/deck-document.js'),core=require('../engine/core-decks.js'),fixture=require('./fixtures/decks/nrdb-core-phoenix.json');
const imported=importer.fromNRDB(fixture,'https://netrunnerdb.com/en/decklist/'+fixture.data[0].uuid);
assert.equal(docs.contentKey(imported),docs.contentKey({...core.catalog[0],pool:'core-v1'}));assert.equal(imported.source.author,'Girometics');assert(!Object.hasOwn(imported,'description'));
for(const url of ['https://evil.com/en/decklist/123','http://netrunnerdb.com/en/decklist/123','https://netrunnerdb.com/en/deck/view/123','https://netrunnerdb.com.evil.com/en/decklist/123'])assert.throws(()=>importer.endpoint(url));
for(const payload of [{},{data:[]},{data:[{}]},{data:[{cards:[]}]}])assert.throws(()=>importer.fromNRDB(payload,''));
assert.throws(()=>importer.fromNRDB({data:[{cards:{35001:2,30030:3}}]},''),/one supported identity/);
console.log('PASS NRDB public importer: actual v2 payload, exact official list, provenance, unknown/malformed responses and URL restrictions.');
