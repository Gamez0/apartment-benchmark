"""Independent Python oracle. Does not import production JS or its builder.

Checks every published unit against sanitized collector transactions, including
identity, history hash, month-clamped windows, medians, rates and BM excess.
This checks the normalized official snapshot, not unobserved source corrections.
"""
import calendar
import hashlib
import json
import math
from collections import defaultdict
from datetime import date
from pathlib import Path
from statistics import median


def shift(day, months):
    year, month = divmod(day.year * 12 + day.month - 1 + months, 12)
    return date(year, month + 1, min(day.day, calendar.monthrange(year, month + 1)[1]))


def window(rows, end, months):
    start = shift(end, -months).isoformat()
    values = [r['price'] for r in rows if start < r['date'] <= end.isoformat() and not r.get('cancelled')]
    return [median(values) if values else None, len(values), months, start, end.isoformat()]


def compare(rows, end, years):
    past = shift(end, -12 * years)
    for months in (3, 6):
        now, then = window(rows, end, months), window(rows, past, months)
        if min(now[1], then[1]) >= 3:
            ratio = now[0] / then[0]
            return [*now[:3], *then[:3], (ratio - 1) * 100, (ratio ** (1 / years) - 1) * 100, *then[3:], *now[3:]]
    return [*now[:3], *then[:3], None, None, *then[3:], *now[3:]]


def equal(actual, expected, where):
    if isinstance(expected, (float, int)) and not isinstance(expected, bool):
        assert isinstance(actual, (float, int)) and math.isclose(actual, expected, rel_tol=1e-11, abs_tol=1e-9), (where, actual, expected)
    else:
        assert actual == expected, (where, actual, expected)


def audit(root=Path('.')):
    site = root / 'site'
    manifest = json.loads((site / 'seoul/manifest.json').read_text())
    base = json.loads((site / 'data.json').read_text())
    bootstrap = (site / 'seoul' / manifest['bootstrapFile']).read_bytes()
    assert Path(manifest['bootstrapFile']).stem == 'bootstrap-' + hashlib.sha256(bootstrap).hexdigest()[:24]
    assert json.loads(bootstrap)['revision'] == base['revision'] == manifest['bootstrapRevision']
    end = date.fromisoformat(manifest['asOf'])
    bm = {p['month']: p['value'] for p in base['benchmark'] if p['region'] == '서울'}
    market = {str(y): (bm[end.strftime('%Y-%m')] / bm[shift(end, -12*y).strftime('%Y-%m')] - 1) * 100 for y in (1, 3, 5, 10)}
    output = {'asOf': manifest['asOf'], 'market': market, 'districts': {}, 'units': 0, 'trades': 0, 'comparisons': 0}
    for district in manifest['districts']:
        raw = json.loads((root / 'data/seoul-collected' / (district['code'] + '.json')).read_text())
        groups = defaultdict(list)
        for row in raw['transactions']:
            assert not row.get('cancelled') and row['date'] <= manifest['asOf'], 'Excluded/future transaction leaked'
            date.fromisoformat(row['date'])
            assert row['price'] > 0 and row['area'] > 0 and math.isfinite(row['price'])
            groups[row['id'] + '|' + str(row['area']).removesuffix('.0')].append(row)
        catalog_bytes = (site / 'seoul' / district['file']).read_bytes()
        assert Path(district['file']).stem == district['code'] + '-' + hashlib.sha256(catalog_bytes).hexdigest()[:24]
        catalog = json.loads(catalog_bytes)
        assert catalog['asOf'] == manifest['asOf'] and catalog['code'] == district['code']
        assert len(groups) == len(catalog['units']) == district['units']
        assert len(raw['transactions']) == district['trades']
        references = []
        for unit in catalog['units']:
            rows = groups.pop(unit['key'])
            assert all(r['name'] == unit['name'] and r['dong'] == unit['dong'] and r['area'] == unit['area'] for r in rows)
            assert unit['district'] == district['name'] and unit['latest'] == max(r['date'] for r in rows)
            payload = (site / 'seoul' / unit['file']).read_bytes()
            assert Path(unit['file']).stem == hashlib.sha256(payload).hexdigest()[:24]
            history = json.loads(payload)
            assert history['key'] == unit['key'] and history['asOf'] == manifest['asOf']
            expected_rows = sorted([{'date': r['date'], 'price': r['price'], 'floor': r.get('floor')} for r in rows], key=lambda r: r['date'])
            assert history['rows'] == expected_rows, unit['key']
            stats = {}
            for year in (1, 3, 5, 10):
                expected = compare(rows, end, year)
                assert len(unit['stats'][str(year)]) == 12
                for index, value in enumerate(expected):
                    equal(unit['stats'][str(year)][index], value, (unit['key'], year, index))
                stats[str(year)] = expected
                output['comparisons'] += 1
            references.append({**{k: unit[k] for k in ('key', 'name', 'area', 'dong', 'latest')}, 'stats': stats})
        assert not groups
        output['districts'][district['code']] = references
        output['units'] += district['units']
        output['trades'] += district['trades']
    assert output['trades'] == manifest['totalTrades']
    destination = root / 'audit-report'
    destination.mkdir(exist_ok=True)
    (destination / 'reference.json').write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')))
    print(json.dumps({k: v for k, v in output.items() if k != 'districts'}))


if __name__ == '__main__':
    audit()
