# Compact Hifz settings review

- Replaced the tall repeat explanations with keyboard-accessible question-mark disclosures. All three original explanations and input descriptions remain available.
- Moved the method selection above the counters, grouped the repeat counts into compact rows and kept speed/wait and verse endpoints side by side. Existing control IDs, zero values and stepper actions are preserved.
- Added a visible Repeat switch to the Hifz header. Removed the separate Study Desk master switch: opening a configured study enables its program even if repeat was previously paused or a legacy saved study had repOn:false. Both player indicators refresh together. The reader can still pause repetition explicitly.
- The sheet now has fixed header and action areas with only the content region scrolling. Close and Start remain reachable when advanced settings are expanded or the viewport is short.
- Added CSS metal gradients using the existing theme colors, with no photos, fonts or external dependencies. Checked light Saray and dark Nahl appearance in a 390-pixel-wide frame containing the actual application, including a 640-pixel-tall layout. This does not claim a physical-phone test.
- Production-context build for v354: 392 tests, 390 passed, 0 failed, 2 optional Firebase skips; translation validation passed. New regressions apply unchanged saved programs with repOn:false, exercise real range/verse/cumulative playback plans, preserve zero counts, restore split controls and remember the chosen method across home setup.

## Study Desk activation correction (v354)

The setup checkbox was a second master gate: stored positive counts could be ignored unless it was explicitly checked. Opening from home also reset the chosen method to whole-range playback. The Open action now commits the configured program, stores its method and enables repetition without starting audio. Home setup restores the last committed method; plain reading startup remains neutral.

Only counters relevant to the chosen method are shown in Study Desk setup: whole-study rounds always, verse/part counts in verse and cumulative modes, and combined counts in cumulative mode. Whole-range mode stays continuous and does not multiply unrelated counts.

Local browser verification: opened the prefilled range setup without editing a count or checkbox; repeat was immediately enabled. Configured Fatiha 1–2 with two verse repeats and two study rounds; Play showed the verse program with Combine off. Disabled reader repeat, returned to setup and opened it without any setting-change events: repeat was enabled again and the verse program started directly. No physical-phone test is claimed.

Release uses the existing PR17 preview and Git-connected Netlify production pipeline.
