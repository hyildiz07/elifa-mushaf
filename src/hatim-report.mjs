const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={bos:'Boş',alindi:'Okunacak',okundu:'Okundu'};
const defaults={paper:'#fffaf0',ink:'#15334c',muted:'#67717a',accent:'#a47a28',line:'#d9ca9f'};

function dateLabel(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';
 const d=new Date(value+'T00:00:00Z');
 return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value?d.toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}):'';
}

export function hatimReportData(org,{now=new Date()}={}){
 if(!org||org.type!=='hatim'||!Array.isArray(org.items)||!org.items.length||org.items.length>30)throw Error('Raporlanacak cüz çalışması bulunamadı.');
 const items=org.items.map(item=>{
  if(!item||!Number.isInteger(item.no)||item.no<1||item.no>30||!Object.hasOwn(labels,item.status))throw Error('Cüz bilgileri geçersiz; rapor için listeyi yenile.');
  return {no:item.no,name:typeof item.name==='string'?item.name.trim().slice(0,60):'',status:item.status,label:labels[item.status]};
 }).sort((a,b)=>a.no-b.no);
 if(new Set(items.map(x=>x.no)).size!==items.length)throw Error('Cüz listesi tekrarlı; rapor için listeyi yenile.');
 const full=items.length===30&&items.every((item,i)=>item.no===i+1);
 const done=items.filter(x=>x.status==='okundu').length,available=items.filter(x=>x.status==='bos').length;
 const complete=done===items.length;
 const summary=full
  ?complete?'30 cüzün tamamı okundu olarak işaretlendi. Hatim tamamlandı.':`30 cüzün ${done}’i okundu; hatim devam ediyor.`
  :complete?`Seçilen ${items.length} cüzlük çalışma tamamlandı.`:`Seçilen ${items.length} cüzün ${done}’i okundu; çalışma devam ediyor.`;
 return {title:String(org.title||'Birlikte Hatim').trim().slice(0,120),code:/^[a-z0-9]{6}$/.test(org.code)?org.code:'',
  adminName:typeof org.adminName==='string'?org.adminName.trim().slice(0,60):'',
  heading:full?'Hatim raporu':'Cüz çalışması raporu',items,total:items.length,done,available,taken:items.length-available,full,complete,summary,
  date:new Date(now).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}),dueDate:dateLabel(org.dueDate),
  note:'Durumlar katılımcıların bildirimlerine göre gösterilir.'};
}

