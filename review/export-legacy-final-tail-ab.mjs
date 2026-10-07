// Local listening evidence only. No production asset is changed.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {MPEGDecoder} from 'mpg123-decoder';

const results=(await readFile(new URL('../test-results/legacy-final-tail-comparison.jsonl',import.meta.url),'utf8'))
  .trim().split(/\r?\n/).map(JSON.parse);
const data=new Map(results.map(row=>[row.key,row]));
const entries=[
  {key:'sudais-36:83',label:'Südeys · Yâsîn 36:83',lastWord:'تُرْجَعُونَ',
    production:'https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/36.mp3',
    legacy:'https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/036.mp3',
    productionSha256:'4a0ec659caf726e59ae8a8d9fd848d105b897f455890759b6d96186437af382d',
    legacySha256:'20343da2d20dab82e197787c1236b5f7f7d9f3f75c2c8853ddc14b13bb56b4b7'},
  {key:'hani-2:286',label:'Hânî · Bakara 2:286',lastWord:'الْكَافِرِينَ',
    production:'https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/2.mp3',
    legacy:'https://download.quranicaudio.com/quran/rifai/002.mp3',
    productionSha256:'31a1cbf1f7997190c8c5d93aa4c3e35ea5960a0ff675a53b62f62b916c95b41d',
    legacySha256:'d6349b895abebcc7ea5c79c4c30692f16b893e3b07fe53f7c9ebb90031a4f60d'},
  {key:'hani-65:12',label:'Hânî · Talâk 65:12',lastWord:'عِلْمًا',
    production:'https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/65.mp3',
    legacy:'https://download.quranicaudio.com/quran/rifai/065.mp3',
    productionSha256:'5e9b904c1df04319c96f3c9579cb3c67e7e9a51e1624e8d11f16bf96e1996db8',
    legacySha256:'4ca25cc1c9c52be20cc290bc01f70f6e6be358d495c8e6cf527f9d5c276c74b5'},
];
const out=new URL('../test-results/docs/local-audio-review/',import.meta.url);
await mkdir(out,{recursive:true});

