import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleAdminAnnouncements} from '../server/admin-announcements.mjs';

function database(){
 const entries=new Map();
 const legacy=new Map();
 return {entries,legacy,collection(name){assert.ok(['duyurular','config'].includes(name));const records=name==='config'?legacy:entries;return {
  async get(){return {docs:[...records].map(([id,value])=>({id,data:()=>value}))};},
  doc(id){return {async get(){return {exists:records.has(id),data:()=>records.get(id)};},async set(value,{merge}={}){records.set(id,merge?{...records.get(id),...value}:value);},async update(value){records.set(id,{...records.get(id),...value});},async delete(){records.delete(id);}};}
 };}};
}
const body=async response=>response.json();

test('owner can publish, list, hide, edit and delete a first-open announcement',async()=>{
 const db=database(),now=()=>123456;
 const created=await body(await handleAdminAnnouncements('saveAnnouncement',{baslik:'Yeni özellik',mesaj:'Merhaba',mode:'once'},db,{role:'owner',now}));
 assert.match(created.id,/^[a-f0-9]{24}$/);
 let list=await body(await handleAdminAnnouncements('announcements',{},db,{role:'owner'}));
 assert.equal(list.announcements[0].aktif,true);assert.equal(list.announcements[0].mesaj,'Merhaba');
 await handleAdminAnnouncements('setAnnouncementActive',{id:created.id,active:false},db,{role:'owner',now});
 await handleAdminAnnouncements('saveAnnouncement',{id:created.id,baslik:'Güncellendi',mesaj:'Yeni metin',aktif:false},db,{role:'owner',now});
 list=await body(await handleAdminAnnouncements('announcements',{},db,{role:'owner'}));
 assert.equal(list.announcements.length,1);assert.equal(list.announcements[0].aktif,false);assert.equal(list.announcements[0].baslik,'Güncellendi');
 await handleAdminAnnouncements('deleteAnnouncement',{id:created.id},db,{role:'owner'});
 assert.deepEqual((await body(await handleAdminAnnouncements('announcements',{},db,{role:'owner'}))).announcements,[]);
});

test('the earlier single announcement appears in the same panel and can be hidden',async()=>{
 const db=database();db.legacy.set('duyuru',{id:'old',baslik:'Eski mesaj',mesaj:'Merhaba',aktif:true});
 const list=await body(await handleAdminAnnouncements('announcements',{},db,{role:'owner'}));
 assert.equal(list.announcements[0].id,'legacy-config');
 await handleAdminAnnouncements('setAnnouncementActive',{id:'legacy-config',active:false},db,{role:'owner'});
 assert.equal(db.legacy.get('duyuru').aktif,false);
});

test('non-owner cannot read or change announcements and invalid messages are rejected',async()=>{
 const db=database();
 for(const role of [null,'admin','moderator']){
  assert.equal((await handleAdminAnnouncements('announcements',{},db,{role})).status,403);
  assert.equal((await handleAdminAnnouncements('saveAnnouncement',{mesaj:'Yetkisiz'},db,{role})).status,403);
 }
 assert.equal((await handleAdminAnnouncements('saveAnnouncement',{mesaj:'   '},db,{role:'owner'})).status,400);
 assert.equal((await handleAdminAnnouncements('saveAnnouncement',{mesaj:'Test',mode:'scheduled',startAt:10,endAt:9},db,{role:'owner'})).status,400);
 assert.equal(db.entries.size,0);
});
