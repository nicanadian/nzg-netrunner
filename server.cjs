const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path");
const root = __dirname,
  port = Number(process.env.PORT || 5173);
try { process.loadEnvFile(path.join(root, '.env.local')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const helper = require('./server/helper.cjs');
const json = (res, status, value) => res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(value));
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mjs": "text/javascript",
  ".svg": "image/svg+xml",
};
function createServer() { return http.createServer(async (req, res) => {
    if (req.url.split('?')[0] === '/api/helper') {
      if (req.method === 'GET') { json(res,200,await helper.connectionStatus()); return; }
      if (req.method !== 'POST') { json(res,405,{error:'Use POST to ask a question.'}); return; }
      if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) { json(res,403,{error:'Open the helper from Local Table.'}); return; }
      let body = '';
      try {
        for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body)>150000) { json(res,413,{error:'The question context is too large.'}); return; } }
        const result = await helper.answer(JSON.parse(body)); json(res,200,result);
      } catch (error) { json(res,error instanceof SyntaxError ? 400 : error.status || 500,{error:error instanceof SyntaxError ? 'Invalid question JSON.' : error.status ? error.message : 'The helper could not answer. Your game is unchanged.'}); }
      return;
    }
    let file;
    try {
      file = path.resolve(
        root,
        "." + decodeURIComponent(req.url.split("?")[0]),
      );
    } catch {
      res.writeHead(400).end();
      return;
    }
    if ((!file.startsWith(root + path.sep) && file !== root) || path.relative(root,file).split(path.sep).some(p=>p.startsWith('.') || ['node_modules','server'].includes(p))) {
      res.writeHead(403).end();
      return;
    }
    if (file === root) file = path.join(root, "index.html");
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404).end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(data);
    });
  }); }
if (require.main === module) createServer().listen(port, "127.0.0.1", () =>
    console.log("Local Table → http://localhost:" + port),
  );
module.exports = {createServer};
