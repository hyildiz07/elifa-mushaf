import fs from 'node:fs';
const languages=['fa','bn','ms','sw'];
const source=JSON.parse(fs.readFileSync('locales/guide-en.json','utf8'));
const drafts={};
for(const language of languages){
 const file=`locales/guide-${language}.json`;
 if(!fs.existsSync(file))continue;
 const value=JSON.parse(fs.readFileSync(file,'utf8'));
 for(const [section,items] of Object.entries(source)){
  if(!Array.isArray(value[section])||value[section].length!==items.length||value[section].some(item=>!item.t?.trim()||!item.x?.trim()))throw new Error(`Incomplete guide: ${language}/${section}`);
 }
 drafts[language]=value;
}
fs.writeFileSync('assets/guide-drafts.js',`// Generated review-only machine translations.\nwindow.ELIFA_GUIDE_DRAFTS=${JSON.stringify(drafts)};\n`);
console.log(`Compiled guide drafts: ${Object.keys(drafts).join(', ')||'none'}`);
