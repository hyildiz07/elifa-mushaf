import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import './build-account.mjs';
import './compile-guide-drafts.mjs';
import './apply-ui-extra-overrides.mjs';
import './fix-privacy-legal-name.mjs';
import './fix-privacy-providers.mjs';
if(process.env.CONTEXT==='production'){
  execFileSync(process.execPath,['scripts/validate-i18n-drafts.mjs'],{stdio:'inherit'});
  if(process.env.ELIFA_PUBLISH_TRANSLATION_DRAFTS!=='1')
    execFileSync(process.execPath,['scripts/audit-i18n.mjs','--strict'],{stdio:'inherit'});
}
const root=process.cwd(),out=path.join(root,'dist');
fs.mkdirSync(out,{recursive:true});
const files=['index.html','admin.html','manifest.json','version.json','duyuru.json',
  'greek-translation-simple.json','sw.js','service-worker.js','_headers','_redirects',
  ...fs.readdirSync(root).filter(f=>/^manual-[a-z-]+\.json$/.test(f)||/\.(png|svg)$/.test(f))];
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(out,file));
function copyDirectory(source,target){
  fs.mkdirSync(target,{recursive:true});
  for(const entry of fs.readdirSync(source,{withFileTypes:true})){
    const from=path.join(source,entry.name),to=path.join(target,entry.name);
    if(entry.isDirectory())copyDirectory(from,to);
    else if(entry.isFile())fs.copyFileSync(from,to);
    else throw new Error(`Unsupported build entry: ${from}`);
  }
}
for(const dir of ['f','gizlilik','destek','.well-known','assets'])copyDirectory(path.join(root,dir),path.join(out,dir));
console.log(`Built ${files.length} files plus fonts, privacy/support pages and app links in dist/`);
