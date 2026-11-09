'use strict';
// Requires Node 22+, curl, tar and Java 21+. No Docker, database or card art.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),pins=require('./pins.json');
const runtime=path.join(root,'tmp/jinteki-runtime'),upstream=path.join(runtime,'upstream');
const output=path.join(root,'eval/jinteki-comparison');
fs.mkdirSync(runtime,{recursive:true});fs.mkdirSync(output,{recursive:true});
const env={...process.env,LEIN_HOME:path.join(runtime,'lein-home')};
if(!env.JAVA_HOME){
  for(const candidate of ['/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home',
    '/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home']){
    if(fs.existsSync(path.join(candidate,'bin/java'))){env.JAVA_HOME=candidate;break;}
  }
}
function command(binary,args,{cwd=root,log,allowFailure=false}={}){
  const fd=log?fs.openSync(log,'w'):null;
  const result=spawnSync(binary,args,{cwd,env,stdio:fd===null?'inherit':['ignore',fd,fd]});
  if(fd!==null)fs.closeSync(fd);
  if(result.error||result.status!==0){
    if(log)process.stderr.write(fs.readFileSync(log,'utf8'));
    if(!allowFailure)throw result.error||new Error(`${binary} exited ${result.status}`);
  }
  return result.status;
}
function download(url,destination){command('curl',['-fsSL','--retry','2',url,'-o',destination]);}
function hash(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
try{
  const java=env.JAVA_HOME?path.join(env.JAVA_HOME,'bin/java'):'java';
  command(java,['-version']);
  const marker=path.join(runtime,'upstream-commit');
  if(!fs.existsSync(marker)||fs.readFileSync(marker,'utf8')!==pins.jinteki){
    if(fs.existsSync(upstream)){
      // Preserve any existing checkout rather than overwriting local work.
      fs.renameSync(upstream,path.join(runtime,`upstream-preserved-${Date.now()}`));
    }
    const archive=path.join(runtime,'upstream.tar.gz');
    download(`https://codeload.github.com/mtgred/netrunner/tar.gz/${pins.jinteki}`,archive);
    fs.mkdirSync(upstream);command('tar',['-xzf',archive,'--strip-components=1','-C',upstream]);
    fs.writeFileSync(marker,pins.jinteki);
  }
  const lein=path.join(runtime,'lein');
  download(`https://raw.githubusercontent.com/technomancy/leiningen/${pins.leiningen}/bin/lein`,lein);
  fs.chmodSync(lein,0o755);
  const dataMarker=path.join(runtime,'data-commit');
  if(!fs.existsSync(dataMarker)||fs.readFileSync(dataMarker,'utf8')!==pins.cardData){
    console.log('Preparing pinned card metadata (no database or images).');
    command(lein,['fetch','--no-db','--no-card-images','--branch',pins.cardData],
      {cwd:upstream,log:path.join(runtime,'fetch.log')});
    fs.writeFileSync(dataMarker,pins.cardData);
  }
  const testDir=path.join(upstream,'test/clj/comparison');fs.mkdirSync(testDir,{recursive:true});
  fs.copyFileSync(path.join(__dirname,'scenarios.clj'),path.join(testDir,'scenarios.clj'));
  // Never compare stale successful output after a failed engine launch.
  for(const name of ['jinteki.json','local.json','report.json']){
    fs.rmSync(path.join(output,name),{force:true});
  }
  const provenance={pins,javaHome:env.JAVA_HOME||null,
    cardsSha256:hash(path.join(upstream,'data/cards.edn')),
    localVendorSha256:Object.fromEntries(['phase.js','mechanics.js','utility.js','sets/systemgateway.js']
      .map(file=>[file,hash(path.join(root,'vendor/chiriboga',file))])),
    localAdapterSha256:hash(path.join(root,'engine/adapter.js')),
    jintekiScenarioSha256:hash(path.join(__dirname,'scenarios.clj')),
    localScenarioSha256:hash(path.join(__dirname,'local.cjs'))};
  fs.writeFileSync(path.join(output,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');
  console.log('Running matched Jinteki scenarios.');
  const referenceStatus=command(lein,['run','-m','comparison.scenarios',path.join(output,'jinteki.json')],
    {cwd:upstream,log:path.join(output,'jinteki-output.txt'),allowFailure:true});
  console.log('Running matched Local Table scenarios.');
  const localStatus=command(process.execPath,[path.join(__dirname,'local.cjs'),path.join(output,'local.json')],{allowFailure:true});
  const comparisonStatus=command(process.execPath,[path.join(__dirname,'compare.cjs')],{allowFailure:true});
  process.exitCode=referenceStatus||localStatus||comparisonStatus;
}catch(error){console.error(error);process.exitCode=1;}
