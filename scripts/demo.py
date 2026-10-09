"""Generate explicitly synthetic fixtures. Never market as actual apartment data."""
import json,csv
from pathlib import Path
rows=[];bm=[]
for region in ['서울','경기']:
 for year in range(2020,2027):
  for month in range(1,13):
   if (year,month)>(2026,9):continue
   n=(year-2020)*12+month-1
   bm.append(dict(region=region,month=f'{year}-{month:02}',value=100*(1+(0.004 if region=='서울' else 0.002))**n))
 for k in range(4):
  for year in range(2020,2027):
   for month in range(1,13):
    if (year,month)>(2026,9):continue
    n=(year-2020)*12+month-1
    for day in [5,15,25]:
     if k==3 and month not in [2,8]:continue
     rows.append(dict(id=region+str(k),name=['예시 리버파크','예시 센트럴','예시 그린힐','예시 거래희소'][k],region=region,area=84.9,date=f'{year}-{month:02}-{day:02}',price=round((6+k)*((1+[.005,.004,.002,.003][k])**n)*(1+(day-15)/1000),3),floor=day,cancelled=False))
with (Path(__file__).resolve().parents[1]/'data/rates.csv').open(encoding='utf-8') as f:
 rates=[dict(date=r['date'],value=float(r['value'])) for r in csv.DictReader(f)]
Path(__file__).resolve().parents[1].joinpath('site/demo.json').write_text(json.dumps(dict(demo=True,asOf='2026-09-30',source='가격·BM 가상 예시 / 한국은행 기준금리',ratesSource='한국은행 기준금리 추이',ratesVerifiedThrough='2026-10-09',transactions=rows,benchmark=bm,rates=rates),ensure_ascii=False),encoding='utf-8')
