"""Build official market snapshot and a separately labelled demonstration."""
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
(root/'site/data.json').write_text(json.dumps(d,ensure_ascii=False),encoding='utf-8')
subprocess.run([sys.executable,str(root/'scripts/demo.py')],check=True)
print(f'Official snapshot: {date}, {len(b)} index observations, {len(r)} rate changes')
