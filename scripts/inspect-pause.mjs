import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('const QTEXT='),html.indexOf('\n',html.indexOf('const QTEXT=')));
const q=vm.runInNewContext(source+'; QTEXT');
const [sid='4',ay='12']=process.argv.slice(2);
const words=q[sid][ay-1][2].filter(w=>w[1]===0).map(w=>w[0]);
if(process.argv.includes('--compare')){
  const ts=html.indexOf('const QTEXT_TR=');const qt=vm.runInNewContext(html.slice(ts,html.indexOf('\n',ts))+'; QTEXT_TR');
  const alt=qt[sid][ay-1].split(/\s+/).filter(Boolean);
  for(let i=0;i<Math.max(words.length,alt.length);i++)console.log(i+1,words[i]||'',alt[i]||'');
}
if(process.argv[4])for(const p of process.argv[4].split(',').map(Number))console.log('word',p,words[p-1]);
const positions=words.map((w,i)=>/[\u06D6\u06D7\u06D8\u06DA]/.test(w)?i+1:null).filter(Boolean);
console.log('page',q[sid][ay-1][1],'words',words.length,'stops',positions);
for(const pos of positions)console.log(pos,words.slice(Math.max(0,pos-4),Math.min(words.length,pos+3)).join(' '));
