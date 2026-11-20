#!/usr/bin/env python3
"""MOTOKAP static, SEO, conversion and migration safety checks."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/"public"
BASE="https://www.motokap.com"
ERRORS=[]
WARNINGS=[]
class Doc(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs=[]
        self.ids=set()
        self.meta={}
        self.canon=[]
        self.ldjson=[]
        self._json=False
        self.h1=0
        self.images=0
        self.missing_dims=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.add(a['id'])
        if tag=='h1':self.h1+=1
        if tag=='link' and a.get('rel')=='canonical':self.canon.append(a.get('href',''))
        if tag=='meta':
            k=a.get('name') or a.get('property')
            if k:self.meta[k]=a.get('content','')
        if tag in ('img','script','link','a','source','video'):
            for key in ('src','href','poster'):
                if a.get(key):self.refs.append(a[key])
            if a.get('srcset'):
                self.refs.extend([x.strip().split(' ')[0] for x in a['srcset'].split(',') if x.strip()])
        if tag=='img':
            self.images+=1
            if not a.get('width') or not a.get('height'):self.missing_dims+=1
        if tag=='script' and a.get('type')=='application/ld+json':self._json=True
    def handle_data(self,d):
        if self._json:self.ldjson.append(d)
    def handle_endtag(self,tag):
        if tag=='script':self._json=False

def url_to_path(u):
    parsed=urlsplit(u)
    if parsed.scheme not in ('','https','http'):return None
    if parsed.netloc and parsed.netloc.lower() not in ('www.motokap.com','motokap.com'):return None
    if not u.startswith('/') and not parsed.netloc:return None
    path=unquote(parsed.path)
    if not path or path=='/':return PUBLIC/'index.html'
    result=PUBLIC/path.lstrip('/')
    if result.is_dir() or path.endswith('/'):result=result/'index.html'
    return result

allpages=list(PUBLIC.rglob('*.html'))
canon_urls={}
for p in allpages:
    doc=Doc()
    try:doc.feed(p.read_text(encoding='utf-8-sig'))
    except Exception as e:
        ERRORS.append(f'HTML parser failure {p.relative_to(PUBLIC)}: {e}')
        continue
    slug='/' + str(p.relative_to(PUBLIC).parent).replace('\\','/').strip('.')
    if slug=='/':slug='/'
    elif not slug.endswith('/'):slug+='/'
    for u in doc.refs:
        q=url_to_path(u)
        if q and not q.exists():
            ERRORS.append(f'BROKEN local ref {p.relative_to(PUBLIC)} -> {u}')
    for raw in doc.ldjson:
        try:json.loads(raw)
        except Exception as e:ERRORS.append(f'Invalid JSON-LD {p.relative_to(PUBLIC)}: {e}')
    if len(doc.canon)>1:ERRORS.append(f'Multiple canonicals: {slug}')
    if doc.missing_dims:WARNINGS.append(f'{slug}: {doc.missing_dims} images without explicit width/height')
    if len(doc.canon)==1:canon_urls[slug]=doc.canon[0]
    if doc.h1==0 and 'noindex' not in doc.meta.get('robots',''):
        WARNINGS.append(f'Missing H1: {slug}')

xml=ET.parse(PUBLIC/'sitemap.xml').getroot()
locs=[x.text.strip() for x in xml.findall('.//{*}loc') if x.text]
for loc in locs:
    rel=urlsplit(loc).path
    p=url_to_path(loc)
    if not p or not p.exists():ERRORS.append(f'Sitemap missing page: {loc}')
    if canon_urls.get(rel)!=loc:ERRORS.append(f'Sitemap/canonical mismatch: {loc} vs {canon_urls.get(rel)}')
    html=p.read_text(encoding='utf-8-sig') if p and p.exists() else ''
    if re.search(r'<meta[^>]*name=["\']robots["\'][^>]*noindex',html,re.I):
        ERRORS.append(f'Sitemap page marked noindex: {loc}')
if len(locs)<20:ERRORS.append(f'Only {len(locs)} sitemap URLs, expected 20')

configs=[json.loads(x.read_text()) for x in [ROOT/'vercel.json',PUBLIC/'vercel.json']]
if configs[0]!=configs[1]:ERRORS.append('Vercel root/public configurations differ')
rules={r['source']:r for r in configs[0].get('redirects',[])}
for key,target in {
    '/motokap-orta':'/modeller/orta-boy/',
    '/motokap-buyuk':'/modeller/buyuk-boy/',
    '/motokap-ikili':'/modeller/iki-motosiklet-atv/',
    '/modeller/xxl':'/modeller/iki-motosiklet-atv/',
    '/galeri':'/#kullanim',
    '/urunler':'/modeller/'
}.items():
    for path in (key,key+'/'):
        rule=rules.get(path)
        if not rule or rule['destination']!=target or not rule.get('permanent'):
            ERRORS.append(f'Missing permanent redirect {path} -> {target}')
for slug in ('modeller/orta-boy','modeller/buyuk-boy','modeller/iki-motosiklet-atv'):
    html=(PUBLIC/slug/'index.html').read_text(encoding='utf-8-sig')
    if 'data-wa-order=' not in html or 'data-wa-question=' not in html:
        ERRORS.append(f'Missing distinct order/question WhatsApp CTA: {slug}')
    if 'WhatsApp' not in html:ERRORS.append(f'Missing WhatsApp on {slug}')
cfg=(PUBLIC/'content.js').read_text()
if '1154228726979585' not in cfg:ERRORS.append('Meta Pixel ID missing from content.js')
if '"siteUrl": "https://www.motokap.com"' not in cfg:ERRORS.append('Shared website URL is not www canonical')
if '"ga4Id": ""' in cfg:WARNINGS.append('GA4 is not configured (ID blank)')
if '"clarityId": ""' in cfg:WARNINGS.append('Microsoft Clarity is not configured (ID blank)')
print(f'Scanned {len(allpages)} HTML pages, {len(locs)} sitemap URLs, {sum(1 for x in PUBLIC.rglob("*") if x.suffix==".webp")} WebP assets and {len(rules)} redirects.')
for x in WARNINGS:print('WARN:',x)
for x in ERRORS:print('ERROR:',x)
if ERRORS:sys.exit(1)
print('PASS: all local links, images, SEO canonicals, JSON-LD, redirects, Pixel setup and CTAs checked.')
