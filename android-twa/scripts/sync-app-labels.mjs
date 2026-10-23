import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repository = path.dirname(root);
const sourceFiles = ['localization-west.json', 'localization-east.json'];
const listingGroups = await Promise.all(sourceFiles.map(async file => {
  const text = await fs.readFile(path.join(repository,'store-assets/google-play',file),'utf8');
  return JSON.parse(text);
}));
const listings = listingGroups.flat();
const turkish = {locale:'tr-TR',webLanguage:'tr',appName:'Kur’an-ı Kerim Hafız',launcherName:'Kur’an-ı Kerim Hafız'};
const expectedLanguages = ['tr','de','en','ru','ar','fr','es','el','zh','ja','ko','hi','ur','it','id','nl','pt','fa','bn','ms','sw'];
const byLanguage = new Map();
for (const listing of [turkish,...listings]) {
  if (!byLanguage.has(listing.webLanguage)) byLanguage.set(listing.webLanguage, listing);
}
assert.deepEqual([...byLanguage.keys()].sort(), [...expectedLanguages].sort(), 'All 21 app languages must have names');
const english = byLanguage.get('en');
assert.equal(english.appName,'Easy Quran Memorization');
assert.equal(english.launcherName,'Easy Quran');
const escaped = value => value.replaceAll('\\','\\\\').replaceAll('&','&amp;')
  .replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll("'","\\'").replaceAll('"','\\"');
const res = path.join(root,'app/src/main/res');
const defaultStringsPath = path.join(res,'values/strings.xml');
let defaultStrings = await fs.readFile(defaultStringsPath,'utf8');
for (const key of ['appName','launcherName']) {
  defaultStrings = defaultStrings.replace(new RegExp(`<string name="${key}">[\\s\\S]*?</string>`),
    `<string name="${key}">${escaped(english[key])}</string>`);
}
// Connection/configuration strings are shared by all locale configurations.
defaultStrings = defaultStrings.replace(/<string name="(?!appName"|launcherName")([^"]+)"(?: translatable="false")?>/g,
  '<string name="$1" translatable="false">');
await fs.writeFile(defaultStringsPath, defaultStrings);

const configurations = [{directory:'values',language:'en',locale:english.locale,appName:english.appName,launcherName:english.launcherName}];
async function writeLabels(directory,listing) {
  await fs.mkdir(path.join(res,directory),{recursive:true});
  const xml = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="appName">${escaped(listing.appName)}</string>\n    <string name="launcherName">${escaped(listing.launcherName)}</string>\n</resources>\n`;
  await fs.writeFile(path.join(res,directory,'strings.xml'),xml);
  configurations.push({directory,language:listing.webLanguage,locale:listing.locale,appName:listing.appName,launcherName:listing.launcherName});
}
for(const [language,listing] of byLanguage) {
  if(language==='en') continue;
  await writeLabels(`values-${language==='id'?'in':language}`,listing);
}
await writeLabels('values-pt-rBR',listings.find(x=>x.locale==='pt-BR'));
const traditional = listings.find(x=>x.locale==='zh-TW');
await writeLabels('values-zh-rTW',traditional);
await writeLabels('values-b+zh+Hant',traditional);

const manifest = {
  updatedOn:'2026-10-23',
  sources:sourceFiles.map(file=>`../store-assets/google-play/${file}`),
  languageCount:expectedLanguages.length,
  defaultLanguage:'en',
  selection:'Android device/app locale selects the label, independently of Play Store country targeting',
  androidLocaleAliases:{id:'in'},
  configurations
};
await fs.writeFile(path.join(root,'app-labels.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({languages:expectedLanguages.length,resourceConfigurations:configurations.length,defaultLanguage:'en'}));
