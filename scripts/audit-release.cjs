'use strict';
// Verify generated archives against their exact committed source before publication.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const walk=(dir,prefix='')=>fs.readdirSync(dir,{withFileTypes:true}).filter(e=>!e.name.startsWith('.')).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name),prefix+e.name+'/'):[prefix+e.name]);
function audit(directory){
 directory=path.resolve(directory);const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'))),head=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 assert.equal(manifest.build,require('../package.json').version);assert.equal(manifest.sourceCommit,head);assert.equal(manifest.dirty,false,'Release source must be committed');
 assert.deepEqual(manifest.packages.map(p=>p.target).sort(),['linux-x64','macos-arm64','macos-x64','windows-x64']);
 const gamePaths=['index.html','app','engine','vendor/chiriboga','vendor/chiriboga-elevation','assets','README.md','LICENSE','NOTICE.md'];
 const sourceFiles=gamePaths.flatMap(p=>fs.statSync(path.join(root,p)).isDirectory()?walk(path.join(root,p),p+'/'):[p]).sort();
 const expected=new Map(sourceFiles.map(p=>[p,hash(path.join(root,p))]));const results=[];
 for(const item of manifest.packages){
  assert.equal(item.build,manifest.build);assert.equal(item.sourceCommit,head);assert.equal(item.dirty,false);assert.equal(path.basename(item.file),item.file);
  const zip=path.join(directory,item.file);assert.equal(fs.statSync(zip).size,item.bytes);assert.equal(hash(zip),item.sha256);
  const name=item.file.replace(/\.zip$/,'');
  const entries=cp.execFileSync('unzip',['-Z1',zip],{encoding:'utf8',maxBuffer:16*1024*1024}).trim().split('\n');
  assert(entries.every(p=>p.startsWith(name+'/')&&!p.split('/').includes('..')&&!p.includes('\\')),'Unsafe ZIP entry');
  assert(!entries.some(p=>/(?:^|\/)(?:\.env[^/]*|\.git|node_modules|tmp|tests|eval)(?:\/|$)/.test(p)),'Development/private files in archive');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'netrunner-release-audit-'));
  try{
   cp.execFileSync('unzip',['-q',zip,'-d',temp]);const base=path.join(temp,name),game=path.join(base,item.target.startsWith('macos-')?'Local Table.app/Contents/Resources/game':'game');
   const metadata=JSON.parse(fs.readFileSync(path.join(base,'build-info.json')));
   for(const key of ['build','target','node','sourceCommit','dirty','runtimeArchiveSha256'])assert.equal(metadata[key],item[key],key);
   assert.deepEqual(walk(game).sort(),sourceFiles,'Runtime files differ from source allowlist');
   for(const [file,sha]of expected)assert.equal(hash(path.join(game,file)),sha,item.target+': '+file);
   assert.equal(hash(path.join(base,'START-HERE.md')),hash(path.join(directory,'README.md')));
   for(const file of ['LICENSE','NOTICE.md'])assert.equal(hash(path.join(base,file)),hash(path.join(root,file)));
   assert(fs.statSync(path.join(base,'NODE-LICENSE.txt')).size>1000);
   const binary=path.join(base,item.target.startsWith('macos-')?'Local Table.app/Contents/MacOS/LocalTable':item.target==='windows-x64'?'LocalTable.exe':'LocalTable');assert(fs.statSync(binary).size>1000000);
   if(item.target.startsWith('macos-'))cp.execFileSync('codesign',['--verify','--deep','--strict',path.join(base,'Local Table.app')]);
   results.push({target:item.target,bytes:item.bytes,sha256:item.sha256,runtimeFiles:sourceFiles.length,sourceBytesMatch:true,metadata:true,privateFilesExcluded:true});
   console.log('PASS package audit: '+item.target+', '+sourceFiles.length+' exact runtime files.');
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
 }
 const sums=fs.readFileSync(path.join(directory,'SHA256SUMS'),'utf8');assert.equal(sums,manifest.packages.map(p=>p.sha256+'  '+p.file+'\n').join(''));
 const report={build:manifest.build,sourceCommit:head,clean:true,verifiedAt:new Date().toISOString(),packages:results};fs.writeFileSync(path.join(directory,'package-audit.json'),JSON.stringify(report,null,2)+'\n');return report;
}
module.exports={audit};
if(require.main===module)try{audit(process.argv[2]||path.join(root,'builds',require('../package.json').version));}catch(error){console.error(error);process.exitCode=1;}
