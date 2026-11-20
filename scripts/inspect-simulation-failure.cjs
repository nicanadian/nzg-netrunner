'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
async function inspect(file,out){
 const original=JSON.parse(fs.readFileSync(file)),base=path.resolve(path.dirname(file),'..'),manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json')));
 const root=process.env.NR_INSPECT_CURRENT?path.resolve(__dirname,'..'):path.join(base,'runtime'),{createGame}=require(path.join(root,'engine/runtime.cjs')),profile=require(path.join(root,'engine/deck-profiles.cjs')).forPool(manifest.runner.pool);
 const g=createGame(profile.runtime),logs=[],trace=[],decisions=[],policyErrors=[];
 let latestPolicy=null;
 function simple(o){if(!o||typeof o!=='object')return o;return {label:o.label,card:o.card?.title,server:o.server?.serverName,host:o.host?.title,ability:o.ability?.text||o.ability?.alt,id:o.id,subroutine:o.subroutine?.text};}
 function preference(p){if(!p)return null;return Object.fromEntries(Object.entries(p).map(([k,v])=>[k,typeof v!=='object'||!v?v:v.title||v.serverName||simple(v)]));}
 for(const [owner,name]of [[require('node:vm').runInContext('CorpAI.prototype',g.context),'Choice'],[require('node:vm').runInContext('RunnerAI.prototype',g.context),'_internalChoiceDetermination']]){const original=owner[name];owner[name]=function(options,type){latestPolicy={player:this===g.context.corp.AI?'corp':'runner',phase:g.context.currentPhase.identifier,title:g.context.currentPhase.title,context:g.context.currentPhase.context?.title,contextNumber:g.context.currentPhase.context?.setNumber,ice:g.context.GetApproachEncounterIce()?.title,command:g.context.executingCommand,type,preferred:preference(this.preferred),options:options.map(simple)};return original.apply(this,arguments);};}
 const logError=g.context.LogError;g.context.LogError=function(message){policyErrors.push({message,call:latestPolicy});return logError.apply(this,arguments);};
 const consoleError=g.context.console.error;g.context.console.error=function(message){policyErrors.push({message:String(message),call:latestPolicy});return consoleError.apply(this,arguments);};
 const log=g.context.Log;g.context.Log=function(message){logs.push({turn:g.api.summary().turn,text:String(message)});return log.apply(this,arguments);};
 let error;try{
  g.api.boot({side:'runner',faceoff:true,simulationFast:manifest.mode!=='reference',aiPolicy:manifest.aiPolicy,seed:original.seed,rulesVersion:manifest.rulesVersion,cardPool:manifest.runner.pool,deckDocuments:{runner:manifest.runner,corp:manifest.corp}});
  while(!g.api.summary().terminal&&g.api.metrics().steps<manifest.limits.decisions)await g.api.advance(300,null,true,c=>{
   trace.push(c);const x=g.context,o=x.phaseOptions?.[c.command]?.[c.index];
   decisions.push({...c,phase:x.currentPhase.identifier,title:x.currentPhase.title,server:x.attackedServer?.serverName,approach:x.approachIce,ice:x.attackedServer?.ice.map(c=>({title:c.title,rezzed:c.rezzed})),
    option:o&&{label:o.label,button:o.button,card:o.card?.title,server:o.server?.serverName,ability:o.ability?.text||o.ability?.alt,subroutine:o.subroutine?.text}});
  });
 }catch(e){error=e.stack;}finally{g.close();}
 if(original.trace&&!process.env.NR_INSPECT_CURRENT)assert.equal(JSON.stringify(trace.slice(0,original.trace.length)),JSON.stringify(original.trace),'Instrumentation must preserve the original decision prefix');
 const result={file,seed:original.seed,engineHash:manifest.engineHash,error,terminal:g.api.summary().terminal,traceMatches:JSON.stringify(trace.slice(0,original.trace?.length))===JSON.stringify(original.trace),consoleErrors:g.errors,policyErrors,decisions:decisions.slice(-80),log:logs.slice(-160)};
 fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({error,decisions:result.decisions.slice(-14),log:result.log.slice(-22),policyErrors:result.policyErrors.slice(-5)},null,2));return result;
}
if(require.main===module)inspect(process.argv[2],process.argv[3]||'tmp/simulation-failure-debug.json').catch(e=>{console.error(e);process.exitCode=1});
module.exports={inspect};
