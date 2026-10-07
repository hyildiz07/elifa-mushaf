import {FirebaseAuthentication} from '@capacitor-firebase/authentication';

// Capacitor invokes the system account UI. The Firebase Web SDK remains the
// source of truth for the existing account API and cloud backup session.
window.elifaNativeAuth={
 async google(){
  const result=await FirebaseAuthentication.signInWithGoogle({skipNativeAuth:true});
  const idToken=result.credential?.idToken;
  if(!idToken)throw Error('Google oturumu doğrulanamadı. Yeniden dene.');
  return idToken;
 },
 async apple(){
  const result=await FirebaseAuthentication.signInWithApple({skipNativeAuth:true});
  const idToken=result.credential?.idToken,nonce=result.credential?.nonce;
  if(!idToken||!nonce)throw Error('Apple oturumu doğrulanamadı. Yeniden dene.');
  return {idToken,nonce,authorizationCode:result.credential?.authorizationCode};
 },
 async revokeApple(authorizationCode){
  if(!authorizationCode)throw Error('Apple yetkisi iptal edilemedi. Yeniden dene.');
  await FirebaseAuthentication.revokeAccessToken({token:authorizationCode});
 }
};
