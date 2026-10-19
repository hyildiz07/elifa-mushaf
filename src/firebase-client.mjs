import {initializeApp} from 'firebase/app';
import {initializeAuth,indexedDBLocalPersistence,browserLocalPersistence,browserSessionPersistence,connectAuthEmulator} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator} from 'firebase/firestore';
export const isPreview=(typeof __ELIFA_ACCOUNT_PREVIEW__!=='undefined'&&__ELIFA_ACCOUNT_PREVIEW__)||/^deploy-preview-\d+--[a-z0-9-]+\.netlify\.app$/i.test(location.hostname||new URL(location.href).hostname);
export const isLocal=!window.ELIFA_NATIVE_IOS&&/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
// Local previews always use isolated emulators, never the production user database.
// Hosted previews stay entirely outside Firebase: even restoring a persisted
// Auth session can refresh a production token before any UI action is taken.
export const app=isPreview?null:initializeApp(isLocal?{apiKey:'demo-key',projectId:'demo-elifa-mushaf',authDomain:'localhost'}:window.ELIFA_FB);
// getAuth() eagerly starts the popup/redirect iframe on mobile before restoring
// the session. We use popups only after a click, so keep the same persistence
// hierarchy without that network dependency during app startup.
export const auth=isPreview?null:initializeAuth(app,{persistence:window.ELIFA_NATIVE_IOS?indexedDBLocalPersistence:[indexedDBLocalPersistence,browserLocalPersistence,browserSessionPersistence]});
export const db=isPreview?null:getFirestore(app);
if(auth){
 auth.languageCode=window.ElifaLocale?.current?.()||'en';
 window.addEventListener('elifa:language-changed',event=>{auth.languageCode=event.detail?.lang||'en';});
}
if(isLocal&&!isPreview){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8080);}
