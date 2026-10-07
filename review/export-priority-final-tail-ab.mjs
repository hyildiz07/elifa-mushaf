// Ten candidate endings for local A/B listening only. No production assets.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {MPEGDecoder} from 'mpg123-decoder';

const root=new URL('../',import.meta.url);
const audit=JSON.parse(await readFile(new URL('test-results/priority-alternative-tails.json',root)));
const details={
  '5:24:64':['Hânî · Nûr 24:64','عَلِيمٌ'],
  '5:2:286':['Hânî · Bakara 2:286','الْكَافِرِينَ'],
  '3:42:53':['Südeys · Şûrâ 42:53','الْأُمُورُ'],
  '3:24:64':['Südeys · Nûr 24:64','عَلِيمٌ'],
  '3:1:7':['Südeys · Fâtiha 1:7','الضَّالِّينَ'],
  '3:36:83':['Südeys · Yâsîn 36:83','تُرْجَعُونَ'],
  '3:92:21':['Südeys · Leyl 92:21','يَرْضَىٰ'],
  '3:45:37':['Südeys · Câsiye 45:37','الْحَكِيمُ'],
  '3:61:14':['Südeys · Saff 61:14','ظَاهِرِينَ'],
  '3:49:18':['Südeys · Hucurât 49:18','تَعْمَلُونَ'],
};
const selected=Object.values(audit.items).flatMap(row=>(row.alternatives||[])
  .filter(alt=>alt.extraAudioCandidate).map(alt=>({row,alt,key:`${row.reciter}:${row.verse}`})));
if(selected.length!==10||selected.some(x=>!details[x.key]))throw Error('Positive candidate set changed');
const out=new URL('../test-results/docs/local-audio-review/',import.meta.url);
await mkdir(out,{recursive:true});

