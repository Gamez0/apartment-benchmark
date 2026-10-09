"""Build the official market snapshot for the public service."""
import csv,json,calendar,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def read(name):
 with (root/'data'/name).open(encoding='utf-8-sig') as f:return list(csv.DictReader(f))
b=read('benchmark.csv');r=read('rates.csv')
for x in b:x['value']=float(x['value'])
for x in r:x['value']=float(x['value'])
month=min(max(x['month'] for x in b if x['region']==region) for region in {x['region'] for x in b})
y,m=map(int,month.split('-'));date=f'{month}-{calendar.monthrange(y,m)[1]}'
d=dict(asOf=date,demo=False,source='한국부동산원 아파트 실거래가격지수 · 한국은행 기준금리',transactions=[],benchmark=b,rates=r)
if (root/'data/transactions.csv').exists():
 subprocess.run([sys.executable,str(root/'scripts/build_data.py'),'--transactions',str(root/'data/transactions.csv'),'--benchmark',str(root/'data/benchmark.csv'),'--rates',str(root/'data/rates.csv'),'--as-of',date,'--source','정규화된 거래 CSV / 한국부동산원 / 한국은행'],check=True)
else:
 (root/'site/data.json').write_text(json.dumps(d,ensure_ascii=False),encoding='utf-8')
(root/'site/demo.json').unlink(missing_ok=True)
print(f'Official snapshot: {date}, {len(b)} index observations, {len(r)} rate changes')
