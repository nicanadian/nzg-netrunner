'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'Netrunner offline Ω '));
try{
 const build=spawnSync(process.execPath,['scripts/build-engine-package.cjs'],{encoding:'utf8'});assert.equal(build.status,0,build.stderr);
 const target=path.join(temp,'engine game');fs.cpSync('builds/engine-dev',target,{recursive:true});assert(!fs.existsSync(path.join(target,'node_modules')));assert(!fs.existsSync(path.join(target,'app')));assert(!fs.existsSync(path.join(target,'assets')));
 assert(fs.existsSync(path.join(target,'engine/simulation/search-optimizations.js')));assert(fs.existsSync(path.join(target,'offline-engine-performance.md')));
 const args=['scripts/netrunner.cjs','simulate','--out',path.join(temp,'results')];
 const sandbox=process.platform==='darwin'&&fs.existsSync('/usr/bin/sandbox-exec');
 const result=sandbox?spawnSync('/usr/bin/sandbox-exec',['-p','(version 1)(allow default)(deny network*)',process.execPath,...args],{cwd:target,encoding:'utf8',timeout:30000}):spawnSync(process.execPath,args,{cwd:target,encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stderr||result.error?.message);const summary=JSON.parse(fs.readFileSync(path.join(temp,'results/summary.json')));assert.equal(summary.statuses.completed,1);
 const files=fs.readdirSync(path.join(temp,'results/jobs'));const replay=spawnSync(process.execPath,['scripts/netrunner.cjs','replay',path.join(temp,'results/jobs',files[0])],{cwd:target,encoding:'utf8',timeout:30000});assert.equal(replay.status,0,replay.stderr);assert.match(replay.stdout,/PASS deterministic replay/);
 console.log('PASS portable offline package: Unicode/spaced path, no dependencies/UI/art/server; complete native match and pinned-source replay'+(sandbox?', OS network access denied.':'. Network-denied qualification needs a platform-specific sandbox.'));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
