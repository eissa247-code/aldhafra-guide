"""Repair Arabic text extracted from PDFs in visual order / presentation forms.
Usage: fix_arabic.py file.md   (rewrites in place; no-op if no such text found)"""
import re, sys, unicodedata
from bidi.algorithm import get_display

PRES = re.compile('[ﭐ-﷿ﹰ-﻿]')
# lam-alef ligatures: visual order is alef+lam once reversed, so expand reversed
LIG = {'ﻵ': 'آل', 'ﻶ': 'آل', 'ﻷ': 'أل', 'ﻸ': 'أل',
       'ﻹ': 'إل', 'ﻺ': 'إل', 'ﻻ': 'ال', 'ﻼ': 'ال'}

def fix_line(l):
    for k, v in LIG.items():
        l = l.replace(k, v)
    return get_display(unicodedata.normalize('NFKC', l), base_dir='R')

p = sys.argv[1]
text = open(p, encoding='utf-8').read()
if PRES.search(text):
    out = [fix_line(l) if PRES.search(l) else l for l in text.split('\n')]
    open(p, 'w', encoding='utf-8').write('\n'.join(out))
    print('arabic: repaired visual-order text')
