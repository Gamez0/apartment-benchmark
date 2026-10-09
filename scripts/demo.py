"""Generate explicitly synthetic fixtures. Never market as actual apartment data."""
import json,calendar
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
rates=[dict(date='2020-01-01',value=1.5),dict(date='2021-06-01',value=.75),dict(date='2022-06-01',value=2.5),dict(date='2023-01-01',value=3.5),dict(date='2025-01-01',value=3),dict(date='2026-01-01',value=2.5)]
Path(__file__).resolve().parents[1].joinpath('site/data.json').write_text(json.dumps(dict(demo=True,asOf='2026-09-30',source='가상 예시',transactions=rows,benchmark=bm,rates=rates),ensure_ascii=False),encoding='utf-8')
