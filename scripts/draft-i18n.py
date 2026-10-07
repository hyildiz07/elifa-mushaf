"""Generate review-only locale drafts with the MIT-licensed M2M100 model.

Setup (kept outside the site build):
  pip install ctranslate2==4.8.2 transformers==4.57.3 sentencepiece torch
  ct2-transformers-converter --model facebook/m2m100_418M --output_dir MODEL_DIR --quantization int8
  python scripts/draft-i18n.py MODEL_DIR
"""
from __future__ import annotations

import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import sys

import ctranslate2
from transformers import AutoTokenizer


ROOT = Path(__file__).resolve().parents[1]
LANGUAGES = ('de', 'ru', 'ar', 'fr', 'es', 'el', 'zh', 'ja', 'ko', 'hi',
             'ur', 'it', 'id', 'nl', 'pt', 'fa', 'bn', 'ms', 'sw')
RTL = {'ar', 'ur', 'fa'}
MODEL_NAME = 'facebook/m2m100_418M'


class Segments(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.items = []
        self.skip = 0

    def handle_decl(self, declaration):
        self.items.append(('raw', '<!' + declaration + '>'))

    def handle_starttag(self, tag, attrs):
        self.items.append(('raw', self.get_starttag_text()))
        if tag in {'style', 'script'}:
            self.skip += 1

    def handle_startendtag(self, tag, attrs):
        self.items.append(('raw', self.get_starttag_text()))

    def handle_endtag(self, tag):
        self.items.append(('raw', '</' + tag + '>'))
        if tag in {'style', 'script'}:
            self.skip -= 1

    def handle_data(self, data):
        if self.skip or not re.search(r'[A-Za-z]', data) or data.strip() in {'Elifa Mushaf', 'info@elifaplatform.com'}:
            self.items.append(('raw', data))
        else:
            self.items.append(('text', data))

    def handle_entityref(self, name):
        self.items.append(('raw', '&' + name + ';'))

    def handle_charref(self, name):
        self.items.append(('raw', '&#' + name + ';'))

    def handle_comment(self, data):
        self.items.append(('raw', '<!--' + data + '-->'))


def page_segments(path):
    parser = Segments()
    parser.feed(path.read_text(encoding='utf8'))
    return parser.items


def source_text(item):
    value = html.unescape(item[1]).strip()
    return value


def translation_units(value):
    # The model can silently drop a second sentence, even in a short support
    # paragraph. Translate every complete sentence independently.
    return [part for part in re.split(r'(?:(?<=[.!?])|(?<=[.!?][”"]))\s+(?=[A-Z“])', value) if part]


def run(model_dir, languages):
    translator = ctranslate2.Translator(str(model_dir), device='cpu', compute_type='int8',
                                       inter_threads=2, intra_threads=4)
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    tokenizer.src_lang = 'en'
    account = json.loads((ROOT / 'locales/account-source.json').read_text(encoding='utf8'))
    guide = json.loads((ROOT / 'locales/guide-en.json').read_text(encoding='utf8'))
    privacy = page_segments(ROOT / 'gizlilik/en.html')
    support = page_segments(ROOT / 'destek/en.html')
    base_text = list(dict.fromkeys([*(value.strip() for value in account.values()),
        *(source_text(item) for items in (privacy, support) for item in items if item[0] == 'text')]))
    base_text = [value for value in base_text if value]
    guide_text = list(dict.fromkeys(value for section in guide.values() for item in section
                                     for value in (item['t'], item['x'])))
    print(f'{len(base_text)} page/account strings, {len(guide_text)} guide strings', flush=True)

    for lang in languages:
        target = ROOT / f'locales/account-{lang}.json'
        needs_guide = lang in {'fa', 'bn', 'ms', 'sw'}
        if not os.environ.get('REGENERATE_I18N') and target.exists() and (ROOT / f'gizlilik/{lang}.html').exists() and (ROOT / f'destek/{lang}.html').exists() and (not needs_guide or (ROOT / f'locales/guide-{lang}.json').exists()):
            print(f'{lang}: already generated', flush=True)
            continue
        all_text = list(dict.fromkeys(unit for value in base_text + (guide_text if needs_guide else []) for unit in translation_units(value)))
        translated = {}
        prefix = [tokenizer.lang_code_to_token[lang]]
        for start in range(0, len(all_text), 12):
            batch = all_text[start:start + 12]
            sources = [tokenizer.convert_ids_to_tokens(tokenizer.encode(value)) for value in batch]
            results = translator.translate_batch(sources, target_prefix=[prefix] * len(batch),
                beam_size=1, max_decoding_length=280)
            for source, result in zip(batch, results):
                tokens = result.hypotheses[0][1:]
                text = tokenizer.decode(tokenizer.convert_tokens_to_ids(tokens), skip_special_tokens=True).strip()
                translated[source] = text or source
            print(f'{lang}: {min(start + len(batch), len(all_text))}/{len(all_text)}', flush=True)

        def translate(value):
            return ' '.join(translated[unit] for unit in translation_units(value))

        target.write_text(json.dumps({key: (re.match(r'^\s*', value).group() + translate(value.strip()))
                                      for key, value in account.items()},
                          ensure_ascii=False, indent=2) + '\n', encoding='utf8')
        for name, items in [('gizlilik', privacy), ('destek', support)]:
            output = []
            for kind, raw in items:
                if kind == 'raw':
                    output.append(raw)
                    continue
                value = source_text((kind, raw))
                replacement = html.escape(translate(value) if value else value, quote=False)
                output.append(raw.replace(raw.strip(), replacement))
            document = ''.join(output).replace('<html lang="en">',
                f'<html lang="{lang}" dir="{"rtl" if lang in RTL else "ltr"}">', 1)
            document = document.replace('<body>',
                '<body><!-- Machine-translation draft; language and legal review required. -->', 1)
            heading = re.search(r'<h1>([^<]+)</h1>', document)
            if heading:
                document = re.sub(r'<title>.*?</title>', f'<title>{heading.group(1)} — Elifa Mushaf</title>', document, count=1)
            document = document.replace('/gizlilik/en.html', f'/gizlilik/{lang}.html')
            if name == 'gizlilik':
                paragraphs = list(re.finditer(r'<p(?: [^>]*)?>[\s\S]*?</p>', document))
                providers = {2: ['Firebase Authentication'], 3: ['Cloud Firestore'],
                             10: ['QuranCDN', 'Firebase Authentication', 'Cloud Firestore'],
                             11: ['Google Analytics']}
                for index in sorted(providers, reverse=True):
                    paragraph = paragraphs[index]
                    names = [item for item in providers[index] if item not in paragraph.group()]
                    if names:
                        addition = ' (' + ' · '.join(f'<bdi>{item}</bdi>' for item in names) + ')'
                        document = document[:paragraph.end()-4] + addition + document[paragraph.end()-4:]
            (ROOT / name / f'{lang}.html').write_text(document, encoding='utf8')
        if needs_guide:
            guide_draft = {section: [{'t': translate(item['t']), 'x': translate(item['x'])}
                                     for item in items] for section, items in guide.items()}
            (ROOT / f'locales/guide-{lang}.json').write_text(json.dumps(guide_draft,
                ensure_ascii=False, indent=2) + '\n', encoding='utf8')
        print(f'{lang}: files written', flush=True)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit('Usage: draft-i18n.py MODEL_DIR [language ...]')
    selected = tuple(sys.argv[2:]) or LANGUAGES
    if any(lang not in LANGUAGES for lang in selected):
        raise SystemExit('Unknown language')
    run(Path(sys.argv[1]), selected)
