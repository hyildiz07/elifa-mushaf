# Long split-part acoustic check — 2026-09-30

This is review evidence, not a production timing override. The fresh mixed-source check
(`node scripts/verify-all-audio.mjs --candidate-dir=assets/verified-audio --report-file=test-results/final-local-validation.json`)
covered 1,254 chapter files and 137,192 verse/display-mode cases with zero structural
plan errors. It still reports 11 unique long or protected verse cases. The full case
list and reason for each guard are in `review/corpus-split-plan-audit-2026-09-30.md`.

Şâtırî 43:77 is **not** one of the 11. The shipped `assets/verified-audio/4-43.json`
uses the first complete, sequential eight-word reading from the source-matched QUA
recording. No new production timing is warranted for that verse.

For Südeys 24:35, the one nine-word part is words 36–44. A possible extra boundary
after word 40 would separate `يَشَآءُ` from `وَيَضْرِبُ`. The existing source
identity review in `review/sudais-24-35-transfer-candidate.json` compares ten
independent high-energy windows of the QuranCDN chapter MP3 with the QuranLab/
EveryAyah verse performance; correlations are 0.875–0.944 with a 13 ms alignment
spread. Its mapped word times leave 440 ms between word 40's end (663,825 ms) and
word 41's start (664,265 ms).

`node review/probe-sudais-24-35-word-40-41.mjs` decoded the actual QuranCDN MP3
through the app's `prepareWindow` path and measured the maximum RMS across both
channels in 10 ms bins. The quietest 80 ms window between those words was centered
at 663,905 ms, RMS 0.0597, or **20.2%** of the nearby speech median (0.2950).
Other bins in the metadata gap are also active. The reproducible full profile and
source URL are in `review/sudais-24-35-word-40-41-pcm.json`.

This establishes a likely word interval in a matched performance, but does not
distinguish a lingering consonant from reverberation or verify both audible sides
of a proposed cut. An automatic cut here could swallow or leak a phoneme. **Result:
zero of the 11 exceptions closed in this pass; no production `allowedCuts` change.**
Human listening to both sides of a proposed cut, with the precise production clip,
is required before this boundary can be approved. The other ten cases retain the
source/guard barriers documented in the corpus audit.
