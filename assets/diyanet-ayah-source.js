// Staged Diyanet ayah source. The Mushaf v2 reciter list labels reader 3 as
// İshak Danış and its player maps that reader to the ar_ishakdemir folder.
// This module is deliberately not registered in the chapter-MP3 player:
// separate ayah MP3s have no trustworthy word clock or chapter time axis.
export const DIYANET_ISHAK = Object.freeze({
  id: 'ishak-danis-diyanet-ayah-v1',
  name: 'İshak Danış',
  origin: 'https://webdosya.diyanet.gov.tr',
  path: '/kuran/kuranikerim/Sound/ar_ishakdemir/',
  releaseStatus: 'staged'
});

const CACHE_NAME = 'elifa-diyanet-ayah-v1';
const LOCAL_ORIGIN = 'https://elifa.local/diyanet-ayah-v1/';

function validChapter(chapter, verseCount) {
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 114 ||
      !Number.isInteger(verseCount) || verseCount < 1 || verseCount > 286)
    throw Error('Invalid Quran chapter or verse count');
}

function validVerse(verse, verseCount) {
  if (!Number.isInteger(verse) || verse < 1 || verse > verseCount)
    throw Error('Invalid Quran verse');
}

export function diyanetIshakAyahUrl(chapter, verse, verseCount) {
  validChapter(chapter, verseCount);
  validVerse(verse, verseCount);
  return `${DIYANET_ISHAK.origin}${DIYANET_ISHAK.path}${chapter}_${verse}.mp3`;
}

function localKey(chapter, verse) {
  return `${LOCAL_ORIGIN}${DIYANET_ISHAK.id}/${chapter}/${verse || 'manifest'}`;
}

function isMp3(bytes) {
  if (!(bytes instanceof ArrayBuffer) || bytes.byteLength < 128) return false;
  const b = new Uint8Array(bytes);
  return (b[0] === 73 && b[1] === 68 && b[2] === 51) ||
    (b[0] === 255 && (b[1] & 224) === 224);
}

async function sha256(bytes) {
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

async function readManifest(cache, chapter, verseCount) {
  const hit = await cache.match(localKey(chapter, 0));
  if (!hit) return null;
  try {
    const data = await hit.json();
    if (data.source !== DIYANET_ISHAK.id || data.chapter !== chapter ||
        data.verseCount !== verseCount || data.files?.length !== verseCount ||
        data.files.some((file, index) =>
          file.verse !== index + 1 || !Number.isInteger(file.size) || file.size < 128 ||
          !/^[a-f0-9]{64}$/.test(file.sha256))) return null;
    return data;
  } catch { return null; }
}

export function createDiyanetIshakSource({fetcher = fetch, cacheStorage = caches,
  createObjectURL = blob => URL.createObjectURL(blob),
  revokeObjectURL = url => URL.revokeObjectURL(url)} = {}) {
  const cache = () => cacheStorage.open(CACHE_NAME);
  return {
    async isChapterDownloaded(chapter, verseCount) {
      validChapter(chapter, verseCount);
      const c = await cache();
      const manifest = await readManifest(c, chapter, verseCount);
      if (!manifest) return false;
      for (let verse = 1; verse <= verseCount; verse++) {
        const hit = await c.match(localKey(chapter, verse));
        if (!hit || Number(hit.headers.get('content-length')) !== manifest.files[verse - 1].size)
          return false;
      }
      return true;
    },

    async downloadChapter(chapter, verseCount, {signal, onProgress} = {}) {
      validChapter(chapter, verseCount);
      const c = await cache();
      if (await this.isChapterDownloaded(chapter, verseCount)) return false;
      const files = [];
      const inserted = [];
      try {
        for (let verse = 1; verse <= verseCount; verse++) {
          if (signal?.aborted) throw signal.reason || Error('Download cancelled');
          const url = diyanetIshakAyahUrl(chapter, verse, verseCount);
          const response = await fetcher(url, {signal: signal || AbortSignal.timeout(30000)});
          if (!response.ok) throw Error(`Diyanet verse unavailable: ${chapter}:${verse} (${response.status})`);
          const bytes = await response.arrayBuffer();
          const expectedSize = Number(response.headers.get('content-length'));
          if (!isMp3(bytes) || (expectedSize && expectedSize !== bytes.byteLength))
            throw Error(`Invalid or incomplete MP3: ${chapter}:${verse}`);
          const digest = await sha256(bytes);
          const key = localKey(chapter, verse);
          await c.put(key, new Response(bytes, {headers: {
            'content-type': 'audio/mpeg', 'content-length': String(bytes.byteLength)
          }}));
          inserted.push(key);
          files.push({verse, size: bytes.byteLength, sha256: digest});
          onProgress?.(verse / verseCount);
        }
        // Commit marker comes last, so interrupted chapters never appear ready.
        await c.put(localKey(chapter, 0), new Response(JSON.stringify({
          source: DIYANET_ISHAK.id, chapter, verseCount, files
        }), {headers: {'content-type': 'application/json'}}));
        return true;
      } catch (error) {
        for (const key of inserted) await c.delete(key);
        throw error;
      }
    },

    async getPlayableVerse(chapter, verse, verseCount, {offlineOnly = false} = {}) {
      const remoteUrl = diyanetIshakAyahUrl(chapter, verse, verseCount);
      const c = await cache();
      const manifest = await readManifest(c, chapter, verseCount);
      if (manifest) {
        const response = await c.match(localKey(chapter, verse));
        if (response) {
          const bytes = await response.arrayBuffer();
          const expected = manifest.files[verse - 1];
          if (bytes.byteLength === expected.size && await sha256(bytes) === expected.sha256) {
            const url = createObjectURL(new Blob([bytes], {type: 'audio/mpeg'}));
            return {url, offline: true, release: () => revokeObjectURL(url)};
          }
        }
      }
      if (offlineOnly) throw Error(`Verse not available offline: ${chapter}:${verse}`);
      return {url: remoteUrl, offline: false, release() {}};
    },

    async removeChapter(chapter, verseCount) {
      validChapter(chapter, verseCount);
      const c = await cache();
      // Remove the marker first: a partial delete must never look complete.
      await c.delete(localKey(chapter, 0));
      for (let verse = 1; verse <= verseCount; verse++)
        await c.delete(localKey(chapter, verse));
    }
  };
}
