const fields=new Set(['displayName','age','birthDate','gender']);
export function validateProfile(value,now=new Date()){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!fields.has(k)))throw Error('Profil bilgileri geçersiz.');
 if(value.displayName!==undefined&&typeof value.displayName!=='string')throw Error('Görünen ad geçersiz.');
 const displayName=typeof value.displayName==='string'?value.displayName.trim().normalize('NFC'):'';
 if(displayName.length>60||/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069<>]/.test(displayName))throw Error('Görünen ad en fazla 60 karakter olabilir; HTML veya görünmez yön işaretleri kullanma.');
 if(value.age!==null&&value.age!==undefined&&value.age!==''&&typeof value.age!=='number'&&!(typeof value.age==='string'&&/^\d{1,3}$/.test(value.age)))throw Error('Yaş geçersiz.');
 const age=value.age===null||value.age===undefined||value.age===''?null:Number(value.age);
 if(age!==null&&(!Number.isInteger(age)||age<1||age>120))throw Error('Yaş 1 ile 120 arasında olmalı.');
 const birthDate=value.birthDate===undefined||value.birthDate===null||value.birthDate===''?null:value.birthDate;
 if(birthDate!==null){
  if(typeof birthDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(birthDate))throw Error('Doğum tarihi geçersiz.');
  const date=new Date(birthDate+'T12:00:00Z'),today=now.toISOString().slice(0,10);
  if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==birthDate||birthDate>today||now.getUTCFullYear()-date.getUTCFullYear()>120)throw Error('Doğum tarihi geçersiz.');
 }
 if(age!==null&&birthDate!==null)throw Error('Yaş veya doğum tarihinden yalnızca birini seç.');
 const gender=value.gender===undefined||value.gender===null||value.gender===''?'unspecified':value.gender;
 if(!['unspecified','female','male'].includes(gender))throw Error('Cinsiyet seçimi geçersiz.');
 return {displayName,age,birthDate,gender};
}
