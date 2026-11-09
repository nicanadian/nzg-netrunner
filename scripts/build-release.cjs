'use strict';
// Cross-build using Node's built-in SEA builder. Never copy a developer checkout wholesale.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const esbuild = require('esbuild');
const ROOT = path.resolve(__dirname, '..');
const VERSION = 'alpha-build-1';
const NODE = 'v26.13.0';
const OUTPUT = path.join(ROOT, 'builds', VERSION);
const WORK = path.join(OUTPUT, '.work');
const CACHE = path.join(ROOT, 'tmp', 'release-runtime');
const targets = [
  {id:'windows-x64', platform:'win', arch:'x64', archive:'zip', binary:'node.exe'},
  {id:'macos-arm64', platform:'darwin', arch:'arm64', archive:'tar.gz', binary:'bin/node'},
  {id:'macos-x64', platform:'darwin', arch:'x64', archive:'tar.gz', binary:'bin/node'},
  {id:'linux-x64', platform:'linux', arch:'x64', archive:'tar.xz', binary:'bin/node'},
];
const run = (cmd, args, options={}) => execFileSync(cmd, args, {stdio:'inherit', ...options});
async function sha(file) {return crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');}
async function download(url, destination) {
  const response = await fetch(url); if(!response.ok) throw Error(`${response.status}: ${url}`);
  const {Readable} = require('node:stream'); const {pipeline} = require('node:stream/promises');
  await pipeline(Readable.fromWeb(response.body), require('node:fs').createWriteStream(destination));
}
async function runtime(target, checksums) {
  const name = `node-${NODE}-${target.platform}-${target.arch}`;
  const file = `${name}.${target.archive}`;
  const archive = path.join(CACHE, file);
  const expected = checksums.split('\n').find(line=>line.endsWith(`  ${file}`))?.split(/\s+/)[0];
  if(!expected) throw Error(`No official checksum for ${file}`);
  if (!(await fs.stat(archive).catch(()=>null)) || await sha(archive)!==expected) {
    console.log(`Downloading ${file}`); await download(`https://nodejs.org/dist/${NODE}/${file}`, archive);
  }
  if(await sha(archive)!==expected) throw Error(`Checksum mismatch: ${file}`);
  const directory = path.join(CACHE, name); await fs.mkdir(directory, {recursive:true});
  if(target.archive === 'zip') {
    run('unzip', ['-oq', archive, `${name}/node.exe`, `${name}/LICENSE`, '-d', CACHE]);
  } else {
    run('tar', ['-xf', archive, '-C', CACHE, `${name}/bin/node`, `${name}/LICENSE`]);
  }
  return {executable:path.join(directory,target.binary), license:path.join(directory,'LICENSE'), archiveSha256:expected};
}
async function copyGame(destination) {
  await fs.mkdir(destination,{recursive:true});
  const files = ['index.html','app','engine','vendor/chiriboga','assets','README.md','LICENSE','NOTICE.md'];
  for(const file of files) await fs.cp(path.join(ROOT,file),path.join(destination,file), {
    recursive:true, filter: source => !path.basename(source).startsWith('.')
  });
}
async function main() {
  if(process.platform!=='darwin') throw Error('Build all targets on macOS so both Mac apps receive ad hoc signatures.');
  await fs.mkdir(CACHE,{recursive:true}); await fs.mkdir(WORK,{recursive:true});
  const checksums = await (await fetch(`https://nodejs.org/dist/${NODE}/SHASUMS256.txt`)).text();
  const runtimes = {};
  await Promise.all(targets.map(async target=>{runtimes[target.id]=await runtime(target,checksums);}));
  const hostNode = runtimes[`macos-${process.arch}`]?.executable;
  if(!hostNode) throw Error(`Unsupported build host: ${process.arch}`);
  const entry = path.join(WORK,'launcher.cjs');
  await esbuild.build({entryPoints:[path.join(ROOT,'desktop/main.cjs')],bundle:true,platform:'node',format:'cjs',target:'node26',outfile:entry,define:{LOCAL_TABLE_BUILD:JSON.stringify(VERSION)}});
  const selected = process.argv.includes('--target') ? process.argv[process.argv.indexOf('--target')+1] : null;
  if(selected && !targets.some(t=>t.id===selected)) throw Error(`Unknown target: ${selected}`);
  const sourceCommit = execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
  const dirty = !!execFileSync('git',['status','--porcelain','--untracked-files=normal'],{cwd:ROOT,encoding:'utf8'}).trim();
  if (dirty && !process.argv.includes('--allow-dirty')) throw Error('Commit source changes before building a release (or use --allow-dirty for local experiments).');
  const manifest = {build:VERSION,node:NODE,sourceCommit,dirty,createdAt:new Date().toISOString(),packages:[]};
  for(const target of targets.filter(t=>!selected || selected===t.id)) {
    console.log(`Building ${target.id}`);
    const packageName = `nzg-netrunner-${VERSION}-${target.id}`;
    const staging = path.join(WORK,packageName); await fs.rm(staging,{recursive:true,force:true}); await fs.mkdir(staging,{recursive:true});
    const mac = target.platform==='darwin';
    const app = path.join(staging,'Local Table.app','Contents');
    const executable = mac ? path.join(app,'MacOS','LocalTable') : path.join(staging,target.platform==='win'?'LocalTable.exe':'LocalTable');
    const game = mac ? path.join(app,'Resources','game') : path.join(staging,'game');
    await fs.mkdir(path.dirname(executable),{recursive:true});
    await copyGame(game);
    const config = path.join(WORK,`${target.id}.json`);
    await fs.writeFile(config,JSON.stringify({main:entry,mainFormat:'commonjs',executable:runtimes[target.id].executable,output:executable,disableExperimentalSEAWarning:true,useSnapshot:false,useCodeCache:false,execArgvExtension:'none'}));
    run(hostNode,['--build-sea',config]);
    await fs.chmod(executable,0o755);
    if(mac) {
      await fs.writeFile(path.join(app,'Info.plist'),`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleName</key><string>Local Table</string><key>CFBundleDisplayName</key><string>Netrunner Local Table</string><key>CFBundleIdentifier</key><string>com.github.nicanadian.nzg-netrunner</string><key>CFBundleExecutable</key><string>LocalTable</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleShortVersionString</key><string>0.1.0</string><key>CFBundleVersion</key><string>1</string><key>LSMinimumSystemVersion</key><string>13.5</string><key>LSUIElement</key><true/></dict></plist>`);
      run('codesign',['--force','--sign','-',path.join(staging,'Local Table.app')]);
      run('codesign',['--verify','--deep','--strict',path.join(staging,'Local Table.app')]);
    }
    await fs.copyFile(runtimes[target.id].license,path.join(staging,'NODE-LICENSE.txt'));
    for(const file of ['LICENSE','NOTICE.md']) await fs.copyFile(path.join(ROOT,file),path.join(staging,file));
    await fs.copyFile(path.join(OUTPUT,'README.md'),path.join(staging,'START-HERE.md'));
    const metadata = {build:VERSION,target:target.id,node:NODE,sourceCommit,dirty,runtimeArchiveSha256:runtimes[target.id].archiveSha256};
    await fs.writeFile(path.join(staging,'build-info.json'),JSON.stringify(metadata,null,2)+'\n');
    const zipName = `${packageName}.zip`; const zipPath = path.join(OUTPUT,zipName);
    await fs.rm(zipPath,{force:true}); run('zip',['-q','-r','-9',zipPath,packageName],{cwd:WORK});
    manifest.packages.push({...metadata,file:zipName,bytes:(await fs.stat(zipPath)).size,sha256:await sha(zipPath)});
    console.log(`Packaged ${zipName}`);
  }
  await fs.writeFile(path.join(OUTPUT,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  await fs.writeFile(path.join(OUTPUT,'SHA256SUMS'),manifest.packages.map(p=>`${p.sha256}  ${p.file}\n`).join(''));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
