# Compact, themed study method selection (v355)

The operating-system select picker ignored application colors on mobile. Setup and the shared Hifz sheet now use a labelled native dialog with theme-aware option buttons, selected-state indicators and explanations. The existing select remains hidden as the settings model; choosing an option dispatches the same change event, preserving draft/commit boundaries and queued playback transitions. Escape, Close and backdrop dismissal preserve the selected value; focus returns to the trigger.

Study Desk cards now use smaller spacing, headings, icons and 44px input/action heights. Repeated hero headings are removed visually; the page title and introduction remain. Wide screens place save/list cards beside the form; mobile prioritizes the working form above optional save/list content. Existing saving, editing and deletion behavior is unchanged. Advanced settings and long saved lists remain scrollable rather than clipped.

Browser review: 360px-wide, approximately 591px-high frame of the actual app, light Saray and dark Nahl. With settings collapsed, the range form and Open action fit in the viewport. The complete three-option dialog and Close action fit without internal scrolling. Selection, Escape dismissal and trigger focus were exercised. This is browser emulation, not a physical-phone test.

Regression tests exercise the themed setup draft menu, cancellation and the reader menu's existing queued transition; all prior unchanged-program, repeat independence and split-resume tests remain in place. No sound files or timing metadata changed.
