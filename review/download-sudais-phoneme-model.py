"""Research-only download of the pinned phoneme-model weight into ignored test-results."""
from pathlib import Path
import json
import time
import urllib.request

url = "https://huggingface.co/MostafaMaroof/wav2vec2-arabic-phoneme-asr/resolve/main/model.safetensors"
target = Path("test-results/review-phoneme/model/model.safetensors")
expected = 1262135432
target.parent.mkdir(parents=True, exist_ok=True)
start = target.stat().st_size if target.exists() else 0
if start > expected:
    raise RuntimeError("Existing weight exceeds expected size")
if start < expected:
    req = urllib.request.Request(url, headers={"Range": f"bytes={start}-"})
    with urllib.request.urlopen(req, timeout=90) as response:
        if response.status not in (200, 206) or (start and response.status != 206):
            raise RuntimeError(f"Unexpected HTTP {response.status}")
        t0 = time.time()
        next_report = start + 100_000_000
        with target.open("ab" if start else "wb") as out:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
                if out.tell() >= next_report:
                    print(json.dumps({"bytes": out.tell(), "elapsed_s": round(time.time() - t0, 1)}), flush=True)
                    next_report += 100_000_000
if target.stat().st_size != expected:
    raise RuntimeError(f"Incomplete weight: {target.stat().st_size}/{expected}")
print(json.dumps({"complete": True, "bytes": expected}), flush=True)
