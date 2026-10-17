import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {prayerCatalog} from '../src/dua-catalog.mjs';
const html=fs.readFileSync('index.html','utf8'),at=html.indexOf('var NAMAZ=['),end=html.indexOf('\n  ];',at)+6;
const original=vm.runInNewContext(html.slice(at,end)+';NAMAZ'),catalog=prayerCatalog(original);
const prayer=id=>catalog.find(x=>x.id===id);
const plain=s=>s.normalize('NFKD').replace(/[\u064b-\u065f\u0670]/gu,'');

test('ezan displayed version retains the closing sentence and lofty-rank clause in its actual audio',()=>{
  const ezan=prayer('ezan');
  assert.match(plain(ezan.ar),/انك لا تخلف الميعاد/u);
  assert.match(ezan.ok,/İnneke lâ tuhlifül-mîâd/u);
  assert.match(ezan.meal.tr,/vaadinden dönmezsin/u);
  assert.match(plain(ezan.ar),/والدرجة الرفيعة/u);
  assert.match(ezan.ok,/ved-dereceter-rafîate/u);
  assert.match(ezan.meal.tr,/yüksek dereceyi/u);
  assert.equal(ezan.recordingScope,undefined,'Portal HTML must not override the verified spoken recording');
  assert.equal(ezan.audioOmittedTail,undefined);
});

test('short and long meal prayers are separate complete versions, not a truncated long prayer',()=>{
  assert.match(prayer('yemek').title,/kısa/u);
  assert.match(prayer('yemek-uzun').title,/uzun/u);
  assert.ok(plain(prayer('yemek-uzun').ar).includes(plain(prayer('yemek').ar)));
  assert.match(plain(prayer('yemek-uzun').ar),/يوم يقوم الحساب/u);
  assert.match(plain(prayer('yemek-uzun').ar),/والحمد لله رب العالمين/u);
  assert.match(prayer('yemek-uzun').guide.tr.join(' '),/şart değildir/u);
});

test('Quran-opening prayer retains its long intention and concluding praise',()=>{
  const ar=plain(prayer('kuran-baslama').ar);
  for(const clause of ['نويت تلاوة القران','تنوير قبور اهل الايمان','قبول التوبة','بقاء الايمان','والحمد لله رب العالمين']) assert.ok(ar.includes(clause),clause);
  assert.equal(prayer('kuran-baslama').note,'traditional_prayer');
});

test('istikhara has both favourable and unfavourable branches plus practical non-divinatory guidance',()=>{
  const item=prayer('istihare'),ar=plain(item.ar);
  assert.match(ar,/خيرا? لي في ديني|خير لي في ديني/u);
  assert.match(ar,/شر لي في ديني/u);
  assert.match(ar,/فاصرفه عني واصرفني عنه/u);
  assert.match(ar,/حيث كان ثم ارضني/u);
  for(const lang of ['tr','en']){assert.equal(item.guide[lang].length,5);assert.ok(item.meal[lang]);assert.ok(item.guideTitle[lang]);}
  const guide=item.guide.tr.join(' ');
  for(const concept of ['istişare','iki rekât','Kâfirûn','İhlâs','rüya görmek şart değildir','Namaz kılamıyorsan']) assert.ok(guide.includes(concept),concept);
  assert.equal(item.recording.id,'istihare-chapter','the exact istikhara chapter is assigned explicitly');
  assert.equal(item.recording.kind,'complete-audiobook-chapter');assert.ok(item.audioNoteTR,'chapter explanations must not be presented as bare recitation');
});

test('important daily supplications have distinct ids, sources, Arabic, pronunciation and both meanings',()=>{
  assert.equal(new Set(catalog.map(x=>x.id)).size,catalog.length);
  for(const id of ['uyku','uyanma','yolculuk','iftar','ilim']){
    const item=prayer(id);assert.ok(item);
    assert.equal(new URL(item.source).protocol,'https:');assert.match(new URL(item.source).hostname,/(^|\.)diyanet\.gov\.tr$/u);
    for(const text of [item.ar,item.ok,item.meal.tr,item.meal.en])assert.ok(text.trim());
    if(id==='uyanma')assert.equal(item.recording.id,'uyanma');
    else assert.equal(item.recording,undefined,'voice availability is not inferred from text');
  }
  assert.equal(prayer('ilim').quran.surah,20);assert.equal(prayer('ilim').quran.ayah,114);
});

test('ordinary Subhaneke no longer mixes a funeral-only optional phrase into its pronunciation',()=>{
  assert.ok(!prayer('subhaneke').ok.includes('(ve celle senâük)'));
  assert.ok(prayer('subhaneke').guide.tr[0].includes('Cenaze namazında'));
  assert.ok(original[0].ok.includes('(ve celle senâük)'),'the source data is not mutated');
});

test('recorded alternatives remain separate from the previous wording and disclose full audiobook scope',()=>{
  for(const id of ['uyku','iftar','yolculuk']){
    const original=prayer(id),alternative=prayer(id+'-alternatif');
    assert.ok(alternative);assert.notEqual(alternative.ar,original.ar);
    assert.equal(original.recording,undefined,'a different reading cannot be silently attached to the original');
    assert.equal(alternative.recording.id,id+'-alternatif');
    assert.ok(alternative.recording.reader);assert.ok(alternative.audioNoteTR);assert.ok(alternative.audioNoteEN);
    assert.ok(alternative.guideSource);
    for(const value of [alternative.ar,alternative.ok,alternative.meal.tr,alternative.meal.en])assert.ok(value&&!value.includes('\\n'),'paragraphs must be real line breaks, not escaped display text');
    if(id!=='uyku')assert.equal(alternative.recording.kind,'complete-audiobook-chapter');
  }
  const boarding=plain(prayer('yolculuk-alternatif').ar);
  assert.ok(boarding.includes(plain(prayer('yolculuk').ar)),'the short passage is included in the full mounting prayer');
  assert.match(boarding,/فاغفر لي/u);
  assert.equal(prayer('uyanma').recording.kind,'complete-supplication-excerpt');
});
