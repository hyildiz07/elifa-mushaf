# QDC research decode: one chapter pass for many windows

`node review/benchmark-batched-qdc-decode.mjs` compares the existing
`decodeWindow()` path with a research-only batch decoder. Both start at MP3 byte
zero, preserve encoder delay, and decode sequentially. QUL timing rows select
ten widely separated, one-second *sample locations* in QDC chapter 3; those
rows are not used as proof of correct QDC verse boundaries.

Measured on this Windows workspace (2026-09-30, local 58,539,904-byte file):
The source SHA-256 is `7a52d1efb56e31d8c84436aec39cbeebde8498dfa43acaf2c082c7c145153614`.

| Method | Elapsed | Work |
| --- | ---: | --- |
| Ten independent `decodeWindow()` calls | 25,795 ms | Re-decodes chapter prefix ten times |
| One batch decode | 4,813 ms | Decodes prefix once to the last window |

Speedup: **5.36×** for this ten-window case (a prior run measured 4.46×). The 882,018 compared stereo PCM
samples match exactly (`maxAbsoluteError: 0`); rate is 44,100 Hz. See
`review/batched-qdc-decode-benchmark.json` for machine-readable results.

For larger reviews, group every requested interval by chapter and decode each
chapter once. Keep just the current short window, or flush a finished window to
disk, to bound memory; never retain all chapter PCM. The batch operation can
also compute RMS/quiet traces in the same pass. This saves redundant decoding
and repeated worker startup, but **does not** make silence a phonetic boundary
or validate QUL timing for QDC. Every candidate cut still needs the existing
source-match and acoustic/linguistic gates before production use.
