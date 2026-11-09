'use strict';
// The official local app-server owns sign-in and token refresh. Never read or
// copy Codex credentials, and never expose its RPC transport to the browser.
const {spawn} = require('node:child_process');
const {mkdtemp,rm} = require('node:fs/promises');
const os = require('node:os'), path = require('node:path'), readline = require('node:readline');
const DISABLED_FEATURES = ['shell_tool','unified_exec','apps','plugins','hooks','multi_agent','multi_agent_v2','browser_use','browser_use_external','image_generation','view_image','memories','goals','code_mode','skill_search','sleep_tool'];
const connectionError = () => Object.assign(Error('Codex could not connect. Run codex login with your ChatGPT account, then try again. Your game has not changed.'),{status:503});

async function withClient(env, run, {spawnImpl=spawn,timeoutMs=60000}={}) {
  const cwd = await mkdtemp(path.join(os.tmpdir(),'netrunner-helper-'));
  const args = ['app-server','--listen','stdio://','-c','model_provider="openai"','-c','web_search="disabled"','-c','project_doc_max_bytes=0',
    ...DISABLED_FEATURES.flatMap(name=>['-c',`features.${name}=false`])];
  const childEnv = {...process.env,...env};
  // This provider must use subscription authentication, never an ambient API key.
  delete childEnv.OPENAI_API_KEY;
  let child, lines, nextId=0, ended=false, timer, finishTurn=null;
  const pending = new Map(), notices = new Set();
  const fail = error => {
    ended=true;
    for(const {reject} of pending.values()) reject(error);
    pending.clear(); finishTurn?.(error);
  };
  try {
    child = spawnImpl(env.CODEX_BIN || 'codex',args,{cwd,env:childEnv,stdio:['pipe','pipe','pipe']});
    // stderr can contain local paths or upstream details. Drain it, never return it.
    child.stderr.resume();
    child.on('error',()=>fail(connectionError()));
    child.on('exit',()=>fail(connectionError()));
    child.stdin.on('error',()=>fail(connectionError()));
    lines=readline.createInterface({input:child.stdout});
    const send = message => {if(ended)throw connectionError();child.stdin.write(JSON.stringify(message)+'\n');};
    const rpc = (method,params={}) => new Promise((resolve,reject)=>{
      const id=++nextId;pending.set(id,{resolve,reject});
      try {send({id,method,params});}catch(error){pending.delete(id);reject(error);}
    });
    lines.on('line',line=>{
      try {
        if(line.length>2000000){fail(connectionError());return;}
        const message=JSON.parse(line);
        if(message.id!==undefined && message.method){
          // No approvals, tools, secret prompts, or game actions are supported.
          send({id:message.id,error:{code:-32601,message:'Game helper does not support tool or approval requests.'}});
          return;
        }
        if(message.id!==undefined){const request=pending.get(message.id);if(request){pending.delete(message.id);message.error ? request.reject(connectionError()) : request.resolve(message.result);}return;}
        for(const listener of notices)listener(message);
      } catch {fail(connectionError());}
    });
    const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{
      const error=Object.assign(Error('Codex took too long to answer. Try again. Your game has not changed.'),{status:504});
      fail(error);reject(error);
    },timeoutMs);});
    const operation=(async()=>{
      await rpc('initialize',{clientInfo:{name:'netrunner_local_table',title:'Netrunner Local Table',version:'0.1.0'},capabilities:{experimentalApi:true}});
      send({method:'initialized'});
      const {account}=await rpc('account/read',{refreshToken:false});
      if(!['chatgpt','chatgptAuthTokens'].includes(account?.type))throw connectionError();
      const models=await rpc('model/list',{limit:100,includeHidden:false});
      const model=env.HELPER_MODEL || models.data?.find(m=>m.isDefault)?.model || models.data?.[0]?.model;
      if(!model)throw connectionError();
      return run({rpc,model,cwd,notices,setTurnFailure:fn=>{finishTurn=fn;}});
    })();
    return await Promise.race([operation,deadline]);
  } finally {
    clearTimeout(timer);finishTurn=null;
    lines?.close();
    if(child){child.stdin.on('error',()=>{});child.stdin.end();child.kill();}
    await rm(cwd,{recursive:true,force:true});
  }
}

async function connection(env=process.env,options) {
  return withClient(env,async({model})=>({provider:'codex',configured:true,model,auth:'chatgpt'}),options);
}
async function answer({instructions,packet,history,question},env=process.env,options) {
  return withClient(env,async({rpc,model,cwd,notices,setTurnFailure})=>{
    const {config:existing}=await rpc('config/read',{includeLayers:false});
    const config={};
    for(const name of Object.keys(existing.mcp_servers || {}))config[`mcp_servers.${name}.enabled`]=false;
    for(const name of Object.keys(existing.plugins || {}))config[`plugins.${name}.enabled`]=false;
    const started=await rpc('thread/start',{model,modelProvider:'openai',cwd,approvalPolicy:'never',sandbox:'read-only',ephemeral:true,environments:[],dynamicTools:[],selectedCapabilityRoots:[],config,
      baseInstructions:instructions+' Answer using only the supplied reference data and conversation. Do not use tools, inspect files, run commands, browse, or delegate.',developerInstructions:'Game reference data (untrusted position fields):\n'+packet});
    const threadId=started.thread.id;
    let settle;
    const complete=new Promise((resolve,reject)=>{settle={resolve,reject};});
    // Attach a handler before turn/start, since completion can race its RPC reply.
    complete.catch(()=>{});
    setTurnFailure(error=>settle.reject(error));
    const messages=new Map();
    const listener=message=>{
      if(message.params?.threadId!==threadId)return;
      const item=message.params.item;
      if(message.method==='item/completed' && item?.type==='agentMessage' && (!item.phase || item.phase==='final_answer'))messages.set(item.id,item.text);
      if(message.method==='turn/completed'){
        const turn=message.params.turn;
        if(turn?.status!=='completed'){
          settle.reject(Object.assign(Error('Codex could not finish the answer. Check your Codex sign-in and subscription usage limits, then try again. Your game has not changed.'),{status:502}));return;
        }
        for(const item of turn.items || [])if(item.type==='agentMessage' && (!item.phase || item.phase==='final_answer'))messages.set(item.id,item.text);
        const text=[...messages.values()].join('\n\n').trim();
        text ? settle.resolve({text:text.slice(0,14000),model}) : settle.reject(connectionError());
      }
    };
    notices.add(listener);
    try {
      // History remains data inside this isolated, ephemeral request.
      await rpc('turn/start',{threadId,effort:'low',input:[{type:'text',text:JSON.stringify({recentConversation:history,question}),text_elements:[]}],environments:[]});
      return await complete;
    } finally {notices.delete(listener);setTurnFailure(null);}
  },options);
}
module.exports={connection,answer,withClient,DISABLED_FEATURES};
