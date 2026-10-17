// Ownership is provided by the app's existing Quran media session. Never replace
// native handlers here: MediaSession has no API for reading and restoring them.
export function bindPrayerMediaSession({gateway,title,reader,play,interrupt,stop}){
  let closed=false,restart=null;
  const owner=gateway?.claim?.({
    metadata:{title,artist:reader||'Elifa Mushaf',album:'Elifa Mushaf · Dua'},
    handlers:{play:()=>{if(!closed&&restart)play(restart);},pause:()=>{if(!closed)interrupt();},stop:()=>{if(!closed)stop();}}
  });
  return {
    remember(request){restart=request;},
    update(state){if(!closed)owner?.update?.(state==='playing'?'playing':state==='stopped'||state==='complete'||state==='error'?'none':'paused');},
    close(){if(closed)return;closed=true;restart=null;owner?.release?.();}
  };
}

// AudioContext is used only to decode bytes. The actual player is HTMLAudio,
// so leaving a suspended WebAudio session alive provides no playback benefit.
export function createPrayerDecoder({createContext,onDecoded=()=>{}}){
  let closed=false,decoded=null,pending=null,context=null;
  return {
    async decode(bytes){
      if(closed)throw Error('Closed prayer decoder');
      if(decoded)return decoded;
      if(!pending)pending=(async()=>{
        const decoder=createContext();context=decoder;
        try{const result=await decoder.decodeAudioData(bytes.slice(0));if(closed)throw Error('Closed prayer decoder');decoded=result;onDecoded(result);return result;}
        finally{if(context===decoder){context=null;try{await decoder.close();}catch{}}}
      })().finally(()=>{pending=null;});
      return pending;
    },
    close(){closed=true;decoded=null;const decoder=context;context=null;if(decoder)try{Promise.resolve(decoder.close()).catch(()=>{});}catch{}}
  };
}
