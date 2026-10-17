// Personal audio excerpts use positions in this exact recording, never word guesses.
export function validExcerpt(value,duration){
  return !!value&&Number.isFinite(duration)&&duration>0&&Number.isFinite(value.start)&&Number.isFinite(value.end)&&value.start>=0&&value.end<=duration&&value.end-value.start>=0.2;
}
export function validPrayerPreferences(value){
  return !!value&&Number.isInteger(value.repeat)&&value.repeat>=1&&value.repeat<=99&&Number.isFinite(value.speed)&&value.speed>=0.5&&value.speed<=2&&Number.isFinite(value.wait)&&value.wait>=0&&value.wait<=60;
}
export function restorePrayerState(value,hash){
  const defaults={repeat:1,speed:1,wait:0,clips:[]};
  if(!value||value.hash!==hash||!validPrayerPreferences(value))return defaults;
  return {...defaults,repeat:value.repeat,speed:value.speed,wait:value.wait,clips:Array.isArray(value.clips)?value.clips.filter(c=>c&&Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.start>=0&&c.end-c.start>=0.2&&typeof c.name==='string'&&c.name.length<=80).slice(0,50):[]};
}
export function pcmExcerptWav(buffer,range){
  if(!validExcerpt(range,buffer.duration))throw Error('Invalid prayer excerpt');
  const channels=buffer.numberOfChannels,rate=buffer.sampleRate;
  const from=Math.round(range.start*rate),to=Math.min(buffer.length,Math.round(range.end*rate));
  const frames=to-from,dataBytes=frames*channels*2;
  const bytes=new ArrayBuffer(44+dataBytes),view=new DataView(bytes);
  const str=(at,s)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i));};
  str(0,'RIFF');view.setUint32(4,36+dataBytes,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);view.setUint32(24,rate,true);view.setUint32(28,rate*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,dataBytes,true);
  const tracks=Array.from({length:channels},(_,c)=>buffer.getChannelData(c));let at=44;
  for(let f=from;f<to;f++)for(const track of tracks){const sample=Math.max(-1,Math.min(1,track[f]));view.setInt16(at,Math.round(sample*(sample<0?32768:32767)),true);at+=2;}
  return bytes;
}

export class PrayerPlayer{
  constructor({audio,prepare,schedule=(fn,delay)=>globalThis.setTimeout(fn,delay),unschedule=id=>globalThis.clearTimeout(id),onState=()=>{}}){Object.assign(this,{audio,prepare,schedule,unschedule,onState});this.token=0;this.timer=null;this.active=false;this.from=0;}
  stop(){this.token++;this.active=false;if(this.timer!==null)this.unschedule(this.timer);this.timer=null;this.audio.onended=null;this.audio.onerror=null;this.audio.pause();this.onState('stopped');}
  async play(range,preferences){
    this.stop();if(!validPrayerPreferences(preferences))throw Error('Invalid prayer settings');
    const token=this.token;this.active=true;this.onState('loading');
    try{
      const source=await this.prepare(range,()=>token===this.token);
      if(token!==this.token)return;
      this.audio.src=source;this.from=range?.start||0;let done=0;
      const run=async()=>{
        if(token!==this.token)return;
        this.audio.currentTime=0;this.audio.playbackRate=preferences.speed;
        this.audio.preservesPitch=true;this.audio.webkitPreservesPitch=true;this.audio.mozPreservesPitch=true;
        try{await this.audio.play();if(token===this.token)this.onState('playing',{current:done+1,total:preferences.repeat});}catch(error){if(token===this.token){this.stop();this.onState('error',error);}}
      };
      this.audio.onerror=()=>{if(token===this.token){this.stop();this.onState('error');}};
      this.audio.onended=()=>{
        if(token!==this.token)return;
        done++;
        if(done>=preferences.repeat){this.active=false;this.audio.onended=null;this.audio.onerror=null;this.onState('complete');return;}
        this.onState('waiting',{current:done,total:preferences.repeat});
        this.timer=this.schedule(()=>{this.timer=null;run();},preferences.wait*1000);
      };
      await run();
    }catch(error){if(token===this.token){this.stop();this.onState('error',error);}}
  }
}
