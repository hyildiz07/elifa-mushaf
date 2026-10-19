if(!/^(localhost|127\.0\.0\.1)$/.test(location.hostname))throw Error('Only local preview');
window.ELIFA_API_BASE='/review-member';
let user={uid:'review-organizer',displayName:'Ayşe',emailVerified:true};const listeners=new Set();
window.elifaAccountSession={getUser:()=>user,isReady:()=>true,getIdToken:async()=>user?'local-fixture-only:'+user.uid:null,onChange(fn){listeners.add(fn);queueMicrotask(()=>fn(user));return ()=>listeners.delete(fn);}};
window.show=name=>{for(const id of ['birlikte','org']){const el=document.getElementById(id);el.hidden=id!==name;el.classList.toggle('on',id===name);}};
window.openTogetherScreen=()=>{window.show('birlikte');window.renderBirlikte?.();};
window.setElifaRoute=()=>{};window.backFromTogether=()=>window.openTogetherScreen();window.toast=text=>document.getElementById('fixtureStatus').textContent=text;
function selectUser(uid){user=uid?{uid,displayName:uid==='review-organizer'?'Ayşe':'Mehmet',emailVerified:uid!=='review-unverified'}:null;document.getElementById('fixtureUser').textContent=user?user.displayName+' · '+uid:'Hesapsız deneme';for(const fn of listeners)fn(user);window.dispatchEvent(new CustomEvent('elifa:account-changed',{detail:{user}}));}
window.elifaAccount={open:()=>selectUser('review-member')};
document.querySelectorAll('[data-user]').forEach(b=>b.onclick=()=>selectUser(b.dataset.user));document.getElementById('fixtureDark').onclick=()=>document.body.dataset.dark=document.body.dataset.dark==='1'?'0':'1';
document.getElementById('fixtureHome').onclick=()=>{window.elifaHatimNavigation?.('birlikte');window.openTogetherScreen();};
await import('/src/hatim-community.mjs');
const {createCommunityAdmin}=await import('/src/community-admin-ui.mjs');
createCommunityAdmin({entry:document.getElementById('setCommunityAdmin'),host:document.getElementById('communityAdminDialog'),session:()=>window.elifaAccountSession,apiBase:'/review-member'}).initialize();
selectUser(user.uid);await window.renderBirlikte();
