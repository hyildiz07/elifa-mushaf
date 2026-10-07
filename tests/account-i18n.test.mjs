import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACCOUNT_EN} from '../src/account-i18n.mjs';

test('account messages have English draft copy instead of silently showing Turkish',()=>{
 const source=fs.readFileSync(new URL('../src/account.mjs',import.meta.url),'utf8');
 const messages=[...source.matchAll(/'([^']*)'/g)].map(match=>match[1]).filter(value=>/[ğüşöçıİĞÜŞÖÇ]/.test(value));
 const missing=[...new Set(messages)].filter(value=>!ACCOUNT_EN[value]);
 assert.deepEqual(missing,[]);
 for(const [original,draft] of Object.entries(ACCOUNT_EN)){
  assert.ok(original.trim());assert.ok(draft.trim());assert.notEqual(draft,original);
 }
});
