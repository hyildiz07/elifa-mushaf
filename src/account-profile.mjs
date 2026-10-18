import {validateProfile} from './account-profile-data.mjs';

export function mountAccountProfile({api,getUser,workspaces,action,onProfile,language=()=> 'tr'}){
 const tr=(a,b)=>language()==='tr'?a:b;
 const member=document.getElementById('accountMember');
 const style=document.createElement('style');style.textContent=`
 #accountProfileForm{margin:0}#accountProfileForm .profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
 #accountProfileForm .profile-choice{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0}
 #accountProfileForm .profile-choice button{padding:6px 9px;min-height:36px;font-size:12px}
 #accountProfileForm button[aria-pressed=true]{border-color:var(--gold,#b88b29);box-shadow:inset 0 0 0 1px var(--gold,#b88b29);background:var(--bg,#faf6ed)}
 #accountProfileForm .profile-actions,#accountGuestImport .profile-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
 #accountProfileForm .profile-actions button{flex:1}#accountProfileForm small{display:block;color:var(--muted,#596776);font-size:12px}
 #accountGuestImport .profile-conflict{padding:8px 0;border-top:1px solid var(--line,#ddd)}
 #accountGuestImport .profile-conflict label{display:inline-flex;gap:6px;align-items:center;margin-inline-end:12px}
 #accountProfileStatus{font-size:13px;margin:8px 0 0;overflow-wrap:anywhere}
 @media(max-width:380px){#accountProfileForm .profile-grid{grid-template-columns:1fr}}
 `;document.head.append(style);
 const card=document.createElement('section');card.className='account-card';card.id='accountProfileCard';
 // Only fixed UI copy is inserted as HTML. User values are assigned through
 // value/textContent and never rendered into markup or public attributes.
 card.innerHTML=`<form id="accountProfileForm"><strong>${tr('Profilini düzenle','Edit your profile')}</strong>
 <label for="profileDisplayName">${tr('Görünen ad / takma ad','Display name / nickname')}</label><input id="profileDisplayName" type="text" maxlength="60" autocomplete="nickname"><small>${tr('Hatimlerde yalnızca bu ad görünür. Gerçek adını yazmak zorunda değilsin.','Only this name is shown in shared khatms. Your real name is optional.')}</small>
 <div class="profile-grid"><div><label>${tr('Yaş bilgisi (isteğe bağlı)','Age information (optional)')}</label><div id="profileAgeChoice" class="profile-choice" role="group" aria-label="${tr('Yaş bilgisi biçimi','Age information format')}"></div>
 <label id="profileAgeRow" hidden>${tr('Yaş','Age')}<input id="profileAge" type="number" min="1" max="120" step="1" inputmode="numeric"></label>
 <label id="profileBirthRow" hidden>${tr('Doğum tarihi','Date of birth')}<input id="profileBirthDate" type="date" max="${new Date().toISOString().slice(0,10)}"></label></div>
 <div><label>${tr('Cinsiyet (isteğe bağlı)','Gender (optional)')}</label><div id="profileGenderChoice" class="profile-choice" role="group" aria-label="${tr('Cinsiyet','Gender')}"></div></div></div>
 <small>${tr('Yaş, doğum tarihi, cinsiyet ve e-posta başkalarına gösterilmez.','Age, birth date, gender and email are never shown to others.')}</small>
 <div class="profile-actions"><button type="submit" id="profileSave">${tr('Profili kaydet','Save profile')}</button><button type="button" id="profileRefresh">${tr('Yeniden yükle','Reload')}</button></div><p id="accountProfileStatus" role="status" aria-live="polite"></p></form>`;
 member.prepend(card);
 const $=id=>document.getElementById(id);let owner=null,revision=0,loaded=false,request=0,ageMode='none',gender='unspecified',inFlight=null;
 const choices=(id,values,select)=>{const box=$(id);for(const [key,label] of values){const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.value=key;button.onclick=()=>select(key);box.append(button);}};
 const pressed=(id,value)=>{for(const b of $(id).children)b.setAttribute('aria-pressed',String(b.dataset.value===value));};
 function setAge(value){ageMode=value;pressed('profileAgeChoice',value);$('profileAgeRow').hidden=value!=='age';$('profileBirthRow').hidden=value!=='date';}
 function setGender(value){gender=value;pressed('profileGenderChoice',value);}
 choices('profileAgeChoice',[['none',tr('Belirtme','Omit')],['age',tr('Yaş','Age')],['date',tr('Doğum tarihi','Birth date')]],setAge);
 choices('profileGenderChoice',[['unspecified',tr('Belirtme','Omit')],['female',tr('Kadın','Female')],['male',tr('Erkek','Male')]],setGender);
 function fill(profile){$('profileDisplayName').value=profile?.displayName||'';$('profileAge').value=profile?.age??'';$('profileBirthDate').value=profile?.birthDate||'';setAge(profile?.birthDate?'date':profile?.age?'age':'none');setGender(profile?.gender||'unspecified');}
 const status=text=>{$('accountProfileStatus').textContent=text;};
 async function doLoad(){
  const current=getUser();if(!current?.emailVerified){status(tr('Profili kaydetmek için e-postanı doğrula.','Verify your email to save your profile.'));return;}
  const uid=current.uid,ticket=++request;owner=uid;loaded=false;status(tr('Profil yükleniyor…','Loading profile…'));$('profileSave').disabled=true;
  try{const data=await api('profileGet');if(getUser()?.uid!==uid||request!==ticket)return;revision=data.revision;loaded=true;fill(data.profile);onProfile(data.profile);status('');}
  catch(e){if(getUser()?.uid===uid&&request===ticket)status(e.message);}
  finally{if(getUser()?.uid===uid&&request===ticket)$('profileSave').disabled=!loaded;}
 }
 function load(force=false){
  if(loaded&&owner===getUser()?.uid&&!force)return Promise.resolve();
  if(inFlight&&owner===getUser()?.uid)return inFlight;
  const job=doLoad();inFlight=job;job.finally(()=>{if(inFlight===job)inFlight=null;}).catch(()=>{});return job;
 }
 $('accountProfileForm').onsubmit=e=>{e.preventDefault();if(!loaded||owner!==getUser()?.uid)return;action(async()=>{
  const uid=owner,ticket=request;const profile=validateProfile({displayName:$('profileDisplayName').value,age:ageMode==='age'?$('profileAge').value:null,birthDate:ageMode==='date'?$('profileBirthDate').value:null,gender});
  const data=await api('profilePut',{profile,revision});if(getUser()?.uid!==uid||ticket!==request)return;revision=data.revision;fill(data.profile);onProfile(data.profile);status(tr('Profilin kaydedildi. Özel bilgilerin yalnızca sana görünür.','Profile saved. Your private information is visible only to you.'));
 });};
 $('profileRefresh').onclick=()=>action(()=>load(true));
 const guestCard=document.createElement('section');guestCard.id='accountGuestImport';guestCard.className='account-card';guestCard.hidden=true;member.prepend(guestCard);
 function guestOptions(){
  guestCard.replaceChildren();const title=document.createElement('strong');title.textContent=tr('Hesapsız kayıtların ayrı tutuluyor','Your guest records are kept separately');
  const note=document.createElement('p');note.className='account-muted';note.textContent=tr('Bu cihazdaki eski hesapsız not ve çalışmalarını istersen bu hesaba kopyalayabilirsin. Eski kopya korunur.','You can copy earlier guest notes and studies on this device into this account. The original copy is preserved.');
  const list=document.createElement('div'),actions=document.createElement('div');actions.className='profile-actions';
  const copy=document.createElement('button');copy.type='button';copy.textContent=tr('Kayıtları birleştir','Merge records');const keep=document.createElement('button');keep.type='button';keep.textContent=tr('Ayrı kalsın','Keep separate');
  const info=document.createElement('p');info.setAttribute('role','status');let conflicts=[];
  const uid=getUser()?.uid;
  copy.onclick=()=>action(async()=>{
   if(getUser()?.uid!==uid)throw Error(tr('Hesap değişti.','Account changed.'));
   const resolutions={};for(const item of conflicts){const input=[...list.querySelectorAll('input:checked')].find(n=>n.dataset.conflict===item.id);if(!input){info.textContent=tr('Her çakışma için kalacak kaydı seç.','Choose which version to keep for each conflict.');return;}resolutions[item.id]=input.value;}
   const result=workspaces.importGuest(uid,resolutions);conflicts=result.conflicts;
   if(!conflicts.length){location.reload();return;}
   list.replaceChildren();info.textContent=tr('Aynı kayıt farklı. Hangi sürüm kalsın?','The same record differs. Which version should remain?');
   conflicts.forEach((item,i)=>{const row=document.createElement('div');row.className='profile-conflict';const label=document.createElement('strong');label.textContent=item.key+' '+item.path;row.append(label);for(const [value,text] of [['local',tr('Bu hesap','This account')],['remote',tr('Hesapsız kayıt','Guest record')]]){const wrap=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='guest-conflict-'+i;input.value=value;input.dataset.conflict=item.id;wrap.append(input,document.createTextNode(text));row.append(wrap);}list.append(row);});
  });
  keep.onclick=()=>action(async()=>{if(getUser()?.uid!==uid)return;workspaces.keepGuestSeparate(uid);guestCard.hidden=true;});
  actions.append(copy,keep);guestCard.append(title,note,list,actions,info);
 }
 return {
  load,
  hasGuestChoice:()=>!guestCard.hidden,
  changed(){request++;inFlight=null;owner=null;loaded=false;revision=0;fill(null);$('profileSave').disabled=true;status('');try{guestCard.hidden=!workspaces.hasGuestData(getUser()?.uid);if(!guestCard.hidden)guestOptions();}catch{guestCard.hidden=true;}},
  ready:()=>loaded
 };
}
