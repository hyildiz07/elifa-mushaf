import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validStudySettings,validStudyProgress} from '../src/study-settings.mjs';
import {validateBackup,restoreBackup} from '../src/account-data.mjs';
import {cleanUsageEvent} from '../src/usage-analytics.mjs';
const html=fs.readFileSync('index.html','utf8');
const source=name=>{const a=html.search(new RegExp('(?:async )?function '+name+'\\('));assert.ok(a>=0);return html.slice(a,html.indexOf('\n}',a)+2);};
const settings={reciter:223,speed:1.25,rep:3,combineRep:2,rangeRep:4,repOn:true,wait:2,mode:'range',splitCombine:true};

test('study preferences and resume position survive backup, while invalid state is rejected',()=>{
 const item={id:'12345678-1234-4234-8234-123456789abc',sid:18,from:1,to:5,title:'Kehf',createdAt:'2026-10-17T00:00:00Z',updatedAt:'2026-10-17T00:00:00Z',settings,progress:{ay:2,part:1,completed:false}};
 const wrap=v=>({elifa:'yedek',v:1,veri:{studySessions:JSON.stringify([v])}});
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 restoreBackup(storage,validateBackup(wrap(item)));assert.deepEqual(JSON.parse(map.get('studySessions')),[item]);
 const zeroItem={...item,settings:{...settings,combineRep:0,rangeRep:0}};restoreBackup(storage,validateBackup(wrap(zeroItem)));assert.deepEqual(JSON.parse(map.get('studySessions')),[zeroItem]);
 for(const invalid of [{...settings,speed:0},{...settings,rep:1.5},{...settings,rep:100},{...settings,combineRep:-1},{...settings,rangeRep:100},{...settings,mode:'unknown'},{...settings,privateText:'secret'}]){
  assert.equal(validStudySettings(invalid),false);assert.throws(()=>validateBackup(wrap({...item,settings:invalid})));
 }
 for(const invalid of [{ay:6,completed:false},{ay:2,part:-1,completed:false},{ay:2,completed:'yes'},{ay:2,completed:false,notes:'secret'}]){
  assert.equal(validStudyProgress(invalid,1,5),false);assert.throws(()=>validateBackup(wrap({...item,progress:invalid})));
 }
 assert.doesNotThrow(()=>validateBackup(wrap({...item,settings:undefined,progress:undefined})),'legacy studies still import');
});

function downloadHarness(){
 const nodes=new Map(),events=[],saved=new Set(),calls=[];const get=id=>{if(!nodes.has(id))nodes.set(id,{style:{}});return nodes.get(id);};
 const c=vm.createContext({dlBusy:false,dlCancelAll:false,dlReciter:223,dlFailures:new Map(),dlResults:new Map(),
  SURAHS:[{id:1,tr:'A'},{id:2,tr:'B'},{id:3,tr:'C'}],$:get,toast(){},setDlFill(){},renderDlList:async()=>{},
  tr:key=>key==='dl_result'?'{ok} ready, {failed} failed, {remaining} remaining':key,
  audioTimingUnverified:()=>false,invalidateAudioCache(){},activateDownloadedChapterAudio(){},
  window:{elifaLog:(event,params)=>events.push({event,...params})},
  OFF:{downloadedList:async()=>[...saved],download:async(_rid,sid)=>{calls.push(sid);saved.add(sid);},isDownloaded:async(_rid,sid)=>saved.has(sid)}});
 for(const name of ['downloadVerified','dlAll'])vm.runInContext(source(name),c);
 c.logDownload=outcome=>events.push({event:'offline_download_result',outcome});
 return {c,nodes,events,saved,calls};
}
test('all failed downloads report zero ready, preserve retries, and release busy state',async()=>{
 const {c,events}=downloadHarness();c.OFF.download=async()=>{throw Error('network');};
 await c.dlAll();assert.equal(c.dlResults.get(223),'0 ready, 3 failed, 0 remaining');assert.equal(c.dlFailures.get(223).size,3);assert.equal(c.dlBusy,false);assert.equal(events.filter(x=>x.outcome==='success').length,0);
});
test('mixed downloads retry only failed chapters and verify the audio/metadata pair',async()=>{
 const {c,saved,calls}=downloadHarness();let fail=true;
 c.OFF.download=async(_r,sid)=>{calls.push(sid);if(sid===2&&fail)return;saved.add(sid);};
 await c.dlAll();assert.equal(c.dlResults.get(223),'2 ready, 1 failed, 0 remaining');
 fail=false;calls.length=0;await c.dlAll(true);assert.deepEqual(calls,[2]);assert.equal(c.dlFailures.get(223).size,0);assert.equal(c.dlResults.get(223),'1 ready, 0 failed, 0 remaining');
});
test('cancel stops after the current chapter; storage failure does not lock the downloader',async()=>{
 const {c,saved,events}=downloadHarness();c.OFF.download=async(_r,sid)=>{saved.add(sid);c.dlCancelAll=true;};
 await c.dlAll();assert.equal(c.dlResults.get(223),'1 ready, 0 failed, 2 remaining');assert.ok(events.some(x=>x.outcome==='cancelled'));
 c.OFF.downloadedList=async()=>{throw Error('storage');};await c.dlAll();assert.equal(c.dlBusy,false);assert.equal(c.dlResults.get(223),'dl_storage_error');
});

