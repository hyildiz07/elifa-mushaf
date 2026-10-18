# Afasy Fatiha cumulative boundary repair (v356)

The MP3Quran Afasy metadata lacks file_size. The normal/combined verse player consequently skipped full-chapter decoding even for the 837734-byte, 51.931-second Fatiha recording. It used timer-stopped HTMLAudio, unlike the already bounded marked/split path. Timer delays on a phone can allow the next verse to sound despite a correct requested end.

Short Afasy chapters with a timing extent of at most 60 seconds now prepare same-source PCM, with a 5 MiB download limit enforced on streamed bytes and a 20-second request timeout. Their bounded normal/combined steps wait for decoding and recheck request/step identity. Failed precise decoding does not silently start the imprecise streaming path. Existing offline files use the same recording; long chapters and other reciters do not gain whole-chapter downloads.

Source PCM audit: exact MP3Quran /mishary-alafasy/r1/001.mp3; MPEG decoder returned 44100 Hz, no errors. The requested 1–2 end is 17720 ms, before the next word at 17895 ms; 1–3 ends at 22275 ms, before 22480 ms. No timing values were shortened or replaced.

Production-context build passed 400 tests: 398 passed, zero failed, two optional Firebase skips. Added six regressions covering online/offline missing-size decoding, byte limits, unchanged long/other-reciter behavior, async cancellation and no silent imprecise fallback.

Instrumented local copy of the actual application verified Fatiha 1–3 at 1.25x: verse and 1+2/1+2+3 steps all used bounded-pitch clips with the requested endpoints and a real decoded chapter buffer; the program completed. The instrumentation is dev-only and excluded from release. Normal-speed Web Audio verification is captured in test-results. This is not a claim of physical Android/iOS device testing, a full Quran listening audit or a fix to every long-chapter streaming boundary.
