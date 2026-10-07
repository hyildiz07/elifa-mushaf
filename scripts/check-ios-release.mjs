import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));
const errors=[];
const appId=JSON.parse(read('capacitor.config.json')).appId;
const project=read('ios/App/App.xcodeproj/project.pbxproj');
const info=read('ios/App/App/Info.plist');
const packageSwift=read('ios/App/CapApp-SPM/Package.swift');
const appDelegate=read('ios/App/App/AppDelegate.swift');

if((project.match(new RegExp(`PRODUCT_BUNDLE_IDENTIFIER = ${appId.replaceAll('.','\\.')};`,'g'))||[]).length!==2)
  errors.push('Xcode Debug/Release Bundle ID, capacitor.config.json ile eşleşmiyor.');
if(!project.includes('GoogleService-Info.plist in Resources'))
  errors.push('GoogleService-Info.plist Xcode Resources içinde değil.');
if(!project.includes('CODE_SIGN_ENTITLEMENTS = App/App.entitlements;')||!read('ios/App/App/App.entitlements').includes('com.apple.developer.applesignin'))
  errors.push('Sign in with Apple entitlement Xcode hedefinde yok.');
if(!appDelegate.includes('ApplicationDelegateProxy.shared.application(app, open: url'))
  errors.push('Google giriş URL dönüşü AppDelegate içinde yönlendirilmiyor.');
if(!packageSwift.includes('traits: ["Google"]'))
  errors.push('iOS Swift paketi Google giriş özelliğiyle eşitlenmemiş. npm run ios:sync çalıştırın.');

const firebaseFile='ios/App/App/GoogleService-Info.plist';
if(!exists(firebaseFile))errors.push(`Firebase iOS dosyası eksik. Firebase'den indirip npm run ios:firebase -- <dosya-yolu> çalıştırın.`);
else{
  const xml=read(firebaseFile);
  const value=key=>xml.match(new RegExp(`<key>${key}<\\/key>\\s*<string>([^<]+)<\\/string>`))?.[1];
  if(value('BUNDLE_ID')!==appId)errors.push('Firebase iOS Bundle ID eşleşmiyor.');
  if(!value('REVERSED_CLIENT_ID')||!info.includes(`<string>${value('REVERSED_CLIENT_ID')}</string>`))
    errors.push('Google URL scheme Info.plist içinde yok veya Firebase dosyasıyla eşleşmiyor.');
}

const webFile='ios/App/App/public/index.html';
if(!exists(webFile))errors.push('Paketlenmiş web uygulaması yok. npm run ios:sync çalıştırın.');
else{
  const html=read(webFile);
  if(!html.includes('ELIFA_NATIVE_IOS=true')||!html.includes('/assets/ios-native-auth.js'))
    errors.push('iOS yerel giriş köprüsü paketlenmiş HTML içinde yok.');
  if(!html.includes("ELIFA_PUBLIC_BASE='https://mushaf.elifaplatform.com/'")||!html.includes('function bkShareBase()'))
    errors.push('iOS paylaşım bağlantıları herkese açık web adresine yönlenmiyor.');
}
const icon=fs.readFileSync(path.join(root,'app-store/icon-1024.png'));
if(icon.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||icon.readUInt32BE(16)!==1024||icon.readUInt32BE(20)!==1024||![2,3].includes(icon[25]))
  errors.push('App Store ikonu 1024×1024 ve alfa kanalsız PNG değil.');

if(errors.length){
  console.error('iOS yayıma hazırlıkta eksikler:');
  for(const error of errors)console.error(`- ${error}`);
  process.exitCode=1;
}else console.log('iOS kaynak ve Firebase ön kontrolü geçti. Xcode arşivi, gerçek cihaz ve App Store Connect kontrolleri ayrıca gerekir.');
