import fs from 'node:fs';
import assert from 'node:assert/strict';

// These checks guard generated drafts against missing content and broken links.
// Passing them is not a substitute for linguistic or legal review.
const languages=['de','ru','ar','fr','es','el','zh','ja','ko','hi','ur','it','id','nl','pt','fa','bn','ms','sw'];
const rtl=new Set(['ar','ur','fa']);
const source=JSON.parse(fs.readFileSync('locales/account-source.json','utf8'));
const guide=JSON.parse(fs.readFileSync('locales/guide-en.json','utf8'));
const english={privacy:fs.readFileSync('gizlilik/en.html','utf8'),support:fs.readFileSync('destek/en.html','utf8')};
const company='ELIFA COLLECTIVE TEKSTIL TASARIM TICARET LIMITED SIRKETI';
const hrefs=html=>[...html.matchAll(/\bhref="([^"]+)"/g)].map(match=>match[1]);
const body=html=>html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]||'';
const tags=html=>[...body(html).matchAll(/<\/?([a-z][a-z\d-]*)\b[^>]*>/gi)]
 .map(match=>`${match[0].startsWith('</')?'/':''}${match[1].toLowerCase()}`)
 .filter(tag=>tag!=='bdi'&&tag!=='/bdi');
const paragraphs=html=>[...body(html).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
 .map(match=>match[1].replace(/<[^>]*>/g,'').trim());
const readableText=html=>body(html).replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]*>/g,' ');
const numeralSets=['٠١٢٣٤٥٦٧٨٩','۰۱۲۳۴۵۶۷۸۹','०१२३४५६७८९','০১২৩৪৫৬৭৮৯'];
const digits=text=>text.replace(/[\u0660-\u0669\u06f0-\u06f9\u0966-\u096f\u09e6-\u09ef]/g,char=>
 String(numeralSets.find(set=>set.includes(char)).indexOf(char)));
const mustContain=(value,needle,label)=>assert.ok(value.includes(needle),`${label}: missing ${needle}`);

const report={};
const failures=[];
for(const language of languages){
 try{
 const account=JSON.parse(fs.readFileSync(`locales/account-${language}.json`,'utf8'));
 assert.deepEqual(Object.keys(account).sort(),Object.keys(source).sort(),`${language}: account keys`);
 for(const [key,value] of Object.entries(account)){
  assert.ok(typeof value==='string'&&value.trim(),`${language}: empty account translation for ${key}`);
  assert.ok(!/[\u0000-\u0008\u000b\u000e-\u001f]/.test(value),`${language}: control character in ${key}`);
 }
 const deletionKey='Hesabın, eşitlenen kayıtların ve bulut yedeklerin silinir. Bu cihazdaki kayıtlar ve Birlikte katılımların korunur. İşlem geri alınamaz.';
 const deletionSentences=(account[deletionKey].match(/[.!?。！？۔।]/g)||[]).length;
 assert.ok(deletionSentences>=3,`${language}: account deletion warning lost a sentence (especially irreversibility)`);
 const unchanged=Object.entries(account).filter(([key,value])=>value.trim()===source[key].trim()).map(([key])=>key);
 for(const [name,filename] of [['privacy',`gizlilik/${language}.html`],['support',`destek/${language}.html`]]){
  const html=fs.readFileSync(filename,'utf8');
  const label=`${language}: ${name}`;
  assert.match(html,new RegExp(`<html\\s+lang="${language}"\\s+dir="${rtl.has(language)?'rtl':'ltr'}">`),`${label}: language and direction`);
  assert.match(html,/Machine-translation draft; language and legal review required/,`${label}: draft notice`);
  assert.ok(body(html),`${label}: document body`);
  assert.deepEqual(tags(html),tags(english[name]),`${label}: body element structure`);
  assert.equal((html.match(/<h1\b/g)||[]).length,1,`${label}: main heading`);
  assert.match(html,/<title>[^<]+<\/title>/,`${label}: page title`);
  const expectedLinks=hrefs(english[name]).map(href=>
   name==='support'?href.replaceAll('/gizlilik/en.html',`/gizlilik/${language}.html`):href);
  assert.deepEqual(hrefs(html),expectedLinks,`${label}: links must retain destinations and use the selected language`);
  for(const href of hrefs(html).filter(href=>href.startsWith('#'))){
   mustContain(html,`id="${href.slice(1)}"`,`${label}: fragment target`);
  }
  if(name==='privacy'){
   assert.ok(html.includes(`<bdi>${company}</bdi>`),`${label}: unchanged legal entity`);
   for(const service of ['Firebase Authentication','Cloud Firestore','QuranCDN','Google Analytics']){
    mustContain(html,service,`${label}: service provider`);
   }
   const prose=digits(readableText(html));
   for(const number of ['28','2026','20','7','60']){
    assert.match(prose,new RegExp(`(?<!\\d)${number}(?!\\d)`),`${label}: legal date, backup limit or retention period ${number}`);
   }
   mustContain(html,'id="account-deletion"',`${label}: deletion anchor`);
  }else{
   mustContain(html,'id="contact"',`${label}: contact section`);
   mustContain(html,'id="account"',`${label}: account section`);
   const warning=paragraphs(html)[2];
   assert.ok(warning,`${label}: support diagnostic and credential warning paragraph`);
   const sentenceEnds=(warning.match(/[.!?。！？۔।]/g)||[]).length;
   // M2M100 can silently omit the second sentence about credentials.
   // Chinese sometimes joins both with a comma instead of a period.
   assert.ok(sentenceEnds>=2||(language==='zh'&&/不要发送/.test(warning)),
    `${label}: credential warning may be missing from support advice`);
  }
 }
 if(['fa','bn','ms','sw'].includes(language)){
  const value=JSON.parse(fs.readFileSync(`locales/guide-${language}.json`,'utf8'));
  assert.deepEqual(Object.keys(value).sort(),Object.keys(guide).sort(),`${language}: guide sections`);
  for(const [section,items] of Object.entries(guide)){
   assert.equal(value[section]?.length,items.length,`${language}: ${section} guide length`);
   assert.ok(value[section].every(item=>item.t?.trim()&&item.x?.trim()),`${language}: ${section} guide text`);
  }
 }
 report[language]={accountStrings:Object.keys(account).length,unchangedEnglish:unchanged.length,unchangedSamples:unchanged.slice(0,8)};
 }catch(error){
  failures.push(`${language}: ${error.message.split('\n')[0]}`);
 }
}
console.log(JSON.stringify({languagesChecked:languages.length,report,failures},null,2));
if(failures.length)process.exitCode=1;
