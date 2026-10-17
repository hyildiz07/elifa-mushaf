// Analytics is deliberately limited to product actions and coarse categories.
// Never send account IDs, free text, selected words, notes, or audio URLs.
const EVENTS=new Set([
  'app_open','screen_view','surah_open','language_change','read','download',
  'study_open','study_saved','study_start','range_repeat_start',
  'split_created','split_combine_start','playback_error','offline_download_result'
]);
const SCREEN=/^[a-z][a-z0-9_]{0,31}$/;
const LANGUAGE=/^[a-z]{2,3}$/;
const MODES=new Set(['range','verse','split','hifz']);
const RANGE_BUCKETS=new Set(['1','2_5','6_10','11_plus']);
const OUTCOMES=new Set(['success','failure','cancelled']);

export function isMeasurementHost(hostname,{nativeIOS=false}={}){
  return nativeIOS||['mushaf.elifaplatform.com','elifamushaf.netlify.app'].includes(String(hostname||'').toLowerCase());
}

export function rangeBucket(verseCount){
  if(!Number.isInteger(verseCount)||verseCount<1)return null;
  if(verseCount===1)return '1';
  if(verseCount<=5)return '2_5';
  if(verseCount<=10)return '6_10';
  return '11_plus';
}

export function cleanUsageEvent(event,params={}){
  if(!EVENTS.has(event))return null;
  const out={};
  if(event==='screen_view'&&SCREEN.test(params.screen_name||''))out.screen_name=params.screen_name;
  if(event==='surah_open'&&Number.isInteger(params.surah)&&params.surah>=1&&params.surah<=114)out.surah=params.surah;
  if(event==='language_change'&&LANGUAGE.test(params.lang||''))out.lang=params.lang;
  if(MODES.has(params.mode))out.mode=params.mode;
  if(RANGE_BUCKETS.has(params.range_bucket))out.range_bucket=params.range_bucket;
  if(OUTCOMES.has(params.outcome))out.outcome=params.outcome;
  if(event==='playback_error'&&SCREEN.test(params.error_code||''))out.error_code=params.error_code;
  return {event,params:out};
}

export function createUsageReporter(){
  let emit=null;
  const queue=[];
  return {
    track(event,params){
      const item=cleanUsageEvent(event,params);
      if(!item)return false;
      if(emit)emit(item.event,item.params);
      else if(queue.length<30)queue.push(item);
      return true;
    },
    ready(nextEmit){
      if(typeof nextEmit!=='function')return;
      emit=nextEmit;
      for(const item of queue)emit(item.event,item.params);
      queue.length=0;
    },
    clear(){queue.length=0;emit=null;}
  };
}
