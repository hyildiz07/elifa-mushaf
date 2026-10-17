import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanUsageEvent,createUsageReporter,isMeasurementHost,rangeBucket} from '../src/usage-analytics.mjs';

test('only production origins and the native app send usage events',()=>{
  assert.equal(isMeasurementHost('mushaf.elifaplatform.com'),true);
  assert.equal(isMeasurementHost('elifamushaf.netlify.app'),true);
  assert.equal(isMeasurementHost('deploy-preview-8--elifamushaf.netlify.app'),false);
  assert.equal(isMeasurementHost('localhost'),false);
  assert.equal(isMeasurementHost('localhost',{nativeIOS:true}),true);
});

test('usage events cannot include account data, notes, or selected text',()=>{
  assert.deepEqual(cleanUsageEvent('study_start',{
    mode:'hifz',range_bucket:'6_10',uid:'private-id',note:'secret',selectedText:'Arabic verse'
  }),{event:'study_start',params:{mode:'hifz',range_bucket:'6_10'}});
  assert.deepEqual(cleanUsageEvent('screen_view',{screen_name:'study',email:'user@example.com'}),
    {event:'screen_view',params:{screen_name:'study'}});
  assert.equal(cleanUsageEvent('personal_note',{text:'private'}),null);
  assert.deepEqual(cleanUsageEvent('surah_open',{surah:999}),{event:'surah_open',params:{}});
});

test('bounded queue flushes early actions after analytics loads',()=>{
  const reporter=createUsageReporter(),sent=[];
  assert.equal(reporter.track('screen_view',{screen_name:'home'}),true);
  assert.equal(reporter.track('unknown',{email:'private'}),false);
  reporter.ready((event,params)=>sent.push([event,params]));
  reporter.track('app_open');
  assert.deepEqual(sent,[['screen_view',{screen_name:'home'}],['app_open',{}]]);
});

test('range size is reported only as a coarse bucket',()=>{
  assert.equal(rangeBucket(1),'1');
  assert.equal(rangeBucket(5),'2_5');
  assert.equal(rangeBucket(10),'6_10');
  assert.equal(rangeBucket(286),'11_plus');
  assert.equal(rangeBucket(0),null);
});
