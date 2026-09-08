// Dev static server with no-store caching so ES modules always refetch.
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const ROOT=path.resolve(process.argv[2]||'.'),PORT=Number(process.argv[3]||5845);
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.ico':'image/x-icon','.woff2':'font/woff2'};
http.createServer((req,res)=>{
  if(req.method==='POST'&&req.url.startsWith('/shot')){const name=(new URL(req.url,'http://x').searchParams.get('name')||'shot').replace(/[^a-z0-9_-]/gi,'');let b='';req.on('data',c=>b+=c);req.on('end',()=>{const m=/^data:image\/(\w+);base64,(.*)$/s.exec(b);if(!m){res.writeHead(400);return res.end('bad')}fs.mkdirSync(path.join(ROOT,'tools','reports','sheets'),{recursive:true});fs.writeFileSync(path.join(ROOT,'tools','reports','sheets',name+'.jpg'),Buffer.from(m[2],'base64'));res.writeHead(200);res.end('saved')});return}
  if(req.method==='POST'&&req.url.startsWith('/report')){const name=(new URL(req.url,'http://x').searchParams.get('name')||'report').replace(/[^a-z0-9_-]/gi,'');let b='';req.on('data',c=>b+=c);req.on('end',()=>{fs.mkdirSync(path.join(ROOT,'tools','reports'),{recursive:true});fs.writeFileSync(path.join(ROOT,'tools','reports',name+'.json'),b);res.writeHead(200,{'Content-Type':'text/plain'});res.end('saved '+name)});return}
  let p=decodeURIComponent(new URL(req.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';
  const file=path.join(ROOT,p);if(!file.startsWith(ROOT)){res.writeHead(403);return res.end();}
  fs.stat(file,(err,st)=>{if(err||!st.isFile()){res.writeHead(404);return res.end('not found');}
    const ext=path.extname(file).toLowerCase();const range=req.headers.range;
    const head={'Content-Type':TYPES[ext]||'application/octet-stream','Cache-Control':'no-store, no-cache, must-revalidate, max-age=0','Accept-Ranges':'bytes'};
    if(range){const m=/bytes=(\d*)-(\d*)/.exec(range);const start=m[1]?Number(m[1]):0,end=m[2]?Number(m[2]):st.size-1;head['Content-Range']=`bytes ${start}-${end}/${st.size}`;head['Content-Length']=end-start+1;res.writeHead(206,head);return fs.createReadStream(file,{start,end}).pipe(res);}
    head['Content-Length']=st.size;res.writeHead(200,head);fs.createReadStream(file).pipe(res);});
}).listen(PORT,()=>console.log('neon-breach dev server on http://localhost:'+PORT));
