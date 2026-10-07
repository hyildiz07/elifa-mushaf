# Remote chapter audio availability — 2026-09-30

The 11 selectable reciters have 1,254 reciter/chapter slots. Five Sudais chapters (3, 4, 5, 28, 29) are presently disabled by the app's timing gate, leaving 1,249 active slots; their source URLs were checked as well. The final pass found all 1,254 URLs available: HTTP 200 on HEAD, `audio/mpeg`, and nonzero `Content-Length` (minimum 180,347 bytes). There were no HTTP 403 or 404 responses, duplicate URLs, or duplicate ETags. No source mapping change is justified.

The first 55-URL sample also returned valid HTTP 206 for `Range: bytes=0-0` in every case. The returned `Content-Range` sizes matched the HEAD lengths. The audit did not download any complete MP3. A status/length check does not prove that each recording contains the correct reciter, surah, or timing; the existing acoustic and timing audits address that separate question.

The first full pass encountered 102 transient `fetch failed` errors, all on Sudais's `download.quranicaudio.com` URLs. Three of those returned 206 to a one-byte Range request despite the HEAD error. Retrying the uncertain rows yielded HTTP 200 HEAD for all 102. This pattern supports a temporary connection failure during the pass, rather than broken URLs. The first-pass errors are retained in the report for review.

The audit derives bundled URLs from `assets/verified-audio/<reciter>-<chapter>.json` and obtains the three legacy reciters' URLs and three bundled exceptions from the same QuranCDN metadata endpoint the app calls. It spaces requests by at least 150 ms, permits four at once, and limits each header request to 12 seconds. Range requests are one byte and cancelled immediately if a server ignores Range.

Reproduce with `node scripts/audit-remote-audio.mjs --sample`, then `node scripts/audit-remote-audio.mjs --all`; use `node scripts/audit-remote-audio.mjs --retry-uncertain` if transient failures occur. The raw reports are `review/remote-audio-sample.json`, `review/remote-audio-all.json`, and `review/remote-audio-all-retry.json`.
