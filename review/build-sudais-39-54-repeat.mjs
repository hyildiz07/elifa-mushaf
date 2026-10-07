import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const proof=JSON.parse(fs.readFileSync('review/sudais-39-54-exact-qdc-evidence.json'));
const assetPath='assets/audio-timing-overrides-r3-r5.json';
const asset=JSON.parse(fs.readFileSync(assetPath));
assert.equal(proof.source_url,
  'https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/39.mp3');
assert.equal(proof.source_sha256,'9667e8f7c2f31f437dfb9cc74c4d4c7f419bde1ace94d1df7561dc29bec5f145');
assert.match(proof.wav_sha256,/^[a-f0-9]{64}$/);
const text=fs.readFileSync('index.html','utf8'),c=vm.createContext({});
vm.runInContext(text.split(/\r?\n/).find(line=>line.startsWith('const QTEXT=')),c);
vm.runInContext(text.slice(text.indexOf('function timingTextKey('),
  text.indexOf('\n}',text.indexOf('function timingTextKey('))+2),c);
const words=vm.runInContext('QTEXT',c)[39][53][2].filter(w=>w[1]===0).map(w=>w[0]);
assert.equal(words.length,13);
const target=model=>proof.models[model].filter(s=>s.from.startsWith('39:54:'));
const shape=model=>target(model).map(s=>[s.from,s.to,s.start_ms,s.end_ms,s.words]);
assert.deepEqual(shape('Base'),shape('Large'),'models disagree on the repeated verse');
const base=proof.models.Base,large=proof.models.Large;
for(const model of [base,large]){
  assert.equal(model.find(s=>s.from==='39:53:17')?.end_ms,794380);
  assert.equal(model.find(s=>s.from==='39:55:1')?.start_ms,807380);
}
assert.deepEqual(target('Base').map(s=>[s.from,s.to]),
  [['39:54:1','39:54:5'],['39:54:4','39:54:13']]);
assert.ok(target('Base').every(s=>s.confidence>=.79));
const segments=target('Base').flatMap(s=>s.words.map(([ref,from,to])=>{
  const [sid,ay,pos]=ref.split(':').map(Number);
  assert.equal(sid,39);assert.equal(ay,54);
  assert.ok(pos>=1&&pos<=words.length&&to>from);
  const start=Math.round(s.start_ms+from*1000),end=Math.round(s.start_ms+to*1000);
  assert.ok(start>=s.start_ms&&end<=s.end_ms&&end>start);
  return [pos,start,end];
}));
assert.deepEqual(segments.map(s=>s[0]),[1,2,3,4,5,4,5,6,7,8,9,10,11,12,13]);
segments.forEach((s,i)=>{if(i)assert.ok(s[1]>=segments[i-1][2]);});
assert.ok(segments[0][1]>794380&&segments.at(-1)[2]<807380);
asset.rows['3:39:54']={url:proof.source_url,text:vm.runInContext('timingTextKey',c)(words),
  range:[target('Base')[0].start_ms,807380],next:807380,segments,repeatWholeVerse:true};
asset.verification['3:39:54']={method:'Exact production QDC MP3; Base and Large agree on every word, true 4–5 repeat and adjacent verse boundaries',
  source_sha256:proof.source_sha256,excerpt_ms:proof.excerpt,wav_sha256:proof.wav_sha256,
  preceding_verse_end_ms:794380,target_end_ms:target('Base').at(-1).end_ms,
  next_verse_start_ms:807380,repeat_positions:[4,5],
  split_policy:'one whole-verse card; partial selections cannot include unselected repeated words'};
fs.writeFileSync(assetPath,JSON.stringify(asset,null,2)+'\n');
console.log('Added exact-QDC Sudais 39:54 with true word 4–5 repeat');
