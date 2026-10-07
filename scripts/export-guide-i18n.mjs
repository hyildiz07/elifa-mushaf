import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
const match=html.match(/var GUIDE_L10N=(\{[^\n]+\});/);
if(!match)throw new Error('Guide source not found');
fs.mkdirSync('locales',{recursive:true});
fs.writeFileSync('locales/guide-en.json',JSON.stringify(JSON.parse(match[1]).en,null,2)+'\n');
