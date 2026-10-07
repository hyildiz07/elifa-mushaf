import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

// Evidence is checked in, so this build does not depend on ignored probe output.
const evidence=JSON.parse(fs.readFileSync('review/sudais-small-gap-qdc-evidence.json'));
const path='assets/audio-timing-overrides-r3-r5.json';
const asset=JSON.parse(fs.readFileSync(path));
const html=fs.readFileSync('index.html','utf8');
const context=vm.createContext({});
vm.runInContext(html.split(/\r?\n/).find(line=>line.startsWith('const QTEXT=')),context);
vm.runInContext(html.slice(html.indexOf('function timingTextKey('),html.indexOf('\n}',html.indexOf('function timingTextKey('))+2),context);
const qtext=vm.runInContext('QTEXT',context);

for(const key of ['2:25','41:44']){
  const e=evidence[key], [sid,ay]=key.split(':').map(Number);
  assert.equal(e.source_url,`https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/${sid}.mp3`);
  assert.match(e.source_sha256,/^[a-f0-9]{64}$/);
  assert.match(e.wav_sha256,/^[a-f0-9]{64}$/);
  assert.equal(e.provider.previous,e.provider.range[0]);
  const words=qtext[sid][ay-1][2].filter(w=>w[1]===0).map(w=>w[0]);
  const base=e.models.Base.segments, large=e.models.Large.segments;
  const onlyTarget=segments=>segments.filter(s=>s.from.startsWith(`${key}:`));
  const identical=segments=>segments.map(s=>[s.from,s.to,s.start_ms,s.end_ms,s.words]);
  assert.deepEqual(identical(onlyTarget(base)),identical(onlyTarget(large)),
    `${key}: independent target models differ`);
  const target=base.filter(s=>s.from.startsWith(`${key}:`));
  assert.ok(target.length>=2,`${key}: target not found`);
  assert.equal(target[0].from,`${key}:1`);
  assert.equal(target.at(-1).to,`${key}:${words.length}`);
  assert.ok(target.every(s=>s.confidence>=.84),`${key}: low-confidence target segment`);
  const preceding=base[base.indexOf(target[0])-1],following=base[base.indexOf(target.at(-1))+1];
  const largePreceding=large[large.indexOf(onlyTarget(large)[0])-1];
  const largeFollowing=large[large.indexOf(onlyTarget(large).at(-1))+1];
  assert.deepEqual([preceding.from,preceding.to,preceding.end_ms,following.from,following.start_ms],
    [largePreceding.from,largePreceding.to,largePreceding.end_ms,largeFollowing.from,largeFollowing.start_ms],
    `${key}: adjacent verse boundaries differ`);
  assert.ok(preceding?.to.startsWith(`${sid}:${ay-1}:`),`${key}: previous verse not present`);
  assert.equal(following?.from,`${sid}:${ay+1}:1`,`${key}: next verse not present`);
  assert.ok(target[0].start_ms>=e.provider.range[0]&&
    target.at(-1).end_ms<following.start_ms,`${key}: verse transition not isolated`);
  const segments=target.flatMap(s=>s.words.map(([ref,from,to])=>{
    const [wordSid,wordAy,pos]=ref.split(':').map(Number);
    assert.equal(wordSid,sid);assert.equal(wordAy,ay);
    assert.ok(Number.isInteger(pos)&&pos>=1&&pos<=words.length);
    const start=Math.round(s.start_ms+from*1000),end=Math.round(s.start_ms+to*1000);
    assert.ok(start>=s.start_ms&&end<=s.end_ms&&end>start,`${key}:${pos}`);
    return [pos,start,end];
  }));
  const seen=new Set();
  segments.forEach(([pos,start,end],i)=>{
    if(i){assert.ok(start>=segments[i-1][2],`${key}: overlapping words`);
      assert.ok(pos<=segments[i-1][0]+1,`${key}: missing position`);}
    seen.add(pos);
  });
  assert.equal(segments[0][0],1);assert.equal(segments.at(-1)[0],words.length);
  assert.equal(seen.size,words.length,`${key}: incomplete words`);
  const range=[e.provider.range[0],Math.max(e.provider.range[1],following.start_ms)];
  assert.ok(segments.at(-1)[2]<=range[1]&&range[1]===following.start_ms);
  const assetKey=`3:${key}`;
  asset.rows[assetKey]={url:e.source_url,text:vm.runInContext('timingTextKey',context)(words),
    range,next:following.start_ms,segments};
  asset.verification[assetKey]={method:'Quran University exact QDC MP3; Base and Large agree on all target words and adjacent verse boundaries',
    source_sha256:e.source_sha256,excerpt_ms:e.excerpt,wav_sha256:e.wav_sha256,
    previous_verse_end_ms:preceding.end_ms,target_start_ms:target[0].start_ms,
    target_end_ms:target.at(-1).end_ms,next_verse_start_ms:following.start_ms,
    model_agreement:'all segment labels, boundaries, and word spans identical'};
}
asset.source='Source-matched QuranLab ayah clips or two-model exact QuranCDN MP3 alignment, with canonical text and adjacent verse checks';
fs.writeFileSync(path,JSON.stringify(asset,null,2)+'\n');
console.log('Added exact-QDC Sudais rows: 2:25, 41:44');
