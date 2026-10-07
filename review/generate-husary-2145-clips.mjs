// Local listening aids only. The source recording's reuse rights are unclear:
// keep generated audio in ignored test-results; never add clips to deployment.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {decodeWindow} from '../src/split-audio.mjs';

const source='https://everyayah.com/data/Husary_Muallim_128kbps/002145.mp3';
const sha256='cc4640fa78a211b598a6e5f47880a5ff39112d3f8279d5260f860f1e1a1cad28';
const response=await fetch(source);
if(!response.ok)throw Error(`Source audio HTTP ${response.status}`);
const bytes=Buffer.from(await response.arrayBuffer());
if(createHash('sha256').update(bytes).digest('hex')!==sha256)throw Error('Recording bytes changed');
const pcm=await decodeWindow(new Blob([bytes]).stream(),0,119000,{maxMissingMs:1800});
const samples=pcm.channelData[0].length,rate=pcm.sampleRate;
const duration=Math.round(samples/rate*1000);
if(Math.abs(duration-118073)>20)throw Error(`Unexpected duration ${duration}ms`);

// Overlaps deliberately give the listener context at every artificial edge.
// These are review windows, NOT verified word or phrase boundaries.
const windows=[[0,14000],[13000,26000],[28000,43000],[42000,58000],
  [57000,73000],[72000,87000],[86000,98000],[101000,116000],[115000,duration]];
for(let i=1;i<windows.length;i++){
  const gapStart=windows[i-1][1],gapEnd=windows[i][0];
  if(gapEnd<=gapStart)continue;
  const stride=Math.max(1,Math.floor(rate*.02));
  let peakRms=0;
  for(let at=Math.floor(gapStart/1000*rate);at<Math.ceil(gapEnd/1000*rate);at+=stride){
    let sum=0,count=0;
    for(let j=at;j<Math.min(samples,at+stride);j++){
      const v=pcm.channelData[0][j];sum+=v*v;count++;
    }
    peakRms=Math.max(peakRms,Math.sqrt(sum/count));
  }
  if(peakRms>.002)throw Error(`Review clips omit audible audio at ${gapStart}-${gapEnd}ms (${peakRms})`);
}
const destination=new URL('../test-results/husary-2145-clips/',import.meta.url);
fs.mkdirSync(destination,{recursive:true});
function wav(fromMs,toMs){
  const lo=Math.floor(fromMs/1000*rate),hi=Math.min(samples,Math.ceil(toMs/1000*rate));
  const length=hi-lo,out=Buffer.alloc(44+length*2);
  out.write('RIFF',0);out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);
  out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);
  out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);
  out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);
  out.writeUInt32LE(length*2,40);
  for(let i=0;i<length;i++){
    let value=0;
    for(const channel of pcm.channelData)value+=channel[lo+i]/pcm.channelData.length;
    out.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(value*32767))),44+i*2);
  }
  return out;
}
const clips=windows.map(([from_ms,to_ms],i)=>{
  const filename=String(i+1).padStart(2,'0')+'_'+String(from_ms).padStart(6,'0')+'-'+String(to_ms).padStart(6,'0')+'.wav';
  const data=wav(from_ms,to_ms);
  fs.writeFileSync(new URL(filename,destination),data);
  return {number:i+1,from_ms,to_ms,filename,sha256:createHash('sha256').update(data).digest('hex')};
});
const manifest={status:'local-review-only',source,source_sha256:sha256,
  source_duration_ms:duration,rights:'Original recording rights not established; do not commit or deploy audio clips.',
  clips};
fs.writeFileSync(new URL('manifest.json',destination),JSON.stringify(manifest,null,2)+'\n');
const rows=clips.map(c=>`<section><h2>${c.number}. klip · ${(c.from_ms/1000).toFixed(2)}–${(c.to_ms/1000).toFixed(2)} sn</h2>
<audio controls preload="metadata" src="${c.filename}"></audio>
<p>Bu bölümde duyulan her öğretici okuma ve öğrenci cevabını, Kur’ân kelime konumu (1–32), konuşmacı ve tam başlangıç/bitiş saatiyle işaretleyin. Örtüşen 1 sn bağlamı iki kez saymayın.</p>
<textarea id="note-${c.number}" rows="4" placeholder="Örn: 42.4–45.1 hoca 15–17; 45.2–48.0 öğrenci 15–17; belirsiz kelime varsa yazın."></textarea></section>`).join('');
const page=`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hüsarî Muallim 2:145 — yerel dinleme</title>
<style>body{font:16px system-ui;max-width:900px;margin:auto;padding:20px;background:#f4f3ef;color:#17251f}section{background:white;padding:15px;margin:15px 0;border:1px solid #b7c7bd;border-radius:10px}audio,textarea{display:block;width:100%;box-sizing:border-box}textarea{font:inherit}button{padding:8px;font:inherit}.warn{background:#fff0d2;padding:12px;border-left:4px solid #ad6b00}</style>
<h1>Hüsarî Muallim · Bakara 2:145</h1><p class="warn">Yalnız yerel inceleme. Bu klipler üretim zamanlaması değildir ve ses kullanım hakkı teyit edilmediği için yayımlanmamalıdır. Kaynak SHA-256: <code>${sha256}</code>.</p>
<p>Dokuz klip tam 118,073 saniyelik kaydın duyulan sesini kapsar. Kesimlerin çoğunda bağlam örtüşür; atlanan iki aralık sessizlik olarak ölçüldü. Hoca/öğrenci sırasını ve tekrar edilen kelime konumlarını kaydedin. Emin olmadığınız yeri açıkça belirsiz bırakın.</p>${rows}
<button id="export">Notları JSON olarak dışa aktar</button><script>
const count=${clips.length},key='husary-2145-local-review',saved=JSON.parse(localStorage.getItem(key)||'{}');
for(let i=1;i<=count;i++){const box=document.getElementById('note-'+i);box.value=saved[i]||'';box.addEventListener('input',()=>{saved[i]=box.value;localStorage.setItem(key,JSON.stringify(saved))})}
document.getElementById('export').onclick=()=>{const data={status:'unverified-human-notes',verse_key:'2:145',audio_sha256:'${sha256}',clips:Array.from({length:count},(_,i)=>({number:i+1,note:saved[i+1]||''}))};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='husary-2145-listening-notes.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
</script></html>`;
fs.writeFileSync(new URL('index.html',destination),page);
console.log(JSON.stringify({destination:fileURLToPath(destination),duration,rate,clips:clips.map(({number,from_ms,to_ms,filename})=>({number,from_ms,to_ms,filename}))},null,2));