test('whole-range study ignores an earlier split-combine toggle',async()=>{
 const plans=[];const c=vm.createContext({window:{elifaPracticeMode:()=>'range'},studyRange:{sid:2,from:3,to:10},curS:2,studyPlayRequestId:0,surahRequestId:1,SET:{reciter:223,cumu:true,rep:5,repOn:true},AD_:{ay:{3:[0,1],10:[10,11]}},normalChapterAudio:null,
 audioTimingUnverified:()=>false,buildLadder:(a,b,combine)=>{assert.equal(combine,false);return [{}];},normalVersePlanReady:()=>true,normalVerseStep:(_a,from,to,opts)=>({from,to,...opts}),runPlan:p=>plans.push(p)});
 vm.runInContext(source('playStudyRange'),c);await c.playStudyRange();assert.equal(plans[0].length,1);assert.deepEqual([plans[0][0].from,plans[0][0].to],[3,10]);
});

test('new lifecycle and feedback events cannot transmit personal text or recording URLs',()=>{
 for(const event of ['playback_start','playback_complete','playback_stopped','audio_feedback_open','offline_download_result']){
  const cleaned=cleanUsageEvent(event,{mode:'range',outcome:'failure',email:'person@example.com',notes:'private',audio:'https://example.com/voice.mp3'});
  assert.deepEqual(cleaned,{event,params:{mode:'range',outcome:'failure'}});
 }
});

test('all workflow locales are complete and preserve message placeholders',()=>{
 const c=vm.createContext({window:{T:{}}});vm.runInContext(fs.readFileSync('assets/workflow-i18n.js','utf8'),c);
 for(const [key,values] of Object.entries(c.window.T)){
  assert.equal(values.length,21,key);const expected=values[0].match(/\{\w+\}/g)||[];
  for(const value of values){assert.ok(value.trim(),key);assert.deepEqual((value.match(/\{\w+\}/g)||[]).sort(),[...expected].sort(),key);}
 }
});

test('sync defers before network or restore when a study opens during a pending request',async()=>{
 const s=fs.readFileSync('src/account.mjs','utf8');const a=s.indexOf('async function syncNow('),b=s.indexOf("$('accountSyncEnabled').onchange",a);const fn=s.slice(a,b);
 const events=[],nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{checked:true});return nodes.get(id);};let busy=true;
 const c=vm.createContext({syncRunning:false,user:{uid:'u',emailVerified:true},epoch:1,navigator:{onLine:true},$:get,
 window:{elifaActivityBusy:()=>busy,tr:k=>k},scheduleSync:()=>events.push('deferred'),availability(){},localSnapshot:()=>({}),
 api:async()=>{events.push('network');busy=true;return {revision:0};},localStorage:{getItem:()=>null},SYNC_BASE_PREFIX:'base.',
 restoreBackup:()=>events.push('restore'),location:{reload:()=>events.push('reload')}});
 vm.runInContext(fn,c);await c.syncNow();assert.deepEqual(events,['deferred']);
 events.length=0;busy=false;await c.syncNow();assert.deepEqual(events,['network','deferred']);assert.equal(c.syncRunning,false);
});
