"""List static HTML text without a data-i18n attribute for manual review."""
from html.parser import HTMLParser
from pathlib import Path
import re

class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.values = {}
    def handle_starttag(self, tag, attrs):
        self.stack.append((tag, dict(attrs)))
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, -1, -1):
            if self.stack[i][0] == tag:
                self.stack = self.stack[:i]
                break
    def handle_data(self, data):
        value = re.sub(r'\s+', ' ', data).strip()
        if not value or len(value) > 250 or not re.search(r'[A-Za-zÇĞİÖŞÜçğıöşü]', value):
            return
        if any(tag in {'script','style','svg','title'} for tag, _ in self.stack):
            return
        if any(any(key.startswith('data-i18n') for key in attrs) for _, attrs in self.stack):
            return
        if value not in self.values:
            self.values[value] = self.stack[-1][0] if self.stack else ''

audit = Audit()
audit.feed(Path('index.html').read_text(encoding='utf8'))
for text, tag in audit.values.items():
    print(f'{tag}\t{text}')
