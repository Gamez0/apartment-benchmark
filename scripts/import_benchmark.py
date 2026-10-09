"""Extract apartment index only; all periods use the same official rebased workbook."""
import argparse,csv,datetime
from pathlib import Path
import openpyxl
p=argparse.ArgumentParser();p.add_argument('workbook');a=p.parse_args()
f=open(a.workbook,'rb');w=openpyxl.load_workbook(f,data_only=True,read_only=True)
s=w['Sales Price Indices_Apt'];rows=list(s.values)
columns={'전국':1,'수도권':2,'서울':4,'인천':15,'경기':19}
assert rows[2][4]=='Seoul' and rows[2][19]=='Gyeonggi'
out=Path(__file__).resolve().parents[1]/'data/benchmark.csv'
with out.open('w',encoding='utf-8',newline='') as f:
 writer=csv.DictWriter(f,fieldnames=['region','month','value']);writer.writeheader()
 for row in rows[3:]:
  if not isinstance(row[0],datetime.datetime):continue
  for region,col in columns.items():
   value=row[col]
   if isinstance(value,(int,float)) and value>0:writer.writerow(dict(region=region,month=row[0].strftime('%Y-%m'),value=value))
print('Extracted official apartment benchmark')
