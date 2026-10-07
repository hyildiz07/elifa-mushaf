import fs from 'node:fs';

const file='assets/ui-extra-drafts.js';
const source=fs.readFileSync(file,'utf8');
const match=source.match(/window\.ELIFA_UI_EXTRA_DRAFTS=(\{[^\n]+\});/);
if(!match)throw new Error('UI translation drafts are missing');
const drafts=JSON.parse(match[1]);
const overrides=JSON.parse(fs.readFileSync('locales/ui-extra-overrides.json','utf8'));
for(const [language,phrases] of Object.entries(overrides)){
  if(!drafts[language])throw new Error(`Missing UI locale: ${language}`);
  for(const [key,value] of Object.entries(phrases)){
    if(!(key in drafts.en)||!value.trim())throw new Error(`Invalid override: ${language}/${key}`);
    drafts[language][key]=value;
  }
}
fs.writeFileSync(file,'// Generated review-only machine translations with curated control-label overrides.\nwindow.ELIFA_UI_EXTRA_DRAFTS='+JSON.stringify(drafts)+';\n');
