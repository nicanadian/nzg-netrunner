'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {once} = require('node:events');
const {setTimeout: delay} = require('node:timers/promises');
async function smoke(executable, args = [], expectedBuild = 'alpha-build-1') {
  const child = spawn(executable,[...args,'--no-browser','--port','0','--json'],{cwd:require('node:os').tmpdir(),env:{...process.env,HELPER_PROVIDER:'reference'},stdio:['ignore','pipe','pipe']});
  let output='', errors=''; let result;
  child.stdout.on('data',x=>{output+=x;});child.stderr.on('data',x=>{errors+=x;});
  const exited = once(child,'exit');
  try {
    for(let attempt=0;attempt<200;attempt++) {
      const line=output.split('\n').find(x=>x.startsWith('{'));
      if(line){result=JSON.parse(line);break;}
      if(child.exitCode!==null) throw Error(`Exited before startup: ${child.exitCode} ${errors}`);
      await delay(50);
    }
    assert(result,`No launch URL: ${errors}`);assert.equal(result.build,expectedBuild);
    const origin=new URL(result.url).origin;
    const health=await (await fetch(`${origin}/_local-table/health`)).json();assert.equal(health.appId,'nzg-netrunner-local-table');
    const launch=await (await fetch(result.url)).text();assert.match(launch,/Quit game/);
    const token=launch.match(/'X-Local-Table-Token':"([a-f0-9]+)"/)?.[1];assert(token);
    for(const file of ['/','/app/table.js','/app/table.css','/engine/worker.js','/vendor/chiriboga/mechanics.js','/assets/cards-display/30001-743.webp','/assets/cards-hires/30001.png','/assets/playmat.png','/assets/card-data.json','/README.md']) {
      const response=await fetch(origin+file);assert.equal(response.status,200,file);assert((await response.arrayBuffer()).byteLength>0,file);
    }
    const status=await(await fetch(origin+'/api/helper')).json();assert.equal(status.configured,false);
    const help=await fetch(origin+'/api/helper',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({question:'What does Cleaver do?',context:{}})});assert.equal(help.status,200);assert.match(await help.text(),/Cleaver/i);
    assert.equal((await fetch(origin+'/.env.local')).status,403);
    assert.equal((await fetch(origin+'/server/helper.cjs')).status,403);
    assert.equal((await fetch(origin+'/_local-table/quit',{method:'POST',headers:{Origin:'https://example.org','X-Local-Table-Token':token}})).status,403);
    assert.equal((await fetch(origin+'/_local-table/quit',{method:'POST',headers:{Origin:origin}})).status,403);
    assert.equal((await fetch(origin+'/_local-table/quit')).status,403);
    // A second launch must reuse this server rather than changing the save origin.
    const repeat=spawn(executable,[...args,'--no-browser','--port',new URL(origin).port,'--json'],{cwd:require('node:os').tmpdir(),stdio:['ignore','pipe','pipe']});
    let repeatOutput='';repeat.stdout.on('data',x=>{repeatOutput+=x;});
    const [repeatCode]=await once(repeat,'exit');assert.equal(repeatCode,0);assert.equal(JSON.parse(repeatOutput).reused,true);
    const response=await fetch(origin+'/_local-table/quit',{method:'POST',headers:{Origin:origin,'X-Local-Table-Token':token}});assert.equal(response.status,200);await response.text();
    const [code]=await Promise.race([exited,delay(10000,undefined,{ref:false}).then(()=>{throw Error('Launcher did not stop after Quit');})]);assert.equal(code,0,errors);
    console.log(`PASS ${expectedBuild}: startup, assets, offline guide, repeat launch, protected shutdown (${process.platform}/${process.arch})`);
  } finally { if(child.exitCode===null) child.kill(); }
}
module.exports={smoke};
if(require.main===module){
  if(!process.argv[2])throw Error('Usage: node scripts/smoke-release.cjs /path/to/LocalTable[.exe]');
  smoke(path.resolve(process.argv[2])).catch(error=>{console.error(error);process.exitCode=1;});
}
