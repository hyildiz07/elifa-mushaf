// Review-only phrase partition. Do not import this into production until the
// intentionally uneven 10/4/5/13-word UX and playback code are reviewed.
import fs from 'node:fs';
import {decodeWindow} from '../src/split-audio.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../assets/verified-verse-audio-r12.json',import.meta.url)));
const row=catalog.rows['2:145'];
const q=JSON.parse(fs.readFileSync(new URL('./husary-2145-qud-candidate.json',import.meta.url)));
const segments=q.response.segments.slice(0,4);
const bounds=[0,10,14,19,32],cuts=[0,15465,27140,38665,row.playback_end_ms];
if(row.audio_sha256!==q.source_sha256_observed_local||row.timestamp_to!==60750||
  row.playback_end_ms!==61250||row.segments.length!==32)throw Error('Source proof changed');
const pcm=await decodeWindow((await fetch(row.audio_url)).body,0,row.playback_end_ms,{maxMissingMs:100});
const rms=(from,to)=>{
  const a=Math.floor(from*pcm.sampleRate/1000),b=Math.ceil(to*pcm.sampleRate/1000);
  let worst=0;
  for(const ch of pcm.channelData){let sum=0;for(let i=a;i<b;i++)sum+=ch[i]*ch[i];
    worst=Math.max(worst,Math.sqrt(sum/(b-a)));}
  return worst;
};
const parts=[];
for(let i=0;i<4;i++){
  const start=bounds[i]+1,end=bounds[i+1],s=segments[i];
  if(s.ref_from!==`2:145:${start}`||s.ref_to!==`2:145:${end}`)throw Error('Independent QUD phrase mismatch');
  const from=cuts[i],to=cuts[i+1];
  if(i>0){
    const prev=segments[i-1];
    if(!(to>from&&from>prev.time_to*1000&&from<s.time_from*1000&&
      from>row.segments[start-2][2]&&from<row.segments[start-1][1]))
      throw Error('Phrase cut is outside both independent gaps');
  }
  if(i===3&&!(to>s.time_to*1000&&to<66840))throw Error('Terminal may cross 2:146');
  parts.push({from_word:start,to_word:end,word_count:end-start+1,
    from_ms:from,to_ms:to,qud_speech_from_ms:Math.round(s.time_from*1000),
    qud_speech_to_ms:Math.round(s.time_to*1000),
    cut_rms_100ms:i<3?Number(rms(to-50,to+50).toFixed(6)):null});
}
const result={status:'verified-phrase-partition-v253',verse_key:'2:145',
  source_audio_url:row.audio_url,source_sha256:row.audio_sha256,
  playback_end_ms:row.playback_end_ms,
  rationale:'Three internal cut points lie in broad silence gaps independently bracketed by QUD phrase labels and QuranLab word times. The last card is thirteen words long; no unverified internal cut is added.',
  parts};
const output=new URL('./husary-2145-safe-phrases.json',import.meta.url);
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({output:output.pathname,parts},null,2));
