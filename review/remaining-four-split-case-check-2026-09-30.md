# Four remaining split candidates: source and boundary check

Review only, 2026-09-30. This follows the fresh 1,254-chapter / 137,192-mode
structural audit in `review/corpus-split-plan-audit-2026-09-30.md`. It does not
change production timing or certify every phoneme.

| Case | Same-source / word evidence | Two-sided boundary result | Decision |
| --- | --- | --- | --- |
| Hüsarî Muallim 2:145 | The first 61.25 s of the independently verified EveryAyah clip map to the QuranCDN chapter recording sample-for-sample in three PCM windows. All 32 canonical words have model times; production uses the four phrase ends after words 10, 14 and 19. | Re-running `node review/check-husary-2145-cuts.mjs` finds a 400 ms pause candidate after word 20, but that leaves words 21–32 as a 12-word group. The further cut required within words 21–32 has only adjacent 10 ms model intervals. In `review/husary-2145-inner-boundary-energy.json`, after-word 25/28 low-energy minima occur **after the next model word starts**; moving a cut there could remove its onset. | No supported way to reduce every group to eight words. Keep the verified four phrases. |
| Hânî 6:139 | QUD on the matched 192 kbps EveryAyah clip proposes complete ordered phrase groups of 8/3/6/2/3 words. It does not provide individually verified 17/18 word identity; the older chapter labels contradict the candidate. | Re-running `node review/hani-6139-qud-boundary-acoustics.mjs` shows only 30 ms between each phrase label and nonzero RMS on both sides of all four boundaries. At 17→18, the immediate 100 ms RMS values are 0.01247 / 0.01113. | QUD phrase labels are candidates, not safe audio cuts; retain the split guard. |
| Hânî 34:46 | The same-performance QUA verse times are about 1.5 s later than old chapter labels. QUD labels phrase groups 4/7/4/9 words, then leaves 27.18–27.861 s as untranscribed audio with confidence 0. | A nine-word final group remains even if earlier QUD phrases were accepted. The final active voice may be a repeated last word or part of 34:47; neither word ownership nor complete verse end is established (`docs/SES-HANI-34-46-6-139-DENETIMI.md`). | Do not unblock or manufacture an ending. |
| Südeys 39:54 | QUL chapter and production MP3 correlate 0.9977–0.9983 in three windows; its reading repeats canonical words 4–5. Assigning both repeats to the first card would leave two possible cards of five and eight canonical words. | The remaining 5→6 label gap is 50 ms. The previous production-PCM test (`review/sudais-39-54-repeat-candidate.json`) measures the quietest 10 ms at 84% of nearby RMS, with speech on both sides. A split could swallow or leak a phoneme. | Keep the single 13-word card. |

No additional exception can be closed from these measurements. A phonetic
listening/transcription check tied to the exact production recording is the
missing proof, especially at Hüsarî 2:145's interior cuts and Hânî's ambiguous
words. These source labels alone should not be promoted to playable cut times.
