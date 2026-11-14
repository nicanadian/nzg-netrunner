'use strict';
const fs=require('node:fs'),path=require('node:path'),{fingerprint}=require('../engine/simulation/batch.cjs');
const root=path.resolve(__dirname,'..'),target=path.resolve(process.argv[2]||'builds/engine-dev');
if(target===root||!target.startsWith(path.join(root,'builds')+path.sep))throw Error('Engine package output must be inside builds/.');
fs.mkdirSync(target,{recursive:true});
for(const dir of ['engine','vendor/chiriboga','vendor/chiriboga-elevation']){
 const src=path.join(root,dir),dest=path.join(target,dir);fs.cpSync(src,dest,{recursive:true,filter:p=>fs.statSync(p).isDirectory()||/\.(js|cjs)$/.test(p)||/LICENSE|ORIGIN/.test(path.basename(p))});
}
fs.mkdirSync(path.join(target,'scripts'),{recursive:true});fs.copyFileSync(path.join(root,'scripts/netrunner.cjs'),path.join(target,'scripts/netrunner.cjs'));
for(const name of ['LICENSE','NOTICE.md'])fs.copyFileSync(path.join(root,name),path.join(target,name));
fs.writeFileSync(path.join(target,'package.json'),JSON.stringify({name:'netrunner-offline-engine',version:'0.1.0-dev',private:true,license:'GPL-3.0-only',engines:{node:'>=22'},scripts:{engine:'node scripts/netrunner.cjs'}},null,2)+'\n');
fs.writeFileSync(path.join(target,'build-info.json'),JSON.stringify({engineHash:fingerprint(),createdAt:new Date().toISOString(),requires:'Node.js >=22',networkRequired:false,policy:'Native baseline; hidden-information and Elevation certification pending.'},null,2)+'\n');
fs.copyFileSync(path.join(root,'docs/offline-engine.md'),path.join(target,'README.md'));
fs.copyFileSync(path.join(root,'docs/offline-engine-performance.md'),path.join(target,'offline-engine-performance.md'));
console.log(target);
