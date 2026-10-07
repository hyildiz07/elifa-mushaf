import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const appDirectory=path.join(root,'ios','App','App');
const source=process.argv[2];
if(!source)throw Error('Usage: npm run ios:firebase -- <path-to-GoogleService-Info.plist>');

const xml=fs.readFileSync(path.resolve(source),'utf8');
function plistString(key){
  const match=xml.match(new RegExp(`<key>${key}<\\/key>\\s*<string>([^<]+)<\\/string>`));
  return match?.[1];
}
const bundleId=plistString('BUNDLE_ID');
const scheme=plistString('REVERSED_CLIENT_ID');
const expected=JSON.parse(fs.readFileSync(path.join(root,'capacitor.config.json'),'utf8')).appId;
if(bundleId!==expected)throw Error(`Firebase iOS Bundle ID mismatch: expected ${expected}, got ${bundleId||'missing'}`);
if(!scheme||!/^com\.googleusercontent\.apps\.[A-Za-z0-9_-]+$/.test(scheme))throw Error('Firebase iOS REVERSED_CLIENT_ID is missing or invalid');

const infoPath=path.join(appDirectory,'Info.plist');
let info=fs.readFileSync(infoPath,'utf8');
const start='<!-- ELIFA_GOOGLE_URL_SCHEME_START -->',end='<!-- ELIFA_GOOGLE_URL_SCHEME_END -->';
const urlConfig=`\n\t${start}\n\t<key>CFBundleURLTypes</key>\n\t<array>\n\t\t<dict>\n\t\t\t<key>CFBundleURLSchemes</key>\n\t\t\t<array><string>${scheme}</string></array>\n\t\t</dict>\n\t</array>\n\t${end}`;
if(info.includes(start)&&info.includes(end)){
  const block=/\s*<!-- ELIFA_GOOGLE_URL_SCHEME_START -->[\s\S]*?<!-- ELIFA_GOOGLE_URL_SCHEME_END -->/;
  info=info.replace(block,urlConfig);
}
else{
  if(info.includes('<key>CFBundleURLTypes</key>'))throw Error('Info.plist already has URL Types; configure Google scheme in Xcode manually');
  if(!info.includes('<key>CFBundleExecutable</key>'))throw Error('iOS Info.plist layout changed');
  info=info.replace('<key>CFBundleExecutable</key>',urlConfig+'\n\t<key>CFBundleExecutable</key>');
}

const target=path.join(appDirectory,'GoogleService-Info.plist');
if(path.resolve(source)!==target)fs.copyFileSync(path.resolve(source),target);
fs.writeFileSync(infoPath,info);
console.log(`Firebase iOS settings applied for ${bundleId}; Google URL scheme configured.`);
