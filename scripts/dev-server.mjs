import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import account from '../netlify/functions/account.mjs';
import locale from '../netlify/functions/locale.mjs';
process.env.FIREBASE_PROJECT_ID='demo-elifa-mushaf';
process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';
const root = process.cwd();
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.mp3':'audio/mpeg'};
http.createServer(async (req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/api/locale'){
    const country=process.env.ELIFA_DEV_COUNTRY||null;
    const result=await locale(new Request('http://'+req.headers.host+req.url),{geo:{country:{code:country}}});
    res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());
    return;
  }
  if(pathname==='/api/account'){
    try{
      const chunks=[];let size=0;
      for await(const part of req){size+=part.length;if(size>1052672){res.writeHead(413);res.end();return;}chunks.push(part);}
      const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(req.method!=='GET'?{body:Buffer.concat(chunks)}:{})});
      const result=await account(request);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());
    }catch{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Yerel hesap test hizmeti başlatılmamış.'}));}
    return;
  }
  const filename = path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!filename.startsWith(root+path.sep) || /\/(?:\.|node_modules|test-results|server|netlify)(?:[^/]*)(?:\/|$)/.test(pathname)) {res.writeHead(403);res.end();return;}
  try { const data=await readFile(filename);res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data); }
  catch {res.writeHead(404);res.end('Not found');}
}).listen(4173,'127.0.0.1',()=>console.log('Elifa local: http://127.0.0.1:4173'));
