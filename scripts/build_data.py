"""Compile normalized source CSVs into static data. Prices must be in KRW 100 million."""
import argparse,csv,json,datetime,math
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--transactions',required=True);p.add_argument('--benchmark',required=True);p.add_argument('--rates',required=True);p.add_argument('--as-of',required=True);p.add_argument('--source',required=True);a=p.parse_args();datetime.date.fromisoformat(a.as_of)
def read(path):
 with open(path,encoding='utf-8-sig',newline='') as f:return list(csv.DictReader(f))
t=read(a.transactions);b=read(a.benchmark);r=read(a.rates)
for x in t:
 for k in ['id','name','region']:assert x[k],f'Missing {k}'
 datetime.date.fromisoformat(x['date']);x['price']=float(x['price']);x['area']=float(x['area']);assert math.isfinite(x['price']) and x['price']>0 and math.isfinite(x['area']) and x['area']>0
 x['cancelled']=x.get('cancelled','') in ['true','1','Y']
for x in b:
 datetime.date.fromisoformat(x['month']+'-01');x['value']=float(x['value']);assert math.isfinite(x['value']) and x['value']>0
assert len({(x['region'],x['month']) for x in b})==len(b),'Duplicate benchmark month'
for x in r:
 datetime.date.fromisoformat(x['date']);x['value']=float(x['value']);assert math.isfinite(x['value'])
assert len({x['date'] for x in r})==len(r),'Duplicate rate date'
out=Path(__file__).resolve().parents[1]/'site/data.json';out.write_text(json.dumps(dict(asOf=a.as_of,source=a.source,demo=False,transactions=t,benchmark=b,rates=r),ensure_ascii=False),encoding='utf-8');print(f'Compiled {len(t)} transactions, {len(b)} index points, {len(r)} rate changes')
