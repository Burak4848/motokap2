#!/usr/bin/env python3
"""Read-only MOTOKAP live browser QA. Never sends WhatsApp messages."""
from playwright.sync_api import sync_playwright, Error, TimeoutError
from urllib.parse import parse_qs, urlsplit
from pathlib import Path
import sys

BASE='https://www.motokap.com'
errors=[]
results=[]
pages=[
    ('/',390),
    ('/',768),
    ('/',1440),
    ('/modeller/orta-boy/',390),
    ('/modeller/buyuk-boy/',390),
    ('/modeller/iki-motosiklet-atv/',390),
    ('/modeller/premium-xl/',390),
    ('/modeller/besinci-model/',390)
]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    try:
        for path,width in pages:
            context=browser.new_context(viewport={'width':width,'height':844},device_scale_factor=1)
            page=context.new_page()
            label=f'{path} @ {width}px'
            page_errors=[]
            page.on('pageerror',lambda e:page_errors.append(str(e)))
            failed=[]
            page.on('response',lambda r:failed.append((r.status,r.url)) if r.status>=400 and urlsplit(r.url).hostname in ('motokap.com','www.motokap.com') else None)
            try:
                resp=page.goto(BASE+path,wait_until='domcontentloaded',timeout=45000)
                page.wait_for_load_state('load',timeout=30000)
                page.wait_for_timeout(350)
                if not resp or resp.status!=200:
                    errors.append(f'{label}: HTTP status {resp.status if resp else "missing"}')
                if not page.title() or not page.locator('h1').count():
                    errors.append(f'{label}: page title or H1 is missing')
                metrics=page.evaluate('''() => ({
                    viewport:innerWidth,
                    scrollWidth:document.documentElement.scrollWidth,
                    bodyWidth:document.body.scrollWidth,
                    images:[...document.querySelectorAll('img')].length,
                    broken:[...document.images].filter(im=>im.complete && im.naturalWidth===0).map(im=>im.src).slice(0,8),
                    navigation:Math.round(performance.getEntriesByType('navigation')[0]?.duration||0),
                    css:!!document.querySelector('link[href="/site-v14.css"]')
                })''')
                if metrics['scrollWidth']>metrics['viewport']+3:
                    errors.append(f'{label}: horizontal overflow {metrics["scrollWidth"]}>{metrics["viewport"]}')
                if metrics['broken']:
                    errors.append(f'{label}: broken loaded images {metrics["broken"]}')
                if page_errors:errors.append(f'{label}: JS exceptions {page_errors[:4]}')
                if failed:errors.append(f'{label}: site HTTP errors {failed[:5]}')
                if path=='/':
                    if not page.locator('#kullanim .reel figure').count()>=10:
                        errors.append(f'{label}: fewer than 10 customer photos')
                    if width==390:
                        banner=page.locator('#motokap-cookie-panel')
                        if not banner.count() or not banner.is_visible():
                            errors.append(f'{label}: cookie consent panel missing')
                        else:
                            page.locator('#motokap-cookie-panel button[data-choice="denied"]').click()
                            if banner.count():errors.append(f'{label}: cookie panel did not close')
                            trackers=page.locator('script[src*="fbevents.js"]')
                            if trackers.count():errors.append(f'{label}: Meta tracker loaded despite consent denial')
                        menu=page.locator('.menu-btn')
                        if menu.count() and menu.is_visible():
                            menu.click()
                            if not page.locator('#drawer.open').count():errors.append(f'{label}: mobile menu failed to open')
                            page.keyboard.press('Escape')
                            if page.locator('#drawer.open').count():errors.append(f'{label}: mobile menu failed to close')
                    if not page.locator('#kullanim .reel-controls button').count()>=2:
                        errors.append(f'{label}: customer photo carousel controls missing')
                if path.startswith('/modeller/') and path not in ('/modeller/premium-xl/','/modeller/besinci-model/'):
                    button=page.locator('[data-wa-order]').first
                    if not button.count():errors.append(f'{label}: order CTA missing')
                    else:
                        href=button.get_attribute('href') or ''
                        msg=parse_qs(urlsplit(href).query).get('text',[''])[0]
                        if 'sipariş oluşturmak istiyorum' not in msg or '905332403888' not in href:
                            errors.append(f'{label}: model-specific WhatsApp fallback invalid: {msg[:100]}')
                    gallery=page.locator('.gal').first
                    if gallery.count():
                        n=gallery.locator('.arr.n')
                        counter=gallery.locator('.count')
                        if n.count() and counter.count():
                            before=counter.inner_text()
                            n.click()
                            after=counter.inner_text()
                            if before==after:errors.append(f'{label}: gallery next button did not change image')
                results.append(f'PASS {label}: no site request errors; {metrics["images"]} image nodes; document {metrics["scrollWidth"]}px / viewport {metrics["viewport"]}px; page load event {metrics["navigation"]}ms')
                if path=='/' and width in (390,1440):
                    Path('browser-screenshots').mkdir(exist_ok=True)
                    page.screenshot(path=f'browser-screenshots/home-{width}.png',full_page=True)
            except (Error,TimeoutError,Exception) as e:
                errors.append(f'{label}: browser test failed: {str(e)[:350]}')
            finally:
                context.close()
    finally:
        browser.close()

for line in results:print(line)
for e in errors:print('ERROR',e)
if errors:sys.exit(1)
print('PASS: all browser QA checks completed.')
