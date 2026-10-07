// Research-only structural audit. This script never writes QUL timing/audio into production assets.
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
const at = html.indexOf('const QTEXT=');
if (at < 0) throw Error('QTEXT missing');
const QTEXT = vm.runInNewContext(`${html.slice(at, html.indexOf('\n', at))};QTEXT`);
const chapters = [[3, 200], [4, 176], [5, 120], [28, 88], [29, 69]];
const report = {source: 'QUL recitation page 116, internal ayah_segments resource 16', status: 'research-only', chapters: {}, anomalies: []};

async function page(surah, count, number) {
  const url = `https://qul.tarteel.ai/api/v1/audio/ayah_segments/16?surah=${surah}&from=1&to=${count}&page=${number}`;
  for (let retry = 0; retry < 3; retry++) {
    try {
      const response = await fetch(url, {signal: AbortSignal.timeout(30000)});
      if (!response.ok) throw Error(`${response.status} ${url}`);
      return await response.json();
    } catch (error) {
      if (retry === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (retry + 1)));
    }
  }
}

for (const [surah, count] of chapters) {
  const first = await page(surah, count, 1);
  const data = {...first.segments};
  const totalPages = first.pagination.total_pages;
  // Low concurrency so this research probe is gentle on the public site.
  for (let start = 2; start <= totalPages; start += 3) {
    const batch = await Promise.all(Array.from({length: Math.min(3, totalPages - start + 1)}, (_, i) => page(surah, count, start + i)));
    for (const result of batch) Object.assign(data, result.segments);
  }
  const stats = {expected: count, returned: Object.keys(data).length, missing: [], empty: [], badUrl: [], badIntervals: [], badIndexCoverage: [], missingCanonicalPositions: [], outOfRangePositions: [], repeatedPositions: [], outOfOrder: [], mergedRows: [], shortFirstRows: [], longRows: [], totalCanonicalWords: 0, totalRows: 0};
  for (let ayah = 1; ayah <= count; ayah++) {
    const key = `${surah}:${ayah}`;
    const datum = data[key];
    const words = QTEXT[surah][ayah - 1][2].filter(word => word[1] === 0);
    stats.totalCanonicalWords += words.length;
    if (!datum) {stats.missing.push(key); continue;}
    const rows = datum.segments;
    if (!Array.isArray(rows) || !rows.length) {stats.empty.push(key); continue;}
    if (!/^https:\/\/audio-cdn\.tarteel\.ai\//.test(datum.audio_url || '')) stats.badUrl.push({key, url: datum.audio_url});
    stats.totalRows += rows.length;
    if (rows.some(row => !Array.isArray(row) || row.length !== 4 || !row.every(Number.isFinite) || row[2] < 0 || row[3] <= row[2]))
      stats.badIntervals.push(key);
    let pos = 0;
    let priorEnd = -1;
    const seen = new Set();
    for (const row of rows) {
      const [from, to, startMs, endMs] = row;
      if (from !== pos || to <= from || to > words.length) stats.badIndexCoverage.push({key, at: pos, row});
      if (to - from > 1) stats.mergedRows.push({key, row});
      if (startMs < priorEnd) stats.outOfOrder.push({key, priorEnd, row});
      if (endMs - startMs > 5000) stats.longRows.push({key, row});
      for (let index = from; index < to; index++) {
        if (index < 0 || index >= words.length) stats.outOfRangePositions.push({key, index});
        else if (seen.has(index)) stats.repeatedPositions.push({key, index});
        else seen.add(index);
      }
      pos = to;
      priorEnd = endMs;
    }
    const absent = Array.from({length: words.length}, (_, index) => index).filter(index => !seen.has(index));
    if (absent.length) stats.missingCanonicalPositions.push({key, positions: absent});
    if (rows[0][3] - rows[0][2] < 120) stats.shortFirstRows.push({key, row: rows[0]});
    if (pos !== words.length) stats.badIndexCoverage.push({key, final: pos, expected: words.length});
  }
  report.chapters[surah] = stats;
  console.log(surah, JSON.stringify({expected: stats.expected, returned: stats.returned, missing: stats.missing.length, empty: stats.empty.length, badIndexCoverageVerses: new Set(stats.badIndexCoverage.map(row => row.key)).size, missingCanonicalVerses: stats.missingCanonicalPositions.length, outOfRangeVerses: new Set(stats.outOfRangePositions.map(row => row.key)).size, repeatedVerses: new Set(stats.repeatedPositions.map(row => row.key)).size, badIntervals: stats.badIntervals.length, outOfOrderVerses: new Set(stats.outOfOrder.map(row => row.key)).size, shortFirstRows: stats.shortFirstRows.length, longRows: stats.longRows.length}));
}
fs.writeFileSync('review/sudais-qul-ayah-clips-structure.json', JSON.stringify(report, null, 2) + '\n');
