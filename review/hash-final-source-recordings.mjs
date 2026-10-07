// Read-only complete-source SHA-256 for the four EOF comparison pairs.
import {createHash} from 'node:crypto';
const urls=[
  'https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/2.mp3',
  'https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/002.mp3',
  'https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/36.mp3',
  'https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/036.mp3',
  'https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/2.mp3',
  'https://download.quranicaudio.com/quran/rifai/002.mp3',
  'https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/65.mp3',
  'https://download.quranicaudio.com/quran/rifai/065.mp3',
];
async function run(url){
  const r=await fetch(url,{signal:AbortSignal.timeout(300000)});if(!r.ok)throw Error(`${r.status} ${url}`);
  const hash=createHash('sha256');let bytes=0;
  for await(const chunk of r.body){hash.update(chunk);bytes+=chunk.length;}
  return {url,bytes,sha256:hash.digest('hex')};
}
for(const url of urls){
  console.log(JSON.stringify(await run(url)));
}
