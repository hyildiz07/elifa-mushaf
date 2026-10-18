# Study Desk settings and playback controls

## Findings and changes

- Changing the verse/part repeat count could leave the method on whole-section playback. An explicit verse-count edit now enables verse practice when the previous method was whole-section. Editing a positive combine count selects cumulative practice. Editing whole-study rounds preserves the inner method. Users can explicitly select whole-section playback afterwards.
- Selecting cumulative practice in setup changed the verse method without changing the split-parts combine flag. Explicit method selection now sets both draft values; Open applies them together.
- Setup method changes and inspecting a saved study previously changed the active reader method before Open. Draft settings now stay separate until Open, so Back leaves the committed reader settings intact.
- Main/split repeat counters and combine indicators could be refreshed independently. A shared refresh updates both players, setting fields, manual-part status, visible active classes and `aria-pressed` values. Idle edits do not autoplay; active method changes retain the existing boundary-safe transition.
- Full-player numeric input previously accepted values outside the saved-study limits. Verse repeats are now bounded to 1–99 and wait to 0–60 seconds. Reader settings resolve the current screen rather than retaining an earlier parts context.

## Preserved behavior

The verse/part, cumulative and whole-study counts remain independent. Zero cumulative repetitions skips combined steps; zero whole-study rounds adds no return to the beginning. Speed/wait edits do not enable repetition or change the method. Existing saved settings, manual cuts, recording identities and timing guards remain intact.

## Validation

- Production-context `npm run build`: 386 tests, 384 passed, 0 failed, 2 optional Firebase tests skipped; translation validation passed.
- Added regressions exercise setup-to-player transfer with real control refresh functions, the actual verse/cumulative playback plan, separate counts, zero values, draft cancellation, saved-study inspection, live gear edits and full-player limits.
- Browser: reproduced the original whole-section/verse-count mismatch on v351. On the fixed build, setting verse repeats selected verse practice and Play completed without a Combine tap. Choosing cumulative practice activated the bottom Combine control immediately. Manually created three parts of Fatiha 2; both part controls were already enabled, and playback completed through part 1+2+3.
- Physical Android/iPhone background and lock-screen playback were not exercised in this check. This is a focused settings/state audit, not a claim that the entire application has no remaining defects.

Production remains unchanged pending review of this fix.
