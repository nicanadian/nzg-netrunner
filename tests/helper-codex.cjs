'use strict';
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events'),{PassThrough,Writable}=require('node:stream');
const codex=require('../server/codex.cjs'),helper=require('../server/helper.cjs');
function fixture({account='chatgpt',failed=false,hang=false,spawnError=false}={}){
  const calls=[],replies=[];let child,options,args;
  const spawnImpl=(binary,argv,opts)=>{
    args=argv;options=opts;child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();
    const emit=message=>child.stdout.write(JSON.stringify(message)+'\n');
    child.kill=()=>{child.killed=true;queueMicrotask(()=>child.emit('exit',0));};
    child.stdin=new Writable({write(chunk,encoding,done){
      const message=JSON.parse(chunk.toString());
      if(!message.method){replies.push(message);done();return;}
      calls.push(message);
      let result={};
      if(message.method==='account/read')result={account:account ? {type:account} : null};
      if(message.method==='model/list')result={data:[{model:'available-default',isDefault:true}]};
      if(message.method==='config/read')result={config:{mcp_servers:{privateService:{url:'PRIVATE_CONNECTION'}},plugins:{'example@local':{enabled:true}}}};
      if(message.method==='thread/start')result={thread:{id:'ephemeral-test'}};
      if(message.method==='turn/start'){
        if(hang){done();return;}
        // Completion intentionally precedes the RPC response.
        emit({method:'item/completed',params:{threadId:'unrelated',item:{type:'agentMessage',id:'wrong',text:'Wrong conversation'}}});
        emit({method:'item/completed',params:{threadId:'ephemeral-test',item:{type:'agentMessage',id:'draft',phase:'commentary',text:'Not final'}}});
        const item={type:'agentMessage',id:'final',phase:'final_answer',text:'Leech remains installed with zero counters.'};
        emit({method:'item/completed',params:{threadId:'ephemeral-test',item}});
        emit({id:99,method:'item/commandExecution/requestApproval',params:{threadId:'ephemeral-test'}});
        emit({method:'turn/completed',params:{threadId:'ephemeral-test',turn:{status:failed?'failed':'completed',items:[item],error:failed?{message:'PRIVATE_UPSTREAM_SECRET'}:null}}});
      }
      if(message.id!==undefined)emit({id:message.id,result});
      done();
    }});
    if(spawnError)queueMicrotask(()=>child.emit('error',new Error('PRIVATE_BINARY_PATH')));
    return child;
  };
  return {spawnImpl,calls,replies,get child(){return child;},get options(){return options;},get args(){return args;}};
}
async function main(){
  const f=fixture();
  let packet;
  const result=await helper.answer({question:'Explain Leech',context:{cards:[{number:30008,title:'Leech',counters:{virus:0}},{hidden:true,title:'PRIVATE_HIDDEN_CARD'}],seed:'PRIVATE_SEED'},messages:[{role:'system',content:'PRIVATE_ROLE'},{role:'user',content:'What is a virus?'}]},
    {env:{HELPER_PROVIDER:'codex',OPENAI_API_KEY:'PRIVATE_API_KEY'},codexImpl:{answer:async(data,env)=>{packet=data;return codex.answer(data,env,{spawnImpl:f.spawnImpl});}}});
  assert.equal(result.mode,'ai');assert.equal(result.provider,'codex');assert.equal(result.model,'available-default');
  assert.equal(result.text,'Leech remains installed with zero counters.');
  assert.ok(!JSON.stringify(packet).includes('PRIVATE_'));
  assert.equal(f.options.env.OPENAI_API_KEY,undefined);
  assert.ok(!f.options.cwd.includes('repos/netrunner-game'));
  assert.ok(f.args.includes('features.shell_tool=false'));assert.ok(f.args.includes('features.apps=false'));assert.ok(f.args.includes('features.hooks=false'));
  const start=f.calls.find(c=>c.method==='thread/start').params;
  assert.equal(start.ephemeral,true);assert.equal(start.sandbox,'read-only');assert.equal(start.approvalPolicy,'never');
  assert.deepEqual(start.environments,[]);assert.deepEqual(start.dynamicTools,[]);
  assert.equal(start.config['mcp_servers.privateService.enabled'],false);
  assert.equal(start.config['plugins.example@local.enabled'],false);
  assert.equal(f.replies[0].error.code,-32601,'Unsupported approval/tool requests are rejected');
  assert.equal(f.child.killed,true);
  const noAuth=fixture({account:'apiKey'});
  await assert.rejects(codex.connection({},noAuth),e=>e.status===503);
  assert.ok(!noAuth.calls.some(c=>c.method==='turn/start'),'API-key sign-in cannot silently replace subscription access');
  const failed=fixture({failed:true});
  await assert.rejects(codex.answer({instructions:'Tutor',packet:'{}',history:[],question:'Help'},{},failed),e=>e.status===502&&!e.message.includes('PRIVATE_'));
  const timeout=fixture({hang:true});
  await assert.rejects(codex.answer({instructions:'Tutor',packet:'{}',history:[],question:'Help'},{},{...timeout,timeoutMs:30}),e=>e.status===504);
  assert.equal(timeout.child.killed,true);
  const missing=fixture({spawnError:true});
  await assert.rejects(codex.connection({},missing),e=>e.status===503&&!e.message.includes('PRIVATE_'));
  assert.equal(helper.status({}).configured,false,'Codex remains opt-in');
  console.log('Codex helper: subscription-only auth, visible-context redaction, ephemeral isolated RPC, disabled tools, completion races, failures and cleanup pass.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