async function sourceTail(url,expectedSize){
  const head=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(15000)});
  if(!head.ok)throw Error(`${url} HEAD ${head.status}`);
  const size=Number(head.headers.get('content-length'));
  if(size!==expectedSize)throw Error(`${url} source size changed: ${size} != ${expectedSize}`);
  const from=Math.max(0,size-1_500_000);
  const response=await fetch(url,{headers:{Range:`bytes=${from}-${size-1}`},signal:AbortSignal.timeout(30000)});
  if(response.status!==206)throw Error(`${url} range ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const decoder=new MPEGDecoder();await decoder.ready;
  try{
    const audio=decoder.decode(bytes);
    if(audio.sampleRate!==44100)throw Error(`${url} unexpected sample rate`);
    return {samples:audio.channelData[0],rate:audio.sampleRate,
      fetchedRange:[from,size-1],rangeSha256:createHash('sha256').update(bytes).digest('hex')};
  }finally{await decoder.free();}
}
function sliceLast(source,backFromMs,backToMs){
  const {samples,rate}=source;
  const from=Math.max(0,samples.length-Math.round(backFromMs*rate/1000));
  const to=Math.min(samples.length,samples.length-Math.round(backToMs*rate/1000));
  if(to<=from)throw Error('Empty clip');
  return samples.subarray(from,to);
}
function wav(samples,rate){
  const buf=Buffer.alloc(44+samples.length*2);
  buf.write('RIFF',0);buf.writeUInt32LE(buf.length-8,4);buf.write('WAVEfmt ',8);
  buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);
  buf.writeUInt32LE(rate,24);buf.writeUInt32LE(rate*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);
  buf.write('data',36);buf.writeUInt32LE(samples.length*2,40);
  for(let i=0;i<samples.length;i++){
    const value=Math.max(-1,Math.min(1,samples[i]));
    buf.writeInt16LE(Math.round(value<0?value*32768:value*32767),44+i*2);
  }
  return buf;
}
function refineTailAlignment(production,legacy,approxExtensionMs){
  const rate=production.rate,anchorBack=Math.round(.7*rate),length=Math.round(.4*rate);
  const p0=production.samples.length-anchorBack,l0=legacy.samples.length-Math.round(approxExtensionMs*rate/1000)-anchorBack;
  let best={lagSamples:0,correlation:-Infinity};
  for(let lag=-350;lag<=350;lag++){
    let xy=0,xx=0,yy=0;
    for(let i=0;i<length;i+=11){const a=production.samples[p0+i],b=legacy.samples[l0+lag+i];
      xy+=a*b;xx+=a*a;yy+=b*b;}
    const correlation=xy/Math.sqrt(xx*yy||1);
    if(correlation>best.correlation)best={lagSamples:lag,correlation};
  }
  return {...best,extensionSamples:Math.round(approxExtensionMs*rate/1000)-best.lagSamples};
}
function sourceSlice(samples,from,to){
  if(from<0||to>samples.length||to<=from)throw Error('Invalid source slice');
  return samples.subarray(from,to);
}
const manifest=[];
for(const entry of entries){
  const timing=data.get(entry.key);
  if(!timing||!(timing.confirmedBeyondMs>0)||timing.nearEndChecks.at(-1).correlation<0.95)
    throw Error(`${entry.key} does not have a strong same-performance end match`);
  const [production,legacy]=await Promise.all([
    sourceTail(entry.production,timing.productionBytes),sourceTail(entry.legacy,timing.legacyBytes)]);
  const alignment=refineTailAlignment(production,legacy,timing.confirmedBeyondMs);
  if(alignment.correlation<0.9)throw Error(`${entry.key} sample alignment remains weak: ${alignment.correlation}`);
  const extensionMs=alignment.extensionSamples/legacy.rate*1000,previewExtensionMs=Math.min(extensionMs,500);
  const base=entry.key.replace(':','-');
  const clips={production:`${base}-A-production.wav`,legacy:`${base}-B-legacy.wav`,extra:`${base}-C-extra.wav`};
  const a=sliceLast(production,2000,0);
  const legacyProductionEnd=legacy.samples.length-alignment.extensionSamples;
  const b=sourceSlice(legacy.samples,legacyProductionEnd-Math.round(2000*legacy.rate/1000),
    legacyProductionEnd+Math.round(previewExtensionMs*legacy.rate/1000));
  const c=sourceSlice(legacy.samples,legacyProductionEnd,
    Math.min(legacy.samples.length,legacyProductionEnd+Math.round(1000*legacy.rate/1000)));
  await Promise.all([
    writeFile(new URL(clips.production,out),wav(a,production.rate)),
    writeFile(new URL(clips.legacy,out),wav(b,legacy.rate)),
    writeFile(new URL(clips.extra,out),wav(c,legacy.rate)),
  ]);
  manifest.push({...entry,sourceLengths:[timing.productionBytes,timing.legacyBytes],
    sourceRanges:{production:production.fetchedRange,legacy:legacy.fetchedRange},
    sourceRangeSha256:{production:production.rangeSha256,legacy:legacy.rangeSha256},
    tailCorrelation:timing.nearEndChecks,sampleAlignment:alignment,extensionMs,previewExtensionMs,clips,
    clipDurationsMs:{production:a.length/production.rate*1000,legacy:b.length/legacy.rate*1000,
      extra:c.length/legacy.rate*1000}});
  console.log(`${entry.key}: A ${a.length} B ${b.length} C ${c.length} samples, lag ${alignment.lagSamples}, correlation ${alignment.correlation.toFixed(5)}`);
}
await writeFile(new URL('manifest.json',out),JSON.stringify({generatedAt:new Date().toISOString(),manifest},null,2)+'\n');
const cards=manifest.map((x,i)=>`<section><h2>${i+1}. ${x.label}</h2>
  <p>Son kelime: <b lang="ar" dir="rtl">${x.lastWord}</b>. Üretim sonundan sonra eski kayıtta yaklaşık ${Math.round(x.extensionMs)} ms PCM var. Harf tamlığı onaylanmadı.</p>
  <ol><li><b>A · Üretim, son 2 saniye:</b><br><audio controls preload="none" src="${x.clips.production}"></audio></li>
  <li><b>B · Eski kaynak, aynı başlangıç ve ek kuyruk:</b><br><audio controls preload="none" src="${x.clips.legacy}"></audio></li>
  <li><b>C · Yalnız ek kuyruk:</b><br><audio controls preload="none" src="${x.clips.extra}"></audio></li></ol>
  <details><summary>Kaynaklar ve dosya kimliği</summary><p>A: <a href="${x.production}">${x.production}</a><br>SHA-256 ${x.productionSha256}</p>
  <p>B: <a href="${x.legacy}">${x.legacy}</a><br>SHA-256 ${x.legacySha256}</p></details></section>`).join('\n');
const html=`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Son âyet A/B dinleme</title><style>body{font:17px/1.6 system-ui,sans-serif;max-width:850px;margin:2rem auto;padding:0 1rem;color:#17243b;background:#f7f3ea}section{background:#fff;padding:1.2rem;margin:1.2rem 0;border-radius:16px;box-shadow:0 2px 12px #0001}audio{width:100%;max-width:600px}li{margin:1rem 0}b[lang=ar]{font-size:1.6em}a{overflow-wrap:anywhere}</style><h1>Son âyet A/B dinleme</h1><p><a href="priority.html">10 öncelikli adayın A/B dinlemesi</a></p><p>Her sırada önce <b>A</b>, sonra <b>B</b>, gerekirse yalnız kuyruk <b>C</b> dinlenir. A ve B aynı yaklaşık ses anında başlar; ses düzeyi değiştirilmedi. Hânî 65:12'nin eski dosyasındaki birkaç saniyelik sessizlik B'de gösterilmez. Bu örnekler yalnız yerel inceleme içindir; ek sesin eksik harf mi yoksa yankı mı olduğunu tek başına kanıtlamaz.</p>${cards}<p>Ham hizalama: <a href="manifest.json">manifest.json</a>. Üretim uygulamasına eklenmedi.</p></html>`;
await writeFile(new URL('index.html',out),html);
