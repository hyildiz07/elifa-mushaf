"""Research-only CTC neighborhood for Sudais 24:35 word 40/41; no cut approval."""
from pathlib import Path
import hashlib
import json

import numpy as np
import soundfile as sf
import torch
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC

root = Path.cwd()
model_dir = root / "test-results/review-phoneme/model"
window_start, window_end = 660000, 666000
wav_path = root / f"test-results/review-phoneme/24-35-{window_start}-{window_end}.wav"
audio, rate = sf.read(wav_path, dtype="float32")
assert rate == 16000 and len(audio) == (window_end-window_start) * 16 and audio.ndim == 1
torch.set_num_threads(4)
processor = Wav2Vec2Processor.from_pretrained(model_dir, local_files_only=True,
                                             extra_special_tokens={})
model = Wav2Vec2ForCTC.from_pretrained(model_dir, local_files_only=True).eval()
with torch.inference_mode():
    logits = model(**processor(audio, sampling_rate=rate, return_tensors="pt")).logits[0]
    probabilities = torch.softmax(logits, dim=-1)
    ids = torch.argmax(probabilities, dim=-1).cpu().numpy()
blank = processor.tokenizer.pad_token_id
vocab = {int(value): key for key, value in processor.tokenizer.get_vocab().items()}
frame_ms = (window_end-window_start) / len(ids)
events = []
index = 0
while index < len(ids):
    end = index + 1
    while end < len(ids) and ids[end] == ids[index]:
        end += 1
    if ids[index] != blank:
        events.append({"token": vocab.get(int(ids[index]), str(ids[index])),
                       "start_ms": round(window_start + index * frame_ms, 1),
                       "end_ms": round(window_start + end * frame_ms, 1),
                       "mean_probability": round(float(np.mean(probabilities[index:end, ids[index]].cpu().numpy())), 4)})
    index = end
frames = []
for index, token_id in enumerate(ids):
    ms = window_start + (index + .5) * frame_ms
    if 663600 <= ms <= 664500:
        frames.append({"ms": round(ms, 1), "token": vocab.get(int(token_id), str(token_id)),
                       "blank_probability": round(float(probabilities[index, blank]), 4)})
result = {"status": "research-only-no-cut-approval", "verse": "24:35",
          "after_word": 40, "word_40_provider_end_ms": 663825,
          "word_41_provider_start_ms": 664265,
          "model": "MostafaMaroof/wav2vec2-arabic-phoneme-asr",
          "model_sha256": hashlib.sha256((model_dir / "model.safetensors").read_bytes()).hexdigest(),
          "wav_sha256": hashlib.sha256(wav_path.read_bytes()).hexdigest(),
          "frame_ms": frame_ms, "greedy_phonemes": processor.decode(torch.from_numpy(ids)),
          "events": events, "boundary_frames": frames,
          "caveat": "Free-decoded CTC tokens are not forced word alignment; blank is not silence and | is a phoneme separator."}
path = root / "review/sudais-24-35-phoneme-pilot.json"
path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"output": str(path), "frames": len(ids), "events": len(events),
                  "near_boundary": [e for e in events if e["end_ms"] >= 663700 and e["start_ms"] <= 664400]},
                 ensure_ascii=False))
