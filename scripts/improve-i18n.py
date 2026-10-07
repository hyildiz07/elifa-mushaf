"""One-time reviewed-source translation drafts via Google Translate public endpoint.

The generated files are committed assets, not runtime requests. This is a draft
translation source; structural and human language checks still apply.
"""
from __future__ import annotations

import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
LANGUAGES = ('de','ru','ar','fr','es','el','zh','ja','ko','hi','ur','it','id','nl','pt','fa','bn','ms','sw')
RTL = {'ar','ur','fa'}
GOOGLE_CODES = {'zh':'zh-CN'}
SEPARATOR = '\n###\n'

class Segments(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.items=[]
        self.skip=0
    def handle_decl(self, value): self.items.append(('raw','<!'+value+'>'))
    def handle_starttag(self,tag,attrs):
        self.items.append(('raw',self.get_starttag_text()))
        if tag in {'script','style'}: self.skip+=1
    def handle_startendtag(self,tag,attrs): self.items.append(('raw',self.get_starttag_text()))
    def handle_endtag(self,tag):
        self.items.append(('raw','</'+tag+'>'))
        if tag in {'script','style'}: self.skip-=1
    def handle_data(self,data):
        kind='text' if not self.skip and re.search('[A-Za-z]',data) and data.strip() not in {'Elifa Mushaf','info@elifaplatform.com'} else 'raw'
        self.items.append((kind,data))
    def handle_entityref(self,name): self.items.append(('raw','&'+name+';'))
    def handle_charref(self,name): self.items.append(('raw','&#'+name+';'))
    def handle_comment(self,data): self.items.append(('raw','<!--'+data+'-->'))

def page_segments(name):
    parser=Segments()
    parser.feed((ROOT/name/'en.html').read_text(encoding='utf8'))
    return parser.items

def source_text(raw): return html.unescape(raw).strip()

def units(value):
    return [part for part in re.split(r'(?:(?<=[.!?])|(?<=[.!?][”"]))\s+(?=[A-Z“])',value) if part]

def batches(values,limit=1450):
    current=[]
    size=0
    for value in values:
        if current and size+len(value)+len(SEPARATOR)>limit:
            yield current
            current=[]
            size=0
        current.append(value)
        size+=len(value)+len(SEPARATOR)
    if current: yield current

def translate_batch(language, values):
    data=SEPARATOR.join(values)
    query=urlencode({'client':'gtx','sl':'en','tl':GOOGLE_CODES.get(language,language),'dt':'t','q':data})
    request=Request('https://translate.googleapis.com/translate_a/single?'+query,
                    headers={'User-Agent':'Mozilla/5.0 ElifaLocaleDraft/1.0'})
    last=None
    for attempt in range(4):
        try:
            with urlopen(request,timeout=25) as response:
                payload=json.load(response)
            result=''.join(segment[0] or '' for segment in payload[0])
            parts=[part.strip() for part in result.split('###')]
            if len(parts)!=len(values) or any(not part for part in parts):
                if len(values)>1:
                    middle=len(values)//2
                    return translate_batch(language,values[:middle]) | translate_batch(language,values[middle:])
                raise ValueError(f'{language}: batch alignment {len(parts)} != {len(values)}')
            return dict(zip(values,parts))
        except Exception as error:
            last=error
            time.sleep(min(2**attempt,8))
    raise RuntimeError(f'{language}: translation failed: {last}')

def translated_page(name,items,language,translations):
    output=[]
    for kind,raw in items:
        if kind=='raw':output.append(raw);continue
        value=source_text(raw)
        replacement=' '.join(translations[part] for part in units(value))
        output.append(raw.replace(raw.strip(),html.escape(replacement,quote=False)))
    document=''.join(output).replace('<html lang="en">',f'<html lang="{language}" dir="{"rtl" if language in RTL else "ltr"}">',1)
    document=document.replace('<body>','<body><!-- Machine-translation draft; language and legal review required. -->',1)
    heading=re.search(r'<h1>([^<]+)</h1>',document)
    if heading: document=re.sub(r'<title>.*?</title>',f'<title>{heading.group(1)} — Elifa Mushaf</title>',document,count=1)
    document=document.replace('/gizlilik/en.html',f'/gizlilik/{language}.html')
    return document

def run(language, account, privacy, support, guide):
    values=list(dict.fromkeys([*(value.strip() for value in account.values()),
        *(source_text(raw) for items in (privacy,support) for kind,raw in items if kind=='text'),
        *((value for section in guide.values() for item in section for value in (item['t'],item['x'])) if language in {'fa','bn','ms','sw'} else ())]))
    parts=list(dict.fromkeys(part for value in values if value for part in units(value)))
    work=list(batches(parts))
    translations={}
    with ThreadPoolExecutor(max_workers=5) as pool:
        futures=[pool.submit(translate_batch,language,batch) for batch in work]
        for future in as_completed(futures): translations.update(future.result())
    def translate(value):return ' '.join(translations[part] for part in units(value))
    account_output={key:re.match(r'^\s*',value).group()+translate(value.strip()) for key,value in account.items()}
    (ROOT/f'locales/account-{language}.json').write_text(json.dumps(account_output,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    for name,items in [('gizlilik',privacy),('destek',support)]:
        (ROOT/name/f'{language}.html').write_text(translated_page(name,items,language,translations),encoding='utf8')
    if language in {'fa','bn','ms','sw'}:
        guide_output={section:[{'t':translate(item['t']),'x':translate(item['x'])} for item in items] for section,items in guide.items()}
        (ROOT/f'locales/guide-{language}.json').write_text(json.dumps(guide_output,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(f'{language}: {len(parts)} units / {len(work)} requests / files written',flush=True)

if __name__=='__main__':
    selected=tuple(sys.argv[1:]) or LANGUAGES
    if any(language not in LANGUAGES for language in selected):raise SystemExit('Unknown language')
    account=json.loads((ROOT/'locales/account-source.json').read_text(encoding='utf8'))
    guide=json.loads((ROOT/'locales/guide-en.json').read_text(encoding='utf8'))
    privacy=page_segments('gizlilik')
    support=page_segments('destek')
    for language in selected:run(language,account,privacy,support,guide)
