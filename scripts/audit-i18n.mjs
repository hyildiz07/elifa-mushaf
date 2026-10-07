import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('  var T={',html.indexOf('  var LANGS=['));
const end=html.indexOf('\n  var idx={};',start);
if(start<0||end<0)throw new Error('Translation table not found');
const tableSource=html.slice(start,end).replace(/^  var T=/,'').replace(/;\s*$/,'');
const T=vm.runInNewContext(`(${tableSource})`);
const LANGS=['tr','de','en','ru','ar','fr','es','el','zh','ja','ko','hi','ur','it','id','nl','pt','fa','bn','ms','sw'];
const keys=[...html.matchAll(/data-i18n(?:-ph|-title|-aria)?="([^"]+)"/g)].map(m=>m[1]);
const missingKeys=[...new Set(keys)].filter(k=>!(k in T));
const incomplete=Object.entries(T).filter(([,v])=>!Array.isArray(v)||v.length!==LANGS.length||v.some(x=>typeof x!=='string'||!x.trim())).map(([k,v])=>({key:k,length:v?.length}));
const guideSource=html.match(/var GUIDE_L10N=(\{[^\n]+\});/);
const guides=guideSource?JSON.parse(guideSource[1]):{};
const guideDraftSource=fs.existsSync('assets/guide-drafts.js')?fs.readFileSync('assets/guide-drafts.js','utf8').match(/window\.ELIFA_GUIDE_DRAFTS=(\{[^\n]+\});/):null;
const guideDrafts=guideDraftSource?JSON.parse(guideDraftSource[1]):{};
const guideMissing=LANGS.filter(language=>language!=='tr'&&!guides[language]&&!guideDrafts[language]);
const manualsMissing=LANGS.filter(language=>language!=='tr'&&!fs.existsSync(`manual-${language}.json`));
const manualErrors=[];
for(const language of LANGS.filter(language=>language!=='tr'&&!manualsMissing.includes(language))){
  try{const manual=JSON.parse(fs.readFileSync(`manual-${language}.json`,'utf8'));if(!manual.title||!manual.sec)manualErrors.push(language);}
  catch{manualErrors.push(language);}
}
const translatedLanguages=LANGS.filter(language=>!['tr','en'].includes(language));
const accountMissing=translatedLanguages.filter(language=>!fs.existsSync(`locales/account-${language}.json`));
const privacyMissing=translatedLanguages.filter(language=>!fs.existsSync(`gizlilik/${language}.html`));
const supportMissing=translatedLanguages.filter(language=>!fs.existsSync(`destek/${language}.html`));
const readerHelpSource=fs.existsSync('assets/reader-help-drafts.js')?fs.readFileSync('assets/reader-help-drafts.js','utf8').match(/window\.ELIFA_READER_HELP_DRAFTS=(\{[^\n]+\});/):null;
const readerHelpDrafts=readerHelpSource?JSON.parse(readerHelpSource[1]):{};
const readerHelpMissing=translatedLanguages.filter(language=>!readerHelpDrafts[language]);
const remainingGaps={account:`${accountMissing.length} locales use English fallback`,privacy:`${privacyMissing.length} locales use English fallback`,support:`${supportMissing.length} locales use English fallback`,readerHelp:`${readerHelpMissing.length} locales use English fallback`,legacyManualPrivacy:'Historical policy text remains in manual JSON but is not displayed'};
const localeCoverage=Object.fromEntries(LANGS.map(language=>[language,{
 mainTable:incomplete.length===0,manual:language==='tr'||!manualsMissing.includes(language)&&!manualErrors.includes(language),
 guide:language==='tr'||!guideMissing.includes(language),account:language==='tr'?'source':language==='en'?'draft':!accountMissing.includes(language)?'published-ai-reviewed':'fallback-en',
 privacy:language==='tr'?'source':language==='en'||!privacyMissing.includes(language)?'draft':'fallback-en',
 support:language==='tr'?'source':language==='en'||!supportMissing.includes(language)?'draft':'fallback-en'
}]));
const releaseReady=!missingKeys.length&&!incomplete.length&&!manualsMissing.length&&!manualErrors.length&&!guideMissing.length&&Object.values(localeCoverage).every(row=>['source','reviewed'].includes(row.account)&&['source','reviewed'].includes(row.privacy)&&['source','reviewed'].includes(row.support));
const report={languages:LANGS.length,tableKeys:Object.keys(T).length,htmlKeys:new Set(keys).size,missingKeys,incomplete,guideMissing,manualsMissing,manualErrors,accountMissing,privacyMissing,supportMissing,readerHelpMissing,translationReviewRequired:LANGS.filter(language=>language!=='tr'),releaseReady,localeCoverage,remainingGaps};
if(process.argv.includes('--keys'))console.log(Object.keys(T).join('\n'));
else if(process.argv.includes('--sample')){
  for(const key of process.argv.slice(process.argv.indexOf('--sample')+1))console.log(key,JSON.stringify({tr:T[key]?.[0],en:T[key]?.[2]}));
}
else console.log(JSON.stringify(report,null,2));
if(missingKeys.length||incomplete.length||manualsMissing.length||manualErrors.length||readerHelpMissing.length||process.argv.includes('--strict')&&!releaseReady)process.exitCode=1;
