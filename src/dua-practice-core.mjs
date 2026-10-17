// Personal audio excerpts use positions in this exact recording, never word guesses.
export function validExcerpt(value,duration){
  return !!value&&Number.isFinite(duration)&&duration>0&&Number.isFinite(value.start)&&Number.isFinite(value.end)&&value.start>=0&&value.end<=duration&&value.end-value.start>=0.2;
}
export function validPrayerPreferences(value){
  return !!value&&Number.isInteger(value.repeat)&&value.repeat>=1&&value.repeat<=99&&Number.isFinite(value.speed)&&value.speed>=0.5&&value.speed<=2&&Number.isFinite(value.wait)&&value.wait>=0&&value.wait<=60;
}
export function restorePrayerState(value,hash){
  const defaults={repeat:1,speed:1,wait:0,clips:[],method:'sequential',partRepeat:1,combineRepeat:0,tourRepeat:0};
  if(!value||value.hash!==hash||!validPrayerPreferences(value))return defaults;
  const count=(v,fallback)=>Number.isInteger(v)&&v>=0&&v<=99?v:fallback;
  return {...defaults,repeat:value.repeat,speed:value.speed,wait:value.wait,method:value.method==='cumulative'?'cumulative':'sequential',partRepeat:count(value.partRepeat,value.repeat),combineRepeat:count(value.combineRepeat,0),tourRepeat:count(value.tourRepeat,0),clips:Array.isArray(value.clips)?value.clips.filter(c=>c&&Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.start>=0&&c.end-c.start>=0.2&&typeof c.name==='string'&&c.name.length<=80).slice(0,50):[]};
}
export function pcmExcerptWav(buffer,range){
  return pcmRangesWav(buffer,[range]);
}
function checkedRanges(ranges,duration=Infinity){
  if(!Array.isArray(ranges)||ranges.length===0||ranges.length>50)throw Error('Invalid prayer ranges');
  let end=0;
  return ranges.map(range=>{
    if(!range||!Number.isFinite(range.start)||!Number.isFinite(range.end)||range.start<end||range.end-range.start<0.2||range.end>duration)throw Error('Invalid or overlapping prayer ranges');
    end=range.end;return {...range};
  });
}
// Concatenate only the selected samples: a gap between phrases is never played.
export function pcmRangesWav(buffer,ranges){
  if(!Number.isFinite(buffer.duration)||buffer.duration<=0)throw Error('Invalid prayer recording');
  const selected=checkedRanges(ranges,buffer.duration);
  const channels=buffer.numberOfChannels,rate=buffer.sampleRate;
  const bounds=selected.map(range=>[Math.round(range.start*rate),Math.min(buffer.length,Math.round(range.end*rate))]);
  const frames=bounds.reduce((sum,[from,to])=>sum+to-from,0),dataBytes=frames*channels*2;
  const bytes=new ArrayBuffer(44+dataBytes),view=new DataView(bytes);
  const str=(at,s)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i));};
  str(0,'RIFF');view.setUint32(4,36+dataBytes,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);view.setUint32(24,rate,true);view.setUint32(28,rate*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,dataBytes,true);
  const tracks=Array.from({length:channels},(_,c)=>buffer.getChannelData(c));let at=44;
  for(const [from,to] of bounds)for(let f=from;f<to;f++)for(const track of tracks){const sample=Math.max(-1,Math.min(1,track[f]));view.setInt16(at,Math.round(sample*(sample<0?32768:32767)),true);at+=2;}
  return bytes;
}