async function tail(url,expectedBytes){
  const head=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(20000)});
  if(!head.ok)throw Error(`${url}: HEAD ${head.status}`);
  const bytes=Number(head.headers.get('content-length'));
  if(bytes!==expectedBytes)throw Error(`${url}: source size changed ${bytes} != ${expectedBytes}`);
  const from=Math.max(0,bytes-1_500_000);
  const response=await fetch(url,{headers:{Range:`bytes=${from}-${bytes-1}`},signal:AbortSignal.timeout(30000)});
  if(response.status!==206&&!(response.status===200&&from===0))throw Error(`${url}: range ${response.status}`);
  const raw=new Uint8Array(await response.arrayBuffer());
  if(raw.length!==bytes-from)throw Error(`${url}: range length changed`);
  const decoder=new MPEGDecoder();await decoder.ready;
  try{
    const pcm=decoder.decode(raw);
    return {samples:pcm.channelData[0],rate:pcm.sampleRate,range:[from,bytes-1],
      rangeSha256:createHash('sha256').update(raw).digest('hex')};
  }finally{await decoder.free();}
}
function matchEnd(a,b,approxBeyondMs){
  if(a.rate!==b.rate)throw Error('Sample rate mismatch');
  const rate=a.rate,back=Math.round(rate*.7),width=Math.round(rate*.4),
    p0=a.samples.length-back,q0=b.samples.length-Math.round(approxBeyondMs*rate/1000)-back;
  let best={lagSamples:null,correlation:-Infinity};
  for(let lag=-650;lag<=650;lag++){
    let xy=0,xx=0,yy=0;
    for(let i=0;i<width;i+=11){const x=a.samples[p0+i],y=b.samples[q0+lag+i];xy+=x*y;xx+=x*x;yy+=y*y;}
    const c=xy/Math.sqrt(xx*yy||1);
    if(c>best.correlation)best={lagSamples:lag,correlation:c};
  }
  const extensionSamples=Math.round(approxBeyondMs*rate/1000)-best.lagSamples;
  if(best.correlation<.90||extensionSamples<=0)throw Error(`Weak alignment ${best.correlation}`);
  return {...best,extensionSamples,extensionMs:extensionSamples/rate*1000};
}
function wav(samples,rate){
  const buffer=Buffer.alloc(44+samples.length*2);
  buffer.write('RIFF',0);buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);
  buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);
  buffer.writeUInt32LE(rate,24);buffer.writeUInt32LE(rate*2,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);
  buffer.write('data',36);buffer.writeUInt32LE(samples.length*2,40);
  for(let i=0;i<samples.length;i++){
    const v=Math.max(-1,Math.min(1,samples[i]));
    buffer.writeInt16LE(Math.round(v<0?v*32768:v*32767),44+i*2);
  }
  return buffer;
}
function cut(samples,start,end){
  if(start<0||end>samples.length||end<=start)throw Error('Clip outside decoded source');
  return samples.subarray(start,end);
}
const manifest=[];
for(const {row,alt,key} of selected){
  const [production,legacy]=await Promise.all([
    tail(row.productionUrl,row.productionBytes),tail(alt.url,alt.bytes)]);
  const alignment=matchEnd(production,legacy,alt.extensionMs),rate=production.rate;
  const pEnd=production.samples.length,lMatchedEnd=legacy.samples.length-alignment.extensionSamples;
  const before=Math.round(2*rate),previewExtra=Math.min(alignment.extensionSamples,Math.round(rate)),
    clips={production:`priority-${key.replaceAll(':','-')}-A-production.wav`,
      legacy:`priority-${key.replaceAll(':','-')}-B-legacy.wav`,
      extra:`priority-${key.replaceAll(':','-')}-C-extra.wav`};
  const a=cut(production.samples,pEnd-before,pEnd),
    b=cut(legacy.samples,lMatchedEnd-before,lMatchedEnd+previewExtra),
    c=cut(legacy.samples,lMatchedEnd,lMatchedEnd+previewExtra);
  await Promise.all([
    writeFile(new URL(clips.production,out),wav(a,rate)),
    writeFile(new URL(clips.legacy,out),wav(b,rate)),
    writeFile(new URL(clips.extra,out),wav(c,rate)),
  ]);
  const [label,lastWord]=details[key],quranUrl=`https://quran.com/${row.verse.replace(':','/')}`;
  manifest.push({key,label,lastWord,quranUrl,productionUrl:row.productionUrl,
    legacyUrl:alt.url,productionBytes:row.productionBytes,legacyBytes:alt.bytes,
    sourceRanges:{production:production.range,legacy:legacy.range},
    sourceRangeSha256:{production:production.rangeSha256,legacy:legacy.rangeSha256},
    auditCorrelation:alt.eofWindow.correlation,alignment,
    previewExtensionMs:previewExtra/rate*1000,clips,
    clipDurationsMs:{production:a.length/rate*1000,legacy:b.length/rate*1000,extra:c.length/rate*1000}});
  console.log(`${key}: ${alignment.extensionMs.toFixed(1)}ms, corr ${alignment.correlation.toFixed(5)}`);
}
await writeFile(new URL('priority-manifest.json',out),JSON.stringify({generatedAt:new Date().toISOString(),count:manifest.length,manifest},null,2)+'\n');
const cards=manifest.map((x,i)=>`<section><h2>${i+1}. ${x.label}</h2><p><a href="${x.quranUrl}">Âyet metni</a> · Son kelime: <b lang="ar" dir="rtl">${x.lastWord}</b>. Kaynak sonu yaklaşık ${Math.round(x.alignment.extensionMs)} ms uzun. B örneği ilk ${Math.round(x.previewExtensionMs)} ms'lik ek kuyruğu içerir; uzun sessizlik gösterilmez.</p>
  <ol><li><b>A · Üretim, son 2 saniye</b><br><audio controls preload="none" src="${x.clips.production}"></audio></li>
  <li><b>B · Eski kayıt, aynı başlangıç + ek kuyruk</b><br><audio controls preload="none" src="${x.clips.legacy}"></audio></li>
  <li><b>C · Yalnız ek kuyruk</b><br><audio controls preload="none" src="${x.clips.extra}"></audio></li></ol>
  <details><summary>Kaynaklar</summary><p>Üretim: <a href="${x.productionUrl}">${x.productionUrl}</a></p><p>Eski kayıt: <a href="${x.legacyUrl}">${x.legacyUrl}</a></p></details></section>`).join('\n');
const html=`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>10 son âyet A/B incelemesi</title><style>body{font:17px/1.6 system-ui,sans-serif;max-width:850px;margin:2rem auto;padding:0 1rem;color:#17243b;background:#f7f3ea}section{background:white;padding:1.2rem;margin:1.2rem 0;border-radius:16px;box-shadow:0 2px 12px #0001}audio{width:100%;max-width:600px}li{margin:1rem 0}b[lang=ar]{font-size:1.6em}a{overflow-wrap:anywhere}</style><h1>10 öncelikli son âyet · A/B dinleme</h1><p>Her sırada önce <b>A</b>, sonra <b>B</b>, gerekirse <b>C</b> dinleyin. Ses düzeyleri değiştirilmedi. B, üretimle aynı ses anında başlar ve eski kaydın ek kuyruğunun ilk en fazla 1 saniyesini gösterir. Bu sayfa yalnız yerel inceleme içindir; ek sesin eksik harf mi yoksa yankı mı olduğunu tek başına kanıtlamaz.</p>${cards}<p><a href="priority-manifest.json">Kaynak ve hizalama manifesti</a> · <a href="index.html">Önceki üçlü A/B incelemesi</a></p></html>`;
await writeFile(new URL('priority.html',out),html);
