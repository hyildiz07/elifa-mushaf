import test from 'node:test';
import assert from 'node:assert/strict';
import {createDiyanetIshakPlayer} from '../assets/diyanet-ayah-player.js';

class FakeAudio extends EventTarget {
  src = '';
  currentTime = 0;
  playbackRate = 1;
  plays = [];
  pause() {}
  removeAttribute() {}
  async play() {this.plays.push(this.src);}
  finish() {this.dispatchEvent(new Event('ended'));}
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test('repeat the same ayah before advancing, navigate, and keep speed', async () => {
  const audio = new FakeAudio();
  const released = [];
  const source = {getPlayableVerse: async (chapter, verse) => ({
    url: `https://diyanet.example/${chapter}_${verse}.mp3`,
    release: () => released.push(verse)
  })};
  const states = [];
  const player = createDiyanetIshakPlayer({source, audio, onState: s => states.push(s)});
  await player.prepare(2, 1, 3, 286, {repeat: 2, speed: 1.25});
  await player.play();
  audio.finish(); await flush();
  assert.equal(player.state.verse, 1);
  assert.equal(player.state.repeatIndex, 2);
  audio.finish(); await flush();
  assert.equal(player.state.verse, 2);
  assert.deepEqual(audio.plays, [
    'https://diyanet.example/2_1.mp3',
    'https://diyanet.example/2_1.mp3',
    'https://diyanet.example/2_2.mp3'
  ]);
  player.setSpeed(1.5);
  assert.equal(audio.playbackRate, 1.5);
  assert.equal(await player.next(), true);
  assert.equal(player.state.verse, 3);
  assert.equal(await player.next(), false);
  assert.equal(await player.previous(), true);
  assert.equal(player.state.verse, 2);
  player.stop();
  assert.equal(player.state.status, 'idle');
  assert.deepEqual(released, [1, 2, 3, 2]);
  assert.equal(states.at(-1).chapter, null);
});

test('offline-only selection refuses an uncached verse and does not play another reciter', async () => {
  const audio = new FakeAudio();
  const source = {getPlayableVerse: async (_chapter, verse, _count, options) => {
    assert.equal(options.offlineOnly, true);
    if (verse === 2) throw Error('Verse not available offline');
    return {url: `blob:verse-${verse}`, release() {}};
  }};
  const player = createDiyanetIshakPlayer({source, audio});
  await player.prepare(1, 1, 2, 7, {offlineOnly: true});
  await player.play();
  audio.finish(); await flush();
  assert.equal(player.state.status, 'error');
  assert.equal(player.state.verse, 1);
  assert.deepEqual(audio.plays, ['blob:verse-1']);
});

test('stopping during preparation invalidates the late source result', async () => {
  const audio = new FakeAudio();
  let resolve, released = 0;
  const source = {getPlayableVerse: () => new Promise(r => {resolve = r;})};
  const player = createDiyanetIshakPlayer({source, audio});
  const pending = player.prepare(48, 1, 5, 29);
  player.stop();
  resolve({url: 'blob:stale', release: () => {released++;}});
  await pending;
  assert.equal(released, 1);
  assert.equal(audio.src, '');
  assert.equal(player.state.status, 'idle');
});
