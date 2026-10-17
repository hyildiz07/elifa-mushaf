export async function verifyPrayerResponse(response,record){
  if(!response?.ok||!/^audio\//.test(response.headers.get('content-type')||''))throw Error('Invalid prayer audio');
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength!==record.bytes)throw Error('Incomplete prayer audio');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==record.sha256)throw Error('Prayer recording changed');
  return bytes;
}
export async function loadPrayerBytes(record,{cache=null,fetcher=fetch,signal}={}){
  let cached;try{cached=await cache?.match(record.path);}catch{}
  if(cached){
    try{return await verifyPrayerResponse(cached,record);}catch{
      // Remove only this reproducible audio download, never personal study data.
      try{await cache.delete(record.path);}catch{}
    }
  }
  return verifyPrayerResponse(await fetcher(record.path,{signal}),record);
}
