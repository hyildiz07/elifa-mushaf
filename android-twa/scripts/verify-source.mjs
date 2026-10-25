import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const provenance=JSON.parse(fs.readFileSync(path.join(root,'resource-provenance.json'),'utf8'));
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
let replacements=0;
for(const item of provenance.resources){
 const target=path.resolve(root,item.target);
 assert.ok(target.startsWith(root+path.sep),'Resource path must stay inside project');
 const data=fs.readFileSync(target);
 assert.equal(data.length,item.bytes,item.target+' size');
 assert.equal(hash(data),item.sha256,item.target+' SHA-256');
 if(item.origin==='user-phone-artwork'){
  replacements++;
  assert.equal(item.source,'../store-assets/android/phone-icon-512.png');
  assert.equal(hash(fs.readFileSync(path.resolve(root,item.source))),item.sourceSha256,'Approved source artwork SHA-256');
  assert.match(item.originalExtraction.source,/^base\/res\/mipmap-/);
  assert.match(item.originalExtraction.sha256,/^[a-f0-9]{64}$/);
  assert.notEqual(item.sha256,item.originalExtraction.sha256,'Replaced artwork must not claim the old extracted hash');
  assert.equal(data.toString('hex',0,8),'89504e470d0a1a0a','PNG signature');
  assert.equal(data.readUInt32BE(16),item.dimensions.width,item.target+' width');
  assert.equal(data.readUInt32BE(20),item.dimensions.height,item.target+' height');
 }
}
assert.equal(replacements,10,'Five density variants of legacy and adaptive artwork');
assert.equal(provenance.iconReplacement.adaptive.canvasDp,108);
assert.equal(provenance.iconReplacement.adaptive.artworkDp,56);
const adaptive=fs.readFileSync(path.join(root,'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml'),'utf8');
assert.match(adaptive,/<background android:drawable="@color\/launcherBackground"/);
assert.match(adaptive,/<foreground android:drawable="@mipmap\/ic_maskable"/);
assert.doesNotMatch(adaptive,/8\.5dp/);
const wrapper=fs.readFileSync(path.join(root,'gradle/wrapper/gradle-wrapper.jar'));
assert.equal(crypto.createHash('sha256').update(wrapper).digest('hex'),provenance.gradleWrapper.wrapperJarSha256,'Official Gradle wrapper JAR SHA-256');
const wrapperProperties=fs.readFileSync(path.join(root,'gradle/wrapper/gradle-wrapper.properties'),'utf8');
assert.ok(wrapperProperties.includes('distributionSha256Sum='+provenance.gradleWrapper.distributionSha256));
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
assert.match(gradle,/applicationId = 'com\.elifaplatform\.mushaf'/);
assert.match(gradle,/minSdk = 24/);
assert.match(gradle,/targetSdk = 36/);
assert.match(gradle,/minifyEnabled = true/);
assert.match(gradle,/shrinkResources = true/);
assert.match(gradle,/proguard-android-optimize\.txt/);
assert.doesNotMatch(fs.readFileSync(path.join(root,'app/proguard-rules.pro'),'utf8'),/^-dontoptimize|^-keep /m);
assert.match(gradle,/debug \{ signingConfig = null \}/);
assert.match(gradle,/signingPresent == signingNames\.size\(\) \? signingConfigs\.getByName\('upload'\) : null/);
const strings=fs.readFileSync(path.join(root,'app/src/main/res/values/strings.xml'),'utf8');
assert.match(strings,/<string name="launchUrl" translatable="false">https:\/\/mushaf\.elifaplatform\.com\//);
const labels=JSON.parse(fs.readFileSync(path.join(root,'app-labels.json'),'utf8'));
assert.equal(labels.languageCount,21);
assert.equal(new Set(labels.configurations.map(x=>x.language)).size,21);
assert.equal(labels.configurations.length,24);
assert.ok(labels.configurations.some(x=>x.directory==='values-in'&&x.language==='id'));
assert.ok(labels.configurations.some(x=>x.directory==='values-pt-rBR'));
assert.ok(labels.configurations.some(x=>x.directory==='values-zh-rTW'));
assert.ok(labels.configurations.some(x=>x.directory==='values-b+zh+Hant'));
const escaped=value=>value.replaceAll('\\','\\\\').replaceAll('&','&amp;').replaceAll('<','&lt;')
 .replaceAll('>','&gt;').replaceAll("'","\\'").replaceAll('"','\\"');
for(const label of labels.configurations){
 const file=fs.readFileSync(path.join(root,'app/src/main/res',label.directory,'strings.xml'),'utf8');
 for(const key of ['appName','launcherName']){
  assert.ok(file.includes(`<string name="${key}">${escaped(label[key])}</string>`),label.directory+' '+key);
 }
 if(label.directory!=='values'){
  assert.equal([...file.matchAll(/<string /g)].length,2,'Localized files contain only the two name resources');
 }
}
console.log('TWA identity, unsigned default, '+(provenance.resources.length-replacements)+' retained original resources, '+replacements+' replacement artwork hashes and 21 label languages / 24 configurations verified.');
