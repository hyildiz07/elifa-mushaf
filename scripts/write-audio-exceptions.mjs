import fs from 'node:fs';

const report=JSON.parse(fs.readFileSync('test-results/full-validation.json'));
if(report.errorCount)throw Error(`Cannot publish exception list with ${report.errorCount} structural errors`);
if(report.files!==1254||report.verseModes!==137192)throw Error('Exception list requires a complete Quran audit');
const version=JSON.parse(fs.readFileSync('version.json')).version.match(/v\d+/)?.[0];
if(!version)throw Error('Missing app version');
const cases=report.splitExceptions.map(({key,words,parts,fallback,rows,uniquePositions,safe,gaps})=>({
  reciter:Number(key.split('/')[0]),verse:key.split('/')[1].split('/')[0],words,parts,
  fallback,blocked:report.unsafeBlocked?.includes(key)||false,rows,uniquePositions,safePositions:safe,
  overlappingBoundaries:gaps.filter(({ms})=>ms<0).map(({pos,ms})=>({pos,ms}))
}));
fs.writeFileSync(`docs/split-exceptions-${version}.json`,JSON.stringify({
  version,source:'full Quran, Medine orthography, verified candidate recordings',
  structuralErrors:report.errorCount,singleEightPlusBothOrthographies:report.singleEightPlus,
  partsOverEightBothOrthographies:report.partsOverEight,cases
},null,2)+'\n');
console.log(`Wrote ${cases.length} canonical exceptions`);
