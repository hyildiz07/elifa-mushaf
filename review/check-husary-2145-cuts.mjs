// Diagnostic only: acoustic support for the proposed 2:145 split boundaries.
import fs from 'node:fs';
import {decodeWindow,calibratedCuts} from '../src/split-audio.mjs';
const row=JSON.parse(fs.readFileSync(new URL('../assets/verified-verse-audio-r12.json',import.meta.url))).rows['2:145'];
const response=await fetch(row.audio_url);
if(!response.ok)throw Error(`HTTP ${response.status}`);
const pcm=await decodeWindow(response.body,0,row.playback_end_ms,{maxMissingMs:100});
const buffer={sampleRate:pcm.sampleRate,length:pcm.channelData[0].length,
  duration:pcm.channelData[0].length/pcm.sampleRate,
  numberOfChannels:pcm.channelData.length,getChannelData:ch=>pcm.channelData[ch]};
const positions=Array.from({length:31},(_,i)=>i+1);
const acoustic=calibratedCuts(buffer,0,row.segments,positions);
console.log(JSON.stringify({verse_key:'2:145',source:row.audio_url,playback_end_ms:row.playback_end_ms,
  acoustic_shift_ms:acoustic.shift,acoustic_cuts:acoustic.cuts,starts:acoustic.starts,
  pauses:acoustic.pauses},null,2));
