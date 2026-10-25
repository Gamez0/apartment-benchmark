"""Generate content revisions during every build; no manual cache token required."""
import hashlib
import re
from pathlib import Path

site = Path('site')
html = (site / 'index.html').read_text()
for name in ('app.js', 'engine.js', 'style.css', 'router.js'):
    revision = hashlib.sha256((site / name).read_bytes()).hexdigest()[:20]
    html, count = re.subn(re.escape(name) + r'\?v=[A-Za-z0-9_-]+', name + '?v=' + revision, html)
    assert count == 1, ('asset reference missing or duplicated', name, count)
(site / 'index.html').write_text(html)
revision = hashlib.sha256(html.encode()).hexdigest()[:20]
qa = site / 'mobile-check.html'
qa.write_text(re.sub(r'index\.html\?app=[A-Za-z0-9_-]+', 'index.html?app=' + revision, qa.read_text()))
print('Content-versioned JS/CSS and mobile QA document:', revision)

