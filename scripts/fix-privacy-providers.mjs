import fs from 'node:fs';

const languages=['de','ru','ar','fr','es','el','zh','ja','ko','hi','ur','it','id','nl','pt','fa','bn','ms','sw'];
const providers={2:['Firebase Authentication'],3:['Cloud Firestore'],
  10:['QuranCDN','Firebase Authentication','Cloud Firestore'],11:['Google Analytics']};
for(const language of languages){
 const filename=`gizlilik/${language}.html`;
 if(!fs.existsSync(filename))continue;
 let html=fs.readFileSync(filename,'utf8');
 const paragraphs=[...html.matchAll(/<p(?: [^>]*)?>[\s\S]*?<\/p>/g)];
 if(paragraphs.length<12)throw new Error(`${filename}: policy paragraphs missing`);
 for(const index of Object.keys(providers).map(Number).sort((a,b)=>b-a)){
  const paragraph=paragraphs[index];
  const missing=providers[index].filter(name=>!paragraph[0].includes(name));
  if(!missing.length)continue;
  const addition=' ('+missing.map(name=>`<bdi>${name}</bdi>`).join(' · ')+')';
  const offset=paragraph.index+paragraph[0].length-4;
  html=html.slice(0,offset)+addition+html.slice(offset);
 }
 fs.writeFileSync(filename,html);
}
