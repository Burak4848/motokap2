#!/usr/bin/env python3
"""Read-only MOTOKAP live site smoke tests; must never place an order."""
import sys, ssl, time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit

BASE="https://www.motokap.com"
ERRORS=[]
headers={'User-Agent':'MOTOKAP-V14-Healthcheck/1.0'}
def get(path):
    url=BASE+path
    for attempt in range(3):
        try:
            with urlopen(Request(url,headers=headers),timeout=18,context=ssl.create_default_context()) as res:
                data=res.read(350000)
                return res.status,res.geturl(),res.headers,data
        except (HTTPError,URLError,TimeoutError) as e:
            if attempt==2:raise
            time.sleep(6)
def check(path,expected_marker=None,expected_path=None,content_type=None):
    try:
        status,final,headers,body=get(path)
        if status!=200:ERRORS.append(f'{path}: expected HTTP 200, got {status}')
        final_path=urlsplit(final).path
        if expected_path and final_path.rstrip('/')!=expected_path.rstrip('/'):
            ERRORS.append(f'{path}: redirected to {final_path}, expected {expected_path}')
        if expected_marker and expected_marker.encode() not in body:
            ERRORS.append(f'{path}: missing expected V14 content marker "{expected_marker}"')
        if content_type and content_type not in headers.get('Content-Type',''):
            ERRORS.append(f'{path}: wrong content type {headers.get("Content-Type")}')
        print(f'{path}: {status} -> {final_path} ({headers.get("Content-Type")}, {len(body)} bytes)')
    except Exception as e:ERRORS.append(f'{path}: {e}')
for path,marker in [
    ('/','site-v14.css'),
    ('/modeller/','site-v14.css'),
    ('/modeller/orta-boy/','WhatsApp'),
    ('/modeller/buyuk-boy/','WhatsApp'),
    ('/modeller/iki-motosiklet-atv/','WhatsApp'),
    ('/modeller/premium-xl/','Premium XL'),
    ('/modeller/besinci-model/','Premium XXL'),
    ('/sss/','MOTOKAP'),
    ('/rehber/kurulum/','MOTOKAP'),
]:
    check(path,expected_marker=marker)
for old,target in [
    ('/motokap-orta','/modeller/orta-boy/'),
    ('/motokap-buyuk','/modeller/buyuk-boy/'),
    ('/motokap-ikili','/modeller/iki-motosiklet-atv/'),
    ('/modeller/xxl','/modeller/iki-motosiklet-atv/'),
    ('/galeri','/'),
    ('/urunler','/modeller/'),
]:
    check(old,expected_path=target)
check('/robots.txt',expected_marker='Sitemap: https://www.motokap.com/sitemap.xml')
check('/sitemap.xml',expected_marker='/modeller/besinci-model/',content_type='xml')
check('/site-v14.js',expected_marker='waUrl')
check('/site-measurement-v14.js',expected_marker='motokap:fit_whatsapp_click')
check('/assets/motokap-v14/hero/hero-mobil-buyuk-kapali-sm.webp',content_type='image/webp')
check('/assets/motokap-v14/orta-boy/01-sr450-studyo.webp',content_type='image/webp')
check('/assets/motokap-v14/sizden-gelenler/10-maxi-scooter-tam.webp',content_type='image/webp')
for issue in ERRORS:print('FAIL:',issue)
if ERRORS:sys.exit(1)
print('PASS: MOTOKAP V14 live routes, legacy SEO redirects, tracking script, sitemap and images.')
