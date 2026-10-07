import fs from 'node:fs';
import path from 'node:path';
const dir='test-results/review-sudais-qdc-verse-ends';
const targets=[['3-160','real-search',2677407],['4-143','real-search',2980867],['5-5','sequential',192853]];
const rows=[];
for(const [key,suffix,boundary] of targets){
  const report=JSON.parse(fs.readFileSync(`${dir}/${key}-${suffix}.json`,'utf8'));
  const source=fs.readFileSync(report.wav_file),rate=source.readUInt32LE(24),off=report.actual_window_ms[0];
  if(rate!==22050||source.readUInt16LE(22)!==1||source.readUInt16LE(34)!==16)throw Error('Unexpected WAV');
  const samples=(source.length-44)/2;
  function clip(startMs,endMs,name){
    const a=Math.max(0,Math.floor((startMs-off)*rate/1000)),b=Math.min(samples,Math.ceil((endMs-off)*rate/1000));
    if(b<=a)throw Error(`Empty clip ${name}`);
    const out=Buffer.alloc(44+(b-a)*2);source.copy(out,0,0,44);source.copy(out,44,44+a*2,44+b*2);
    out.writeUInt32LE(out.length-8,4);out.writeUInt32LE((b-a)*2,40);
    const file=path.join(dir,`${key}-${name}.wav`);fs.writeFileSync(file,out);return path.basename(file);
  }
  rows.push({key,boundary_ms:boundary,
    left:clip(boundary-3500,boundary, 'last-3p5s'),
    right:clip(boundary,boundary+1500,'next-1p5s'),
    continuous:clip(boundary-3500,boundary+1500,'across-5s')});
}
fs.writeFileSync(path.join(dir,'listening-manifest.json'),JSON.stringify({status:'review-only',rows},null,2));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const html=`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Südeys QDC Âyet Sonu Dinleme</title><style>body{font:18px system-ui;max-width:800px;margin:auto;padding:24px;background:#f7f3e8;color:#152c43}section{background:white;border:1px solid #b6a783;border-radius:12px;padding:20px;margin:18px 0}audio{width:100%;margin:8px 0 18px}code{font-size:15px}p{line-height:1.5}</style><h1>Südeys QDC âyet sonu dinleme</h1><p>Bu dosyalar özgün sûre MP3'ünün ilk baytından ardışık çözülen PCM'den alınmıştır. Kesim model adaydır; solda son harfin tamamını, sağda sıradaki âyetin ilk kelimesini ve sürekli kayıttaki geçişi dinleyin.</p>${rows.map(r=>`<section><h2>${esc(r.key.replace('-',':'))}</h2><p>Model sınırı: <code>${r.boundary_ms} ms</code></p><label>Sol, son 3,5 saniye<audio controls src="${r.left}"></audio></label><label>Sağ, sonraki 1,5 saniye<audio controls src="${r.right}"></audio></label><label>Kesintisiz 5 saniye<audio controls src="${r.continuous}"></audio></label></section>`).join('')}</html>`;
fs.writeFileSync(path.join(dir,'listen.html'),html);
console.log(path.join(dir,'listen.html'));
