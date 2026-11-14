'use strict';
const assert=require('node:assert/strict');
const {bootstrap}=require('../scripts/experiments/corp-revisions.cjs');
// Opposite outcomes in the same seed cancel at the seed-cluster level;
// treating the individual matchups as independent would invent variance.
assert.deepEqual(bootstrap([0,0,0],{replicates:1000}).interval,[0,0]);
assert.deepEqual(bootstrap([1/3,1/3,1/3],{replicates:1000}).interval,[1/3,1/3]);
const positive=bootstrap([1/3,2/3,1,1/3,2/3],{replicates:2000});
assert(positive.interval[0]>0&&positive.interval[1]<=1);
assert.deepEqual(bootstrap([-1,0,1],{replicates:1000}),bootstrap([-1,0,1],{replicates:1000}));
console.log('PASS deterministic seed-cluster bootstrap, within-seed cancellation and bounded positive effect.');
