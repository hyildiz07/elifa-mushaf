// Narrow local-only server for the listening worksheet and its WAV excerpts.
// Production build does not include docs/ or test-results/.
import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const reviewFiles=new Map([
  ['/docs/audio-review-index.html',['../docs/audio-review-index.html','text/html; charset=utf-8']],
  ['/docs/sudais-verse-review.html',['../docs/sudais-verse-review.html','text/html; charset=utf-8']],
  ['/docs/husary-muallim-2-145-review.html',['../docs/husary-muallim-2-145-review.html','text/html; charset=utf-8']],
  ['/review/hani-audio-review.html',['../review/hani-audio-review.html','text/html; charset=utf-8']],
  ['/review/hani-audio-review.json',['../review/hani-audio-review.json','application/json; charset=utf-8']],
]);
const port=Number(process.env.SUDAIS_REVIEW_PORT||4174);
http.createServer(async(req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  const pathname=new URL(req.url,'http://localhost').pathname;
  let file,type;
  if(pathname==='/'){
    [file,type]=reviewFiles.get('/docs/sudais-verse-review.html');
    file=fileURLToPath(new URL(file,import.meta.url));
  }else if(reviewFiles.has(pathname)){
    [file,type]=reviewFiles.get(pathname);
    file=fileURLToPath(new URL(file,import.meta.url));
  }else{
    const match=/^\/test-results\/review-sudais-24-35\/(24-35-after-word-(?:09|19|25|32)-(?:context|before|after)\.wav)$/.exec(pathname);
    if(match){file=fileURLToPath(new URL(match[1],new URL('../test-results/review-sudais-24-35/',import.meta.url)));
      type='audio/wav';}
  }
  if(!file){res.writeHead(404);res.end();return;}
  try{
    const info=await stat(file);if(!info.isFile())throw Error('Not a file');
    const common={'Content-Type':type,'Accept-Ranges':'bytes','Cache-Control':'no-store'};
    const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
    if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),info.size-1):info.size-1;
      if(start>=info.size||end<start){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
      res.writeHead(206,{...common,'Content-Range':`bytes ${start}-${end}/${info.size}`,'Content-Length':end-start+1});
      if(req.method==='HEAD')res.end();else createReadStream(file,{start,end}).pipe(res);
    }else{
      res.writeHead(200,{...common,'Content-Length':info.size});
      if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);
    }
  }catch{res.writeHead(404);res.end();}
}).listen(port,'127.0.0.1',()=>console.log(`Südeys yerel inceleme: http://127.0.0.1:${port}/docs/sudais-verse-review.html`));
