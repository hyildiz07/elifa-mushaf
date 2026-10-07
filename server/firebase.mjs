import {initializeApp,getApps,cert,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
export function firebaseServices(){
  let app=getApps().find(a=>a.name==='elifa-server');
  if(!app){
    const emulator=!!process.env.FIREBASE_AUTH_EMULATOR_HOST;
    const projectId=process.env.FIREBASE_PROJECT_ID||'elifa-mushaf';
    if(emulator&&!projectId.startsWith('demo-'))throw Error('Emulators require a demo project');
    const raw=process.env.FIREBASE_SERVICE_ACCOUNT;
    app=initializeApp({projectId,...(!emulator?{credential:raw?cert(JSON.parse(raw)):applicationDefault()}:{})},'elifa-server');
  }
  return {auth:getAuth(app),db:getFirestore(app)};
}
