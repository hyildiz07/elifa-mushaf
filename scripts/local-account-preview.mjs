// Local browser exercise of the production account handler against Firebase emulators.
// Run with FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST set.
import {createServer} from 'node:http';
import {createReadStream,existsSync,statSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {firebaseServices} from '../server/firebase.mjs';
import {createAccountHandler} from '../server/account-handler.mjs';

if(!process.env.FIREBASE_AUTH_EMULATOR_HOST||!process.env.FIRESTORE_EMULATOR_HOST||!process.env.FIREBASE_PROJECT_ID?.startsWith('demo-')){
  throw Error('This preview requires Auth and Firestore emulators with a demo project.');
}
const root=resolve('.'),handler=createAccountHandler({services:firebaseServices});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.mp3':'audio/mpeg'};
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,`http://${req.headers.host}`);
  if(url.pathname==='/api/account'){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const request=new Request(url.origin+url.pathname,{method:req.method,headers:req.headers,body:Buffer.concat(chunks)});
   const response=await handler(request);
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  const path=resolve(root,'.'+decodeURIComponent(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
  if(!path.startsWith(root+sep)&&path!==root){res.writeHead(403).end();return;}
  if(!existsSync(path)||!statSync(path).isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});
  createReadStream(path).pipe(res);
 }catch(error){res.writeHead(500).end(error.message);}
}).listen(4178,'127.0.0.1',()=>console.log('Local account preview: http://127.0.0.1:4178/'));
