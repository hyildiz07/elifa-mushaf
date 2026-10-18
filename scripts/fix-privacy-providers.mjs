import fs from 'node:fs';

const languages=['de','ru','ar','fr','es','el','zh','ja','ko','hi','ur','it','id','nl','pt','fa','bn','ms','sw'];
const providers={account:['Firebase Authentication'],profile:['Cloud Firestore'],
  providers:['QuranCDN','Firebase Authentication','Cloud Firestore'],analytics:['Google Analytics']};
for(const language of languages){
 const filename=`gizlilik/${language}.html`;
 if(!fs.existsSync(filename))continue;
 let html=fs.readFileSync(filename,'utf8');
 // Stable semantic markers replace old numeric paragraph offsets. New profile
 // and ownership explanations must not move provider names into wrong sections.
 for(const [section,names]of Object.entries(providers)){
  const paragraph=html.match(new RegExp(`<p data-policy="${section}">[\\s\\S]*?<\\/p>`));
  if(!paragraph)throw new Error(`${filename}: policy section missing: ${section}`);
  const missing=names.filter(name=>!paragraph[0].includes(name));
  if(!missing.length)continue;
  const addition=' ('+missing.map(name=>`<bdi>${name}</bdi>`).join(' · ')+')';
  const offset=paragraph.index+paragraph[0].length-4;
  html=html.slice(0,offset)+addition+html.slice(offset);
 }
 fs.writeFileSync(filename,html);
}
