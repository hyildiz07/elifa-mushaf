"""Research-only greedy CTC timing around two QDC verse windows; no cut approval."""
from pathlib import Path
import hashlib
import json
import sys

import numpy as np
import soundfile as sf
import torch
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC

ROOT = Path.cwd()
MODEL = ROOT / "test-results/review-phoneme/model"
CLOCKS = json.loads((ROOT / "review/sudais-corrected-qdc-word-clock-comparison-2026-09-30.json").read_text(encoding="utf-8"))
SPEC = {
    "28:44": (651500, 666000, [1, 3, 12]),
    "5:111": (2494000, 2514000, [7, 8, 9]),
}
selected = sys.argv[1:] or ["28:44", "5:111"]
torch.set_num_threads(4)
processor = Wav2Vec2Processor.from_pretrained(MODEL, local_files_only=True,
                                             extra_special_tokens={})
model = Wav2Vec2ForCTC.from_pretrained(MODEL, local_files_only=True).eval()
blank_id = processor.tokenizer.pad_token_id
id_to_token = {int(v): k for k, v in processor.tokenizer.get_vocab().items()}

for verse in selected:
    start, end, internal = SPEC[verse]
    surah, ayah = verse.split(":")
    wav_file = ROOT / f"test-results/review-phoneme/{surah}-{ayah}-{start}-{end}.wav"
    audio, rate = sf.read(wav_file, dtype="float32")
    assert rate == 16000 and audio.ndim == 1 and len(audio) == (end - start) * 16
    inputs = processor(audio, sampling_rate=rate, return_tensors="pt", padding=True)
    with torch.inference_mode():
        logits = model(**inputs).logits[0]
        probs = torch.softmax(logits, dim=-1)
        ids = torch.argmax(probs, dim=-1).cpu().numpy()
        top_prob = probs.max(dim=-1).values.cpu().numpy()
        blank_prob = probs[:, blank_id].cpu().numpy()
    frames = len(ids)
    frame_ms = (end - start) / frames
    events = []
    i = 0
    while i < frames:
        j = i + 1
        while j < frames and ids[j] == ids[i]:
            j += 1
        if ids[i] != blank_id:
            events.append({"token": id_to_token.get(int(ids[i]), str(ids[i])),
                           "start_ms": round(start + i * frame_ms, 1),
                           "end_ms": round(start + j * frame_ms, 1),
                           "max_p": round(float(np.max(top_prob[i:j])), 4),
                           "mean_p": round(float(np.mean(top_prob[i:j])), 4)})
        i = j
    clocks = CLOCKS["verses"][verse]
    q = clocks["qul_words"]
    d = clocks["models"]["Base"]["words"]
    outer = json.loads((ROOT / f"review/sudais-{surah}-{ayah}-corrected-window-align.json").read_text(encoding="utf-8"))
    qul_outer = outer["qul_source_matched_candidate_ms"][verse]
    qud_segments = [s for s in outer["models"]["Base"]["segments"]
                    if s["ref_from"].startswith(verse + ":")]
    qud_outer = [min(s["source_from_ms"] for s in qud_segments),
                 max(s["source_to_ms"] for s in qud_segments)]
    boundaries = [
        ("verse_start", qul_outer[0], qud_outer[0]),
        *[(f"after_word_{n}", q[n-1]["end_ms"], d[n-1]["end_ms"]) for n in internal],
        ("verse_end", qul_outer[1], qud_outer[1]),
    ]
    out_boundaries = []
    for name, qul_ms, qud_ms in boundaries:
        center = (qul_ms + qud_ms) / 2
        lo, hi = center - 600, center + 600
        local_events = [e for e in events if e["end_ms"] >= lo and e["start_ms"] <= hi]
        local_frames = []
        for k in range(frames):
            t = start + (k + .5) * frame_ms
            if lo <= t <= hi:
                local_frames.append({"ms": round(t, 1), "token": id_to_token.get(int(ids[k]), str(ids[k])),
                                     "p_top": round(float(top_prob[k]), 4),
                                     "p_blank": round(float(blank_prob[k]), 4)})
        out_boundaries.append({"name": name, "qul_ms": qul_ms,
                               "qud_ms": qud_ms,
                               "qud_edge_type": "segment" if name.startswith("verse_") else "word",
                               "qul_qud_difference_ms": abs(qul_ms - qud_ms),
                               "ctc_events": local_events, "ctc_frames": local_frames})
    output = {
        "status": "research-only-no-cut-approval",
        "model": "MostafaMaroof/wav2vec2-arabic-phoneme-asr",
        "weight_sha256": hashlib.sha256((MODEL / "model.safetensors").read_bytes()).hexdigest(),
        "verse": verse, "window_ms": [start, end],
        "wav_sha256": hashlib.sha256(wav_file.read_bytes()).hexdigest(),
        "sample_rate": rate, "ctc_blank_id": blank_id,
        "ctc_frames": frames, "ctc_frame_ms": frame_ms,
        "greedy_phonemes": processor.decode(torch.from_numpy(ids)),
        "all_ctc_events": events, "boundaries": out_boundaries,
        "caveat": "Free-decoded CTC tokens have boundary jitter and are not forced-aligned to canonical Arabic words. They do not prove phoneme completion or authorize a cut.",
    }
    target = ROOT / f"review/sudais-phoneme-ctc-{surah}-{ayah}-pilot.json"
    target.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"verse": verse, "frames": frames, "events": len(events),
                      "boundaries": [b["name"] for b in out_boundaries], "output": str(target)}), flush=True)
