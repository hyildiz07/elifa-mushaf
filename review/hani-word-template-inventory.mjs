// Lists same-reciter comparison words for the unresolved 34:46 sound.
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const at=html.indexOf('const QTEXT=');
if(at<0)throw Error('QTEXT unavailable');
const qtext=JSON.parse(html.slice(at+'const QTEXT='.length,html.indexOf('\n',at)).replace(/;\s*$/,''));
function norm(s){return s.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'').replace(/[ٱأإآ]/g,'ا').replace(/[ىی]/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[^\u0621-\u063A\u0641-\u064A]/g,'');}
const matches=[];
for(const [sid,verses] of Object.entries(qtext))for(let a=0;a<verses.length;a++){
  const words=verses[a]?.[2]?.filter(w=>w[1]===0)||[];
  words.forEach((w,i)=>{const n=norm(w[0]);if(n.includes('شديد')||n.includes('شهيد'))
    matches.push({key:`${sid}:${a+1}`,position:i+1,text:w[0],norm:n,kind:n.includes('شديد')?'shadid':'shahid'});});
}
console.log(JSON.stringify({count:matches.length,matches},null,2));
