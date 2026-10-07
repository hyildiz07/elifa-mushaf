#!/usr/bin/env node
// Bounded remote availability audit. Never requests an entire audio file.
// Run: node scripts/audit-remote-audio.mjs --sample
//      node scripts/audit-remote-audio.mjs --all
import {readFile, mkdir, writeFile} from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);
const IDS = [7, 6, 12, 9, 2, 1, 3, 10, 4, 5, 97];
const VERIFIED = new Set([1, 2, 4, 6, 7, 9, 10, 97]);
const SAMPLE = [1, 2, 57, 113, 114];
const UNVERIFIED_SUDAIS = new Set([3, 4, 5, 28, 29]);
const all = process.argv.includes('--all');
const retryUncertain = process.argv.includes('--retry-uncertain');
const chapters = all ? Array.from({length: 114}, (_, i) => i + 1) : SAMPLE;
const outputArg = process.argv.find(a => a.startsWith('--output='));
const output = new URL(outputArg ? outputArg.slice(9) : `../review/remote-audio-${retryUncertain ? 'all-retry' : all ? 'all' : 'sample'}.json`, import.meta.url);
const MAX_CONCURRENT = 4;
const MIN_START_INTERVAL_MS = 150;
const TIMEOUT_MS = 12000;
let lastStart = 0;
let nextSlot = Promise.resolve();

async function slot() {
  // Space request starts globally so this audit stays polite to the providers.
  const prior = nextSlot;
  let release;
  nextSlot = new Promise(resolve => { release = resolve; });
  await prior;
  const wait = Math.max(0, lastStart + MIN_START_INTERVAL_MS - Date.now());
  if (wait) await new Promise(resolve => setTimeout(resolve, wait));
  lastStart = Date.now();
  release();
}

async function boundedFetch(url, options = {}) {
  await slot();
  return fetch(url, {redirect: 'follow', ...options, signal: AbortSignal.timeout(TIMEOUT_MS)});
}

async function pool(rows, fn) {
  let cursor = 0;
  const out = new Array(rows.length);
  await Promise.all(Array.from({length: MAX_CONCURRENT}, async () => {
    while (cursor < rows.length) {
      const i = cursor++;
      out[i] = await fn(rows[i]);
    }
  }));
  return out;
}

function bundled(rid, sid) {
  return VERIFIED.has(rid) && !(sid === 1 && (rid === 10 || rid === 97)) && !(sid === 3 && rid === 10);
}

async function source(rid, sid) {
  if (bundled(rid, sid)) {
    const file = new URL(`../assets/verified-audio/${rid}-${sid}.json`, import.meta.url);
    const data = JSON.parse(await readFile(file, 'utf8'));
    return {url: data.audio_url, source: 'bundled', recording: data.source_recording};
  }
  const endpoint = `https://api.qurancdn.com/api/qdc/audio/reciters/${rid}/audio_files?chapter=${sid}&segments=true`;
  const response = await boundedFetch(endpoint, {headers: {accept: 'application/json'}});
  if (!response.ok) throw new Error(`metadata HTTP ${response.status}`);
  const data = await response.json();
  const file = data.audio_files?.[0];
  if (!file?.audio_url) throw new Error('metadata missing audio_url');
  return {url: file.audio_url, source: 'QuranCDN API', recording: null};
}

function headers(response) {
  const pick = key => response.headers.get(key);
  return {status: response.status, url: response.url, type: pick('content-type'),
    length: pick('content-length'), range: pick('content-range'),
    acceptsRanges: pick('accept-ranges'), etag: pick('etag'), lastModified: pick('last-modified')};
}

async function tinyRange(url, length) {
  // Test the first byte only. If the host ignores Range, cancel without reading.
  const response = await boundedFetch(url, {headers: {range: 'bytes=0-0'}});
  const result = headers(response);
  result.rangeHonored = response.status === 206 && /^bytes 0-0\/\d+$/.test(result.range || '');
  try { await response.body?.cancel(); } catch {}
  // A 200 here means the host ignored Range; this script never drains its body.
  if (response.status === 200 && Number(result.length) > 1) result.rangeIgnored = true;
  if (length && result.rangeHonored && Number(result.range.split('/')[1]) !== Number(length)) result.sizeMismatch = true;
  return result;
}

