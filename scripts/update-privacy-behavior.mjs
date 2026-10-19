import fs from 'node:fs';
import {updatePrivacyBehavior} from './privacy-policy-behavior.mjs';
const translations=JSON.parse(fs.readFileSync('locales/privacy-behavior-2026-10-19.json','utf8'));
for(const [language,copy]of Object.entries(translations)){
 const filename='gizlilik/'+(language==='tr'?'index':language)+'.html';
 if(!fs.existsSync(filename))throw Error('Missing privacy language: '+language);
 const html=fs.readFileSync(filename,'utf8'),updated=updatePrivacyBehavior(html,copy);
 if(updated!==html)fs.writeFileSync(filename,updated);
}
