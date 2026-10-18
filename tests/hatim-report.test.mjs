import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hatimReportData,hatimReportHtml,renderHatimReportCanvas,downloadHatimReport} from '../src/hatim-report.mjs';
const group=(items,title='Birlikte Hatim')=>({type:'hatim',code:'test01',title,items});
const now=new Date('2026-10-18T12:00:00Z');
test('only the actual complete thirty-cüz set is described as a completed hatim',()=>{
 const items=Array.from({length:30},(_,i)=>({no:i+1,name:'Kişi '+i,status:'okundu'}));
 const full=hatimReportData(group(items),{now});assert.equal(full.full,true);assert.equal(full.complete,true);assert.match(full.summary,/Hatim tamamlandı/);
 const partial=hatimReportData({...group(items.slice(0,4)),fullHatim:true,complete:true},{now});
 assert.equal(partial.full,false);assert.equal(partial.complete,true);assert.match(partial.summary,/4 cüzlük çalışma tamamlandı/);assert.doesNotMatch(partial.summary,/30|Hatim tamamlandı/);
 items[29].status='alindi';const unfinished=hatimReportData({...group(items),complete:true},{now});assert.equal(unfinished.complete,false);assert.equal(unfinished.done,29);assert.match(unfinished.summary,/devam ediyor/);
});
test('report distinguishes waiting and empty cüz; names never imply they have been read',()=>{
 const report=hatimReportData(group([{no:3,name:'Bekleyen',status:'alindi'},{no:1,name:'Okuyan',status:'okundu'},{no:2,name:'',status:'bos'}]),{now});
 assert.deepEqual(report.items.map(x=>x.no),[1,2,3]);assert.equal(report.done,1);assert.equal(report.available,1);assert.equal(report.taken,2);
 const html=hatimReportHtml(group(report.items),{now});assert.match(html,/Katılımcılar ve cüz durumu/);assert.match(html,/Bekleyen<\/td><td class="">Okunacak/);assert.match(html,/Henüz seçilmedi/);assert.doesNotMatch(html,/Okuyanlar/);
});
test('HTML report escapes titles and names and includes no capabilities, private keys, UID or external resources',()=>{
 const org={...group([{no:1,name:'<img src=x onerror=alert(1)>',status:'alindi',claimHash:'secret',ownerUid:'uid'}],'<script>bad()</script>'),adminToken:'admin',capability:'private'};
 const html=hatimReportHtml(org,{now});assert.match(html,/&lt;script&gt;/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<script|<img|src="https|claimHash|ownerUid|adminToken|capability/);
});
test('invalid rows, duplicate cüz and empty reports are rejected rather than generating misleading summaries',async()=>{
 for(const org of [group([]),group([{no:1,status:'other'}]),group([{no:1,status:'okundu'},{no:1,status:'okundu'}]),{type:'zikir',items:[]}])assert.throws(()=>hatimReportData(org));
 await assert.rejects(downloadHatimReport(group([{no:1,status:'bos'}]),{format:'unknown'}));
});
test('canvas height grows with long titles and long names, keeping the complete footer inside its bounds',async()=>{
 const texts=[],context={font:'',fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},measureText:s=>({width:String(s).length*18}),fillText:(text,x,y)=>texts.push({text,x,y})};
 const canvas={width:0,height:0,getContext:()=>context};
 const document={createElement:()=>canvas,fonts:{load:async()=>{}},defaultView:{getComputedStyle:()=>({getPropertyValue:()=>''})},documentElement:{}};
 const items=Array.from({length:30},(_,i)=>({no:i+1,name:'Uzun katılımcı adı '.repeat(4),status:i%3?'alindi':'okundu'}));
 const result=await renderHatimReportCanvas(group(items,'Çok uzun bir hatim başlığı '.repeat(5)),{document,now});
 assert.equal(result.width,1080);assert.ok(result.height>1500);assert.ok(texts.every(t=>t.y<result.height-24));
 assert.ok(texts.some(t=>t.text==='Katılımcılar ve cüz durumu'));assert.ok(texts.some(t=>t.text==='Okunacak'));assert.ok(texts.some(t=>t.text==='Allah kabul etsin'));
});
