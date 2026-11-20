#!/usr/bin/env python3
"""Restore V14 image release chunks and stage additive MOTOKAP site overlay."""
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import zipfile

root = Path.cwd().resolve()
expected = '769f5882c836f70c7bf81852121918eb482afbf67742143794ae97f31678fce0'
parts = sorted((root / 'release-artifacts').glob('v14-package.part*'))
assert len(parts) == 34, f'Expected 34 V14 archive chunks, found {len(parts)}'
zip_bytes = b''.join(path.read_bytes() for path in parts)
actual = hashlib.sha256(zip_bytes).hexdigest()
assert actual == expected, f'Archive SHA256 mismatch: {actual}'

site = root / 'MOTOKAP' / 'public'
protected = [
    'runtime.js',
    'sales.js',
    'modeller/premium-xl/index.html',
    'modeller/besinci-model/index.html',
]
old_hashes = {x: hashlib.sha256((site / x).read_bytes()).hexdigest() for x in protected}
assert (site / 'content.js').is_file(), 'Missing existing production content.js'

prefix = 'MOTOKAP_V14_TEST_DALINA_YUKLEME/MOTOKAP_V14_YAYIN_ENTEGRASYON_PAKETI/MOTOKAP/public/'
files_copied = 0
with zipfile.ZipFile(io.BytesIO(zip_bytes)) as archive:
    assert archive.testzip() is None, 'Corrupt V14 archive'
    for entry in archive.infolist():
        if entry.is_dir() or not entry.filename.startswith(prefix):
            continue
        relative = entry.filename[len(prefix):]
        segments = PurePosixPath(relative).parts
        assert segments and all(x not in ('..', '.') for x in segments), f'Unsafe path: {relative}'
        path = site.joinpath(*segments)
        path.parent.mkdir(parents=True, exist_ok=True)
        with archive.open(entry) as inp, path.open('wb') as out:
            shutil.copyfileobj(inp, out)
        files_copied += 1

assert files_copied >= 100, f'Expected at least 100 files, copied {files_copied}'
assert len(list((site / 'assets' / 'motokap-v14').rglob('*.*'))) >= 84, 'V14 images missing'

content_file = site / 'content.js'
content = content_file.read_text(encoding='utf-8')
pattern = r'("slug"\s*:\s*"xxl"[\s\S]*?"poles"\s*:\s*)null'
content, replacements = re.subn(pattern, r'\g<1>5', content, count=1)
assert replacements == 1, 'Expected double/ATV model pole data not found'
content_file.write_text(content, encoding='utf-8')

for configuration in [root / 'MOTOKAP' / 'vercel.json', site / 'vercel.json']:
    data = json.loads(configuration.read_text(encoding='utf-8'))
    redirects = [r for r in data.get('redirects', []) if r.get('source') not in ('/modeller/xxl', '/modeller/xxl/')]
    redirects.append({'source': '/modeller/xxl', 'destination': '/modeller/iki-motosiklet-atv', 'permanent': True})
    data['redirects'] = redirects
    configuration.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

for relative, expected_sha in old_hashes.items():
    actual_sha = hashlib.sha256((site / relative).read_bytes()).hexdigest()
    assert actual_sha == expected_sha, f'Protected file modified: {relative}'

for relative in [
    'index.html', 'modeller/index.html', 'modeller/orta-boy/index.html',
    'modeller/buyuk-boy/index.html', 'modeller/iki-motosiklet-atv/index.html',
    'site-v14.js', 'site-v14.css', 'site-measurement-v14.js',
    'sitemap.xml', 'robots.txt',
]:
    assert (site / relative).is_file(), f'Missing V14 file: {relative}'
print(f'V14 package SHA256 verified: {actual}')
print(f'Copied {files_copied} V14 files; assets preserved; premium and analytics protected.')
