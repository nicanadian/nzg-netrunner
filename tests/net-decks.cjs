'use strict';const assert=require('node:assert/strict'),net=require('../engine/net-decks.js'),docs=require('../engine/deck-document.js');
assert.equal(net.catalog.length,21);assert.equal(new Set(net.catalog.map(d=>d.identity)).size,21);const ids=new Set();
for(const deck of net.catalog){const v=docs.validate(deck.document);assert(v.valid,deck.name+JSON.stringify(v.errors));assert.equal(v.aiCertified,false);assert.equal(deck.document.source.provider,'NetrunnerDB v2 public');assert(deck.document.source.author);assert(Object.isFrozen(deck.document));ids.add(deck.identity);for(const [id]of deck.cards)ids.add(id);}
for(let id=35001;id<=35082;id++)assert(ids.has(id),'Official sample pool includes '+id);
console.log('PASS 21 bundled official net-decks: unique Core identities, exact validated lists, source/author snapshots, immutable data, all 82 Elevation cards represented; AI certification withheld.');
