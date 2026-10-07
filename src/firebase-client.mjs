import {initializeApp} from 'firebase/app';
import {getAuth,initializeAuth,indexedDBLocalPersistence,connectAuthEmulator} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator} from 'firebase/firestore';
export const isLocal=!window.ELIFA_NATIVE_IOS&&/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
// Local previews always use isolated emulators, never the production user database.
export const app=initializeApp(isLocal?{apiKey:'demo-key',projectId:'demo-elifa-mushaf',authDomain:'localhost'}:window.ELIFA_FB);
export const auth=window.ELIFA_NATIVE_IOS?initializeAuth(app,{persistence:indexedDBLocalPersistence}):getAuth(app);
export const db=getFirestore(app);
auth.languageCode=window.ElifaLocale?.current?.()||'en';
window.addEventListener('elifa:language-changed',event=>{auth.languageCode=event.detail?.lang||'en';});
if(isLocal){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8080);}
