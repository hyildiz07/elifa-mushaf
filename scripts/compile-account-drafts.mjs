import fs from 'node:fs';
import {ACCOUNT_EN} from '../src/account-i18n.mjs';

const languages=['de','ru','ar','fr','es','el','zh','ja','ko','hi','ur','it','id','nl','pt','fa','bn','ms','sw'];
const overrides=JSON.parse(fs.readFileSync('locales/account-overrides.json','utf8'));
const drafts={};
for(const language of languages){
 const file=`locales/account-${language}.json`;
 if(!fs.existsSync(file))continue;
 const entries=JSON.parse(fs.readFileSync(file,'utf8'));
 Object.assign(entries,overrides[language]||{});
 const missing=Object.keys(ACCOUNT_EN).filter(key=>!entries[key]?.trim());
 if(missing.length)throw new Error(`${file}: ${missing.length} missing account messages`);
 drafts[language]=entries;
}
fs.writeFileSync('src/account-drafts.mjs',`// Published account translations with AI meaning checks; human language/legal review remains open.\nexport const ACCOUNT_DRAFTS=${JSON.stringify(drafts)};\n`);
console.log(`Compiled account drafts: ${Object.keys(drafts).join(', ')||'none'}`);
