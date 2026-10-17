import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {loadPrayerBytes} from '../src/prayer-audio-cache.mjs';
import {prayerCatalog} from '../src/dua-catalog.mjs';
const html=fs.readFileSync('index.html','utf8'),at=html.indexOf('var NAMAZ=['),end=html.indexOf('\n  ];',at)+6;
const texts=vm.runInNewContext(html.slice(at,end)+';NAMAZ');
test('removed recent programs and mosque cards do not clutter the prayer list',()=>{
 const catalog=prayerCatalog(texts);assert.equal(catalog.filter(x=>x.audioOnly).length,0);
 for(const id of ['evden-cikis','evden-cikis-siginma','mescide-gidis','mescide-giris','mishary-sabah-program','mishary-aksam-program','mishary-uyku-program','mishary-secme-dualar-program'])assert.equal(catalog.find(x=>x.id===id),undefined);
 for(const id of ['kuran-baslama','ezan','subhaneke','istihare','yemek','istigfar'])assert.ok(catalog.some(x=>x.id===id));
});
test('optional audio cache failures do not block a working online recording',async()=>{
 const data=new Uint8Array([1,2,3,4]),r={path:'/prayer.mp3',bytes:4,sha256:createHash('sha256').update(data).digest('hex')};
 const fetcher=async()=>new Response(data,{headers:{'Content-Type':'audio/mpeg'}});
 for(const cache of [{match:async()=>{throw Error('Storage unavailable');}},{match:async()=>new Response(new Uint8Array([9]),{headers:{'Content-Type':'audio/mpeg'}}),delete:async()=>{throw Error('Delete failed');}}])assert.deepEqual(new Uint8Array(await loadPrayerBytes(r,{cache,fetcher})),data);
});
