# Shuraim 3:124 word timing repair

The production mix uses the QuranCDN chapter MP3 for reciter 10 in chapter 3.
Its 3:124 timing row omits word 1 (`إِذْ`), and the listed word 2 interval
starts while word 1 is audible. Filling only a gap before word 2 would leave
the words mislabeled. The pinned QUA v3.2.0 catalog contains one complete
13-word occurrence in another MP3 of Shuraim's same recitation.

`probe-shuraim-3-124-source.mjs` decoded short windows from both chapter MP3s.
Five 800 ms windows across the verse gave normalized waveform correlations
0.846–0.946, with the best local offsets at -2743 ms in four windows and
-2737 ms in one. The whole-verse replacement applies the -2743 ms offset to
all 13 QUA word intervals. It checks the pinned source archive hash, Arabic
word sequence, complete occurrence, adjacent verse order, and exact QuranCDN
URL before generating the asset. The app also checks its URL, text, segment
coverage, and bounds before accepting it.

Two separately hosted EveryAyah 3:124 clips place the verse's first sound at
1731497 and 1731506 ms in the QuranCDN clock. These are 30–39 ms after the
mapped first-word start (1731467 ms), supporting that onset. Their three-window
correlations are 0.616 and 0.556; because the clips may differ in editing or
performance, they corroborate the opening location but are not used as the
timing source.

With the production chapter mix, the local verifier finds zero missing words
for reciter 10 over 114 chapters, versus one before the override, and zero
structural playback-plan errors. This does not certify every phoneme or each
word boundary by listening. The waveform comparison establishes a strong
match of the two recordings and a stable clock offset at sampled windows;
the word intervals still inherit QUA's alignment error. A qualified listener
should review the first two words before declaring the recitation perfect.

Hani 1:1 remains unresolved: the pinned same-MP3 QUA source has no complete
word occurrence, so no timing was inferred for that verse.
