# Compact Hifz settings review

- Replaced the tall repeat explanations with keyboard-accessible question-mark disclosures. All three original explanations and input descriptions remain available.
- Moved the method selection above the counters, grouped the repeat counts into compact rows and kept speed/wait and verse endpoints side by side. Existing control IDs, zero values and stepper actions are preserved.
- Added a visible Repeat switch to the Hifz header and moved the Study Desk Repeat switch outside the collapsed options. Count edits still enable repetition automatically; the header switch and both player indicators refresh together. Explicitly turning repetition off remains supported.
- The sheet now has fixed header and action areas with only the content region scrolling. Close and Start remain reachable when advanced settings are expanded or the viewport is short.
- Added CSS metal gradients using the existing theme colors, with no photos, fonts or external dependencies. Checked light Saray and dark Nahl appearance in a 390-pixel-wide frame containing the actual application, including a 640-pixel-tall layout. This does not claim a physical-phone test.
- Production-context build: 388 tests, 386 passed, 0 failed, 2 optional Firebase skips; translation validation passed. The new Repeat switch regression covers both player indicators, count/method preservation and no autoplay.

Prepared as a separate preview; production v352 is unchanged.
