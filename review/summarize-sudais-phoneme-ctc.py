"""Print compact event neighborhoods for the research-only phoneme pilot."""
from pathlib import Path
import json

for verse in ("28-44", "5-111"):
    data = json.loads(Path(f"review/sudais-phoneme-ctc-{verse}-pilot.json").read_text(encoding="utf-8"))
    print("VERSE", data["verse"], "FRAMES", data["ctc_frames"])
    print("GREEDY", data["greedy_phonemes"])
    for b in data["boundaries"]:
        lo = min(b["qul_ms"], b["qud_ms"]) - 100
        hi = max(b["qul_ms"], b["qud_ms"]) + 100
        events = [(e["token"], e["start_ms"], e["end_ms"])
                  for e in b["ctc_events"] if e["end_ms"] >= lo and e["start_ms"] <= hi]
        at_qul = min(b["ctc_frames"], key=lambda f: abs(f["ms"] - b["qul_ms"]))
        at_qud = min(b["ctc_frames"], key=lambda f: abs(f["ms"] - b["qud_ms"]))
        print(b["name"], "QUL", b["qul_ms"], "QUD", b["qud_ms"],
              "at_QUL", at_qul, "at_QUD", at_qud, "events", events)
