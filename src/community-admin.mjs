import {createCommunityAdmin} from './community-admin-ui.mjs';
const entry=document.getElementById('setCommunityAdmin'),host=document.getElementById('communityAdminDialog');
if(entry&&host){
 const panel=createCommunityAdmin({entry,host,session:()=>window.elifaAccountSession,apiBase:window.ELIFA_API_BASE||'',preview:()=>__ELIFA_ACCOUNT_PREVIEW__});
 panel.initialize();
}
