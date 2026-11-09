'use strict';
// Uses the pinned checkout prepared by npm run test:jinteki.
const fs=require('node:fs'),path=require('node:path');
const {spawn,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),runtime=path.join(root,'tmp/jinteki-runtime');
const upstream=path.join(runtime,'upstream'),pidFile=path.join(runtime,'server.pid');
const mongo='netrunner-jinteki-gateway-mongo',url='http://localhost:1042/local';
const env={...process.env,LEIN_HOME:path.join(runtime,'lein-home'),
  MONGO_CONNECTION_URI:'mongodb://127.0.0.1:27018/netrunner_gateway_local'};
if(!env.JAVA_HOME&&fs.existsSync('/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home'))
  env.JAVA_HOME='/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home';
env.PATH=[runtime,env.JAVA_HOME&&path.join(env.JAVA_HOME,'bin'),env.PATH].filter(Boolean).join(path.delimiter);
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function command(bin,args,{cwd=root,allowFailure=false,log}={}){
  const fd=log?fs.openSync(path.join(runtime,log),'a'):null;
  const r=spawnSync(bin,args,{cwd,env,encoding:'utf8',stdio:fd===null?'pipe':['ignore',fd,fd]});
  if(fd!==null)fs.closeSync(fd);
  if((r.error||r.status!==0)&&!allowFailure)throw r.error||Error(`${bin} failed: ${r.stderr||'see '+log}`);
  return r;
}
async function live(){
  try{const r=await fetch(url,{signal:AbortSignal.timeout(1500)});return r.ok&&(await r.text()).includes('local Gateway games');}
  catch{return false;}
}
async function stop(){
  if(fs.existsSync(pidFile)){
    const pid=Number(fs.readFileSync(pidFile,'utf8'));
    const ps=command('ps',['-p',String(pid),'-o','command='],{allowFailure:true});
    if(ps.status===0){
      if(!ps.stdout.includes(path.join(runtime,'lein')))throw Error('Recorded PID belongs to a different process; refusing to stop it');
      process.kill(-pid,'SIGTERM');
      for(let i=0;i<30&&await live();i++)await delay(500);
    }
    fs.rmSync(pidFile,{force:true});
  }
}
async function main(){
  if(process.argv.includes('--stop')){
    await stop();command('docker',['stop',mongo],{allowFailure:true});console.log('Local Jinteki stopped. Database files retained.');return;
  }
  if(process.argv.includes('--restart'))await stop();
  if(await live()){console.log(`Local Jinteki is already running: ${url}`);return;}
  if(!fs.existsSync(path.join(upstream,'project.clj')))throw Error('Prepare the pinned checkout first with npm run test:jinteki');
  let docker=command('docker',['info','--format','{{.ServerVersion}}'],{allowFailure:true});
  if(docker.status!==0&&process.platform==='darwin'){
    command('open',['-a','Docker']);
    for(let i=0;i<60&&docker.status!==0;i++){
      await delay(1000);docker=command('docker',['info','--format','{{.ServerVersion}}'],{allowFailure:true});
    }
  }
  if(docker.status!==0)throw Error('Start Docker Desktop and rerun this command');
  const info=command('docker',['inspect',mongo],{allowFailure:true});
  fs.mkdirSync(path.join(runtime,'mongo-data'),{recursive:true});
  if(info.status!==0)command('docker',['run','-d','--name',mongo,'-p','127.0.0.1:27018:27017',
    '-v',`${path.join(runtime,'mongo-data')}:/data/db`,'mongo:8.2.11']);
  else command('docker',['start',mongo]);
  for(let i=0;i<30;i++){
    const ready=command('docker',['exec',mongo,'mongosh','--quiet','--eval','db.adminCommand({ping:1}).ok'],{allowFailure:true});
    if(ready.status===0)break;if(i===29)throw Error('Local database did not become ready');await delay(1000);
  }
  const images=path.join(upstream,'resources/public/img/cards/en/default/stock');fs.mkdirSync(images,{recursive:true});
  for(const name of fs.readdirSync(path.join(root,'assets/cards-hires')).filter(n=>/^300\d+\.png$/.test(n)))
    fs.copyFileSync(path.join(root,'assets/cards-hires',name),path.join(images,name));
  const frontendChanged=require('./prepare-frontend.cjs').prepare();
  if(frontendChanged||!fs.existsSync(path.join(upstream,'resources/public/js/main.js'))){
    console.log('Building the Jinteki frontend.');
    command('npm',['ci'],{cwd:upstream,log:'frontend-install.log'});
    command('npm',['run','css:build'],{cwd:upstream,log:'css-build.log'});
    command('npm',['run','cljs:build'],{cwd:upstream,log:'cljs-build.log'});
  }
  const lein=path.join(runtime,'lein');
  if(!fs.existsSync(path.join(runtime,'web-database-seeded'))){
    console.log('Loading card metadata and local Gateway artwork.');
    command(lein,['fetch','--no-card-images','--branch',require('../jinteki-comparison/pins.json').cardData],
      {cwd:upstream,log:'database-seed.log'});
    fs.writeFileSync(path.join(runtime,'web-database-seeded'),'netrunner_gateway_local');
  }
  const ns=path.join(upstream,'test/clj/local');fs.mkdirSync(ns,{recursive:true});
  fs.copyFileSync(path.join(__dirname,'gateway.clj'),path.join(ns,'gateway.clj'));
  const fd=fs.openSync(path.join(runtime,'server.log'),'w');
  const child=spawn(lein,['run','-m','local.gateway'],{cwd:upstream,env,detached:true,stdio:['ignore',fd,fd]});
  child.unref();fs.closeSync(fd);fs.writeFileSync(pidFile,String(child.pid));
  for(let i=0;i<90;i++){
    await delay(1000);
    if(await live()){
      const log=fs.readFileSync(path.join(runtime,'server.log'),'utf8');
      if(log.includes('LOCAL_GATEWAY_READY')){console.log(`Ready: ${url}`);return;}
    }
  }
  throw Error(`Server did not become ready. See ${path.join(runtime,'server.log')}`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
