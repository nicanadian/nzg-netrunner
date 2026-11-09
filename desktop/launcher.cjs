'use strict';
const path = require('node:path');
const crypto = require('node:crypto');
const {spawn} = require('node:child_process');
const {isSea} = require('node:sea');
const {createServer} = require('../server.cjs');
const BUILD = typeof LOCAL_TABLE_BUILD === 'undefined' ? 'development' : LOCAL_TABLE_BUILD;
const APP_ID = 'nzg-netrunner-local-table';
const DEFAULT_PORT = 24680; // Keep browser saves on the same origin between launches.
function gameRoot() {
  if (!isSea()) return path.resolve(__dirname, '..');
  return process.platform === 'darwin'
    ? path.resolve(path.dirname(process.execPath), '../Resources/game')
    : path.join(path.dirname(process.execPath), 'game');
}
function openBrowser(url) {
  const [command, args] = process.platform === 'darwin' ? ['open', [url]]
    : process.platform === 'win32' ? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]]
    : ['xdg-open', [url]];
  const child = spawn(command, args, {stdio: 'ignore', detached: true});
  child.on('error', () => console.log(`Open your browser at ${url}`));
  child.unref();
}
function launchPage(token, build) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Local Table · ${build}</title><style>html,body{height:100%;margin:0;background:#10252d;color:#f2eee2;font:14px system-ui}body{display:flex;flex-direction:column}header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 16px}small{color:#c3d0d2}button{font:inherit;background:#e8b954;color:#17232b;border:0;border-radius:6px;padding:7px 14px;cursor:pointer}iframe{flex:1;width:100%;border:0;min-height:0}#message{padding:24px}</style><header><span>Local Table <small>· ${build}</small></span><button id="quit">Quit game</button></header><iframe title="Netrunner game" src="/"></iframe><script>document.querySelector('#quit').onclick=async()=>{const button=document.querySelector('#quit');button.disabled=true;try{const response=await fetch('/_local-table/quit',{method:'POST',headers:{'X-Local-Table-Token':${JSON.stringify(token)}}});if(!response.ok)throw Error('Quit failed');document.querySelector('iframe').remove();document.body.insertAdjacentHTML('beforeend','<p id="message">Local Table has stopped. Your game is saved in this browser. You can close this tab.</p>');button.remove()}catch(error){button.disabled=false;button.textContent='Retry quit'}};</script></html>`;
}
async function start({port = DEFAULT_PORT, root = gameRoot(), browser = true, helperEnv = process.env} = {}) {
  const token = crypto.randomBytes(32).toString('hex');
  const server = createServer({root, helperEnv});
  const handleGame = server.listeners('request')[0];
  server.removeAllListeners('request');
  let origin;
  const close = () => new Promise(resolve => { server.close(resolve); server.closeIdleConnections(); });
  server.on('request', (req, res) => {
    if (req.headers.host !== new URL(origin).host) { res.writeHead(403).end('Open Local Table using its launch link.'); return; }
    const route = req.url.split('?')[0];
    if (route === '/_local-table/health') {
      res.writeHead(200, {'Content-Type':'application/json', 'Cache-Control':'no-store'}).end(JSON.stringify({appId: APP_ID, build: BUILD})); return;
    }
    if (route === '/launch') {
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store', 'X-Frame-Options':'DENY', 'Content-Security-Policy':"frame-ancestors 'none'"}).end(launchPage(token, BUILD)); return;
    }
    if (route === '/_local-table/quit') {
      if (req.method !== 'POST' || req.headers.origin !== origin || req.headers['x-local-table-token'] !== token) { res.writeHead(403).end(); return; }
      res.writeHead(200, {'Content-Type':'application/json'}).end('{"stopped":true}');
      void close(); return;
    }
    void handleGame(req, res);
  });
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  } catch (error) {
    if (error.code !== 'EADDRINUSE' || !port) throw error;
    const response = await fetch(`http://127.0.0.1:${port}/_local-table/health`, {signal: AbortSignal.timeout(2000)}).catch(() => null);
    const health = response?.ok ? await response.json().catch(() => null) : null;
    if (health?.appId !== APP_ID) throw new Error(`Port ${port} is already in use. Close the other application or use --port NUMBER.`);
    const url = `http://127.0.0.1:${port}/launch`;
    if (browser) openBrowser(url);
    return {url, build: health.build, reused: true};
  }
  origin = `http://127.0.0.1:${server.address().port}`;
  const url = `${origin}/launch`;
  if (browser) openBrowser(url);
  return {server, close, url, build: BUILD, reused: false};
}
async function main(args = process.argv.slice(2)) {
  if (args.includes('--version')) { console.log(BUILD); return; }
  const allowed = new Set(['--no-browser', '--json', '--port']);
  let port = DEFAULT_PORT;
  for (let i = 0; i < args.length; i++) {
    if (!allowed.has(args[i])) throw new Error(`Unknown option: ${args[i]}`);
    if (args[i] === '--port') {
      port = Number(args[++i]);
      if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('--port needs a number from 0 to 65535.');
    }
  }
  const result = await start({port, browser: !args.includes('--no-browser')});
  console.log(args.includes('--json') ? JSON.stringify({url: result.url, build: result.build, reused: result.reused}) : `Local Table → ${result.url}\nUse Quit game in the browser to stop Local Table.`);
  if (result.server) {
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => void result.close());
  }
}
module.exports = {start, main, APP_ID};