async function probe(row) {
  if (row.error) return row;
  try {
    const response = await boundedFetch(row.url, {method: 'HEAD'});
    row.head = headers(response);
    if (response.body) await response.body.cancel();
  } catch (error) {
    row.headError = `${error.name}: ${error.message}`;
  }
  const sampleRange = SAMPLE.includes(row.chapter);
  if (sampleRange || !row.head || row.head.status !== 200 || !Number(row.head.length)) {
    try { row.tinyRange = await tinyRange(row.url, row.head?.length); }
    catch (error) { row.rangeError = `${error.name}: ${error.message}`; }
  }
  if (row.head?.status === 200 && Number(row.head.length) > 0) row.class = 'available';
  else if (row.tinyRange?.status === 206 || row.tinyRange?.status === 200) row.class = 'range-only-or-head-blocked';
  else if (row.head?.status === 404 && (!row.tinyRange || row.tinyRange.status === 404)) row.class = '404';
  else if (row.head?.status === 403 && (!row.tinyRange || row.tinyRange.status === 403)) row.class = '403';
  else row.class = 'uncertain';
  return row;
}

let rows;
if (retryUncertain) {
  let priorText;
  try { priorText = await readFile(new URL('../review/remote-audio-all-retry.json', import.meta.url), 'utf8'); }
  catch { priorText = await readFile(new URL('../review/remote-audio-all.json', import.meta.url), 'utf8'); }
  const prior = JSON.parse(priorText);
  rows = prior.rows;
  await pool(rows.filter(row => row.class !== 'available' && row.url), async row => {
    row.firstAttempt = {head: row.head, headError: row.headError,
      tinyRange: row.tinyRange, rangeError: row.rangeError};
    delete row.head;
    delete row.headError;
    delete row.tinyRange;
    delete row.rangeError;
    return probe(row);
  });
} else {
  rows = await pool(IDS.flatMap(reciter => chapters.map(chapter => ({reciter, chapter}))), async row => {
    row.active = !(row.reciter === 3 && UNVERIFIED_SUDAIS.has(row.chapter));
    try { Object.assign(row, await source(row.reciter, row.chapter)); }
    catch (error) { row.error = `${error.name}: ${error.message}`; }
    return row;
  });
  await pool(rows, probe);
}

const summary = {};
const identityRisks = [];
for (const rid of IDS) {
  const group = rows.filter(row => row.reciter === rid);
  summary[rid] = {total: group.length, active: group.filter(row => row.active).length,
    classes: Object.fromEntries([...new Set(group.map(row => row.class || 'metadata-error'))].map(name => [name, group.filter(row => (row.class || 'metadata-error') === name).length]))};
  const byUrl = new Map();
  const byEtag = new Map();
  for (const row of group) {
    if (row.url) (byUrl.get(row.url) || (byUrl.set(row.url, []), byUrl.get(row.url))).push(row.chapter);
    if (row.head?.etag) (byEtag.get(row.head.etag) || (byEtag.set(row.head.etag, []), byEtag.get(row.head.etag))).push(row.chapter);
  }
  for (const [url, chapters] of byUrl) if (chapters.length > 1) identityRisks.push({reciter: rid, kind: 'same URL', chapters, value: url});
  for (const [etag, chapters] of byEtag) if (chapters.length > 1) identityRisks.push({reciter: rid, kind: 'same ETag', chapters, value: etag});
}
const report = {checkedAt: new Date().toISOString(), mode: retryUncertain ? 'all-retry' : all ? 'all' : 'sample',
  method: 'HEAD on every URL; bytes=0-0 Range on sample and HEAD anomalies; four concurrent requests; 150 ms minimum spacing; 12 s timeout; no full MP3 downloads',
  summary, identityRisks, rows};
await mkdir(new URL('.', output), {recursive: true});
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({output: output.href, summary, identityRisks: identityRisks.length}, null, 2));
