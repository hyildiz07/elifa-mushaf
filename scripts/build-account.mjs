import {build} from 'esbuild';
import {copyFileSync} from 'node:fs';
import './compile-account-drafts.mjs';
await build({entryPoints:['src/account.mjs'],bundle:true,format:'esm',platform:'browser',target:['es2020'],outfile:'assets/account.js',minify:true,legalComments:'eof'});
await build({entryPoints:['src/split-audio.mjs'],bundle:true,format:'esm',platform:'browser',target:['es2020'],outfile:'assets/split-audio.js',minify:true,legalComments:'eof'});
copyFileSync('src/verified-verse-audio.mjs','assets/verified-verse-audio.js');

await build({entryPoints:['src/study-workflow.mjs'],bundle:true,format:'iife',platform:'browser',target:['es2020'],outfile:'assets/study-workflow.js',legalComments:'none'});

await build({entryPoints:['src/dua-practice.mjs'],bundle:true,format:'iife',platform:'browser',target:['es2020'],outfile:'assets/dua-practice.js',legalComments:'none'});

await build({entryPoints:['src/hatim-community.mjs'],bundle:true,format:'iife',platform:'browser',target:['es2020'],outfile:'assets/hatim-community.js',legalComments:'none'});
