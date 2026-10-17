import test from 'node:test';
import assert from 'node:assert/strict';
import {prayerWords,prayerPartText,validPrayerTextPart,restorePrayerTextParts} from '../src/dua-word-selection.mjs';

test('manual prayer parts keep the exact selected Arabic words and reject overlapping or stale text',()=>{
 const text='اللَّهُمَّ بِالْحَقِّ أَنْزَلْتَهُ وَبِالْحَقِّ نَزَلَ';const words=prayerWords(text);
 assert.equal(words.length,5);assert.equal(prayerPartText(words,{wordFrom:0,wordTo:2}),'اللَّهُمَّ بِالْحَقِّ أَنْزَلْتَهُ');
 const state={text,textParts:[{wordFrom:3,wordTo:4,name:'Second'},{wordFrom:0,wordTo:2,name:'First'},{wordFrom:2,wordTo:3,name:'overlap'},{wordFrom:5,wordTo:7,name:'out of range'}]};
 assert.deepEqual(restorePrayerTextParts(state,text).map(p=>p.name),['First','Second']);assert.deepEqual(restorePrayerTextParts(state,text+' changed'),[]);
 assert.equal(validPrayerTextPart({wordFrom:1.5,wordTo:3},5),false);assert.equal(prayerPartText(words,{wordFrom:-1,wordTo:2}),'');
});
test('text parts survive a recording replacement while old audio seconds are discarded',()=>{
 const text='one two three',state={hash:'old',text,textParts:[{wordFrom:0,wordTo:1,name:'First',start:2,end:5}]};
 assert.equal(restorePrayerTextParts(state,text,'old')[0].start,2);
 assert.deepEqual(restorePrayerTextParts(state,text,'new'),[{wordFrom:0,wordTo:1,name:'First'}]);
});
