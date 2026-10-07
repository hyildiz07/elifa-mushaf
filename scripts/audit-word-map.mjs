import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const context=vm.createContext({});
for(const name of ['QTEXT','QTEXT_TR']){
  const at=html.indexOf('const '+name+'=');
  vm.runInContext(html.slice(at,html.indexOf('\n',at)),context);
}
const {QTEXT,QTEXT_TR}=vm.runInContext('({QTEXT,QTEXT_TR})',context);
const norm=s=>s.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640\s]/g,'')
  .replace(/[ٱأإآ]/g,'ا').replace(/[ىی]/g,'ي').replace(/ة/g,'ه').replace(/[ؤ]/g,'و').replace(/[ئ]/g,'ي')
  .replace(/[^\u0621-\u063A\u0641-\u064A]/g,'');
function align(base,alt){
  const out=[];let i=0,j=0;
  while(i<base.length||j<alt.length){
    if(i>=base.length||j>=alt.length)return null;
    const ai=i,bj=j;let a='',b='';
    for(let turn=0;turn<8;turn++){
      if(a&&a===b)break;
      if(a.length<=b.length&&i<base.length)a+=norm(base[i++]);
      else if(j<alt.length)b+=norm(alt[j++]);
      else return null;
      if(i-ai>4||j-bj>4)return null;
    }
    if(!a||a!==b)return null;
    for(let k=bj;k<j;k++)out[k]=[ai+1,i];
  }
  return out;
}
function distance(a,b){
  const row=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    let prev=row[0];row[0]=i;
    for(let j=1;j<=b.length;j++){
      const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old;
    }
  }
  return row[b.length];
}
function alignFuzzy(base,alt){
  if(base.length>alt.length)return null;
  const n=base.length,m=alt.length,dp=Array.from({length:n+1},()=>Array(m+1).fill(null));
  dp[0][0]={score:0};
  for(let i=0;i<n;i++)for(let j=0;j<m;j++)if(dp[i][j]){
    const a=norm(base[i]);
    for(let len=1;len<=3&&j+len<=m;len++){
      const b=norm(alt.slice(j,j+len).join(''));
      if(!a||!b)continue;
      const d=distance(a,b),ratio=d/Math.max(a.length,b.length);
      if(ratio>.51||d>Math.max(2,Math.floor(a.length*.4)))continue;
      const score=dp[i][j].score+ratio+(len-1)*.08;
      if(!dp[i+1][j+len]||score<dp[i+1][j+len].score)dp[i+1][j+len]={score,from:j,len,ratio};
    }
  }
  if(!dp[n][m])return null;
  const groups=[];let j=m,maxRatio=0;
  for(let i=n;i>0;i--){const item=dp[i][j];groups.unshift({from:item.from,to:j,ratio:item.ratio});maxRatio=Math.max(maxRatio,item.ratio);j=item.from;}
  return {score:dp[n][m].score,maxRatio,groups};
}
let exact=0,total=0,differ=0,mappedDiffer=0,fuzzy=0,fuzzyDiffer=0;const examples=[],fuzzyExamples=[],uncertain=[],groupsByText={},diffCounts={},maxRatioCounts={};
for(let sid=1;sid<=114;sid++)for(let v=0;v<QTEXT[sid].length;v++){
  const base=QTEXT[sid][v][2].filter(w=>w[1]===0).map(w=>w[0]);
  const alt=QTEXT_TR[sid][v].split(/\s+/).filter(Boolean);
  total++;if(base.length!==alt.length){differ++;const delta=alt.length-base.length;diffCounts[delta]=(diffCounts[delta]||0)+1;}
  const map=align(base,alt);
  if(map){exact++;if(base.length!==alt.length)mappedDiffer++;}
  else if(examples.length<6)examples.push({key:`${sid}:${v+1}`,base:base.length,alt:alt.length,baseText:base.slice(0,8).map(x=>[x,norm(x)]),altText:alt.slice(0,8).map(x=>[x,norm(x)])});
  const f=alignFuzzy(base,alt);
  if(f){fuzzy++;if(base.length!==alt.length){fuzzyDiffer++;const bucket=(Math.ceil(f.maxRatio*20)/20).toFixed(2);maxRatioCounts[bucket]=(maxRatioCounts[bucket]||0)+1;const groups=f.groups.filter(x=>x.to-x.from>1).map(x=>alt.slice(x.from,x.to).join(' '));for(const group of groups)groupsByText[group]=(groupsByText[group]||0)+1;if(f.maxRatio>.35)uncertain.push({key:`${sid}:${v+1}`,maxRatio:f.maxRatio,groups});if(fuzzyExamples.length<12)fuzzyExamples.push({key:`${sid}:${v+1}`,base:base.length,alt:alt.length,score:f.score,maxRatio:f.maxRatio,groups});}}
}
console.log(JSON.stringify({total,exact,differ,diffCounts,mappedDiffer,fuzzy,fuzzyDiffer,maxRatioCounts,uncertain,groupsByText:Object.entries(groupsByText).sort((a,b)=>b[1]-a[1]).slice(0,50),fuzzyExamples:process.argv.includes('--details')?fuzzyExamples:undefined,examples:process.argv.includes('--details')?examples:undefined},null,2));
