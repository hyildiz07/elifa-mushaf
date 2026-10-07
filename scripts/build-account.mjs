import {build} from 'esbuild';
import {copyFileSync} from 'node:fs';
import './compile-account-drafts.mjs';
await build({entryPoints:['src/account.mjs'],bundle:true,format:'esm',platform:'browser',target:['es2020'],outfile:'assets/account.js',minify:true,legalComments:'eof'});
await build({entryPoints:['src/split-audio.mjs'],bundle:true,format:'esm',platform:'browser',target:['es2020'],outfile:'assets/split-audio.js',minify:true,legalComments:'eof'});
copyFileSync('src/verified-verse-audio.mjs','assets/verified-verse-audio.js');
