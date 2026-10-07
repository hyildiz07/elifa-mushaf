"""Translate previously hard-coded controls for review; source is curated English."""
import json
from pathlib import Path
import sys
import ctranslate2
from transformers import AutoTokenizer

root = Path(__file__).resolve().parents[1]
source = json.loads((root / 'locales/ui-extra-source.json').read_text(encoding='utf8'))
languages = ('de','ru','ar','fr','es','el','zh','ja','ko','hi','ur','it','id','nl','pt','fa','bn','ms','sw')
translator = ctranslate2.Translator(sys.argv[1], device='cpu', compute_type='int8', inter_threads=2, intra_threads=4)
tokenizer = AutoTokenizer.from_pretrained('facebook/m2m100_418M')
tokenizer.src_lang = 'en'
drafts = {'en': source}
overrides = json.loads((root / 'locales/ui-extra-overrides.json').read_text(encoding='utf8'))
for lang in languages:
    prefix = [tokenizer.lang_code_to_token[lang]]
    items = list(source.items())
    output = {}
    for start in range(0, len(items), 12):
        batch = items[start:start+12]
        tokens = [tokenizer.convert_ids_to_tokens(tokenizer.encode(value)) for _, value in batch]
        results = translator.translate_batch(tokens, target_prefix=[prefix] * len(tokens), beam_size=1, max_decoding_length=100)
        for (key, english), result in zip(batch, results):
            translated = tokenizer.decode(tokenizer.convert_tokens_to_ids(result.hypotheses[0][1:]), skip_special_tokens=True).strip()
            output[key] = translated or english
    output.update(overrides.get(lang, {}))
    drafts[lang] = output
    print(lang, flush=True)
(root / 'assets/ui-extra-drafts.js').write_text('// Generated review-only machine translations.\nwindow.ELIFA_UI_EXTRA_DRAFTS=' + json.dumps(drafts, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf8')
