const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fields=['account','profile','workspace','deleteAccount','deleteEffects','visibility','keys','retention'];
const paragraph=(key,text)=>`<p data-policy="${key}">${escape(text)}</p>`;

export function updatePrivacyBehavior(html,copy){
 if(!copy||typeof copy.date!=='string'||fields.some(key=>typeof copy[key]!=='string'||!copy[key].trim()))throw Error('Privacy behavior translations are incomplete');
 if(html.includes('data-policy="account"')){
  for(const key of fields){
   const expression=new RegExp(`<p data-policy="${key}">[\\s\\S]*?<\\/p>`);
   if(!expression.test(html))throw Error('Privacy section missing: '+key);
   html=html.replace(expression,paragraph(key,copy[key]));
  }
 }else{
  const matches=[...html.matchAll(/<p(?: [^>]*)?>[\s\S]*?<\/p>/g)];
  if(matches.length!==14)throw Error('Unexpected legacy privacy layout; do not replace paragraphs by guess');
  const replacements=new Map([
   [2,paragraph('account',copy.account)+'\n'+paragraph('profile',copy.profile)],
   [5,paragraph('workspace',copy.workspace)],
   [6,paragraph('deleteAccount',copy.deleteAccount)],
   [8,paragraph('deleteEffects',copy.deleteEffects)],
   [9,paragraph('visibility',copy.visibility)+'\n'+paragraph('keys',copy.keys)+'\n'+paragraph('retention',copy.retention)],
   [10,matches[10][0].replace('<p>','<p data-policy="providers">')],
   [11,matches[11][0].replace('<p>','<p data-policy="analytics">')]
  ]);
  for(const index of [...replacements.keys()].sort((a,b)=>b-a)){
   const match=matches[index];html=html.slice(0,match.index)+replacements.get(index)+html.slice(match.index+match[0].length);
  }
 }
 const metadata=html.match(/(<h1>[^<]*<\/h1>\s*<p>)([\s\S]*?)(<\/p>)/);
 if(!metadata)throw Error('Privacy metadata missing');
 const parts=metadata[2].split(' · ');if(parts.length<4)throw Error('Privacy metadata has unexpected structure');
 parts[2]=escape(copy.date);html=html.replace(metadata[0],metadata[1]+parts.join(' · ')+metadata[3]);
 return html;
}
