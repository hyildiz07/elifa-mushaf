import fs from 'node:fs';

const company='ELIFA COLLECTIVE TEKSTIL TASARIM TICARET LIMITED SIRKETI';
const languages=['de','ru','ar','fr','es','el','zh','ja','ko','hi','ur','it','id','nl','pt','fa','bn','ms','sw'];
for(const language of languages){
 const file=`gizlilik/${language}.html`;
 if(!fs.existsSync(file))continue;
 let page=fs.readFileSync(file,'utf8');
 const match=page.match(/(<h1>[^<]*<\/h1>\s*<p>)([\s\S]*?)(<\/p>)/);
 if(!match)throw new Error(`${file}: first policy paragraph missing`);
 const parts=match[2].split(' · ');
 if(parts.length<4)throw new Error(`${file}: policy metadata separators missing`);
 const label=parts[1].match(/^[^:：]+[:：]/)?.[0]||'Developer:';
 parts[1]=`${label} <bdi>${company}</bdi>`;
 page=page.replace(match[0],match[1]+parts.join(' · ')+match[3]);
 fs.writeFileSync(file,page);
}