function themeColors(doc){
 const css=doc?.defaultView?.getComputedStyle?.(doc.documentElement);
 const keys={paper:'--zemin',ink:'--ink',muted:'--muted',accent:'--yildiz',line:'--line'};
 const safe=value=>/^(?:#[\da-f]{3,8}|[a-z]+|(?:rgb|hsl)a?\([\d\s.,%/deg+-]+\))$/i.test(value);
 return Object.fromEntries(Object.entries(keys).map(([key,name])=>{const value=css?.getPropertyValue(name)?.trim();return [key,value&&safe(value)?value:defaults[key]];}));
}

function wrap(ctx,value,width){
 const lines=[];let line='';
 for(const word of String(value||'').split(/\s+/).filter(Boolean)){
  if(ctx.measureText(word).width>width){
   if(line){lines.push(line);line='';}
   let part='';
   for(const char of word){if(part&&ctx.measureText(part+char).width>width){lines.push(part);part='';}part+=char;}
   line=part;continue;
  }
  const next=line?line+' '+word:word;
  if(line&&ctx.measureText(next).width>width){lines.push(line);line=word;}else line=next;
 }
 if(line)lines.push(line);return lines.length?lines:[''];
}

export async function renderHatimReportCanvas(org,{document:doc=globalThis.document,now=new Date()}={}){
 const data=hatimReportData(org,{now}),colors=themeColors(doc);
 try{await Promise.all([doc.fonts?.load('600 56px Lora'),doc.fonts?.load('500 26px Outfit')]);}catch{}
 const canvas=doc.createElement('canvas');canvas.width=1080;canvas.height=100;
 let ctx=canvas.getContext('2d');if(!ctx)throw Error('Bu tarayıcı rapor görseli oluşturamıyor.');
 const W=1080,pad=72,gap=42,col=(W-pad*2-gap)/2;
 ctx.font='600 56px Lora, Georgia, serif';const titleLines=wrap(ctx,data.title,W-pad*2);
 ctx.font='400 27px Outfit, Arial, sans-serif';const summaryLines=wrap(ctx,data.summary,W-pad*2);
 ctx.font='500 25px Outfit, Arial, sans-serif';
 const half=Math.ceil(data.items.length/2),rows=[];
 for(let row=0;row<half;row++){
  const cells=[data.items[row],data.items[row+half]].map(item=>item?{...item,lines:wrap(ctx,item.no+'. cüz — '+(item.name||'Henüz seçilmedi'),col-24)}:null);
  rows.push({cells,height:Math.max(...cells.filter(Boolean).map(x=>x.lines.length))*32+53});
 }
 const summaryY=144+titleLines.length*68+62,tableY=summaryY+summaryLines.length*36+113;
 const footerY=tableY+rows.reduce((n,row)=>n+row.height,0)+40;
 canvas.height=footerY+158;ctx=canvas.getContext('2d');
 ctx.fillStyle=colors.paper;ctx.fillRect(0,0,W,canvas.height);
 ctx.strokeStyle=colors.accent;ctx.lineWidth=2;ctx.strokeRect(24,24,W-48,canvas.height-48);
 ctx.strokeStyle=colors.line;ctx.lineWidth=1;ctx.strokeRect(38,38,W-76,canvas.height-76);
 ctx.textAlign='center';ctx.fillStyle=colors.accent;ctx.font='600 23px Outfit, Arial, sans-serif';ctx.fillText('ELIFA · BİRLİKTE HATİM',W/2,94);
 ctx.fillStyle=colors.ink;ctx.font='600 56px Lora, Georgia, serif';titleLines.forEach((line,i)=>ctx.fillText(line,W/2,160+i*68));
 ctx.fillStyle=colors.muted;ctx.font='400 23px Outfit, Arial, sans-serif';
 if(data.adminName)ctx.fillText('Yönetici: '+data.adminName,W/2,summaryY-70);
 const metadata=[data.heading,data.date,data.dueDate?'Hedef: '+data.dueDate:''].filter(Boolean).join(' · ');
 ctx.fillText(metadata,W/2,summaryY-40);
 ctx.fillStyle=colors.accent;ctx.font='700 62px Outfit, Arial, sans-serif';ctx.fillText(data.done+' / '+data.total,W/2,summaryY+28);
 ctx.fillStyle=colors.ink;ctx.font='400 27px Outfit, Arial, sans-serif';summaryLines.forEach((line,i)=>ctx.fillText(line,W/2,summaryY+78+i*36));
 ctx.textAlign='left';ctx.font='600 30px Lora, Georgia, serif';ctx.fillText('Katılımcılar ve cüz durumu',pad,tableY-25);
 let y=tableY;
 for(const row of rows){
  row.cells.forEach((cell,i)=>{
   if(!cell)return;const x=pad+i*(col+gap);
   ctx.strokeStyle=colors.line;ctx.beginPath();ctx.moveTo(x,y+row.height-11);ctx.lineTo(x+col,y+row.height-11);ctx.stroke();
   ctx.fillStyle=colors.ink;ctx.font='500 25px Outfit, Arial, sans-serif';cell.lines.forEach((line,k)=>ctx.fillText(line,x+4,y+27+k*32));
   ctx.fillStyle=cell.status==='okundu'?colors.accent:colors.muted;ctx.font='400 22px Outfit, Arial, sans-serif';ctx.fillText(cell.label,x+4,y+cell.lines.length*32+25);
  });y+=row.height;
 }
 ctx.textAlign='center';ctx.fillStyle=colors.accent;ctx.font='600 38px Lora, Georgia, serif';ctx.fillText('Allah kabul etsin',W/2,footerY+32);
 ctx.fillStyle=colors.muted;ctx.font='400 21px Outfit, Arial, sans-serif';ctx.fillText(data.note,W/2,footerY+76);
 ctx.font='500 18px Outfit, Arial, sans-serif';ctx.fillText('ELIFAPLATFORM.COM'+(data.code?' · '+data.code:''),W/2,footerY+113);
 return canvas;
}

export function hatimReportHtml(org,{now=new Date()}={}){
 const d=hatimReportData(org,{now});
 // Fixed safe color defaults are used for print so dark app themes do not
 // produce a full dark page or unreadable printer output.
 return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(d.heading)} — ${escape(d.title)}</title><style>
 @page{size:A4;margin:12mm}*{box-sizing:border-box}body{margin:0;background:#f2f1ed;color:#15334c;font:14px Arial,sans-serif}.report{max-width:800px;margin:16px auto;padding:30px;background:#fffef9;border:1px solid #d9ca9f}header{text-align:center;border-bottom:1px solid #d9ca9f;padding-bottom:18px}.brand{color:#a47a28;letter-spacing:2px;font-size:12px}h1{font:600 30px Georgia,serif;overflow-wrap:anywhere;margin:15px 0 10px}.meta,.note{color:#5c6670;font-size:12px}.score{color:#946c21;font:bold 36px Georgia,serif;margin:14px 0 8px}.summary{margin:8px 0}h2{font:600 20px Georgia,serif}table{width:100%;border-collapse:collapse}thead{display:table-header-group}th{text-align:left;background:#f5f0e3}th,td{padding:7px 9px;border-bottom:1px solid #e3d9c1;vertical-align:top;overflow-wrap:anywhere}td:first-child{width:65px}td:last-child{width:105px}tr{break-inside:avoid}.done{color:#86611b;font-weight:bold}footer{text-align:center;margin-top:22px}.blessing{font:600 22px Georgia,serif;color:#946c21}@media print{body{background:white}.report{margin:0;max-width:none;border:0;padding:0}h1{font-size:26px}th,td{padding:5px 8px}.note{font-size:11px}}
 </style></head><body><main class="report" id="reportRoot"><header><div class="brand">ELIFA · BİRLİKTE HATİM</div><h1>${escape(d.title)}</h1><div class="meta">${escape(d.heading)} · ${escape(d.date)}${d.dueDate?' · Hedef: '+escape(d.dueDate):''}</div>${d.adminName?'<p class="meta">Yönetici: '+escape(d.adminName)+'</p>':''}<div class="score">${d.done} / ${d.total}</div><p class="summary">${escape(d.summary)}</p></header><h2>Katılımcılar ve cüz durumu</h2><table><thead><tr><th>Cüz</th><th>Görünen ad</th><th>Durum</th></tr></thead><tbody>${d.items.map(i=>`<tr><td>${i.no}.</td><td>${escape(i.name||'Henüz seçilmedi')}</td><td class="${i.status==='okundu'?'done':''}">${escape(i.label)}</td></tr>`).join('')}</tbody></table><footer><p class="blessing">Allah kabul etsin</p><p class="note">${escape(d.note)}</p><p class="note">ELIFAPLATFORM.COM${d.code?' · '+escape(d.code):''}</p></footer></main></body></html>`;
}

function pdfPreview(org,{document:doc,now}){
 doc.getElementById('elifaHatimReportPreview')?.remove();
 const colors=themeColors(doc),dialog=doc.createElement('dialog');dialog.id='elifaHatimReportPreview';
 dialog.setAttribute('aria-label','Hatim raporu · PDF önizleme');
 dialog.style.cssText=`width:min(900px,96vw);height:min(900px,94dvh);max-height:94dvh;border:1px solid ${colors.line};border-radius:18px;padding:14px;color:${colors.ink};background:${colors.paper};`;
 const header=doc.createElement('header');header.style.cssText='display:flex;gap:10px;align-items:center;justify-content:space-between;margin-bottom:10px';
 const heading=doc.createElement('strong');heading.textContent='Rapor · PDF olarak kaydet';
 const close=doc.createElement('button');close.type='button';close.textContent='Kapat';close.addEventListener('click',()=>dialog.close());header.append(heading,close);
 const note=doc.createElement('p');note.textContent='Yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullanabilirsin.';note.style.cssText='font-size:13px;margin:8px 0';
 const frame=doc.createElement('iframe');frame.title='Hatim raporu önizlemesi';frame.style.cssText='width:100%;height:calc(100% - 125px);min-height:240px;border:1px solid '+colors.line+';border-radius:8px;background:white';
 const print=doc.createElement('button');print.type='button';print.textContent='Yazdır / PDF olarak kaydet';print.disabled=true;
 print.style.cssText=`width:100%;padding:12px;margin-top:10px;border-radius:10px;border:1px solid ${colors.accent};background:${colors.paper};color:${colors.ink};font-weight:700`;
 frame.addEventListener('load',()=>{print.disabled=!frame.contentDocument?.getElementById('reportRoot');});
 print.addEventListener('click',()=>{try{frame.contentWindow.focus();frame.contentWindow.print();}catch{note.textContent='Yazdırma açılamadı. Bu raporu PNG olarak indirebilirsin.';}});
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.append(header,note,frame,print);doc.body.append(dialog);
 frame.srcdoc=hatimReportHtml(org,{now});dialog.showModal();return {format:'pdf',preview:true};
}

export async function downloadHatimReport(org,{format='png',document:doc=globalThis.document,window:win=globalThis.window,now=new Date()}={}){
 if(!['png','pdf'].includes(format))throw Error('Desteklenmeyen rapor biçimi.');
 const data=hatimReportData(org,{now});
 if(format==='pdf')return pdfPreview(org,{document:doc,now});
 const canvas=await renderHatimReportCanvas(org,{document:doc,now});
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Rapor görseli oluşturulamadı.')),'image/png'));
 const url=win.URL.createObjectURL(blob),anchor=doc.createElement('a');anchor.download='hatim-raporu-'+(data.code||'elifa')+'.png';anchor.href=url;
 doc.body.append(anchor);anchor.click();anchor.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);
 return {format:'png',downloaded:true};
}
