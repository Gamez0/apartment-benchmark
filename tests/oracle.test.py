"""Synthetic boundary fixtures only, never included in public data."""
import importlib.util
from datetime import date
from pathlib import Path
spec = importlib.util.spec_from_file_location('audit', Path('scripts/audit_build.py'))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
assert audit.shift(date(2024, 2, 29), -12) == date(2023, 2, 28)
assert audit.shift(date(2026, 7, 31), -3) == date(2026, 4, 30)
for count in range(4):
    rows = [{'date': f'{year}-07-0{day+1}', 'price': 10 if year == 2025 else 12} for year in (2025, 2026) for day in range(count)]
    result = audit.compare(rows, date(2026, 7, 31), 1)
    assert (result[6] is None) == (count < 3)
    if count == 3:
        assert abs(result[6]-20) < 1e-9 and result[2] == 3
rows = [{'date': f'{year}-02-01', 'price': 10 if year == 2025 else 15} for year in (2025, 2026) for _ in range(3)]
result = audit.compare(rows, date(2026, 7, 31), 1)
assert result[2] == result[5] == 6 and result[6] == 50
assert audit.window([{'date':'2026-04-30','price':999}, {'date':'2026-05-01','price':10}, {'date':'2026-07-31','price':20}, {'date':'2026-08-01','price':999}, {'date':'2026-06-01','price':999,'cancelled':True}], date(2026,7,31),3)[:2] == [15,2]
print('Independent oracle boundaries: 0/1/2/3 trades, 3/6 months, leap/month-end, cancellation and future exclusion passed')
