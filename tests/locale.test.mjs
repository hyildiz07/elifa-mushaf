import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import locale from '../netlify/functions/locale.mjs';

const source=fs.readFileSync(new URL('../assets/locale.js',import.meta.url),'utf8');
function browser({languages=['en-US'],saved,mode,country}={}){
  const values=new Map();
  if(saved)values.set('elifaLang',saved);
  if(mode)values.set('elifaLangMode',mode);
  let reloads=0;
  const context={
    navigator:{languages,language:languages[0]},
    localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},
    fetch:()=>Promise.resolve(new Response(JSON.stringify({country}),{headers:{'content-type':'application/json'}})),
    location:{reload:()=>reloads++},Response,Set,Promise
  };
  context.globalThis=context;
  vm.runInNewContext(source,context);
  return {context,values,reloads:()=>reloads};
}

test('Netlify locale endpoint exposes only the country and is never cached',async()=>{
  const response=await locale(new Request('https://example.test/api/locale'),{geo:{country:{code:'DE'}}});
  assert.deepEqual(await response.json(),{country:'DE'});
  assert.match(response.headers.get('cache-control'),/no-store/);
});
test('first visit uses country language, unknown country falls back to English',async()=>{
  const german=browser({languages:['tr-TR'],country:'DE'});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(german.values.get('elifaLang'),'de');
  assert.equal(german.reloads(),1);
  const unknown=browser({languages:['tr-TR'],country:'NO'});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(unknown.values.get('elifaLang'),'en');
});
test('multilingual country respects device language and explicit or inferred manual choices remain',async()=>{
  const belgian=browser({languages:['fr-BE'],country:'BE'});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(belgian.values.get('elifaLang'),'fr');
  const manual=browser({languages:['de-DE'],country:'FR',saved:'tr',mode:'manual'});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(manual.values.get('elifaLang'),'tr');
  assert.equal(manual.reloads(),0);
  const legacy=browser({languages:['de-DE'],country:'FR',saved:'tr'});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(legacy.values.get('elifaLang'),'tr');
  assert.equal(legacy.values.get('elifaLangMode'),'manual');
});

test('legacy automatic device language migrates so country selection is not blocked',async()=>{
  const legacy=browser({languages:['tr-TR'],country:'DE',saved:'tr'});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(legacy.values.get('elifaLangMode'),'auto');
  assert.equal(legacy.values.get('elifaLang'),'de');
  assert.equal(legacy.reloads(),1);
});

test('country mapping covers supported languages outside their largest markets',async()=>{
  const examples={AO:'pt',CD:'sw',KG:'ru',SR:'nl',TG:'fr'};
  for(const [country,expected] of Object.entries(examples)){
    const result=browser({languages:[expected],country});
    await new Promise(resolve=>setTimeout(resolve,0));
    assert.equal(result.values.get('elifaLang'),expected,country);
  }
});
