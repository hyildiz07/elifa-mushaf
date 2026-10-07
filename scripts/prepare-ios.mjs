import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';

const root=process.cwd();
const source=path.resolve(root,'dist');
const output=path.resolve(root,'ios-www');
if(path.dirname(output)!==path.resolve(root)||path.basename(output)!=='ios-www')throw Error('Invalid iOS output path');
if(!fs.existsSync(path.join(source,'index.html')))throw Error('Run npm run build before preparing iOS');
fs.rmSync(output,{recursive:true,force:true});
function copyDirectory(from,to){
  fs.mkdirSync(to,{recursive:true});
  for(const entry of fs.readdirSync(from,{withFileTypes:true})){
    const sourcePath=path.join(from,entry.name),targetPath=path.join(to,entry.name);
    if(entry.isDirectory())copyDirectory(sourcePath,targetPath);
    else if(entry.isFile())fs.copyFileSync(sourcePath,targetPath);
    else throw Error(`Unsupported iOS asset: ${sourcePath}`);
  }
}
copyDirectory(source,output);
await build({entryPoints:[path.join(root,'src/ios-native-auth.mjs')],bundle:true,format:'esm',platform:'browser',target:['es2020'],outfile:path.join(output,'assets/ios-native-auth.js'),minify:true,legalComments:'eof'});
const htmlPath=path.join(output,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
const accountScripts=[...html.matchAll(/<script\s+type="module"\s+src="\/assets\/account\.js(?:\?v=\d+)?"><\/script>/g)];
if(accountScripts.length!==1||!html.includes('</head>'))throw Error('iOS script injection point changed');
const accountScript=accountScripts[0][0];
html=html.replace('</head>',"<script>window.ELIFA_NATIVE_IOS=true;window.ELIFA_API_BASE='https://mushaf.elifaplatform.com';window.ELIFA_PUBLIC_BASE='https://mushaf.elifaplatform.com/';</script>\n</head>");
html=html.replace(accountScript,'<script type="module" src="/assets/ios-native-auth.js"></script>\n'+accountScript);
fs.writeFileSync(htmlPath,html);
console.log('Prepared bundled iOS web assets in ios-www/');
