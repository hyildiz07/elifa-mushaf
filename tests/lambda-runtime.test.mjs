import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('all deployed functions load with Lambda experimental module features disabled',()=>{
 const source="await import('./netlify/functions/account.mjs');await import('./netlify/functions/org.mjs');await import('./netlify/functions/org-cleanup.mjs');";
 const result=spawnSync(process.execPath,['--no-experimental-require-module','--no-experimental-detect-module','--input-type=module','-e',source],{encoding:'utf8',timeout:60000});
 assert.equal(result.status,0,result.stderr||result.error?.message);
});
