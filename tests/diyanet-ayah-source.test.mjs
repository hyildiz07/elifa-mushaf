import test from 'node:test';
import assert from 'node:assert/strict';
import {createDiyanetIshakSource, diyanetIshakAyahUrl} from '../assets/diyanet-ayah-source.js';

function setup() {
  const stored = new Map();
  const cache = {
    match: async key => stored.get(key)?.clone(),
    put: async (key, value) => { stored.set(key, value.clone()); },
    delete: async key => stored.delete(key)
  };
  const requests = [];
  const bytes = new Uint8Array(256);
  bytes.set([73, 68, 51]);
  const fetcher = async url => {
    requests.push(url);
    return new Response(bytes, {headers: {'content-type': 'audio/mpeg', 'content-length': '256'}});
  };
  const released = [];
  const source = createDiyanetIshakSource({fetcher,
    cacheStorage: {open: async () => cache},
    createObjectURL: () => 'blob:test', revokeObjectURL: url => released.push(url)});
  return {source, requests, released, stored, bytes};
}

test('Diyanet İshak Danış ayah URL stays inside the official source', () => {
  assert.equal(diyanetIshakAyahUrl(18, 10, 110),
    'https://webdosya.diyanet.gov.tr/kuran/kuranikerim/Sound/ar_ishakdemir/18_10.mp3');
  assert.throws(() => diyanetIshakAyahUrl(115, 1, 1));
  assert.throws(() => diyanetIshakAyahUrl(18, 111, 110));
  assert.throws(() => diyanetIshakAyahUrl('../18', 1, 110));
});

test('downloads every ayah, commits only a complete chapter, then serves verified offline bytes', async () => {
  const {source, requests, released} = setup();
  const progress = [];
  assert.equal(await source.isChapterDownloaded(1, 2), false);
  assert.equal(await source.downloadChapter(1, 2, {onProgress: p => progress.push(p)}), true);
  assert.deepEqual(progress, [0.5, 1]);
  assert.deepEqual(requests, [
    diyanetIshakAyahUrl(1, 1, 2), diyanetIshakAyahUrl(1, 2, 2)
  ]);
  assert.equal(await source.isChapterDownloaded(1, 2), true);
  assert.equal(await source.downloadChapter(1, 2), false);
  assert.equal(requests.length, 2);
  const audio = await source.getPlayableVerse(1, 2, 2, {offlineOnly: true});
  assert.equal(audio.offline, true);
  assert.equal(audio.url, 'blob:test');
  audio.release();
  assert.deepEqual(released, ['blob:test']);
  await source.removeChapter(1, 2);
  assert.equal(await source.isChapterDownloaded(1, 2), false);
  await assert.rejects(source.getPlayableVerse(1, 2, 2, {offlineOnly: true}), /not available offline/);
});

test('failed chapter leaves no download marker and never serves a partial offline verse', async () => {
  const {source, stored} = setup();
  let count = 0;
  const failing = createDiyanetIshakSource({
    fetcher: async () => {
      if (++count === 2) return new Response('missing', {status: 404});
      const bytes = new Uint8Array(256); bytes.set([73, 68, 51]);
      return new Response(bytes, {headers: {'content-length': '256'}});
    },
    cacheStorage: {open: async () => ({
      match: async key => stored.get(key)?.clone(),
      put: async (key, value) => { stored.set(key, value.clone()); },
      delete: async key => stored.delete(key)
    })}
  });
  await assert.rejects(failing.downloadChapter(2, 3), /2:2/);
  assert.equal(await source.isChapterDownloaded(2, 3), false);
  await assert.rejects(source.getPlayableVerse(2, 1, 3, {offlineOnly: true}), /not available offline/);
  assert.equal(stored.size, 0);
});

test('online playback stays a direct official URL when the chapter is not downloaded', async () => {
  const {source} = setup();
  const audio = await source.getPlayableVerse(48, 5, 29);
  assert.equal(audio.url, diyanetIshakAyahUrl(48, 5, 29));
  assert.equal(audio.offline, false);
});

test('tampered offline MP3 is rejected rather than played', async () => {
  const {source, stored} = setup();
  await source.downloadChapter(1, 1);
  const key = [...stored.keys()].find(k => k.endsWith('/1/1'));
  const changed = new Uint8Array(256); changed.set([73, 68, 51, 42]);
  stored.set(key, new Response(changed, {headers: {'content-length': '256'}}));
  await assert.rejects(source.getPlayableVerse(1, 1, 1, {offlineOnly: true}), /not available offline/);
  assert.equal((await source.getPlayableVerse(1, 1, 1)).offline, false);
});