export function validPrayerStudyPreferences(value){
  return !!value&&['sequential','cumulative'].includes(value.method)&&['partRepeat','combineRepeat','tourRepeat'].every(key=>Number.isInteger(value[key])&&value[key]>=0&&value[key]<=99)&&Number.isFinite(value.speed)&&value.speed>=0.5&&value.speed<=2&&Number.isFinite(value.wait)&&value.wait>=0&&value.wait<=60;
}
// Lazy plan keeps even the largest allowed repeat settings bounded in memory.
export function buildPrayerStudyPlan(ranges,preferences){
  const selected=checkedRanges(ranges);
  if(!validPrayerStudyPreferences(preferences))throw Error('Invalid prayer study settings');
  const {method,partRepeat,combineRepeat,tourRepeat}=preferences;
  const tours=Math.max(1,tourRepeat),partTotal=Math.max(1,partRepeat);
  return (function*(){
    for(let tour=1;tour<=tours;tour++)for(let partIndex=0;partIndex<selected.length;partIndex++){
      for(let current=1;current<=partTotal;current++)yield {ranges:[selected[partIndex]],phase:'part',partIndex,current,total:partTotal,tour,tours};
      if(method==='cumulative'&&combineRepeat>0&&partIndex>0)for(let current=1;current<=combineRepeat;current++)yield {ranges:selected.slice(0,partIndex+1),phase:'combine',partIndex,current,total:combineRepeat,tour,tours};
    }
  })();
}

export class PrayerPlayer{
  constructor({audio,prepare,preparePlan,schedule=(fn,delay)=>globalThis.setTimeout(fn,delay),unschedule=id=>globalThis.clearTimeout(id),onState=()=>{}}){Object.assign(this,{audio,prepare,preparePlan,schedule,unschedule,onState});this.token=0;this.timer=null;this.active=false;this.from=0;}
  stop(){this.token++;this.active=false;if(this.timer!==null)this.unschedule(this.timer);this.timer=null;this.audio.onended=null;this.audio.onerror=null;this.audio.pause();this.onState('stopped');}
  async play(range,preferences){
    if(!validPrayerPreferences(preferences)){this.stop();throw Error('Invalid prayer settings');}
    const steps=(function*(){for(let current=1;current<=preferences.repeat;current++)yield {ranges:range?[range]:[],phase:range?'part':'full',partIndex:0,current,total:preferences.repeat,tour:1,tours:1};})();
    return this._playSteps(steps,preferences,(_,isCurrent)=>this.prepare(range,isCurrent));
  }
  async playPlan(ranges,preferences){
    let steps;
    try{steps=buildPrayerStudyPlan(ranges,preferences);if(typeof this.preparePlan!=='function')throw Error('Prayer study audio preparation is unavailable');}catch(error){this.stop();throw error;}
    return this._playSteps(steps,preferences,(step,isCurrent)=>this.preparePlan(step.ranges,isCurrent));
  }
  async _playSteps(steps,preferences,prepare){
    this.stop();const token=this.token;this.active=true;let sourceKey=null,source,stepNumber=0,pending;
    const fail=error=>{if(token===this.token){this.stop();this.onState('error',error);}};
    const run=async()=>{
      if(token!==this.token)return;
      const next=pending||steps.next();pending=null;
      if(next.done){this.active=false;this.audio.onended=null;this.audio.onerror=null;this.onState('complete');return;}
      const step=next.value,number=++stepNumber,key=JSON.stringify(step.ranges.map(r=>[r.start,r.end]));
      const isCurrent=()=>token===this.token&&number===stepNumber;
      this.onState('loading',step);
      if(key!==sourceKey){source=await prepare(step,isCurrent);if(!isCurrent())return;sourceKey=key;this.audio.src=source;}
      if(!isCurrent())return;
      this.from=step.ranges[0]?.start||0;
      this.audio.currentTime=0;this.audio.playbackRate=preferences.speed;
      this.audio.preservesPitch=true;this.audio.webkitPreservesPitch=true;this.audio.mozPreservesPitch=true;
      let ended=false;
      this.audio.onerror=()=>{if(isCurrent())fail();};
      this.audio.onended=()=>{
        if(!isCurrent()||ended)return;ended=true;this.audio.onended=null;
        // Pulling a single lookahead avoids a spurious waiting state at completion.
        const following=steps.next();
        if(following.done){this.active=false;this.audio.onerror=null;this.onState('complete',step);return;}
        pending=following;
        this.onState('waiting',step);
        this.timer=this.schedule(()=>{this.timer=null;return run().catch(fail);},preferences.wait*1000);
      };
      await this.audio.play();if(isCurrent()&&!ended)this.onState('playing',step);
    };
    try{
      await run();
    }catch(error){fail(error);}
  }
}
