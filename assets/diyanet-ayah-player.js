import {createDiyanetIshakSource} from './diyanet-ayah-source.js';

// Separate-ayah player. It never projects an individual file onto the
// chapter-MP3 clock, so repeat/navigation cannot silently play another ayah.
export function createDiyanetIshakPlayer({
  source = createDiyanetIshakSource(),
  audio = new Audio(),
  onState = () => {}
} = {}) {
  let selection = null;
  let resource = null;
  let verse = 0;
  let repeatIndex = 1;
  let generation = 0;
  let status = 'idle';

  const emit = (error = null) => onState({
    status, chapter: selection?.chapter ?? null, verse: verse || null,
    first: selection?.first ?? null, last: selection?.last ?? null,
    repeatIndex, repeat: selection?.repeat ?? null,
    speed: selection?.speed ?? null, error
  });
  const release = () => { resource?.release(); resource = null; };

  async function selectVerse(nextVerse, token) {
    const chosen = await source.getPlayableVerse(selection.chapter, nextVerse,
      selection.verseCount, {offlineOnly: selection.offlineOnly});
    if (generation !== token) { chosen.release(); return false; }
    audio.pause();
    release();
    resource = chosen;
    verse = nextVerse;
    repeatIndex = 1;
    audio.src = chosen.url;
    audio.currentTime = 0;
    audio.playbackRate = selection.speed;
    status = 'ready';
    emit();
    return true;
  }

  async function continueAfterEnd() {
    if (!selection) return;
    const token = generation;
    try {
      if (repeatIndex < selection.repeat) {
        repeatIndex++;
        audio.currentTime = 0;
        status = 'playing'; emit();
        await audio.play();
      } else if (verse < selection.last) {
        if (!await selectVerse(verse + 1, token)) return;
        status = 'playing'; emit();
        await audio.play();
      } else {
        status = 'ended'; emit();
      }
    } catch (error) {
      if (token === generation) {status = 'error'; emit(error);}
    }
  }

  audio.addEventListener('ended', () => { void continueAfterEnd(); });
  audio.addEventListener('error', () => {
    if (!selection) return;
    status = 'error'; emit(Error('Ayah audio could not be played'));
  });

  return {
    get state() {return {status, chapter: selection?.chapter, verse, repeatIndex};},
    get element() {return audio;},
    async prepare(chapter, first, last, verseCount,
      {repeat = 1, speed = 1, offlineOnly = false} = {}) {
      if (!Number.isInteger(chapter) || chapter < 1 || chapter > 114 ||
          !Number.isInteger(verseCount) || verseCount < 1 || verseCount > 286 ||
          !Number.isInteger(first) || first < 1 ||
          !Number.isInteger(last) || last < first || last > verseCount ||
          !Number.isInteger(repeat) || repeat < 1 || repeat > 100 ||
          !Number.isFinite(speed) || speed < 0.5 || speed > 2)
        throw Error('Invalid ayah playback selection');
      this.stop();
      selection = {chapter, first, last, verseCount, repeat, speed, offlineOnly};
      const token = generation;
      status = 'preparing'; emit();
      try {await selectVerse(first, token);}
      catch (error) {
        if (token === generation) {status = 'error'; emit(error);}
        throw error;
      }
    },
    // Call synchronously from the Play button after prepare() has completed.
    // This preserves user activation for Safari/iOS autoplay rules.
    play() {
      if (!selection || !resource) throw Error('Ayah selection is not prepared');
      status = 'playing'; emit();
      const pending = audio.play();
      pending.catch(error => {if (selection) {status = 'error'; emit(error);}});
      return pending;
    },
    pause() {
      if (!selection) return;
      audio.pause(); status = 'paused'; emit();
    },
    stop() {
      generation++;
      audio.pause();
      audio.removeAttribute?.('src');
      audio.src = '';
      release();
      selection = null;
      verse = 0;
      status = 'idle'; emit();
    },
    async next() {return this.navigate(1);},
    async previous() {return this.navigate(-1);},
    async navigate(delta) {
      if (!selection || !Number.isInteger(delta) || !delta) return false;
      const nextVerse = Math.min(selection.last, Math.max(selection.first, verse + delta));
      if (nextVerse === verse) return false;
      const token = generation;
      try {
        if (!await selectVerse(nextVerse, token)) return false;
        this.play();
        return true;
      } catch (error) {
        if (token === generation) {status = 'error'; emit(error);}
        throw error;
      }
    },
    setSpeed(speed) {
      if (!Number.isFinite(speed) || speed < 0.5 || speed > 2)
        throw Error('Invalid playback speed');
      if (selection) selection.speed = speed;
      audio.playbackRate = speed;
      emit();
    }
  };
}
