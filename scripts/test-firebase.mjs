import {spawn} from 'node:child_process';
const env={...process.env,FIREBASE_PROJECT_ID:'demo-elifa-mushaf',FIREBASE_AUTH_EMULATOR_HOST:process.env.FIREBASE_AUTH_EMULATOR_HOST||'127.0.0.1:9099',FIRESTORE_EMULATOR_HOST:process.env.FIRESTORE_EMULATOR_HOST||'127.0.0.1:8080'};
for(const host of [env.FIREBASE_AUTH_EMULATOR_HOST,env.FIRESTORE_EMULATOR_HOST]){
  try{await fetch('http://'+host+'/',{signal:AbortSignal.timeout(2000)});}catch{throw Error(`Start the Firebase emulator at ${host} before this integration test.`);}
}
const child=spawn(process.execPath,['--test','tests/firebase-account.test.mjs'],{env,stdio:'inherit'});
child.on('exit',code=>process.exit(code??1));
