import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const account=fs.readFileSync('src/account.mjs','utf8');
const mount=account.slice(account.indexOf('function mountAccountNavigation(){'));
function fixture(){
 const nodes=new Map(),events=[];
 class Node{
  constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.className='';this.hidden=false;this.textContent='';this.dataset={};this.scrollTop=0;this.classList={toggle:(name,on)=>{const list=new Set(this.className.split(' ').filter(Boolean));on?list.add(name):list.delete(name);this.className=[...list].join(' ');}};}
  set id(value){this._id=value;nodes.set(value,this);}get id(){return this._id;}
  append(...items){for(const n of items){if(n.parentElement)n.parentElement.children=n.parentElement.children.filter(x=>x!==n);n.parentElement=this;this.children.push(n);}}
  prepend(n){this.append(n);this.children.pop();this.children.unshift(n);}
  replaceChildren(...items){for(const n of this.children)n.parentElement=null;this.children=[];this.append(...items);}
  matches(s){return s.startsWith('.')?this.className.split(' ').includes(s.slice(1)):this.tag===s;}
  closest(s){for(let n=this;n;n=n.parentElement)if(n.matches(s))return n;return null;}
  querySelector(s){return this.children.flatMap(n=>[n,...n.descendants()]).find(n=>n.matches(s))||null;}
  querySelectorAll(s){return s===':scope > p.account-muted'?this.children.filter(n=>n.tag==='p'&&n.matches('.account-muted')):[];}
  descendants(){return this.children.flatMap(n=>[n,...n.descendants()]);}
  get previousElementSibling(){const siblings=this.parentElement?.children||[];return siblings[siblings.indexOf(this)-1]||null;}
  setAttribute(k,v){this.attrs[k]=String(v);}focus(){events.push(['focus',this.id]);}
 }
 const make=(tag,id,parent,cls)=>{const n=new Node(tag);if(id)n.id=id;if(cls)n.className=cls;if(parent)parent.append(n);return n;};
 const dialog=make('dialog','accountDialog'),head=make('div',null,dialog,'account-head'),body=make('div',null,dialog,'account-body');make('h2','accountTitle',head);make('button','accountClose',head);
 const guest=make('div','accountGuest',body),member=make('div','accountMember',body);make('button','accountHome');make('p',null,guest,'account-muted');
 make('section','accountProfileCard',member);make('section','accountGuestImport',member);make('div','accountVerification',member);
 const summary=make('div',null,member,'account-card');for(const id of ['accountEmail','accountProvider','accountLastSync','accountSyncStatus','accountBackupStatus'])make('span',id,make('p',null,summary));
 make('p','accountDeviceNote',member);
 const sync=make('div',null,member,'account-card');make('strong',null,sync);const syncLabel=make('label',null,sync);make('input','accountSyncEnabled',syncLabel);make('span',null,syncLabel);make('button','accountSyncNow',sync);make('div','accountConflict',sync);
 const save=make('div',null,member,'account-card');make('strong',null,save);const consent=make('label',null,save);make('input','accountCloudConsent',consent);make('span',null,consent);make('button','accountSave',save);
 make('h3',null,member);make('p','accountBackupCount',member);make('button','accountRefresh',member);make('ul','accountBackupList',member);
 for(const id of ['accountLinkGoogle','accountResetPassword','accountLogout'])make('button',id,member);
 make('form','accountDeleteForm',make('details',null,member));const undo=make('details',null,body);make('summary',null,undo);make('p',null,undo);make('button','accountUndo',undo);make('button','accountRetry',body);
 const lookup=id=>{const node=nodes.get(id);let top=node;while(top?.parentElement)top=top.parentElement;return top===dialog||top===nodes.get('accountHome')?node:null;};
 const c=vm.createContext({document:{getElementById:lookup,createElement:tag=>new Node(tag)},dialog,$:lookup,user:{displayName:'Ada',emailVerified:true},profileName:null,pendingConflict:null,accountText:v=>v,accountLanguage:()=> 'tr',message:v=>events.push(['message',v]),
  profileUI:{load:async()=>events.push(['profile']),hasGuestChoice:()=>false},loadBackups:async()=>events.push(['backups']),action:async()=>events.push(['action']),errorText:e=>e.message});
 vm.runInContext(mount+'\nvar nav=mountAccountNavigation();',c);
 return {c,nodes,events,body,member,guest,nav:c.nav};
}
test('account home reuses existing protected controls in deliberate panels and does no profile or backup work',()=>{
 const f=fixture();assert.deepEqual(f.events,[]);assert.equal(f.nodes.get('accountView-home').hidden,false);
 assert.equal(f.nodes.get('accountEmail').closest('.account-profile-summary')?.children.length,2);
 for(const id of ['profile','sync','backups','security','device'])assert.equal(f.nodes.get('accountView-'+id).hidden,true,id);
 assert.equal(f.nodes.get('accountDeleteForm').closest('details').parentElement,f.nodes.get('accountView-security'));
 assert.equal(f.nodes.get('accountBackupList').parentElement,f.nodes.get('accountView-backups'));
 assert.equal(f.nodes.get('accountGuestImport').parentElement,f.nodes.get('accountView-device'));
});
test('panel changes reset the actual body scroller and only fetch deliberately selected data',async()=>{
 const f=fixture();f.body.scrollTop=300;f.nav.show('profile');assert.equal(f.body.scrollTop,0);assert.ok(f.events.some(e=>e[0]==='profile'));assert.equal(f.events.some(e=>e[0]==='backups'),false);
 f.body.scrollTop=200;f.nav.show('backups');await Promise.resolve();assert.equal(f.body.scrollTop,0);assert.ok(f.events.some(e=>e[0]==='backups'));assert.equal(f.events.some(e=>e[0]==='action'),false,'read panels do not lock all controls');
 f.nav.show('home');assert.equal(f.nodes.get('accountPanelBack').hidden,true);
});
test('pending record conflicts stay actionable without opening an unsolicited profile or losing the edited panel',()=>{
 const f=fixture();f.nav.show('profile');f.c.pendingConflict=[{id:'notes'}];f.nav.render();
 assert.equal(f.nodes.get('accountAttention').hidden,false);assert.equal(f.nodes.get('accountHome').dataset.attention,'true');assert.equal(f.nav.panel(),'profile');
 f.nodes.get('accountAttention').children[1].onclick();assert.equal(f.nav.panel(),'sync');assert.equal(f.nodes.get('accountConflict').closest('.account-card').parentElement,f.nodes.get('accountView-sync'));
});
test('switching identities resets the panel, header, scroll and stale action feedback',()=>{
 const f=fixture();f.nav.show('security');f.body.scrollTop=200;f.c.user={displayName:'B',emailVerified:false};f.nav.reset();
 assert.equal(f.nav.panel(),'home');assert.equal(f.nodes.get('accountTitle').textContent,'Hesabım');assert.equal(f.nodes.get('accountDisplayName').textContent,'B');assert.equal(f.body.scrollTop,0);assert.ok(f.events.some(e=>e[0]==='message'&&e[1]===''));
});
test('a late panel-read error cannot overwrite the next identity’s clean home status',async()=>{
 const f=fixture();let fail;f.c.loadBackups=()=>new Promise((_resolve,reject)=>fail=reject);
 f.nav.show('backups');f.c.user={displayName:'B',emailVerified:true};f.nav.reset();fail(Error('A old error'));await Promise.resolve();await Promise.resolve();
 assert.equal(f.events.some(e=>e[0]==='message'&&e[1]==='A old error'),false);assert.equal(f.nav.panel(),'home');
});
test('the open panel header and menu labels follow a deliberate locale change',()=>{
 const f=fixture();f.nav.show('security');f.c.accountText=v=>'Translated: '+v;f.nav.render();
 assert.equal(f.nodes.get('accountTitle').textContent,'Translated: Hesap seçenekleri');
 assert.equal(f.nodes.get('accountNav-profile').children[1].children[0].textContent,'Translated: Bilgilerim');
});

test('backups use simple restore actions and retain the hidden status node without a duplicate summary',()=>{
 const f=fixture(),status=f.nodes.get('accountBackupStatus'),backups=f.nodes.get('accountView-backups'),undo=f.nodes.get('accountUndo').closest('details');
 assert.equal(status.closest('p').hidden,true);assert.equal(status.closest('p').parentElement,backups);
 assert.equal(f.nodes.get('accountBackupCount').previousElementSibling.textContent,'Sakladığım yedekler');
 assert.equal(undo.querySelector('summary').textContent,'Son yüklemeyi geri al');assert.equal(f.nodes.get('accountUndo').textContent,'Son yüklemeyi geri al');
 assert.equal(undo.querySelector('p').textContent,'Son yüklemeden önceki kayıtlarına dönebilirsin.');
});
