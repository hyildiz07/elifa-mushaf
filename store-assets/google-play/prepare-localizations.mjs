import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const records = ['localization-west.json', 'localization-east.json']
  .flatMap(file => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')));
const expectedLanguages = [
  'de', 'en', 'ru', 'ar', 'fr', 'es', 'el', 'zh', 'ja', 'ko',
  'hi', 'ur', 'it', 'id', 'nl', 'pt', 'fa', 'bn', 'ms', 'sw',
];
assert.equal(new Set(records.map(row => row.locale)).size, records.length, 'Duplicate store locale');
assert.deepEqual(
  [...new Set(records.map(row => row.webLanguage))].sort(),
  expectedLanguages.sort(),
  'All 20 languages besides the existing Turkish listing must be included',
);
for (const row of records) {
  for (const [key, limit] of [['appName', 30], ['shortDescription', 80], ['fullDescription', 4000]]) {
    assert.ok(typeof row[key] === 'string' && row[key].trim().length, `${row.locale} ${key} is empty`);
    assert.ok(row[key].length <= limit && [...row[key]].length <= limit, `${row.locale} ${key} exceeds ${limit}`);
  }
  assert.ok(row.launcherName.length > 0 && row.launcherName.length <= 30, `${row.locale} launcher name`);
  assert.ok(!row.fullDescription.includes('\uFFFD'), `${row.locale} has a replacement character`);
}

const markdown = [
  '# Google Play store listing translations',
  '',
  'Package: com.elifaplatform.mushaf',
  '',
  'These are new language entries. The existing default Turkish (tr-TR) listing is not included.',
  'Keep the exact locale codes and wording below. Each locale contains App name, Short description and Full description.',
  '',
  ...records.flatMap(row => [
    `## Language: ${row.locale}`, '',
    '### App name', row.appName, '',
    '### Short description', row.shortDescription, '',
    '### Full description', row.fullDescription, '',
  ]),
].join('\n');
const output = path.join(dir, 'play-listing-translations.md');
fs.writeFileSync(output, markdown, 'utf8');
console.log(JSON.stringify({
  storeLocales: records.length,
  additionalLanguages: new Set(records.map(row => row.webLanguage)).size,
  existingDefault: 'tr-TR',
  output,
  maxNameLength: Math.max(...records.map(row => row.appName.length)),
  maxShortDescriptionLength: Math.max(...records.map(row => row.shortDescription.length)),
}, null, 2));
