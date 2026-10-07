"""Research-only A/B phoneme hypotheses; never authorizes a Quran audio cut."""
from pathlib import Path
import json
import numpy as np
import soundfile as sf
import torch
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC

ROOT = Path.cwd()
MODEL = ROOT / 'test-results/review-phoneme/model'
CLIPS = ROOT / 'test-results/docs/local-audio-review'
PAIRS = ['sudais-36-83', 'hani-2-286', 'hani-65-12']
torch.set_num_threads(4)
processor = Wav2Vec2Processor.from_pretrained(MODEL, local_files_only=True,
                                                extra_special_tokens={})
model = Wav2Vec2ForCTC.from_pretrained(MODEL, local_files_only=True).eval()
blank = processor.tokenizer.pad_token_id
vocab = {int(v): k for k, v in processor.tokenizer.get_vocab().items()}
results = []
for pair in PAIRS:
    rows = []
    for side in ('A-production', 'B-legacy'):
        path = CLIPS / f'{pair}-{side}.wav'
        samples, rate = sf.read(path, dtype='float32')
        if samples.ndim != 1:
            samples = samples.mean(axis=1)
        # Review-only resampling. The model's ~20 ms frames cannot establish
        # the exact end of a consonant or distinguish a phoneme from reverb.
        target_len = round(len(samples) * 16000 / rate)
        samples = np.interp(np.arange(target_len) * rate / 16000,
                            np.arange(len(samples)), samples).astype('float32')
        inputs = processor(samples, sampling_rate=16000, return_tensors='pt', padding=True)
        with torch.inference_mode():
            logits = model(**inputs).logits[0]
            ids = torch.argmax(logits, dim=-1).cpu().numpy()
        frame_ms = 1000 * len(samples) / 16000 / len(ids)
        events = []
        i = 0
        while i < len(ids):
            j = i + 1
            while j < len(ids) and ids[j] == ids[i]:
                j += 1
            if ids[i] != blank:
                events.append({'token': vocab.get(int(ids[i]), str(ids[i])),
                               'from_ms': round(i * frame_ms, 1),
                               'to_ms': round(j * frame_ms, 1)})
            i = j
        rows.append({'side': side, 'duration_ms': round(len(samples)/16, 1),
                     'hypothesis': processor.decode(torch.from_numpy(ids)),
                     'last_events': events[-18:]})
    results.append({'pair': pair, 'clips': rows})
out = ROOT / 'test-results/final-tail-phoneme-ctc.json'
out.write_text(json.dumps({'status': 'research-only-no-cut-approval', 'results': results},
                          ensure_ascii=False, indent=2), encoding='utf-8')
for row in results:
    print(json.dumps(row, ensure_ascii=False), flush=True)
