import fs from 'node:fs';
import {ACCOUNT_EN} from '../src/account-i18n.mjs';
fs.mkdirSync('locales',{recursive:true});
fs.writeFileSync('locales/account-source.json',JSON.stringify(ACCOUNT_EN,null,2)+'\n');
console.log(`${Object.keys(ACCOUNT_EN).length} account messages exported`);
