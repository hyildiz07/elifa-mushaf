# Sudais source-matched restoration: review only (2026-09-30)

## Finding

The quarantined QDC chapter recordings for surahs 5, 28 and 29 cannot safely use the current verse/word timing maps. Direct full-stream PCM extraction and QUD recognition showed verse drift in the middle/end of each chapter. The earlier VBR/seek hypothesis was rejected: indexed seek and full-stream PCM samples matched to approximately 4e-8 RMS. See `sudais-chapter-timing-audit-2026-09-30.md`.

QUL resource 407 is **not** a drop-in timing replacement for the QDC MP3. Audio fingerprinting matches several passages closely but other distant passages are edited/different; chapter 5 QUL timing itself is wrong at sampled verses. QUL audio paired with QUL timing passed sampled ASR in 28:44, 28:87, 29:2, 29:35, 29:68, but 28:2 has a ~4.45 s questionable lead-in and neither full chapter has been acoustically certified. QUL 28/29 structural rows have complete word-position coverage with no verse-order or range errors; structural validity alone is not auditory validity. Evidence: `sudais-qdc-align/qul-broad-source-match.json`, `sudais-qul-pair/`, `sudais-qul-28-29-structure.json`.

## Exact QDC 5:46 prototype

`align-sudais-qdc-5-46-5-82.mjs` aligns a full-decode PCM extract from the pinned QDC chapter-5 MP3. Both independent QUD Base and Large runs returned the same 27 spoken positions for 5:46: canonical words 1–26, with position 24 apparently repeated. Their word boundaries differ by at most 20 ms. The proposed review data are reproducibly built by `node review/build-sudais-qdc-5-46-prototype.mjs` into `sudais-qdc-align/5-46-prototype.json`. The source SHA-256 and absolute source times are recorded there.

The candidate verse is 1,086,190–1,108,617 ms; 5:47 starts at 1,108,647 ms. The proposed 6+6+5+6+3-word pieces are **not production-ready**. Only the cut after position 12 has a 143 ms model gap and low local energy. The cuts after positions 6, 17 and 23 have zero model gap and substantial energy at the boundary. The second occurrence of word 24 needs listening to confirm true repetition. ASR agreement is a useful independent check, not proof that a cut does not swallow a consonant or attach part of the next word.

## Rights and source limits

- [QUL's FAQ](https://qul.tarteel.ai/faq) says permissions differ by individual resource and should be checked with the resource author. [Resource 407](https://qul.tarteel.ai/resources/recitation/407) shows timing and download fields but no explicit recording reuse license. We therefore have no demonstrated permission to replace the live MP3 with QUL audio.
- [QUL's recitation tutorial](https://qul.tarteel.ai/docs/tutorial-recitation-end-to-end) says its CDN URLs are validation pointers and must not be hotlinked by a third-party production app; downloaded audio should be self-hosted. This is an operational instruction, separate from recording rights.
- [QUD's README license section](https://github.com/QUD-Technologies/quranic-universal-audio#license) licenses its own timestamps, segmentation, alignment, metadata and code under CC BY 4.0, while explicitly reserving the underlying recordings to their owners. This makes QUD-derived timing a plausible data path without asserting a new right to a recording.
- [QuranicAudio's about page](https://quranicaudio.com/about) describes free personal, non-commercial downloading. It does not establish a blanket right to republish the recording in an application. Existing QDC audio rights should be resolved separately; this report makes no legal conclusion.

## Defensible next path

For each pinned QDC MP3, decode the *entire chapter* once to PCM and align overlapping 30–60-second passages against the canonical text. Reconcile overlaps, actual repeats, skipped readings and verse boundaries; independently recognize every candidate, validate canonical coverage, and listen on both sides of every proposed piece boundary. Release only reviewed areas, with a safe verse/full-chapter fallback elsewhere. A small example proves this can generate source-matched candidates, but it does not certify a whole chapter or all user-selected word ranges. Chapter 5 especially requires this source-matched process; QUL's own chapter-5 timing is visibly misaligned.

No production timing, audio, or deployment was changed by this prototype.
