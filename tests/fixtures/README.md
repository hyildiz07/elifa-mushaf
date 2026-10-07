# Reference fixtures

Downloaded on 2026-09-27 for regression testing.

- `{reciter}-{chapter}.json`: first `audio_files` record from `https://api.qurancdn.com/api/qdc/audio/reciters/{reciter}/audio_files?chapter={chapter}&segments=true` (with `sid` retained for test setup).
- `4-4.json`: Abu Bakr al-Shatri, An-Nisa; reproduces the reported truncation and non-monotonic/repeated word labels.
- `*-112.json`: all 11 application reciters, Al-Ikhlas.
- `pages.json`: `page_number` for each verse from `https://api.quran.com/api/v4/verses/by_chapter/{chapter}?per_page=50&page={page}`, indexed by chapter and zero-based verse offset. All pagination pages were collected.

These files are external reference observations, not expected values manufactured from the revised application. Automated agreement with a timing source does not establish that its labels are acoustically correct.
