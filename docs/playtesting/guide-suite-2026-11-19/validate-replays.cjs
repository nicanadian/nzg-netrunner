'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../../..'),{createGame}=require(path.join(ROOT,'engine/runtime.cjs')),{forPool}=require(path.join(ROOT,'engine/deck-profiles.cjs'));
const inventory=require(path.join(ROOT,'docs/research/deck-audit-2026-11-16/inventory.json'));
const plain=value=>JSON.parse(JSON.stringify(value));
function difference(a,b){const aa=new Map(a.cards.map(c=>[c.id,c.count])),bb=new Map(b.cards.map(c=>[c.id,c.count]));return [...new Set([...aa.keys(),...bb.keys()])].map(id=>({id,before:aa.get(id)||0,after:bb.get(id)||0})).filter(c=>c.before!==c.after);}
(async()=>{const checks=[];for(const name of process.argv.slice(2).length?process.argv.slice(2):['beginner-game','constraints-game','dependency-game']){
 const saved=JSON.parse(fs.readFileSync(path.join(__dirname,name+'.json'))),session=saved.session,expected=saved.final;assert(session?.config&&session.choices?.length,name+' missing actual game session');assert(expected?.terminal?.winner,name+' not a complete game');
 const pool=session.config.cardPool||'gateway-v1',api=forPool(pool).documents,decks=session.config.deckDocuments;assert(decks,name+' missing exact custom documents');
 const construction=Object.entries(decks).map(([side,doc])=>{const v=api.validate(doc);assert(v.valid,name+' '+side+': '+JSON.stringify(v.errors));const candidates=inventory.rows.filter(d=>d.pool===pool&&d.side===side&&d.document.identity===doc.identity).map(d=>({id:d.id,delta:difference(d.document,doc)})).sort((a,b)=>a.delta.reduce((s,d)=>s+Math.abs(d.before-d.after),0)-b.delta.reduce((s,d)=>s+Math.abs(d.before-d.after),0));return {side,name:doc.name,valid:v.valid,totals:v.totals,nearestBundledSnapshot:candidates[0]};});
 const g=createGame({core:pool==='core-v1',vantage:pool==='vantage-preview-v1'});try{
 g.api.boot(session.config);let state=await g.api.advance();for(const choice of session.choices){assert.equal(state.version,choice.version,name+' decision '+choice.version);g.api.choose(choice);state=await g.api.advance();}
 assert.deepEqual(plain(state.terminal),expected.terminal);assert.equal(state.version,expected.version);assert.equal(state.corp.points,expected.points.corp);assert.equal(state.runner.points,expected.points.runner);assert.equal(state.diagnostics.length,0);assert.deepEqual(g.errors,[]);
 checks.push({name,pool,construction,decisions:session.choices.length,terminal:expected.terminal,points:expected.points,version:state.version,diagnostics:plain(state.diagnostics),replayPassed:true});console.log('PASS '+name+' · '+session.choices.length+' native decisions · '+expected.terminal.reason);
 }finally{g.close();}
 }
 fs.writeFileSync(path.join(__dirname,'replay-validation.json'),JSON.stringify(checks,null,2)+'\n');})().catch(error=>{console.error(error);process.exitCode=1;});
