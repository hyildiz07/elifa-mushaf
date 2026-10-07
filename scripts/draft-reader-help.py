"""Generate review-only reader help UI drafts using the local M2M100 model."""
import json
from pathlib import Path
import sys
import ctranslate2
from transformers import AutoTokenizer

root = Path(__file__).resolve().parents[1]
source = json.loads((root / 'locales/reader-help-source.json').read_text(encoding='utf8'))
languages = ('de','ru','ar','fr','es','el','zh','ja','ko','hi','ur','it','id','nl','pt','fa','bn','ms','sw')
translator = ctranslate2.Translator(sys.argv[1], device='cpu', compute_type='int8', inter_threads=2, intra_threads=4)
tokenizer = AutoTokenizer.from_pretrained('facebook/m2m100_418M')
tokenizer.src_lang = 'en'
drafts = {}
for lang in languages:
    prefix = [tokenizer.lang_code_to_token[lang]]
    keys = list(source)
    values = [source[key].strip() for key in keys]
    tokens = [tokenizer.convert_ids_to_tokens(tokenizer.encode(value)) for value in values]
    results = translator.translate_batch(tokens, target_prefix=[prefix] * len(tokens), beam_size=1, max_decoding_length=140)
    translations = [tokenizer.decode(tokenizer.convert_tokens_to_ids(result.hypotheses[0][1:]), skip_special_tokens=True).strip() for result in results]
    drafts[lang] = dict(zip(keys, translations))
    print(lang, flush=True)
(root / 'assets/reader-help-drafts.js').write_text('// Generated review-only machine translations.\nwindow.ELIFA_READER_HELP_DRAFTS=' + json.dumps(drafts, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf8')
