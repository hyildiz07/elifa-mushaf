# Remaining 11 audio cases: user impact

This is a structural/UI audit of the current local build, not a claim that every
phoneme has been checked by ear. The full verifier in
`test-results/final-local-validation.json` examined 1,254 reciter–chapter files
and 137,192 verse/display-mode plans with zero structural errors. It found 11
unique verse exceptions; the application also quarantines five entire Südeys
chapters through `audioTimingUnverified`.

| Reciter / verse | What the listener can do now | Why it is limited |
| --- | --- | --- |
| Südeys 24:35 | Nine split cards; one has 9 words. Normal verse playback remains available. | A further word cut is not phonetically verified. |
| Südeys 39:54 | One 13-word card and normal verse playback. | The same recording repeats words 4–5; the remaining 5→6 sound boundary is active. |
| Hüsarî Muallim 2:145 | Full verse on its verified clip; four split cards of 10/4/5/13 words. | Only three internal phrase breaks have been approved. |
| Südeys 3:160, 4:134, 4:143, 5:5, 5:46, 5:82 | Südeys audio for the **whole of chapters 3, 4 and 5** is withheld; chapter metadata cannot safely locate every verse. The same quarantine also covers chapters 28 and 29, which are outside these 11 examples. Reading remains available; choose another reciter to hear or split the verses. | Chapter time axis/source mismatch. The three particularly unsafe verse endings 3:160, 4:143 and 5:5 are also guarded in the split and single-verse plans. |
| Hânî 6:139 | Normal full-verse playback uses a separately verified clip. Split playback stays blocked with an explicit message. | Complete word-by-word identity, especially positions 17–18, remains unresolved. |
| Hânî 34:46 | Split, single-verse, repeat and partial-selection cuts are blocked; continuous chapter playback remains available. | Active extra sound at the verse transition has no proven word owner. |

The eight other reciters (IDs 1, 2, 4, 6, 7, 9, 10, 97) had no over-eight-word
exception or guarded split step for these verses in the full structural report.
This establishes an available alternative plan, not acoustic perfection on a
listener's device. Reciter changes from the split screen retain the selected
verse and reopen its plan after metadata loads.

Two misleading messages were corrected in `index.html`: the reciter chooser no
longer says every recording supports word sync, in any of its 21 languages;
and a one-card, over-eight-word verse no longer calls itself a short memory
part. Any over-eight-word card is now identified with a suggestion to choose
another reciter. When a listener tries to select Südeys in a quarantined
chapter, the chooser now retains the current working reciter instead of saving
the unavailable one and clearing its audio. The audio source, timing and play
plan were not changed. `tests/split-exception-copy.test.mjs` covers the wording
before/after audio preparation and the blocked-reciter choice.
